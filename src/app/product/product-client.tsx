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
    <div className="pdp-accordion">
      <button type="button" className="pdp-accordion-trigger" onClick={() => setOpen(!open)}>
        <span>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="pdp-accordion-content">{children}</div>}
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
      <div className="pdp-shell">
        <div style={{ display: "flex", justifyContent: "center", padding: "80px 0" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="pdp-shell">
        <div style={{ textAlign: "center", padding: "80px 0" }}>
          <p style={{ color: "#8c7584", fontSize: "16px", marginBottom: "24px" }}>{error || "товар не найден"}</p>
          <Link href="/" className="email-btn">в каталог</Link>
        </div>
      </div>
    );
  }

  const images = parseImages(product);
  const sizes = parseSizes(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  return (
    <div className="pdp-shell">
      <button type="button" onClick={() => router.back()} className="pdp-back" aria-label="назад">
        <svg width="20" height="20" viewBox="0 0 24 24" stroke="#f1a7c8" strokeWidth="2" fill="none">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
        <span>назад</span>
      </button>

      <div className="pdp-grid">
        <div className="pdp-images">
          <div className="pdp-main-image">
            {images.length > 0 ? (
              <img src={images[selectedImage]} alt={product.name} />
            ) : (
              <div className="pdp-no-image">
                <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="#f1a7c8" strokeWidth="1.5">
                  <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
              </div>
            )}
          </div>
          {images.length > 1 && (
            <div className="pdp-thumbs">
              {images.map((img, i) => (
                <button key={i} type="button" onClick={() => setSelectedImage(i)} className={`pdp-thumb ${i === selectedImage ? "active" : ""}`}>
                  <img src={img} alt={`${product.name} ${i + 1}`} />
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="pdp-info">
          <h1 className="pdp-title">{product.name}</h1>

          <div className="pdp-price-row">
            <span className="pdp-price">{product.price.toLocaleString("ru-RU")} ₽</span>
            {hasDiscount && <span className="pdp-old-price">{product.compareAtPrice!.toLocaleString("ru-RU")} ₽</span>}
          </div>

          {sizes.length > 0 && (
            <div className="pdp-sizes">
              <p className="pdp-sizes-label">размер</p>
              <div className="pdp-sizes-row">
                {sizes.map(size => (
                  <button key={size} type="button" onClick={() => setSelectedSize(size)} className={`pdp-size-btn ${selectedSize === size ? "active" : ""}`}>
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <button type="button" onClick={handleAddToCart} className="pdp-add-btn" disabled={sizes.length > 0 && !selectedSize}>
            {added ? "✓ добавлено" : "добавить в корзину"}
          </button>

          {product.description && (
            <Accordion title="описание" defaultOpen>
              <p className="pdp-description">{product.description}</p>
            </Accordion>
          )}

          <Accordion title="доставка">
            <p className="pdp-description">
              доставка осуществляется через сдэк по всей России. срок доставки зависит от вашего региона — обычно 2-7 рабочих дней. отправка изделий по предзаказу — до 3-х недель.
            </p>
          </Accordion>

          <Accordion title="оплата">
            <p className="pdp-description">
              оплата банковской картой (visa, mastercard, мир) или через систему быстрых платежей (сбп). оплата производится через защищённый шлюз юkassa.
            </p>
          </Accordion>

          <Accordion title="таблица размеров">
            <p className="pdp-description">
              s — 42-44<br/>m — 44-46<br/>l — 46-48<br/>xl — 48-50
            </p>
          </Accordion>

          <Accordion title="уход за одеждой">
            <p className="pdp-description">
              рекомендуется ручная стирка при температуре не выше 30°. не отбеливать. сушить в расправленном виде. гладить при низкой температуре.
            </p>
          </Accordion>
        </div>
      </div>
    </div>
  );
}
