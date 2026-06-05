"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { StandingsTable } from "./StandingsTable";
import { ScorersTable } from "./ScorersTable";
import type { ScorerEntry, SportSlug, StandingsEntry } from "@/types";

const SPORTS: {
  slug: SportSlug;
  label: string;
  emoji: string;
}[] = [
  { slug: "futsal", label: "Futsal", emoji: "⚽" },
  { slug: "futebol", label: "Futebol", emoji: "🥅" },
  { slug: "basquete", label: "Basquete", emoji: "🏀" },
];

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;

type Props = {
  sport: SportSlug;
  series: (typeof SERIES)[number];
  standings: StandingsEntry[];
  goalScorers: ScorerEntry[];
  pointScorers: ScorerEntry[];
};

export function HomeDashboard({
  sport,
  series,
  standings,
  goalScorers,
  pointScorers,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    router.push(`/?${params.toString()}`);
  }

  const isBasketball = sport === "basquete";
  const sportLabel = SPORTS.find((s) => s.slug === sport)?.label ?? sport;

  return (
    <div className="space-y-5">
      {/* Esportes — topo, lado a lado */}
      <section className="cartola-card overflow-hidden p-1">
        <div className="grid grid-cols-3 gap-1">
          {SPORTS.map((s) => {
            const active = sport === s.slug;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => updateParams("sport", s.slug)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2 py-4 transition-all",
                  active
                    ? "bg-[#006b3f] text-white shadow-inner"
                    : "bg-[#f4f6f4] text-[#5c6b5f] hover:bg-[#e8f5ee]"
                )}
              >
                <span className="text-2xl">{s.emoji}</span>
                <span className="text-xs font-black uppercase tracking-wide">
                  {s.label}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Classificação + séries */}
      <section className="cartola-card overflow-hidden">
        <div className="border-b border-[#dce5dc] bg-[#e8f5ee] px-4 py-3">
          <h2 className="text-base font-black text-[#004d2c]">
            Classificação
          </h2>
          <p className="text-xs font-medium text-[#5c6b5f]">
            Vitórias · {sportLabel}
          </p>
        </div>

        {/* Séries A–F */}
        <div className="flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none">
          {SERIES.map((s) => {
            const active = series === s;
            return (
              <button
                key={s}
                type="button"
                onClick={() => updateParams("series", s)}
                className={cn(
                  "cartola-pill shrink-0",
                  active ? "cartola-pill-active" : "cartola-pill-inactive"
                )}
              >
                Série {s}
              </button>
            );
          })}
        </div>

        <div className="px-2 pb-2">
          <StandingsTable entries={standings} />
        </div>
      </section>

      {/* Artilheiros / Pontuadores */}
      <section className="cartola-card overflow-hidden">
        <div className="border-b border-[#dce5dc] bg-[#e8f5ee] px-4 py-3">
          <h2 className="text-base font-black text-[#004d2c]">
            {isBasketball ? "Maiores Pontuadores" : "Artilheiros"}
          </h2>
          <p className="text-xs font-medium text-[#5c6b5f]">
            {sportLabel} · Série {series}
          </p>
        </div>
        <ScorersTable
          entries={isBasketball ? pointScorers : goalScorers}
          label={isBasketball ? "Pontuadores" : "Artilheiros"}
          unit={isBasketball ? "pts" : "gols"}
        />
      </section>
    </div>
  );
}
