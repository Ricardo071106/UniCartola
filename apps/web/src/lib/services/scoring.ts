import { db } from "@/lib/db";
import {
  matches,
  matchPredictions,
  pointsLedger,
  statMarkets,
  statPredictions,
} from "@unicartola/db/schema";
import { eq, and } from "drizzle-orm";
import { scoreMatchPrediction, getActualOutcome } from "@/lib/scoring/match";
import { refreshLeaderboards } from "./leaderboard";

export async function processFinishedMatch(matchId: string) {
  const [match] = await db.select().from(matches).where(eq(matches.id, matchId)).limit(1);
  if (!match || match.status !== "finished") return;
  if (match.homeScore == null || match.awayScore == null) return;

  const predictions = await db
    .select()
    .from(matchPredictions)
    .where(eq(matchPredictions.matchId, matchId));

  const result = { homeScore: match.homeScore, awayScore: match.awayScore };

  for (const pred of predictions) {
    const { points, description } = scoreMatchPrediction(
      {
        outcome: pred.outcome,
        homeScore: pred.homeScore,
        awayScore: pred.awayScore,
      },
      result
    );

    await db
      .delete(pointsLedger)
      .where(
        and(
          eq(pointsLedger.matchPredictionId, pred.id),
          eq(pointsLedger.source, "match_prediction")
        )
      );

    if (points > 0) {
      await db.insert(pointsLedger).values({
        userId: pred.userId,
        competitionId: match.competitionId,
        source: "match_prediction",
        points,
        matchPredictionId: pred.id,
        matchId: match.id,
        description,
        idempotencyKey: `match:${pred.id}`,
      });
    }
  }

  await refreshLeaderboards(match.competitionId);
}

export async function resolveStatMarket(marketId: string) {
  const [market] = await db
    .select()
    .from(statMarkets)
    .where(eq(statMarkets.id, marketId))
    .limit(1);

  if (!market || market.status !== "resolved") return;

  const resolvedName = market.resolvedPlayerName?.toLowerCase().trim();
  if (!resolvedName) return;

  const predictions = await db
    .select()
    .from(statPredictions)
    .where(eq(statPredictions.marketId, marketId));

  for (const pred of predictions) {
    const correct =
      pred.normalizedPlayerName === resolvedName ||
      (market.resolvedPlayerId && pred.playerId === market.resolvedPlayerId);

    await db
      .delete(pointsLedger)
      .where(
        and(
          eq(pointsLedger.statPredictionId, pred.id),
          eq(pointsLedger.source, "stat_prediction")
        )
      );

    if (correct) {
      await db.insert(pointsLedger).values({
        userId: pred.userId,
        competitionId: market.competitionId,
        source: "stat_prediction",
        points: market.pointsOnCorrect,
        statPredictionId: pred.id,
        description: `Acerto: ${market.title}`,
        idempotencyKey: `stat:${pred.id}`,
      });
    }
  }

  await refreshLeaderboards(market.competitionId);
}

export async function processAllFinishedMatches() {
  const finished = await db
    .select()
    .from(matches)
    .where(eq(matches.status, "finished"));

  for (const m of finished) {
    await processFinishedMatch(m.id);
  }
}
