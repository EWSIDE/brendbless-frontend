"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    try {
      // Use Next.js API proxy to avoid CORS issues
      const response = await fetch(`/api/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "произошла ошибка");
        setLoading(false);
        return;
      }

      setMessage("инструкции по восстановлению пароля отправлены на ваш email");
      setEmail("");
    } catch (err) {
      console.error("forgot password error:", err);
      setError("ошибка соединения с сервером");
    }

    setLoading(false);
  };

  return (
    <section className="auth-shell">
      <div className="card auth-form">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <button
              type="button"
              onClick={() => window.history.back()}
              style={{
                background: "white",
                border: "none",
                cursor: "pointer",
                padding: "8px",
                marginLeft: "-8px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                borderRadius: "8px",
                boxShadow: "none",
              }}
              aria-label="назад"
            >
              <svg width="24" height="24" viewBox="0 0 24 24" stroke="#f1a7c8" strokeWidth="2" fill="none">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>восстановление пароля</h1>
          </div>
          <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>
            reset
          </span>
        </div>

        <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "32px", lineHeight: 1.5 }}>
          введите email, который вы использовали при регистрации. мы отправим инструкции по восстановлению пароля.
        </p>

        {message ? (
          <div className="notice success" style={{ marginBottom: "24px" }}>
            {message}
          </div>
        ) : (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <label className="field">
              <span>email</span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </label>

            {error && <p className="notice error">{error}</p>}

            <button type="submit" disabled={loading}>
              {loading ? "загрузка..." : "отправить"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "32px", textAlign: "center", paddingTop: "24px", borderTop: "1px solid #fdf2f8" }}>
          <Link href="/login" style={{ color: "#f1a7c8", fontSize: "14px", textDecoration: "underline" }}>
            вспомнили пароль? войти
          </Link>
        </div>
      </div>
    </section>
  );
}
