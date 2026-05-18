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
  yukassaConfigured?: boolean;
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
          yukassaSecretKey: "", // Don't load actual key, show masked
        });
      }
    } catch (e) {
      console.error(e);
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    const token = getToken();

    // Only send yukassaSecretKey if user typed a new one
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
      // Reload to get masked key
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
    display: "block",
  };

  const sectionStyle: React.CSSProperties = {
    background: "#fff",
    borderRadius: "48px",
    padding: "40px",
    border: "1px solid #fce7f3",
    marginBottom: "24px",
  };

  return (
    <div style={{ padding: "24px", maxWidth: "700px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, margin: 0, color: "#333", letterSpacing: "-0.5px" }}>настройки</h1>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>admin</span>
      </div>

      {/* Магазин */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "20px", color: "#333" }}>
          🏪 магазин
        </h2>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>название магазина</label>
            <input
              style={inputStyle}
              value={settings.shopName}
              onChange={(e) => setSettings((s) => ({ ...s, shopName: e.target.value }))}
              placeholder="BRANDBLESS"
            />
          </div>

          <div>
            <label style={labelStyle}>email поддержки</label>
            <input
              style={inputStyle}
              value={settings.supportEmail}
              onChange={(e) => setSettings((s) => ({ ...s, supportEmail: e.target.value }))}
              placeholder="support@brandbless.ru"
            />
          </div>

          <div>
            <label style={labelStyle}>telegram менеджера</label>
            <input
              style={inputStyle}
              value={settings.telegramManager}
              onChange={(e) => setSettings((s) => ({ ...s, telegramManager: e.target.value }))}
              placeholder="https://t.me/bless_mng"
            />
          </div>

          <div>
            <label style={labelStyle}>url фронтенда</label>
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
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "8px", color: "#333" }}>
          💳 юkassa
        </h2>
        <p style={{ fontSize: "13px", color: "#9ca3af", margin: "0 0 20px" }}>
          настройки платёжного шлюза для приёма оплаты
        </p>

        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div>
            <label style={labelStyle}>id магазина (shopId)</label>
            <input
              style={inputStyle}
              value={settings.yukassaShopId}
              onChange={(e) => setSettings((s) => ({ ...s, yukassaShopId: e.target.value }))}
              placeholder="123456"
            />
          </div>

          <div>
            <label style={labelStyle}>секретный ключ</label>
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
                className="password-toggle-btn"
                style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)" }}
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

      {/* Авторизация */}
      <div style={sectionStyle}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "20px", color: "#333" }}>
          🔐 авторизация
        </h2>

        <div style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "16px 0",
        }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>подтверждение email</div>
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
        }}
      >
        {loading ? "сохранение..." : saved ? "✓ сохранено" : "сохранить настройки"}
      </button>
    </div>
  );
}
