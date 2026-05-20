"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { USER_COOKIE, CART_COOKIE, ACCESS_TOKEN_COOKIE, getCookie, setCookie } from "@/lib/cookies";

type UserData = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  role: string;
};

type CartItem = {
  id: number;
  quantity: number;
};

// ─── SVG-иконки ───────────────────────────────────────────────────
function IconOrders() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
      <rect x="9" y="3" width="6" height="4" rx="1"/>
      <line x1="9" y1="12" x2="15" y2="12"/>
      <line x1="9" y1="16" x2="13" y2="16"/>
    </svg>
  );
}

function IconCart() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="9" cy="21" r="1"/>
      <circle cx="20" cy="21" r="1"/>
      <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
    </svg>
  );
}

function IconSettings() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

function IconChevron() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#d4a0b5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 18l6-6-6-6"/>
    </svg>
  );
}

type MissingSizeItem = {
  itemId: string;
  productName: string;
  productImage: string | null;
  orderNumber: string;
  availableSizes: string[];
};

export default function ProfilePage() {
  const router = useRouter();
  const [user, setUser] = useState<UserData | null>(null);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  // Missing sizes state
  const [missingSizeItems, setMissingSizeItems] = useState<MissingSizeItem[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<Record<string, string>>({});
  const [sizeSaving, setSizeSaving] = useState<string | null>(null);
  const [sizeSuccess, setSizeSuccess] = useState<string | null>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    const rawUser = getCookie(USER_COOKIE);
    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser);
        setUser(parsed);
        setFirstName(parsed.firstName || "");
        setLastName(parsed.lastName || "");
        setPhone(parsed.phone || "");
      } catch {
        setUser(null);
      }
    }

    const savedAddress = localStorage.getItem("delivery_address") || "";
    setAddress(savedAddress);

    const token = getCookie(ACCESS_TOKEN_COOKIE);
    if (token) {
      fetch(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then((result) => {
          if (result.success && result.data) {
            const apiUser = result.data;
            setUser(apiUser);
            setFirstName(apiUser.firstName || "");
            setLastName(apiUser.lastName || "");
            setPhone(apiUser.phone || "");
            setCookie(USER_COOKIE, JSON.stringify(apiUser));
          }
        })
        .catch(() => {});
    }

    const rawCart = getCookie(CART_COOKIE);
    if (rawCart) {
      try {
        setCartItems(JSON.parse(rawCart) as CartItem[]);
      } catch {
        setCartItems([]);
      }
    }
    setLoading(false);

    // Check for orders with missing sizes
    if (token) {
      fetch(`${API_URL}/api/orders/my-orders?limit=50`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((r) => r.json())
        .then(async (result) => {
          if (result.success && result.orders) {
            const missing: MissingSizeItem[] = [];
            for (const order of result.orders) {
              // Only check paid orders that are not cancelled
              if (order.paymentStatus !== "PAID" || order.status === "CANCELLED") continue;
              const items = order.items || order.OrderItem || [];
              for (const item of items) {
                if (!item.size || item.size.trim() === "") {
                  // Fetch product sizes
                  let sizes: string[] = [];
                  try {
                    const pRes = await fetch(`${API_URL}/api/products/${item.productId}`);
                    const pData = await pRes.json();
                    if (pData.product?.attributes?.sizes) {
                      const s = pData.product.attributes.sizes;
                      if (Array.isArray(s)) sizes = s.map(String);
                      else if (typeof s === "string") sizes = s.split(",").map((v: string) => v.trim()).filter(Boolean);
                    } else if (pData.product?.tags) {
                      try {
                        const parsed = JSON.parse(pData.product.tags);
                        if (Array.isArray(parsed)) sizes = parsed.map(String);
                      } catch {
                        sizes = pData.product.tags.split(",").map((v: string) => v.trim()).filter(Boolean);
                      }
                    }
                  } catch {}
                  if (sizes.length === 0) sizes = ["XS", "S", "M", "L"];
                  missing.push({
                    itemId: item.id,
                    productName: item.productName,
                    productImage: item.productImage,
                    orderNumber: order.orderNumber,
                    availableSizes: sizes,
                  });
                }
              }
            }
            setMissingSizeItems(missing);
          }
        })
        .catch(() => {});
    }
  }, []);

  const handleSizeSubmit = async (itemId: string) => {
    const size = selectedSizes[itemId];
    if (!size) return;
    setSizeSaving(itemId);
    const token = getCookie(ACCESS_TOKEN_COOKIE);
    try {
      const res = await fetch(`${API_URL}/api/orders/items/${itemId}/size`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ size }),
      });
      const data = await res.json();
      if (data.success) {
        setSizeSuccess(itemId);
        setTimeout(() => {
          setMissingSizeItems((prev) => prev.filter((i) => i.itemId !== itemId));
          setSizeSuccess(null);
        }, 1500);
      }
    } catch {}
    setSizeSaving(null);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setMessage("");

    const token = getCookie(ACCESS_TOKEN_COOKIE);
    if (!token) {
      setError("не авторизованы");
      setSaving(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/auth/profile`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ firstName, lastName, phone }),
      });

      const result = await response.json();

      if (result.success && result.data) {
        setUser(result.data);
        setCookie(USER_COOKIE, JSON.stringify(result.data));
        localStorage.setItem("delivery_address", address);
        setMessage("сохранено ✓");
        setEditing(false);
        setTimeout(() => setMessage(""), 2000);
      } else {
        setError(result.error || "ошибка сохранения");
      }
    } catch {
      setError("ошибка соединения");
    }

    setSaving(false);
  };

  if (loading) {
    return (
      <section className="profile-shell">
        <div className="profile-card" style={{ textAlign: "center", padding: "60px 40px" }}>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: 28, height: 28, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          </div>
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </section>
    );
  }

  if (!user) {
    return (
      <section className="auth-shell">
        <div className="card auth-form">
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div style={{
              width: "64px",
              height: "64px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 100%)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto 16px",
            }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                <circle cx="12" cy="7" r="4"/>
              </svg>
            </div>
            <h1 style={{ fontSize: "28px", fontWeight: 600, color: "#333", margin: "0 0 8px 0", letterSpacing: "-0.5px" }}>войдите в аккаунт</h1>
            <p style={{ color: "#8e8e8e", fontSize: "15px", margin: 0 }}>чтобы видеть профиль и заказы</p>
          </div>
          <Link href="/login" className="email-btn" style={{ display: "block", textAlign: "center", marginBottom: "12px" }}>войти</Link>
          <Link href="/register" style={{ display: "block", textAlign: "center", color: "#f1a7c8", fontSize: "14px", textDecoration: "underline" }}>зарегистрироваться</Link>
        </div>
      </section>
    );
  }

  const cartCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);
  const displayName = [user.firstName, user.lastName].filter(Boolean).join(" ") || user.email;

  return (
    <>
      <style>{`
        .profile-shell {
          max-width: 960px;
          margin: 0 auto;
          padding: 24px 16px 48px;
        }
        .profile-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 20px;
        }
        @media (min-width: 768px) {
          .profile-grid {
            grid-template-columns: 280px 1fr;
            align-items: start;
          }
        }
        .profile-sidebar {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .profile-card {
          background: #fff;
          border: 1px solid #fdf2f8;
          border-radius: 24px;
          padding: 28px 24px;
        }
        .profile-menu-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 14px 18px;
          border-radius: 16px;
          background: #fffbfd;
          border: 1px solid #fdf2f8;
          color: #333;
          font-size: 15px;
          transition: background 0.2s;
          text-decoration: none;
        }
        .profile-menu-link:hover {
          background: #fff5f8;
        }
        @media (max-width: 767px) {
          .profile-shell {
            padding: 16px 12px 80px;
          }
          .profile-card {
            padding: 20px 16px;
            border-radius: 20px;
          }
        }
      `}</style>

      <section className="profile-shell">
        {/* Шапка */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "24px" }}>
          <button
            type="button"
            onClick={() => router.back()}
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
          <h1 style={{ margin: 0, fontSize: "28px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>мой профиль</h1>
        </div>

        {/* ⚠️ Missing size warning */}
        {missingSizeItems.length > 0 && (
          <div style={{
            marginBottom: "20px",
            padding: "20px 24px",
            background: "linear-gradient(135deg, #fff1f5 0%, #ffe4ec 100%)",
            border: "2px solid #f9a8d4",
            borderRadius: "20px",
            animation: "pulse-border 2s ease-in-out infinite",
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#e05" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
                <line x1="12" y1="9" x2="12" y2="13"/>
                <line x1="12" y1="17" x2="12.01" y2="17"/>
              </svg>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: 600, color: "#c0245e" }}>
                укажите размер для ваших заказов!
              </h3>
            </div>
            <p style={{ margin: "0 0 16px 0", fontSize: "14px", color: "#7a2048", lineHeight: 1.5 }}>
              в некоторых ваших оплаченных заказах не указан размер. пожалуйста, выберите размер для каждого товара, чтобы мы могли отправить правильный.
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {missingSizeItems.map((item) => (
                <div key={item.itemId} style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 16px",
                  background: "#fff",
                  borderRadius: "14px",
                  border: "1px solid #fce7f3",
                  flexWrap: "wrap",
                }}>
                  {item.productImage && (
                    <img
                      src={item.productImage}
                      alt={item.productName}
                      style={{ width: "44px", height: "44px", borderRadius: "10px", objectFit: "cover", flexShrink: 0 }}
                    />
                  )}
                  <div style={{ flex: 1, minWidth: "120px" }}>
                    <p style={{ margin: 0, fontSize: "14px", fontWeight: 600, color: "#333" }}>{item.productName}</p>
                    <p style={{ margin: 0, fontSize: "12px", color: "#8e8e8e" }}>заказ #{item.orderNumber}</p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap" }}>
                    {sizeSuccess === item.itemId ? (
                      <span style={{ fontSize: "13px", color: "#16a34a", fontWeight: 600 }}>✓ сохранено</span>
                    ) : (
                      <>
                        {item.availableSizes.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => setSelectedSizes((prev) => ({ ...prev, [item.itemId]: s }))}
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "50%",
                              border: selectedSizes[item.itemId] === s ? "2px solid #f1a7c8" : "1.5px solid #e5c7d6",
                              background: selectedSizes[item.itemId] === s ? "#f1a7c8" : "#fff",
                              color: selectedSizes[item.itemId] === s ? "#fff" : "#f1a7c8",
                              fontSize: "11px",
                              fontWeight: 600,
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              padding: 0,
                              transition: "all 0.15s",
                            }}
                          >
                            {s}
                          </button>
                        ))}
                        <button
                          type="button"
                          onClick={() => handleSizeSubmit(item.itemId)}
                          disabled={!selectedSizes[item.itemId] || sizeSaving === item.itemId}
                          style={{
                            padding: "6px 14px",
                            borderRadius: "20px",
                            border: "none",
                            background: selectedSizes[item.itemId] ? "#f1a7c8" : "#e5c7d6",
                            color: "#fff",
                            fontSize: "12px",
                            fontWeight: 600,
                            cursor: selectedSizes[item.itemId] ? "pointer" : "not-allowed",
                            opacity: selectedSizes[item.itemId] ? 1 : 0.5,
                            marginLeft: "4px",
                          }}
                        >
                          {sizeSaving === item.itemId ? "..." : "ок"}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
            <style>{`
              @keyframes pulse-border {
                0%, 100% { border-color: #f9a8d4; }
                50% { border-color: #f472b6; }
              }
            `}</style>
          </div>
        )}

        <div className="profile-grid">
          {/* Левая колонка — аватар + меню */}
          <div className="profile-sidebar">
            {/* Аватар */}
            <div className="profile-card" style={{ textAlign: "center" }}>
              <div style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 50%, #f9a8d4 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto 14px",
                fontSize: "28px",
                color: "#fff",
                fontWeight: 600,
              }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <p style={{ fontSize: "17px", color: "#333", margin: "0 0 4px 0", fontWeight: 600 }}>{displayName}</p>
              <p style={{ fontSize: "13px", color: "#8e8e8e", margin: 0 }}>{user.email}</p>
            </div>

            {/* Меню */}
            <Link href="/orders" className="profile-menu-link">
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <IconOrders />
                мои заказы
              </span>
              <IconChevron />
            </Link>

            <Link href="/cart" className="profile-menu-link">
              <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <IconCart />
                корзина
                {cartCount > 0 && (
                  <span style={{
                    background: "#f1a7c8",
                    color: "white",
                    fontSize: "11px",
                    fontWeight: 600,
                    width: "20px",
                    height: "20px",
                    borderRadius: "50%",
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    {cartCount}
                  </span>
                )}
              </span>
              <IconChevron />
            </Link>

            {user.role === "ADMIN" && (
              <Link href="/admin" className="profile-menu-link">
                <span style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <IconSettings />
                  управление
                </span>
                <IconChevron />
              </Link>
            )}
          </div>

          {/* Правая колонка — данные */}
          <div className="profile-card">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <h2 style={{ margin: 0, fontSize: "17px", fontWeight: 600, color: "#333" }}>данные для доставки</h2>
              {!editing && (
                <button
                  type="button"
                  onClick={() => setEditing(true)}
                  style={{
                    background: "transparent",
                    border: "1px solid #fce7f3",
                    borderRadius: "20px",
                    padding: "6px 16px",
                    cursor: "pointer",
                    fontSize: "13px",
                    color: "#f1a7c8",
                    boxShadow: "none",
                  }}
                >
                  редактировать
                </button>
              )}
            </div>

            {editing ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <label className="field">
                    <span>имя</span>
                    <input
                      type="text"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      placeholder="ваше имя"
                    />
                  </label>
                  <label className="field">
                    <span>фамилия</span>
                    <input
                      type="text"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      placeholder="ваша фамилия"
                    />
                  </label>
                </div>
                <label className="field">
                  <span>телефон</span>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+7 (___) ___-__-__"
                  />
                </label>
                <label className="field">
                  <span>адрес доставки</span>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    placeholder="город, улица, дом, квартира"
                  />
                </label>

                {error && <p className="notice error">{error}</p>}
                {message && <p className="notice success">{message}</p>}

                <div style={{ display: "flex", gap: "8px", marginTop: "4px" }}>
                  <button
                    type="button"
                    onClick={handleSave}
                    disabled={saving}
                    className="email-btn"
                    style={{ flex: 1, textAlign: "center", padding: "14px 24px", fontSize: "14px" }}
                  >
                    {saving ? "сохранение..." : "сохранить"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(false);
                      setFirstName(user.firstName || "");
                      setLastName(user.lastName || "");
                      setPhone(user.phone || "");
                      setAddress(localStorage.getItem("delivery_address") || "");
                      setError("");
                    }}
                    style={{
                      flex: 1,
                      background: "transparent",
                      border: "1px solid #fce7f3",
                      borderRadius: "40px",
                      padding: "14px 24px",
                      cursor: "pointer",
                      fontSize: "14px",
                      color: "#5d4c5a",
                    }}
                  >
                    отмена
                  </button>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "12px 16px", background: "#fffbfd", borderRadius: "12px", border: "1px solid #fdf2f8" }}>
                    <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 2px 0" }}>имя</p>
                    <p style={{ fontSize: "15px", color: "#333", margin: 0 }}>{user.firstName || "—"}</p>
                  </div>
                  <div style={{ padding: "12px 16px", background: "#fffbfd", borderRadius: "12px", border: "1px solid #fdf2f8" }}>
                    <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 2px 0" }}>фамилия</p>
                    <p style={{ fontSize: "15px", color: "#333", margin: 0 }}>{user.lastName || "—"}</p>
                  </div>
                </div>
                <div style={{ padding: "12px 16px", background: "#fffbfd", borderRadius: "12px", border: "1px solid #fdf2f8" }}>
                  <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 2px 0" }}>телефон</p>
                  <p style={{ fontSize: "15px", color: "#333", margin: 0 }}>{user.phone || "—"}</p>
                </div>
                <div style={{ padding: "12px 16px", background: "#fffbfd", borderRadius: "12px", border: "1px solid #fdf2f8" }}>
                  <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 2px 0" }}>адрес доставки</p>
                  <p style={{ fontSize: "15px", color: "#333", margin: 0 }}>{address || "—"}</p>
                </div>
                <div style={{ padding: "12px 16px", background: "#fffbfd", borderRadius: "12px", border: "1px solid #fdf2f8" }}>
                  <p style={{ fontSize: "12px", color: "#8e8e8e", margin: "0 0 2px 0" }}>email</p>
                  <p style={{ fontSize: "15px", color: "#333", margin: 0 }}>{user.email}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
