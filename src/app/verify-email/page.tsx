"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter();

  useEffect(() => {
    // Эта страница больше не используется - верификация происходит на странице регистрации
    router.replace("/");
  }, [router]);

  return null;
}
