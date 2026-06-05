import Link from "next/link";
import { ChevronRight, Flame } from "lucide-react";
import { FeaturedMatchBanner } from "@/components/match/FeaturedMatchBanner";
import { MatchCard } from "@/components/match/MatchCard";
import { Leaderboard, StreakHighlights } from "@/components/ranking/Leaderboard";
import { RankingTable } from "@/components/ranking/RankingTable";
import {
  getFeaturedMatch,
  getUpcomingMatches,
  getRecentMatches,
} from "@/lib/queries/matches";
import {
  getWeeklyLeaderboard,
  getUniversityRankings,
  getStreakHighlights,
} from "@/lib/queries/rankings";
import { safeQuery } from "@/lib/db/safe-query";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [featured, upcoming, recent, weeklyTop, uniRankings, streaks] =
    await Promise.all([
      safeQuery(() => getFeaturedMatch(), null),
      safeQuery(() => getUpcomingMatches(6), []),
      safeQuery(() => getRecentMatches(4), []),
      safeQuery(() => getWeeklyLeaderboard(10), []),
      safeQuery(() => getUniversityRankings(10), []),
      safeQuery(() => getStreakHighlights(5), []),
    ]);

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Campus League</h1>
        <p className="text-sm text-gray-500">
          Palpites universitários · Sem apostas em dinheiro
        </p>
      </section>

      {featured && (
        <section>
          <FeaturedMatchBanner match={featured} />
        </section>
      )}

      <section>
        <SectionHeader title="Próximos jogos" href="/jogos" />
        <div className="space-y-3">
          {upcoming.map((m) => (
            <MatchCard key={m.id} match={m} compact />
          ))}
          {upcoming.length === 0 && (
            <EmptyState text="Nenhum jogo agendado" />
          )}
        </div>
      </section>

      <section>
        <SectionHeader title="Jogos recentes" href="/jogos?tab=finished" />
        <div className="space-y-3">
          {recent.map((m) => (
            <MatchCard key={m.id} match={m} compact />
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <SectionHeader title="Ranking da semana" href="/rankings?tab=weekly" />
          <Leaderboard entries={weeklyTop} showUniversity />
        </div>
        <div className="rounded-xl border border-gray-100 bg-white p-4">
          <SectionHeader
            title="Ranking das faculdades"
            href="/rankings?tab=universities"
          />
          <RankingTable type="universities" universityEntries={uniRankings} />
        </div>
      </section>

      {streaks.length > 0 && (
        <section>
          <div className="mb-3 flex items-center gap-2">
            <Flame className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-gray-900">Destaques</h2>
          </div>
          <p className="text-xs text-gray-500 mb-3">
            Usuários em sequência positiva
          </p>
          <StreakHighlights entries={streaks} />
        </section>
      )}
    </div>
  );
}

function SectionHeader({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <Link
        href={href}
        className="flex items-center gap-0.5 text-xs font-semibold text-[#1e3a5f]"
      >
        Ver todos
        <ChevronRight className="h-4 w-4" />
      </Link>
    </div>
  );
}

function EmptyState({ text }: { text: string }) {
  return (
    <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
      {text}
    </p>
  );
}
