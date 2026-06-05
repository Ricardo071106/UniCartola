import { HomeDashboardShell } from "./home-dashboard";
import {
  getStandingsBySeries,
  parseSeries,
  parseSport,
} from "@/lib/queries/standings";
import { getTopGoalScorers, getTopPointScorers } from "@/lib/queries/scorers";
import { getPlayoffBracketWithBoletim } from "@/lib/queries/playoffs";
import { safeQuery } from "@/lib/db/safe-query";
export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sport = parseSport(params.sport);
  const series = parseSeries(params.series);

  const [standings, playoffBracket, goalScorers, pointScorers] =
    await Promise.all([
      safeQuery(() => getStandingsBySeries(sport, series), []),
      safeQuery(() => getPlayoffBracketWithBoletim(sport, series), null),
      safeQuery(() => getTopGoalScorers(sport, series, 10), []),
      safeQuery(() => getTopPointScorers(sport, series, 10), []),
    ]);

  return (
    <HomeDashboardShell
      sport={sport}
      series={series}
      standings={standings}
      playoffBracket={playoffBracket}
      goalScorers={goalScorers}
      pointScorers={pointScorers}
    />
  );
}
