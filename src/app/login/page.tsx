import { AuthShell } from "@/components/auth/AuthShell";
import { LoginForm } from "@/components/auth/LoginForm";

export default function LoginPage() {
  return (
    <AuthShell
      title="Entrar"
      subtitle="Use o apelido que você criou no cadastro"
    >
      <LoginForm />
    </AuthShell>
  );
}
