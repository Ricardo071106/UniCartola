import Link from "next/link";
import type { EsporteStanding, EsporteTeam } from "@/lib/esportes/types";

function rankStyle(rank: number) {
  if (rank === 1) return "bg-[#e8a317] text-black";
  if (rank === 2) return "bg-zinc-500 text-black";
  if (rank === 3) return "bg-[#c47d2a] text-black";
  return "bg-zinc-800 text-zinc-400";
}

function TeamBadge({ team }: { team: EsporteTeam }) {
  return (
    <div
      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
      style={{ backgroundColor: team.color }}
    >
      {team.shortName.slice(0, 2).toUpperCase()}
    </div>
  );
}

export function EsportesStandingsTable({
  entries,
}: {
  entries: (EsporteStanding & { team: EsporteTeam })[];
}) {
  if (entries.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-12 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          Classificação ainda não disponível
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-2xl border border-zinc-800 bg-zinc-950">
      <div className="min-w-[480px]">
        <div className="grid grid-cols-[36px_1fr_repeat(8,36px)] gap-1 border-b border-zinc-800 px-3 py-2.5 text-[10px] font-bold uppercase tracking-wide text-zinc-600">
          <span>Pos</span>
          <span>Time</span>
          <span className="text-center">Pts</span>
          <span className="text-center">J</span>
          <span className="text-center">V</span>
          <span className="text-center">E</span>
          <span className="text-center">D</span>
          <span className="text-center">GP</span>
          <span className="text-center">GC</span>
        </div>

        {entries.map((e) => (
          <Link
            key={e.teamId}
            href={`/esportes/atletica/${e.teamId}`}
            className="grid grid-cols-[36px_1fr_repeat(8,36px)] items-center gap-1 border-b border-zinc-800/50 px-3 py-2.5 transition-colors last:border-0 hover:bg-zinc-900"
          >
            <span
              className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${rankStyle(e.position)}`}
            >
              {e.position}
            </span>

            <div className="flex min-w-0 items-center gap-2">
              <TeamBadge team={e.team} />
              <span className="truncate text-sm font-bold text-white">
                {e.team.shortName}
              </span>
            </div>

            <span className="accent-text text-center text-sm font-black">
              {e.points}
            </span>
            <span className="text-center text-sm text-zinc-400">{e.gamesPlayed}</span>
            <span className="text-center text-sm text-emerald-400">{e.wins}</span>
            <span className="text-center text-sm text-zinc-400">{e.draws}</span>
            <span className="text-center text-sm text-red-400">{e.losses}</span>
            <span className="text-center text-sm text-zinc-300">{e.goalsFor}</span>
            <span className="text-center text-sm text-zinc-300">{e.goalsAgainst}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
