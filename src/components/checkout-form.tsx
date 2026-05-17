"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { CART_COOKIE, CHECKOUT_COOKIE, getCookie, setCookie, removeCookie } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type CartItem = { id: string; quantity: number; size?: string };

type Product = {
  id: string;
  name: string;
  price: number;
  imageUrl?: string;
  size?: string;
};

function readCart(): CartItem[] {
  const raw = getCookie(CART_COOKIE);
  if (!raw) return [];
  try {
    return JSON.parse(raw) as CartItem[];
  } catch {
    return [];
  }
}

async function fetchProduct(id: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/api/products/${id}`);
    if (!res.ok) return null;
    const json = await res.json();
    if (!json.success || !json.data) return null;
    const p = json.data;
    let images: string[] = [];
    if (Array.isArray(p.images)) images = p.images;
    else if (typeof p.images === "string") {
      try { images = JSON.parse(p.images); } catch { /* ignore */ }
    }
    return {
      id: String(p.id),
      name: p.name,
      price: p.price,
      imageUrl: images[0] ?? undefined,
    };
  } catch {
    return null;
  }
}

function getAccessToken(): string | null {
  return getCookie("brand_access_token") || null;
}

// ─── Логотип СБП ──────────────────────────────────────────────────
function SbpLogo() {
  return (
    <svg width="24" height="30" viewBox="0 0 97 120" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M0 26.12l14.532 25.975v15.844L.017 93.863 0 26.12z" fill="#5B57A2"/>
      <path d="M55.797 42.643l13.617-8.346 27.868-.026-41.485 25.414V42.643z" fill="#D90751"/>
      <path d="M55.72 25.967l.077 34.39-14.566-8.95V0l14.49 25.967z" fill="#FAB718"/>
      <path d="M97.282 34.271l-27.869.026-13.693-8.33L41.231 0l56.05 34.271z" fill="#ED6F26"/>
      <path d="M55.797 94.007V77.322l-14.566-8.78.008 51.458 14.558-25.993z" fill="#63B22F"/>
      <path d="M69.38 85.737L14.531 52.095 0 26.12l97.223 59.583-27.844.034z" fill="#1487C9"/>
      <path d="M41.24 120l14.556-25.993 13.583-8.27 27.843-.034L41.24 120z" fill="#017F36"/>
      <path d="M.017 93.863l41.333-25.32-13.896-8.526-12.922 7.922L.017 93.863z" fill="#984995"/>
    </svg>
  );
}

// ─── Логотип карты МИР ────────────────────────────────────────────
function CardLogo() {
  return (
    <img src="/mir-logo.svg" alt="МИР" width="40" height="24" style={{ objectFit: "contain" }} />
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [step, setStep] = useState<"form" | "success">("form");
  const [orderId, setOrderId] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isAuth, setIsAuth] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<"card" | "sbp">("card");

  useEffect(() => {
    setIsAuth(!!getAccessToken());
    const items = readCart();
    setCartItems(items);
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    Promise.all(items.map((i) => fetchProduct(i.id)))
      .then((results) => {
        const found = results.filter((p): p is Product => p !== null);
        const withSize = found.map((p) => {
          const ci = items.find((c) => c.id === p.id);
          return { ...p, size: ci?.size };
        });
        setProducts(withSize);
      })
      .finally(() => setLoading(false));
  }, []);

  const total = products.reduce((sum, p) => {
    const qty = cartItems.find((c) => c.id === p.id)?.quantity ?? 1;
    return sum + p.price * qty;
  }, 0);

  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setSubmitting(true);

    const formData = new FormData(event.currentTarget);
    const shippingAddress = {
      fullName: String(formData.get("fullName") || ""),
      phone: String(formData.get("phone") || ""),
      city: String(formData.get("city") || ""),
      address: String(formData.get("address") || ""),
      comment: String(formData.get("comment") || ""),
    };

    setCookie(CHECKOUT_COOKIE, JSON.stringify({ shippingAddress, paymentMethod }));

    if (!isAuth) {
      setError("для оформления заказа необходимо войти в аккаунт.");
      setSubmitting(false);
      return;
    }

    const items = cartItems.map((c) => ({ productId: c.id, quantity: c.quantity }));

    try {
      const res = await fetch(`${API_BASE}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({
          items,
          shippingAddress,
          billingAddress: shippingAddress,
          paymentMethod,
          notes: shippingAddress.comment,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "не удалось создать заказ");
      }

      // Создаём платёж и редиректим на ЮKassa
      const payRes = await fetch(`${API_BASE}/api/payments/create`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getAccessToken()}`,
        },
        body: JSON.stringify({ orderId: data.data.id }),
      });
      const payData = await payRes.json();
      if (payData.success && payData.data?.paymentUrl) {
        window.location.href = payData.data.paymentUrl;
      } else {
        setOrderId(data.data.id);
        setOrderNumber(data.data.orderNumber);
        setError(payData.error || "не удалось создать платёж");
        setSubmitting(false);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ошибка при создании заказа");
      setSubmitting(false);
    }
  };

  // ─── Загрузка ───────────────────────────────────────────────────
  if (loading) {
    return (
      <section className="auth-shell">
        <div className="card auth-form" style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </section>
    );
  }

  // ─── Пустая корзина ─────────────────────────────────────────────
  if (cartItems.length === 0 || products.length === 0) {
    return (
      <section className="auth-shell">
        <div className="card auth-form">
          <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333", margin: "0 0 16px 0" }}>оформление заказа</h1>
          <p className="muted" style={{ marginBottom: "24px" }}>корзина пуста. добавьте товары перед оформлением.</p>
          <Link href="/" className="email-btn">в каталог</Link>
        </div>
      </section>
    );
  }

  // ─── Успех ──────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <section className="auth-shell">
        <div className="card auth-form" style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 24px",
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333", margin: "0 0 12px 0" }}>заказ оформлен!</h1>
          <p style={{ fontSize: "16px", marginBottom: "8px", color: "#333" }}>номер заказа: <strong>{orderNumber}</strong></p>
          <p className="muted" style={{ fontSize: "14px", marginBottom: "32px" }}>спасибо за покупку. мы отправили подтверждение на ваш email.</p>
          <Link href="/orders" className="email-btn">мои заказы</Link>
        </div>
      </section>
    );
  }

  // ─── Основная форма ─────────────────────────────────────────────
  return (
    <section className="checkout-shell">
      <form className="checkout-grid" onSubmit={handleFormSubmit}>
        {/* Левая колонка — форма */}
        <div className="checkout-left">
          {/* Заголовок */}
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <button
              type="button"
              onClick={() => router.push("/cart")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                marginLeft: "-8px",
                display: "flex",
                alignItems: "center",
                borderRadius: "8px",
              }}
              aria-label="назад"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" stroke="#f1a7c8" strokeWidth="2" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 style={{ fontSize: "26px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333", margin: 0 }}>оформление заказа</h1>
          </div>

          {/* Предупреждение о входе */}
          {!isAuth && (
            <div className="checkout-warning">
              <p style={{ margin: 0, fontSize: "14px", color: "#7a5c00" }}>
                <strong>требуется авторизация.</strong>{" "}
                <Link href="/login" style={{ textDecoration: "underline", color: "#f1a7c8" }}>войдите</Link>{" "}
                или{" "}
                <Link href="/register" style={{ textDecoration: "underline", color: "#f1a7c8" }}>зарегистрируйтесь</Link>.
              </p>
            </div>
          )}

          {/* 1. Данные */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">1. данные получателя</h2>
            <div className="checkout-fields-row">
              <label className="field">
                <span>фио</span>
                <input name="fullName" type="text" placeholder="иван иванов" required />
              </label>
              <label className="field">
                <span>email</span>
                <input name="email" type="email" placeholder="mail@example.com" required />
              </label>
            </div>
            <label className="field">
              <span>телефон</span>
              <input name="phone" type="tel" placeholder="+7 (999) 000-00-00" required />
            </label>
          </div>

          {/* 2. Адрес доставки */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">2. адрес доставки</h2>
            <p className="checkout-hint">доставка осуществляется через сдэк в города России, Казахстана и Беларуси</p>
            <label className="field">
              <span>город</span>
              <input name="city" type="text" placeholder="москва" required />
            </label>
            <label className="field">
              <span>адрес пункта выдачи / постамата сдэк</span>
              <input name="address" type="text" placeholder="ул. примерная, д. 1 (пункт сдэк)" required />
            </label>
            <label className="field">
              <span>комментарий к заказу</span>
              <textarea name="comment" placeholder="пожелания к заказу (необязательно)" rows={2} />
            </label>
          </div>

          {/* 3. Способ оплаты */}
          <div className="checkout-section">
            <h2 className="checkout-section-title">3. способ оплаты</h2>
            <div className="checkout-payment-options">
              {/* Карта */}
              <label className={`checkout-payment-option ${paymentMethod === "card" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value="card"
                  checked={paymentMethod === "card"}
                  onChange={() => setPaymentMethod("card")}
                  style={{ display: "none" }}
                />
                <CardLogo />
                <div>
                  <p className="checkout-payment-name">банковская карта</p>
                  <p className="checkout-payment-desc">visa, mastercard, мир</p>
                </div>
                {paymentMethod === "card" && (
                  <div className="checkout-payment-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                    </svg>
                  </div>
                )}
              </label>

              {/* СБП */}
              <label className={`checkout-payment-option ${paymentMethod === "sbp" ? "active" : ""}`}>
                <input
                  type="radio"
                  name="payment"
                  value="sbp"
                  checked={paymentMethod === "sbp"}
                  onChange={() => setPaymentMethod("sbp")}
                  style={{ display: "none" }}
                />
                <SbpLogo />
                <div>
                  <p className="checkout-payment-name">система быстрых платежей</p>
                  <p className="checkout-payment-desc">оплата через приложение банка</p>
                </div>
                {paymentMethod === "sbp" && (
                  <div className="checkout-payment-check">
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                      <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                    </svg>
                  </div>
                )}
              </label>
            </div>
          </div>

          {error && <p className="checkout-error">{error}</p>}

          <button type="submit" className="email-btn checkout-submit" disabled={submitting}>
            {submitting ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                оформляем...
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </span>
            ) : (
              `оплатить — ${total.toLocaleString("ru-RU")} ₽`
            )}
          </button>
        </div>

        {/* Правая колонка — сводка заказа */}
        <div className="checkout-right">
          <OrderSummary products={products} cartItems={cartItems} total={total} />
        </div>
      </form>
    </section>
  );
}

// ─── Компонент: сводка заказа ──────────────────────────────────────
function OrderSummary({
  products,
  cartItems,
  total,
}: {
  products: Product[];
  cartItems: CartItem[];
  total: number;
}) {
  return (
    <div className="checkout-summary">
      <h2 className="checkout-section-title">ваш заказ</h2>
      <div className="checkout-summary-items">
        {products.map((p) => {
          const qty = cartItems.find((c) => c.id === p.id)?.quantity ?? 1;
          const size = cartItems.find((c) => c.id === p.id)?.size;
          return (
            <div key={p.id} className="checkout-summary-item">
              <div className="checkout-summary-thumb">
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} />
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p className="checkout-summary-name">{p.name}</p>
                {size && <span className="checkout-summary-size">{size}</span>}
                <p className="checkout-summary-qty">× {qty}</p>
              </div>
              <p className="checkout-summary-price">
                {(p.price * qty).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          );
        })}
      </div>
      <div className="checkout-summary-total">
        <span>итого</span>
        <strong>{total.toLocaleString("ru-RU")} ₽</strong>
      </div>
    </div>
  );
}
