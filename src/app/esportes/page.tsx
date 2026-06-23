import type { Metadata } from "next";
import { Suspense } from "react";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { EsportesGamesOverview } from "@/components/esportes/EsportesGamesOverview";
import { EsportesStandingsTable } from "@/components/esportes/EsportesStandingsTable";
import {
  getCompetitionBySportAndSeries,
  getAllCompetitions,
  getAllSports,
  getGamesByFilters,
  getSportDisplayName,
  getStandingsByCompetition,
  parseEsporteSeries,
  parseEsporteSport,
} from "@/lib/esportes/repository";

export const metadata: Metadata = {
  title: "NDU Esportes | Competições & Resultados",
  description:
    "Acompanhe competições, resultados e classificações dos campeonatos universitários NDU.",
};

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function EsportesHomePage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedSport = parseEsporteSport(params.sport);
  const selectedSeries = parseEsporteSeries(params.series);
  const sports = getAllSports();
  const competitions = getAllCompetitions();
  const competition = getCompetitionBySportAndSeries(
    selectedSport,
    selectedSeries
  );
  const sport = sports.find((s) => s.slug === selectedSport) ?? sports[0];
  const standings = competition
    ? getStandingsByCompetition(competition.id)
    : [];
  const upcomingGames = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: "upcoming",
    limit: 6,
  });
  const recentResults = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: "finished",
    limit: 6,
  });

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          NDU Esportes
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Competições, resultados e classificações
        </p>

        <div className="cartola-card mt-5 overflow-hidden p-3">
          <Suspense fallback={null}>
            <CompetitionIconStrip
              sports={sports}
              competitions={competitions}
              selectedSport={selectedSport}
              selectedSeries={selectedSeries}
            />
          </Suspense>
        </div>
      </section>

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">Classificação</h2>
          <p className="text-xs font-medium text-zinc-500">
            {getSportDisplayName(sport, selectedSeries)}
          </p>
        </div>
        <div className="px-2 pb-2">
          <EsportesStandingsTable entries={standings} />
        </div>
      </section>

      <EsportesGamesOverview
        upcomingGames={upcomingGames}
        finishedGames={recentResults}
        showViewAll
      />
    </div>
  );
}
