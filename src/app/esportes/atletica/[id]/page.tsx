import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { TeamHero, TeamStatsGrid } from "@/components/esportes/TeamStatsGrid";
import { getTeamById, getTeamStats } from "@/lib/esportes/repository";

type Params = Promise<{ id: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { id } = await params;
  const team = getTeamById(id);
  return {
    title: team ? `${team.name} | NDU Esportes` : "Atlética | NDU Esportes",
  };
}

export default async function AtleticaPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const team = getTeamById(id);
  if (!team) notFound();

  const stats = getTeamStats(id);

  return (
    <div className="space-y-6">
      <TeamHero team={team} />

      {stats ? (
        <section>
          <h2 className="mb-4 text-sm font-black uppercase tracking-widest text-[#c9a227]">
            Estatísticas
          </h2>
          <TeamStatsGrid stats={stats} />
        </section>
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-950 py-8 text-center">
          <p className="text-sm font-semibold text-zinc-500">
            Estatísticas ainda não disponíveis
          </p>
        </div>
      )}
    </div>
  );
}
