import Link from "next/link";
import { ArrowLeft, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  formatGameDate,
  getCompetitionLabel,
  getGameStatusLabel,
} from "@/lib/esportes/repository";
import type { EsporteGameWithDetails } from "@/lib/esportes/types";

function StatusBadge({ status }: { status: EsporteGameWithDetails["status"] }) {
  return (
    <span
      className={cn(
        "rounded-full px-3 py-1 text-xs font-black uppercase",
        status === "live" && "bg-red-500/20 text-red-400",
        status === "scheduled" && "bg-zinc-800 text-zinc-400",
        status === "finished" && "bg-emerald-500/20 text-emerald-400"
      )}
    >
      {status === "live" && (
        <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
      )}
      {getGameStatusLabel(status)}
    </span>
  );
}

function TeamBlock({
  team,
  score,
  isWinner,
}: {
  team: EsporteGameWithDetails["homeTeam"];
  score: number | null;
  isWinner: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3">
      <div
        className={cn(
          "flex h-16 w-16 items-center justify-center rounded-2xl text-xl font-black text-white shadow-lg",
          isWinner && "ring-2 ring-[#c9a227]"
        )}
        style={{ backgroundColor: team.color }}
      >
        {team.shortName.slice(0, 2).toUpperCase()}
      </div>
      <Link
        href={`/esportes/atletica/${team.id}`}
        className="text-center text-sm font-bold text-white hover:underline"
      >
        {team.name}
      </Link>
      {(score != null) && (
        <span className="text-4xl font-black tabular-nums text-white">{score}</span>
      )}
    </div>
  );
}

export function GameDetailView({ game }: { game: EsporteGameWithDetails }) {
  const { date, time } = formatGameDate(game.scheduledAt);
  const showScore = game.status === "finished" || game.status === "live";
  const homeWins = showScore && (game.homeScore ?? 0) > (game.awayScore ?? 0);
  const awayWins = showScore && (game.awayScore ?? 0) > (game.homeScore ?? 0);
  const sportLabel = getCompetitionLabel(game.competition, game.sport);

  return (
    <div className="space-y-6">
      <Link
        href={`/esportes/competicao/${game.competitionId}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-zinc-500 hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Voltar para {game.competition.name}
      </Link>

      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="mb-6 flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
          <div className="text-center sm:text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-zinc-500">
              {sportLabel}
            </p>
            <Link
              href={`/esportes/competicao/${game.competitionId}`}
              className="text-sm font-medium text-[#c9a227] hover:underline"
            >
              {game.competition.name}
            </Link>
          </div>
          <StatusBadge status={game.status} />
        </div>

        <div className="flex items-center justify-center gap-6 sm:gap-12">
          <TeamBlock
            team={game.homeTeam}
            score={showScore ? game.homeScore : null}
            isWinner={homeWins}
          />

          <div className="flex flex-col items-center gap-1">
            {showScore ? (
              <span className="text-2xl font-black text-zinc-600">×</span>
            ) : (
              <>
                <span className="text-lg font-black text-white">{date}</span>
                <span className="accent-text text-sm font-bold">{time}</span>
              </>
            )}
          </div>

          <TeamBlock
            team={game.awayTeam}
            score={showScore ? game.awayScore : null}
            isWinner={awayWins}
          />
        </div>

        <div className="mt-8 grid gap-4 border-t border-zinc-800 pt-6 sm:grid-cols-3">
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
              Data
            </p>
            <p className="mt-1 text-sm font-bold text-white">{date}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
              Horário
            </p>
            <p className="mt-1 text-sm font-bold text-white">{time}</p>
          </div>
          <div className="text-center sm:text-left">
            <p className="text-[10px] font-bold uppercase tracking-wide text-zinc-600">
              Local
            </p>
            <p className="mt-1 flex items-center justify-center gap-1 text-sm font-bold text-white sm:justify-start">
              <MapPin className="h-3.5 w-3.5 shrink-0 text-zinc-500" />
              {game.venue}
            </p>
          </div>
        </div>

        {game.round && (
          <p className="mt-4 text-center text-xs text-zinc-500">{game.round}</p>
        )}
      </div>
    </div>
  );
}
