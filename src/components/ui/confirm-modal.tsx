"use client";

import { useEffect } from "react";

type ConfirmModalProps = {
  open: boolean;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
};

export function ConfirmModal({
  open,
  title = "подтверждение",
  message,
  confirmText = "удалить",
  cancelText = "отмена",
  onConfirm,
  onCancel,
  danger = true,
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onCancel]);

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 10000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0,0,0,0.3)",
        backdropFilter: "blur(4px)",
        animation: "fadeIn 0.15s ease-out",
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "#fff",
          borderRadius: "24px",
          padding: "32px",
          maxWidth: "380px",
          width: "90%",
          animation: "scaleIn 0.2s ease-out",
        }}
      >
        <h3
          style={{
            margin: "0 0 12px",
            fontSize: "18px",
            fontWeight: 600,
            color: "#1a1a1a",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            margin: "0 0 28px",
            fontSize: "14px",
            color: "#6b7280",
            lineHeight: 1.5,
          }}
        >
          {message}
        </p>
        <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
          <button
            onClick={onCancel}
            style={{
              padding: "12px 24px",
              border: "1.5px solid #f3e8ee",
              borderRadius: "14px",
              background: "#fff",
              color: "#6b7280",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#f9fafb";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "#fff";
            }}
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: "12px 24px",
              border: "none",
              borderRadius: "14px",
              background: danger ? "#f1a7c8" : "#f1a7c8",
              color: "#fff",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = danger ? "#e095b5" : "#e095b5";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = danger ? "#f1a7c8" : "#f1a7c8";
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes scaleIn {
          from { transform: scale(0.95); opacity: 0; }
          to { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
