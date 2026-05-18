"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { type Product } from "@/data/products";
import { CART_COOKIE, getCookie, setCookie } from "@/lib/cookies";
import { useSettings } from "@/lib/settings-context";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface BackendProduct {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string;
  images: string | string[];
  category?: {
    name: string;
    slug: string;
  };
  stockQuantity?: number;
}

function parseImages(raw: string | string[]): string[] {
  if (Array.isArray(raw)) return raw;
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
      return [raw];
    } catch {
      return raw ? [raw] : [];
    }
  }
  return [];
}

async function fetchProductById(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    const p = json.data as BackendProduct;

    const images = parseImages(p.images);

    return {
      id: String(p.id),
      name: p.name,
      price: p.price,
      oldPrice: p.compareAtPrice && p.compareAtPrice > p.price ? p.compareAtPrice : undefined,
      category: p.category?.name ?? "без категории",
      description: p.description ?? "",
      sizes: [],
      imageUrl: images[0] ?? undefined,
      available: (p.stockQuantity ?? 0) > 0,
    };
  } catch {
    return null;
  }
}

type CartItem = {
  id: string;
  quantity: number;
  size?: string;
};

type EnrichedItem = Product & { quantity: number; size?: string };

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

export function CartView() {
  const router = useRouter();
  const settings = useSettings();
  const [items, setItems] = useState<CartItem[]>([]);
  const [enriched, setEnriched] = useState<EnrichedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removedNames, setRemovedNames] = useState<string[]>([]);
  const [productsLoaded, setProductsLoaded] = useState(false);

  useEffect(() => {
    const stored = readCart();
    // Deduplicate: merge items with same id+size
    const deduped: CartItem[] = [];
    for (const item of stored) {
      const existing = deduped.find((d) => String(d.id) === String(item.id) && d.size === item.size);
      if (existing) {
        existing.quantity += item.quantity;
      } else {
        deduped.push({ ...item, id: String(item.id) });
      }
    }
    if (deduped.length !== stored.length) {
      writeCart(deduped);
    }
    setItems(deduped);
  }, []);

  // Load products only once on mount (when items first become available)
  useEffect(() => {
    if (productsLoaded || items.length === 0) {
      if (items.length === 0) setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);
    setRemovedNames([]);

    // Deduplicate product IDs to avoid fetching same product twice
    const uniqueIds = [...new Set(items.map((i) => String(i.id)))];

    Promise.allSettled(uniqueIds.map((id) => fetchProductById(id)))
      .then((results) => {
        if (cancelled) return;

        const foundProducts: Product[] = [];
        const missingIds: string[] = [];

        results.forEach((result, idx) => {
          if (result.status === "fulfilled" && result.value) {
            foundProducts.push(result.value);
          } else {
            missingIds.push(uniqueIds[idx]);
          }
        });

        if (missingIds.length > 0) {
          const cleaned = items.filter((i) => !missingIds.includes(String(i.id)));
          setItems(cleaned);
          writeCart(cleaned);
          setRemovedNames(missingIds.map((id) => `товар #${id}`));
        }

        const mapped: EnrichedItem[] = items
          .filter((cartItem) => !missingIds.includes(String(cartItem.id)))
          .flatMap((cartItem) => {
            const p = foundProducts.find((fp) => String(fp.id) === String(cartItem.id));
            if (!p) return [];
            return [{ ...p, quantity: cartItem.quantity, size: cartItem.size }];
          });

        setEnriched(mapped);
        setProductsLoaded(true);
      })
      .catch((err: Error) => {
        if (!cancelled) setError(err.message);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [items, productsLoaded]);

  // Update enriched locally when items change (after initial load)
  useEffect(() => {
    if (!productsLoaded) return;
    setEnriched((prev) =>
      prev
        .map((e) => {
          const cartItem = items.find((i) => String(i.id) === String(e.id) && i.size === e.size);
          if (!cartItem) return null;
          return { ...e, quantity: cartItem.quantity };
        })
        .filter(Boolean) as EnrichedItem[]
    );
  }, [items, productsLoaded]);

  const total = useMemo(
    () => enriched.reduce((sum, i) => sum + i.price * i.quantity, 0),
    [enriched],
  );

  const removeItem = (id: string, size?: string) => {
    const updated = items.filter((i) => !(i.id === id && i.size === size));
    setItems(updated);
    writeCart(updated);
  };

  const updateQuantity = (id: string, size: string | undefined, delta: number) => {
    const updated = items.map((i) => {
      if (!(i.id === id && i.size === size)) return i;
      const newQty = Math.max(1, i.quantity + delta);
      return { ...i, quantity: newQty };
    });
    setItems(updated);
    writeCart(updated);
  };

  if (items.length === 0 && !loading) {
    return (
      <section style={{ padding: "32px 0", textAlign: "center" }}>
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "center" }}>
          <svg width="120" height="120" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6 }}>
            <circle cx="9" cy="21" r="1"/>
            <circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", marginBottom: "8px", letterSpacing: "-0.5px" }}>корзина</h1>
        <p style={{ color: "#8e8e8e", fontSize: "18px", marginBottom: "8px" }}>в корзине пока пусто</p>
        <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "24px" }}>загляните в каталог — собрали там товары, которые могут вам понравиться</p>
        <Link href="/" className="email-btn">перейти в каталог</Link>
      </section>
    );
  }

  if (loading) {
    return (
      <section className="stack">
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", letterSpacing: "-0.5px" }}>корзина</h1>
        <div style={{ display: "flex", justifyContent: "center", padding: "20px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </section>
    );
  }

  if (error || enriched.length === 0) {
    return (
      <section className="stack">
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", letterSpacing: "-0.5px" }}>корзина</h1>
        <p style={{ color: "#8e8e8e", fontSize: "16px" }}>товары пока не найдены</p>
        <Link href="/" className="email-btn" style={{ background: "#f1a7c8", color: "#fff", borderRadius: "40px", padding: "20px 40px", display: "inline-block" }}>вернуться в каталог</Link>
      </section>
    );
  }

  return (
    <section className="stack" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Заголовок */}
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <button
          type="button"
          onClick={() => router.push("/")}
          style={{
            background: "white",
            border: "none",
            cursor: "pointer",
            padding: "8px",
            marginLeft: "-8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            borderRadius: "8px",
            boxShadow: "none",
          }}
          aria-label="назад"
        >
          <svg width="24" height="24" viewBox="0 0 24 24" stroke="#f1a7c8" strokeWidth="2" fill="none">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
        </button>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", marginBottom: "4px", letterSpacing: "-0.5px" }}>корзина</h1>
          <p style={{ color: "#8e8e8e", fontSize: "14px", margin: 0 }}>{enriched.length} {enriched.length === 1 ? "товар" : enriched.length < 5 ? "товара" : "товаров"}</p>
        </div>
      </div>

      {removedNames.length > 0 && (
        <div className="card" style={{ background: "#fff3cd", borderColor: "#ffc107", color: "#856404", padding: "24px", borderRadius: "24px" }}>
          <p><strong>следующие товары больше не доступны и были удалены из корзины:</strong></p>
          <ul style={{ marginTop: "12px" }}>
            {removedNames.map((name, idx) => (
              <li key={idx} style={{ marginBottom: "4px" }}>{name}</li>
            ))}
          </ul>
        </div>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "24px", alignItems: "start" }} className="cart-desktop-grid">
        {/* Левая колонка — товары */}
        <div className="stack">
        {enriched.map((item, idx) => (
          <article
            key={`${item.id}-${idx}`}
            style={{
              background: "#fff",
              border: "1px solid #fdf2f8",
              borderRadius: "20px",
              padding: "16px",
              position: "relative",
            }}
          >
            {/* Крестик удалить — в правом верхнем углу */}
            <button
              type="button"
              onClick={() => removeItem(item.id, item.size)}
              aria-label="удалить товар"
              style={{
                position: "absolute",
                top: "12px",
                right: "12px",
                width: "28px",
                height: "28px",
                borderRadius: "50%",
                border: "1px solid #fce7f3",
                background: "#fff5f8",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#f1a7c8",
                flexShrink: 0,
                padding: 0,
              }}
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <line x1="1" y1="1" x2="11" y2="11"/>
                <line x1="11" y1="1" x2="1" y2="11"/>
              </svg>
            </button>

            <div style={{ display: "flex", gap: "14px", alignItems: "flex-start", paddingRight: "36px" }}>
              {/* Фото */}
              <div className="product-image-placeholder small" style={{ flexShrink: 0 }}>
                {item.imageUrl ? (
                  <img src={item.imageUrl} alt={item.name} />
                ) : (
                  <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                )}
              </div>

              {/* Инфо */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <h3 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 600, color: "#333", lineHeight: 1.3 }}>
                  {item.name}
                </h3>

                {/* Размер */}
                {item.size && (
                  <span style={{
                    display: "inline-block",
                    fontSize: "12px",
                    color: "#f1a7c8",
                    background: "#fff5f8",
                    border: "1px solid #fce7f3",
                    borderRadius: "20px",
                    padding: "2px 10px",
                    marginBottom: "10px",
                    fontWeight: 500,
                  }}>
                    размер: {item.size}
                  </span>
                )}

                {/* Нижняя строка: количество + цена */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "12px", marginTop: item.size ? "0" : "8px" }}>
                  {/* Счётчик количества */}
                  <div style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "0",
                    border: "1px solid #fce7f3",
                    borderRadius: "40px",
                    overflow: "hidden",
                    background: "#fff",
                  }}>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.size, -1)}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        color: "#f1a7c8",
                        fontWeight: 400,
                        lineHeight: 1,
                        padding: 0,
                      }}
                      aria-label="уменьшить количество"
                    >
                      −
                    </button>
                    <span style={{
                      fontSize: "15px",
                      fontWeight: 600,
                      minWidth: "28px",
                      textAlign: "center",
                      color: "#333",
                      userSelect: "none",
                    }}>
                      {item.quantity}
                    </span>
                    <button
                      type="button"
                      onClick={() => updateQuantity(item.id, item.size, 1)}
                      style={{
                        width: "36px",
                        height: "36px",
                        border: "none",
                        background: "transparent",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: "18px",
                        color: "#f1a7c8",
                        fontWeight: 400,
                        lineHeight: 1,
                        padding: 0,
                      }}
                      aria-label="увеличить количество"
                    >
                      +
                    </button>
                  </div>

                  {/* Цена */}
                  <div style={{ textAlign: "right" }}>
                    <p style={{ margin: 0, fontWeight: 700, color: "#333", fontSize: "17px" }}>
                      {(item.price * item.quantity).toLocaleString("ru-RU")} ₽
                    </p>
                    {item.quantity > 1 && (
                      <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#8e8e8e" }}>
                        {item.price.toLocaleString("ru-RU")} ₽ × {item.quantity}
                      </p>
                    )}
                    {item.oldPrice && item.oldPrice > item.price && (
                      <p className="price-old" style={{ margin: "2px 0 0 0", fontSize: "13px" }}>
                        {item.oldPrice.toLocaleString("ru-RU")} ₽
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </article>
        ))}

        </div>

        {/* Правая колонка — итог */}
        <div style={{
          background: "linear-gradient(180deg, #fff5f8 0%, #fce7f3 100%)",
          borderRadius: "20px",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          position: "sticky",
          top: "24px",
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <p style={{ margin: 0, fontSize: "14px", color: "#8e8e8e" }}>товары</p>
            <span style={{ fontSize: "15px", color: "#333", fontWeight: 500 }}>{total.toLocaleString("ru-RU")} ₽</span>
          </div>
          {(() => {
            const shippingCost = settings?.shippingCost ?? 50;
            const freeThreshold = settings?.freeShippingThreshold ?? 5000;
            const isFree = total >= freeThreshold || shippingCost === 0;
            return (
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#8e8e8e" }}>доставка</p>
                {isFree ? (
                  <span style={{ fontSize: "14px", color: "#166534", fontWeight: 500 }}>бесплатно</span>
                ) : (
                  <span style={{ fontSize: "14px", color: "#333", fontWeight: 500 }}>{shippingCost.toLocaleString("ru-RU")} ₽</span>
                )}
              </div>
            );
          })()}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid rgba(241,167,200,0.2)" }}>
            <p style={{ margin: 0, fontSize: "15px", color: "#8e8e8e" }}>итого</p>
            <strong style={{ fontSize: "22px", color: "#333", fontWeight: 700 }}>
              {(() => {
                const shippingCost = settings?.shippingCost ?? 50;
                const freeThreshold = settings?.freeShippingThreshold ?? 5000;
                const isFree = total >= freeThreshold || shippingCost === 0;
                const finalTotal = total + (isFree ? 0 : shippingCost);
                return finalTotal.toLocaleString("ru-RU");
              })()} ₽
            </strong>
          </div>
          <Link
            href="/checkout"
            style={{
              background: "#f1a7c8",
              color: "#fff",
              borderRadius: "40px",
              padding: "16px 32px",
              fontWeight: 500,
              fontSize: "16px",
              textDecoration: "none",
              textAlign: "center",
              display: "block",
            }}
          >
            оформить заказ
          </Link>
        </div>
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .cart-desktop-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </section>
  );
}
