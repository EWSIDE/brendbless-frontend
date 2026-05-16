"use client";

import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { CART_COOKIE, USER_COOKIE, LAST_USER_COOKIE, ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, getCookie, removeCookie } from "@/lib/cookies";

type CartItem = {
  id: number;
  quantity: number;
};

type User = {
  id: string;
  email: string;
  role: string;
} | null;

function getCartCount(): number {
  const rawCart = getCookie(CART_COOKIE);
  if (!rawCart) return 0;
  try {
    const cart: CartItem[] = JSON.parse(rawCart);
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  } catch {
    return 0;
  }
}

function getUser(): User {
  const rawUser = getCookie(USER_COOKIE);
  if (!rawUser) return null;
  try {
    return JSON.parse(rawUser) as User;
  } catch {
    return null;
  }
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      className="h-[12px] w-[12px]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 12L12 4" />
      <path d="M6 4h6v6" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c0-3.7 3.15-6 7-6s7 2.3 7 6" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M7 9V7.75A5 5 0 0 1 12 3a5 5 0 0 1 5 4.75V9" />
      <path d="M5 9h14l-1 10a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 9z" />
    </svg>
  );
}

export function SiteHeader() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [user, setUser] = useState<User>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const update = () => {
      setCartCount(getCartCount());
      setUser(getUser());
    };
    update();
    const interval = setInterval(update, 2000);
    
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = async () => {
    try {
      const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
      const refreshToken = getCookie(REFRESH_TOKEN_COOKIE);
      
      await fetch(`${API_URL}/api/auth/logout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken }),
      });
    } catch {
      // ignore errors
    }
    
    removeCookie(USER_COOKIE);
    removeCookie(ACCESS_TOKEN_COOKIE);
    removeCookie(REFRESH_TOKEN_COOKIE);
    removeCookie(LAST_USER_COOKIE);
    
    setUser(null);
    setMenuOpen(false);
    
    router.push("/");
  };

  return (
    <header className="site-header">
      <div className="container header-row">
        {/* Manager chat link */}
        <a
          href="https://t.me/bless_mng"
          target="_blank"
          rel="noopener noreferrer"
          className="manager-link"
          style={{ fontSize: "15px" }}
        >
          <span className="manager-link-text">перейти в чат с менеджером</span>
          <ArrowIcon />
        </a>

        {/* Catalog link */}
        <Link href="/" className="catalog-link">
          каталог
        </Link>

        {/* Right side - cart and cabinet */}
        <nav className="nav" style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/cart" style={{ position: "relative", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", color: "#f1a7c8", fontSize: "14px", fontWeight: 500 }}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 9V7.75A5 5 0 0 1 12 3a5 5 0 0 1 5 4.75V9"/>
              <path d="M5 9h14l-1 10a2 2 0 0 1-2 1.8H8a2 2 0 0 1-2-1.8L5 9z"/>
            </svg>
            <span className="cart-label">корзина{cartCount > 0 ? ` (${cartCount})` : ""}</span>
          </Link>
          
          {user ? (
            <div className="dropdown" ref={menuRef}>
              <button 
                className="dropdown-trigger"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ borderRadius: "40px", padding: "6px 16px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <UserIcon />
                <span>кабинет</span>
              </button>
              {menuOpen && (
                <div className="dropdown-menu" style={{ borderRadius: "24px", padding: "12px 0" }}>
                  <Link href="/profile" onClick={() => setMenuOpen(false)}>
                    мой профиль
                  </Link>
                  <Link href="/orders" onClick={() => setMenuOpen(false)}>
                    мои заказы
                  </Link>
                  <Link href="/cart" onClick={() => setMenuOpen(false)}>
                    корзина
                  </Link>
                  {user.role === 'ADMIN' && (
                    <>
                      <hr />
                      <Link href="/admin" onClick={() => setMenuOpen(false)}>
                        управление
                      </Link>
                    </>
                  )}
                  <hr />
                  <button onClick={handleLogout} className="logout-btn">
                    выйти
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="dropdown" ref={menuRef}>
              <button 
                className="dropdown-trigger"
                onClick={() => setMenuOpen(!menuOpen)}
                style={{ borderRadius: "40px", padding: "6px 16px", display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
              >
                <UserIcon />
                <span>кабинет</span>
              </button>
              {menuOpen && (
                <div className="dropdown-menu" style={{ borderRadius: "24px", padding: "12px 0" }}>
                  <Link href="/register" onClick={() => setMenuOpen(false)}>
                    зарегистрироваться
                  </Link>
                  <Link href="/login" onClick={() => setMenuOpen(false)}>
                    войти
                  </Link>
                  <hr />
                  <p className="dropdown-hint">
                    войдите, чтобы видеть историю покупок и управлять заказами
                  </p>
                </div>
              )}
            </div>
          )}
        </nav>
      </div>
    </header>
  );
}
