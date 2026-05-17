"use client";

export function PinkLoader({ size = 32, text }: { size?: number; text?: string }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", padding: "40px 0" }}>
      <div
        style={{
          width: size,
          height: size,
          border: "3px solid #fce7f3",
          borderTopColor: "#f1a7c8",
          borderRadius: "50%",
          animation: "spin 0.7s linear infinite",
        }}
      />
      {text && <p style={{ color: "#c4a0b0", fontSize: "14px", margin: 0 }}>{text}</p>}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
