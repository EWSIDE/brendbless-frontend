"use client";

import { useEffect, useState } from "react";
import { getCookie, ACCESS_TOKEN_COOKIE } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type OrderItem = { id: string; productName: string; size?: string | null; quantity: number; unitPrice: number; total: number; productImage?: string | null };
type Order = {
  id: string;
  orderNumber: string;
  status: string;
  paymentStatus: string;
  total: number;
  createdAt: string;
  shippingAddress?: string | null;
  notes?: string | null;
  User?: { email: string; firstName?: string | null; lastName?: string | null };
  items?: OrderItem[];
  OrderItem?: OrderItem[];
};

const STATUSES = [
  { value: "PENDING", label: "принят", color: "#be185d", bg: "#fce7f3" },
  { value: "PROCESSING", label: "собирается", color: "#be185d", bg: "#fce7f3" },
  { value: "IN_TRANSIT", label: "в пути", color: "#92400e", bg: "#fef3c7" },
  { value: "READY", label: "готов к выдаче", color: "#166534", bg: "#dcfce7" },
  { value: "CANCELLED", label: "отменён", color: "#991b1b", bg: "#fee2e2" },
  { value: "DELAYED", label: "задерживается", color: "#991b1b", bg: "#fee2e2" },
];

function getStatusInfo(status: string) {
  return STATUSES.find((s) => s.value === status) || { value: status, label: status.toLowerCase(), color: "#5d4c5a", bg: "#fdf2f8" };
}

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [sizePicking, setSizePicking] = useState<string | null>(null); // itemId being edited
  const [savingSize, setSavingSize] = useState<string | null>(null);

  const getToken = () => getCookie(ACCESS_TOKEN_COOKIE) || "";

  useEffect(() => {
    loadOrders();
  }, []);

  async function loadOrders() {
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/orders/admin/all?limit=1000`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) {
        const allOrders = data.orders || data.data?.orders || [];
        setOrders(allOrders.filter((o: Order) => o.paymentStatus === "PAID"));
      }
    } catch (e) {
      console.error(e);
    }
    setLoading(false);
  }

  async function updateStatus(orderId: string, newStatus: string) {
    setUpdatingId(orderId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/${orderId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o)));
      }
    } catch (e) {
      console.error(e);
    }
    setUpdatingId(null);
  }

  async function saveItemSize(itemId: string, size: string) {
    setSavingSize(itemId);
    try {
      const res = await fetch(`${API_BASE}/api/orders/admin/items/${itemId}/size`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${getToken()}`,
        },
        body: JSON.stringify({ size: size + " ✎" }),
      });
      if (res.ok) {
        // Update local state
        setOrders((prev) => prev.map(o => ({
          ...o,
          items: o.items?.map(i => i.id === itemId ? { ...i, size: size + " ✎" } : i),
          OrderItem: o.OrderItem?.map(i => i.id === itemId ? { ...i, size: size + " ✎" } : i),
        })));
        setSizePicking(null);
      }
    } catch (e) {
      console.error(e);
    }
    setSavingSize(null);
  }

  function parseAddress(raw: string | null | undefined) {
    if (!raw) return null;
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  if (loading) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  return (
    <div style={{ padding: "24px", maxWidth: "1200px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 4px", letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            заказы
          </h1>
          <p style={{ margin: 0, fontSize: "14px", color: "#8e8e8e" }}>{orders.length} заказов</p>
        </div>
        <button
          onClick={loadOrders}
          style={{
            background: "#fce7f3",
            border: "none",
            borderRadius: "12px",
            padding: "10px 18px",
            cursor: "pointer",
            fontSize: "13px",
            color: "#f1a7c8",
            fontWeight: 600,
          }}
        >
          обновить
        </button>
      </div>

      {/* Orders list */}
      {orders.length === 0 ? (
        <div style={{ textAlign: "center", padding: "60px 20px", color: "#9ca3af" }}>
          <p style={{ fontSize: "18px", fontWeight: 600 }}>заказов пока нет</p>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {orders.map((order) => {
            const st = getStatusInfo(order.status);
            const isOpen = expandedId === order.id;
            const items = order.items || order.OrderItem || [];
            const addr = parseAddress(order.shippingAddress);
            const isUpdating = updatingId === order.id;
            const hasMissingSize = items.some(i => !i.size || i.size.trim() === "");

            return (
              <div
                key={order.id}
                style={{
                  background: hasMissingSize ? "#fffbeb" : "#fff",
                  border: hasMissingSize ? "2px solid #f59e0b" : "1px solid #fdf2f8",
                  borderRadius: "20px",
                  overflow: "hidden",
                  transition: "border-color 0.2s",
                }}
              >
                {/* Header row */}
                <div
                  onClick={() => setExpandedId(isOpen ? null : order.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    padding: "16px 20px",
                    cursor: "pointer",
                    gap: "12px",
                  }}
                >
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                      <span style={{ fontWeight: 700, fontSize: "15px", color: "#333" }}>
                        №{order.orderNumber}
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
                      {order.paymentStatus === "PAID" && (
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "#dcfce7", color: "#166534" }}>
                          оплачен
                        </span>
                      )}
                      {hasMissingSize && (
                        <span style={{ fontSize: "11px", fontWeight: 600, padding: "2px 8px", borderRadius: "20px", background: "#fef3c7", color: "#92400e" }}>
                          ⚠️ нет размера
                        </span>
                      )}
                    </div>
                    <p style={{ margin: "4px 0 0", fontSize: "13px", color: "#8e8e8e" }}>
                      {new Date(order.createdAt).toLocaleDateString("ru-RU", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                      {order.User && ` · ${order.User.email}`}
                    </p>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexShrink: 0 }}>
                    <span style={{ fontWeight: 700, fontSize: "16px", color: "#333" }}>
                      {order.total?.toLocaleString("ru-RU")} ₽
                    </span>
                    <svg
                      width="16" height="16" viewBox="0 0 24 24" fill="none"
                      stroke="#d4a0b5" strokeWidth="2" strokeLinecap="round"
                      style={{ transform: isOpen ? "rotate(90deg)" : "rotate(0deg)", transition: "transform 0.2s" }}
                    >
                      <path d="M9 18l6-6-6-6"/>
                    </svg>
                  </div>
                </div>

                {/* Expanded details */}
                {isOpen && (
                  <div style={{ borderTop: "1px solid #fdf2f8", padding: "16px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>
                    {/* Status changer */}
                    <div>
                      <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>изменить статус:</p>
                      <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                        {STATUSES.map((s) => (
                          <button
                            key={s.value}
                            onClick={() => updateStatus(order.id, s.value)}
                            disabled={isUpdating || order.status === s.value}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "20px",
                              border: order.status === s.value ? `2px solid ${s.color}` : "1px solid #e5e7eb",
                              background: order.status === s.value ? s.bg : "#fff",
                              color: s.color,
                              fontSize: "12px",
                              fontWeight: 600,
                              cursor: order.status === s.value ? "default" : "pointer",
                              opacity: isUpdating ? 0.5 : 1,
                              transition: "all 0.15s",
                            }}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Items */}
                    {items.length > 0 && (
                      <div>
                        <p style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: 600, color: "#6b7280" }}>товары:</p>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                          {items.map((item) => {
                            const isAdminSet = item.size?.includes("✎");
                            const displaySize = item.size?.replace(" ✎", "") || null;
                            const hasNoSize = !item.size || item.size.trim() === "";
                            const isPickingThis = sizePicking === item.id;
                            const isSavingThis = savingSize === item.id;

                            return (
                              <div key={item.id} style={{ display: "flex", flexDirection: "column", gap: "6px", padding: "8px 0", borderBottom: "1px solid #fdf2f8" }}>
                                <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                                  <div style={{
                                    width: "40px", height: "40px", borderRadius: "8px",
                                    background: "#fdf2f8", overflow: "hidden", flexShrink: 0,
                                    display: "flex", alignItems: "center", justifyContent: "center",
                                  }}>
                                    {item.productImage ? (
                                      <img src={item.productImage} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                    ) : (
                                      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#f1a7c8" strokeWidth="1.8">
                                        <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                                      </svg>
                                    )}
                                  </div>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                                      <p style={{ margin: 0, fontSize: "13px", fontWeight: 600, color: "#333" }}>{item.productName}</p>
                                      {displaySize && (
                                        <span style={{
                                          display: "inline-flex",
                                          alignItems: "center",
                                          gap: "4px",
                                          padding: "2px 10px",
                                          borderRadius: "8px",
                                          background: isAdminSet ? "#fef3c7" : "#fce7f3",
                                          color: isAdminSet ? "#92400e" : "#be185d",
                                          fontWeight: 700,
                                          fontSize: "12px",
                                        }}>
                                          {displaySize}
                                          {isAdminSet && <span style={{ fontSize: "10px", opacity: 0.7 }}>✎</span>}
                                        </span>
                                      )}
                                      {hasNoSize && !isPickingThis && (
                                        <button
                                          onClick={() => setSizePicking(item.id)}
                                          style={{
                                            padding: "2px 10px",
                                            borderRadius: "8px",
                                            border: "1.5px dashed #f59e0b",
                                            background: "#fffbeb",
                                            color: "#92400e",
                                            fontSize: "11px",
                                            fontWeight: 600,
                                            cursor: "pointer",
                                          }}
                                        >
                                          ⚠️ указать размер
                                        </button>
                                      )}
                                    </div>
                                    <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#8e8e8e" }}>× {item.quantity} · {item.unitPrice} ₽</p>
                                  </div>
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#333" }}>{item.total} ₽</span>
                                </div>
                                {/* Size picker */}
                                {isPickingThis && (
                                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginLeft: "50px", alignItems: "center" }}>
                                    {["XS", "S", "M", "L", "XL"].map(s => (
                                      <button
                                        key={s}
                                        onClick={() => saveItemSize(item.id, s)}
                                        disabled={isSavingThis}
                                        style={{
                                          padding: "5px 14px",
                                          borderRadius: "8px",
                                          border: "1px solid #f1a7c8",
                                          background: "#fff",
                                          color: "#be185d",
                                          fontSize: "12px",
                                          fontWeight: 700,
                                          cursor: isSavingThis ? "wait" : "pointer",
                                          opacity: isSavingThis ? 0.5 : 1,
                                          transition: "all 0.15s",
                                        }}
                                      >
                                        {s}
                                      </button>
                                    ))}
                                    <button
                                      onClick={() => setSizePicking(null)}
                                      style={{
                                        padding: "5px 10px",
                                        border: "none",
                                        background: "transparent",
                                        color: "#9ca3af",
                                        fontSize: "12px",
                                        cursor: "pointer",
                                      }}
                                    >
                                      отмена
                                    </button>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}

                    {/* Address */}
                    {addr && (
                      <div style={{ background: "#fffbfd", borderRadius: "12px", padding: "12px 14px", border: "1px solid #fdf2f8" }}>
                        <p style={{ margin: "0 0 4px", fontSize: "12px", color: "#8e8e8e" }}>адрес доставки</p>
                        <p style={{ margin: 0, fontSize: "14px", color: "#333" }}>
                          {[addr.fullName, addr.phone, addr.city, addr.address].filter(Boolean).join(", ")}
                        </p>
                        {addr.comment && <p style={{ margin: "4px 0 0", fontSize: "12px", color: "#6b7280" }}>💬 {addr.comment}</p>}
                      </div>
                    )}

                    {/* Notes */}
                    {order.notes && (
                      <div style={{ fontSize: "13px", color: "#6b7280" }}>
                        <strong>заметка:</strong> {order.notes}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
