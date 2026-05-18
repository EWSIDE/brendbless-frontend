"use client";

import { useEffect, useState } from "react";
import { getCookie, ACCESS_TOKEN_COOKIE } from "@/lib/cookies";

type Settings = {
  emailVerification: boolean;
  yukassaShopId: string;
  yukassaSecretKey: string;
  yukassaSecretKeyMasked?: string;
  frontendUrl: string;
  shopName: string;
  supportEmail: string;
  telegramManager: string;
  telegramChannel: string;
  yukassaConfigured?: boolean;
  shippingCost: number;
  freeShippingThreshold: number;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    emailVerification: false,
    yukassaShopId: "",
    yukassaSecretKey: "",
    frontendUrl: "",
    shopName: "",
    supportEmail: "",
    telegramManager: "",
    telegramChannel: "",
    shippingCost: 50,
    freeShippingThreshold: 5000,
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [showSecret, setShowSecret] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    loadSettings();
  }, []);

  const getToken = () => getCookie(ACCESS_TOKEN_COOKIE) || "";

  const loadSettings = async () => {
    try {
      const token = getToken();
      const res = await fetch(`${API_URL}/api/settings/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setSettings({
          ...data.data,
          yukassaSecretKey: "",
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    const token = getToken();

    const payload: any = { ...settings };
    if (!payload.yukassaSecretKey) {
      delete payload.yukassaSecretKey;
    }
    delete payload.yukassaSecretKeyMasked;
    delete payload.yukassaConfigured;

    try {
      await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      loadSettings();
    } catch (e) {
      console.error(e);
    }

    setLoading(false);
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "12px 16px",
    border: "1px solid #f3d7e4",
    borderRadius: "12px",
    fontSize: "14px",
    fontFamily: "inherit",
    background: "#fff5f8",
    color: "#2c2430",
    outline: "none",
  };

  const labelStyle: React.CSSProperties = {
    fontSize: "13px",
    fontWeight: 500,
    color: "#5f5160",
    marginBottom: "6px",
    display: "flex",
    alignItems: "center",
    gap: "8px",
  };

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "48px",
    padding: "40px",
    border: "1px solid #fce7f3",
    marginBottom: "24px",
  };

  const iconColor = "#f1a7c8";

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, margin: 0, color: "#333", letterSpacing: "-0.5px" }}>настройки</h1>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>admin</span>
      </div>

      {/* Магазин */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "20px", color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
          магазин
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M20 7H4a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2z"/><path d="M16 3H8l-2 4h12l-2-4z"/></svg>
              название магазина
            </label>
            <input
              style={inputStyle}
              value={settings.shopName}
              onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
              placeholder="BRANDBLESS"
            />
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              email поддержки
            </label>
            <input
              style={inputStyle}
              value={settings.supportEmail}
              onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
              placeholder="support@brandbless.ru"
            />
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/></svg>
              telegram менеджера
            </label>
            <input
              style={inputStyle}
              value={settings.telegramManager}
              onChange={(e) => setSettings((s) => ({ ...s, telegramManager: e.target.value }))}
              placeholder="https://t.me/bless_mng"
            />
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              telegram канал
            </label>
            <input
              style={inputStyle}
              value={settings.telegramChannel}
              onChange={(e) => setSettings((s) => ({ ...s, telegramChannel: e.target.value }))}
              placeholder="https://t.me/brandbless"
            />
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
              url фронтенда
            </label>
            <input
              style={inputStyle}
              value={settings.frontendUrl}
              onChange={(e) => setSettings((s) => ({ ...s, frontendUrl: e.target.value }))}
              placeholder="https://brandbless.ru"
            />
          </div>
        </div>
      </div>

      {/* ЮKassa */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "8px", color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>
          юkassa
        </h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 20px" }}>
          настройки платёжного шлюза для приёма оплаты
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              id магазина (shopId)
            </label>
            <input
              style={inputStyle}
              value={settings.yukassaShopId}
              onChange={(e) => setSettings((s) => ({ ...s, yukassaShopId: e.target.value }))}
              placeholder="123456"
            />
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              секретный ключ
            </label>
            <div style={{ position: "relative" }}>
              <input
                style={inputStyle}
                type={showSecret ? "text" : "password"}
                value={settings.yukassaSecretKey}
                onChange={(e) => setSettings((s) => ({ ...s, yukassaSecretKey: e.target.value }))}
                placeholder={settings.yukassaSecretKeyMasked || "введите секретный ключ"}
              />
              <button
                type="button"
                onClick={() => setShowSecret(!showSecret)}
                style={{
                  position: "absolute",
                  right: "12px",
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "16px",
                }}
              >
                {showSecret ? "🙈" : "👁"}
              </button>
            </div>
            <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
              оставьте пустым, чтобы не менять текущий ключ
            </span>
          </div>

          {/* Status */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
            <span style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: settings.yukassaConfigured ? "#22c55e" : "#ef4444",
            }} />
            <span style={{ color: "#6b7280" }}>
              {settings.yukassaConfigured ? "юkassa подключена" : "юkassa не настроена"}
            </span>
          </div>
        </div>
      </div>

      {/* Доставка */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "8px", color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
          доставка
        </h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 20px" }}>
          стоимость доставки прибавляется к заказу. при 0 ₽ — доставка всегда бесплатная.
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              стоимость доставки (₽)
            </label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={settings.shippingCost}
              onChange={(e) => setSettings((s) => ({ ...s, shippingCost: Number(e.target.value) || 0 }))}
              placeholder="50"
            />
            <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
              поставьте 0 для бесплатной доставки всегда
            </span>
          </div>

          <div>
            <label style={labelStyle}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
              бесплатная доставка от (₽)
            </label>
            <input
              style={inputStyle}
              type="number"
              min="0"
              value={settings.freeShippingThreshold}
              onChange={(e) => setSettings((s) => ({ ...s, freeShippingThreshold: Number(e.target.value) || 0 }))}
              placeholder="5000"
            />
            <span style={{ fontSize: "12px", color: "#9ca3af", marginTop: "4px", display: "block" }}>
              при сумме заказа от этой суммы доставка бесплатная. 0 = порог не используется.
            </span>
          </div>
        </div>
      </div>

      {/* Авторизация */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "20px", color: "#333", display: "flex", alignItems: "center", gap: "10px" }}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
          авторизация
        </h2>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
        }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: "4px", display: "flex", alignItems: "center", gap: "8px" }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke={iconColor} strokeWidth="1.8"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              подтверждение email
            </div>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>требуется код при регистрации</div>
          </div>
          <button
            onClick={() => setSettings((s) => ({ ...s, emailVerification: !s.emailVerification }))}
            style={{
              width: "52px",
              height: "28px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              background: settings.emailVerification ? "#f1a7c8" : "#e5e7eb",
              position: "relative",
              transition: "background 0.2s",
            }}
          >
            <div style={{
              width: "22px",
              height: "22px",
              borderRadius: "50%",
              background: "#fff",
              position: "absolute",
              top: "3px",
              left: settings.emailVerification ? "27px" : "3px",
              transition: "left 0.2s",
            }} />
          </button>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: settings.emailVerification ? "#22c55e" : "#ef4444",
          }} />
          <span style={{ color: "#6b7280" }}>
            {settings.emailVerification ? "включено" : "выключено"}
          </span>
        </div>
      </div>

      {/* Save */}
      <button
        onClick={saveSettings}
        disabled={loading}
        style={{
          width: "100%",
          padding: "20px 40px",
          background: saved ? "#22c55e" : "#f1a7c8",
          color: "#fff",
          border: "none",
          borderRadius: "40px",
          fontSize: "16px",
          fontWeight: 500,
          cursor: "pointer",
          transition: "background 0.2s",
        }}
      >
        {loading ? "сохранение..." : saved ? "✓ сохранено" : "сохранить настройки"}
      </button>
    </div>
  );
}
