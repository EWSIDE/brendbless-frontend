"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { CART_COOKIE, getCookie, setCookie } from "@/lib/cookies";
import styles from "./product.module.css";

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
    <div className={styles.accordion}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className={styles.accordionBtn}
      >
        <span>{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ transform: open ? "rotate(180deg)" : "rotate(0)", transition: "transform 0.2s" }}>
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && (
        <div className={styles.accordionContent}>
          <p>{children}</p>
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
      <div className={styles.page}>
        <div className={styles.loader} />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className={styles.page} style={{ textAlign: "center", paddingTop: "80px" }}>
        <p style={{ color: "#333", fontSize: "16px", marginBottom: "24px" }}>{error || "товар не найден"}</p>
        <Link href="/" className={styles.addBtn}>в каталог</Link>
      </div>
    );
  }

  const images = parseImages(product);
  const sizes = parseSizes(product);
  const hasDiscount = product.compareAtPrice && product.compareAtPrice > product.price;

  const goToPrev = () => setSelectedImage(i => i > 0 ? i - 1 : images.length - 1);
  const goToNext = () => setSelectedImage(i => i < images.length - 1 ? i + 1 : 0);

  return (
    <div className={styles.page}>
      {/* Кнопка назад */}
      <button
        type="button"
        onClick={() => router.back()}
        className={styles.backBtn}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M19 12H5" />
          <path d="M12 19l-7-7 7-7" />
        </svg>
      </button>

      {/* Основная сетка */}
      <div className={styles.grid}>
        {/* Галерея */}
        <div className={styles.gallery}>
          <div className={styles.mainImage}>
            {images.length > 0 ? (
              <img
                src={images[selectedImage]}
                alt={product.name}
                className={styles.productImg}
              />
            ) : (
              <div className={styles.noImage}>
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
                  className={`${styles.navBtn} ${styles.navBtnLeft}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 18l-6-6 6-6" />
                  </svg>
                </button>
                <button
                  type="button"
                  onClick={goToNext}
                  aria-label="следующее фото"
                  className={`${styles.navBtn} ${styles.navBtnRight}`}
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 18l6-6-6-6" />
                  </svg>
                </button>
              </>
            )}
          </div>

          {/* Точки */}
          {images.length > 1 && (
            <div className={styles.dots}>
              {images.map((_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedImage(i)}
                  aria-label={`фото ${i + 1}`}
                  className={`${styles.dot} ${i === selectedImage ? styles.dotActive : ""}`}
                />
              ))}
            </div>
          )}
        </div>

        {/* Информация */}
        <div className={styles.info}>
          <h1 className={styles.title}>{product.name}</h1>

          <div className={styles.priceRow}>
            <span className={styles.price}>
              {product.price.toLocaleString("ru-RU")} ₽
            </span>
            {hasDiscount && (
              <span className={styles.oldPrice}>
                {product.compareAtPrice!.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>

          {/* Размеры */}
          {sizes.length > 0 && (
            <div className={styles.sizesBlock}>
              <p className={styles.sizesLabel}>размер</p>
              <div className={styles.sizesList}>
                {sizes.map(size => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`${styles.sizeBtn} ${selectedSize === size ? styles.sizeBtnActive : ""}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Кнопка */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={sizes.length > 0 && !selectedSize}
            className={`${styles.addBtn} ${added ? styles.addBtnAdded : ""}`}
          >
            {added ? "✓ добавлено" : "добавить в корзину"}
          </button>

          {/* Аккордеоны */}
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
    </div>
  );
}
