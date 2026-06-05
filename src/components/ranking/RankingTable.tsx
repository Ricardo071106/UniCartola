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
      <div className="overflow-hidden rounded-xl border border-gray-100">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
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
                className="border-t border-gray-50 hover:bg-gray-50/50"
              >
                <td className="px-4 py-3 font-bold text-gray-500">
                  {entry.rank <= 3 ? (
                    <Trophy
                      className={cn(
                        "h-4 w-4",
                        entry.rank === 1 && "text-amber-500",
                        entry.rank === 2 && "text-gray-400",
                        entry.rank === 3 && "text-orange-400"
                      )}
                    />
                  ) : (
                    entry.rank
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className="font-semibold text-gray-900">
                    {entry.shortName}
                  </span>
                  <span className="block text-xs text-gray-500">
                    {entry.name}
                  </span>
                </td>
                <td className="px-4 py-3 text-right font-bold text-[#1e3a5f]">
                  {entry.totalPoints.toLocaleString("pt-BR")}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {universityEntries.length === 0 && (
          <p className="p-6 text-center text-gray-500">Sem dados</p>
        )}
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-gray-100">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
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
              className="border-t border-gray-50 hover:bg-gray-50/50"
            >
              <td className="px-4 py-3 font-bold text-gray-500 w-12">
                {entry.rank}
              </td>
              <td className="px-4 py-3 font-semibold text-gray-900">
                {entry.nickname}
              </td>
              <td className="px-4 py-3 text-gray-500 hidden sm:table-cell">
                {entry.universityShortName ?? "—"}
              </td>
              <td className="px-4 py-3 text-right font-bold text-[#1e3a5f]">
                {entry.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {userEntries.length === 0 && (
        <p className="p-6 text-center text-gray-500">Sem dados</p>
      )}
    </div>
  );
}
