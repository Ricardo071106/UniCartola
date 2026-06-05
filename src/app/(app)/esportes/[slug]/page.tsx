import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";
import { getSportMeta } from "@/lib/sports";

export default async function EsportePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const sport = getSportMeta(slug);
  if (!sport) notFound();

  return (
    <div className="space-y-6">
      <PageHeader
        title={sport.name}
        subtitle={sport.tagline}
        gradient={sport.gradient}
        emoji={sport.emoji}
      >
        <div className="flex flex-wrap gap-2">
          <QuickLink href={`/jogos?sport=${sport.slug}`} label="Jogos" />
          <QuickLink href={`/resultados?sport=${sport.slug}`} label="Resultados" />
          <QuickLink href={`/atletas?sport=${sport.slug}`} label="Atletas" />
        </div>
      </PageHeader>
      <RedesignBanner />
    </div>
  );
}

function QuickLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="rounded-full bg-white/20 px-4 py-1.5 text-xs font-bold text-white backdrop-blur hover:bg-white/30 transition"
    >
      {label}
    </Link>
  );
}
