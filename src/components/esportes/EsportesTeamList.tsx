import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EsporteTeam } from "@/lib/esportes/types";

export function EsportesTeamList({ teams }: { teams: EsporteTeam[] }) {
  if (teams.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          Nenhum time cadastrado
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {teams.map((team) => (
        <Link
          key={team.id}
          href={`/esportes/atletica/${team.id}`}
          className="group flex items-center gap-3 rounded-xl border border-zinc-800/50 bg-zinc-900/50 px-4 py-3 transition-colors hover:bg-zinc-900"
        >
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-black text-white"
            style={{ backgroundColor: team.color }}
          >
            {team.shortName.slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-white">{team.name}</p>
            <p className="text-xs text-zinc-500">{team.shortName}</p>
          </div>
          <ChevronRight className="h-4 w-4 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
        </Link>
      ))}
    </div>
  );
}
