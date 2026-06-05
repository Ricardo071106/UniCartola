import { AuthShell } from "@/components/auth/AuthShell";
import { RegisterForm } from "@/components/auth/RegisterForm";

export default function CadastroPage() {
  return (
    <AuthShell
      title="Cadastre-se"
      subtitle="Crie sua conta em segundos — só precisa de um apelido"
    >
      <RegisterForm />
    </AuthShell>
  );
}
