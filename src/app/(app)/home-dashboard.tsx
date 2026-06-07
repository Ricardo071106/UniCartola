"use client";

import { Suspense } from "react";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";

export function HomeDashboardShell({
  sport,
  series,
}: {
  sport: SportSlug;
  series: SeriesLetter;
}) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-400">Carregando...</div>
      }
    >
      <HomeDashboard sport={sport} series={series} />
    </Suspense>
  );
}
