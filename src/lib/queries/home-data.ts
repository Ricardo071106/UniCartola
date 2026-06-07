import { unstable_cache } from "next/cache";
import { getStandingsBySeries, type SeriesLetter } from "./standings";
import { getPlayoffBracket } from "./playoffs";
import { getTopGoalScorers, getTopPointScorers } from "./scorers";
import type { SportSlug } from "@/types";

export async function fetchHomeDashboardData(
  sport: SportSlug,
  series: SeriesLetter
) {
  const [standings, playoffBracket, goalScorers, pointScorers] =
    await Promise.all([
      getStandingsBySeries(sport, series),
      getPlayoffBracket(sport, series),
      getTopGoalScorers(sport, series, 10),
      getTopPointScorers(sport, series, 10),
    ]);

  return { standings, playoffBracket, goalScorers, pointScorers };
}

export function getCachedHomeDashboardData(
  sport: SportSlug,
  series: SeriesLetter
) {
  return unstable_cache(
    () => fetchHomeDashboardData(sport, series),
    ["home-dashboard", sport, series],
    { revalidate: 120 }
  )();
}
