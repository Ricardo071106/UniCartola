"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Star, CalendarDays, Trophy } from "lucide-react";
import { MatchCard } from "@/components/match/MatchCard";
import { MatchPredictionForm } from "@/components/prediction/MatchPredictionForm";
import { SeasonPicksPanel } from "@/components/prediction/SeasonPicksPanel";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { RealEntryButton } from "@/components/currency/RealEntryButton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import { maxMatchPredictionPoints } from "@/lib/scoring-config";
import type { CurrencyMode } from "@/lib/currency/mode";
import type { MatchWithTeams, MatchPredictionView, SportSlug } from "@/types";
import type { MarketPredictionView } from "@/lib/queries/market-predictions";
import type { PlayerOption, TeamOption } from "@/lib/queries/palpites-options";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;
const sports: { slug: SportSlug; label: string }[] = [
  { slug: "futsal", label: "Futsal" },
  { slug: "futebol", label: "Futebol" },
  { slug: "basquete", label: "Basquete" },
];

interface PalpitesClientProps {
  sport: SportSlug;
  series: (typeof SERIES)[number];
  currencyMode: CurrencyMode;
  totalPoints: number;
  realBalance: number;
  realEntryPaid: boolean;
  isLoggedIn: boolean;
  teamOptions: TeamOption[];
  scorerOptions: PlayerOption[];
  cardOptions: PlayerOption[];
  upcomingMatches: MatchWithTeams[];
  savedMatchPredictions: { match: MatchWithTeams; prediction: MatchPredictionView }[];
  marketPredictions: MarketPredictionView[];
}

