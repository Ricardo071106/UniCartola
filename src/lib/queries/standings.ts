import { requireDb } from "@/lib/db";
import {
  matches,
  sports,
  universities,
  athletics,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";

import { isPlayoffPhase } from "@/lib/ndu/playoff-phases";
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
        eq(matches.series, series),
        eq(matches.status, "finished")
      )
    );

  const finished = finishedRows.filter((m) => !isPlayoffPhase(m.groupName));

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
