import { redirect } from "next/navigation";

export default function VerifyEmailPage() {
  // Эта страница больше не используется - верификация происходит на странице регистрации
  redirect("/");
}
