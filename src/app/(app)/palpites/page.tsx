import { Suspense } from "react";
import { PalpitesClient } from "./PalpitesClient";
import { getPalpitesUpcomingMatches } from "@/lib/queries/matches";
import { getUserMarketPredictions } from "@/lib/queries/market-predictions";
import { getUserSavedMatchPredictions } from "@/lib/queries/predictions";
import {
  getCardPlayerOptions,
  getScorerOptions,
  getSeriesTeamOptions,
} from "@/lib/queries/palpites-options";
import { parseSeries, parsePalpitesSport } from "@/lib/queries/standings";
import { getUserBalances } from "@/lib/queries/user-balances";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { safeQuery } from "@/lib/db/safe-query";
import {
  getMarketLocksForUser,
  syncEliminationLocks,
} from "@/lib/palpites/market-locks";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; series?: string }>;
}) {
  const params = await searchParams;
  const sportFilter = parsePalpitesSport(params.sport);
  const series = parseSeries(params.series);

  const session = await getSession();
  const currencyMode = await getCurrencyMode();
  const sportForData = sportFilter === "all" ? "futsal" : sportFilter;

  const [teamOptions, scorerOptions, cardOptions] =
    sportFilter === "all"
      ? [[], [], []]
      : await Promise.all([
          safeQuery(() => getSeriesTeamOptions(sportForData, series), []),
          getScorerOptions(sportForData, series).catch((error) => {
            console.error("[palpites] artilheiros:", error);
            return [];
          }),
          getCardPlayerOptions(sportForData, series).catch((error) => {
            console.error("[palpites] cartões:", error);
            return [];
          }),
        ]);

  let totalPoints = 0;
  let realBalance = 0;
  let realEntryPaid = false;
  if (session) {
    const balances = await getUserBalances(session.userId);
    totalPoints = balances.totalPoints;
    realBalance = balances.realBalance;
    realEntryPaid = balances.realEntryPaid;

    if (sportFilter !== "all") {
      await syncEliminationLocks(session.userId, currencyMode).catch((e) =>
        console.error("[palpites] sync locks:", e)
      );
    }
  }

  const upcomingMatches = await safeQuery(
    () =>
      getPalpitesUpcomingMatches({
        series,
        ...(sportFilter !== "all" ? { sport: sportFilter } : {}),
      }),
    []
  );

  const marketPredictions =
    session && sportFilter !== "all"
      ? await safeQuery(
          () =>
            getUserMarketPredictions(
              session.userId,
              sportFilter as SportSlug,
              series,
              currencyMode
            ),
          []
        )
      : [];

  const marketLocks =
    session && sportFilter !== "all"
      ? await getMarketLocksForUser(
          session.userId,
          sportFilter as SportSlug,
          series,
          currencyMode
        )
      : null;

  const savedMatchPredictions = session
    ? await safeQuery(
        () =>
          getUserSavedMatchPredictions(
            session.userId,
            sportFilter,
            series,
            currencyMode
          ),
        []
      )
    : [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Palpites</h1>
        <p className="text-sm text-zinc-400">
          Ganhe pontos a cada acerto · palpites gratuitos
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-400">Carregando...</p>}>
        <PalpitesClient
          sportFilter={sportFilter}
          series={series}
          currencyMode={currencyMode}
          totalPoints={totalPoints}
          realBalance={realBalance}
          realEntryPaid={realEntryPaid}
          isLoggedIn={!!session}
          teamOptions={teamOptions}
          scorerOptions={scorerOptions}
          cardOptions={cardOptions}
          upcomingMatches={upcomingMatches}
          savedMatchPredictions={savedMatchPredictions}
          marketPredictions={marketPredictions}
          marketLocks={marketLocks}
        />
      </Suspense>
    </div>
  );
}
