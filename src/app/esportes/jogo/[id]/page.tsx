import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { GameDetailView } from "@/components/esportes/GameDetailView";
import { getGameById } from "@/lib/esportes/repository";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const game = getGameById(id);
  if (!game) {
    return { title: "Jogo | NDU Esportes" };
  }
  return {
    title: `${game.homeTeam.shortName} x ${game.awayTeam.shortName} | NDU Esportes`,
  };
}

export default async function JogoPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const game = getGameById(id);
  if (!game) notFound();

  return <GameDetailView game={game} />;
}
