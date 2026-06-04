import { notFound } from "next/navigation";
import { db } from "@/lib/db";
import { schools, userProfiles } from "@unicartola/db/schema";
import { eq } from "drizzle-orm";
import { getActiveCompetition, getLeaderboard } from "@/lib/services/leaderboard";
import { getSchoolMatches } from "@/lib/services/matches";
import { MatchCard } from "@/components/matches/match-card";
import { LeaderboardTable } from "@/components/rankings/leaderboard-table";
import { SchoolPageTracker } from "@/components/analytics/school-page-tracker";

export const dynamic = "force-dynamic";

export default async function SchoolPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [school] = await db.select().from(schools).where(eq(schools.slug, slug)).limit(1);
  if (!school) notFound();

  const comp = await getActiveCompetition();
  if (!comp) return <p>Competição não configurada.</p>;

  const [schoolMatches, ranking] = await Promise.all([
    getSchoolMatches(school.id, comp.id),
    getLeaderboard(comp.id, "school", school.id, 10),
  ]);

  const upcoming = schoolMatches.filter((m) => m.match.status === "scheduled");
  const finished = schoolMatches.filter((m) => m.match.status === "finished");

  return (
    <div className="space-y-8">
      <SchoolPageTracker schoolSlug={slug} />

      <header>
        <h1 className="text-3xl font-bold">{school.name}</h1>
        <p className="text-slate-500">{school.city} — Comunidade Unicartola</p>
      </header>

      <div className="grid gap-6 md:grid-cols-2">
        <section>
          <h2 className="mb-3 text-lg font-semibold">Próximos jogos</h2>
          <div className="space-y-3">
            {upcoming.length === 0 ? (
              <p className="text-sm text-slate-500">Sem jogos próximos.</p>
            ) : (
              upcoming.map((m) => (
                <MatchCard
                  key={m.match.id}
                  match={m.match}
                  modalityName={m.modality.name}
                  homeTeamName={m.homeTeamName}
                  awayTeamName={m.awayTeamName}
                />
              ))
            )}
          </div>
        </section>

        <LeaderboardTable
          title="Ranking interno"
          entries={ranking.map((e) => ({
            rank: e.rank,
            displayName: e.displayName,
            totalPoints: e.totalPoints,
            matchPoints: e.matchPoints,
            statPoints: e.statPoints,
          }))}
        />
      </div>

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

      <section>
        <h2 className="mb-3 text-lg font-semibold">Usuários cadastrados</h2>
        <ul className="space-y-1 text-sm text-slate-600">
          {(await db
            .select({ displayName: userProfiles.displayName })
            .from(userProfiles)
            .where(eq(userProfiles.schoolId, school.id))
            .limit(10)
          ).map((u, i) => (
            <li key={i}>{u.displayName}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
