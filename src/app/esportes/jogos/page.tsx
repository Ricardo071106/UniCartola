import type { Metadata } from "next";
import { Suspense } from "react";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { EsportesGamesOverview } from "@/components/esportes/EsportesGamesOverview";
import { EsportesGameList } from "@/components/esportes/EsportesGameList";
import {
  getAllCompetitions,
  getAllSports,
  getGamesByFilters,
  getSportDisplayName,
  parseEsporteGamesTab,
  parseEsporteSeries,
  parseEsporteSport,
} from "@/lib/esportes/repository";
import type { EsporteGamesTab } from "@/lib/esportes/types";

export const metadata: Metadata = {
  title: "Jogos | NDU Esportes",
  description:
    "Acompanhe os próximos jogos e os jogos encerrados das competições NDU.",
};

const TAB_LABELS: Record<EsporteGamesTab, string> = {
  upcoming: "Próximos",
  today: "Hoje",
  tomorrow: "Amanhã",
  week: "Semana",
  finished: "Encerrados",
};

const TAB_DESCRIPTIONS: Record<EsporteGamesTab, string> = {
  upcoming: "Agenda das próximas partidas",
  today: "Partidas marcadas para hoje",
  tomorrow: "Partidas marcadas para amanhã",
  week: "Partidas dos próximos 7 dias",
  finished: "Resultados das partidas encerradas",
};

type SearchParams = Promise<{ sport?: string; series?: string; tab?: string }>;

export default async function EsportesJogosPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const params = await searchParams;
  const selectedSport = parseEsporteSport(params.sport);
  const selectedSeries = parseEsporteSeries(params.series);
  const selectedTab = parseEsporteGamesTab(params.tab);
  const hasTab = Boolean(params.tab);
  const sports = getAllSports();
  const competitions = getAllCompetitions();
  const sport = sports.find((s) => s.slug === selectedSport) ?? sports[0];
  const upcomingGames = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: "upcoming",
    limit: 20,
  });
  const recentResults = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: "finished",
    limit: 20,
  });
  const tabGames = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: selectedTab,
    limit: 20,
  });

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Jogos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Próximos e encerrados, sem formulários de palpites
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

      {hasTab ? (
        <section className="cartola-card overflow-hidden">
          <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
            <h2 className="text-base font-black text-white">
              {TAB_LABELS[selectedTab]}
            </h2>
            <p className="text-xs font-medium text-zinc-500">
              {TAB_DESCRIPTIONS[selectedTab]} ·{" "}
              {getSportDisplayName(sport, selectedSeries)}
            </p>
          </div>
          <div className="p-3">
            <EsportesGameList
              games={tabGames}
              emptyMessage="Nenhuma partida neste período"
            />
          </div>
        </section>
      ) : (
        <EsportesGamesOverview
          upcomingGames={upcomingGames}
          finishedGames={recentResults}
        />
      )}
    </div>
  );
}
