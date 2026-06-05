import { Suspense } from "react";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import { getStandingsBySeries, SERIES } from "@/lib/queries/standings";
import { getTopGoalScorers, getTopPointScorers } from "@/lib/queries/scorers";
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
  const series = (
    SERIES.includes((params.series ?? "A") as (typeof SERIES)[number])
      ? params.series
      : "A"
  ) as (typeof SERIES)[number];

  const [standings, goalScorers, pointScorers] = await Promise.all([
    safeQuery(() => getStandingsBySeries(sport, series), []),
    safeQuery(() => getTopGoalScorers(sport, series, 10), []),
    safeQuery(() => getTopPointScorers(sport, series, 10), []),
  ]);

  return (
    <Suspense fallback={<div className="py-12 text-center text-gray-500">Carregando...</div>}>
      <HomeDashboard
        sport={sport}
        series={series}
        standings={standings}
        goalScorers={goalScorers}
        pointScorers={pointScorers}
      />
    </Suspense>
  );
}
