import { requireDb } from "@/lib/db";
import {
  predictions,
  matches,
  matchStats,
  users,
} from "@/lib/db/schema";
import { and, eq, inArray } from "drizzle-orm";
import { calculatePredictionPoints } from "@/lib/scoring";

export async function scoreFinishedMatchPredictions(matchIds?: string[]) {
  const db = requireDb();

  const finishedMatches = await db
    .select({ match: matches, stats: matchStats })
    .from(matches)
    .leftJoin(matchStats, eq(matchStats.matchId, matches.id))
    .where(
      matchIds?.length
        ? and(
            eq(matches.status, "finished"),
            inArray(matches.id, matchIds)
          )
        : eq(matches.status, "finished")
    );

  if (finishedMatches.length === 0) return 0;

  const ids = finishedMatches.map((r) => r.match.id);
  const unscored = await db
    .select()
    .from(predictions)
    .where(
      and(
        inArray(predictions.matchId, ids),
        eq(predictions.isScored, false)
      )
    );

  let scored = 0;

  for (const pred of unscored) {
    const row = finishedMatches.find((m) => m.match.id === pred.matchId);
    if (!row) continue;

    const homeScore = row.match.homeScore;
    const awayScore = row.match.awayScore;
    if (homeScore == null || awayScore == null) continue;

    const stats = row.stats;
    const homeCards =
      stats != null
        ? (stats.yellowCardsHome ?? 0) + (stats.redCardsHome ?? 0)
        : null;
    const awayCards =
      stats != null
        ? (stats.yellowCardsAway ?? 0) + (stats.redCardsAway ?? 0)
        : null;

    const breakdown = calculatePredictionPoints(pred, {
      homeScore,
      awayScore,
      homeCards,
      awayCards,
    });

    await db
      .update(predictions)
      .set({
        pointsEarned: breakdown.total,
        isScored: true,
      })
      .where(eq(predictions.id, pred.id));

    if (breakdown.total > 0) {
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, pred.userId))
        .limit(1);
      if (user) {
        await db
          .update(users)
          .set({
            totalPoints: user.totalPoints + breakdown.total,
            weeklyPoints: user.weeklyPoints + breakdown.total,
            correctPredictions:
              user.correctPredictions + (breakdown.total > 0 ? 1 : 0),
          })
          .where(eq(users.id, pred.userId));
      }
    }

    scored++;
  }

  return scored;
}
