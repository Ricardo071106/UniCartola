import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Cadastre-se"
      subtitle="Crie sua conta com e-mail, nome de usuário e senha"
    >
      <RegisterForm />
    </AuthShell>
  );
}
