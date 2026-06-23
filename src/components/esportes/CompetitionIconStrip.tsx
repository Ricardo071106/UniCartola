"use client";

import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import type {
  EsporteCompetition,
  EsporteSeries,
  EsporteSlug,
  EsporteSport,
} from "@/lib/esportes/types";
import { ESPORTE_SERIES } from "@/lib/esportes/types";

export function CompetitionIconStrip({
  sports,
  competitions,
  selectedSport,
  selectedSeries,
}: {
  sports: EsporteSport[];
  competitions: EsporteCompetition[];
  selectedSport: EsporteSlug;
  selectedSeries: EsporteSeries;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const selectedSportId = sports.find((s) => s.slug === selectedSport)?.id;

  function updateParams(next: { sport?: EsporteSlug; series?: EsporteSeries }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.sport) params.set("sport", next.sport);
    if (next.series) params.set("series", next.series);
    router.replace(`${pathname}?${params.toString()}`, { scroll: false });
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-1">
        {sports.map((sport) => {
          const active = sport.slug === selectedSport;

          return (
            <button
              key={sport.id}
              type="button"
              onClick={() => updateParams({ sport: sport.slug })}
              className={cn(
                "flex flex-col items-center gap-1.5 rounded-xl px-2 py-4 transition-all",
                active
                  ? "accent-bg text-white ring-2 ring-[#4f8cff]"
                  : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              <Image
                src={sport.icon}
                alt={sport.name}
                width={40}
                height={40}
                className="h-10 w-10 object-contain"
                unoptimized
              />
              <span className="text-xs font-black uppercase tracking-wide">
                {sport.name}
              </span>
            </button>
          );
        })}
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-none">
        {ESPORTE_SERIES.map((series) => {
          const active = selectedSeries === series;
          const enabled = competitions.some(
            (c) => c.series === series && c.sportId === selectedSportId
          );

          return (
            <button
              key={series}
              type="button"
              disabled={!enabled}
              onClick={() => updateParams({ series })}
              className={cn(
                "cartola-pill shrink-0 disabled:cursor-not-allowed disabled:opacity-40",
                active ? "cartola-pill-active" : "cartola-pill-inactive"
              )}
            >
              Série {series}
            </button>
          );
        })}
      </div>
    </div>
  );
}
