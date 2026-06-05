import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function ResultadosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Resultados"
        subtitle="Placares finais dos jogos universitários"
        gradient="from-slate-800 via-[#1e3a5f] to-slate-900"
        emoji="🏆"
      />
      <RedesignBanner />
    </div>
  );
}
