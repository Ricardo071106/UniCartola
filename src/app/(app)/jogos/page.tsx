import { Suspense } from "react";
import { JogosClient } from "./JogosClient";
import { getMatchesByFilter } from "@/lib/queries/matches";
import {
  getUserPredictionsForMatches,
  predictionToView,
} from "@/lib/queries/predictions";
import { getUserBalances } from "@/lib/queries/user-balances";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { safeQuery } from "@/lib/db/safe-query";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const sport = ["futebol", "futsal", "basquete"].includes(params.sport ?? "")
    ? (params.sport as SportSlug)
    : undefined;
  const tab = [
    "upcoming",
    "today",
    "tomorrow",
    "week",
    "finished",
  ].includes(params.tab ?? "")
    ? (params.tab as "upcoming" | "today" | "tomorrow" | "week" | "finished")
    : "upcoming";

  const matches = await safeQuery(
    () => getMatchesByFilter({ sport, tab }),
    []
  );

  const session = await getSession();
  const currencyMode = await getCurrencyMode();
  let canBet = false;

  if (session) {
    const balances = await getUserBalances(session.userId);
    canBet =
      currencyMode === "play" ||
      (currencyMode === "real" && balances.realEntryPaid);
  }

  const predictionMap = session
    ? await safeQuery(
        () =>
          getUserPredictionsForMatches(
            session.userId,
            matches.map((m) => m.id),
            currencyMode
          ),
        new Map()
      )
    : new Map();

  const matchPredictions = Object.fromEntries(
    [...predictionMap.entries()].map(([id, row]) => [
      id,
      predictionToView(row),
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Jogos</h1>
        <p className="text-sm text-zinc-400">
          Acompanhe partidas e faça seus palpites
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-400">Carregando jogos...</p>}>
        <JogosClient
          initialMatches={matches}
          {...(sport ? { initialSport: sport } : {})}
          initialTab={tab}
          isLoggedIn={!!session}
          canBet={canBet}
          matchPredictions={matchPredictions}
        />
      </Suspense>
    </div>
  );
}