export function PalpitesClient({
  sport,
  series,
  currencyMode,
  totalPoints,
  realBalance,
  realEntryPaid,
  isLoggedIn,
  teamOptions,
  scorerOptions,
  cardOptions,
  upcomingMatches,
  savedMatchPredictions,
  marketPredictions,
}: PalpitesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isBasketball = sport === "basquete";
  const [liveTeams, setLiveTeams] = useState(teamOptions);
  const [liveScorers, setLiveScorers] = useState(scorerOptions);
  const [liveCards, setLiveCards] = useState(cardOptions);
  const [loadingPlayers, setLoadingPlayers] = useState(false);

  useEffect(() => {
    setLiveTeams(teamOptions);
    setLiveScorers(scorerOptions);
    setLiveCards(cardOptions);
  }, [teamOptions, scorerOptions, cardOptions]);

  useEffect(() => {
    const needsCards = !isBasketball;
    const hasAllData =
      liveTeams.length > 0 &&
      liveScorers.length > 0 &&
      (!needsCards || liveCards.length > 0);
    if (hasAllData) return;

    let cancelled = false;
    setLoadingPlayers(true);

    fetch(`/api/palpites/player-options?sport=${sport}&series=${series}`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        if (Array.isArray(data.teams) && data.teams.length > 0) {
          setLiveTeams(data.teams);
        }
        if (Array.isArray(data.scorers) && data.scorers.length > 0) {
          setLiveScorers(data.scorers);
        }
        if (Array.isArray(data.cards) && data.cards.length > 0) {
          setLiveCards(data.cards);
        }
      })
      .catch((error) => console.error("[palpites] player-options:", error))
      .finally(() => {
        if (!cancelled) setLoadingPlayers(false);
      });

    return () => {
      cancelled = true;
    };
  }, [
    sport,
    series,
    isBasketball,
    liveTeams.length,
    liveCards.length,
    liveScorers.length,
  ]);

  const champion = marketPredictions.find((m) => m.marketType === "champion");
  const topScorer = marketPredictions.find((m) => m.marketType === "top_scorer");
  const topCards = marketPredictions.find((m) => m.marketType === "top_cards");
  const isRealMode = currencyMode === "real";
  const canBet = isLoggedIn && (!isRealMode || realEntryPaid);

  const savedIds = new Set(savedMatchPredictions.map((s) => s.match.id));
  const upcomingWithoutSaved = upcomingMatches.filter((m) => !savedIds.has(m.id));

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set(key, value);
    router.push(`/palpites?${p.toString()}`);
  }

  return (
    <div className="space-y-6">
      <div className="cartola-card overflow-hidden p-0">
        <div className="bg-gradient-to-r from-[#006b3f] to-[#004d2d] px-5 py-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-emerald-200/80">
                Seus pontos
              </p>
              <p className="flex items-center gap-2 text-3xl font-black text-white">
                <Star className="h-7 w-7 text-amber-300" />
                {totalPoints.toLocaleString("pt-BR")}
                <span className="text-sm font-medium text-emerald-100/80">pts</span>
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <CurrencyToggle
                mode={currencyMode}
                totalPoints={totalPoints}
                realBalance={realBalance}
              />
              {isRealMode && isLoggedIn && (
                <RealEntryButton paid={realEntryPaid} />
              )}
            </div>
          </div>
        </div>
        <div className="px-5 py-3 text-xs text-zinc-400">
          {isRealMode
            ? "Modo dinheiro real · ranking separado"
            : "Modo gratuito · ganhe pontos a cada acerto"}
        </div>
      </div>

      {isRealMode && isLoggedIn && !realEntryPaid && (
        <p className="rounded-lg border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-xs text-amber-300">
          Pague a inscrição de R$ 30,00 para liberar palpites no modo dinheiro
          real.
        </p>
      )}

      <div className="flex gap-2 overflow-x-auto pb-1">
        {sports.map((s) => (
          <button
            key={s.slug}
            type="button"
            onClick={() => updateParams("sport", s.slug)}
            className={cn(
              "shrink-0 rounded-full px-4 py-2 text-sm font-semibold",
              sport === s.slug
                ? "accent-bg text-white"
                : "border border-zinc-700 bg-zinc-900 text-zinc-400"
            )}
          >
            {s.label}
          </button>
        ))}
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {SERIES.map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => updateParams("series", s)}
            className={cn(
              "cartola-pill shrink-0",
              series === s ? "cartola-pill-active" : "cartola-pill-inactive"
            )}
          >
            Série {s}
          </button>
        ))}
      </div>

      <Tabs defaultValue="jogos" className="space-y-4">
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 p-1">
          <TabsTrigger value="jogos" className="gap-2 py-2.5">
            <CalendarDays className="h-4 w-4" />
            Por jogo
          </TabsTrigger>
          <TabsTrigger value="temporada" className="gap-2 py-2.5">
            <Trophy className="h-4 w-4" />
            Temporada
          </TabsTrigger>
        </TabsList>

        <TabsContent value="jogos" className="space-y-6">
          {!isLoggedIn && (
            <p className="text-sm text-zinc-400">
              Faça login para registrar palpites.
            </p>
          )}

          <section className="space-y-3">
            <div>
              <h2 className="text-base font-black text-white">Próximos jogos</h2>
              <p className="text-xs text-zinc-500">
                Até {maxMatchPredictionPoints(sport)} pts por partida
              </p>
            </div>

            {upcomingWithoutSaved.length === 0 && (
              <p className="py-6 text-center text-sm text-zinc-400">
                Nenhum jogo novo para palpitar nesta série.
              </p>
            )}

            {upcomingWithoutSaved.map((match) => (
              <div
                key={match.id}
                className="space-y-3 rounded-2xl border border-zinc-800 bg-zinc-900/30 p-4"
              >
                <MatchCard match={match} compact />
                {canBet ? (
                  <MatchPredictionForm
                    matchId={match.id}
                    sportSlug={sport}
                    homeTeamName={match.homeTeam.name}
                    awayTeamName={match.awayTeam.name}
                    matchStatus={match.status}
                    variant="inline"
                  />
                ) : null}
              </div>
            ))}
          </section>

          <section className="space-y-3 border-t border-zinc-800 pt-6">
            <div>
              <h2 className="text-base font-black text-white">
                Seus palpites salvos
              </h2>
              <p className="text-xs text-zinc-500">
                {savedMatchPredictions.length} jogo
                {savedMatchPredictions.length !== 1 ? "s" : ""} nesta série
              </p>
            </div>

            {savedMatchPredictions.length === 0 ? (
              <p className="py-4 text-center text-sm text-zinc-500">
                Nenhum palpite de jogo salvo ainda.
              </p>
            ) : (
              savedMatchPredictions.map(({ match, prediction }) => (
                <div
                  key={match.id}
                  className="space-y-3 rounded-2xl border border-[#006b3f]/30 bg-[#006b3f]/5 p-4"
                >
                  <MatchCard match={match} compact />
                  {canBet ? (
                    <MatchPredictionForm
                      matchId={match.id}
                      sportSlug={sport}
                      homeTeamName={match.homeTeam.name}
                      awayTeamName={match.awayTeam.name}
                      matchStatus={match.status}
                      existingPrediction={prediction}
                      variant="inline"
                    />
                  ) : (
                    <SavedPredictionSummary
                      match={match}
                      prediction={prediction}
                    />
                  )}
                </div>
              ))
            )}
          </section>
        </TabsContent>

        <TabsContent value="temporada">
          {!isLoggedIn ? (
            <p className="text-sm text-zinc-400">
              Faça login para palpitar na temporada.
            </p>
          ) : (
            <SeasonPicksPanel
              sport={sport}
              series={series}
              isBasketball={isBasketball}
              canBet={canBet}
              loadingPlayers={loadingPlayers}
              teamOptions={liveTeams}
              scorerOptions={liveScorers}
              cardOptions={liveCards}
              {...(champion ? { champion } : {})}
              {...(topScorer ? { topScorer } : {})}
              {...(topCards ? { topCards } : {})}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function SavedPredictionSummary({
  match,
  prediction,
}: {
  match: MatchWithTeams;
  prediction: MatchPredictionView;
}) {
  const winner =
    prediction.result === "home"
      ? match.homeTeam.name
      : prediction.result === "away"
        ? match.awayTeam.name
        : "Empate";

  return (
    <div className="grid gap-2 rounded-lg bg-zinc-900/60 p-3 text-sm sm:grid-cols-2">
      <p>
        <span className="text-zinc-400">Vencedor:</span>{" "}
        <span className="text-white">{winner}</span>
      </p>
      {prediction.homeScore != null && prediction.awayScore != null && (
        <p>
          <span className="text-zinc-400">Placar:</span>{" "}
          <span className="text-white">
            {prediction.homeScore} × {prediction.awayScore}
          </span>
        </p>
      )}
      {prediction.homeFouls != null && (
        <p>
          <span className="text-zinc-400">Faltas:</span>{" "}
          <span className="text-white">
            {prediction.homeFouls} / {prediction.awayFouls ?? "—"}
          </span>
        </p>
      )}
      {prediction.homeCards != null && (
        <p>
          <span className="text-zinc-400">Cartões:</span>{" "}
          <span className="text-white">
            {prediction.homeCards} / {prediction.awayCards ?? "—"}
          </span>
        </p>
      )}
    </div>
  );
}
