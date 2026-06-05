import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function RankingsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Rankings"
        subtitle="Geral, semanal e por faculdade"
        gradient="from-amber-500 via-[#1e3a5f] to-amber-700"
        emoji="🏅"
      />
      <RedesignBanner />
    </div>
  );
}
