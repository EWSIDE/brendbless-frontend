"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { ACCESS_TOKEN_COOKIE, getCookie, removeCookie, CART_COOKIE } from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const [status, setStatus] = useState<"loading" | "paid" | "pending" | "failed">("loading");
  const [orderNumber, setOrderNumber] = useState("");

  useEffect(() => {
    if (!orderId) {
      setStatus("failed");
      return;
    }

    // Очищаем корзину
    removeCookie(CART_COOKIE);

    const checkStatus = async () => {
      try {
        const token = getCookie(ACCESS_TOKEN_COOKIE);
        const res = await fetch(`${API_BASE}/api/payments/status/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        if (data.success) {
          setOrderNumber(data.data.orderNumber);
          if (data.data.paymentStatus === "PAID") {
            setStatus("paid");
          } else if (data.data.paymentStatus === "FAILED") {
            setStatus("failed");
          } else {
            setStatus("pending");
            // Retry in 3 seconds
            setTimeout(checkStatus, 3000);
          }
        } else {
          setStatus("pending");
        }
      } catch {
        setStatus("pending");
      }
    };

    checkStatus();
  }, [orderId]);

  if (status === "loading") {
    return (
      <div style={{ textAlign: "center", padding: "80px 20px" }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: "24px" }}>
          <div style={{ width: 40, height: 40, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite" }} />
        </div>
        <p style={{ fontSize: "16px", color: "#8e8e8e" }}>проверяем статус оплаты...</p>
        <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (status === "paid") {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        {/* Animated checkmark */}
        <div style={{
          width: "96px",
          height: "96px",
          borderRadius: "50%",
          background: "linear-gradient(135deg, #fce7f3 0%, #f9a8d4 50%, #f472b6 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 28px",
          animation: "scaleIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)",
          boxShadow: "0 8px 32px rgba(241, 167, 200, 0.3)",
        }}>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>

        <h1 style={{ fontSize: "28px", fontWeight: 700, color: "#1a1a1a", margin: "0 0 12px", letterSpacing: "-0.5px" }}>
          оплата прошла успешно!
        </h1>
        <p style={{ fontSize: "16px", color: "#6b7280", margin: "0 0 8px", lineHeight: 1.5 }}>
          спасибо за покупку в <span style={{ color: "#f1a7c8", fontWeight: 600 }}>brandbless</span>
        </p>
        {orderNumber && (
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 32px" }}>
            номер заказа: <strong style={{ color: "#374151" }}>{orderNumber}</strong>
          </p>
        )}

        {/* Info card */}
        <div style={{
          background: "#fff5f8",
          border: "1px solid #fce7f3",
          borderRadius: "20px",
          padding: "20px 24px",
          maxWidth: "400px",
          margin: "0 auto 32px",
          textAlign: "left",
        }}>
          <p style={{ margin: "0 0 8px", fontSize: "14px", color: "#374151", fontWeight: 600 }}>что дальше?</p>
          <ul style={{ margin: 0, padding: "0 0 0 18px", fontSize: "14px", color: "#6b7280", lineHeight: 1.8 }}>
            <li>мы подтвердим ваш заказ</li>
            <li>отправим уведомление на email</li>
            <li>статус можно отслеживать в «мои заказы»</li>
          </ul>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
          <Link
            href="/orders"
            style={{
              background: "#f1a7c8",
              color: "#fff",
              borderRadius: "40px",
              padding: "14px 28px",
              fontWeight: 500,
              fontSize: "15px",
              textDecoration: "none",
              display: "inline-flex",
              alignItems: "center",
              gap: "8px",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2"/>
              <rect x="9" y="3" width="6" height="4" rx="1"/>
            </svg>
            мои заказы
          </Link>
          <Link
            href="/"
            style={{
              background: "transparent",
              color: "#f1a7c8",
              border: "1px solid #fce7f3",
              borderRadius: "40px",
              padding: "14px 28px",
              fontWeight: 500,
              fontSize: "15px",
              textDecoration: "none",
            }}
          >
            в каталог
          </Link>
        </div>

        <style jsx>{`
          @keyframes scaleIn {
            from { transform: scale(0); opacity: 0; }
            to { transform: scale(1); opacity: 1; }
          }
        `}</style>
      </div>
    );
  }

  if (status === "pending") {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{
          width: "80px",
          height: "80px",
          borderRadius: "50%",
          background: "#fef3c7",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 24px",
        }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px" }}>ожидаем подтверждение оплаты</h1>
        <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
          платёж обрабатывается. обычно это занимает несколько секунд.
        </p>
        {orderNumber && (
          <p style={{ fontSize: "14px", color: "#9ca3af", margin: "0 0 24px" }}>
            заказ: <strong>{orderNumber}</strong>
          </p>
        )}
        <Link href="/orders" style={{ color: "#f1a7c8", textDecoration: "underline", fontSize: "15px" }}>
          перейти в мои заказы
        </Link>
      </div>
    );
  }

  // failed
  return (
    <div style={{ textAlign: "center", padding: "60px 20px" }}>
      <div style={{
        width: "80px",
        height: "80px",
        borderRadius: "50%",
        background: "#fee2e2",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        margin: "0 auto 24px",
      }}>
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10"/>
          <line x1="15" y1="9" x2="9" y2="15"/>
          <line x1="9" y1="9" x2="15" y2="15"/>
        </svg>
      </div>
      <h1 style={{ fontSize: "24px", fontWeight: 600, color: "#1a1a1a", margin: "0 0 12px" }}>оплата не прошла</h1>
      <p style={{ fontSize: "15px", color: "#6b7280", margin: "0 0 24px", lineHeight: 1.5 }}>
        попробуйте ещё раз или выберите другой способ оплаты.
      </p>
      <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap" }}>
        <Link href="/orders" style={{ color: "#f1a7c8", textDecoration: "underline", fontSize: "15px" }}>
          мои заказы
        </Link>
        <Link href="/" style={{ color: "#6b7280", textDecoration: "underline", fontSize: "15px" }}>
          в каталог
        </Link>
      </div>
    </div>
  );
}

export default function PaymentSuccessPage() {
  return (
    <section style={{ maxWidth: "600px", margin: "0 auto", padding: "24px 16px" }}>
      <Suspense fallback={
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div style={{ width: 32, height: 32, border: "3px solid #fce7f3", borderTopColor: "#f1a7c8", borderRadius: "50%", animation: "spin 0.7s linear infinite", margin: "0 auto" }} />
          <style jsx>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      }>
        <PaymentSuccessContent />
      </Suspense>
    </section>
  );
}
