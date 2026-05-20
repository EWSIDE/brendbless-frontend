"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { getCookie, ACCESS_TOKEN_COOKIE, USER_COOKIE } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

type Metrics = { totalRevenue: number; totalOrders: number; averageCheck: number };
type ChartPoint = { date: string; revenue: number; orders: number };
type TopProduct = { productName: string; totalQuantity: number; totalRevenue: number };
type ItemToOrder = { productName: string; size: string | null; quantity: number };
type StatusCount = { status: string; count: number };
type SizeStat = { size: string; quantity: number };

type StatsData = {
  metrics: Metrics;
  chartData: ChartPoint[];
  topProducts: TopProduct[];
  itemsToOrder: ItemToOrder[];
  byStatus: StatusCount[];
  sizeStats: SizeStat[];
};

const PERIODS = [
  { value: "7d", label: "7 дней" },
  { value: "30d", label: "30 дней" },
  { value: "90d", label: "3 месяца" },
  { value: "all", label: "всё время" },
];

const STATUS_LABELS: Record<string, string> = {
  PENDING: "принят",
  PROCESSING: "собирается",
  IN_TRANSIT: "в пути",
  READY: "готов к выдаче",
  CANCELLED: "отменён",
  DELAYED: "задерживается",
};

export default function AdminStatsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("30d");
  const [data, setData] = useState<StatsData | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const rawUser = getCookie(USER_COOKIE);
    if (rawUser) {
      try {
        const u = JSON.parse(rawUser);
        if (u.role !== "ADMIN") { router.push("/"); return; }
      } catch { router.push("/"); return; }
    } else { router.push("/"); return; }
  }, [router]);

  useEffect(() => {
    loadStats();
  }, [period]);

  async function loadStats() {
    setLoading(true);
    setError(null);
    try {
      const token = getCookie(ACCESS_TOKEN_COOKIE);
      const res = await fetch(`${API_BASE}/api/orders/admin/statistics?period=${period}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      } else {
        setError(json.error || "ошибка загрузки");
      }
    } catch (e) {
      setError("ошибка соединения");
    }
    setLoading(false);
  }

  if (loading && !data) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const maxRevenue = data ? Math.max(...data.chartData.map(d => d.revenue), 1) : 1;

  return (
    <div style={{ padding: "24px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <Link href="/admin" style={{ display: "flex", alignItems: "center", padding: "8px", borderRadius: "10px", background: "#fff5f8", textDecoration: "none" }}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2"><path d="M19 12H5M12 19l-7-7 7-7"/></svg>
          </Link>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: 0, letterSpacing: "-0.5px", display: "flex", alignItems: "center", gap: "10px" }}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 20V10M12 20V4M6 20v-6"/>
              </svg>
              статистика
            </h1>
          </div>
        </div>
        {/* Period selector */}
        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              style={{
                padding: "7px 16px",
                borderRadius: "20px",
                border: period === p.value ? "2px solid #f1a7c8" : "1px solid #e5e7eb",
                background: period === p.value ? "#fff5f8" : "#fff",
                color: period === p.value ? "#be185d" : "#6b7280",
                fontSize: "13px",
                fontWeight: 600,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div style={{ background: "#fee2e2", border: "1px solid #fecaca", borderRadius: "16px", padding: "14px 18px", color: "#991b1b", fontSize: "14px", marginBottom: "20px" }}>
          {error}
        </div>
      )}

      {data && (
        <>
          {/* Metrics cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "28px" }}>
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#8e8e8e" }}>💰 выручка</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#333" }}>{data.metrics.totalRevenue.toLocaleString("ru-RU")} ₽</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#8e8e8e" }}>📦 заказов</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#333" }}>{data.metrics.totalOrders}</p>
            </div>
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px" }}>
              <p style={{ margin: "0 0 6px", fontSize: "13px", color: "#8e8e8e" }}>🧾 средний чек</p>
              <p style={{ margin: 0, fontSize: "28px", fontWeight: 700, color: "#333" }}>{data.metrics.averageCheck.toLocaleString("ru-RU")} ₽</p>
            </div>
          </div>

          {/* Chart */}
          {data.chartData.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
              <p style={{ margin: "0 0 16px", fontSize: "15px", fontWeight: 600, color: "#333" }}>выручка по дням</p>
              <div style={{ display: "flex", alignItems: "flex-end", gap: "3px", height: "160px", overflow: "hidden" }}>
                {data.chartData.map((point, i) => {
                  const height = Math.max((point.revenue / maxRevenue) * 140, 4);
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "flex-end", height: "100%" }}>
                      <div
                        title={`${point.date}: ${point.revenue.toLocaleString("ru-RU")} ₽ (${point.orders} зак.)`}
                        style={{
                          width: "100%",
                          maxWidth: "32px",
                          height: `${height}px`,
                          background: "linear-gradient(180deg, #f9a8d4 0%, #fce7f3 100%)",
                          borderRadius: "6px 6px 2px 2px",
                          transition: "height 0.3s",
                          cursor: "pointer",
                          minWidth: "6px",
                        }}
                      />
                      {data.chartData.length <= 14 && (
                        <span style={{ fontSize: "10px", color: "#8e8e8e", marginTop: "4px", whiteSpace: "nowrap" }}>
                          {point.date.slice(5)}
                        </span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Status distribution */}
          {data.byStatus.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
              <p style={{ margin: "0 0 12px", fontSize: "15px", fontWeight: 600, color: "#333" }}>по статусам</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {data.byStatus.map(s => (
                  <span key={s.status} style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    background: "#fff5f8",
                    border: "1px solid #fce7f3",
                    fontSize: "13px",
                    color: "#333",
                    fontWeight: 500,
                  }}>
                    {STATUS_LABELS[s.status] || s.status} — <strong>{s.count}</strong>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Items to order - MAIN FEATURE */}
          {data.itemsToOrder.length > 0 && (
            <div style={{ background: "#fff", border: "2px solid #fce7f3", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
              <p style={{ margin: "0 0 4px", fontSize: "15px", fontWeight: 700, color: "#be185d" }}>🛒 нужно заказать</p>
              <p style={{ margin: "0 0 14px", fontSize: "12px", color: "#8e8e8e" }}>товары из оплаченных заказов, которые ещё не отправлены</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #fdf2f8" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>товар</th>
                      <th style={{ textAlign: "center", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>размер</th>
                      <th style={{ textAlign: "center", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>кол-во</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.itemsToOrder.map((item, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #fdf2f8" }}>
                        <td style={{ padding: "10px 12px", color: "#333", fontWeight: 500 }}>{item.productName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center" }}>
                          {item.size ? (
                            <span style={{
                              display: "inline-block",
                              padding: "3px 12px",
                              borderRadius: "8px",
                              background: "#fce7f3",
                              color: "#be185d",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}>
                              {item.size}
                            </span>
                          ) : (
                            <span style={{ color: "#9ca3af" }}>—</span>
                          )}
                        </td>
                        <td style={{ padding: "10px 12px", textAlign: "center", fontWeight: 700, color: "#333", fontSize: "15px" }}>{item.quantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Top products */}
          {data.topProducts.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 600, color: "#333" }}>🏆 топ товаров</p>
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "14px" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #fdf2f8" }}>
                      <th style={{ textAlign: "left", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>товар</th>
                      <th style={{ textAlign: "center", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>продано</th>
                      <th style={{ textAlign: "right", padding: "8px 12px", color: "#6b7280", fontWeight: 600, fontSize: "12px" }}>выручка</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid #fdf2f8" }}>
                        <td style={{ padding: "10px 12px", color: "#333", fontWeight: 500 }}>{p.productName}</td>
                        <td style={{ padding: "10px 12px", textAlign: "center", color: "#6b7280" }}>{p.totalQuantity} шт.</td>
                        <td style={{ padding: "10px 12px", textAlign: "right", fontWeight: 700, color: "#333" }}>{p.totalRevenue.toLocaleString("ru-RU")} ₽</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Size stats */}
          {data.sizeStats.length > 0 && (
            <div style={{ background: "#fff", border: "1px solid #fdf2f8", borderRadius: "20px", padding: "20px", marginBottom: "28px" }}>
              <p style={{ margin: "0 0 14px", fontSize: "15px", fontWeight: 600, color: "#333" }}>📐 популярные размеры</p>
              <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                {data.sizeStats.map((s, i) => (
                  <div key={i} style={{
                    padding: "8px 16px",
                    borderRadius: "12px",
                    background: i === 0 ? "#fce7f3" : "#fff5f8",
                    border: "1px solid #fce7f3",
                    textAlign: "center",
                  }}>
                    <span style={{ fontSize: "16px", fontWeight: 700, color: "#be185d" }}>{s.size}</span>
                    <span style={{ fontSize: "12px", color: "#6b7280", marginLeft: "6px" }}>{s.quantity} шт.</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Empty state */}
          {data.metrics.totalOrders === 0 && (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "#9ca3af" }}>
              <p style={{ fontSize: "16px" }}>нет данных за выбранный период</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
