import type {
  EsporteCompetition,
  EsporteGame,
  EsporteKnockoutBracket,
  EsporteSeries,
  EsporteSport,
  EsporteStanding,
  EsporteTeam,
  EsporteTeamStats,
} from "./types";
import { ESPORTE_SERIES } from "./types";

const SPORT_DEFS: Omit<EsporteSport, "id">[] = [
  { slug: "futsal", name: "Futsal", icon: "/icons/futsal-ball.svg" },
  {
    slug: "futebol",
    name: "Futebol",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d3/Soccerball.svg/120px-Soccerball.svg.png",
  },
  {
    slug: "basquete",
    name: "Basquete",
    icon: "https://upload.wikimedia.org/wikipedia/commons/thumb/7/7a/Basketball.png/120px-Basketball.png",
  },
];

export const MOCK_SPORTS: EsporteSport[] = SPORT_DEFS.map((s) => ({
  ...s,
  id: `sport-${s.slug}`,
}));

export const MOCK_COMPETITIONS: EsporteCompetition[] = MOCK_SPORTS.flatMap(
  (sport) =>
    ESPORTE_SERIES.map((series) => ({
      id: `comp-${sport.slug}-${series.toLowerCase()}`,
      sportId: sport.id,
      series,
      name: `NDU ${sport.name} Masculino — Série ${series}`,
      season: "2026",
      hasKnockout: true,
    }))
);

export const MOCK_TEAMS: EsporteTeam[] = [
  { id: "team-link", name: "Link School", shortName: "Link", logoUrl: null, color: "#006b3f" },
  { id: "team-espm", name: "ESPM", shortName: "ESPM", logoUrl: null, color: "#c41e3a" },
  { id: "team-fgv", name: "FGV", shortName: "FGV", logoUrl: null, color: "#003366" },
  { id: "team-insper", name: "Insper", shortName: "Insper", logoUrl: null, color: "#1a1a2e" },
  { id: "team-mack", name: "Mackenzie", shortName: "Mack", logoUrl: null, color: "#8b0000" },
  { id: "team-puc", name: "PUC-SP", shortName: "PUC", logoUrl: null, color: "#003087" },
  { id: "team-fea", name: "FEA-USP", shortName: "FEA", logoUrl: null, color: "#ffd700" },
  { id: "team-poliusp", name: "Poli-USP", shortName: "Poli", logoUrl: null, color: "#004d40" },
];

function compId(sport: string, series: EsporteSeries) {
  return `comp-${sport}-${series.toLowerCase()}`;
}

