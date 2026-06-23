import type {
  EsporteStatisticEntry,
  EsporteTeam,
} from "@/lib/esportes/types";

type StatisticEntryWithTeam = EsporteStatisticEntry & {
  team: EsporteTeam;
  rank: number;
};

function StatRankingCard({
  title,
  description,
  unit,
  entries,
}: {
  title: string;
  description: string;
  unit: string;
  entries: StatisticEntryWithTeam[];
}) {
  return (
    <section className="cartola-card overflow-hidden">
      <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
        <h2 className="text-base font-black text-white">{title}</h2>
        <p className="text-xs font-medium text-zinc-500">{description}</p>
      </div>

      {entries.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-sm font-semibold text-zinc-500">
            Nenhum registro nesta série ainda
          </p>
        </div>
      ) : (
        <ul className="space-y-1 p-3">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="flex items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2.5 hover:bg-zinc-800"
            >
              <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
                {entry.rank}
              </span>
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[10px] font-black text-white"
                style={{ backgroundColor: entry.team.color }}
              >
                {entry.team.shortName.slice(0, 2).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-white">
                  {entry.playerName}
                </p>
                <p className="truncate text-xs text-zinc-500">
                  {entry.team.name}
                </p>
              </div>
              <span className="accent-text shrink-0 text-sm font-black">
                {entry.total} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function EsportesStatisticsSection({
  goals,
  points,
  assists,
  yellowCards,
  redCards,
}: {
  goals: StatisticEntryWithTeam[];
  points: StatisticEntryWithTeam[];
  assists: StatisticEntryWithTeam[];
  yellowCards: StatisticEntryWithTeam[];
  redCards: StatisticEntryWithTeam[];
}) {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      <StatRankingCard
        title="Artilheiros"
        description="Jogadores com mais gols"
        unit="gols"
        entries={goals}
      />
      <StatRankingCard
        title="Pontuadores"
        description="Maiores pontuações do basquete"
        unit="pts"
        entries={points}
      />
      <StatRankingCard
        title="Assistências"
        description="Jogadores com mais assistências"
        unit="ast"
        entries={assists}
      />
      <StatRankingCard
        title="Cartões Amarelos"
        description="Controle disciplinar"
        unit="cartões"
        entries={yellowCards}
      />
      <StatRankingCard
        title="Cartões Vermelhos"
        description="Expulsões registradas"
        unit="cartões"
        entries={redCards}
      />
    </div>
  );
}
