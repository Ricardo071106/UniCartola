import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import { CompetitionTabs } from "@/components/esportes/CompetitionTabs";
import {
  getCompetitionById,
  getFinishedGamesByCompetition,
  getKnockoutBracket,
  getSportForCompetition,
  getStandingsByCompetition,
  getTeamsByCompetition,
  getUpcomingGamesByCompetition,
} from "@/lib/esportes/repository";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const competition = getCompetitionById(id);
  return {
    title: competition
      ? `${competition.name} | NDU Esportes`
      : "Competição | NDU Esportes",
  };
}

export default async function CompeticaoPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const competition = getCompetitionById(id);
  if (!competition) notFound();

  const sport = getSportForCompetition(id);
  if (!sport) notFound();

  const standings = getStandingsByCompetition(id);
  const upcomingGames = getUpcomingGamesByCompetition(id);
  const finishedGames = getFinishedGamesByCompetition(id);
  const teams = getTeamsByCompetition(id);
  const knockout = competition.hasKnockout ? getKnockoutBracket(id) : null;

  return (
    <div className="space-y-6">
      <header className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-xl bg-[#1e3a5f]/30">
            <Image
              src={sport.icon}
              alt={sport.name}
              width={32}
              height={32}
              className="h-8 w-8 object-contain"
              unoptimized
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-black text-white sm:text-2xl">
                NDU {sport.name} Masculino
              </h1>
              <span className="rounded-md bg-[#1e3a5f] px-2 py-0.5 text-sm font-black text-white">
                Série {competition.series}
              </span>
            </div>
            <p className="text-sm text-zinc-500">
              Temporada {competition.season}
            </p>
          </div>
        </div>
      </header>

      <CompetitionTabs
        competition={competition}
        standings={standings}
        upcomingGames={upcomingGames}
        finishedGames={finishedGames}
        teams={teams}
        knockout={knockout}
      />
    </div>
  );
}