export const MOCK_GAMES: EsporteGame[] = [
  {
    id: "game-1",
    competitionId: compId("futsal", "A"),
    homeTeamId: "team-link",
    awayTeamId: "team-espm",
    homeScore: null,
    awayScore: null,
    scheduledAt: "2026-06-24T19:00:00-03:00",
    venue: "Ginásio NDU",
    status: "scheduled",
    round: "Rodada 8",
  },
  {
    id: "game-2",
    competitionId: compId("futsal", "A"),
    homeTeamId: "team-fgv",
    awayTeamId: "team-insper",
    homeScore: null,
    awayScore: null,
    scheduledAt: "2026-06-24T20:30:00-03:00",
    venue: "Ginásio NDU",
    status: "scheduled",
    round: "Rodada 8",
  },
  {
    id: "game-3",
    competitionId: compId("basquete", "A"),
    homeTeamId: "team-mack",
    awayTeamId: "team-puc",
    homeScore: null,
    awayScore: null,
    scheduledAt: "2026-06-25T18:00:00-03:00",
    venue: "Quadra Mackenzie",
    status: "scheduled",
    round: "Rodada 5",
  },
  {
    id: "game-4",
    competitionId: compId("futebol", "A"),
    homeTeamId: "team-fea",
    awayTeamId: "team-poliusp",
    homeScore: null,
    awayScore: null,
    scheduledAt: "2026-06-25T19:30:00-03:00",
    venue: "Campo USP",
    status: "scheduled",
    round: "Rodada 6",
  },
  {
    id: "game-5",
    competitionId: compId("futsal", "B"),
    homeTeamId: "team-espm",
    awayTeamId: "team-fgv",
    homeScore: null,
    awayScore: null,
    scheduledAt: "2026-06-26T19:00:00-03:00",
    venue: "Ginásio ESPM",
    status: "scheduled",
    round: "Rodada 7",
  },
  {
    id: "game-6",
    competitionId: compId("futsal", "A"),
    homeTeamId: "team-link",
    awayTeamId: "team-espm",
    homeScore: 3,
    awayScore: 1,
    scheduledAt: "2026-06-20T19:00:00-03:00",
    venue: "Ginásio NDU",
    status: "finished",
    round: "Rodada 7",
  },
  {
    id: "game-7",
    competitionId: compId("futsal", "A"),
    homeTeamId: "team-fgv",
    awayTeamId: "team-mack",
    homeScore: 2,
    awayScore: 2,
    scheduledAt: "2026-06-19T20:00:00-03:00",
    venue: "Ginásio FGV",
    status: "finished",
    round: "Rodada 7",
  },
  {
    id: "game-8",
    competitionId: compId("basquete", "A"),
    homeTeamId: "team-insper",
    awayTeamId: "team-link",
    homeScore: 78,
    awayScore: 65,
    scheduledAt: "2026-06-18T18:30:00-03:00",
    venue: "Quadra Insper",
    status: "finished",
    round: "Rodada 4",
  },
  {
    id: "game-9",
    competitionId: compId("futebol", "A"),
    homeTeamId: "team-puc",
    awayTeamId: "team-espm",
    homeScore: 2,
    awayScore: 0,
    scheduledAt: "2026-06-17T19:00:00-03:00",
    venue: "Campo PUC",
    status: "finished",
    round: "Rodada 5",
  },
  {
    id: "game-10",
    competitionId: compId("futsal", "A"),
    homeTeamId: "team-puc",
    awayTeamId: "team-fea",
    homeScore: 1,
    awayScore: 0,
    scheduledAt: "2026-06-23T21:00:00-03:00",
    venue: "Ginásio PUC",
    status: "live",
    round: "Rodada 8",
  },
  {
    id: "game-11",
    competitionId: compId("futsal", "B"),
    homeTeamId: "team-link",
    awayTeamId: "team-mack",
    homeScore: 4,
    awayScore: 2,
    scheduledAt: "2026-06-15T19:00:00-03:00",
    venue: "Ginásio Link",
    status: "finished",
    round: "Rodada 6",
  },
  {
    id: "game-12",
    competitionId: compId("basquete", "B"),
    homeTeamId: "team-fgv",
    awayTeamId: "team-espm",
    homeScore: 55,
    awayScore: 48,
    scheduledAt: "2026-06-14T17:00:00-03:00",
    venue: "Quadra FGV",
    status: "finished",
    round: "Rodada 3",
  },
];

export const MOCK_STANDINGS: EsporteStanding[] = [
  { position: 1, teamId: "team-link", competitionId: compId("futsal", "A"), points: 21, gamesPlayed: 7, wins: 7, draws: 0, losses: 0, goalsFor: 22, goalsAgainst: 8 },
  { position: 2, teamId: "team-fgv", competitionId: compId("futsal", "A"), points: 16, gamesPlayed: 7, wins: 5, draws: 1, losses: 1, goalsFor: 18, goalsAgainst: 10 },
  { position: 3, teamId: "team-espm", competitionId: compId("futsal", "A"), points: 13, gamesPlayed: 7, wins: 4, draws: 1, losses: 2, goalsFor: 15, goalsAgainst: 12 },
  { position: 4, teamId: "team-insper", competitionId: compId("futsal", "A"), points: 10, gamesPlayed: 7, wins: 3, draws: 1, losses: 3, goalsFor: 12, goalsAgainst: 14 },
  { position: 5, teamId: "team-mack", competitionId: compId("futsal", "A"), points: 7, gamesPlayed: 7, wins: 2, draws: 1, losses: 4, goalsFor: 10, goalsAgainst: 15 },
  { position: 6, teamId: "team-puc", competitionId: compId("futsal", "A"), points: 6, gamesPlayed: 7, wins: 2, draws: 0, losses: 5, goalsFor: 9, goalsAgainst: 16 },
  { position: 7, teamId: "team-fea", competitionId: compId("futsal", "A"), points: 4, gamesPlayed: 7, wins: 1, draws: 1, losses: 5, goalsFor: 8, goalsAgainst: 17 },
  { position: 8, teamId: "team-poliusp", competitionId: compId("futsal", "A"), points: 3, gamesPlayed: 7, wins: 1, draws: 0, losses: 6, goalsFor: 7, goalsAgainst: 19 },

  { position: 1, teamId: "team-espm", competitionId: compId("futsal", "B"), points: 15, gamesPlayed: 6, wins: 5, draws: 0, losses: 1, goalsFor: 18, goalsAgainst: 8 },
  { position: 2, teamId: "team-link", competitionId: compId("futsal", "B"), points: 12, gamesPlayed: 6, wins: 4, draws: 0, losses: 2, goalsFor: 16, goalsAgainst: 10 },
  { position: 3, teamId: "team-fgv", competitionId: compId("futsal", "B"), points: 9, gamesPlayed: 6, wins: 3, draws: 0, losses: 3, goalsFor: 12, goalsAgainst: 11 },
  { position: 4, teamId: "team-mack", competitionId: compId("futsal", "B"), points: 6, gamesPlayed: 6, wins: 2, draws: 0, losses: 4, goalsFor: 9, goalsAgainst: 14 },

  { position: 1, teamId: "team-insper", competitionId: compId("basquete", "A"), points: 12, gamesPlayed: 4, wins: 4, draws: 0, losses: 0, goalsFor: 312, goalsAgainst: 260 },
  { position: 2, teamId: "team-mack", competitionId: compId("basquete", "A"), points: 9, gamesPlayed: 4, wins: 3, draws: 0, losses: 1, goalsFor: 295, goalsAgainst: 275 },
  { position: 3, teamId: "team-link", competitionId: compId("basquete", "A"), points: 6, gamesPlayed: 4, wins: 2, draws: 0, losses: 2, goalsFor: 280, goalsAgainst: 285 },
  { position: 4, teamId: "team-puc", competitionId: compId("basquete", "A"), points: 3, gamesPlayed: 4, wins: 1, draws: 0, losses: 3, goalsFor: 265, goalsAgainst: 292 },

  { position: 1, teamId: "team-puc", competitionId: compId("futebol", "A"), points: 15, gamesPlayed: 5, wins: 5, draws: 0, losses: 0, goalsFor: 12, goalsAgainst: 3 },
  { position: 2, teamId: "team-fea", competitionId: compId("futebol", "A"), points: 9, gamesPlayed: 5, wins: 3, draws: 0, losses: 2, goalsFor: 8, goalsAgainst: 6 },
  { position: 3, teamId: "team-poliusp", competitionId: compId("futebol", "A"), points: 6, gamesPlayed: 5, wins: 2, draws: 0, losses: 3, goalsFor: 6, goalsAgainst: 8 },
  { position: 4, teamId: "team-espm", competitionId: compId("futebol", "A"), points: 3, gamesPlayed: 5, wins: 1, draws: 0, losses: 4, goalsFor: 4, goalsAgainst: 10 },
];

