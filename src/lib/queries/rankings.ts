import { requireDb } from "@/lib/db";
import { users, universities } from "@/lib/db/schema";
import { eq, desc, and, sql } from "drizzle-orm";
import type { LeaderboardEntry, UniversityRankingEntry, RankingTab } from "@/types";

export async function getWeeklyLeaderboard(limit = 10): Promise<LeaderboardEntry[]> {
  const db = requireDb();
  const rows = await db
    .select({
      userId: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      points: users.weeklyPoints,
      universityShortName: universities.shortName,
    })
    .from(users)
    .leftJoin(universities, eq(users.universityId, universities.id))
    .where(eq(users.onboardingComplete, true))
    .orderBy(desc(users.weeklyPoints))
    .limit(limit);

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    nickname: r.nickname,
    avatarUrl: r.avatarUrl,
    points: r.points,
    universityShortName: r.universityShortName ?? undefined,
  }));
}

export async function getGeneralLeaderboard(
  limit = 50,
  filters?: {
    universityId?: string;
    courseId?: string;
    athleticsId?: string;
    weekly?: boolean;
  }
): Promise<LeaderboardEntry[]> {
  const db = requireDb();
  const conditions = [eq(users.onboardingComplete, true)];

  if (filters?.universityId) {
    conditions.push(eq(users.universityId, filters.universityId));
  }
  if (filters?.courseId) {
    conditions.push(eq(users.courseId, filters.courseId));
  }
  if (filters?.athleticsId) {
    conditions.push(eq(users.athleticsId, filters.athleticsId));
  }

  const orderCol = filters?.weekly ? users.weeklyPoints : users.totalPoints;

  const rows = await db
    .select({
      userId: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      points: orderCol,
      universityShortName: universities.shortName,
    })
    .from(users)
    .leftJoin(universities, eq(users.universityId, universities.id))
    .where(and(...conditions))
    .orderBy(desc(orderCol))
    .limit(limit);

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    nickname: r.nickname,
    avatarUrl: r.avatarUrl,
    points: r.points ?? 0,
    universityShortName: r.universityShortName ?? undefined,
  }));
}

export async function getUniversityRankings(
  limit = 20
): Promise<UniversityRankingEntry[]> {
  const db = requireDb();
  const rows = await db
    .select()
    .from(universities)
    .orderBy(desc(universities.totalPoints))
    .limit(limit);

  return rows.map((u, i) => ({
    rank: i + 1,
    universityId: u.id,
    name: u.name,
    shortName: u.shortName,
    totalPoints: u.totalPoints,
  }));
}

export async function getStreakHighlights(limit = 5): Promise<LeaderboardEntry[]> {
  const db = requireDb();
  const rows = await db
    .select({
      userId: users.id,
      nickname: users.nickname,
      avatarUrl: users.avatarUrl,
      points: users.currentStreak,
      universityShortName: universities.shortName,
    })
    .from(users)
    .where(and(eq(users.onboardingComplete, true), sql`${users.currentStreak} >= 3`))
    .orderBy(desc(users.currentStreak))
    .limit(limit);

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.userId,
    nickname: r.nickname,
    avatarUrl: r.avatarUrl,
    points: r.points,
    universityShortName: r.universityShortName ?? undefined,
  }));
}

export async function getRankingByTab(
  tab: RankingTab,
  userContext?: {
    universityId?: string | null;
    courseId?: string | null;
    athleticsId?: string | null;
  }
): Promise<LeaderboardEntry[]> {
  switch (tab) {
    case "weekly":
      return getGeneralLeaderboard(50, { weekly: true });
    case "university":
      return getGeneralLeaderboard(50, {
        universityId: userContext?.universityId ?? undefined,
      });
    case "course":
      return getGeneralLeaderboard(50, {
        courseId: userContext?.courseId ?? undefined,
      });
    case "athletics":
      return getGeneralLeaderboard(50, {
        athleticsId: userContext?.athleticsId ?? undefined,
      });
    case "historical":
    case "general":
    default:
      return getGeneralLeaderboard(50);
  }
}

export async function getUserRank(
  userId: string,
  scope: "general" | "university" | "weekly" = "general"
): Promise<number> {
  const db = requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return 0;

  const points =
    scope === "weekly" ? user.weeklyPoints : user.totalPoints;

  const conditions = [eq(users.onboardingComplete, true)];
  if (scope === "university" && user.universityId) {
    conditions.push(eq(users.universityId, user.universityId));
  }

  const orderCol = scope === "weekly" ? users.weeklyPoints : users.totalPoints;

  const above = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(
      and(...conditions, sql`${orderCol} > ${points}`)
    );

  return (above[0]?.count ?? 0) + 1;
}
