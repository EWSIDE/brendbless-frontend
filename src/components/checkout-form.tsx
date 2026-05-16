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
    <svg width="32" height="20" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="#1D1D1B"/>
      <path d="M14 25L26 10V20H40L28 35V25H14Z" fill="#00B4D8"/>
      <path d="M28 20H40L52 10H40L28 20Z" fill="#5BC500"/>
      <path d="M28 35L40 25H52L40 35H28Z" fill="#FF5C00"/>
      <path d="M52 10L64 25L52 40V30H40L52 20V10Z" fill="#FF0032"/>
    </svg>
  );
}

// ─── Логотип карты (Visa/MC-стиль) ────────────────────────────────
function CardLogo() {
  return (
    <svg width="32" height="20" viewBox="0 0 80 50" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect width="80" height="50" rx="6" fill="#1A1F71"/>
      <rect x="8" y="18" width="64" height="14" rx="2" fill="#F7B731" opacity="0.9"/>
      <circle cx="30" cy="25" r="10" fill="#EB001B"/>
      <circle cx="50" cy="25" r="10" fill="#F79E1B"/>
      <path d="M40 17.5a10 10 0 0 1 0 15 10 10 0 0 1 0-15z" fill="#FF5F00"/>
    </svg>
  );
}

export function CheckoutForm() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<"form" | "payment" | "success">("form");
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
        // Добавляем размер из корзины
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

      setOrderNumber(data.data.orderNumber);
      setStep("payment");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ошибка при создании заказа");
    }
  };

  const handlePaymentSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setTimeout(() => {
      removeCookie(CART_COOKIE);
      setStep("success");
    }, 1200);
  };

  // ─── Загрузка ───────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="checkout-shell">
        <div className="checkout-card">
          <p className="muted">загружаем корзину…</p>
        </div>
      </div>
    );
  }

  // ─── Пустая корзина ─────────────────────────────────────────────
  if (cartItems.length === 0 || products.length === 0) {
    return (
      <div className="checkout-shell">
        <div className="checkout-card">
          <h1 style={{ fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333", margin: "0 0 16px 0" }}>оформление заказа</h1>
          <p className="muted" style={{ marginBottom: "24px" }}>корзина пуста. добавьте товары перед оформлением.</p>
          <Link href="/" className="email-btn">в каталог</Link>
        </div>
      </div>
    );
  }

  // ─── Успех ──────────────────────────────────────────────────────
  if (step === "success") {
    return (
      <div className="checkout-shell">
        <div className="checkout-card" style={{ textAlign: "center", padding: "60px 40px" }}>
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
      </div>
    );
  }

  // ─── Оплата ─────────────────────────────────────────────────────
  if (step === "payment") {
    return (
      <>
        <style>{checkoutStyles}</style>
        <div className="checkout-shell">
          <form className="checkout-layout" onSubmit={handlePaymentSubmit}>
            {/* Левая — форма оплаты */}
            <div className="checkout-main">
              <div className="checkout-card">
                <h1 style={{ fontSize: "26px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333", margin: "0 0 6px 0" }}>оплата заказа</h1>
                <p className="muted" style={{ fontSize: "14px", marginBottom: "24px" }}>заказ №{orderNumber}</p>

                {paymentMethod === "card" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
                      <CardLogo />
                      <span style={{ fontWeight: 600, color: "#333", fontSize: "15px" }}>банковская карта</span>
                    </div>
                    <label className="field">
                      <span>номер карты</span>
                      <input type="text" placeholder="0000 0000 0000 0000" maxLength={19} required />
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <label className="field">
                        <span>срок действия</span>
                        <input type="text" placeholder="мм/гг" maxLength={5} required />
                      </label>
                      <label className="field">
                        <span>cvc</span>
                        <input type="text" placeholder="123" maxLength={3} required />
                      </label>
                    </div>
                    <label className="field">
                      <span>имя держателя</span>
                      <input type="text" placeholder="ivan ivanov" required />
                    </label>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", padding: "32px 0" }}>
                    <div style={{ display: "flex", justifyContent: "center", marginBottom: "16px" }}>
                      <SbpLogo />
                    </div>
                    <p style={{ color: "#333", fontWeight: 600, marginBottom: "8px" }}>система быстрых платежей</p>
                    <p className="muted" style={{ fontSize: "14px" }}>после нажатия кнопки откроется приложение банка для оплаты через сбп</p>
                  </div>
                )}

                <p className="muted" style={{ fontSize: "12px", marginTop: "16px" }}>
                  оплата производится через защищённый шлюз. данные передаются по зашифрованному соединению.
                </p>

                <button
                  type="submit"
                  style={{
                    marginTop: "8px",
                    width: "100%",
                    background: "#f1a7c8",
                    color: "#fff",
                    border: "none",
                    borderRadius: "40px",
                    padding: "16px 32px",
                    fontSize: "16px",
                    fontWeight: 500,
                    cursor: "pointer",
                    fontFamily: "inherit",
                  }}
                >
                  оплатить {total.toLocaleString("ru-RU")} ₽
                </button>
                {error && <p style={{ color: "#e05", fontSize: "14px", marginTop: "8px" }}>{error}</p>}
              </div>
            </div>

            {/* Правая — итог */}
            <div className="checkout-sidebar">
              <OrderSummary products={products} cartItems={cartItems} total={total} />
            </div>
          </form>
        </div>
      </>
    );
  }

  // ─── Основная форма ─────────────────────────────────────────────
  return (
    <>
      <style>{checkoutStyles}</style>
      <div className="checkout-shell">
        <form className="checkout-layout" onSubmit={handleFormSubmit}>
          {/* Левая — поля */}
          <div className="checkout-main">
            {/* Заголовок */}
            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "4px" }}>
              <button
                type="button"
                onClick={() => router.push("/cart")}
                style={{
                  background: "white",
                  border: "none",
                  cursor: "pointer",
                  padding: "8px",
                  marginLeft: "-8px",
                  display: "flex",
                  alignItems: "center",
                  borderRadius: "8px",
                  boxShadow: "none",
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
              <div style={{ padding: "16px 20px", background: "#fff8e1", border: "1px solid #ffe082", borderRadius: "16px" }}>
                <p style={{ margin: 0, fontSize: "14px", color: "#7a5c00" }}>
                  <strong>требуется авторизация.</strong>{" "}
                  <Link href="/login" style={{ textDecoration: "underline", color: "#f1a7c8" }}>войдите</Link>{" "}
                  или{" "}
                  <Link href="/register" style={{ textDecoration: "underline", color: "#f1a7c8" }}>зарегистрируйтесь</Link>.
                </p>
              </div>
            )}

            {/* Данные получателя */}
            <div className="checkout-card">
              <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#333" }}>получатель</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label className="field">
                  <span>имя и фамилия</span>
                  <input name="fullName" type="text" placeholder="иван иванов" required />
                </label>
                <label className="field">
                  <span>телефон</span>
                  <input name="phone" type="tel" placeholder="+7 (999) 000-00-00" required />
                </label>
              </div>
            </div>

            {/* Доставка СДЭК */}
            <div className="checkout-card">
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
                <h2 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#333" }}>доставка</h2>
                {/* Логотип СДЭК */}
                <span style={{
                  background: "#00b140",
                  color: "#fff",
                  fontSize: "11px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  borderRadius: "6px",
                  letterSpacing: "0.05em",
                }}>
                  СДЭК
                </span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <label className="field">
                  <span>город</span>
                  <input name="city" type="text" placeholder="москва" required />
                </label>
                <label className="field">
                  <span>адрес (улица, дом, квартира)</span>
                  <input name="address" type="text" placeholder="ул. пушкина, д. 1, кв. 10" required />
                </label>
                <label className="field">
                  <span>комментарий к заказу</span>
                  <textarea name="comment" className="textarea" placeholder="код домофона, удобное время доставки" rows={2} />
                </label>
              </div>
            </div>

            {/* Способ оплаты */}
            <div className="checkout-card">
              <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#333" }}>способ оплаты</h2>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {/* Карта */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: `2px solid ${paymentMethod === "card" ? "#f1a7c8" : "#fdf2f8"}`,
                  background: paymentMethod === "card" ? "#fff5f8" : "#fffbfd",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}>
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
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#333" }}>банковская карта</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#8e8e8e" }}>visa, mastercard, мир</p>
                  </div>
                  {paymentMethod === "card" && (
                    <div style={{ marginLeft: "auto", width: "20px", height: "20px", borderRadius: "50%", background: "#f1a7c8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                      </svg>
                    </div>
                  )}
                </label>

                {/* СБП */}
                <label style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "14px",
                  padding: "14px 16px",
                  borderRadius: "14px",
                  border: `2px solid ${paymentMethod === "sbp" ? "#f1a7c8" : "#fdf2f8"}`,
                  background: paymentMethod === "sbp" ? "#fff5f8" : "#fffbfd",
                  cursor: "pointer",
                  transition: "border-color 0.2s, background 0.2s",
                }}>
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
                    <p style={{ margin: 0, fontWeight: 600, fontSize: "14px", color: "#333" }}>система быстрых платежей</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#8e8e8e" }}>оплата через приложение банка</p>
                  </div>
                  {paymentMethod === "sbp" && (
                    <div style={{ marginLeft: "auto", width: "20px", height: "20px", borderRadius: "50%", background: "#f1a7c8", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round">
                        <polyline points="1.5 5 4 7.5 8.5 2.5"/>
                      </svg>
                    </div>
                  )}
                </label>
              </div>
            </div>

            {error && <p style={{ color: "#e05", fontSize: "14px" }}>{error}</p>}

            <button
              type="submit"
              style={{
                width: "100%",
                background: "#f1a7c8",
                color: "#fff",
                border: "none",
                borderRadius: "40px",
                padding: "18px 32px",
                fontSize: "16px",
                fontWeight: 500,
                cursor: "pointer",
                fontFamily: "inherit",
              }}
            >
              перейти к оплате — {total.toLocaleString("ru-RU")} ₽
            </button>
          </div>

          {/* Правая — корзина */}
          <div className="checkout-sidebar">
            <OrderSummary products={products} cartItems={cartItems} total={total} />
          </div>
        </form>
      </div>
    </>
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
    <div style={{
      background: "#fff",
      border: "1px solid #fdf2f8",
      borderRadius: "20px",
      padding: "20px",
      position: "sticky",
      top: "24px",
    }}>
      <h2 style={{ margin: "0 0 16px 0", fontSize: "16px", fontWeight: 600, color: "#333" }}>ваш заказ</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
        {products.map((p) => {
          const qty = cartItems.find((c) => c.id === p.id)?.quantity ?? 1;
          const size = cartItems.find((c) => c.id === p.id)?.size;
          return (
            <div key={p.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
              {/* Миниатюра */}
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "10px",
                background: "linear-gradient(180deg, #fff5f8 0%, #fce7f3 100%)",
                flexShrink: 0,
                overflow: "hidden",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}>
                {p.imageUrl ? (
                  <img src={p.imageUrl} alt={p.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                    <line x1="3" y1="6" x2="21" y2="6"/>
                    <path d="M16 10a4 4 0 0 1-8 0"/>
                  </svg>
                )}
              </div>
              {/* Инфо */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ margin: "0 0 2px 0", fontSize: "13px", fontWeight: 600, color: "#333", lineHeight: 1.3 }}>{p.name}</p>
                {size && (
                  <span style={{ fontSize: "11px", color: "#f1a7c8", background: "#fff5f8", border: "1px solid #fce7f3", borderRadius: "20px", padding: "1px 8px", display: "inline-block", marginBottom: "2px" }}>
                    {size}
                  </span>
                )}
                <p style={{ margin: 0, fontSize: "12px", color: "#8e8e8e" }}>× {qty}</p>
              </div>
              <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#333", flexShrink: 0 }}>
                {(p.price * qty).toLocaleString("ru-RU")} ₽
              </p>
            </div>
          );
        })}
      </div>
      <div style={{ borderTop: "1px solid #fdf2f8", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "14px", color: "#8e8e8e" }}>итого</span>
        <strong style={{ fontSize: "20px", color: "#333", fontWeight: 700 }}>{total.toLocaleString("ru-RU")} ₽</strong>
      </div>
    </div>
  );
}

// ─── Стили ────────────────────────────────────────────────────────
const checkoutStyles = `
  .checkout-shell {
    max-width: 1000px;
    margin: 0 auto;
    padding: 24px 16px 60px;
  }
  .checkout-layout {
    display: grid;
    grid-template-columns: 1fr;
    gap: 20px;
  }
  @media (min-width: 768px) {
    .checkout-layout {
      grid-template-columns: 1fr 360px;
      align-items: start;
    }
  }
  .checkout-main {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }
  .checkout-sidebar {
    /* sticky handled inline */
  }
  .checkout-card {
    background: #fff;
    border: 1px solid #fdf2f8;
    border-radius: 20px;
    padding: 20px;
  }
  @media (max-width: 767px) {
    .checkout-shell {
      padding: 16px 12px 80px;
    }
    .checkout-card {
      padding: 16px;
      border-radius: 16px;
    }
  }
`;
