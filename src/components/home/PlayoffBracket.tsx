"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import type { PlayoffBracket as PlayoffBracketData, SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";

function TeamBadge({
  name,
  logoUrl,
  score,
  isWinner,
}: {
  name: string;
  logoUrl: string | null;
  score: number | null;
  isWinner: boolean;
}) {
  const label = name.trim() || "A definir";
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5",
        isWinner ? "accent-bg-muted" : "bg-zinc-800/50"
      )}
    >
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt={label}
          width={24}
          height={24}
          className="h-6 w-6 shrink-0 rounded-full object-cover"
          unoptimized
        />
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[8px] font-bold text-zinc-300">
          {label.slice(0, 2).toUpperCase()}
        </div>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-bold",
          isWinner ? "text-white" : "text-zinc-400"
        )}
      >
        {label}
      </span>
      {score != null && (
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            isWinner ? "accent-text" : "text-zinc-500"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function MatchCard({
  match,
}: {
  match: PlayoffBracketData["rounds"][0]["matches"][0];
}) {
  const finished = match.status === "finished" && match.homeScore != null;
  const homeWins = finished && match.winnerSide === "home";
  const awayWins = finished && match.winnerSide === "away";
  const winnerNote =
    match.winnerMethod === "overtime"
      ? "Prorrogação"
      : match.winnerMethod === "penalties"
        ? "Pênaltis"
        : null;

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-900 p-2">
      <div className="space-y-1">
        <TeamBadge
          name={match.homeName}
          logoUrl={match.homeLogoUrl}
          score={match.homeScore}
          isWinner={homeWins}
        />
        <TeamBadge
          name={match.awayName}
          logoUrl={match.awayLogoUrl}
          score={match.awayScore}
          isWinner={awayWins}
        />
      </div>
      {finished && (
        <p className="mt-1.5 text-center text-[10px] font-bold text-zinc-500">
          {match.homeScore} × {match.awayScore}
          {winnerNote && (
            <span className="ml-1 text-emerald-500/80">· {winnerNote}</span>
          )}
        </p>
      )}
      {!finished && (
        <p className="mt-1.5 text-center text-[10px] font-medium text-zinc-600">
          A definir
        </p>
      )}
    </div>
  );
}

const PHASE_LABELS: Record<string, string> = {
  Oitavas: "Oitavas de final",
  Quartas: "Quartas de final",
  Semi: "Semifinal",
  Final: "Final",
};

export function PlayoffBracket({
  sport,
  series,
  initialBracket,
}: {
  sport: SportSlug;
  series: SeriesLetter;
  initialBracket: PlayoffBracketData | null;
}) {
  const [bracket, setBracket] = useState(initialBracket);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setBracket(initialBracket);

    const controller = new AbortController();
    setLoading(!initialBracket?.rounds?.length);

    fetch(`/api/playoffs?sport=${sport}&series=${series}`, {
      signal: controller.signal,
    })
      .then((res) => (res.ok ? res.json() : null))
      .then((data: PlayoffBracketData | null) => {
        if (!data?.rounds?.length) return;
        setBracket((prev) => {
          if (!prev?.rounds?.length) return data;
          if (data.rounds.length >= prev.rounds.length) return data;
          const prevPhases = new Set(prev.rounds.map((r) => r.phase));
          const hasNewPhase = data.rounds.some((r) => !prevPhases.has(r.phase));
          return hasNewPhase ? data : prev;
        });
      })
      .catch(() => {})
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [sport, series, initialBracket]);

  if (loading && (!bracket || bracket.rounds.length === 0)) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          Carregando mata-mata...
        </p>
      </div>
    );
  }

  if (!bracket || bracket.rounds.length === 0) {
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          Nenhum jogo de mata-mata nesta série ainda
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {bracket.rounds.map((round) => (
        <div key={round.phase}>
          <h3 className="accent-text mb-3 text-xs font-black uppercase tracking-wider">
            {PHASE_LABELS[round.phase] ?? round.phase}
          </h3>
          <div
            className={cn(
              "grid gap-3",
              round.matches.length >= 4
                ? "grid-cols-1 sm:grid-cols-2"
                : round.matches.length === 2
                  ? "grid-cols-1 sm:grid-cols-2"
                  : "grid-cols-1 max-w-sm"
            )}
          >
            {round.matches.map((match) => (
              <MatchCard key={match.id} match={match} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
