import { getDb } from "@/lib/db";
import {
  pointsLedger,
  userProfiles,
  leaderboardSnapshots,
  competitions,
} from "@unicartola/db/schema";
import { eq, sql, desc, and, isNull } from "drizzle-orm";

type Scope = "global" | "school" | "course" | "athletic";

export async function refreshLeaderboards(competitionId: string) {
  const db = await getDb();
  const totals = await db
    .select({
      userId: pointsLedger.userId,
      matchPoints: sql<number>`coalesce(sum(case when ${pointsLedger.source} = 'match_prediction' then ${pointsLedger.points} else 0 end), 0)`,
      statPoints: sql<number>`coalesce(sum(case when ${pointsLedger.source} = 'stat_prediction' then ${pointsLedger.points} else 0 end), 0)`,
      totalPoints: sql<number>`coalesce(sum(${pointsLedger.points}), 0)`,
    })
    .from(pointsLedger)
    .where(eq(pointsLedger.competitionId, competitionId))
    .groupBy(pointsLedger.userId);

  const profiles = await db.select().from(userProfiles);
  const profileMap = Object.fromEntries(profiles.map((p) => [p.id, p]));

  await db
    .delete(leaderboardSnapshots)
    .where(eq(leaderboardSnapshots.competitionId, competitionId));

  const entries: (typeof leaderboardSnapshots.$inferInsert)[] = [];

  for (const t of totals) {
    const profile = profileMap[t.userId];
    if (!profile) continue;

    const base = {
      competitionId,
      userId: t.userId,
      matchPoints: Number(t.matchPoints),
      statPoints: Number(t.statPoints),
      totalPoints: Number(t.totalPoints),
      predictionsCount: 0,
      correctPredictions: 0,
      updatedAt: new Date(),
    };

    entries.push({ ...base, scope: "global", scopeId: null });
    entries.push({ ...base, scope: "school", scopeId: profile.schoolId });
    entries.push({ ...base, scope: "course", scopeId: profile.courseId });
    entries.push({ ...base, scope: "athletic", scopeId: profile.athleticId });
  }

  if (entries.length) {
    await db.insert(leaderboardSnapshots).values(entries);
  }

  const scopes: Scope[] = ["global", "school", "course", "athletic"];
  for (const scope of scopes) {
    const scopeEntries = await db
      .select()
      .from(leaderboardSnapshots)
      .where(
        and(
          eq(leaderboardSnapshots.competitionId, competitionId),
          eq(leaderboardSnapshots.scope, scope)
        )
      )
      .orderBy(desc(leaderboardSnapshots.totalPoints));

    const grouped = new Map<string | null, typeof scopeEntries>();
    for (const e of scopeEntries) {
      const key = scope === "global" ? null : e.scopeId;
      if (!grouped.has(key)) grouped.set(key, []);
      grouped.get(key)!.push(e);
    }

    for (const [, group] of grouped) {
      let rank = 1;
      for (const entry of group) {
        await db
          .update(leaderboardSnapshots)
          .set({ rank })
          .where(eq(leaderboardSnapshots.id, entry.id));
        rank++;
      }
    }
  }
}

export async function getLeaderboard(
  competitionId: string,
  scope: Scope,
  scopeId?: string | null,
  limit = 50
) {
  const db = await getDb();
  const conditions = [
    eq(leaderboardSnapshots.competitionId, competitionId),
    eq(leaderboardSnapshots.scope, scope),
  ];

  if (scope === "global") {
    conditions.push(isNull(leaderboardSnapshots.scopeId));
  } else if (scopeId) {
    conditions.push(eq(leaderboardSnapshots.scopeId, scopeId));
  }

  return db
    .select({
      rank: leaderboardSnapshots.rank,
      totalPoints: leaderboardSnapshots.totalPoints,
      matchPoints: leaderboardSnapshots.matchPoints,
      statPoints: leaderboardSnapshots.statPoints,
      userId: leaderboardSnapshots.userId,
      displayName: userProfiles.displayName,
      schoolId: userProfiles.schoolId,
    })
    .from(leaderboardSnapshots)
    .innerJoin(userProfiles, eq(leaderboardSnapshots.userId, userProfiles.id))
    .where(and(...conditions))
    .orderBy(desc(leaderboardSnapshots.totalPoints))
    .limit(limit);
}

export async function getActiveCompetition() {
  const db = await getDb();
  const [comp] = await db
    .select()
    .from(competitions)
    .where(eq(competitions.isActive, true))
    .limit(1);
  return comp ?? null;
}
