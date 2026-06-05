import { requireDb } from "@/lib/db";
import { athletics, matches, nduScorerStats, sports } from "@/lib/db/schema";
import { and, eq, isNotNull } from "drizzle-orm";
import { realMatchesOnly } from "./match-filters";
import { getStandingsBySeries, type SeriesLetter } from "./standings";
import type { SportSlug } from "@/types";

export type TeamOption = { id: string; name: string };
export type PlayerOption = { name: string; teamName: string };

async function getSeasonYear(): Promise<number> {
  const db = requireDb();
  const { seasons } = await import("@/lib/db/schema");
  const [active] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  return active?.year ?? new Date().getFullYear();
}

export async function getSeriesTeamOptions(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<TeamOption[]> {
  const standings = await getStandingsBySeries(sportSlug, series);
  const fromStandings = standings
    .filter((s) => s.athleticsId && s.teamName.trim())
    .map((s) => ({ id: s.athleticsId!, name: s.teamName.trim() }));

  if (fromStandings.length > 0) {
    const seen = new Set<string>();
    return fromStandings.filter((t) => {
      if (seen.has(t.id)) return false;
      seen.add(t.id);
      return true;
    });
  }

  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return [];

  const matchRows = await db
    .select({
      homeAthleticsId: matches.homeAthleticsId,
      awayAthleticsId: matches.awayAthleticsId,
      homeTeamName: matches.homeTeamName,
      awayTeamName: matches.awayTeamName,
    })
    .from(matches)
    .where(
      and(
        realMatchesOnly(),
        eq(matches.sportId, sport.id),
        eq(matches.series, series)
      )
    );

  const athIds = [
    ...new Set(
      matchRows
        .flatMap((m) => [m.homeAthleticsId, m.awayAthleticsId])
        .filter(Boolean)
    ),
  ] as string[];

  if (athIds.length === 0) return [];

  const allAth = await db
    .select({ id: athletics.id, name: athletics.name, nduAthleticId: athletics.nduAthleticId })
    .from(athletics)
    .where(isNotNull(athletics.nduAthleticId));

  const athMap = new Map(allAth.map((a) => [a.id, a]));
  const teams = new Map<string, string>();

  for (const m of matchRows) {
    for (const [athId, fallbackName] of [
      [m.homeAthleticsId, m.homeTeamName],
      [m.awayAthleticsId, m.awayTeamName],
    ] as const) {
      if (!athId) continue;
      const ath = athMap.get(athId);
      if (!ath?.nduAthleticId) continue;
      const name = (fallbackName?.trim() || ath.name).trim();
      if (name) teams.set(athId, name);
    }
  }

  return [...teams.entries()].map(([id, name]) => ({ id, name }));
}

async function getPlayerOptionsFromStats(
  sportSlug: SportSlug,
  series: SeriesLetter,
  statType: "goals" | "points" | "cards"
): Promise<PlayerOption[]> {
  const db = requireDb();
  const year = await getSeasonYear();

  const rows = await db
    .select()
    .from(nduScorerStats)
    .where(
      and(
        eq(nduScorerStats.sportSlug, sportSlug),
        eq(nduScorerStats.series, series),
        eq(nduScorerStats.statType, statType),
        eq(nduScorerStats.seasonYear, year)
      )
    );

  const seen = new Set<string>();
  return rows
    .sort((a, b) => b.total - a.total)
    .filter((r) => {
      const key = r.playerName.trim().toLowerCase();
      if (!key || seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => ({
      name: r.playerName.trim(),
      teamName: r.teamName?.trim() ?? "",
    }));
}

export async function getScorerOptions(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayerOption[]> {
  const statType = sportSlug === "basquete" ? "points" : "goals";
  const fromDb = await getPlayerOptionsFromStats(sportSlug, series, statType);
  if (fromDb.length > 0) return fromDb;

  const { fetchNduStatsPlayersLive } = await import("@/lib/ndu/stats-live");
  const live = await fetchNduStatsPlayersLive(sportSlug, series);
  return live.scorers;
}

export async function getCardPlayerOptions(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayerOption[]> {
  if (sportSlug === "basquete") return [];
  const fromDb = await getPlayerOptionsFromStats(sportSlug, series, "cards");
  if (fromDb.length > 0) return fromDb;

  const { fetchNduStatsPlayersLive } = await import("@/lib/ndu/stats-live");
  const live = await fetchNduStatsPlayersLive(sportSlug, series);
  return live.cards;
}
