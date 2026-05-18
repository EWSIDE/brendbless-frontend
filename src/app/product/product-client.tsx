"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CART_COOKIE, getCookie, setCookie } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type ProductData = {
  id: string;
  name: string;
  price: number;
  compareAtPrice?: number;
  description?: string;
  images: string[];
  tags?: string;
  attributes?: Record<string, any>;
  category?: { name: string; slug: string };
  stockQuantity?: number;
};

type CartItem = { id: string; quantity: number; size?: string };

function readCart(): CartItem[] {
  const raw = getCookie(CART_COOKIE);
  if (!raw) return [];
  try { return JSON.parse(raw) as CartItem[]; } catch { return []; }
}

function writeCart(items: CartItem[]) {
  setCookie(CART_COOKIE, JSON.stringify(items));
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

function parseImages(product: ProductData): string[] {
  if (Array.isArray(product.images)) return product.images;
  if (typeof product.images === "string") {
    try { return JSON.parse(product.images); } catch { return []; }
  }
  return [];
}

function Accordion({ title, children, defaultOpen = false }: { title: string; children: React.ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="product-accordion">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="product-accordion__btn"
      >
        <span>{title}</span>
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div style={{ padding: "0 0 18px" }}>
          <p style={{ margin: 0, fontSize: "14px", lineHeight: 1.8, color: "#333" }}>{children}</p>
        </div>
      )}
    </div>
  );
}

