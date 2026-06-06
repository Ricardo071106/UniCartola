"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Target,
  Trophy,
  Minus,
  CheckCircle2,
  Shield,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { submitPrediction } from "@/actions/predictions";
import { isMatchPredictionOpen } from "@/lib/palpites/match-locks";
import {
  MATCH_PREDICTION_POINTS,
  matchPointsBreakdown,
  maxMatchPredictionPoints,
} from "@/lib/scoring-config";
import type { MatchPredictionView, PredictionResult, SportSlug } from "@/types";

interface MatchPredictionFormProps {
  matchId: string;
  sportSlug: SportSlug;
  homeTeamName: string;
  awayTeamName: string;
  matchStatus: string;
  scheduledAt: Date | string;
  existingPrediction?: MatchPredictionView | null;
  variant?: "inline" | "card";
  onSaved?: () => void;
}

const resultOptions: {
  value: PredictionResult;
  label: string;
  icon: React.ReactNode;
}[] = [
  { value: "home", label: "Mandante", icon: <Trophy className="h-4 w-4" /> },
  { value: "draw", label: "Empate", icon: <Minus className="h-4 w-4" /> },
  { value: "away", label: "Visitante", icon: <Trophy className="h-4 w-4" /> },
];

function StatInput({
  label,
  value,
  onChange,
  disabled,
  points,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  disabled?: boolean;
  points: number;
}) {
  return (
    <div className="space-y-1">
      <label className="flex items-center justify-between text-[11px] font-medium text-zinc-400">
        <span>{label}</span>
        <span className="text-[#00a86b]">+{points} pts</span>
      </label>
      <Input
        type="number"
        min={0}
        placeholder="—"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="h-9 text-center text-sm"
      />
    </div>
  );
}

