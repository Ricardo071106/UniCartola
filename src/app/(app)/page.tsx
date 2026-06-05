import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { PageHeader } from "@/components/layout/PageHeader";
import { RedesignBanner } from "@/components/layout/RedesignBanner";
import { SportCard } from "@/components/sports/SportCard";
import { SPORT_LIST } from "@/lib/sports";

export default function HomePage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Campus League"
        subtitle="Fantasy universitário — palpites, rankings e comunidade"
        gradient="from-[#1e3a5f] via-[#2d5a8e] to-emerald-800"
        emoji="🎓"
      />

      <RedesignBanner />

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="section-title">Modalidades</h2>
          <Link
            href="/jogos"
            className="flex items-center gap-0.5 text-xs font-semibold text-[#1e3a5f]"
          >
            Ver jogos
            <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {SPORT_LIST.map((sport) => (
            <SportCard key={sport.slug} sport={sport} matchCount={0} athleteCount={0} />
          ))}
        </div>
      </section>
    </div>
  );
}
