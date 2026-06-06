import { requireDb } from "@/lib/db";
import {
  matches,
  universities,
  sports,
  matchStats,
  athletics,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, asc, inArray, type SQL } from "drizzle-orm";
import type { MatchWithTeams, SportSlug } from "@/types";
import { realMatchesOnly } from "./match-filters";
import {
  startOfDayBrazil,
  endOfDayBrazil,
  addDaysBrazil,
} from "@/lib/utils";

export async function enrichMatches(
  raw: (typeof matches.$inferSelect)[]
): Promise<MatchWithTeams[]> {
  if (raw.length === 0) return [];
  const db = requireDb();

  const sportIds = [...new Set(raw.map((m) => m.sportId))];
  const uniIds = [
    ...new Set(raw.flatMap((m) => [m.homeUniversityId, m.awayUniversityId])),
  ];
  const athIds = [
    ...new Set(
      raw
        .flatMap((m) => [m.homeAthleticsId, m.awayAthleticsId])
        .filter(Boolean)
    ),
  ] as string[];
  const matchIds = raw.map((m) => m.id);

  const [sportRows, uniRows, athRows, statRows] = await Promise.all([
    db.select().from(sports).where(inArray(sports.id, sportIds)),
    db.select().from(universities).where(inArray(universities.id, uniIds)),
    athIds.length
      ? db.select().from(athletics).where(inArray(athletics.id, athIds))
      : Promise.resolve([]),
    db.select().from(matchStats).where(inArray(matchStats.matchId, matchIds)),
  ]);

  const sportMap = new Map(sportRows.map((s) => [s.id, s]));
  const uniMap = new Map(uniRows.map((u) => [u.id, u]));
  const athMap = new Map(athRows.map((a) => [a.id, a]));
  const statMap = new Map(statRows.map((s) => [s.matchId, s]));

  return raw.map((m) => {
    const homeUni = uniMap.get(m.homeUniversityId)!;
    const awayUni = uniMap.get(m.awayUniversityId)!;
    const sport = sportMap.get(m.sportId)!;
    const stats = statMap.get(m.id);
    const homeAth = m.homeAthleticsId
      ? athMap.get(m.homeAthleticsId)
      : null;
    const awayAth = m.awayAthleticsId
      ? athMap.get(m.awayAthleticsId)
      : null;

    const homeName =
      m.homeTeamName ?? homeAth?.name ?? homeUni.shortName ?? homeUni.name;
    const awayName =
      m.awayTeamName ?? awayAth?.name ?? awayUni.shortName ?? awayUni.name;
    const homeLogo = homeAth?.logoUrl ?? homeUni.logoUrl ?? null;
    const awayLogo = awayAth?.logoUrl ?? awayUni.logoUrl ?? null;

    return {
      id: m.id,
      series: m.series,
      modality: m.modality,
      scheduledAt: m.scheduledAt,
      venue: m.venue,
      status: m.status as MatchWithTeams["status"],
      homeScore: m.homeScore,
      awayScore: m.awayScore,
      isFeatured: m.isFeatured,
      homeTeam: { name: homeName, logoUrl: homeLogo },
      awayTeam: { name: awayName, logoUrl: awayLogo },
      homeUniversity: {
        id: homeUni.id,
        name: homeUni.name,
        shortName: homeUni.shortName,
        logoUrl: homeUni.logoUrl,
      },
      awayUniversity: {
        id: awayUni.id,
        name: awayUni.name,
        shortName: awayUni.shortName,
        logoUrl: awayUni.logoUrl,
      },
      sport: { id: sport.id, name: sport.name, slug: sport.slug },
      stats: stats
        ? {
            goalsHome: stats.goalsHome,
            goalsAway: stats.goalsAway,
            assistsHome: stats.assistsHome,
            assistsAway: stats.assistsAway,
            basketsHome: stats.basketsHome,
            basketsAway: stats.basketsAway,
            yellowCardsHome: stats.yellowCardsHome,
            yellowCardsAway: stats.yellowCardsAway,
            redCardsHome: stats.redCardsHome,
            redCardsAway: stats.redCardsAway,
          }
        : null,
    };
  });
}

