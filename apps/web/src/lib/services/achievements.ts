import { db } from "@/lib/db";
import {
  achievements,
  userAchievements,
  matchPredictions,
  matches,
  leaderboardSnapshots,
  userProfiles,
} from "@unicartola/db/schema";
import { eq, and, desc } from "drizzle-orm";
import { scoreMatchPrediction } from "@/lib/scoring/match";

async function grantAchievement(userId: string, code: string) {
  const [ach] = await db
    .select()
    .from(achievements)
    .where(eq(achievements.code, code))
    .limit(1);
  if (!ach) return;

  await db
    .insert(userAchievements)
    .values({ userId, achievementId: ach.id })
    .onConflictDoNothing({
      target: [userAchievements.userId, userAchievements.achievementId],
    });
}

export async function evaluateAchievementsForUser(userId: string, competitionId: string) {
  const profile = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);

  const preds = await db
    .select({
      prediction: matchPredictions,
      match: matches,
    })
    .from(matchPredictions)
    .innerJoin(matches, eq(matchPredictions.matchId, matches.id))
    .where(
      and(
        eq(matchPredictions.userId, userId),
        eq(matches.competitionId, competitionId),
        eq(matches.status, "finished")
      )
    )
    .orderBy(desc(matches.scheduledAt));

  let streak = 0;
  for (const { prediction, match } of preds) {
    if (match.homeScore == null || match.awayScore == null) break;
    const { points } = scoreMatchPrediction(
      {
        outcome: prediction.outcome,
        homeScore: prediction.homeScore,
        awayScore: prediction.awayScore,
      },
      { homeScore: match.homeScore, awayScore: match.awayScore }
    );
    if (points >= 3) streak++;
    else break;
  }
  if (streak >= 10) await grantAchievement(userId, "streak_10");

  if (profile[0]) {
    const [schoolEntry] = await db
      .select()
      .from(leaderboardSnapshots)
      .where(
        and(
          eq(leaderboardSnapshots.userId, userId),
          eq(leaderboardSnapshots.scope, "school"),
          eq(leaderboardSnapshots.scopeId, profile[0].schoolId),
          eq(leaderboardSnapshots.competitionId, competitionId)
        )
      )
      .limit(1);

    if (schoolEntry?.rank && schoolEntry.rank <= 10) {
      await grantAchievement(userId, "school_top_10");
    }
  }

  const [globalEntry] = await db
    .select()
    .from(leaderboardSnapshots)
    .where(
      and(
        eq(leaderboardSnapshots.userId, userId),
        eq(leaderboardSnapshots.scope, "global"),
        eq(leaderboardSnapshots.competitionId, competitionId)
      )
    )
    .limit(1);

  if (globalEntry?.rank === 1) {
    await grantAchievement(userId, "weekly_top");
  }
}

export async function evaluateAllAchievements(competitionId: string) {
  const users = await db.select({ id: userProfiles.id }).from(userProfiles);
  for (const { id } of users) {
    await evaluateAchievementsForUser(id, competitionId);
  }
}
