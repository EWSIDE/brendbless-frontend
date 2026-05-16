import { AuthForm } from "@/components/auth-form";

export default function LoginPage() {
  return (
    <AuthForm
      title="вход"
      description="введите данные аккаунта, чтобы войти в магазин."
      buttonText="войти"
    />
  );
}
