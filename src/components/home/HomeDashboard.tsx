"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Circle, Goal, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { StandingsTable } from "./StandingsTable";
import { ScorersTable } from "./ScorersTable";
import type { ScorerEntry, SportSlug, StandingsEntry } from "@/types";

const SPORTS: { slug: SportSlug; label: string; icon: typeof Circle }[] = [
  { slug: "futsal", label: "Futsal", icon: Circle },
  { slug: "futebol", label: "Futebol", icon: Goal },
  { slug: "basquete", label: "Basquete", icon: Trophy },
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

  return (
    <div className="space-y-6">
      <section>
        <h1 className="text-2xl font-bold text-gray-900">Campus League</h1>
        <p className="text-sm text-gray-500">
          Estatísticas dos jogos universitários · Dados NDU
        </p>
      </section>

      <section>
        <div className="grid grid-cols-3 gap-2 sm:gap-3">
          {SPORTS.map((s) => {
            const active = sport === s.slug;
            const Icon = s.icon;
            return (
              <button
                key={s.slug}
                type="button"
                onClick={() => updateParams("sport", s.slug)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-xl border-2 px-3 py-4 transition-all sm:py-5",
                  active
                    ? "border-[#1e3a5f] bg-[#1e3a5f] text-white shadow-md"
                    : "border-gray-100 bg-white text-gray-600 hover:border-[#1e3a5f]/30 hover:bg-gray-50"
                )}
              >
                <Icon className={cn("h-7 w-7 sm:h-8 sm:w-8", active && "stroke-[2]")} />
                <span className="text-xs font-bold sm:text-sm">{s.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-gray-100 bg-white p-4">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">
              Classificação — Vitórias
            </h2>
            <p className="text-xs text-gray-500">
              Série {series} · {SPORTS.find((s) => s.slug === sport)?.label}
            </p>
          </div>
          <Tabs value={series} onValueChange={(v) => updateParams("series", v)}>
            <TabsList className="h-auto flex-wrap gap-1 bg-gray-100 p-1">
              {SERIES.map((s) => (
                <TabsTrigger key={s} value={s} className="px-3 py-1.5 text-xs">
                  Série {s}
                </TabsTrigger>
              ))}
            </TabsList>
            {SERIES.map((s) => (
              <TabsContent key={s} value={s} className="hidden" />
            ))}
          </Tabs>
        </div>
        <StandingsTable entries={standings} />
      </section>

      <section>
        {isBasketball ? (
          <ScorersTable
            entries={pointScorers}
            label="Maiores Pontuadores"
            unit="pts"
          />
        ) : (
          <ScorersTable
            entries={goalScorers}
            label="Artilheiros"
            unit="gols"
          />
        )}
      </section>
    </div>
  );
}
