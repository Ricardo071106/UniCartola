import { cn } from "@/lib/utils";
import type { EsporteKnockoutBracket, EsporteTeam } from "@/lib/esportes/types";

function TeamSlot({
  team,
  score,
  isWinner,
}: {
  team: EsporteTeam | null;
  score: number | null;
  isWinner: boolean;
}) {
  const label = team?.shortName ?? "A definir";

  return (
    <div
      className={cn(
        "flex items-center gap-2 rounded-lg px-3 py-2",
        isWinner ? "bg-[#1e3a5f]/40 ring-1 ring-[#1e3a5f]" : "bg-zinc-800/60"
      )}
    >
      {team ? (
        <div
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-[8px] font-black text-white"
          style={{ backgroundColor: team.color }}
        >
          {team.shortName.slice(0, 2).toUpperCase()}
        </div>
      ) : (
        <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-zinc-700 text-[8px] font-bold text-zinc-400">
          ?
        </div>
      )}
      <span
        className={cn(
          "min-w-0 flex-1 truncate text-xs font-bold",
          team ? (isWinner ? "text-white" : "text-zinc-400") : "text-zinc-600"
        )}
      >
        {label}
      </span>
      {score != null && (
        <span
          className={cn(
            "text-sm font-black tabular-nums",
            isWinner ? "text-[#c9a227]" : "text-zinc-500"
          )}
        >
          {score}
        </span>
      )}
    </div>
  );
}

function KnockoutMatchCard({
  match,
  teams,
}: {
  match: EsporteKnockoutBracket["rounds"][0]["matches"][0];
  teams: Map<string, EsporteTeam>;
}) {
  const homeTeam = match.homeTeamId ? teams.get(match.homeTeamId) ?? null : null;
  const awayTeam = match.awayTeamId ? teams.get(match.awayTeamId) ?? null : null;
  const finished = match.status === "finished" && match.homeScore != null;
  const homeWins = finished && (match.homeScore ?? 0) > (match.awayScore ?? 0);
  const awayWins = finished && (match.awayScore ?? 0) > (match.homeScore ?? 0);

  return (
    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-2 shadow-lg">
      <div className="space-y-1">
        <TeamSlot team={homeTeam} score={match.homeScore} isWinner={homeWins} />
        <TeamSlot team={awayTeam} score={match.awayScore} isWinner={awayWins} />
      </div>
      {!finished && match.status !== "live" && (
        <p className="mt-2 text-center text-[10px] font-medium text-zinc-600">
          A definir
        </p>
      )}
      {match.status === "live" && (
        <p className="mt-2 text-center text-[10px] font-black uppercase text-red-400">
          Em andamento
        </p>
      )}
    </div>
  );
}

export function KnockoutBracket({
  bracket,
  teams,
}: {
  bracket: EsporteKnockoutBracket;
  teams: EsporteTeam[];
}) {
  const teamMap = new Map(teams.map((t) => [t.id, t]));

  if (bracket.rounds.length === 0) {
    return (
      <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
        <p className="text-sm font-semibold text-zinc-500">
          Mata-mata ainda não disponível
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {bracket.rounds.map((round) => (
        <div key={round.phase}>
          <h3 className="mb-4 text-center text-xs font-black uppercase tracking-widest text-[#c9a227]">
            {round.label}
          </h3>
          <div
            className={cn(
              "mx-auto grid gap-4",
              round.matches.length >= 4
                ? "max-w-2xl grid-cols-1 sm:grid-cols-2"
                : round.matches.length === 2
                  ? "max-w-lg grid-cols-1 sm:grid-cols-2"
                  : "max-w-xs grid-cols-1"
            )}
          >
            {round.matches.map((match) => (
              <KnockoutMatchCard key={match.id} match={match} teams={teamMap} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
