import Link from "next/link";
import { cn } from "@/lib/utils";
import { formatGameDate, getGameStatusLabel } from "@/lib/esportes/repository";
import type { EsporteGameWithDetails } from "@/lib/esportes/types";

function TeamInitials({ name, color }: { name: string; color: string }) {
  return (
    <div
      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-[9px] font-black text-white"
      style={{ backgroundColor: color }}
    >
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}

function GameRow({ game }: { game: EsporteGameWithDetails }) {
  const { date, time } = formatGameDate(game.scheduledAt);
  const isFinished = game.status === "finished";
  const isLive = game.status === "live";

  return (
    <Link
      href={`/esportes/jogo/${game.id}`}
      className="flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-3 py-3 transition-colors hover:bg-zinc-900"
    >
      <div className="w-14 shrink-0 text-center">
        <p className="text-xs font-bold text-zinc-400">{date}</p>
        <p className={cn("text-[10px] font-medium", isLive ? "text-red-400" : "text-zinc-600")}>
          {time}
        </p>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <TeamInitials name={game.homeTeam.shortName} color={game.homeTeam.color} />
            <span className="truncate text-sm font-bold text-white">
              {game.homeTeam.shortName}
            </span>
          </div>
          {isFinished || isLive ? (
            <span className="shrink-0 text-sm font-black tabular-nums text-white">
              {game.homeScore}
            </span>
          ) : null}
        </div>
        <div className="mt-1 flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2">
            <TeamInitials name={game.awayTeam.shortName} color={game.awayTeam.color} />
            <span className="truncate text-sm font-bold text-white">
              {game.awayTeam.shortName}
            </span>
          </div>
          {isFinished || isLive ? (
            <span className="shrink-0 text-sm font-black tabular-nums text-white">
              {game.awayScore}
            </span>
          ) : null}
        </div>
      </div>

      <div className="shrink-0">
        {isLive ? (
          <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-black uppercase text-red-400">
            Ao vivo
          </span>
        ) : (
          <span className="text-[10px] font-medium text-zinc-600">
            {getGameStatusLabel(game.status)}
          </span>
        )}
      </div>
    </Link>
  );
}

export function EsportesGameList({
  games,
  emptyMessage = "Nenhum jogo encontrado",
}: {
  games: EsporteGameWithDetails[];
  emptyMessage?: string;
}) {
  if (games.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
        <p className="text-sm font-semibold text-zinc-500">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {games.map((game) => (
        <GameRow key={game.id} game={game} />
      ))}
    </div>
  );
}
