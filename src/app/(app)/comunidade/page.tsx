import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function ComunidadePage() {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Comunidade"
        subtitle="Posts, comentários e rivalidade saudável"
        gradient="from-emerald-600 via-[#1e3a5f] to-teal-800"
        emoji="💬"
      />
      <RedesignBanner />
    </div>
  );
}
