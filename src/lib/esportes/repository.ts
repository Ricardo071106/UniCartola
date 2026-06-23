/**
 * Camada de acesso a dados da área NDU Esportes.
 * Atualmente utiliza dados mockados; preparada para substituição por Supabase.
 */

import {
  MOCK_COMPETITIONS,
  MOCK_GAMES,
  MOCK_KNOCKOUT_BRACKETS,
  MOCK_SPORTS,
  MOCK_STATISTICS,
  MOCK_STANDINGS,
  MOCK_TEAM_STATS,
  MOCK_TEAMS,
} from "./mock-data";
import type {
  EsporteCompetition,
  EsporteGame,
  EsporteGamesTab,
  EsporteGameWithDetails,
  EsporteKnockoutBracket,
  EsporteSeries,
  EsporteStatisticCategory,
  EsporteStatisticEntry,
  EsporteSlug,
  EsporteSport,
  EsporteStanding,
  EsporteTeam,
  EsporteTeamStats,
} from "./types";
import { ESPORTE_SERIES } from "./types";

function getTeam(id: string): EsporteTeam | undefined {
  return MOCK_TEAMS.find((t) => t.id === id);
}

function getSport(id: string): EsporteSport | undefined {
  return MOCK_SPORTS.find((s) => s.id === id);
}

function getCompetition(id: string): EsporteCompetition | undefined {
  return MOCK_COMPETITIONS.find((c) => c.id === id);
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

function enrichGame(game: EsporteGame): EsporteGameWithDetails | null {
  const competition = getCompetition(game.competitionId);
  const homeTeam = getTeam(game.homeTeamId);
  const awayTeam = getTeam(game.awayTeamId);
  if (!competition || !homeTeam || !awayTeam) return null;
  const sport = getSport(competition.sportId);
  if (!sport) return null;
  return { ...game, competition, homeTeam, awayTeam, sport };
}

export function getAllSports(): EsporteSport[] {
  return MOCK_SPORTS;
}

export function getAllCompetitions(): EsporteCompetition[] {
  return MOCK_COMPETITIONS;
}

export function getAllTeams(): EsporteTeam[] {
  return MOCK_TEAMS;
}

export function parseEsporteSport(value?: string | null): EsporteSlug {
  const candidate = (value?.trim() || "futsal").toLowerCase();
  return MOCK_SPORTS.some((s) => s.slug === candidate)
    ? (candidate as EsporteSlug)
    : "futsal";
}

export function parseEsporteSeries(value?: string | null): EsporteSeries {
  const candidate = (value?.trim() || "A").toUpperCase();
  return ESPORTE_SERIES.includes(candidate as EsporteSeries)
    ? (candidate as EsporteSeries)
    : "A";
}

export function parseEsporteGamesTab(value?: string | null): EsporteGamesTab {
  const candidate = (value?.trim() || "upcoming").toLowerCase();
  return ["upcoming", "today", "tomorrow", "week", "finished"].includes(
    candidate
  )
    ? (candidate as EsporteGamesTab)
    : "upcoming";
}

export function getCompetitionBySportAndSeries(
  sportSlug: EsporteSlug,
  series: EsporteSeries
): EsporteCompetition | null {
  const sport = MOCK_SPORTS.find((s) => s.slug === sportSlug);
  if (!sport) return null;
  return (
    MOCK_COMPETITIONS.find(
      (competition) =>
        competition.sportId === sport.id && competition.series === series
    ) ?? null
  );
}

export function getCompetitionById(id: string): EsporteCompetition | null {
  return getCompetition(id) ?? null;
}

export function getSportForCompetition(competitionId: string): EsporteSport | null {
  const comp = getCompetition(competitionId);
  if (!comp) return null;
  return getSport(comp.sportId) ?? null;
}

export function getCompetitionDisplayName(competition: EsporteCompetition): string {
  return competition.name;
}

export function getSportDisplayName(sport: EsporteSport, series?: string): string {
  const base = `${sport.name} Masculino`;
  return series ? `${base} — Série ${series}` : base;
}

export function getCompetitionLabel(competition: EsporteCompetition, sport: EsporteSport): string {
  return `${sport.name} Masculino · Série ${competition.series}`;
}

export function getUpcomingGames(limit = 6): EsporteGameWithDetails[] {
  return MOCK_GAMES.filter((g) => g.status === "scheduled" || g.status === "live")
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime())
    .slice(0, limit)
    .map(enrichGame)
    .filter((g): g is EsporteGameWithDetails => g !== null);
}

export function getRecentResults(limit = 6): EsporteGameWithDetails[] {
  return MOCK_GAMES.filter((g) => g.status === "finished")
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime())
    .slice(0, limit)
    .map(enrichGame)
    .filter((g): g is EsporteGameWithDetails => g !== null);
}

