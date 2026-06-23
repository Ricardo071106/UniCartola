/** Status de um jogo na plataforma NDU Esportes */
export type EsporteGameStatus = "scheduled" | "live" | "finished";

/** Modalidades disponíveis (masculino) */
export type EsporteSlug = "futsal" | "futebol" | "basquete";

/** Séries do campeonato NDU */
export type EsporteSeries = "A" | "B" | "C" | "D" | "E" | "F";

export const ESPORTE_SERIES: EsporteSeries[] = ["A", "B", "C", "D", "E", "F"];

/** Abas de jogos da área NDU Esportes */
export type EsporteGamesTab =
  | "upcoming"
  | "today"
  | "tomorrow"
  | "week"
  | "finished";

/** Esporte / modalidade */
export interface EsporteSport {
  id: string;
  slug: EsporteSlug;
  name: string;
  icon: string;
}

/** Competição */
export interface EsporteCompetition {
  id: string;
  sportId: string;
  series: EsporteSeries;
  name: string;
  season: string;
  hasKnockout: boolean;
}

/** Atlética / time participante */
export interface EsporteTeam {
  id: string;
  name: string;
  shortName: string;
  logoUrl: string | null;
  color: string;
}

/** Estatísticas de uma atlética em uma competição */
export interface EsporteTeamStats {
  teamId: string;
  competitionId: string;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Entrada na tabela de classificação */
export interface EsporteStanding {
  position: number;
  teamId: string;
  competitionId: string;
  points: number;
  gamesPlayed: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
}

/** Jogo */
export interface EsporteGame {
  id: string;
  competitionId: string;
  homeTeamId: string;
  awayTeamId: string;
  homeScore: number | null;
  awayScore: number | null;
  scheduledAt: string;
  venue: string;
  status: EsporteGameStatus;
  round?: string;
}

/** Partida do mata-mata */
export interface EsporteKnockoutMatch {
  id: string;
  homeTeamId: string | null;
  awayTeamId: string | null;
  homeScore: number | null;
  awayScore: number | null;
  status: EsporteGameStatus;
}

/** Rodada do mata-mata */
export interface EsporteKnockoutRound {
  phase: "quartas" | "semifinal" | "final";
  label: string;
  matches: EsporteKnockoutMatch[];
}

/** Chaveamento completo */
export interface EsporteKnockoutBracket {
  competitionId: string;
  rounds: EsporteKnockoutRound[];
}

/** Jogo enriquecido com dados relacionados */
export interface EsporteGameWithDetails extends EsporteGame {
  homeTeam: EsporteTeam;
  awayTeam: EsporteTeam;
  competition: EsporteCompetition;
  sport: EsporteSport;
}
