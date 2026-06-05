import { Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry, UniversityRankingEntry } from "@/types";

interface RankingTableProps {
  type: "users" | "universities";
  userEntries?: LeaderboardEntry[];
  universityEntries?: UniversityRankingEntry[];
}

export function RankingTable({
  type,
  userEntries = [],
  universityEntries = [],
}: RankingTableProps) {
  if (type === "universities") {
    return (
      <div className="overflow-hidden rounded-xl border border-zinc-800">
        <table className="w-full text-sm">
          <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-500">
            <tr>
              <th className="px-4 py-3 font-semibold">#</th>
              <th className="px-4 py-3 font-semibold">Faculdade</th>
              <th className="px-4 py-3 font-semibold text-right">Pontos</th>
            </tr>
          </thead>
          <tbody>
            {universityEntries.map((entry) => (
              <tr
                key={entry.universityId}
                className="border-t border-zinc-800 hover:bg-zinc-900/50"
              >
                <td className="px-4 py-3 font-bold text-zinc-500">
                  {entry.rank <= 3 ? (
                    <Trophy
                      className={cn(
                        "h-4 w-4",
                        entry.rank === 1 && "text-amber-500",
                        entry.rank === 2 && "text-zinc-400",
                        entry.rank === 3 && "text-orange-400"
                      )}
                    />
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-white">
                    {entry.shortName}
                  </span>
                  <span className="block text-xs text-zinc-500">
                    {entry.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#00a86b]">
                  {entry.totalPoints.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {universityEntries.length === 0 && (
          <p className="p-6 text-center text-sm text-zinc-400">
            Nenhuma faculdade no ranking ainda. Cadastre-se e comece a palpitar!
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-zinc-800">
      <table className="w-full text-sm">
        <thead className="bg-zinc-900 text-left text-xs uppercase text-zinc-500">
          <tr>
            <th className="px-4 py-3 font-semibold">#</th>
            <th className="px-4 py-3 font-semibold">Jogador</th>
            <th className="px-4 py-3 font-semibold hidden sm:table-cell">
              Faculdade
            </th>
            <th className="px-4 py-3 font-semibold text-right">Pts</th>
          </tr>
        </thead>
        <tbody>
          {userEntries.map((entry) => (
            <tr
              key={entry.userId}
              className="border-t border-zinc-800 hover:bg-zinc-900/50"
            >
              <td className="px-4 py-3 font-bold text-zinc-500 w-12">
                {entry.rank}
              </td>
              <td className="px-4 py-3 font-semibold text-white">
                {entry.nickname}
              </td>
              <td className="px-4 py-3 text-zinc-500 hidden sm:table-cell">
                {entry.universityShortName ?? "—"}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#00a86b]">
                {entry.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {userEntries.length === 0 && (
        <p className="p-6 text-center text-sm text-zinc-400">
          Nenhum jogador no ranking ainda. Cadastre-se e comece a palpitar!
        </p>
      )}
    </div>
  );
}
