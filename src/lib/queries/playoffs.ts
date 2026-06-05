import { unstable_cache } from "next/cache";
import { requireDb } from "@/lib/db";
import { matches, sports, seasons, universities, athletics } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { isPlayoffPhase, normalizePlayoffPhase } from "@/lib/ndu/playoff-phases";
import { modalityToSportSlug, normalizeTeamName } from "@/lib/ndu/normalize";

type BoletimPlayoffRow = {
  modality: string;
  series: string;
  group: string;
  homeTeamRaw?: string;
  awayTeamRaw?: string;
  homeScore?: number;
  awayScore?: number;
  isFinished: boolean;
  dateLabel: string;
};

function parseBoletimDate(dateLabel: string, year: number): Date | null {
  const m = dateLabel.match(/^(\d{2})\/(\d{2})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  if (month < 0 || month > 11) return null;
  return new Date(year, month, day, 12, 0, 0);
}
import type { PlayoffBracket, PlayoffMatch, SportSlug } from "@/types";
import type { SeriesLetter } from "./standings";

const PLAYOFF_PHASES = ["Oitavas", "Quartas", "Semi", "Final"] as const;
const ROUND_ORDER: Record<(typeof PLAYOFF_PHASES)[number], number> = {
  Oitavas: 0,
  Quartas: 1,
  Semi: 2,
  Final: 3,
};

function phaseRank(phase: string): number {
  const normalized = normalizePlayoffPhase(phase);
  return ROUND_ORDER[normalized as (typeof PLAYOFF_PHASES)[number]] ?? 99;
}

function winnerSide(
  homeScore: number | null,
  awayScore: number | null
): "home" | "away" | "draw" | null {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

function buildBracketFromMatches(playoffMatches: PlayoffMatch[]): PlayoffBracket {
  const sorted = [...playoffMatches].sort(
    (a, b) =>
      phaseRank(a.phase) - phaseRank(b.phase) ||
      a.scheduledAt.getTime() - b.scheduledAt.getTime()
  );

  const rounds = PLAYOFF_PHASES.map((phase) => ({
    phase,
    matches: sorted.filter((m) => normalizePlayoffPhase(m.phase) === phase),
  })).filter((r) => r.matches.length > 0);

  return { rounds };
}

async function resolveTeamPresentation(
  teamName: string,
  athleticsRows: (typeof athletics.$inferSelect)[]
) {
  const norm = normalizeTeamName(teamName);
  const ath =
    athleticsRows.find((a) => normalizeTeamName(a.name) === norm) ??
    athleticsRows.find(
      (a) => a.nduAlias && normalizeTeamName(a.nduAlias) === norm
    ) ??
    athleticsRows.find(
      (a) =>
        norm.includes(normalizeTeamName(a.name)) ||
        normalizeTeamName(a.name).includes(norm)
    );

  return {
    name: ath?.name ?? teamName,
    logoUrl: ath?.logoUrl ?? null,
  };
}

async function rowsToPlayoffMatches(
  rows: BoletimPlayoffRow[],
  year: number
): Promise<PlayoffMatch[]> {
  const db = requireDb();
  const athleticsRows = await db.select().from(athletics);

  return Promise.all(
    rows.map(async (row, index) => {
      const [home, away] = await Promise.all([
        resolveTeamPresentation(row.homeTeamRaw ?? "", athleticsRows),
        resolveTeamPresentation(row.awayTeamRaw ?? "", athleticsRows),
      ]);

      const phase = normalizePlayoffPhase(row.group);
      const homeScore = row.homeScore ?? null;
      const awayScore = row.awayScore ?? null;
      const date =
        parseBoletimDate(row.dateLabel, year) ?? new Date(year, 0, 1);

      return {
        id: `boletim-${row.series}-${phase}-${index}`,
        phase,
        scheduledAt: date,
        homeName: home.name,
        awayName: away.name,
        homeLogoUrl: home.logoUrl,
        awayLogoUrl: away.logoUrl,
        homeScore,
        awayScore,
        status: row.isFinished ? ("finished" as const) : ("scheduled" as const),
        winnerSide: winnerSide(homeScore, awayScore),
      };
    })
  );
}

async function loadBoletimPlayoffRows(
  sportSlug: SportSlug,
  series: SeriesLetter,
  year: number
) {
  const { parseBoletimMatches } = await import("@/lib/ndu/boletim-sync");
  const boletim = await parseBoletimMatches(year);
  if (!boletim) return [];

  return boletim.rows.filter(
    (row) =>
      modalityToSportSlug(row.modality) === sportSlug &&
      row.series === series &&
      isPlayoffPhase(row.group)
  );
}

const getBoletimPlayoffRows = unstable_cache(
  loadBoletimPlayoffRows,
  ["boletim-playoff-rows"],
  { revalidate: 1800 }
);

async function getSeasonYear(): Promise<number> {
  const db = requireDb();
  const [active] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  return active?.year ?? new Date().getFullYear();
}

async function getPlayoffBracketFromBoletim(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  const year = await getSeasonYear();
  const rows = await getBoletimPlayoffRows(sportSlug, series, year);
  if (rows.length === 0) return null;

  const playoffMatches = await rowsToPlayoffMatches(rows, year);
  return buildBracketFromMatches(playoffMatches);
}

async function getPlayoffBracketFromDb(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  const db = requireDb();

  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);

  if (!sport) return null;

  const allSeriesMatches = await db
    .select()
    .from(matches)
    .where(and(eq(matches.sportId, sport.id), eq(matches.series, series)));

  const playoffRows = allSeriesMatches.filter((m) =>
    isPlayoffPhase(m.groupName)
  );

  if (playoffRows.length === 0) return null;

  const uniIds = [
    ...new Set(
      playoffRows.flatMap((m) => [m.homeUniversityId, m.awayUniversityId])
    ),
  ];
  const athIds = [
    ...new Set(
      playoffRows
        .flatMap((m) => [m.homeAthleticsId, m.awayAthleticsId])
        .filter(Boolean)
    ),
  ] as string[];

  const [uniRows, athRows] = await Promise.all([
    db.select().from(universities).where(inArray(universities.id, uniIds)),
    athIds.length
      ? db.select().from(athletics).where(inArray(athletics.id, athIds))
      : Promise.resolve([]),
  ]);

  const uniMap = new Map(uniRows.map((u) => [u.id, u]));
  const athMap = new Map(athRows.map((a) => [a.id, a]));

  const playoffMatches: PlayoffMatch[] = playoffRows.map((m) => {
    const homeAth = m.homeAthleticsId ? athMap.get(m.homeAthleticsId) : null;
    const awayAth = m.awayAthleticsId ? athMap.get(m.awayAthleticsId) : null;
    const homeUni = uniMap.get(m.homeUniversityId);
    const awayUni = uniMap.get(m.awayUniversityId);

    const homeName =
      m.homeTeamName ?? homeAth?.name ?? homeUni?.shortName ?? "Casa";
    const awayName =
      m.awayTeamName ?? awayAth?.name ?? awayUni?.shortName ?? "Fora";

    const phase = normalizePlayoffPhase(m.groupName ?? "");
    const win = winnerSide(m.homeScore, m.awayScore);

    return {
      id: m.id,
      phase,
      scheduledAt: m.scheduledAt,
      homeName,
      awayName,
      homeLogoUrl: homeAth?.logoUrl ?? homeUni?.logoUrl ?? null,
      awayLogoUrl: awayAth?.logoUrl ?? awayUni?.logoUrl ?? null,
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      status: m.status,
      winnerSide: win,
    };
  });

  return buildBracketFromMatches(playoffMatches);
}

export async function getPlayoffBracket(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  const fromDb = await getPlayoffBracketFromDb(sportSlug, series);
  if (fromDb && fromDb.rounds.length > 0) return fromDb;

  return getPlayoffBracketFromBoletim(sportSlug, series);
}
