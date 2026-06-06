"use client";

import { useEffect, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionCard } from "@/components/prediction/PredictionCard";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { RealEntryButton } from "@/components/currency/RealEntryButton";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { submitMarketPrediction } from "@/actions/market-predictions";
import type { CurrencyMode } from "@/lib/currency/mode";
import type { MatchWithTeams, SportSlug } from "@/types";
import type { MarketPredictionView } from "@/lib/queries/market-predictions";
import type { PlayerOption, TeamOption } from "@/lib/queries/palpites-options";
import type { PredictionResult } from "@/types";

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
  playBalance: number;
  realBalance: number;
  realEntryPaid: boolean;
  isLoggedIn: boolean;
  teamOptions: TeamOption[];
  scorerOptions: PlayerOption[];
  cardOptions: PlayerOption[];
  upcomingMatches: MatchWithTeams[];
  marketPredictions: MarketPredictionView[];
  matchPredictions: Record<
    string,
    {
      result: PredictionResult;
      homeScore: number | null;
      awayScore: number | null;
    }
  >;
}

function PlayerSelect({
  name,
  options,
  defaultValue,
  disabled,
  placeholder,
}: {
  name: string;
  options: PlayerOption[];
  defaultValue?: string | null;
  disabled?: boolean;
  placeholder: string;
}) {
  return (
    <select
      name={name}
      defaultValue={defaultValue ?? ""}
      disabled={disabled}
      className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
    >
      <option value="">{placeholder}</option>
      {options.map((p) => (
        <option key={p.name} value={p.name}>
          {p.name}
          {p.teamName ? ` · ${p.teamName}` : ""}
        </option>
      ))}
    </select>
  );
}

