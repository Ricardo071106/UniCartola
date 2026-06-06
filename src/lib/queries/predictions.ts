import { requireDb } from "@/lib/db";
import { predictions, matches, sports } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { CurrencyMode } from "@/lib/currency/mode";
import type { PalpitesSportFilter } from "./standings";
import { enrichMatches } from "./matches";
import type { MatchPredictionView } from "@/types";

export async function getUserPredictionForMatch(
  userId: string,
  matchId: string,
  currencyMode: CurrencyMode = "play"
) {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, userId),
        eq(predictions.matchId, matchId),
        eq(predictions.currencyMode, currencyMode)
      )
    )
    .limit(1);
  return row ?? null;
}

export async function getUserPredictionsForMatches(
  userId: string,
  matchIds: string[],
  currencyMode: CurrencyMode
) {
  if (matchIds.length === 0) return new Map<string, (typeof predictions.$inferSelect)>();
  const db = requireDb();
  const rows = await db
    .select()
    .from(predictions)
    .where(
      and(
        eq(predictions.userId, userId),
        eq(predictions.currencyMode, currencyMode)
      )
    );
  const map = new Map<string, (typeof predictions.$inferSelect)>();
  for (const row of rows) {
    if (matchIds.includes(row.matchId)) map.set(row.matchId, row);
  }
  return map;
}

export function predictionToView(
  row: typeof predictions.$inferSelect
): MatchPredictionView {
  return {
    result: row.result,
    homeScore: row.homeScore,
    awayScore: row.awayScore,
    homeFouls: row.homeFouls,
    awayFouls: row.awayFouls,
    homeCards: row.homeCards,
    awayCards: row.awayCards,
  };
}

export async function getUserSavedMatchPredictions(
  userId: string,
  sportSlug: PalpitesSportFilter,
  series: string,
  currencyMode: CurrencyMode
) {
  const db = requireDb();

  let sportId: string | null = null;
  if (sportSlug !== "all") {
    const [sportRow] = await db
      .select()
      .from(sports)
      .where(eq(sports.slug, sportSlug))
      .limit(1);
    if (!sportRow) return [];
    sportId = sportRow.id;
  }

  const conditions = [
    eq(predictions.userId, userId),
    eq(predictions.currencyMode, currencyMode),
    eq(matches.series, series.trim().toUpperCase()),
  ];
  if (sportId) conditions.push(eq(matches.sportId, sportId));

  const rows = await db
    .select({ prediction: predictions, match: matches })
    .from(predictions)
    .innerJoin(matches, eq(predictions.matchId, matches.id))
    .where(and(...conditions));

  if (rows.length === 0) return [];

  const enriched = await enrichMatches(rows.map((r) => r.match));
  const matchMap = new Map(enriched.map((m) => [m.id, m]));

  return rows
    .map((r) => {
      const match = matchMap.get(r.match.id);
      if (!match) return null;
      return {
        match,
        prediction: predictionToView(r.prediction),
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        a!.match.scheduledAt.getTime() - b!.match.scheduledAt.getTime()
    ) as { match: (typeof enriched)[0]; prediction: MatchPredictionView }[];
}
