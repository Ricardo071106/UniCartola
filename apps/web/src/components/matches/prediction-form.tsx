"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { trackEvent } from "@/components/analytics/posthog-provider";

type Outcome = "home_win" | "draw" | "away_win";

type PredictionFormProps = {
  matchId: string;
  homeTeamName: string;
  awayTeamName: string;
  existing?: {
    outcome: Outcome;
    homeScore: number | null;
    awayScore: number | null;
  } | null;
  canPredict: boolean;
};

export function PredictionForm({
  matchId,
  homeTeamName,
  awayTeamName,
  existing,
  canPredict,
}: PredictionFormProps) {
  const router = useRouter();
  const [outcome, setOutcome] = useState<Outcome | null>(existing?.outcome ?? null);
  const [homeScore, setHomeScore] = useState(existing?.homeScore?.toString() ?? "");
  const [awayScore, setAwayScore] = useState(existing?.awayScore?.toString() ?? "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!outcome) {
      setError("Selecione um resultado");
      return;
    }
    setLoading(true);
    setError(null);

    const res = await fetch("/api/predictions/match", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        matchId,
        outcome,
        homeScore: homeScore ? parseInt(homeScore, 10) : null,
        awayScore: awayScore ? parseInt(awayScore, 10) : null,
      }),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Erro ao salvar palpite");
      setLoading(false);
      return;
    }

    trackEvent("prediction_submitted", { type: "match", match_id: matchId });
    router.refresh();
    setLoading(false);
  }

  if (!canPredict) {
    return (
      <p className="rounded-lg bg-slate-100 p-4 text-center text-sm text-slate-600 dark:bg-slate-800">
        Palpites encerrados para esta partida.
      </p>
    );
  }

  const options: { value: Outcome; label: string }[] = [
    { value: "home_win", label: homeTeamName },
    { value: "draw", label: "Empate" },
    { value: "away_win", label: awayTeamName },
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setOutcome(opt.value)}
            className={cn(
              "rounded-lg border p-3 text-sm font-medium transition-colors",
              outcome === opt.value
                ? "border-emerald-600 bg-emerald-50 text-emerald-800 dark:bg-emerald-950"
                : "border-slate-200 hover:border-slate-300 dark:border-slate-700"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <div>
        <p className="mb-2 text-sm font-medium text-slate-600">Placar exato (opcional)</p>
        <div className="flex items-center gap-3">
          <input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder="0"
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900"
          />
          <span className="text-slate-400">×</span>
          <input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder="0"
            className="w-20 rounded-lg border border-slate-200 px-3 py-2 text-center dark:border-slate-700 dark:bg-slate-900"
          />
        </div>
        <p className="mt-1 text-xs text-slate-400">
          Vencedor: +3 · Placar exato: +5 · Ambos: +8
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? "Salvando..." : existing ? "Atualizar palpite" : "Confirmar palpite"}
      </Button>
    </div>
  );
}
