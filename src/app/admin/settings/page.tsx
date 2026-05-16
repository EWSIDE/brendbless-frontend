"use client";

import { useEffect, useState } from "react";
import { getCookie, ACCESS_TOKEN_COOKIE } from "@/lib/cookies";

type Settings = {
  emailVerification: boolean;
};

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({
    emailVerification: true
  });
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  useEffect(() => {
    loadSettings();
  }, []);

  const getToken = () => getCookie(ACCESS_TOKEN_COOKIE) || "";

  const loadSettings = async () => {
    try {
      const res = await fetch(`${API_URL}/api/settings`);
      const data = await res.json();
      if (data.success && data.data) {
        setSettings(data.data);
      } else {
        // Default settings if none exist
        setSettings({ emailVerification: false });
      }
    } catch (e) { 
      console.error(e); 
      setSettings({ emailVerification: false });
    }
  };

  const saveSettings = async () => {
    setLoading(true);
    const token = getToken();

    try {
      await fetch(`${API_URL}/api/settings`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(settings)
      });
      
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (e) { 
      console.error(e); 
    }
    
    setLoading(false);
  };

  return (
    <div style={{ padding: "24px", maxWidth: "600px", margin: "0 auto" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, margin: 0, color: "#333", letterSpacing: "-0.5px" }}>настройки</h1>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>config</span>
      </div>

      <div style={{ 
        background: "#fff", 
        borderRadius: "48px", 
        padding: "40px",
        border: "1px solid #fce7f3"
      }}>
        <h2 style={{ fontSize: "18px", fontWeight: 600, marginTop: 0, marginBottom: "20px", color: "#333" }}>
          авторизация
        </h2>

        {/* Email Verification Toggle */}
        <div style={{ 
          display: "flex", 
          justifyContent: "space-between", 
          alignItems: "center",
          padding: "16px 0",
          borderBottom: "1px solid #fafafa"
        }}>
          <div>
            <div style={{ fontWeight: 500, marginBottom: "4px" }}>
              подтверждение email
            </div>
            <div style={{ fontSize: "13px", color: "#9ca3af" }}>
              требуется код при регистрации
            </div>
          </div>
          <button
            onClick={() => setSettings(s => ({...s, emailVerification: !s.emailVerification}))}
            style={{
              width: "52px",
              height: "28px",
              borderRadius: "14px",
              border: "none",
              cursor: "pointer",
              background: settings.emailVerification ? "#f1a7c8" : "#e5e7eb",
              position: "relative",
              transition: "background 0.2s"
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
              boxShadow: "none"
            }} />
          </button>
        </div>

        {/* Status indicator */}
        <div style={{ 
          display: "flex", 
          alignItems: "center",
          gap: "8px",
          marginTop: "16px",
          fontSize: "13px"
        }}>
          <span style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: settings.emailVerification ? "#22c55e" : "#ef4444"
          }} />
          <span style={{ color: "#6b7280" }}>
            {settings.emailVerification ? "включено" : "выключено"}
          </span>
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={saveSettings}
        disabled={loading}
        style={{
          marginTop: "24px",
          width: "100%",
          padding: "20px 40px",
          background: saved ? "#22c55e" : "#f1a7c8",
          color: "#fff",
          border: "none",
          borderRadius: "40px",
          fontSize: "16px",
          fontWeight: 500,
          cursor: "pointer"
        }}
      >
        {loading ? "сохранение..." : saved ? "✓ сохранено" : "сохранить"}
      </button>

    </div>
  );
}
