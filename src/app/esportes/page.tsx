import type { Metadata } from "next";
import { UpcomingGameCard } from "@/components/esportes/UpcomingGameCard";
import { RecentResultCard } from "@/components/esportes/RecentResultCard";
import { CompetitionIconStrip } from "@/components/esportes/CompetitionIconStrip";
import {
  getAllCompetitions,
  getAllSports,
  getRecentResults,
  getUpcomingGames,
} from "@/lib/esportes/repository";

export const metadata: Metadata = {
  title: "NDU Esportes | Competições & Resultados",
  description:
    "Acompanhe competições, resultados e classificações dos campeonatos universitários NDU.",
};

export default function EsportesHomePage() {
  const upcomingGames = getUpcomingGames(6);
  const recentResults = getRecentResults(6);
  const sports = getAllSports();
  const competitions = getAllCompetitions();

  return (
    <div className="space-y-8">
      <section>
        <h1 className="text-2xl font-black text-white sm:text-3xl">
          NDU Esportes
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Competições, resultados e classificações
        </p>

        <div className="mt-5">
          <CompetitionIconStrip sports={sports} competitions={competitions} />
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#c9a227]">
          Próximos Jogos
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {upcomingGames.map((game) => (
            <UpcomingGameCard key={game.id} game={game} />
          ))}
        </div>
        {upcomingGames.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
            <p className="text-sm font-semibold text-zinc-500">
              Nenhum jogo agendado
            </p>
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#c9a227]">
          Resultados Recentes
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {recentResults.map((game) => (
            <RecentResultCard key={game.id} game={game} />
          ))}
        </div>
        {recentResults.length === 0 && (
          <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
            <p className="text-sm font-semibold text-zinc-500">
              Nenhum resultado recente
            </p>
          </div>
        )}
      </section>
    </div>
  );
}
