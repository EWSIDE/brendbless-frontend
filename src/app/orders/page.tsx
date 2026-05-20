"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { USER_COOKIE, ACCESS_TOKEN_COOKIE, getCookie } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type User = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

type OrderItem = {
  id: string;
  quantity: number;
  unitPrice: number;
  total: number;
  productName: string;
  productImage?: string | null;
  size?: string | null;
};

type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus?: string;
  total: number;
  createdAt: string;
  items?: OrderItem[];
  shippingAddress?: string | { fullName?: string; city?: string; address?: string } | null;
};

// ─── Статусы ──────────────────────────────────────────────────────
const STATUS_MAP: Record<string, { label: string; color: string; bg: string }> = {
  PENDING:    { label: "принят",          color: "#be185d", bg: "#fce7f3" },
  PROCESSING: { label: "собирается",      color: "#be185d", bg: "#fce7f3" },
  IN_TRANSIT: { label: "в пути",          color: "#92400e", bg: "#fef3c7" },
  READY:      { label: "готов к выдаче",  color: "#166534", bg: "#dcfce7" },
  CANCELLED:  { label: "отменён",         color: "#991b1b", bg: "#fee2e2" },
  DELAYED:    { label: "задерживается",   color: "#991b1b", bg: "#fee2e2" },
};

function getStatus(status: string) {
  return STATUS_MAP[status] ?? { label: status.toLowerCase(), color: "#5d4c5a", bg: "#fdf2f8" };
}

