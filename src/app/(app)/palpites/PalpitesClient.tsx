"use client";

import { useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MatchCard } from "@/components/match/MatchCard";
import { PredictionCard } from "@/components/prediction/PredictionCard";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitMarketPrediction } from "@/actions/market-predictions";
import type { CurrencyMode } from "@/lib/currency/mode";
import type { MatchWithTeams, SportSlug } from "@/types";
import type { MarketPredictionView } from "@/lib/queries/market-predictions";
import type { PredictionResult } from "@/types";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;
const sports: { slug: SportSlug; label: string }[] = [
  { slug: "futsal", label: "Futsal" },
  { slug: "futebol", label: "Futebol" },
  { slug: "basquete", label: "Basquete" },
];

type AthleticOption = { id: string; name: string };

interface PalpitesClientProps {
  sport: SportSlug;
  series: (typeof SERIES)[number];
  currencyMode: CurrencyMode;
  playBalance: number;
  realBalance: number;
  isLoggedIn: boolean;
  athletics: AthleticOption[];
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

export function PalpitesClient({
  sport,
  series,
  currencyMode,
  playBalance,
  realBalance,
  isLoggedIn,
  athletics,
  upcomingMatches,
  marketPredictions,
  matchPredictions,
}: PalpitesClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const champion = marketPredictions.find((m) => m.marketType === "champion");
  const topScorer = marketPredictions.find((m) => m.marketType === "top_scorer");
  const topCards = marketPredictions.find((m) => m.marketType === "top_cards");
  const isBasketball = sport === "basquete";

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
    });
  }

  return (
    <div className="space-y-6">
      <div className="cartola-card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-bold text-white">Modo de jogo</p>
          <p className="text-xs text-zinc-500">
            Palpites e ranking separados por modo
          </p>
        </div>
        <CurrencyToggle
          mode={currencyMode}
          playBalance={playBalance}
          realBalance={realBalance}
        />
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
                ? "bg-[#006b3f] text-white"
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

      <section className="cartola-card space-y-4 p-4">
        <div>
          <h2 className="text-base font-black text-white">Palpites da temporada</h2>
          <p className="text-xs text-zinc-500">
            Campeão, {isBasketball ? "pontuador" : "artilheiro"}
            {!isBasketball && " e cartões"}
          </p>
        </div>

        {!isLoggedIn && (
          <p className="text-sm text-zinc-400">
            Faça login para registrar palpites.
          </p>
        )}

        <form
          className="space-y-2"
          action={(fd) => saveMarket("champion", fd)}
        >
          <label className="text-xs font-semibold text-zinc-400">
            Campeão da série {series}
          </label>
          <select
            name="athleticsId"
            defaultValue={champion?.athleticsId ?? ""}
            disabled={!isLoggedIn || pending}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white"
          >
            <option value="">Selecione a atlética</option>
            {athletics.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" disabled={!isLoggedIn || pending}>
            Salvar campeão
          </Button>
        </form>

        <form
          className="space-y-2"
          action={(fd) => saveMarket("top_scorer", fd)}
        >
          <label className="text-xs font-semibold text-zinc-400">
            {isBasketball ? "Maior pontuador" : "Artilheiro"}
          </label>
          <Input
            name="playerName"
            defaultValue={topScorer?.playerName ?? ""}
            placeholder="Nome do jogador"
            disabled={!isLoggedIn || pending}
          />
          <Button type="submit" size="sm" disabled={!isLoggedIn || pending}>
            Salvar {isBasketball ? "pontuador" : "artilheiro"}
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
            <Input
              name="playerName"
              defaultValue={topCards?.playerName ?? ""}
              placeholder="Nome do jogador"
              disabled={!isLoggedIn || pending}
            />
            <Button type="submit" size="sm" disabled={!isLoggedIn || pending}>
              Salvar cartões
            </Button>
          </form>
        )}
      </section>

      <section className="space-y-3">
        <div>
          <h2 className="text-base font-black text-white">Jogos futuros</h2>
          <p className="text-xs text-zinc-500">
            Vencedor e placar · aposta de 100{" "}
            {currencyMode === "play" ? "fichas" : "créditos"}
          </p>
        </div>

        {upcomingMatches.length === 0 && (
          <p className="py-8 text-center text-sm text-zinc-400">
            Nenhum jogo agendado nesta série
          </p>
        )}

        {upcomingMatches.map((match) => (
          <div key={match.id} className="space-y-3">
            <MatchCard match={match} compact />
            {isLoggedIn ? (
              <PredictionCard
                matchId={match.id}
                homeShortName={match.homeTeam.name}
                awayShortName={match.awayTeam.name}
                matchStatus={match.status}
                existingPrediction={matchPredictions[match.id] ?? null}
              />
            ) : null}
          </div>
        ))}
      </section>
    </div>
  );
}
