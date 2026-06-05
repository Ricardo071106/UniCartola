"use client";

import { useState, useTransition } from "react";
import { Trophy, Minus, Target } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { submitPrediction } from "@/actions/predictions";
import type { PredictionResult } from "@/types";

interface PredictionCardProps {
  matchId: string;
  homeShortName: string;
  awayShortName: string;
  existingPrediction?: {
    result: PredictionResult;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  matchStatus: string;
}

const options: { value: PredictionResult; label: string; icon: React.ReactNode }[] = [
  { value: "home", label: "Mandante", icon: <Trophy className="h-4 w-4" /> },
  { value: "draw", label: "Empate", icon: <Minus className="h-4 w-4" /> },
  { value: "away", label: "Visitante", icon: <Trophy className="h-4 w-4 rotate-180" /> },
];

export function PredictionCard({
  matchId,
  homeShortName,
  awayShortName,
  existingPrediction,
  matchStatus,
}: PredictionCardProps) {
  const [result, setResult] = useState<PredictionResult | null>(
    existingPrediction?.result ?? null
  );
  const [homeScore, setHomeScore] = useState(
    existingPrediction?.homeScore?.toString() ?? ""
  );
  const [awayScore, setAwayScore] = useState(
    existingPrediction?.awayScore?.toString() ?? ""
  );
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [pending, startTransition] = useTransition();

  const disabled = matchStatus === "finished" || matchStatus === "live";

  function handleSubmit() {
    if (!result) {
      setError("Selecione um resultado");
      return;
    }
    setError(null);
    startTransition(async () => {
      const res = await submitPrediction({
        matchId,
        result,
        homeScore: homeScore ? parseInt(homeScore, 10) : undefined,
        awayScore: awayScore ? parseInt(awayScore, 10) : undefined,
      });
      if (res.error) {
        setError(res.error);
      } else {
        setSuccess(true);
      }
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-5 w-5 text-[#00a86b]" />
          Seu palpite
        </CardTitle>
        <p className="text-xs text-zinc-400">
          Resultado +3 · Placar exato +5 · Ambos +8
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {options.map((opt) => (
            <button
              key={opt.value}
              type="button"
              disabled={disabled}
              onClick={() => setResult(opt.value)}
              className={cn(
                "flex flex-col items-center gap-1 rounded-lg border-2 p-3 text-xs font-semibold transition-colors",
                result === opt.value
                  ? "border-[#006b3f] bg-[#006b3f]/20 text-[#00a86b]"
                  : "border-zinc-700 text-zinc-400 hover:border-zinc-600",
                disabled && "opacity-50 cursor-not-allowed"
              )}
            >
              {opt.icon}
              <span>
                {opt.value === "home"
                  ? homeShortName
                  : opt.value === "away"
                    ? awayShortName
                    : opt.label}
              </span>
            </button>
          ))}
        </div>

        <div>
          <p className="mb-2 text-xs font-medium text-zinc-400">
            Placar exato (opcional)
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={homeScore}
              onChange={(e) => setHomeScore(e.target.value)}
              disabled={disabled}
              className="text-center"
            />
            <span className="text-zinc-500 font-bold">×</span>
            <Input
              type="number"
              min={0}
              placeholder="0"
              value={awayScore}
              onChange={(e) => setAwayScore(e.target.value)}
              disabled={disabled}
              className="text-center"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}
        {success && (
          <p className="text-sm text-emerald-400">Palpite registrado!</p>
        )}

        {!disabled && (
          <Button
            className="w-full"
            onClick={handleSubmit}
            disabled={pending}
          >
            {existingPrediction ? "Atualizar palpite" : "Confirmar palpite"}
          </Button>
        )}

        {disabled && (
          <p className="text-center text-sm text-zinc-400">
            Palpites encerrados para esta partida
          </p>
        )}
      </CardContent>
    </Card>
  );
}
