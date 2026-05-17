"use client";

import { useEffect, useState } from "react";

const COOKIE_CONSENT_KEY = "bless_cookie_consent";

export function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Show only if not already accepted
    const accepted = localStorage.getItem(COOKIE_CONSENT_KEY);
    if (!accepted) {
      // Small delay so banner slides in after page load
      const t = setTimeout(() => setVisible(true), 800);
      return () => clearTimeout(t);
    }
  }, []);

  const accept = () => {
    localStorage.setItem(COOKIE_CONSENT_KEY, "1");
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <>
      <div
        role="dialog"
        aria-label="уведомление об использовании cookies"
        style={{
          position: "fixed",
          bottom: "24px",
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: 9999,
          width: "min(480px, calc(100vw - 32px))",
          background: "#ffffff",
          border: "1.5px solid #fce7f3",
          borderRadius: "28px",
          padding: "20px 24px",
          display: "flex",
          alignItems: "center",
          gap: "16px",
          boxShadow: "0 8px 40px rgba(241,167,200,0.18)",
          animation: "cookieSlideUp 0.4s cubic-bezier(0.34,1.56,0.64,1) both",
        }}
      >
        {/* Icon */}
        <div
          style={{
            width: "40px",
            height: "40px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #fce7f3 0%, #fbcfe8 100%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            fontSize: "18px",
          }}
          aria-hidden="true"
        >
          🍪
        </div>

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p
            style={{
              margin: 0,
              fontSize: "13px",
              color: "#5d4c5a",
              lineHeight: 1.5,
            }}
          >
            мы используем куки, чтобы сайт работал лучше.{" "}
            <a
              href="/privacy-policy"
              style={{
                color: "#f1a7c8",
                textDecoration: "underline",
                whiteSpace: "nowrap",
              }}
            >
              подробнее
            </a>
          </p>
        </div>

        {/* Accept button */}
        <button
          onClick={accept}
          style={{
            flexShrink: 0,
            background: "linear-gradient(135deg, #f9a8d4 0%, #f1a7c8 100%)",
            color: "#fff",
            border: "none",
            borderRadius: "20px",
            padding: "8px 20px",
            fontSize: "13px",
            fontWeight: 600,
            cursor: "pointer",
            fontFamily: "inherit",
            transition: "opacity 0.2s",
            whiteSpace: "nowrap",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          понятно
        </button>
      </div>

      <style>{`
        @keyframes cookieSlideUp {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
      `}</style>
    </>
  );
}
