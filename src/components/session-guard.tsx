"use client";

import { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  USER_COOKIE,
  LAST_USER_COOKIE,
  getCookie,
  setCookie,
  deleteCookie,
} from "@/lib/cookies";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "";

/**
 * SessionGuard — проверяет валидность токена при загрузке.
 * Если бэкенд отвечает 401/403 — очищает сессию и редиректит на /login.
 * Сохраняет email последнего пользователя в LAST_USER_COOKIE.
 */
export function SessionGuard() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const token = getCookie(ACCESS_TOKEN_COOKIE);
    if (!token) return; // Не залогинен — ничего не делаем

    // Не проверяем на страницах авторизации
    if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password" || pathname === "/reset-password") {
      return;
    }

    // Проверяем токен через /api/auth/me
    fetch(`${API_BASE}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (res.status === 401 || res.status === 403) {
          // Сессия невалидна — сохраняем email и очищаем
          const rawUser = getCookie(USER_COOKIE);
          if (rawUser) {
            try {
              const user = JSON.parse(rawUser);
              setCookie(LAST_USER_COOKIE, JSON.stringify({ email: user.email }), 60 * 60 * 24 * 90); // 90 дней
            } catch {}
          }

          // Очищаем токены
          deleteCookie(ACCESS_TOKEN_COOKIE);
          deleteCookie(REFRESH_TOKEN_COOKIE);
          deleteCookie(USER_COOKIE);

          // Редирект на логин
          router.push("/login?expired=1");
        }
      })
      .catch(() => {
        // Сеть недоступна — не трогаем сессию
      });
  }, [pathname]);

  return null;
}
