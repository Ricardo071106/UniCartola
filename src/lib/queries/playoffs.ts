import { unstable_cache } from "next/cache";
import { requireDb } from "@/lib/db";
import { matches, sports, seasons, universities, athletics } from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { isPlayoffPhase, normalizePlayoffPhase } from "@/lib/ndu/playoff-phases";
import { realMatchesOnly } from "./match-filters";
import { resolvePlayoffWinner, resolvePlayoffMatchDisplay } from "@/lib/ndu/playoff-winner";
import { matchSeriesSql, normalizeSeriesLabel } from "@/lib/ndu/series";
import { modalityToSportSlug, normalizeTeamName } from "@/lib/ndu/normalize";

type BoletimPlayoffRow = {
  modality: string;
  series: string;
  group: string;
  homeTeamRaw?: string;
  awayTeamRaw?: string;
  homeScore?: number;
  awayScore?: number;
  overtimeHomeScore?: number;
  overtimeAwayScore?: number;
  penaltyHomeScore?: number;
  penaltyAwayScore?: number;
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
  awayScore: number | null,
  extras: {
    overtimeHome?: number | null;
    overtimeAway?: number | null;
    penaltyHome?: number | null;
    penaltyAway?: number | null;
  } = {},
  isPlayoff = false
): "home" | "away" | "draw" | null {
  return resolvePlayoffWinner(homeScore, awayScore, extras, { isPlayoff })
    .winnerSide;
}

function winnerMethod(
  homeScore: number | null,
  awayScore: number | null,
  extras: {
    overtimeHome?: number | null;
    overtimeAway?: number | null;
    penaltyHome?: number | null;
    penaltyAway?: number | null;
  } = {},
  isPlayoff = false
): "regulation" | "overtime" | "penalties" | undefined {
  return resolvePlayoffWinner(homeScore, awayScore, extras, { isPlayoff }).method;
}

function displayTeamName(
  stored: string | null | undefined,
  athleticName: string | null | undefined,
  uniShort: string | null | undefined
): string {
  const name = (stored?.trim() || athleticName?.trim() || uniShort?.trim() || "")
    .replace(/\s+/g, " ");
  return name || "A definir";
}

function matchQuality(m: PlayoffMatch): number {
  let score = 0;
  if (m.homeName !== "A definir") score += 2;
  if (m.awayName !== "A definir") score += 2;
  if (m.status === "finished") score += 1;
  if (m.homeLogoUrl) score += 1;
  if (m.awayLogoUrl) score += 1;
  if (m.winnerSide === "home" || m.winnerSide === "away") score += 4;
  if (m.winnerSide === "draw") score -= 3;
  if (m.winnerMethod === "overtime" || m.winnerMethod === "penalties") score += 2;
  if (m.penaltyHomeScore != null && m.penaltyAwayScore != null) score += 3;
  if (m.overtimeHomeScore != null && m.overtimeAwayScore != null) score += 2;
  return score;
}

function finalizePlayoffMatch(match: PlayoffMatch): PlayoffMatch {
  const resolved = resolvePlayoffMatchDisplay(match);
  return {
    ...match,
    winnerSide: resolved.winnerSide,
    winnerMethod: resolved.winnerMethod ?? match.winnerMethod,
  };
}

function mergePlayoffExtras(
  primary: PlayoffMatch,
  secondary: PlayoffMatch
): Pick<
  PlayoffMatch,
  | "overtimeHomeScore"
  | "overtimeAwayScore"
  | "penaltyHomeScore"
  | "penaltyAwayScore"
> {
  return {
    overtimeHomeScore:
      primary.overtimeHomeScore ?? secondary.overtimeHomeScore ?? null,
    overtimeAwayScore:
      primary.overtimeAwayScore ?? secondary.overtimeAwayScore ?? null,
    penaltyHomeScore:
      primary.penaltyHomeScore ?? secondary.penaltyHomeScore ?? null,
    penaltyAwayScore:
      primary.penaltyAwayScore ?? secondary.penaltyAwayScore ?? null,
  };
}

function combinePlayoffMatches(
  a: PlayoffMatch,
  b: PlayoffMatch
): PlayoffMatch {
  const primary = matchQuality(b) >= matchQuality(a) ? b : a;
  const secondary = primary === a ? b : a;
  const extras = mergePlayoffExtras(primary, secondary);
  const merged: PlayoffMatch = {
    ...primary,
    ...extras,
    homeName:
      primary.homeName !== "A definir" ? primary.homeName : secondary.homeName,
    awayName:
      primary.awayName !== "A definir" ? primary.awayName : secondary.awayName,
    homeLogoUrl: primary.homeLogoUrl ?? secondary.homeLogoUrl,
    awayLogoUrl: primary.awayLogoUrl ?? secondary.awayLogoUrl,
    status:
      primary.status === "finished" || secondary.status === "finished"
        ? "finished"
        : primary.status,
  };
  return finalizePlayoffMatch(merged);
}

