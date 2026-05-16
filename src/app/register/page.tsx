"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { USER_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, setCookie } from "@/lib/cookies";

type Step = "register" | "verify";

export default function RegisterPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>("register");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [verificationToken, setVerificationToken] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const doLogin = async (email: string, password: string) => {
    try {
      const loginResponse = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginResult = await loginResponse.json();

      if (loginResult.success && loginResult.data) {
        setCookie(ACCESS_TOKEN_COOKIE, loginResult.data.accessToken);
        setCookie(REFRESH_TOKEN_COOKIE, loginResult.data.refreshToken);
        setCookie(USER_COOKIE, JSON.stringify(loginResult.data.user));
        router.push("/");
        return true;
      }
    } catch {}
    return false;
  };

  const handleRegister = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const formData = new FormData(e.currentTarget);
    const emailValue = String(formData.get("email") || "");
    const passwordValue = String(formData.get("password") || "");
    setPassword(passwordValue);

    try {
      const settingsRes = await fetch(`${API_URL}/api/settings`);
      const settingsData = await settingsRes.json();
      const emailVerification = settingsData?.data?.emailVerification ?? false;

      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: emailValue, password: passwordValue }),
      });

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "ошибка регистрации");
        setLoading(false);
        return;
      }

      if (emailVerification) {
        setEmail(emailValue);
        setVerificationToken(result.data?.verificationToken || "");
        setStep("verify");
        setMessage("код отправлен на вашу почту!");
      } else {
        const loggedIn = await doLogin(emailValue, passwordValue);
        if (!loggedIn) {
          setMessage("регистрация прошла! теперь войдите в аккаунт.");
          setTimeout(() => router.push("/login"), 2000);
        }
      }
    } catch {
      setError("ошибка соединения с сервером");
    }
    
    setLoading(false);
  };

  const handleVerify = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const verifyResponse = await fetch(`${API_URL}/api/auth/verify-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: verificationToken, email, code }),
      });

      const verifyResult = await verifyResponse.json();

      if (!verifyResult.success) {
        setError(verifyResult.error || "неверный код");
        setLoading(false);
        return;
      }

      const loggedIn = await doLogin(email, password);
      if (!loggedIn) {
        setMessage("email подтверждён! теперь войдите в аккаунт.");
        setTimeout(() => router.push("/login"), 2000);
      }
    } catch {
      setError("ошибка верификации");
    }
    
    setLoading(false);
  };

  const handleResend = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/auth/resend-verification`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage("код повторно отправлен!");
      } else {
        setError(result.error || "ошибка отправки");
      }
    } catch {
      setError("ошибка соединения");
    }
    setLoading(false);
  };

  if (step === "verify") {
    return (
      <section className="auth-shell">
        <div className="card" style={{ maxWidth: "450px", textAlign: "center", padding: "32px" }}>
          <div style={{ fontSize: "64px", marginBottom: "20px" }}>📧</div>
          <h1 style={{ color: "var(--pink-700)", marginBottom: "8px" }}>подтверждение email</h1>
          <p className="muted" style={{ marginBottom: "20px" }}>
            код отправлен на <strong>{email}</strong>
          </p>
          
          {message && <p className="notice success">{message}</p>}
          {error && <p className="notice error">{error}</p>}

          <form onSubmit={handleVerify}>
            <label className="field">
              <span>код подтверждения</span>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="введите код из письма"
                style={{ textAlign: "center", fontSize: "24px", letterSpacing: "8px" }}
                required
              />
            </label>

            <button type="submit" disabled={loading} style={{ width: "100%", marginTop: "20px" }}>
              {loading ? "проверка..." : "подтвердить"}
            </button>
          </form>

          <div style={{ marginTop: "20px", display: "flex", gap: "10px", justifyContent: "center" }}>
            <button 
              type="button" 
              onClick={handleResend}
              disabled={loading}
              style={{ background: "transparent", border: "1px solid var(--border)", padding: "10px 20px", color: "var(--pink-600)", borderRadius: "12px" }}
            >
              отправить код повторно
            </button>
          </div>

          <p style={{ marginTop: "20px" }}>
            <Link href="/register" onClick={() => setStep("register")}>← назад к регистрации</Link>
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-shell">
      <form className="card auth-form" onSubmit={handleRegister}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
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
            <div>
              <h1 style={{ margin: 0 }}>регистрация</h1>
              <p className="muted" style={{ margin: "4px 0 0 0" }}>создайте аккаунт для оформления заказов</p>
            </div>
          </div>
        </div>

        <label className="field">
          <span>email</span>
          <input name="email" type="email" placeholder="email@example.com" required />
        </label>

        <label className="field">
          <span>пароль</span>
          <div className="password-field-wrapper">
            <input 
              name="password" 
              type={showPassword ? "text" : "password"} 
              placeholder="минимум 6 символов" 
              required 
              minLength={6}
              style={{ flex: 1, paddingRight: "40px" }}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="password-toggle-btn"
              aria-label={showPassword ? "скрыть пароль" : "показать пароль"}
            >
              {showPassword ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="17" y1="7" x2="7" y2="17"/>
                  <line x1="7" y1="7" x2="17" y2="17"/>
                </svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              )}
            </button>
          </div>
        </label>

        {error && <p className="notice error">{error}</p>}
        {message && <p className="notice success">{message}</p>}

        <button type="submit" disabled={loading}>
          {loading ? "отправка..." : "зарегистрироваться"}
        </button>

        <p className="auth-switch-link">
          уже есть аккаунт? <Link href="/login">войдите</Link>
        </p>
      </form>
    </section>
  );
}
