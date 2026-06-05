import { JogosClient } from "./JogosClient";
import { getMatchesByFilter } from "@/lib/queries/matches";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export default async function JogosPage({
  searchParams,
}: {
  searchParams: Promise<{ sport?: string; tab?: string }>;
}) {
  const params = await searchParams;
  const sport = ["futebol", "futsal", "basquete"].includes(params.sport ?? "")
    ? (params.sport as SportSlug)
    : undefined;
  const tab = [
    "upcoming",
    "today",
    "tomorrow",
    "week",
    "finished",
  ].includes(params.tab ?? "")
    ? (params.tab as "upcoming" | "today" | "tomorrow" | "week" | "finished")
    : "upcoming";

  const matches = await getMatchesByFilter({ sport, tab });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Jogos</h1>
        <p className="text-sm text-zinc-400">
          Acompanhe partidas e faça seus palpites
        </p>
      </div>
      <JogosClient
        initialMatches={matches}
        initialSport={sport}
        initialTab={tab}
      />
    </div>
  );
}
