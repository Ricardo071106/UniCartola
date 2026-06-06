"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Trophy,
  Crosshair,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { submitMarketPrediction } from "@/actions/market-predictions";
import { SEASON_PREDICTION_POINTS } from "@/lib/scoring-config";
import type { SportSlug } from "@/types";
import type { MarketPredictionView } from "@/lib/queries/market-predictions";
import type { PlayerOption, TeamOption } from "@/lib/queries/palpites-options";
import type { MarketLockInfo } from "@/lib/palpites/market-locks";

interface SeasonPicksPanelProps {
  sport: SportSlug;
  series: string;
  isBasketball: boolean;
  canBet: boolean;
  loadingPlayers: boolean;
  teamOptions: TeamOption[];
  scorerOptions: PlayerOption[];
  cardOptions: PlayerOption[];
  marketLocks?: {
    champion?: MarketLockInfo;
    top_scorer?: MarketLockInfo;
    top_cards?: MarketLockInfo;
  };
  champion?: MarketPredictionView;
  topScorer?: MarketPredictionView;
  topCards?: MarketPredictionView;
}

function MarketCard({
  icon,
  title,
  subtitle,
  points,
  savedLabel,
  children,
  accent,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  points: number;
  savedLabel?: string | null;
  children: React.ReactNode;
  accent: string;
}) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border border-zinc-800 bg-gradient-to-br from-zinc-900 to-zinc-950 p-5",
        accent
      )}
    >
      <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-white/5 blur-2xl" />
      <div className="relative space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#006b3f]/20 text-[#00a86b]">
              {icon}
            </div>
            <div>
              <h3 className="font-bold text-white">{title}</h3>
              <p className="text-xs text-zinc-500">{subtitle}</p>
            </div>
          </div>
          <span className="shrink-0 rounded-full bg-[#006b3f]/20 px-2.5 py-1 text-xs font-bold text-[#00a86b]">
            +{points} pts
          </span>
        </div>

        {savedLabel && (
          <div className="rounded-lg border border-[#006b3f]/30 bg-[#006b3f]/10 px-3 py-2">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-[#00a86b]">
              Palpite salvo
            </p>
            <p className="mt-0.5 text-sm font-medium text-white">{savedLabel}</p>
          </div>
        )}

        {children}
      </div>
    </div>
  );
}

