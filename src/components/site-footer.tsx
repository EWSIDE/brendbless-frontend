"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settings-context";

export function SiteFooter() {
  const settings = useSettings();

  return (
    <footer className="site-footer">
      <div className="container footer-row">
        <div className="footer-section">
          <h3 style={{ color: "#000" }}>bless</h3>
          <p className="muted" style={{ fontSize: "14px", lineHeight: 1.5 }}>бренд одежды, созданный с одной идеей: делать шикарные вещи для самых шикарных дам.</p>
        </div>

        <div className="footer-section">
          <h4 style={{ color: "#000" }}>покупателям</h4>
          <nav className="footer-nav">
            <Link href="/delivery">доставка и оплата</Link>
            <Link href="/contacts">контакты и реквизиты</Link>
            <Link href="/terms-of-use">пользовательское соглашение</Link>
            <Link href="/privacy-policy">политика конфиденциальности</Link>
          </nav>
        </div>

        <div className="footer-section">
          <h4 style={{ color: "#000" }}>контакты</h4>
          <p className="muted" style={{ fontSize: "14px" }}>
            <a href={`mailto:${settings.supportEmail}`} style={{ color: "#f1a7c8" }}>{settings.supportEmail}</a>
          </p>
          <p className="muted" style={{ fontSize: "14px", marginTop: "8px" }}>
            <a href={settings.telegramChannel} target="_blank" rel="noopener noreferrer" style={{ color: "#f1a7c8" }}>
              telegram канал
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
