"use client";

import { FormEvent, useState, useEffect } from "react";
import { useRouter } from "next/navigation";

import { USER_COOKIE, LAST_USER_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, setCookie, getCookie, deleteCookie } from "@/lib/cookies";

type AuthFormProps = {
  title: string;
  description: string;
  buttonText: string;
};

type UserData = {
  id: string;
  email: string;
  role: string;
};

type ApiResponse = {
  success: boolean;
  data?: {
    user: UserData;
    accessToken: string;
    refreshToken: string;
  };
  error?: string;
};

export function AuthForm({ title, description, buttonText }: AuthFormProps) {
  const router = useRouter();
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [lastUserEmail, setLastUserEmail] = useState<string | null>(null);
  const [defaultEmail, setDefaultEmail] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    const rawLastUser = getCookie(LAST_USER_COOKIE);
    if (rawLastUser) {
      try {
        const user = JSON.parse(rawLastUser);
        setLastUserEmail(user.email);
        setDefaultEmail(user.email);
      } catch {
        // ignore
      }
    }
  }, []);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    setMessage("");

    const formElement = event.currentTarget;
    const formData = new FormData(formElement);
    const email = String(formData.get("email") || "");
    const password = String(formData.get("password") || "");

    try {
      // Direct requests to backend — CORS is properly configured on the backend
      const API_BASE = process.env.NEXT_PUBLIC_API_URL || "https://api.brandbless.ru";
      const endpoint = title === "вход" ? `${API_BASE}/api/auth/login` : `${API_BASE}/api/auth/register`;
      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "ошибка сервера" }));
        setError(errorData.error || `ошибка: ${response.status}`);
        setLoading(false);
        return;
      }

      const result = await response.json();

      if (!result.success) {
        setError(result.error || "произошла ошибка");
        setLoading(false);
        return;
      }

      if (title === "вход") {
        // Login: save tokens and redirect to home
        if (result.data?.accessToken) {
          setCookie(ACCESS_TOKEN_COOKIE, result.data.accessToken);
        }
        if (result.data?.refreshToken) {
          setCookie(REFRESH_TOKEN_COOKIE, result.data.refreshToken);
        }
        const userPayload = {
          id: result.data?.user?.id || "",
          email: result.data?.user?.email || email,
          role: result.data?.user?.role || "USER",
        };
        setCookie(USER_COOKIE, JSON.stringify(userPayload));
        setCookie(LAST_USER_COOKIE, JSON.stringify(userPayload));
        setMessage("вход выполнен!");
        formElement.reset();
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 500);
      } else {
        // Register: no tokens returned, redirect to login
        setMessage("регистрация успешна! войдите в аккаунт.");
        formElement.reset();
        setTimeout(() => {
          router.push("/login");
        }, 1200);
      }
    } catch (err) {
      console.error("auth error:", err);
      setError("ошибка соединения с сервером");
    }
    
    setLoading(false);
  };

  const handleQuickLogin = async () => {
    if (!lastUserEmail) return;
    
    deleteCookie(USER_COOKIE);
    router.push("/login");
  };

  return (
    <section className="auth-shell">
      <div className="card auth-form">
        {/* Header with back button and tag */}
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
            <h1 style={{ margin: 0, fontSize: "32px", fontWeight: 600, letterSpacing: "-0.5px", color: "#333" }}>{title}</h1>
          </div>
          <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>
            {title === "вход" ? "email" : "register"}
          </span>
        </div>

        <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "32px", lineHeight: 1.5 }}>{description}</p>

        {lastUserEmail && title === "вход" && (
          <div className="email-code-box" style={{ marginBottom: "24px" }}>
            <p style={{ margin: "0 0 12px 0", fontSize: "14px", color: "#333" }}>войти как {lastUserEmail}?</p>
            <button 
              type="button" 
              className="quick-login-btn"
              onClick={handleQuickLogin}
            >
              ✓ войти
            </button>
            <hr style={{ border: "none", borderTop: "1px solid #fdf2f8", margin: "12px 0" }} />
            <p style={{ margin: 0, fontSize: "13px", color: "#8e8e8e" }}>или войдите в другой аккаунт:</p>
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <label className="field">
            <span>email</span>
            <input 
              name="email" 
              type="email" 
              placeholder="email@example.com" 
              defaultValue={defaultEmail}
              required 
            />
          </label>

          <label className="field">
            <span>пароль</span>
            <div className="password-field-wrapper">
              <input 
                name="password" 
                type={showPassword ? "text" : "password"} 
                placeholder="пароль" 
                required 
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

          {title === "вход" && (
            <div style={{ textAlign: "right", marginTop: "-8px" }}>
              <a href="/forgot-password" style={{ fontSize: "13px", color: "#f1a7c8", textDecoration: "underline" }}>
                восстановить пароль
              </a>
            </div>
          )}

          {error && <p className="notice error">{error}</p>}
          {message && <p className="notice success">{message}</p>}

          <button type="submit" disabled={loading} style={{ marginTop: "8px" }}>
            {loading ? "загрузка..." : buttonText}
          </button>
        </form>

        {/* Footer hint */}
        <div style={{ marginTop: "24px", textAlign: "center", paddingTop: "16px", borderTop: "1px solid #fdf2f8" }}>
          {title === "вход" ? (
            <p style={{ color: "#8e8e8e", fontSize: "14px", margin: "0 0 8px 0" }}>
              Нажимая на кнопку «Войти», вы соглашаетесь с <a href="/terms" style={{ color: "#f1a7c8", textDecoration: "underline" }}>пользовательским соглашением</a> и <a href="/privacy-policy" style={{ color: "#f1a7c8", textDecoration: "underline" }}>политикой конфиденциальности</a>.
            </p>
          ) : null}
          <p style={{ color: "#5d4c5a", fontSize: "14px" }}>
            {title === "вход" ? "нет аккаунта? " : ""}<a href="/register" style={{ color: "#f1a7c8", fontWeight: 500, textDecoration: "underline" }}>{title === "вход" ? "зарегистрируйтесь" : "если у вас уже есть аккаунт — войдите."}</a>
          </p>
        </div>
      </div>
    </section>
  );
}
