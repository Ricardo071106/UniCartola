import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatGameDate } from "@/lib/esportes/repository";
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

export function UpcomingGameCard({ game }: { game: EsporteGameWithDetails }) {
  const { date, time } = formatGameDate(game.scheduledAt);
  const sportLabel = `${game.sport.name} ${game.sport.gender === "masculino" ? "Masculino" : "Feminino"}`;

  return (
    <Link
      href={`/esportes/jogo/${game.id}`}
      className="group block rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-zinc-700 hover:bg-zinc-900"
    >
      <div className="mb-3 flex items-center justify-between">
        <span className="text-xs font-bold uppercase tracking-wide text-zinc-500">
          {sportLabel}
        </span>
        {game.status === "live" && (
          <span className="flex items-center gap-1 rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
            Ao vivo
          </span>
        )}
      </div>

      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <TeamInitials name={game.homeTeam.shortName} color={game.homeTeam.color} />
          <span className="truncate text-sm font-bold text-white">
            {game.homeTeam.shortName}
          </span>
        </div>
        <span className="text-xs font-bold text-zinc-600">vs</span>
        <div className="flex min-w-0 flex-1 items-center justify-end gap-2">
          <span className="truncate text-sm font-bold text-white">
            {game.awayTeam.shortName}
          </span>
          <TeamInitials name={game.awayTeam.shortName} color={game.awayTeam.color} />
        </div>
      </div>

      <div className="mt-3 flex items-center justify-center gap-3 border-t border-zinc-800 pt-3">
        <span className="text-sm font-black text-white">{date}</span>
        <span className="text-zinc-600">·</span>
        <span className={cn("text-sm font-bold", game.status === "live" ? "text-red-400" : "accent-text")}>
          {time}
        </span>
      </div>
    </Link>
  );
}
