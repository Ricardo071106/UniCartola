import { HomeDashboardShell } from "./home-dashboard";
import { getStandingsBySeries, parseSeries } from "@/lib/queries/standings";
import { getTopGoalScorers, getTopPointScorers } from "@/lib/queries/scorers";
import { getPlayoffBracket } from "@/lib/queries/playoffs";
import { safeQuery } from "@/lib/db/safe-query";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function HomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const sport = (
    ["futsal", "futebol", "basquete"].includes(params.sport ?? "")
      ? params.sport
      : "futsal"
  ) as SportSlug;
  const series = parseSeries(params.series);

  const [standings, playoffBracket, goalScorers, pointScorers] =
    await Promise.all([
      safeQuery(() => getStandingsBySeries(sport, series), []),
      safeQuery(() => getPlayoffBracket(sport, series), null),
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
