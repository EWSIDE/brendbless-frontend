import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "контакты и реквизиты — bless",
  description: "контактная информация и реквизиты bless",
};

export default function ContactsPage() {
  return (
    <section className="stack">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
        <h1 style={{ fontSize: "32px", fontWeight: 600, color: "#333", margin: 0, letterSpacing: "-0.5px" }}>контакты и реквизиты</h1>
        <span style={{ border: "1px solid #fce7f3", color: "#f1a7c8", padding: "4px 12px", borderRadius: "20px", fontSize: "13px" }}>info</span>
      </div>
      <p style={{ color: "#8e8e8e", fontSize: "16px", marginBottom: "32px" }}>свяжитесь с нами или ознакомьтесь с реквизитами</p>

      <div className="card" style={{ padding: "40px", borderRadius: "48px" }}>
        <h2 style={{ color: "#333", marginTop: 0, fontSize: "18px", fontWeight: 600, marginBottom: "16px" }}>контактная информация</h2>
        <ul style={{ lineHeight: 2, fontSize: "16px", color: "#333" }}>
          <li>
            <strong>email:</strong>{" "}
            <a href="mailto:support@brandbless.ru" style={{ color: "#f1a7c8" }}>support@brandbless.ru</a>
          </li>
        </ul>
      </div>
    </section>
  );
}
