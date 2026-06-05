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
                    ? "bg-[#006b3f] text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
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

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">Classificação</h2>
          <p className="text-xs font-medium text-zinc-500">
            Vitórias · {sportLabel}
          </p>
        </div>

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

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">
            {isBasketball ? "Maiores Pontuadores" : "Artilheiros"}
          </h2>
          <p className="text-xs font-medium text-zinc-500">
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
