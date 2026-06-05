import { requireDb } from "@/lib/db";
import {
  matches,
  universities,
  sports,
  matchStats,
  athletics,
} from "@/lib/db/schema";
import { eq, and, gte, lte, desc, asc, inArray } from "drizzle-orm";
import type { MatchWithTeams, SportSlug } from "@/types";

async function enrichMatches(
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
    .where(eq(matches.isFeatured, true))
    .orderBy(asc(matches.scheduledAt))
    .limit(1);

  if (!rows.length) {
    rows = await db
      .select()
      .from(matches)
      .where(eq(matches.status, "scheduled"))
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
    .where(eq(matches.status, "finished"))
    .orderBy(desc(matches.scheduledAt))
    .limit(limit);
  return enrichMatches(rows);
}

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

export async function getMatchesByFilter(options: {
  sport?: SportSlug;
  tab: "today" | "tomorrow" | "week" | "finished";
}): Promise<MatchWithTeams[]> {
  const db = requireDb();
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const weekEnd = new Date(now);
  weekEnd.setDate(weekEnd.getDate() + 7);

  let rows;

  if (options.tab === "finished") {
    rows = await db
      .select()
      .from(matches)
      .where(eq(matches.status, "finished"))
      .orderBy(desc(matches.scheduledAt))
      .limit(50);
  } else if (options.tab === "today") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          gte(matches.scheduledAt, startOfDay(now)),
          lte(matches.scheduledAt, endOfDay(now))
        )
      )
      .orderBy(asc(matches.scheduledAt));
  } else if (options.tab === "tomorrow") {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          gte(matches.scheduledAt, startOfDay(tomorrow)),
          lte(matches.scheduledAt, endOfDay(tomorrow))
        )
      )
      .orderBy(asc(matches.scheduledAt));
  } else {
    rows = await db
      .select()
      .from(matches)
      .where(
        and(
          gte(matches.scheduledAt, now),
          lte(matches.scheduledAt, weekEnd)
        )
      )
      .orderBy(asc(matches.scheduledAt))
      .limit(50);
  }

  const enriched = await enrichMatches(rows);
  if (options.sport) {
    return enriched.filter((m) => m.sport.slug === options.sport);
  }
  return enriched;
}