function canonicalPlayoffKey(match: PlayoffMatch): string {
  const phase = normalizePlayoffPhase(match.phase);
  const hs = match.homeScore ?? "s";
  const as = match.awayScore ?? "s";
  const names = [match.homeName, match.awayName]
    .map((n) => normalizeTeamName(n))
    .filter((n) => n && n !== "a definir")
    .sort()
    .join("|");
  return `${phase}:${hs}:${as}:${names || "open"}`;
}

function shouldMergePlayoffDuplicate(a: PlayoffMatch, b: PlayoffMatch): boolean {
  if (normalizePlayoffPhase(a.phase) !== normalizePlayoffPhase(b.phase)) {
    return false;
  }
  if (a.homeScore !== b.homeScore || a.awayScore !== b.awayScore) {
    return false;
  }
  if (a.homeScore == null || a.awayScore == null) return false;

  const teamsA = [a.homeName, a.awayName]
    .map((n) => normalizeTeamName(n))
    .filter((n) => n && n !== "a definir");
  const teamsB = [b.homeName, b.awayName]
    .map((n) => normalizeTeamName(n))
    .filter((n) => n && n !== "a definir");
  if (teamsA.length === 0 || teamsB.length === 0) return false;

  return teamsA.some((team) => teamsB.includes(team));
}

function collapsePlayoffDuplicates(matches: PlayoffMatch[]): PlayoffMatch[] {
  const collapsed: PlayoffMatch[] = [];
  const used = new Set<number>();

  for (let i = 0; i < matches.length; i++) {
    if (used.has(i)) continue;
    let merged = finalizePlayoffMatch(matches[i]);
    for (let j = i + 1; j < matches.length; j++) {
      if (used.has(j)) continue;
      if (shouldMergePlayoffDuplicate(merged, matches[j])) {
        merged = combinePlayoffMatches(merged, matches[j]);
        used.add(j);
      }
    }
    collapsed.push(merged);
  }

  return collapsed;
}

function mergeBrackets(
  ...sources: (PlayoffBracket | null)[]
): PlayoffBracket | null {
  const all = sources.flatMap((s) => s?.rounds.flatMap((r) => r.matches) ?? []);
  if (all.length === 0) return null;

  const best = new Map<string, PlayoffMatch>();
  for (const match of all) {
    const key = canonicalPlayoffKey(match);
    const existing = best.get(key);
    if (!existing) {
      best.set(key, finalizePlayoffMatch(match));
    } else {
      best.set(key, combinePlayoffMatches(existing, match));
    }
  }

  return buildBracketFromMatches(
    collapsePlayoffDuplicates([...best.values()])
  );
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
      const extras = {
        overtimeHome: row.overtimeHomeScore ?? null,
        overtimeAway: row.overtimeAwayScore ?? null,
        penaltyHome: row.penaltyHomeScore ?? null,
        penaltyAway: row.penaltyAwayScore ?? null,
      };
      const date =
        parseBoletimDate(row.dateLabel, year) ?? new Date(year, 0, 1);

      return finalizePlayoffMatch({
        id: `boletim-${row.series}-${phase}-${index}`,
        phase,
        scheduledAt: date,
        homeName: displayTeamName(home.name, home.name, null),
        awayName: displayTeamName(away.name, away.name, null),
        homeLogoUrl: home.logoUrl,
        awayLogoUrl: away.logoUrl,
        homeScore,
        awayScore,
        status: row.isFinished ? ("finished" as const) : ("scheduled" as const),
        winnerSide: winnerSide(homeScore, awayScore, extras, true),
        winnerMethod: winnerMethod(homeScore, awayScore, extras, true),
        overtimeHomeScore: extras.overtimeHome,
        overtimeAwayScore: extras.overtimeAway,
        penaltyHomeScore: extras.penaltyHome,
        penaltyAwayScore: extras.penaltyAway,
      });
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
      normalizeSeriesLabel(row.series) === series &&
      isPlayoffPhase(row.group)
  );
}

async function getBoletimPlayoffRows(
  sportSlug: SportSlug,
  series: SeriesLetter,
  year: number
) {
  return unstable_cache(
    () => loadBoletimPlayoffRows(sportSlug, series, year),
    ["boletim-playoff-rows", sportSlug, series, String(year)],
    { revalidate: 600 }
  )();
}

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

function isSeedPlaceholderTeam(name: string | null | undefined): boolean {
  const t = (name ?? "").toLowerCase();
  return t.includes("colocado do grupo") || t.includes("melhor ");
}

