"use client";

import { useEffect, useState, useTransition } from "react";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";
import { SPORT_ICONS } from "@/lib/constants/sports";
import { StandingsTable } from "./StandingsTable";
import { ScorersTable } from "./ScorersTable";
import { PlayoffBracket } from "./PlayoffBracket";
import type {
  PlayoffBracket as PlayoffBracketData,
  ScorerEntry,
  SportSlug,
  StandingsEntry,
} from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;

type HomeData = {
  standings: StandingsEntry[];
  playoffBracket: PlayoffBracketData | null;
  goalScorers: ScorerEntry[];
  pointScorers: ScorerEntry[];
};

function SectionSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="space-y-2 px-4 py-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="h-10 animate-pulse rounded-lg bg-zinc-800/80" />
      ))}
    </div>
  );
}

type Props = {
  sport: SportSlug;
  series: SeriesLetter;
};

export function HomeDashboard({ sport, series }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [data, setData] = useState<HomeData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);

    fetch(`/api/home?sport=${sport}&series=${series}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((json: HomeData | null) => {
        if (json) setData(json);
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sport, series]);

  function updateParams(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.set(key, value);
    startTransition(() => {
      router.replace(`/?${params.toString()}`, { scroll: false });
    });
  }

  const isBasketball = sport === "basquete";
  const sportLabel = SPORT_ICONS[sport]?.label ?? sport;
  const standings = data?.standings ?? [];
  const goalScorers = data?.goalScorers ?? [];
  const pointScorers = data?.pointScorers ?? [];
  const playoffBracket = data?.playoffBracket ?? null;

  return (
    <div className={cn("space-y-5", isPending && "opacity-80")}>
      <section className="cartola-card overflow-hidden p-1">
        <div className="grid grid-cols-3 gap-1">
          {(Object.keys(SPORT_ICONS) as SportSlug[]).map((slug) => {
            const s = SPORT_ICONS[slug];
            const active = sport === slug;
            return (
              <button
                key={slug}
                type="button"
                onClick={() => updateParams("sport", slug)}
                className={cn(
                  "flex flex-col items-center gap-1.5 rounded-xl px-2 py-4 transition-all",
                  active
                    ? "accent-bg text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                <Image
                  src={s.image}
                  alt={s.label}
                  width={40}
                  height={40}
                  className="h-10 w-10 object-contain"
                  unoptimized
                />
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
          {loading && !data ? (
            <SectionSkeleton rows={6} />
          ) : (
            <StandingsTable entries={standings} />
          )}
        </div>
      </section>

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">Mata-mata</h2>
          <p className="text-xs font-medium text-zinc-500">
            {sportLabel} · Série {series}
          </p>
        </div>
        {loading && !data ? (
          <SectionSkeleton rows={3} />
        ) : (
          <PlayoffBracket
            sport={sport}
            series={series}
            initialBracket={playoffBracket}
          />
        )}
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
        {loading && !data ? (
          <SectionSkeleton rows={5} />
        ) : (
          <ScorersTable
            entries={isBasketball ? pointScorers : goalScorers}
            label={isBasketball ? "Pontuadores" : "Artilheiros"}
            unit={isBasketball ? "pts" : "gols"}
          />
        )}
      </section>
    </div>
  );
}