export default function ProductClient() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const id = searchParams.get("id");

  const [product, setProduct] = useState<ProductData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedImage, setSelectedImage] = useState(0);
  const [added, setAdded] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); setError("товар не указан"); return; }
    fetch(`${API_BASE}/api/products/${id}`)
      .then(r => r.json())
      .then(data => {
        if (data.success && data.data) {
          setProduct(data.data);
          const sizes = parseSizes(data.data);
          if (sizes.length > 0) setSelectedSize(sizes[0]);
        } else {
          setError("товар не найден");
        }
      })
      .catch(() => setError("ошибка загрузки"))
      .finally(() => setLoading(false));
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    const sizes = parseSizes(product);
    if (sizes.length > 0 && !selectedSize) return;

    const cart = readCart();
    const strId = String(product.id);
    const existing = cart.find(item => String(item.id) === strId && item.size === (selectedSize ?? undefined));
    const updated = existing
      ? cart.map(item => String(item.id) === strId && item.size === (selectedSize ?? undefined) ? { ...item, quantity: item.quantity + 1 } : item)
      : [...cart, { id: strId, quantity: 1, size: selectedSize ?? undefined }];
    writeCart(updated);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
    window.dispatchEvent(new Event("storage"));
  };

  if (loading) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div style={{ maxWidth: 1200, margin: "0 auto", padding: "80px 24px", textAlign: "center" }}>
        <p style={{ color: "#333", fontSize: "16px", marginBottom: "24px" }}>{error || "товар не найден"}</p>
        <Link href="/" style={{ background: "#1a1a1a", color: "#fff", padding: "14px 32px", borderRadius: "40px", textDecoration: "none", fontWeight: 500 }}>в каталог</Link>
      </div>
    );
  }

  const images = parseImages(product);
  const sizes = parseSizes(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const goToPrev = () => setSelectedImage(i => i > 0 ? i - 1 : images.length - 1);
  const goToNext = () => setSelectedImage(i => i < images.length - 1 ? i + 1 : 0);

  return (
    <div className="product-page">
      {/* Кнопка назад */}
      <button
        type="button"
        onClick={() => router.back()}
        className="product-page__back"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Основная сетка */}
      <div className="product-page__grid">
        {/* Галерея */}
        <div className="product-page__gallery">
          <div className="product-page__main-image">
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                style={{ width: "100%", height: "100%", objectFit: "cover" }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "#fafafa" }}>
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#ccc" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            )}

            {/* Стрелки навигации */}
            {images.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={goToPrev}
                  aria-label="предыдущее фото"
                  className="product-page__nav-btn product-page__nav-btn--left"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="следующее фото"
                  className="product-page__nav-btn product-page__nav-btn--right"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Индикаторы (точки) */}
          {images.length > 1 && (
            <div className="product-page__dots">
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  aria-label={`фото ${i + 1}`}
                  className={`product-page__dot ${i === selectedImage ? "product-page__dot--active" : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Информация о товаре */}
        <div className="product-page__info">
          <h1 className="product-page__title">
            {product.name}
          </h1>

          <div className="product-page__price-row">
            <span className="product-page__price">
              {product.price.toLocaleString("ru-RU")} ₽
            </span>
            {hasDiscount && (
              <span className="product-page__old-price">
                {product.compareAtPrice!.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>

          {/* Размеры */}
          {sizes.length > 0 && (
            <div className="product-page__sizes">
              <p className="product-page__sizes-label">размер</p>
              <div className="product-page__sizes-list">
                {sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`product-page__size-btn ${selectedSize === size ? "product-page__size-btn--active" : ""}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка добавить в корзину */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={sizes.length > 0 && !selectedSize}
            className={`product-page__add-btn ${added ? "product-page__add-btn--added" : ""}`}
          >
            {added ? "✓ добавлено" : "добавить в корзину"}
          </button>

          {/* Описание */}
          {product.description && (
            <Accordion title="описание" defaultOpen>
              {product.description}
            </Accordion>
          )}

          <Accordion title="доставка">
            доставка осуществляется через сдэк по всей России. срок доставки зависит от вашего региона — обычно 2-7 рабочих дней. отправка изделий по предзаказу — до 3-х недель.
          </Accordion>

          <Accordion title="оплата">
            оплата банковской картой (visa, mastercard, мир) или через систему быстрых платежей (сбп). оплата производится через защищённый шлюз юkassa.
          </Accordion>

          <Accordion title="таблица размеров">
            s — 42-44<br/>m — 44-46<br/>l — 46-48<br/>xl — 48-50
          </Accordion>

          <Accordion title="уход за одеждой">
            рекомендуется ручная стирка при температуре не выше 30°. не отбеливать. сушить в расправленном виде. гладить при низкой температуре.
          </Accordion>
        </div>
      </div>

      <style jsx>{`
        .product-page {
          max-width: 1200px;
          margin: 0 auto;
          padding: 32px 24px 80px;
        }

        .product-page__back {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: none;
          border: none;
          cursor: pointer;
          padding: 10px 0;
          margin-bottom: 24px;
          color: #1a1a1a;
          font-size: 15px;
          font-family: inherit;
          font-weight: 500;
        }

        .product-page__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 48px;
          align-items: start;
        }

        .product-page__gallery {
          position: relative;
        }

        .product-page__main-image {
          width: 100%;
          aspect-ratio: 3/4;
          border-radius: 16px;
          overflow: hidden;
          background: #fafafa;
          position: relative;
        }

        .product-page__nav-btn {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          width: 40px;
          height: 40px;
          border-radius: 50%;
          background: rgba(255,255,255,0.92);
          border: none;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(0,0,0,0.08);
          padding: 0;
          transition: transform 0.15s, box-shadow 0.15s;
        }
        .product-page__nav-btn:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.12);
        }
        .product-page__nav-btn--left { left: 12px; }
        .product-page__nav-btn--right { right: 12px; }

        .product-page__dots {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 16px;
        }

        .product-page__dot {
          width: 8px;
          height: 8px;
          border-radius: 4px;
          background: #ddd;
          border: none;
          cursor: pointer;
          padding: 0;
          transition: all 0.2s ease;
        }
        .product-page__dot--active {
          width: 24px;
          background: #1a1a1a;
        }

        .product-page__info {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }

        .product-page__title {
          font-size: 26px;
          font-weight: 600;
          color: #1a1a1a;
          margin: 0;
          letter-spacing: -0.3px;
          line-height: 1.2;
        }

        .product-page__price-row {
          display: flex;
          align-items: baseline;
          gap: 12px;
        }

        .product-page__price {
          font-size: 22px;
          font-weight: 600;
          color: #1a1a1a;
        }

        .product-page__old-price {
          font-size: 16px;
          color: #999;
          text-decoration: line-through;
        }

        .product-page__sizes {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }

        .product-page__sizes-label {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
          color: #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .product-page__sizes-list {
          display: flex;
          gap: 10px;
          flex-wrap: wrap;
        }

        .product-page__size-btn {
          width: 46px;
          height: 46px;
          border-radius: 50%;
          border: 2px solid #e0e0e0;
          background: #fff;
          color: #1a1a1a;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 0;
          font-family: inherit;
          transition: all 0.2s ease;
        }
        .product-page__size-btn:hover {
          border-color: #1a1a1a;
        }
        .product-page__size-btn--active {
          border-color: #1a1a1a;
          background: #1a1a1a;
          color: #fff;
        }

        .product-page__add-btn {
          width: 100%;
          padding: 18px 32px;
          border-radius: 40px;
          border: none;
          background: #1a1a1a;
          color: #fff;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          font-family: inherit;
          transition: all 0.2s ease;
          text-transform: lowercase;
          letter-spacing: 0.3px;
        }
        .product-page__add-btn:hover {
          background: #333;
        }
        .product-page__add-btn:disabled {
          opacity: 0.4;
          cursor: not-allowed;
        }
        .product-page__add-btn--added {
          background: #1a1a1a;
        }

        .product-accordion {
          border-top: 1px solid #e8e8e8;
        }

        .product-accordion__btn {
          width: 100%;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 18px 0;
          background: none;
          border: none;
          cursor: pointer;
          font-size: 15px;
          font-weight: 500;
          color: #1a1a1a;
          font-family: inherit;
        }
        .product-accordion__btn:hover {
          color: #555;
        }

        @media (max-width: 768px) {
          .product-page {
            padding: 16px 16px 60px;
          }

          .product-page__back {
            margin-bottom: 16px;
          }

          .product-page__grid {
            grid-template-columns: 1fr;
            gap: 24px;
          }

          .product-page__main-image {
            border-radius: 12px;
            aspect-ratio: 3/4;
          }

          .product-page__title {
            font-size: 22px;
          }

          .product-page__price {
            font-size: 20px;
          }

          .product-page__add-btn {
            padding: 16px 24px;
            font-size: 14px;
            position: sticky;
            bottom: 16px;
            z-index: 10;
            box-shadow: 0 4px 20px rgba(0,0,0,0.15);
          }

          .product-page__size-btn {
            width: 42px;
            height: 42px;
            font-size: 12px;
          }

          .product-page__nav-btn {
            width: 36px;
            height: 36px;
          }
        }

        @media (max-width: 480px) {
          .product-page {
            padding: 12px 12px 60px;
          }

          .product-page__main-image {
            border-radius: 10px;
          }

          .product-page__title {
            font-size: 20px;
          }
        }
      `}</style>
    </div>
  );
}
