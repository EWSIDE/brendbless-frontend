"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { USER_COOKIE, getCookie } from "@/lib/cookies";

type User = {
  id: string;
  email: string;
  role: string;
};

export default function AdminPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const rawUser = getCookie(USER_COOKIE);
    if (rawUser) {
      try {
        const userData = JSON.parse(rawUser) as User;
        if (userData.role !== 'ADMIN') {
          router.push("/");
          return;
        }
        setUser(userData);
      } catch {
        router.push("/");
        return;
      }
    } else {
      router.push("/");
      return;
    }
    setLoading(false);
  }, [router]);

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

  if (!user) {
    return null;
  }

  const menuItems = [
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 2L3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
          <line x1="3" y1="6" x2="21" y2="6"/>
          <path d="M16 10a4 4 0 0 1-8 0"/>
        </svg>
      ),
      title: "товары",
      desc: "управление каталогом",
      href: "/admin/products"
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="9" cy="21" r="1"/>
          <circle cx="20" cy="21" r="1"/>
          <path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/>
        </svg>
      ),
      title: "заказы",
      desc: "просмотр и обработка",
      href: "/admin/orders"
    },
    {
      icon: (
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="3"/>
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
        </svg>
      ),
      title: "настройки",
      desc: "конфигурация магазина",
      href: "/admin/settings"
    }
  ];

  return (
    <div style={{ padding: "24px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "32px" }}>
        <div>
          <h1 style={{ fontSize: "32px", fontWeight: 600, marginBottom: "8px", color: "#333", letterSpacing: "-0.5px" }}>управление</h1>
          <p style={{ color: "#8e8e8e", fontSize: "14px" }}>{user.email}</p>
        </div>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>admin</span>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "16px" }}>
        {menuItems.map(item => (
          <Link
            key={item.href}
            href={item.href}
            style={{ textDecoration: "none" }}
          >
            <div className="admin-card">
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "14px",
                background: "linear-gradient(135deg, #fff5f8 0%, #fce7f3 100%)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "16px",
              }}>
                {item.icon}
              </div>
              <h3 style={{ margin: "0 0 4px", fontSize: "16px", color: "#333", fontWeight: 600 }}>{item.title}</h3>
              <p style={{ margin: 0, fontSize: "13px", color: "#8e8e8e" }}>{item.desc}</p>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
