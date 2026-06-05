import { requireDb } from "@/lib/db";
import { predictions } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";

export async function getUserPredictionForMatch(
  userId: string,
  matchId: string
) {
  const db = requireDb();
  const [row] = await db
    .select()
    .from(predictions)
    .where(
      and(eq(predictions.userId, userId), eq(predictions.matchId, matchId))
    )
    .limit(1);
  return row ?? null;
}
