import { notFound } from "next/navigation";
import { getUniversityBySlug, getLeaderboard, getMatchesByStatus } from "@/lib/data";
import { RankingTable } from "@/components/rankings/ranking-table";
import { MatchCard } from "@/components/matches/match-card";

export default async function FaculdadePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const university = getUniversityBySlug(slug);
  if (!university) notFound();

  const ranking = getLeaderboard("school", university.id, 10);
  const matches = getMatchesByStatus(["scheduled", "live", "finished"], 30).filter(
    (m) => m.homeTeamName === university.shortName || m.awayTeamName === university.shortName
  );

  return (
    <div className="space-y-6">
      <header>
        <p className="text-sm text-muted-foreground">Faculdade</p>
        <h1 className="text-2xl font-bold">{university.name}</h1>
        <p className="text-sm text-muted-foreground">
          #{university.rank} no ranking semanal · {university.weeklyPoints} pts
        </p>
      </header>

      <RankingTable title={`Ranking ${university.shortName}`} entries={ranking} showAccuracy />

      {matches.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Jogos</h2>
          <div className="space-y-3">
            {matches.slice(0, 8).map((m) => (
              <MatchCard key={m.id} match={m} compact />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
