"use client";

import { FormEvent, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const email = searchParams.get("email") || "";
  
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    if (password !== confirmPassword) {
      setError("пароли не совпадают");
      setLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("пароль должен быть не менее 6 символов");
      setLoading(false);
      return;
    }

    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      const response = await fetch(`${API_URL}/api/auth/reset-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, email, newPassword: password }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        setError(result.error || "произошла ошибка");
        setLoading(false);
        return;
      }

      setMessage("пароль успешно изменён. теперь вы можете войти в аккаунт.");
      setPassword("");
      setConfirmPassword("");
    } catch (err) {
      console.error("reset password error:", err);
      setError("ошибка соединения с сервером");
    }

    setLoading(false);
  };

  if (!token || !email) {
    return (
      <div className="card auth-form">
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
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
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>
            ошибка
          </h1>
        </div>
        <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "24px" }}>
          ссылка для восстановления пароля недействительна или устарела.
        </p>
        <Link href="/forgot-password" className="button-link" style={{ textAlign: "center" }}>
          запросить новую ссылку
        </Link>
      </div>
    );
  }

  return (
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
          <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>новый пароль</h1>
        </div>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>
          reset
        </span>
      </div>

      <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "32px", lineHeight: 1.5 }}>
        придумайте новый пароль для вашего аккаунта.
      </p>

      {message ? (
        <div className="notice success" style={{ marginBottom: "24px" }}>
          {message}
          <div style={{ marginTop: "16px" }}>
            <Link href="/login" className="button-link" style={{ textAlign: "center" }}>
              войти
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <label className="field">
            <span>новый пароль</span>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="минимум 6 символов"
              required
            />
          </label>

          <label className="field">
            <span>подтвердите пароль</span>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="повторите пароль"
              required
            />
          </label>

          {error && <p className="notice error">{error}</p>}

          <button type="submit" disabled={loading}>
            {loading ? (
              <span style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                <span style={{ width: 14, height: 14, border: "2px solid rgba(255,255,255,0.3)", borderTopColor: "#fff", borderRadius: "50%", animation: "spin 0.7s linear infinite", display: "inline-block" }} />
                <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </span>
            ) : "сохранить пароль"}
          </button>
        </form>
      )}

      <div style={{ marginTop: "32px", textAlign: "center", paddingTop: "24px", borderTop: "1px solid #fdf2f8" }}>
        <Link href="/login" style={{ color: "#f1a7c8", fontSize: "14px", textDecoration: "underline" }}>
          вспомнили пароль? войти
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <section className="auth-shell">
      <Suspense fallback={
        <div className="card auth-form">
          <p style={{ color: "#8e8e8e", fontSize: "16px", textAlign: "center" }}>загрузка...</p>
        </div>
      }>
        <ResetPasswordForm />
      </Suspense>
    </section>
  );
}
