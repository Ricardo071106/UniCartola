import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function AtletasPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Atletas"
        subtitle="Artilheiros e destaques das atléticas"
        gradient="from-violet-600 via-[#1e3a5f] to-indigo-800"
        emoji="⭐"
      />
      <RedesignBanner />
    </div>
  );
}
