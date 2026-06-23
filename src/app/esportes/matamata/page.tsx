import type { Metadata } from "next";
import { Suspense } from "react";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { KnockoutBracket } from "@/components/esportes/KnockoutBracket";
import {
  getAllCompetitions,
  getAllSports,
  getAllTeams,
  getCompetitionBySportAndSeries,
  getKnockoutBracket,
  getSportDisplayName,
  parseEsporteSeries,
  parseEsporteSport,
} from "@/lib/esportes/repository";

export const metadata: Metadata = {
  title: "Mata-mata | NDU Esportes",
  description:
    "Acompanhe o chaveamento de quartas, semifinais e finais das competições NDU.",
};

type SearchParams = Promise<{ sport?: string; series?: string }>;

export default async function EsportesMataMataPage({
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
  const bracket = competition ? getKnockoutBracket(competition.id) : null;

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          Mata-mata
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

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">Chaveamento</h2>
          <p className="text-xs font-medium text-zinc-500">
            Quartas · Semifinais · Final
          </p>
        </div>
        <div className="p-4">
          {bracket ? (
            <KnockoutBracket bracket={bracket} teams={getAllTeams()} />
          ) : (
            <div className="py-10 text-center">
              <p className="text-sm font-semibold text-zinc-500">
                Mata-mata ainda não disponível para esta série
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
