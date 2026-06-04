import Link from "next/link";
import { MatchCard } from "@/components/matches/match-card";
import { RankingTable } from "@/components/rankings/ranking-table";
import { UniversityCard } from "@/components/universities/university-card";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Flame } from "lucide-react";
import {
  getFeaturedMatch,
  getMatchesByStatus,
  getTodayMatches,
  getLeaderboard,
  getUniversityRankings,
  getStreakHighlights,
  getCompetition,
  getUserPrediction,
  DEMO_USER_ID,
} from "@/lib/data";

export default function HomePage() {
  const competition = getCompetition();
  const featured = getFeaturedMatch();
  const todayMatches = getTodayMatches(8);
  const liveMatches = getMatchesByStatus(["live"], 5);
  const upcoming = getMatchesByStatus(["scheduled"], 6);
  const topUsers = getLeaderboard("global", null, 10);
  const topSchools = getUniversityRankings(5);
  const streaks = getStreakHighlights(5);

  const demoPredictions = new Map(
    [...liveMatches, ...upcoming, ...todayMatches].map((m) => {
      const pred = getUserPrediction(DEMO_USER_ID, m.id);
      return [m.id, pred ? { outcome: pred.outcome } : null] as const;
    })
  );

  return (
    <div className="space-y-8">
      <section>
        <p className="text-sm font-medium text-muted-foreground">{competition.name}</p>
        <h1 className="text-2xl font-bold tracking-tight lg:text-3xl">Campus League</h1>
      </section>

      {featured && (
        <section className="overflow-hidden rounded-2xl border border-border bg-gradient-to-br from-accent to-[#2d5a8a] p-6 text-white">
          <Badge variant="secondary" className="mb-3 bg-white/20 text-white">
            Próximo jogo importante
          </Badge>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-white/80">{featured.modalityName}</p>
              <h2 className="mt-1 text-2xl font-bold">
                {featured.homeTeamName} x {featured.awayTeamName}
              </h2>
              <p className="mt-1 text-sm text-white/70">
                {featured.scheduledAt.toLocaleDateString("pt-BR", {
                  weekday: "long",
                  day: "2-digit",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
            <Link
              href={`/jogos/${featured.id}`}
              className="inline-flex h-10 items-center justify-center rounded-lg bg-white px-4 text-sm font-medium text-accent hover:bg-white/90"
            >
              Dar Palpite
            </Link>
          </div>
        </section>
      )}

      {liveMatches.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
            <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />
            Ao vivo
          </h2>
          <div className="space-y-3">
            {liveMatches.map((m) => (
              <MatchCard
                key={m.id}
                match={m}
                userPrediction={demoPredictions.get(m.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Jogos do dia</h2>
          <Link href="/jogos" className="text-sm font-medium text-accent hover:underline">
            Ver todos
          </Link>
        </div>
        <div className="space-y-3">
          {(todayMatches.length ? todayMatches : upcoming.slice(0, 6)).map((m) => (
            <MatchCard
              key={m.id}
              match={m}
              userPrediction={demoPredictions.get(m.id)}
              compact
            />
          ))}
        </div>
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <RankingTable title="Ranking rápido — Top 10" entries={topUsers} showAccuracy />

        <section>
          <h2 className="mb-3 text-lg font-semibold">Ranking das faculdades</h2>
          <div className="space-y-2">
            {topSchools.map((school) => (
              <UniversityCard key={school.id} university={school} compact />
            ))}
          </div>
        </section>
      </div>

      <section>
        <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold">
          <Flame className="h-5 w-5 text-orange-500" />
          Destaques — sequência de acertos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {streaks.map((s) => (
            <div
              key={s.userId}
              className="flex items-center gap-3 rounded-lg border border-border p-3"
            >
              <Avatar name={s.displayName} size="sm" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{s.displayName}</p>
                <p className="text-xs text-muted-foreground">{s.schoolName}</p>
              </div>
              <div className="flex items-center gap-1 text-orange-600">
                <Flame className="h-4 w-4" />
                <span className="text-sm font-bold">{s.streak}</span>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
