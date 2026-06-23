import type { Metadata } from "next";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import { EsportesGamesOverview } from "@/components/esportes/EsportesGamesOverview";
import {
  getAllCompetitions,
  getAllSports,
  getRecentResults,
  getUpcomingGames,
} from "@/lib/esportes/repository";

export const metadata: Metadata = {
  title: "Jogos | NDU Esportes",
  description:
    "Acompanhe os próximos jogos e os jogos encerrados das competições NDU.",
};

export default function EsportesJogosPage() {
  const sports = getAllSports();
  const competitions = getAllCompetitions();
  const upcomingGames = getUpcomingGames(20);
  const recentResults = getRecentResults(20);

  return (
    <div className="space-y-5">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">Jogos</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Próximos e encerrados, sem formulários de palpites
        </p>

        <div className="cartola-card mt-5 overflow-hidden p-3">
          <CompetitionIconStrip sports={sports} competitions={competitions} />
        </div>
      </section>

      <EsportesGamesOverview
        upcomingGames={upcomingGames}
        finishedGames={recentResults}
      />
    </div>
  );
}
