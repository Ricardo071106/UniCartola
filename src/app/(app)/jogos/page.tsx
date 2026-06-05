import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function JogosPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Jogos"
        subtitle="Agenda de partidas universitárias"
        gradient="from-[#1e3a5f] to-[#2d5a8e]"
        emoji="📅"
      />
      <RedesignBanner />
    </div>
  );
}