export const MOCK_KNOCKOUT_BRACKETS: Record<string, EsporteKnockoutBracket> = {
  [compId("futsal", "A")]: {
    competitionId: compId("futsal", "A"),
    rounds: [
      {
        phase: "quartas",
        label: "Quartas de Final",
        matches: [
          { id: "ko-q1", homeTeamId: "team-link", awayTeamId: "team-puc", homeScore: 4, awayScore: 1, status: "finished" },
          { id: "ko-q2", homeTeamId: "team-fgv", awayTeamId: "team-mack", homeScore: 3, awayScore: 2, status: "finished" },
          { id: "ko-q3", homeTeamId: "team-espm", awayTeamId: "team-fea", homeScore: 2, awayScore: 0, status: "finished" },
          { id: "ko-q4", homeTeamId: "team-insper", awayTeamId: "team-poliusp", homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
      {
        phase: "semifinal",
        label: "Semifinal",
        matches: [
          { id: "ko-s1", homeTeamId: "team-link", awayTeamId: "team-fgv", homeScore: null, awayScore: null, status: "scheduled" },
          { id: "ko-s2", homeTeamId: "team-espm", awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
      {
        phase: "final",
        label: "Final",
        matches: [
          { id: "ko-f1", homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
    ],
  },
  [compId("basquete", "A")]: {
    competitionId: compId("basquete", "A"),
    rounds: [
      {
        phase: "quartas",
        label: "Quartas de Final",
        matches: [
          { id: "ko-bq1", homeTeamId: "team-insper", awayTeamId: "team-puc", homeScore: null, awayScore: null, status: "scheduled" },
          { id: "ko-bq2", homeTeamId: "team-mack", awayTeamId: "team-link", homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
      {
        phase: "semifinal",
        label: "Semifinal",
        matches: [
          { id: "ko-bs1", homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled" },
          { id: "ko-bs2", homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
      {
        phase: "final",
        label: "Final",
        matches: [
          { id: "ko-bf1", homeTeamId: null, awayTeamId: null, homeScore: null, awayScore: null, status: "scheduled" },
        ],
      },
    ],
  },
};

export const MOCK_TEAM_STATS: EsporteTeamStats[] = MOCK_STANDINGS.map((s) => ({
  teamId: s.teamId,
  competitionId: s.competitionId,
  gamesPlayed: s.gamesPlayed,
  wins: s.wins,
  draws: s.draws,
  losses: s.losses,
  goalsFor: s.goalsFor,
  goalsAgainst: s.goalsAgainst,
}));
