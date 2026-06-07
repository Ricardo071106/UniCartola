import { requireDb } from "@/lib/db";
import {
  matches,
  sports,
  universities,
  athletics,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { isPlayoffPhase } from "@/lib/ndu/playoff-phases";
import {
  matchBelongsToSeries,
  matchSeriesSql,
  parseSeriesLetter,
} from "@/lib/ndu/series";
import { realMatchesOnly } from "./match-filters";
import type { SportSlug, StandingsEntry } from "@/types";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;
export type SeriesLetter = (typeof SERIES)[number];
export { SERIES };

export function parseSeries(value?: string | null): SeriesLetter {
  const candidate = (value?.trim() || "A").toUpperCase();
  return SERIES.includes(candidate as SeriesLetter)
    ? (candidate as SeriesLetter)
    : "A";
}

const SPORT_SLUGS = ["futsal", "futebol", "basquete"] as const;

export function parseSport(value?: string | null): SportSlug {
  const candidate = (value?.trim() || "futsal").toLowerCase();
  return SPORT_SLUGS.includes(candidate as SportSlug)
    ? (candidate as SportSlug)
    : "futsal";
}

export type PalpitesSportFilter = SportSlug | "all";

export function parsePalpitesSport(value?: string | null): PalpitesSportFilter {
  const candidate = (value?.trim() || "futsal").toLowerCase();
  if (candidate === "all" || candidate === "todos") return "all";
  return parseSport(candidate);
}

function isSeedPlaceholderTeam(name: string | null | undefined): boolean {
  const t = (name ?? "").toLowerCase();
  return t.includes("colocado do grupo") || t.includes("melhor ");
}

/** Mata-mata real vs grupo numérico salvo errado como fase (ex.: "4" → "Quartas"). */
function countsForStandings(
  match: {
    groupName: string | null;
    homeTeamName: string | null;
    awayTeamName: string | null;
  },
  sportSlug: SportSlug
): boolean {
  if (!isPlayoffPhase(match.groupName)) return true;
  if (sportSlug !== "futebol") return false;

  const phase = (match.groupName ?? "").trim();
  if (phase !== "Quartas" && phase !== "Oitavas") return false;

  return (
    !isSeedPlaceholderTeam(match.homeTeamName) &&
    !isSeedPlaceholderTeam(match.awayTeamName)
  );
}

export async function getStandingsBySeries(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<StandingsEntry[]> {
  const db = requireDb();

  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);

  if (!sport) return [];

  const finishedRows = await db
    .select()
    .from(matches)
    .where(
      and(
        realMatchesOnly(),
        eq(matches.sportId, sport.id),
        matchSeriesSql(series),
        eq(matches.status, "finished")
      )
    );

  const targetSeries = parseSeriesLetter(series);
  const finished = finishedRows.filter(
    (m) =>
      countsForStandings(m, sportSlug) &&
      matchBelongsToSeries(m.series, targetSeries, m.externalKey, {
        includeUnknown: true,
      })
  );

  if (finished.length === 0) return [];

  const stats = new Map<
    string,
    {
      universityId: string;
      athleticsId: string | null;
      teamName: string;
      logoUrl: string | null;
      wins: number;
      draws: number;
      losses: number;
      goalsFor: number;
      goalsAgainst: number;
    }
  >();

  function bump(
    uniId: string,
    athId: string | null,
    teamName: string,
    logoUrl: string | null,
    w: number,
    d: number,
    l: number,
    gf: number,
    ga: number
  ) {
    const key = athId ?? uniId;
    const cur = stats.get(key) ?? {
      universityId: uniId,
      athleticsId: athId,
      teamName,
      logoUrl,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
    };
    cur.wins += w;
    cur.draws += d;
    cur.losses += l;
    cur.goalsFor += gf;
    cur.goalsAgainst += ga;
    stats.set(key, cur);
  }

  const uniIds = [
    ...new Set(
      finished.flatMap((m) => [m.homeUniversityId, m.awayUniversityId])
    ),
  ];
  const athIds = [
    ...new Set(
      finished.flatMap((m) => [m.homeAthleticsId, m.awayAthleticsId]).filter(Boolean)
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

  for (const m of finished) {
    const homeUni = uniMap.get(m.homeUniversityId);
    const awayUni = uniMap.get(m.awayUniversityId);
    const homeAth = m.homeAthleticsId
      ? athMap.get(m.homeAthleticsId)
      : null;
    const awayAth = m.awayAthleticsId
      ? athMap.get(m.awayAthleticsId)
      : null;

    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;

    const homeName =
      m.homeTeamName ?? homeAth?.name ?? homeUni?.shortName ?? "Casa";
    const awayName =
      m.awayTeamName ?? awayAth?.name ?? awayUni?.shortName ?? "Fora";
    const homeLogo = homeAth?.logoUrl ?? homeUni?.logoUrl ?? null;
    const awayLogo = awayAth?.logoUrl ?? awayUni?.logoUrl ?? null;

    if (hs > as) {
      bump(m.homeUniversityId, m.homeAthleticsId, homeName, homeLogo, 1, 0, 0, hs, as);
      bump(m.awayUniversityId, m.awayAthleticsId, awayName, awayLogo, 0, 0, 1, as, hs);
    } else if (as > hs) {
      bump(m.homeUniversityId, m.homeAthleticsId, homeName, homeLogo, 0, 0, 1, hs, as);
      bump(m.awayUniversityId, m.awayAthleticsId, awayName, awayLogo, 1, 0, 0, as, hs);
    } else {
      bump(m.homeUniversityId, m.homeAthleticsId, homeName, homeLogo, 0, 1, 0, hs, as);
      bump(m.awayUniversityId, m.awayAthleticsId, awayName, awayLogo, 0, 1, 0, as, hs);
    }
  }

  return [...stats.values()]
    .map((s) => ({
      universityId: s.universityId,
      athleticsId: s.athleticsId,
      teamName: s.teamName,
      logoUrl: s.logoUrl,
      wins: s.wins,
      draws: s.draws,
      losses: s.losses,
      goalsFor: s.goalsFor,
      goalsAgainst: s.goalsAgainst,
      points: s.wins * 3 + s.draws,
      goalDifference: s.goalsFor - s.goalsAgainst,
    }))
    .sort((a, b) => b.points - a.points || b.goalDifference - a.goalDifference)
    .map((entry, i) => ({ ...entry, rank: i + 1 }));
}
