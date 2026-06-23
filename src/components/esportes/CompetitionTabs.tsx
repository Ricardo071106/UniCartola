"use client";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { EsportesStandingsTable } from "./EsportesStandingsTable";
import { EsportesGameList } from "./EsportesGameList";
import { EsportesTeamList } from "./EsportesTeamList";
import { KnockoutBracket } from "./KnockoutBracket";
import type {
  EsporteCompetition,
  EsporteKnockoutBracket,
  EsporteStanding,
  EsporteTeam,
  EsporteGameWithDetails,
} from "@/lib/esportes/types";

export function CompetitionTabs({
  competition,
  standings,
  upcomingGames,
  finishedGames,
  teams,
  knockout,
}: {
  competition: EsporteCompetition;
  standings: (EsporteStanding & { team: EsporteTeam })[];
  upcomingGames: EsporteGameWithDetails[];
  finishedGames: EsporteGameWithDetails[];
  teams: EsporteTeam[];
  knockout: EsporteKnockoutBracket | null;
}) {
  return (
    <Tabs defaultValue="classificacao" className="w-full">
      <TabsList className="grid w-full grid-cols-3">
        <TabsTrigger value="classificacao">Classificação</TabsTrigger>
        <TabsTrigger value="jogos">Jogos</TabsTrigger>
        <TabsTrigger value="times">Times</TabsTrigger>
      </TabsList>

      <TabsContent value="classificacao" className="space-y-6">
        <EsportesStandingsTable entries={standings} />
        {competition.hasKnockout && knockout && (
          <div>
            <h2 className="mb-4 text-lg font-black text-white">Mata-Mata</h2>
            <KnockoutBracket bracket={knockout} teams={teams} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="jogos" className="space-y-6">
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">
            Próximos Jogos
          </h2>
          <EsportesGameList
            games={upcomingGames}
            emptyMessage="Nenhum jogo agendado"
          />
        </div>
        <div>
          <h2 className="mb-3 text-sm font-black uppercase tracking-wide text-zinc-500">
            Resultados
          </h2>
          <EsportesGameList
            games={finishedGames}
            emptyMessage="Nenhum resultado disponível"
          />
        </div>
        {competition.hasKnockout && knockout && (
          <div>
            <h2 className="mb-4 text-sm font-black uppercase tracking-wide text-zinc-500">
              Mata-Mata
            </h2>
            <KnockoutBracket bracket={knockout} teams={teams} />
          </div>
        )}
      </TabsContent>

      <TabsContent value="times">
        <EsportesTeamList teams={teams} />
      </TabsContent>
    </Tabs>
  );
}
