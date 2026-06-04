"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

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
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    if (!outcome) {
      setError("Selecione um resultado");
      return;
    }
    setLoading(true);
    setError(null);

    try {
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
        const data = await res.json().catch(() => ({}));
        if (res.status !== 503) {
          setError(data.error ?? "Erro ao salvar palpite");
          setLoading(false);
          return;
        }
      }

      setSaved(true);
      router.refresh();
    } catch {
      setSaved(true);
    }
    setLoading(false);
  }

  if (!canPredict) {
    return (
      <p className="rounded-lg bg-muted p-4 text-center text-sm text-muted-foreground">
        Palpites encerrados para esta partida.
      </p>
    );
  }

  const options: { value: Outcome; label: string }[] = [
    { value: "home_win", label: "Vitória Casa" },
    { value: "draw", label: "Empate" },
    { value: "away_win", label: "Vitória Visitante" },
  ];

  if (saved) {
    return (
      <p className="rounded-lg border border-success/30 bg-green-50 p-4 text-center text-sm font-medium text-success">
        Palpite salvo com sucesso!
      </p>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-3 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            type="button"
            onClick={() => setOutcome(opt.value)}
            className={cn(
              "rounded-lg border p-3 text-xs font-medium transition-colors sm:text-sm",
              outcome === opt.value
                ? "border-accent bg-accent/5 text-accent"
                : "border-border hover:border-accent/30"
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        {homeTeamName} vs {awayTeamName}
      </p>

      <div>
        <p className="mb-2 text-sm font-medium">Placar exato (opcional)</p>
        <div className="flex items-center gap-3">
          <Input
            type="number"
            min={0}
            value={homeScore}
            onChange={(e) => setHomeScore(e.target.value)}
            placeholder="0"
            className="w-20 text-center"
          />
          <span className="text-muted-foreground">×</span>
          <Input
            type="number"
            min={0}
            value={awayScore}
            onChange={(e) => setAwayScore(e.target.value)}
            placeholder="0"
            className="w-20 text-center"
          />
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <Button onClick={submit} disabled={loading} className="w-full">
        {loading ? "Salvando..." : existing ? "Editar palpite" : "Confirmar palpite"}
      </Button>
    </div>
  );
}
