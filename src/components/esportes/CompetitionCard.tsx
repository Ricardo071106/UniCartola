import Link from "next/link";
import { ChevronRight } from "lucide-react";
import type { EsporteCompetition, EsporteSport } from "@/lib/esportes/types";

export function CompetitionCard({
  competition,
  sport,
}: {
  competition: EsporteCompetition;
  sport: EsporteSport;
}) {
  const gender = sport.gender === "masculino" ? "Masculino" : "Feminino";

  return (
    <Link
      href={`/esportes/competicao/${competition.id}`}
      className="group flex items-center gap-4 rounded-2xl border border-zinc-800 bg-zinc-950 p-4 transition-all hover:border-[#1e3a5f] hover:bg-zinc-900"
    >
      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/30 text-2xl">
        {sport.icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-black text-white">
          {sport.name} {gender}
        </p>
        <p className="text-xs text-zinc-500">Temporada {competition.season}</p>
      </div>
      <ChevronRight className="h-5 w-5 shrink-0 text-zinc-600 transition-transform group-hover:translate-x-0.5 group-hover:text-white" />
    </Link>
  );
}
