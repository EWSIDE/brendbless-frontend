"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

import { type Product } from "@/data/products";
import { CART_COOKIE, getCookie, setCookie } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface BackendProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description?: string;
  images: string[];
  tags?: string;
  attributes?: Record<string, any>;
  category?: {
    name: string;
    slug: string;
  };
  stockQuantity?: number;
}

interface ProductsResponse {
  products: BackendProduct[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

function parseSizes(product: BackendProduct): string[] {
  // Try attributes.sizes first
  if (product.attributes?.sizes) {
    const s = product.attributes.sizes;
    if (Array.isArray(s)) return s.map(String);
    if (typeof s === "string") return s.split(",").map(v => v.trim()).filter(Boolean);
  }
  // Try tags as fallback (comma-separated sizes)
  if (product.tags) {
    try {
      const parsed = JSON.parse(product.tags);
      if (Array.isArray(parsed)) return parsed.map(String);
    } catch {
      return product.tags.split(",").map(v => v.trim()).filter(Boolean);
    }
  }
  return [];
}

export async function fetchProducts(): Promise<Product[]> {
  const res = await fetch(`${API_BASE}/api/products`);
  if (!res.ok) throw new Error("не удалось загрузить товары");
  const data = (await res.json()) as ProductsResponse;

  return data.products.map((p) => {
    let images: string[] = [];
    if (Array.isArray(p.images)) {
      images = p.images;
    } else if (typeof p.images === "string") {
      try {
        images = JSON.parse(p.images);
      } catch {
        images = [];
      }
    }
    return {
      id: p.id,
      name: p.name,
      price: p.price,
      oldPrice: p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : undefined,
      category: p.category?.name ?? "без категории",
      description: p.description ?? "",
      sizes: parseSizes(p),
      imageUrl: images[0] ?? undefined,
      available: (p.stockQuantity ?? 0) > 0,
    };
  });
}

type CartItem = {
  id: string;
  quantity: number;
  size?: string;
};

function readCart(): CartItem[] {
  const rawCart = getCookie(CART_COOKIE);
  if (!rawCart) return [];
  try {
    return JSON.parse(rawCart) as CartItem[];
  } catch {
    return [];
  }
}

function writeCart(items: CartItem[]) {
  setCookie(CART_COOKIE, JSON.stringify(items));
}

function addToCart(id: string, size?: string) {
  const cart = readCart();
  const strId = String(id);
  const existing = cart.find((item) => String(item.id) === strId && item.size === size);
  const updated = existing
    ? cart.map((item) =>
        String(item.id) === strId && item.size === size
          ? { ...item, quantity: item.quantity + 1 }
          : item,
      )
    : [...cart, { id: strId, quantity: 1, size }];
  writeCart(updated);
}

function getCartCount(): number {
  return readCart().reduce((sum, item) => sum + item.quantity, 0);
}

/* ─── Toast notification ──────────────────────────────────────── */
function CartToast({
  productName,
  count,
  onGoToCart,
  onClose,
}: {
  productName: string;
  count: number;
  onGoToCart: () => void;
  onClose: () => void;
}) {
  return (
    <div
      onClick={onGoToCart}
      style={{
        position: "fixed",
        bottom: "24px",
        right: "24px",
        background: "#fff",
        border: "1px solid #fdf2f8",
        borderRadius: "40px",
        padding: "12px 24px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
        zIndex: 9999,
        animation: "slideInUp 0.3s ease-out",
        cursor: "pointer",
        boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
      }}
    >
      <div
        style={{
          width: "28px",
          height: "28px",
          borderRadius: "50%",
          background: "#fce7f3",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
          <path d="M20 6L9 17l-5-5" />
        </svg>
      </div>
      <span style={{ fontSize: "14px", color: "#333", fontWeight: 400 }}>
        товар добавлен в корзину
      </span>
    </div>
  );
}

/* ─── Product Card ─────────────────────────────────────────────── */
function ProductCard({
  product,
  onAdded,
}: {
  product: Product;
  onAdded: (id: string, name: string) => void;
}) {
  const [selectedSize, setSelectedSize] = useState<string | null>(
    product.sizes.length > 0 ? product.sizes[0] : null
  );

  const handleAdd = () => {
    if (product.sizes.length > 0 && !selectedSize) return;
    addToCart(product.id, selectedSize ?? undefined);
    onAdded(product.id, product.name);
  };

  const hasDiscount =
    product.oldPrice !== undefined && product.oldPrice > product.price;
  const discountPct = hasDiscount
    ? Math.round((1 - product.price / product.oldPrice!) * 100)
    : 0;

  const canAdd = product.sizes.length === 0 || selectedSize !== null;

  return (
    <article className="card">
      <Link href={`/product?id=${product.id}`} className="card-link">
        <div className="product-image-placeholder">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt={product.name} loading="eager" decoding="async" fetchPriority="high" />
          ) : (
            <>
              <span className="placeholder-icon">📷</span>
              <span className="placeholder-text">фото товара</span>
            </>
          )}
        </div>

        {hasDiscount && (
          <span className="discount-badge">-{discountPct}%</span>
        )}

        <div className="card-content">
          <h3 className="product-name">{product.name}</h3>
        </div>
      </Link>

      <div className="card-content" style={{ paddingTop: 0 }}>

        <div className="card-price-row">
          <div className="price-block">
            <span className="price-current">
              {product.price.toLocaleString("ru-RU")} ₽
            </span>
            {hasDiscount && (
              <span className="price-old">
                {product.oldPrice!.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>

          <div className="sizes-and-cart">
            {product.sizes.length > 0 && (
              <div className="sizes-row">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                    className="size-chip-btn"
                    data-selected={selectedSize === size}
                  >
                    {size}
                  </button>
                ))}
              </div>
            )}

            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="add-to-cart-icon-btn"
              aria-label="добавить в корзину"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M7 9V7.75A5 5 0 0 1 12 3a5 5 0 0 1 5 4.75V9" />
                <path d="M5 9h14l-1 10a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 9z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

/* ─── Skeleton ─────────────────────────────────────────────────── */
function SkeletonBlock({
  aspect = "portrait",
}: {
  aspect?: "portrait" | "hero" | "wide";
}) {
  const sizeClass =
    aspect === "hero"
      ? "min-h-[340px] lg:min-h-[500px]"
      : aspect === "wide"
        ? "aspect-[16/10]"
        : "aspect-[4/5]";

  return (
    <div
      className={`relative overflow-hidden rounded-[30px] bg-gradient-to-br from-[#fff8fc] via-[#ffeef5] to-[#ffdbe8] ${sizeClass}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,#ffffffd9,transparent_30%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,#ffffff99,transparent_28%)]" />
      <div className="absolute -left-10 top-8 h-36 w-36 rounded-full bg-white/70 blur-3xl" />
      <div className="absolute right-8 top-10 h-28 w-28 rounded-full bg-[#ffc7da]/60 blur-3xl" />
      <div className="absolute bottom-10 left-10 h-24 w-24 rounded-full bg-[#ffd9e8]/55 blur-2xl" />
    </div>
  );
}

function ProductSkeletonCard() {
  return (
    <article className="group">
      <SkeletonBlock />
      <div className="pt-4">
        <div className="h-4 w-32 rounded-full bg-[#f7d7e5]" />
        <div className="mt-3 h-4 w-20 rounded-full bg-[#fbe8f0]" />
      </div>
    </article>
  );
}

/* ─── Main Storefront ──────────────────────────────────────────── */
export function Storefront() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cartCount, setCartCount] = useState(0);
  const [toast, setToast] = useState<{ id: string; name: string; count: number } | null>(null);

  useEffect(() => {
    if (!getCookie(CART_COOKIE)) {
      setCookie(CART_COOKIE, JSON.stringify([]));
    }
    setCartCount(getCartCount());

    fetchProducts()
      .then(setProducts)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  // Auto-dismiss toast after 3 seconds
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3000);
    return () => clearTimeout(timer);
  }, [toast]);

  const handleAdded = (id: string, name: string) => {
    setCartCount(getCartCount());
    setToast((prev) =>
      prev && prev.id === id
        ? { ...prev, count: prev.count + 1 }
        : { id, name, count: 1 }
    );
  };

  const goToCart = () => {
    setToast(null);
    window.location.href = "/cart";
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-white text-[#2c2430]">
      <div style={{ maxWidth: "1380px", margin: "0 auto", padding: "24px 24px 0" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", letterSpacing: "-0.5px", margin: 0, paddingLeft: 0 }}>
            каталог
          </h1>
          <Link
            href="/cart"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              color: "#f1a7c8",
              fontSize: "15px",
              fontWeight: 500,
              position: "relative",
            }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 9V7.75A5 5 0 0 1 12 3a5 5 0 0 1 5 4.75V9" />
              <path d="M5 9h14l-1 10a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 9z" />
            </svg>
            <span>корзина</span>
            {cartCount > 0 && (
              <span
                style={{
                  position: "absolute",
                  top: "-6px",
                  right: "-10px",
                  background: "#f1a7c8",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 600,
                  width: "18px",
                  height: "18px",
                  borderRadius: "50%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                {cartCount}
              </span>
            )}
          </Link>
        </div>
      </div>

      <div style={{ maxWidth: "1380px", margin: "24px auto 0", padding: "0 24px" }}>
        {loading ? (
          <section className="catalog">
            <div className="product-grid">
              {Array.from({ length: 8 }).map((_, index) => (
                <ProductSkeletonCard key={index} />
              ))}
            </div>
          </section>
        ) : error || products.length === 0 ? (
          <section className="catalog">
            <p style={{ fontSize: "15px", color: "#8c7584", textAlign: "center", padding: "40px 0" }}>
              {error ? "ошибка загрузки" : "товары пока не найдены. попробуйте обновить страницу позже."}
            </p>
          </section>
        ) : (
          <section className="catalog">
            <div className="product-grid">
              {products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAdded={handleAdded}
                />
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Toast notification */}
      {toast && (
        <CartToast
          productName={toast.name}
          count={toast.count}
          onGoToCart={goToCart}
          onClose={() => setToast(null)}
        />
      )}

      {/* Toast animation */}
      <style jsx global>{`
        @keyframes slideInUp {
          from {
            transform: translateY(20px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </main>
  );
}
