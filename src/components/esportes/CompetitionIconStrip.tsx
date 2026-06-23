import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { EsporteCompetition, EsporteSport } from "@/lib/esportes/types";
import { ESPORTE_SERIES } from "@/lib/esportes/types";

function CompetitionIcon({
  competition,
  sport,
}: {
  competition: EsporteCompetition;
  sport: EsporteSport;
}) {
  return (
    <Link
      href={`/esportes/competicao/${competition.id}`}
      title={competition.name}
      className="group flex shrink-0 flex-col items-center gap-1"
    >
      <div
        className={cn(
          "relative flex h-11 w-11 items-center justify-center rounded-xl",
          "border border-zinc-800 bg-zinc-950 transition-all",
          "group-hover:border-[#1e3a5f] group-hover:bg-zinc-900"
        )}
      >
        <Image
          src={sport.icon}
          alt={sport.name}
          width={22}
          height={22}
          className="h-5 w-5 object-contain"
          unoptimized
        />
        <span className="absolute -bottom-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded bg-[#1e3a5f] px-0.5 text-[9px] font-black text-white ring-1 ring-black">
          {competition.series}
        </span>
      </div>
    </Link>
  );
}

export function CompetitionIconStrip({
  sports,
  competitions,
}: {
  sports: EsporteSport[];
  competitions: EsporteCompetition[];
}) {
  return (
    <div className="space-y-3">
      {sports.map((sport) => {
        const sportComps = ESPORTE_SERIES.map((series) =>
          competitions.find(
            (c) => c.sportId === sport.id && c.series === series
          )
        ).filter((c): c is EsporteCompetition => c != null);

        return (
          <div key={sport.id} className="flex items-center gap-3">
            <span className="w-14 shrink-0 text-[10px] font-bold uppercase tracking-wide text-zinc-500">
              {sport.name}
            </span>
            <div className="flex flex-1 gap-2 overflow-x-auto pb-1">
              {sportComps.map((comp) => (
                <CompetitionIcon
                  key={comp.id}
                  competition={comp}
                  sport={sport}
                />
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
