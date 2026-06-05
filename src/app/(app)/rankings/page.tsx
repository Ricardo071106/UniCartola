import { RankingTable } from "@/components/ranking/RankingTable";
import { getGeneralLeaderboard } from "@/lib/queries/rankings";

export const dynamic = "force-dynamic";

export default async function RankingsPage() {
  const userRankings = await getGeneralLeaderboard(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Ranking</h1>
        <p className="text-sm text-zinc-400">
          Pontuação geral dos palpiteiros
        </p>
      </div>
      <RankingTable type="users" userEntries={userRankings} />
    </div>
  );
}
