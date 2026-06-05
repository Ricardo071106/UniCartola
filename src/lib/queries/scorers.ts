import { requireDb } from "@/lib/db";
import {
  matches,
  matchStats,
  sports,
  athletics,
  universities,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { normalizeTeamName } from "@/lib/ndu/normalize";
import type { ScorerEntry, SportSlug } from "@/types";
import type { SeriesLetter } from "./standings";

type GoalScorerJson = {
  name: string;
  team?: string;
  teamLogoUrl?: string;
  goals: number;
};
type TopScorerJson = {
  name: string;
  team?: string;
  teamLogoUrl?: string;
  points: number;
};

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
        logoUrl: s.teamLogoUrl ?? null,
        total: 0,
        rank: 0,
      };
      if (!cur.logoUrl && s.teamLogoUrl) cur.logoUrl = s.teamLogoUrl;
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
        logoUrl: s.teamLogoUrl ?? null,
        total: 0,
        rank: 0,
      };
      if (!cur.logoUrl && s.teamLogoUrl) cur.logoUrl = s.teamLogoUrl;
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

  const allAthletics = await db.select().from(athletics);

  const athByName = new Map<string, (typeof allAthletics)[number]>();
  for (const name of teamNames) {
    const norm = normalizeTeamName(name);
    const match =
      allAthletics.find((a) => a.name === name) ??
      allAthletics.find((a) => a.normalizedName === norm) ??
      allAthletics.find(
        (a) => a.nduAlias && normalizeTeamName(a.nduAlias) === norm
      );
    if (match) athByName.set(name, match);
  }
  const uniIds = [...new Set([...athByName.values()].map((a) => a.universityId))];
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
        logoUrl: e.logoUrl ?? ath?.logoUrl ?? uni?.logoUrl ?? null,
      };
    })
    .sort((a, b) => b.total - a.total)
    .slice(0, limit)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}
