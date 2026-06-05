import { Suspense } from "react";
import { after } from "next/server";
import { PalpitesClient } from "./PalpitesClient";
import { getMatchesByFilter } from "@/lib/queries/matches";
import { getUserMarketPredictions } from "@/lib/queries/market-predictions";
import { getUserPredictionsForMatches } from "@/lib/queries/predictions";
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
    safeQuery(() => getScorerOptions(sport, series), []),
    safeQuery(() => getCardPlayerOptions(sport, series), []),
  ]);

  let playBalance = 10000;
  let realBalance = 0;
  let realEntryPaid = false;
  if (session) {
    const balances = await getUserBalances(session.userId);
    playBalance = balances.playBalance;
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

  const predictionMap = session
    ? await safeQuery(
        () =>
          getUserPredictionsForMatches(
            session.userId,
            upcomingMatches.map((m) => m.id),
            currencyMode
          ),
        new Map()
      )
    : new Map();

  const matchPredictions = Object.fromEntries(
    [...predictionMap.entries()].map(([id, row]) => [
      id,
      {
        result: row.result,
        homeScore: row.homeScore,
        awayScore: row.awayScore,
      },
    ])
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Palpites</h1>
        <p className="text-sm text-zinc-400">
          {currencyMode === "play"
            ? "Ambiente gratuito · fichas virtuais"
            : "Ambiente pago · dinheiro real"}
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-400">Carregando...</p>}>
        <PalpitesClient
          sport={sport}
          series={series}
          currencyMode={currencyMode}
          playBalance={playBalance}
          realBalance={realBalance}
          realEntryPaid={realEntryPaid}
          isLoggedIn={!!session}
          teamOptions={teamOptions}
          scorerOptions={scorerOptions}
          cardOptions={cardOptions}
          upcomingMatches={upcomingMatches}
          marketPredictions={marketPredictions}
          matchPredictions={matchPredictions}
        />
      </Suspense>
    </div>
  );
}