export async function getMatchById(id: string): Promise<MatchWithTeams | null> {
  const db = requireDb();
  const rows = await db.select().from(matches).where(eq(matches.id, id)).limit(1);
  if (!rows.length) return null;
  const enriched = await enrichMatches(rows);
  return enriched[0];
}

export async function getFeaturedMatch(): Promise<MatchWithTeams | null> {
  const db = requireDb();
  let rows = await db
    .select()
    .from(matches)
    .where(and(realMatchesOnly(), eq(matches.isFeatured, true)))
    .orderBy(asc(matches.scheduledAt))
    .limit(1);

  if (!rows.length) {
    rows = await db
      .select()
      .from(matches)
      .where(and(realMatchesOnly(), eq(matches.status, "scheduled")))
      .orderBy(asc(matches.scheduledAt))
      .limit(1);
  }

  if (!rows.length) return null;
  return (await enrichMatches(rows))[0];
}

export async function getUpcomingMatches(limit = 8): Promise<MatchWithTeams[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(matches)
    .where(
      and(
        realMatchesOnly(),
        eq(matches.status, "scheduled"),
        gte(matches.scheduledAt, new Date())
      )
    )
    .orderBy(asc(matches.scheduledAt))
    .limit(limit);
  return enrichMatches(rows);
}

export async function getRecentMatches(limit = 6): Promise<MatchWithTeams[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(matches)
    .where(and(realMatchesOnly(), eq(matches.status, "finished")))
    .orderBy(desc(matches.scheduledAt))
    .limit(limit);
  return enrichMatches(rows);
}

async function buildSportSeriesConditions(options: {
  sport?: SportSlug;
  series?: string;
}): Promise<SQL[]> {
  const extra: SQL[] = [];
  if (options.series?.trim()) {
    extra.push(eq(matches.series, options.series.trim().toUpperCase()));
  }
  if (options.sport) {
    const db = requireDb();
    const [sportRow] = await db
      .select({ id: sports.id })
      .from(sports)
      .where(eq(sports.slug, options.sport))
      .limit(1);
    if (sportRow) extra.push(eq(matches.sportId, sportRow.id));
  }
  return extra;
}

export async function getMatchesByFilter(options: {
  sport?: SportSlug;
  series?: string;
  tab: "upcoming" | "today" | "tomorrow" | "week" | "finished";
}): Promise<MatchWithTeams[]> {
  const db = requireDb();
  const now = new Date();
  const tomorrow = addDaysBrazil(now, 1);
  const weekEnd = addDaysBrazil(now, 7);
  const scopeFilters = await buildSportSeriesConditions(options);
  const hasScope = Boolean(options.sport || options.series?.trim());
  const listLimit = hasScope ? 500 : 150;

  let rows;

  if (options.tab === "upcoming") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          realMatchesOnly(),
          inArray(matches.status, ["scheduled", "live"]),
          gte(matches.scheduledAt, startOfDayBrazil(now)),
          ...scopeFilters
        )
      )
      .orderBy(asc(matches.scheduledAt))
      .limit(listLimit);
  } else if (options.tab === "finished") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          realMatchesOnly(),
          eq(matches.status, "finished"),
          ...scopeFilters
        )
      )
      .orderBy(desc(matches.scheduledAt))
      .limit(hasScope ? 200 : 50);
  } else if (options.tab === "today") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          realMatchesOnly(),
          gte(matches.scheduledAt, startOfDayBrazil(now)),
          lte(matches.scheduledAt, endOfDayBrazil(now)),
          ...scopeFilters
        )
      )
      .orderBy(asc(matches.scheduledAt))
      .limit(listLimit);
  } else if (options.tab === "tomorrow") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          realMatchesOnly(),
          gte(matches.scheduledAt, startOfDayBrazil(tomorrow)),
          lte(matches.scheduledAt, endOfDayBrazil(tomorrow)),
          ...scopeFilters
        )
      )
      .orderBy(asc(matches.scheduledAt))
      .limit(listLimit);
  } else {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          realMatchesOnly(),
          inArray(matches.status, ["scheduled", "live"]),
          gte(matches.scheduledAt, startOfDayBrazil(now)),
          lte(matches.scheduledAt, endOfDayBrazil(weekEnd)),
          ...scopeFilters
        )
      )
      .orderBy(asc(matches.scheduledAt))
      .limit(listLimit);
  }

  return enrichMatches(rows);
}
