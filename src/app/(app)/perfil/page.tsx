import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function PerfilPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Perfil"
        subtitle="Suas estatísticas e conquistas"
        gradient="from-[#1e3a5f] to-indigo-700"
        emoji="👤"
      />
      <RedesignBanner />
    </div>
  );
}
