import { requireDb } from "@/lib/db";
import {
  matches,
  matchStats,
  sports,
  athletics,
  universities,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import type { ScorerEntry, SportSlug } from "@/types";
import type { SeriesLetter } from "./standings";

type GoalScorerJson = { name: string; team?: string; goals: number };
type TopScorerJson = { name: string; team?: string; points: number };

export async function getTopGoalScorers(
  sportSlug: SportSlug,
  series: SeriesLetter,
  limit = 10
): Promise<ScorerEntry[]> {
  if (sportSlug === "basquete") return [];

  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return [];

  const matchRows = await db
    .select({ match: matches, stats: matchStats })
    .from(matches)
    .innerJoin(matchStats, eq(matchStats.matchId, matches.id))
    .where(
      and(
        eq(matches.sportId, sport.id),
        eq(matches.series, series),
        eq(matches.status, "finished")
      )
    );

  const agg = new Map<string, ScorerEntry>();

  for (const { stats } of matchRows) {
    const scorers = (stats.goalScorers as GoalScorerJson[] | null) ?? [];
    for (const s of scorers) {
      const key = `${s.name}:${s.team ?? ""}`;
      const cur = agg.get(key) ?? {
        playerName: s.name,
        teamName: s.team ?? "",
        athleticsId: null,
        universityId: null,
        logoUrl: null,
        total: 0,
        rank: 0,
      };
      cur.total += s.goals;
      agg.set(key, cur);
    }
  }

  return enrichScorers([...agg.values()], limit);
}

export async function getTopPointScorers(
  sportSlug: SportSlug,
  series: SeriesLetter,
  limit = 10
): Promise<ScorerEntry[]> {
  if (sportSlug !== "basquete") return [];

  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return [];

  const matchRows = await db
    .select({ match: matches, stats: matchStats })
    .from(matches)
    .innerJoin(matchStats, eq(matchStats.matchId, matches.id))
    .where(
      and(
        eq(matches.sportId, sport.id),
        eq(matches.series, series),
        eq(matches.status, "finished")
      )
    );

  const agg = new Map<string, ScorerEntry>();

  for (const { stats } of matchRows) {
    const scorers = (stats.topScorers as TopScorerJson[] | null) ?? [];
    for (const s of scorers) {
      const key = `${s.name}:${s.team ?? ""}`;
      const cur = agg.get(key) ?? {
        playerName: s.name,
        teamName: s.team ?? "",
        athleticsId: null,
        universityId: null,
        logoUrl: null,
        total: 0,
        rank: 0,
      };
      cur.total += s.points;
      agg.set(key, cur);
    }
  }

  return enrichScorers([...agg.values()], limit);
}

async function enrichScorers(
  entries: ScorerEntry[],
  limit: number
): Promise<ScorerEntry[]> {
  if (entries.length === 0) return [];

  const db = requireDb();
  const teamNames = [...new Set(entries.map((e) => e.teamName).filter(Boolean))];

  const athRows = teamNames.length
    ? await db.select().from(athletics).where(inArray(athletics.name, teamNames))
    : [];

  const athByName = new Map(athRows.map((a) => [a.name, a]));
  const uniIds = [...new Set(athRows.map((a) => a.universityId))];
  const uniRows = uniIds.length
    ? await db.select().from(universities).where(inArray(universities.id, uniIds))
    : [];
  const uniMap = new Map(uniRows.map((u) => [u.id, u]));

  return entries
    .map((e) => {
      const ath = athByName.get(e.teamName);
      const uni = ath ? uniMap.get(ath.universityId) : null;
      return {
        ...e,
        athleticsId: ath?.id ?? null,
        universityId: ath?.universityId ?? null,
        logoUrl: ath?.logoUrl ?? uni?.logoUrl ?? null,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