export function SeasonPicksPanel({
  sport,
  series,
  isBasketball,
  canBet,
  loadingPlayers,
  teamOptions,
  scorerOptions,
  cardOptions,
  marketLocks,
  champion,
  topScorer,
  topCards,
}: SeasonPicksPanelProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [savedOpen, setSavedOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function saveMarket(
    marketType: "champion" | "top_scorer" | "top_cards",
    form: FormData
  ) {
    setError(null);
    startTransition(async () => {
      const res = await submitMarketPrediction({
        sportSlug: sport,
        series: series as "A" | "B" | "C" | "D" | "E" | "F",
        marketType,
        athleticsId: form.get("athleticsId")?.toString(),
        playerName: form.get("playerName")?.toString(),
      });
      if (res.error) setError(res.error);
      else {
        setSavedOpen(true);
        router.refresh();
      }
    });
  }

  const championName =
    champion?.athleticsName ??
    teamOptions.find((t) => t.id === champion?.athleticsId)?.name;

  function lockBanner(lock?: MarketLockInfo) {
    if (!lock?.locked || !lock.message) return null;
    return (
      <p
        className={cn(
          "rounded-lg px-3 py-2 text-xs",
          lock.reason === "eliminated"
            ? "border border-red-500/30 bg-red-500/10 text-red-300"
            : "border border-amber-500/30 bg-amber-500/10 text-amber-200"
        )}
      >
        {lock.message}
      </p>
    );
  }

  return (
    <>
      <div className="space-y-4">
        <div className="flex items-center gap-2 rounded-xl border border-zinc-800 bg-zinc-900/60 px-4 py-3">
          <Sparkles className="h-5 w-5 text-amber-400" />
          <p className="text-sm text-zinc-300">
            Palpites de temporada valem pontos no ranking ao final da série.
            Cada acerto soma pontos — palpite gratuito.
          </p>
        </div>

        {error && (
          <p className="rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-300">
            {error}
          </p>
        )}

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <MarketCard
            icon={<Trophy className="h-5 w-5" />}
            title="Campeão"
            subtitle={`Série ${series}`}
            points={SEASON_PREDICTION_POINTS.champion}
            savedLabel={championName}
            accent="border-amber-500/20"
          >
            {lockBanner(marketLocks?.champion)}
            <form className="space-y-3" action={(fd) => saveMarket("champion", fd)}>
              <select
                name="athleticsId"
                defaultValue={champion?.athleticsId ?? ""}
                disabled={
                  !canBet ||
                  pending ||
                  loadingPlayers ||
                  marketLocks?.champion?.locked
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white"
              >
                <option value="">
                  {loadingPlayers ? "Carregando..." : "Escolha o campeão"}
                </option>
                {teamOptions.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                className="w-full"
                disabled={!canBet || pending || marketLocks?.champion?.locked}
              >
                {championName ? "Atualizar campeão" : "Salvar campeão"}
              </Button>
            </form>
          </MarketCard>

          <MarketCard
            icon={<Crosshair className="h-5 w-5" />}
            title={isBasketball ? "Cestinha" : "Artilheiro"}
            subtitle={isBasketball ? "Maior pontuador" : "Gols na série"}
            points={SEASON_PREDICTION_POINTS.top_scorer}
            savedLabel={topScorer?.playerName}
            accent="border-emerald-500/20"
          >
            {lockBanner(marketLocks?.top_scorer)}
            <form
              className="space-y-3"
              action={(fd) => saveMarket("top_scorer", fd)}
            >
              <select
                name="playerName"
                defaultValue={topScorer?.playerName ?? ""}
                disabled={
                  !canBet ||
                  pending ||
                  loadingPlayers ||
                  marketLocks?.top_scorer?.locked
                }
                className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white"
              >
                <option value="">
                  {loadingPlayers
                    ? "Carregando..."
                    : isBasketball
                      ? "Escolha o pontuador"
                      : "Escolha o artilheiro"}
                </option>
                {scorerOptions.map((p) => (
                  <option key={p.name} value={p.name}>
                    {p.name}
                    {p.teamName ? ` · ${p.teamName}` : ""}
                  </option>
                ))}
              </select>
              <Button
                type="submit"
                className="w-full"
                disabled={!canBet || pending || marketLocks?.top_scorer?.locked}
              >
                {topScorer?.playerName
                  ? `Atualizar ${isBasketball ? "cestinha" : "artilheiro"}`
                  : `Salvar ${isBasketball ? "cestinha" : "artilheiro"}`}
              </Button>
            </form>
          </MarketCard>

          {!isBasketball && (
            <MarketCard
              icon={<AlertTriangle className="h-5 w-5" />}
              title="Cartões"
              subtitle="Jogador com mais cartões"
              points={SEASON_PREDICTION_POINTS.top_cards}
              savedLabel={topCards?.playerName}
              accent="border-yellow-500/20"
            >
              {lockBanner(marketLocks?.top_cards)}
              <form
                className="space-y-3"
                action={(fd) => saveMarket("top_cards", fd)}
              >
                <select
                  name="playerName"
                  defaultValue={topCards?.playerName ?? ""}
                  disabled={
                    !canBet ||
                    pending ||
                    loadingPlayers ||
                    marketLocks?.top_cards?.locked
                  }
                  className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-sm text-white"
                >
                  <option value="">
                    {loadingPlayers ? "Carregando..." : "Escolha o jogador"}
                  </option>
                  {cardOptions.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                      {p.teamName ? ` · ${p.teamName}` : ""}
                    </option>
                  ))}
                </select>
                <Button
                  type="submit"
                  className="w-full"
                  disabled={!canBet || pending || marketLocks?.top_cards?.locked}
                >
                  {topCards?.playerName ? "Atualizar cartões" : "Salvar cartões"}
                </Button>
              </form>
            </MarketCard>
          )}
        </div>
      </div>

      <Dialog open={savedOpen} onOpenChange={setSavedOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#006b3f]/20">
              <CheckCircle2 className="h-8 w-8 text-[#00a86b]" />
            </div>
            <DialogTitle>Aposta salva!</DialogTitle>
            <DialogDescription>
              Seu palpite de temporada foi registrado com sucesso.
            </DialogDescription>
          </DialogHeader>
          <Button className="w-full" onClick={() => setSavedOpen(false)}>
            Continuar
          </Button>
        </DialogContent>
      </Dialog>
    </>
  );
}
