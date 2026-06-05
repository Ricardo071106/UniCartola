"use client";

import { useState } from "react";
import { MatchCard } from "@/components/matches/match-card";
import { getAllMatches } from "@/lib/data";
import { cn } from "@/lib/utils";

const filters = [
  { key: "all", label: "Todos" },
  { key: "scheduled", label: "Não iniciados" },
  { key: "live", label: "Ao vivo" },
  { key: "finished", label: "Encerrados" },
] as const;

export default function JogosPage() {
  const [filter, setFilter] = useState<(typeof filters)[number]["key"]>("all");
  const matches = getAllMatches(50);
  const filtered =
    filter === "all" ? matches : matches.filter((m) => m.status === filter);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Jogos</h1>
        <p className="text-sm text-muted-foreground">
          Acompanhe partidas, estatísticas e faça seus palpites
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-1">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              filter === f.key
                ? "bg-accent text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {f.label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            Nenhum jogo encontrado.
          </p>
        ) : (
          filtered.map((m) => <MatchCard key={m.id} match={m} />)
        )}
      </div>
    </div>
  );
}