export function getGamesByFilters({
  sport,
  series,
  tab,
  limit = 20,
}: {
  sport: EsporteSlug;
  series: EsporteSeries;
  tab: EsporteGamesTab;
  limit?: number;
}): EsporteGameWithDetails[] {
  const competition = getCompetitionBySportAndSeries(sport, series);
  if (!competition) return [];

  const today = new Date("2026-06-23T12:00:00-03:00");
  const tomorrow = addDays(today, 1);
  const weekEnd = addDays(today, 7);

  return MOCK_GAMES.filter((game) => game.competitionId === competition.id)
    .filter((game) => {
      const date = new Date(game.scheduledAt);

      if (tab === "finished") return game.status === "finished";
      if (game.status === "finished") return false;
      if (tab === "today") return isSameDay(date, today);
      if (tab === "tomorrow") return isSameDay(date, tomorrow);
      if (tab === "week") return date >= today && date <= weekEnd;
      return game.status === "scheduled" || game.status === "live";
    })
    .sort((a, b) => {
      const aTime = new Date(a.scheduledAt).getTime();
      const bTime = new Date(b.scheduledAt).getTime();
      return tab === "finished" ? bTime - aTime : aTime - bTime;
    })
    .slice(0, limit)
    .map(enrichGame)
    .filter((g): g is EsporteGameWithDetails => g !== null);
}

export function getGameById(id: string): EsporteGameWithDetails | null {
  const game = MOCK_GAMES.find((g) => g.id === id);
  if (!game) return null;
  return enrichGame(game);
}

export function getGamesByCompetition(competitionId: string): EsporteGameWithDetails[] {
  return MOCK_GAMES.filter((g) => g.competitionId === competitionId)
    .map(enrichGame)
    .filter((g): g is EsporteGameWithDetails => g !== null)
    .sort((a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime());
}

export function getUpcomingGamesByCompetition(competitionId: string): EsporteGameWithDetails[] {
  return getGamesByCompetition(competitionId).filter(
    (g) => g.status === "scheduled" || g.status === "live"
  );
}

export function getFinishedGamesByCompetition(competitionId: string): EsporteGameWithDetails[] {
  return getGamesByCompetition(competitionId).filter((g) => g.status === "finished");
}

export function getStandingsByCompetition(competitionId: string): (EsporteStanding & { team: EsporteTeam })[] {
  return MOCK_STANDINGS.filter((s) => s.competitionId === competitionId)
    .sort((a, b) => a.position - b.position)
    .map((s) => {
      const team = getTeam(s.teamId);
      if (!team) return null;
      return { ...s, team };
    })
    .filter((s): s is EsporteStanding & { team: EsporteTeam } => s !== null);
}

export function getTeamsByCompetition(competitionId: string): EsporteTeam[] {
  const teamIds = new Set(
    MOCK_STANDINGS.filter((s) => s.competitionId === competitionId).map((s) => s.teamId)
  );
  return MOCK_TEAMS.filter((t) => teamIds.has(t.id));
}

export function getTeamById(id: string): EsporteTeam | null {
  return getTeam(id) ?? null;
}

export function getTeamStats(
  teamId: string,
  competitionId?: string
): EsporteTeamStats | null {
  const stats = competitionId
    ? MOCK_TEAM_STATS.find((s) => s.teamId === teamId && s.competitionId === competitionId)
    : MOCK_TEAM_STATS.find((s) => s.teamId === teamId);
  return stats ?? null;
}

export function getStatisticsByCompetition(
  competitionId: string,
  category: EsporteStatisticCategory
): (EsporteStatisticEntry & { team: EsporteTeam; rank: number })[] {
  return MOCK_STATISTICS.filter(
    (entry) =>
      entry.competitionId === competitionId && entry.category === category
  )
    .sort((a, b) => b.total - a.total)
    .map((entry, index) => {
      const team = getTeam(entry.teamId);
      if (!team) return null;
      return { ...entry, team, rank: index + 1 };
    })
    .filter(
      (
        entry
      ): entry is EsporteStatisticEntry & { team: EsporteTeam; rank: number } =>
        entry !== null
    );
}

export function getKnockoutBracket(competitionId: string): EsporteKnockoutBracket | null {
  return MOCK_KNOCKOUT_BRACKETS[competitionId] ?? null;
}

export function formatGameDate(isoDate: string): { date: string; time: string } {
  const d = new Date(isoDate);
  const date = d.toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
  const time = d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  return { date, time };
}

export function getGameStatusLabel(status: EsporteGame["status"]): string {
  switch (status) {
    case "scheduled":
      return "Agendado";
    case "live":
      return "Em andamento";
    case "finished":
      return "Finalizado";
  }
}
