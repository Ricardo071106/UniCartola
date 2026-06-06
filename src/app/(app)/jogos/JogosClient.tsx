"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchPredictionForm } from "@/components/prediction/MatchPredictionForm";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, MatchPredictionView, SportSlug } from "@/types";

const sports: { slug: SportSlug | "all"; label: string }[] = [
  { slug: "all", label: "Todos" },
  { slug: "futebol", label: "Futebol" },
  { slug: "futsal", label: "Futsal" },
  { slug: "basquete", label: "Basquete" },
];

const tabs = [
  { id: "upcoming", label: "Próximos" },
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "week", label: "Semana" },
  { id: "finished", label: "Encerrados" },
] as const;

interface JogosClientProps {
  initialMatches: MatchWithTeams[];
  initialSport?: SportSlug;
  initialTab: (typeof tabs)[number]["id"];
  isLoggedIn: boolean;
  canBet: boolean;
  matchPredictions: Record<string, MatchPredictionView>;
}

const BETTABLE_TABS = new Set(["upcoming", "today", "tomorrow", "week"]);

export function JogosClient({
  initialMatches,
  initialSport,
  initialTab,
  isLoggedIn,
  canBet,
  matchPredictions,
}: JogosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const showPredictions = BETTABLE_TABS.has(initialTab);

  function updateParams(sport?: string, tab?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (sport && sport !== "all") p.set("sport", sport);
    else p.delete("sport");
    if (tab) p.set("tab", tab);
    router.push(`/jogos?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sports.map((s) => {
          const active =
            (s.slug === "all" && !initialSport) || s.slug === initialSport;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() =>
                updateParams(s.slug === "all" ? undefined : s.slug, initialTab)
              }
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "accent-bg text-white"
                  : "border border-zinc-700 bg-zinc-900 text-zinc-400 hover:text-white"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <Tabs
        value={initialTab}
        onValueChange={(v) => updateParams(initialSport, v)}
      >
        <TabsList className="flex h-auto w-full gap-1 overflow-x-auto p-1">
          {tabs.map((t) => (
            <TabsTrigger
              key={t.id}
              value={t.id}
              className="shrink-0 px-3 text-xs"
            >
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={initialTab}>
          <div className="mt-2 space-y-4">
            {initialMatches.map((m) => {
              const existing = matchPredictions[m.id];
              const sportSlug = m.sport.slug as SportSlug;
              const openForBet =
                showPredictions &&
                isLoggedIn &&
                canBet &&
                m.status === "scheduled";

              return (
                <div key={m.id} className="space-y-3">
                  <MatchCard match={m} />
                  {openForBet && (
                    <MatchPredictionForm
                      matchId={m.id}
                      sportSlug={sportSlug}
                      homeTeamName={m.homeTeam.name}
                      awayTeamName={m.awayTeam.name}
                      matchStatus={m.status}
                      existingPrediction={existing ?? null}
                      variant="inline"
                    />
                  )}
                  {showPredictions && isLoggedIn && !canBet && (
                    <p className="text-xs text-amber-400">
                      Inscrição necessária para palpitar no modo real.
                    </p>
                  )}
                  {showPredictions && !isLoggedIn && (
                    <p className="text-xs text-zinc-500">
                      Faça login para palpitar neste jogo.
                    </p>
                  )}
                </div>
              );
            })}
            {initialMatches.length === 0 && (
              <p className="py-12 text-center text-sm text-zinc-400">
                {initialTab === "upcoming"
                  ? "Nenhum jogo agendado no momento"
                  : "Nenhuma partida neste período"}
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
