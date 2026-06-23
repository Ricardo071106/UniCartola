import type { Metadata } from "next";
import { Suspense } from "react";
import Link from "next/link";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { EsportesGameList } from "@/components/esportes/EsportesGameList";
import { cn } from "@/lib/utils";
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

const INTERNAL_TABS: { id: EsporteGamesTab; label: string }[] = [
  { id: "upcoming", label: "Próximos" },
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "week", label: "Semana" },
  { id: "finished", label: "Encerrados" },
];

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
  const sports = getAllSports();
  const competitions = getAllCompetitions();
  const sport = sports.find((s) => s.slug === selectedSport) ?? sports[0];
  const tabGames = getGamesByFilters({
    sport: selectedSport,
    series: selectedSeries,
    tab: selectedTab,
    limit: 30,
  });

  function tabHref(tab: EsporteGamesTab) {
    const params = new URLSearchParams({
      tab,
      sport: selectedSport,
      series: selectedSeries,
    });
    return `/esportes/jogos?${params.toString()}`;
  }

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

      <section className="cartola-card overflow-hidden p-1">
        <div className="grid grid-cols-2 gap-1 sm:grid-cols-5">
          {INTERNAL_TABS.map((tab) => {
            const active = selectedTab === tab.id;
            return (
              <Link
                key={tab.id}
                href={tabHref(tab.id)}
                className={cn(
                  "rounded-xl px-3 py-3 text-center text-sm font-black transition-colors",
                  active
                    ? "accent-bg text-white"
                    : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 hover:text-white"
                )}
              >
                {tab.label}
              </Link>
            );
          })}
        </div>
      </section>

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
    </div>
  );
}