function isRealKnockoutRow(
  row: {
    groupName: string | null;
    homeTeamName: string | null;
    awayTeamName: string | null;
  },
  sportSlug: SportSlug
): boolean {
  if (!isPlayoffPhase(row.groupName)) return false;
  const phase = (row.groupName ?? "").trim();
  if (phase === "Semi" || phase === "Final") return true;
  if (sportSlug !== "futebol" || (phase !== "Quartas" && phase !== "Oitavas")) {
    return true;
  }
  return (
    isSeedPlaceholderTeam(row.homeTeamName) ||
    isSeedPlaceholderTeam(row.awayTeamName)
  );
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
    .where(
      and(
        realMatchesOnly(),
        eq(matches.sportId, sport.id),
        matchSeriesSql(series)
      )
    );

  const playoffRows = allSeriesMatches.filter((m) =>
    isRealKnockoutRow(m, sportSlug)
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

    const homeName = displayTeamName(
      m.homeTeamName,
      homeAth?.name,
      homeUni?.shortName
    );
    const awayName = displayTeamName(
      m.awayTeamName,
      awayAth?.name,
      awayUni?.shortName
    );

    const phase = normalizePlayoffPhase(m.groupName ?? "");
    const win = winnerSide(m.homeScore, m.awayScore, {}, true);

    return finalizePlayoffMatch({
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
      winnerMethod: winnerMethod(m.homeScore, m.awayScore, {}, true),
    });
  });

  return buildBracketFromMatches(playoffMatches);
}

async function resolveTeamFromRow(
  raw: string | undefined,
  logoUrl: string | undefined,
  athleticsRows: (typeof athletics.$inferSelect)[]
) {
  if (raw?.trim()) {
    return resolveTeamPresentation(raw.trim(), athleticsRows);
  }
  if (logoUrl) {
    const nduId = logoUrl.match(/atleticas\/(\d+)/i)?.[1];
    const ath = athleticsRows.find((a) =>
      nduId
        ? a.logoUrl?.includes(`/atleticas/${nduId}/`)
        : a.logoUrl === logoUrl
    );
    if (ath) return { name: ath.name, logoUrl: ath.logoUrl ?? logoUrl };
    return { name: "A definir", logoUrl };
  }
  return { name: "A definir", logoUrl: null };
}

async function getPlayoffBracketFromNduJogos(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  const { fetchAllNduJogosRows } = await import("@/lib/ndu/jogos-fetch");
  const { parseNduMatchDateTime } = await import("@/lib/ndu/match-datetime");

  const rows = (await fetchAllNduJogosRows()).filter(
    (row) =>
      modalityToSportSlug(row.modality) === sportSlug &&
      row.series === series &&
      isPlayoffPhase(row.group)
  );

  if (rows.length === 0) return null;

  const db = requireDb();
  const athleticsRows = await db.select().from(athletics);
  const year = await getSeasonYear();

  const playoffMatches: PlayoffMatch[] = await Promise.all(
    rows.map(async (row, index) => {
      const [home, away] = await Promise.all([
        resolveTeamFromRow(row.homeTeamRaw, row.homeLogoUrl, athleticsRows),
        resolveTeamFromRow(row.awayTeamRaw, row.awayLogoUrl, athleticsRows),
      ]);

      const phase = normalizePlayoffPhase(row.group);
      const homeScore = row.homeScore ?? null;
      const awayScore = row.awayScore ?? null;
      const scheduledAt =
        parseNduMatchDateTime(row.dateLabel, year) ?? new Date(year, 0, 1);

      const extras = {
        overtimeHome: row.overtimeHomeScore ?? null,
        overtimeAway: row.overtimeAwayScore ?? null,
        penaltyHome: row.penaltyHomeScore ?? null,
        penaltyAway: row.penaltyAwayScore ?? null,
      };

      return finalizePlayoffMatch({
        id: row.nduMatchId ? `ndu:${row.nduMatchId}` : `jogos-${series}-${phase}-${index}`,
        phase,
        scheduledAt,
        homeName: displayTeamName(home.name, home.name, null),
        awayName: displayTeamName(away.name, away.name, null),
        homeLogoUrl: home.logoUrl,
        awayLogoUrl: away.logoUrl,
        homeScore,
        awayScore,
        status: row.isFinished ? ("finished" as const) : ("scheduled" as const),
        winnerSide: winnerSide(homeScore, awayScore, extras, true),
        winnerMethod: winnerMethod(homeScore, awayScore, extras, true),
        overtimeHomeScore: extras.overtimeHome,
        overtimeAwayScore: extras.overtimeAway,
        penaltyHomeScore: extras.penaltyHome,
        penaltyAwayScore: extras.penaltyAway,
      });
    })
  );

  return buildBracketFromMatches(playoffMatches);
}

/** Rápido — banco. A home complementa via API quando faltar dados. */
export async function getPlayoffBracket(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  return getPlayoffBracketFromDb(sportSlug, series);
}

/** Banco + boletim (com timeout). */
export async function getPlayoffBracketWithBoletim(
  sportSlug: SportSlug,
  series: SeriesLetter,
  timeoutMs = 12000
): Promise<PlayoffBracket | null> {
  const { withTimeout } = await import("@/lib/utils/timeout");

  return withTimeout(
    (async () => {
      const fromDb = await getPlayoffBracketFromDb(sportSlug, series);

      const [fromNdu, fromBoletim] = await Promise.all([
        withTimeout(getPlayoffBracketFromNduJogos(sportSlug, series), 5000, null),
        withTimeout(getPlayoffBracketFromBoletim(sportSlug, series), 10000, null),
      ]);

      return mergeBrackets(fromBoletim, fromNdu, fromDb);
    })(),
    timeoutMs,
    null
  );
}
