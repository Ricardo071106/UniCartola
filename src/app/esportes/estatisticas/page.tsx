import type { Metadata } from "next";
import { Suspense } from "react";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { EsportesStatisticsSection } from "@/components/esportes/EsportesStatisticsSection";
import {
  getAllCompetitions,
  getAllSports,
  getCompetitionBySportAndSeries,
  getSportDisplayName,
  getStatisticsByCompetition,
  parseEsporteSeries,
  parseEsporteSport,
} from "@/lib/esportes/repository";

export const metadata: Metadata = {
  title: "Estatísticas | NDU Esportes",
  description:
    "Acompanhe artilheiros, pontuadores, cartões e estatísticas das competições NDU.",
};

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function EsportesEstatisticasPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedSport = parseEsporteSport(params.sport);
  const selectedSeries = parseEsporteSeries(params.series);
  const sports = getAllSports();
  const competitions = getAllCompetitions();
  const sport = sports.find((s) => s.slug === selectedSport) ?? sports[0];
  const competition = getCompetitionBySportAndSeries(
    selectedSport,
    selectedSeries
  );
  const competitionId = competition?.id ?? "";

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Estatísticas
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          {getSportDisplayName(sport, selectedSeries)}
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

      <EsportesStatisticsSection
        goals={getStatisticsByCompetition(competitionId, "goals")}
        points={getStatisticsByCompetition(competitionId, "points")}
        assists={getStatisticsByCompetition(competitionId, "assists")}
        yellowCards={getStatisticsByCompetition(competitionId, "yellowCards")}
        redCards={getStatisticsByCompetition(competitionId, "redCards")}
      />
    </div>
  );
}
