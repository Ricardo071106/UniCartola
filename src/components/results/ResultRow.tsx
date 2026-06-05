import Link from "next/link";
import { formatMatchDate, formatMatchTime } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

export function ResultRow({ match }: { match: MatchWithTeams }) {
  const score =
    match.homeScore != null && match.awayScore != null
      ? `${match.homeScore} - ${match.awayScore}`
      : "—";

  return (
    <Link href={`/partida/${match.id}`}>
      <div className="flex items-center gap-3 rounded-xl border border-gray-100 bg-white p-4 shadow-sm transition hover:shadow-md hover:border-[#1e3a5f]/20">
        <div className="flex-1 text-right min-w-0">
          <p className="font-bold text-gray-900 truncate">
            {match.homeUniversity.shortName}
          </p>
        </div>
        <div className="shrink-0 text-center px-3">
          <p className="text-xl font-black text-[#1e3a5f]">{score}</p>
          <p className="text-[10px] text-gray-400 uppercase">{match.modality}</p>
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-bold text-gray-900 truncate">
            {match.awayUniversity.shortName}
          </p>
        </div>
        <div className="hidden sm:block shrink-0 text-right text-[10px] text-gray-400 w-20">
          <p>{formatMatchDate(match.scheduledAt)}</p>
          <p>{formatMatchTime(match.scheduledAt)}</p>
        </div>
      </div>
    </Link>
  );
}
