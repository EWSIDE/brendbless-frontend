"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { AuthForm } from "@/components/auth-form";

function LoginContent() {
  const searchParams = useSearchParams();
  const expired = searchParams.get("expired") === "1";

  return (
    <>
      {expired && (
        <div style={{
          maxWidth: "420px",
          margin: "0 auto 16px",
          background: "#fff5f8",
          border: "1px solid #fce7f3",
          borderRadius: "16px",
          padding: "14px 20px",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f1a7c8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
          <p style={{ margin: 0, fontSize: "14px", color: "#5d4c5a" }}>
            сессия истекла — войдите снова
          </p>
        </div>
      )}
      <AuthForm
        title="вход"
        description="введите данные аккаунта, чтобы войти в магазин."
        buttonText="войти"
      />
    </>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <AuthForm
        title="вход"
        description="введите данные аккаунта, чтобы войти в магазин."
        buttonText="войти"
      />
    }>
      <LoginContent />
    </Suspense>
  );
}
