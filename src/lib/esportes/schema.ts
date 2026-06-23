/**
 * Definições de schema para futura integração com Supabase.
 * Espelham as tabelas que serão criadas no banco de dados.
 *
 * Tabelas: esporte_sports, esporte_competitions, esporte_teams,
 *          esporte_games, esporte_standings, esporte_knockout_matches
 */

export const ESPORTE_TABLES = {
  sports: "esporte_sports",
  competitions: "esporte_competitions",
  teams: "esporte_teams",
  games: "esporte_games",
  standings: "esporte_standings",
  knockoutMatches: "esporte_knockout_matches",
} as const;

/** Row type para esporte_sports */
export interface EsporteSportRow {
  id: string;
  slug: string;
  name: string;
  icon: string;
  created_at: string;
  updated_at: string;
}

/** Row type para esporte_competitions */
export interface EsporteCompetitionRow {
  id: string;
  sport_id: string;
  series: string;
  name: string;
  season: string;
  has_knockout: boolean;
  created_at: string;
  updated_at: string;
}

/** Row type para esporte_teams */
export interface EsporteTeamRow {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  color: string;
  created_at: string;
  updated_at: string;
}

/** Row type para esporte_games */
export interface EsporteGameRow {
  id: string;
  competition_id: string;
  home_team_id: string;
  away_team_id: string;
  home_score: number | null;
  away_score: number | null;
  scheduled_at: string;
  venue: string;
  status: "scheduled" | "live" | "finished";
  round: string | null;
  created_at: string;
  updated_at: string;
}

/** Row type para esporte_standings */
export interface EsporteStandingRow {
  id: string;
  competition_id: string;
  team_id: string;
  position: number;
  points: number;
  games_played: number;
  wins: number;
  draws: number;
  losses: number;
  goals_for: number;
  goals_against: number;
  updated_at: string;
}

/** Row type para esporte_knockout_matches */
export interface EsporteKnockoutMatchRow {
  id: string;
  competition_id: string;
  phase: "quartas" | "semifinal" | "final";
  home_team_id: string | null;
  away_team_id: string | null;
  home_score: number | null;
  away_score: number | null;
  status: "scheduled" | "live" | "finished";
  match_order: number;
  created_at: string;
  updated_at: string;
}