export default function OrdersPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  useEffect(() => {
    const rawUser = getCookie(USER_COOKIE);
    if (rawUser) {
      try {
        setUser(JSON.parse(rawUser) as User);
      } catch {
        setUser(null);
      }
    }
    fetchOrders();
  }, []);

  async function fetchOrders() {
    setLoading(true);
    setError(null);
    try {
      const token = getCookie(ACCESS_TOKEN_COOKIE);

      // Нет токена — не авторизован, показываем пустой список без ошибки
      if (!token) {
        setOrders([]);
        return;
      }

      const res = await fetch(`${API_BASE}/api/orders/my-orders`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          setOrders([]);
          return;
        }
        throw new Error(data.error || `ошибка сервера ${res.status}`);
      }

      const allOrders: Order[] = data.orders || data.data || [];
      // Показываем только оплаченные заказы
      setOrders(allOrders.filter((o) => o.paymentStatus === "PAID"));
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }

  // ─── Не авторизован ─────────────────────────────────────────────
  if (!loading && !user) {
    return (
      <section className="auth-shell">
        <div className="card auth-form">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "64px", height: "64px", borderRadius: "50%",
              background: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)",
              display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#333", margin: "0 0 8px 0" }}>мои заказы</h1>
            <p style={{ color: "#8e8e8e", fontSize: "15px", margin: 0 }}>войдите, чтобы видеть историю заказов</p>
          </div>
          <Link href="/login" className="email-btn" style={{ display: "block", textAlign: "center", marginBottom: "12px" }}>войти</Link>
          <Link href="/register" style={{ display: "block", textAlign: "center", color: "#f1a7c8", fontSize: "14px", textDecoration: "underline" }}>зарегистрироваться</Link>
        </div>
      </section>
    );
  }

  const displayName = user ? ([user.firstName, user.lastName].filter(Boolean).join(" ") || user.email) : "";

  return (
    <>
      <style>{`
        .orders-shell {
          max-width: 760px;
          margin: 0 auto;
          padding: 24px 16px 60px;
        }
        .order-card {
          background: #fff;
          border: 1px solid #fdf2f8;
          border-radius: 20px;
          overflow: hidden;
          transition: border-color 0.2s;
        }
        .order-card:hover {
          border-color: #fce7f3;
        }
        .order-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 16px 20px;
          cursor: pointer;
          gap: 12px;
        }
        .order-items-preview {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
          padding: 0 20px 16px;
        }
        .order-detail {
          border-top: 1px solid #fdf2f8;
          padding: 16px 20px;
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        @media (max-width: 640px) {
          .orders-shell { padding: 16px 12px 80px; }
          .order-header { padding: 14px 16px; }
          .order-items-preview { padding: 0 16px 14px; }
          .order-detail { padding: 14px 16px; }
        }
      `}</style>

      <div className="orders-shell">
        {/* Шапка */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => router.back()}
            style={{ background: "white", border: "none", cursor: "pointer", padding: "8px", marginLeft: "-8px", display: "flex", alignItems: "center", borderRadius: "8px", boxShadow: "none" }}
            aria-label="назад"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" stroke="#f1a7c8" strokeWidth="2" fill="none">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
          </button>
          <div style={{ flex: 1 }}>
            <h1 style={{ margin: 0, fontSize: "26px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>мои заказы</h1>
            {displayName && <p style={{ margin: 0, fontSize: "13px", color: "#8e8e8e" }}>{displayName}</p>}
          </div>
          {orders.length > 0 && (
            <span style={{ background: "#fff5f8", border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px", fontWeight: 500 }}>
              {orders.length}
            </span>
          )}
        </div>

        {/* Загрузка */}
        {loading && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
            </div>
            <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          </div>
        )}

        {/* Ошибка */}
        {!loading && error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "16px", padding: "16px 20px", color: "#991b1b", fontSize: "14px" }}>
            {error}
          </div>
        )}

        {/* Пусто */}
        {!loading && !error && orders.length === 0 && (
          <div style={{ textAlign: "center", padding: "60px 0" }}>
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
              <svg width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.5 }}>
                <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
                <rect x="9" y="3" width="6" height="4" rx="1"/>
                <line x1="9" y1="12" x2="15" y2="12"/>
                <line x1="9" y1="16" x2="13" y2="16"/>
              </svg>
            </div>
            <p style={{ fontSize: "18px", color: "#333", fontWeight: 600, marginBottom: "8px" }}>заказов пока нет</p>
            <p style={{ fontSize: "15px", color: "#8e8e8e", marginBottom: "28px" }}>когда вы сделаете заказ, он появится здесь</p>
            <Link href="/" className="email-btn">перейти в каталог</Link>
          </div>
        )}

        {/* Список заказов */}
        {!loading && !error && orders.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {orders.map((order) => {
              const st = getStatus(order.status);
              const isOpen = expandedId === order.id;
              const itemsCount = order.items?.reduce((s, i) => s + i.quantity, 0) ?? 0;

              return (
                <div key={order.id} className="order-card">
                  {/* Заголовок карточки — кликабельный */}
                  <div
                    className="order-header"
                    onClick={() => setExpandedId(isOpen ? null : order.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === "Enter" && setExpandedId(isOpen ? null : order.id)}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <span style={{ fontWeight: 700, fontSize: "15px", color: "#333" }}>
                          заказ №{order.orderNumber || order.id}
                        </span>
                        <span style={{
                          fontSize: "12px",
                          fontWeight: 600,
                          padding: "3px 10px",
                          borderRadius: "20px",
                          background: st.bg,
                          color: st.color,
                        }}>
                          {st.label}
                        </span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#8e8e8e" }}>
                        {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric" })}
                        {itemsCount > 0 && ` · ${itemsCount} ${itemsCount === 1 ? "товар" : itemsCount < 5 ? "товара" : "товаров"}`}
                      </p>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                      <span style={{ fontWeight: 700, fontSize: "16px", color: "#333" }}>
                        {order.total?.toLocaleString("ru-RU")} ₽
                      </span>
                      <svg
                        width="16" height="16" viewBox="0 0 24 24" fill="none"
                        stroke="#d4a0b5" strokeWidth="2" strokeLinecap="round"
                        style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s", flexShrink: 0 }}
                      >
                        <path d="M9 18l6-6-6-6"/>
                      </svg>
                    </div>
                  </div>

                  {/* Превью товаров */}
                  {order.items && order.items.length > 0 && !isOpen && (
                    <div className="order-items-preview">
                      {order.items.slice(0, 4).map((item) => (
                        <div key={item.id} style={{
                          width: "44px", height: "44px", borderRadius: "10px",
                          background: "linear-gradient(180deg, #fff5f8 0%, #fce7f3 100%)",
                          overflow: "hidden", flexShrink: 0,
                          display: "flex", alignItems: "center", justifyContent: "center",
                        }}>
                          {item.productImage ? (
                            <img src={item.productImage} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                              <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                              <line x1="3" y1="6" x2="21" y2="6"/>
                              <path d="M16 10a4 4 0 0 1-8 0"/>
                            </svg>
                          )}
                        </div>
                      ))}
                      {order.items.length > 4 && (
                        <div style={{
                          width: "44px", height: "44px", borderRadius: "10px",
                          background: "#fff5f8", border: "1px solid #fce7f3",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "12px", color: "#f1a7c8", fontWeight: 600,
                        }}>
                          +{order.items.length - 4}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Раскрытые детали */}
                  {isOpen && (
                    <div className="order-detail">
                      {/* Товары */}
                      {order.items && order.items.length > 0 && (
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {order.items.map((item) => (
                            <div key={item.id} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              <div style={{
                                width: "52px", height: "52px", borderRadius: "10px",
                                background: "linear-gradient(180deg, #fff5f8 0%, #fce7f3 100%)",
                                overflow: "hidden", flexShrink: 0,
                                display: "flex", alignItems: "center", justifyContent: "center",
                              }}>
                                {item.productImage ? (
                                  <img src={item.productImage} alt={item.productName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                ) : (
                                  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                                    <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                    <line x1="3" y1="6" x2="21" y2="6"/>
                                    <path d="M16 10a4 4 0 0 1-8 0"/>
                                  </svg>
                                )}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                  <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#333" }}>
                                    {item.productName}
                                  </p>
                                  {item.size && (
                                    <span style={{
                                      display: "inline-block",
                                      padding: "2px 10px",
                                      borderRadius: "8px",
                                      background: "#fce7f3",
                                      color: "#be185d",
                                      fontWeight: 700,
                                      fontSize: "12px",
                                    }}>
                                      {item.size}
                                    </span>
                                  )}
                                </div>
                                <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "#8e8e8e" }}>× {item.quantity}</p>
                              </div>
                              <p style={{ margin: 0, fontWeight: 700, fontSize: "14px", color: "#333", flexShrink: 0 }}>
                                {item.total.toLocaleString("ru-RU")} ₽
                              </p>
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Адрес доставки */}
                      {order.shippingAddress && (() => {
                        const addr = typeof order.shippingAddress === "string"
                          ? (() => { try { return JSON.parse(order.shippingAddress as string); } catch { return null; } })()
                          : order.shippingAddress;
                        if (!addr) return null;
                        const text = [addr.fullName, addr.city, addr.address].filter(Boolean).join(", ");
                        if (!text) return null;
                        return (
                          <div style={{ background: "#fffbfd", borderRadius: "12px", padding: "12px 14px", border: "1px solid #fdf2f8" }}>
                            <p style={{ margin: "0 0 4px 0", fontSize: "12px", color: "#8e8e8e" }}>адрес доставки</p>
                            <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>{text}</p>
                          </div>
                        );
                      })()}

                      {/* Итог */}
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "8px", borderTop: "1px solid #fdf2f8" }}>
                        <span style={{ fontSize: "14px", color: "#8e8e8e" }}>итого</span>
                        <strong style={{ fontSize: "18px", color: "#333" }}>{order.total?.toLocaleString("ru-RU")} ₽</strong>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Нижние ссылки */}
        {!loading && (
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "28px" }}>
            <Link href="/cart" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "#f1a7c8", color: "#fff", borderRadius: "40px",
              padding: "12px 24px", fontWeight: 500, fontSize: "15px", textDecoration: "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
                <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
              </svg>
              корзина
            </Link>
            <Link href="/profile" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "transparent", color: "#f1a7c8", border: "1px solid #fce7f3",
              borderRadius: "40px", padding: "12px 24px", fontWeight: 500, fontSize: "15px", textDecoration: "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
              профиль
            </Link>
            <Link href="/" style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              background: "transparent", color: "#f1a7c8", border: "1px solid #fce7f3",
              borderRadius: "40px", padding: "12px 24px", fontWeight: 500, fontSize: "15px", textDecoration: "none",
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              каталог
            </Link>
          </div>
        )}
      </div>
    </>
  );
}
