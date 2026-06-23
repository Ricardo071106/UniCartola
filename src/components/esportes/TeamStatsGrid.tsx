import { cn } from "@/lib/utils";
import type { EsporteTeamStats } from "@/lib/esportes/types";

const STAT_ITEMS = [
  { key: "gamesPlayed" as const, label: "Jogos" },
  { key: "wins" as const, label: "Vitórias" },
  { key: "draws" as const, label: "Empates" },
  { key: "losses" as const, label: "Derrotas" },
  { key: "goalsFor" as const, label: "Gols Pró" },
  { key: "goalsAgainst" as const, label: "Gols Contra" },
];

export function TeamStatsGrid({ stats }: { stats: EsporteTeamStats }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
      {STAT_ITEMS.map(({ key, label }) => (
        <div
          key={key}
          className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center"
        >
          <p className="text-2xl font-black tabular-nums text-white">
            {stats[key]}
          </p>
          <p className="mt-1 text-xs font-medium text-zinc-500">{label}</p>
        </div>
      ))}
    </div>
  );
}

export function TeamHero({ team }: { team: { name: string; shortName: string; color: string } }) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-6 sm:flex-row sm:items-center">
      <div
        className={cn(
          "flex h-20 w-20 shrink-0 items-center justify-center rounded-2xl text-2xl font-black text-white shadow-lg"
        )}
        style={{ backgroundColor: team.color }}
      >
        {team.shortName.slice(0, 2).toUpperCase()}
      </div>
      <div className="text-center sm:text-left">
        <h1 className="text-2xl font-black text-white">{team.name}</h1>
        <p className="text-sm text-zinc-500">Atlética Universitária</p>
      </div>
    </div>
  );
}
