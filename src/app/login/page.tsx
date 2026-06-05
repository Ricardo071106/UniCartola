import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Entre com o e-mail e a senha da sua conta"
    >
      <LoginForm />
    </AuthShell>
  );
}
