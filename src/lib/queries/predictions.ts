import { requireDb } from "@/lib/db";
import { predictions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { CurrencyMode } from "@/lib/currency/mode";

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
