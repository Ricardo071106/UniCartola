import Link from "next/link";
import { getCompetitionLabel } from "@/lib/esportes/repository";
import type { EsporteGameWithDetails } from "@/lib/esportes/types";

function TeamInitials({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function RecentResultCard({ game }: { game: EsporteGameWithDetails }) {
  const sportLabel = getCompetitionLabel(game.competition, game.sport);
  const homeWins = (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = (game.awayScore ?? 0) > (game.homeScore ?? 0);

  return (
    <Link
      href={`/esportes/jogo/${game.id}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
    >
      <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
        {sportLabel}
      </span>

      <div className="mt-3 flex items-center justify-between gap-2">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamInitials name={game.homeTeam.shortName} color={game.homeTeam.color} />
          <span
            className={`truncate text-sm font-bold ${homeWins ? "text-white" : "text-zinc-400"}`}
          >
            {game.homeTeam.shortName}
          </span>
        </div>

        <div className="flex shrink-0 items-center gap-1.5 rounded-lg bg-zinc-900 px-3 py-1.5">
          <span className={`text-lg font-black tabular-nums ${homeWins ? "text-white" : "text-zinc-500"}`}>
            {game.homeScore}
          </span>
          <span className="text-xs font-bold text-zinc-600">×</span>
          <span className={`text-lg font-black tabular-nums ${awayWins ? "text-white" : "text-zinc-500"}`}>
            {game.awayScore}
          </span>
        </div>

        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span
            className={`truncate text-sm font-bold ${awayWins ? "text-white" : "text-zinc-400"}`}
          >
            {game.awayTeam.shortName}
          </span>
          <TeamInitials name={game.awayTeam.shortName} color={game.awayTeam.color} />
        </div>
      </div>
    </Link>
  );
}
