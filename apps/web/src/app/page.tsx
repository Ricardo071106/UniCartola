import Link from "next/link";
import { getDb } from "@/lib/db";
import { schools } from "@unicartola/db/schema";
import { getActiveCompetition, getLeaderboard } from "@/lib/services/leaderboard";
import { getMatchesByStatus } from "@/lib/services/matches";
import { MatchCard } from "@/components/matches/match-card";
import { LeaderboardTable } from "@/components/rankings/leaderboard-table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentUserId } from "@/lib/auth";
import { getUserPrediction } from "@/lib/services/matches";
import { FeedTracker } from "@/components/analytics/feed-tracker";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const db = await getDb();
  const comp = await getActiveCompetition();
  const userId = await getCurrentUserId();

  if (!comp) {
    return (
      <div className="text-center py-12">
        <h1 className="text-2xl font-bold">Unicartola</h1>
        <p className="mt-2 text-slate-500">
          Configure o banco e execute <code className="text-sm">npm run db:migrate && npm run db:seed</code>
        </p>
      </div>
    );
  }

  const [upcoming, live, finished, leaderboard, schoolList] = await Promise.all([
    getMatchesByStatus(comp.id, ["scheduled"], 8),
    getMatchesByStatus(comp.id, ["live"], 5),
    getMatchesByStatus(comp.id, ["finished"], 8),
    getLeaderboard(comp.id, "global", null, 5),
    db.select().from(schools).limit(8),
  ]);

  const predictionsMap = new Map<string, { outcome: string }>();
  if (userId) {
    for (const m of [...upcoming, ...live]) {
      const pred = await getUserPrediction(userId, m.match.id);
      if (pred) predictionsMap.set(m.match.id, { outcome: pred.outcome });
    }
  }

  return (
    <div className="space-y-8">
      <FeedTracker />

      <section>
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">
          Esporte universitário
        </h1>
        <p className="text-slate-500">{comp.name} — Palpites e rankings</p>
      </section>

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            Ao vivo
          </h2>
          <div className="space-y-3">
            {live.map((m) => (
              <MatchCard
                key={m.match.id}
                match={m.match}
                modalityName={m.modality.name}
                homeTeamName={m.homeTeamName}
                awayTeamName={m.awayTeamName}
                userPrediction={predictionsMap.get(m.match.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Próximas partidas</h2>
        {upcoming.length === 0 ? (
          <p className="text-sm text-slate-500">Nenhuma partida agendada. Execute o scraper NDU.</p>
        ) : (
          <div className="space-y-3">
            {upcoming.map((m) => (
              <MatchCard
                key={m.match.id}
                match={m.match}
                modalityName={m.modality.name}
                homeTeamName={m.homeTeamName}
                awayTeamName={m.awayTeamName}
                userPrediction={predictionsMap.get(m.match.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Resultados recentes</h2>
          <div className="space-y-3">
            {finished.slice(0, 5).map((m) => (
              <MatchCard
                key={m.match.id}
                match={m.match}
                modalityName={m.modality.name}
                homeTeamName={m.homeTeamName}
                awayTeamName={m.awayTeamName}
              />
            ))}
          </div>
        </section>

        <LeaderboardTable
          title="Ranking geral"
          entries={leaderboard.map((e) => ({
            rank: e.rank,
            displayName: e.displayName,
            totalPoints: e.totalPoints,
            matchPoints: e.matchPoints,
            statPoints: e.statPoints,
          }))}
        />
      </div>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Faculdades</h2>
        <div className="flex flex-wrap gap-2">
          {schoolList.map((s) => (
            <Link
              key={s.id}
              href={`/faculdades/${s.slug}`}
              className="rounded-full border border-slate-200 bg-white px-4 py-2 text-sm font-medium hover:border-emerald-500 dark:border-slate-700 dark:bg-slate-900"
            >
              {s.shortName ?? s.name}
            </Link>
          ))}
        </div>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Notícias NDU</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-500">
            Acompanhe as novidades em{" "}
            <a
              href="https://www.ndu.net.br/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-emerald-600 hover:underline"
            >
              ndu.net.br
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
