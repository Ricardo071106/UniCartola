import { Suspense } from "react";
import { PalpitesClient } from "./PalpitesClient";
import { getMatchesByFilter } from "@/lib/queries/matches";
import { getUserMarketPredictions } from "@/lib/queries/market-predictions";
import { getUserPredictionsForMatches } from "@/lib/queries/predictions";
import { parseSeries } from "@/lib/queries/standings";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { requireDb } from "@/lib/db";
import { athletics, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export default async function PalpitesPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; series?: string }>;
}) {
  const params = await searchParams;
  const sport = (
    ["futsal", "futebol", "basquete"].includes(params.sport ?? "")
      ? params.sport
      : "futsal"
  ) as SportSlug;
  const series = parseSeries(params.series);

  const session = await getSession();
  const currencyMode = await getCurrencyMode();
  const db = requireDb();

  const athleticRows = await db
    .select({ id: athletics.id, name: athletics.name })
    .from(athletics)
    .orderBy(athletics.name);

  let playBalance = 10000;
  let realBalance = 0;
  if (session) {
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, session.userId))
      .limit(1);
    playBalance = user?.playBalance ?? 10000;
    realBalance = user?.realBalance ?? 0;
  }

  const upcomingMatches = (await getMatchesByFilter({ sport, tab: "upcoming" }))
    .filter((m) => m.sport.slug === sport)
    .filter((m) => m.series === series);

  const marketPredictions =
    session
      ? await getUserMarketPredictions(
          session.userId,
          sport,
          series,
          currencyMode
        )
      : [];

  const predictionMap = session
    ? await getUserPredictionsForMatches(
        session.userId,
        upcomingMatches.map((m) => m.id),
        currencyMode
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
          Temporada e jogos futuros · modo{" "}
          {currencyMode === "play" ? "fichas" : "dinheiro real"}
        </p>
      </div>
      <Suspense fallback={<p className="text-zinc-400">Carregando...</p>}>
        <PalpitesClient
          sport={sport}
          series={series}
          currencyMode={currencyMode}
          playBalance={playBalance}
          realBalance={realBalance}
          isLoggedIn={!!session}
          athletics={athleticRows}
          upcomingMatches={upcomingMatches}
          marketPredictions={marketPredictions}
          matchPredictions={matchPredictions}
        />
      </Suspense>
    </div>
  );
}