export function MatchPredictionForm({
  matchId,
  sportSlug,
  homeTeamName,
  awayTeamName,
  matchStatus,
  scheduledAt,
  existingPrediction,
  variant = "card",
  onSaved,
}: MatchPredictionFormProps) {
  const router = useRouter();
  const [result, setResult] = useState<PredictionResult | null>(
    existingPrediction?.result ?? null
  );
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.homeScore?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.awayScore?.toString() ?? ""
  );
  const [homeFouls, setHomeFouls] = useState(
    existingPrediction?.homeFouls?.toString() ?? ""
  );
  const [awayFouls, setAwayFouls] = useState(
    existingPrediction?.awayFouls?.toString() ?? ""
  );
  const [homeCards, setHomeCards] = useState(
    existingPrediction?.homeCards?.toString() ?? ""
  );
  const [awayCards, setAwayCards] = useState(
    existingPrediction?.awayCards?.toString() ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [savedOpen, setSavedOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  const lock = isMatchPredictionOpen({ status: matchStatus, scheduledAt });
  const disabled = !lock.open;
  const closedMessage = lock.message;
  const isBasketball = sportSlug === "basquete";
  const pointsInfo = matchPointsBreakdown(sportSlug);
  const maxPts = maxMatchPredictionPoints(sportSlug);

  function parseOptionalInt(value: string): number | undefined {
    if (!value.trim()) return undefined;
    const n = parseInt(value, 10);
    return Number.isNaN(n) ? undefined : n;
  }

  function handleSubmit() {
    if (!result) {
      setError("Selecione o vencedor da partida");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitPrediction({
        matchId,
        result,
        homeScore: parseOptionalInt(homeScore),
        awayScore: parseOptionalInt(awayScore),
        homeFouls: isBasketball ? undefined : parseOptionalInt(homeFouls),
        awayFouls: isBasketball ? undefined : parseOptionalInt(awayFouls),
        homeCards: isBasketball ? undefined : parseOptionalInt(homeCards),
        awayCards: isBasketball ? undefined : parseOptionalInt(awayCards),
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSavedOpen(true);
        router.refresh();
        onSaved?.();
      }
    });
  }

  const wrapperClass =
    variant === "inline"
      ? "rounded-xl border border-zinc-800 bg-zinc-900/50 p-4"
      : "";

  return (
    <>
      <div className={cn("space-y-4", wrapperClass)}>
        {variant === "card" && (
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-[#00a86b]" />
            <div>
              <p className="text-sm font-bold text-white">Seu palpite</p>
              <p className="text-[11px] text-zinc-500">
                Até {maxPts} pts por partida · palpite gratuito
              </p>
            </div>
          </div>
        )}

        {variant === "inline" && (
          <p className="text-xs font-semibold uppercase tracking-wide text-[#00a86b]">
            Palpite · até {maxPts} pts
          </p>
        )}

        <div className="grid grid-cols-3 gap-2">
          {resultOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => setResult(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border-2 p-2.5 text-[11px] font-semibold transition-colors",
                result === opt.value
                  ? "border-[#006b3f] bg-[#006b3f]/20 text-[#00a86b]"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600",
                disabled && "cursor-not-allowed opacity-50"
              )}
            >
              {opt.icon}
              <span className="line-clamp-2 text-center leading-tight">
                {opt.value === "home"
                  ? homeTeamName
                  : opt.value === "away"
                    ? awayTeamName
                    : opt.label}
              </span>
            </button>
          ))}
        </div>

        <div className="space-y-2">
          <p className="text-xs font-semibold text-zinc-400">
            Placar{" "}
            <span className="font-normal text-[#00a86b]">
              (+{pointsInfo.find((p) => p.key === "exactScore")?.points} pts se
              exato)
            </span>
          </p>
          <div className="grid grid-cols-2 gap-3">
            <StatInput
              label={homeTeamName}
              value={homeScore}
              onChange={setHomeScore}
              disabled={disabled}
              points={pointsInfo.find((p) => p.key === "exactScore")?.points ?? 5}
            />
            <StatInput
              label={awayTeamName}
              value={awayScore}
              onChange={setAwayScore}
              disabled={disabled}
              points={pointsInfo.find((p) => p.key === "exactScore")?.points ?? 5}
            />
          </div>
        </div>

        {!isBasketball && (
          <>
            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                <Shield className="h-3.5 w-3.5" />
                Faltas por time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatInput
                  label={homeTeamName}
                  value={homeFouls}
                  onChange={setHomeFouls}
                  disabled={disabled}
                  points={MATCH_PREDICTION_POINTS.homeFouls}
                />
                <StatInput
                  label={awayTeamName}
                  value={awayFouls}
                  onChange={setAwayFouls}
                  disabled={disabled}
                  points={MATCH_PREDICTION_POINTS.awayFouls}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-zinc-400">
                <AlertTriangle className="h-3.5 w-3.5" />
                Cartões por time
              </p>
              <div className="grid grid-cols-2 gap-3">
                <StatInput
                  label={homeTeamName}
                  value={homeCards}
                  onChange={setHomeCards}
                  disabled={disabled}
                  points={MATCH_PREDICTION_POINTS.homeCards}
                />
                <StatInput
                  label={awayTeamName}
                  value={awayCards}
                  onChange={setAwayCards}
                  disabled={disabled}
                  points={MATCH_PREDICTION_POINTS.awayCards}
                />
              </div>
            </div>
          </>
        )}

        {error && <p className="text-sm text-red-400">{error}</p>}

        {!disabled ? (
          <Button className="w-full" onClick={handleSubmit} disabled={pending}>
            {pending
              ? "Salvando..."
              : existingPrediction
                ? "Atualizar palpite"
                : "Salvar palpite"}
          </Button>
        ) : (
          <p className="text-center text-sm text-zinc-400">
            {closedMessage ?? "Palpites encerrados para esta partida"}
          </p>
        )}
      </div>

      <Dialog open={savedOpen} onOpenChange={setSavedOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-full bg-[#006b3f]/20">
              <CheckCircle2 className="h-8 w-8 text-[#00a86b]" />
            </div>
            <DialogTitle>Aposta salva!</DialogTitle>
            <DialogDescription>
              Seu palpite foi registrado. Confira em{" "}
              <span className="font-semibold text-white">Palpites</span> a
              qualquer momento.
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
