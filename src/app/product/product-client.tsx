"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CART_COOKIE, getCookie, setCookie } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

interface ProductData {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number | null;
  description?: string;
  images: string[];
  attributes?: Record<string, any>;
  tags?: string;
  stockQuantity?: number;
}

function parseSizes(product: ProductData): string[] {
  if (product.attributes?.sizes) {
    const s = product.attributes.sizes;
    if (Array.isArray(s)) return s.map(String);
    if (typeof s === "string") return s.split(",").map(v => v.trim()).filter(Boolean);
  }
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

type CartItem = { id: string; quantity: number; size?: string };

function readCart(): CartItem[] {
  const raw = getCookie(CART_COOKIE);
  if (!raw) return [];
  try { return JSON.parse(raw) as CartItem[]; } catch { return []; }
}

function addToCart(id: string, size?: string) {
  const cart = readCart();
  const existing = cart.find(i => i.id === id && i.size === size);
  if (existing) {
    existing.quantity += 1;
  } else {
    cart.push({ id, quantity: 1, size });
  }
  setCookie(CART_COOKIE, JSON.stringify(cart));
}

export default function ProductClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const productId = searchParams.get("id");

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [added, setAdded] = useState(false);
  const [descOpen, setDescOpen] = useState(false);
  const [deliveryOpen, setDeliveryOpen] = useState(false);

  useEffect(() => {
    if (!productId) { setLoading(false); return; }
    fetch(`${API_BASE}/api/products/${productId}`)
      .then(r => r.json())
      .then(json => {
        if (json.success && json.data) {
          const p = json.data;
          let images: string[] = [];
          if (Array.isArray(p.images)) images = p.images;
          else if (typeof p.images === "string") {
            try { images = JSON.parse(p.images); } catch { images = []; }
          }
          setProduct({ ...p, images });
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [productId]);

  if (loading) {
    return (
      <div className="pdp-shell">
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="pdp-shell" style={{ textAlign: "center", padding: "80px 24px" }}>
        <p style={{ color: "#8e8e8e", fontSize: "16px" }}>товар не найден</p>
        <button className="pdp-back" onClick={() => router.push("/")}>← в каталог</button>
      </div>
    );
  }

  const sizes = parseSizes(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;
  const canAdd = sizes.length === 0 || selectedSize !== null;

  const handleAdd = () => {
    if (!canAdd) return;
    addToCart(product.id, selectedSize ?? undefined);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="pdp-shell">
      <button className="pdp-back" onClick={() => router.push("/")}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        назад
      </button>

      <div className="pdp-grid">
        {/* Левая колонка — фото */}
        <div className="pdp-images">
          <div className="pdp-main-image">
            {product.images.length > 0 ? (
              <img src={product.images[selectedImage]} alt={product.name} />
            ) : (
              <div className="pdp-no-image">
                <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="pdp-thumbs">
              {product.images.map((img, idx) => (
                <button
                  key={idx}
                  className={`pdp-thumb ${idx === selectedImage ? "active" : ""}`}
                  onClick={() => setSelectedImage(idx)}
                >
                  <img src={img} alt={`${product.name} ${idx + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Правая колонка — инфо */}
        <div className="pdp-info">
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-price-row">
            <span className="pdp-price">{product.price.toLocaleString("ru-RU")} ₽</span>
            {hasDiscount && (
              <span className="pdp-old-price">{product.compareAtPrice!.toLocaleString("ru-RU")} ₽</span>
            )}
          </div>

          {/* Размеры */}
          {sizes.length > 0 && (
            <div className="pdp-sizes">
              <p className="pdp-sizes-label">размер</p>
              <div className="pdp-sizes-row">
                {sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    className={`pdp-size-btn ${selectedSize === size ? "active" : ""}`}
                    onClick={() => setSelectedSize(selectedSize === size ? null : size)}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка добавить */}
          <button
            type="button"
            className="pdp-add-btn"
            onClick={handleAdd}
            disabled={!canAdd}
          >
            {added ? "добавлено ✓" : "добавить в корзину"}
          </button>

          {/* Аккордеон: описание */}
          {product.description && (
            <div className="pdp-accordion">
              <button
                type="button"
                className="pdp-accordion-trigger"
                onClick={() => setDescOpen(!descOpen)}
              >
                <span>описание</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: descOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                  <path d="M6 9l6 6 6-6"/>
                </svg>
              </button>
              {descOpen && (
                <div className="pdp-accordion-content">
                  <p className="pdp-description">{product.description}</p>
                </div>
              )}
            </div>
          )}

          {/* Аккордеон: доставка */}
          <div className="pdp-accordion">
            <button
              type="button"
              className="pdp-accordion-trigger"
              onClick={() => setDeliveryOpen(!deliveryOpen)}
            >
              <span>доставка</span>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: deliveryOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s" }}>
                <path d="M6 9l6 6 6-6"/>
              </svg>
            </button>
            {deliveryOpen && (
              <div className="pdp-accordion-content">
                <p className="pdp-description">
                  доставка осуществляется сервисом доставки сдэк. отправка заказов производится в течение трёх дней с момента заказа (сроки отправки могут быть изменены, о чём сообщается в официальных социальных сетях продавца или на сайте).
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