export function PalpitesClient({
  sport,
  series,
  currencyMode,
  playBalance,
  realBalance,
  realEntryPaid,
  isLoggedIn,
  teamOptions,
  scorerOptions,
  cardOptions,
  upcomingMatches,
  marketPredictions,
  matchPredictions,
}: PalpitesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();
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

  const savedMatchEntries = upcomingMatches
    .filter((m) => matchPredictions[m.id])
    .map((m) => ({
      match: m,
      prediction: matchPredictions[m.id]!,
    }));

  const hasSavedMarket =
    Boolean(champion?.athleticsName || champion?.athleticsId) ||
    Boolean(topScorer?.playerName) ||
    Boolean(topCards?.playerName);
  const hasSavedMatches = savedMatchEntries.length > 0;

  const resultLabel = (
    result: PredictionResult,
    home: string,
    away: string
  ) => {
    if (result === "home") return home;
    if (result === "away") return away;
    return "Empate";
  };

  function updateParams(key: string, value: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set(key, value);
    router.push(`/palpites?${p.toString()}`);
  }

  function saveMarket(
    marketType: "champion" | "top_scorer" | "top_cards",
    form: FormData
  ) {
    startTransition(async () => {
      const res = await submitMarketPrediction({
        sportSlug: sport,
        series,
        marketType,
        athleticsId: form.get("athleticsId")?.toString(),
        playerName: form.get("playerName")?.toString(),
      });
      if (res.error) alert(res.error);
      else router.refresh();
    });
  }

  return (
    <div className="space-y-6">
      <div className="cartola-card flex flex-col gap-4 p-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-bold text-white">Modo de jogo</p>
            <p className="text-xs text-zinc-500">
              {isRealMode
                ? "Palpites pagos · ambiente separado do modo fichas"
                : "Palpites gratuitos · fichas virtuais"}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <CurrencyToggle
              mode={currencyMode}
              playBalance={playBalance}
              realBalance={realBalance}
            />
            {isRealMode && isLoggedIn && (
              <RealEntryButton paid={realEntryPaid} />
            )}
          </div>
        </div>

        {isRealMode && isLoggedIn && !realEntryPaid && (
          <p className="rounded-lg border border-amber-600/40 bg-amber-600/10 px-3 py-2 text-xs text-amber-300">
            Pague a inscrição de R$ 30,00 para liberar palpites no modo dinheiro
            real. Este ambiente é independente do modo fichas.
          </p>
        )}
      </div>

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

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-black text-white">Jogos futuros</h2>
          <p className="text-xs text-zinc-500">
            Vencedor e placar · aposta de 100{" "}
            {currencyMode === "play" ? "fichas" : "créditos"}
            {isRealMode && " · ambiente pago"}
          </p>
        </div>

        {upcomingMatches.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            Nenhum jogo agendado nesta série
          </p>
        )}

        {upcomingMatches.map((match) => {
          const hasSaved = Boolean(matchPredictions[match.id]);
          return (
            <div key={match.id} className="space-y-3">
              <MatchCard match={match} compact />
              {canBet && !hasSaved ? (
                <PredictionCard
                  matchId={match.id}
                  homeShortName={match.homeTeam.name}
                  awayShortName={match.awayTeam.name}
                  matchStatus={match.status}
                  existingPrediction={null}
                />
              ) : canBet && hasSaved ? (
                <p className="text-xs text-zinc-500">
                  Palpite salvo — veja em &quot;Seus palpites salvos&quot; abaixo.
                </p>
              ) : isLoggedIn && isRealMode && !realEntryPaid ? (
                <p className="text-xs text-amber-400">
                  Pague a inscrição para palpitar neste jogo no modo real.
                </p>
              ) : null}
            </div>
          );
        })}
      </section>

      <section className="cartola-card space-y-4 border border-[#006b3f]/30 p-4">
        <div>
          <h2 className="text-base font-black text-white">Seus palpites salvos</h2>
          <p className="text-xs text-zinc-500">
            {sports.find((s) => s.slug === sport)?.label} · Série {series}
            {isRealMode ? " · modo real" : " · modo fichas"}
          </p>
        </div>

        {!isLoggedIn && (
          <p className="text-sm text-zinc-400">
            Faça login para registrar e ver seus palpites.
          </p>
        )}

        {isLoggedIn && (
          <>
            <div className="space-y-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                Temporada
              </p>

              {hasSavedMarket && (
                <div className="space-y-1 rounded-lg bg-zinc-900/60 p-3 text-sm">
                  {(champion?.athleticsName || champion?.athleticsId) && (
                    <p className="text-white">
                      <span className="text-zinc-400">Campeão:</span>{" "}
                      {champion?.athleticsName ??
                        liveTeams.find((t) => t.id === champion?.athleticsId)
                          ?.name ??
                        "—"}
                    </p>
                  )}
                  {topScorer?.playerName && (
                    <p className="text-white">
                      <span className="text-zinc-400">
                        {isBasketball ? "Pontuador" : "Artilheiro"}:
                      </span>{" "}
                      {topScorer.playerName}
                    </p>
                  )}
                  {!isBasketball && topCards?.playerName && (
                    <p className="text-white">
                      <span className="text-zinc-400">Cartões:</span>{" "}
                      {topCards.playerName}
                    </p>
                  )}
                </div>
              )}

              <form
                className="space-y-2"
                action={(fd) => saveMarket("champion", fd)}
              >
                <label className="text-xs font-semibold text-zinc-400">
                  Campeão da série {series}
                </label>
                <select
                  key={`teams-${sport}-${series}-${liveTeams.length}`}
                  name="athleticsId"
                  defaultValue={champion?.athleticsId ?? ""}
                  disabled={!canBet || pending || loadingPlayers}
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
                >
                  <option value="">
                    {loadingPlayers ? "Carregando times..." : "Selecione o time"}
                  </option>
                  {liveTeams.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name}
                    </option>
                  ))}
                </select>
                <Button type="submit" size="sm" disabled={!canBet || pending}>
                  {champion ? "Atualizar campeão" : "Salvar campeão"}
                </Button>
              </form>

              <form
                className="space-y-2"
                action={(fd) => saveMarket("top_scorer", fd)}
              >
                <label className="text-xs font-semibold text-zinc-400">
                  {isBasketball ? "Maior pontuador" : "Artilheiro"}
                </label>
                <PlayerSelect
                  key={`scorer-${sport}-${series}-${liveScorers.length}`}
                  name="playerName"
                  options={liveScorers}
                  defaultValue={topScorer?.playerName}
                  disabled={!canBet || pending || loadingPlayers}
                  placeholder={
                    loadingPlayers
                      ? "Carregando jogadores..."
                      : isBasketball
                        ? "Selecione o pontuador"
                        : "Selecione o artilheiro"
                  }
                />
                <Button type="submit" size="sm" disabled={!canBet || pending}>
                  {topScorer
                    ? `Atualizar ${isBasketball ? "pontuador" : "artilheiro"}`
                    : `Salvar ${isBasketball ? "pontuador" : "artilheiro"}`}
                </Button>
              </form>

              {!isBasketball && (
                <form
                  className="space-y-2"
                  action={(fd) => saveMarket("top_cards", fd)}
                >
                  <label className="text-xs font-semibold text-zinc-400">
                    Mais cartões
                  </label>
                  <PlayerSelect
                    key={`cards-${sport}-${series}-${liveCards.length}`}
                    name="playerName"
                    options={liveCards}
                    defaultValue={topCards?.playerName}
                    disabled={!canBet || pending || loadingPlayers}
                    placeholder={
                      loadingPlayers
                        ? "Carregando jogadores..."
                        : "Selecione o jogador"
                    }
                  />
                  <Button type="submit" size="sm" disabled={!canBet || pending}>
                    {topCards ? "Atualizar cartões" : "Salvar cartões"}
                  </Button>
                </form>
              )}
            </div>

            {hasSavedMatches ? (
              <div className="space-y-3 border-t border-zinc-800 pt-4">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
                  Jogos
                </p>
                {savedMatchEntries.map(({ match, prediction }) => (
                  <div key={match.id} className="space-y-3">
                    <MatchCard match={match} compact />
                    {canBet ? (
                      <PredictionCard
                        matchId={match.id}
                        homeShortName={match.homeTeam.name}
                        awayShortName={match.awayTeam.name}
                        matchStatus={match.status}
                        existingPrediction={prediction}
                      />
                    ) : (
                      <div className="rounded-lg bg-zinc-900/60 px-3 py-2 text-sm text-white">
                        <span className="text-zinc-400">Palpite:</span>{" "}
                        {resultLabel(
                          prediction.result,
                          match.homeTeam.name,
                          match.awayTeam.name
                        )}
                        {prediction.homeScore != null &&
                          prediction.awayScore != null && (
                            <span className="text-zinc-400">
                              {" "}
                              · {prediction.homeScore}×{prediction.awayScore}
                            </span>
                          )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="border-t border-zinc-800 pt-4 text-xs text-zinc-500">
                Nenhum palpite de jogo salvo nesta série ainda.
              </p>
            )}
          </>
        )}
      </section>
    </div>
  );
}
