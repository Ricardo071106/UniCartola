import { Suspense } from "react";
import { after } from "next/server";
import { PalpitesClient } from "./PalpitesClient";
import { getMatchesByFilter } from "@/lib/queries/matches";
import { getUserMarketPredictions } from "@/lib/queries/market-predictions";
import { getUserSavedMatchPredictions } from "@/lib/queries/predictions";
import {
  getCardPlayerOptions,
  getScorerOptions,
  getSeriesTeamOptions,
} from "@/lib/queries/palpites-options";
import { parseSeries, parseSport } from "@/lib/queries/standings";
import { getUserBalances } from "@/lib/queries/user-balances";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { safeQuery } from "@/lib/db/safe-query";

export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; series?: string }>;
}) {
  const params = await searchParams;
  const sport = parseSport(params.sport);
  const series = parseSeries(params.series);

  after(() => {
    import("@/lib/ndu/stats-sync")
      .then(({ syncNduStats }) => syncNduStats())
      .catch((error) =>
        console.error("[palpites] sync estatísticas NDU:", error)
      );
  });

  const session = await getSession();
  const currencyMode = await getCurrencyMode();

  const [teamOptions, scorerOptions, cardOptions] = await Promise.all([
    safeQuery(() => getSeriesTeamOptions(sport, series), []),
    getScorerOptions(sport, series).catch((error) => {
      console.error("[palpites] artilheiros:", error);
      return [];
    }),
    getCardPlayerOptions(sport, series).catch((error) => {
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
  }

  const upcomingMatches = (
    await safeQuery(() => getMatchesByFilter({ sport, tab: "upcoming" }), [])
  )
    .filter((m) => m.sport.slug === sport)
    .filter((m) => m.series === series);

  const marketPredictions = session
    ? await safeQuery(
        () =>
          getUserMarketPredictions(
            session.userId,
            sport,
            series,
            currencyMode
          ),
        []
      )
    : [];

  const savedMatchPredictions = session
    ? await safeQuery(
        () =>
          getUserSavedMatchPredictions(
            session.userId,
            sport,
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
          sport={sport}
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
        />
      </Suspense>
    </div>
  );
}
