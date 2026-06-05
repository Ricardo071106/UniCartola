import { requireDb } from "@/lib/db";
import { users, universities, courses, athletics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { UserProfile } from "@/types";
import { getUserRank } from "./rankings";

export async function getUserProfile(userId: string): Promise<UserProfile | null> {
  const db = requireDb();
  const rows = await db
    .select({
      user: users,
      university: universities,
      course: courses,
      athletics: athletics,
    })
    .from(users)
    .leftJoin(universities, eq(users.universityId, universities.id))
    .leftJoin(courses, eq(users.courseId, courses.id))
    .leftJoin(athletics, eq(users.athleticsId, athletics.id))
    .where(eq(users.id, userId))
    .limit(1);

  if (!rows.length) return null;
  const row = rows[0];

  const [generalRank, universityRank] = await Promise.all([
    getUserRank(userId, "general"),
    getUserRank(userId, "university"),
  ]);

  return {
    id: row.user.id,
    nickname: row.user.nickname,
    avatarUrl: row.user.avatarUrl,
    totalPoints: row.user.totalPoints,
    weeklyPoints: row.user.weeklyPoints,
    correctPredictions: row.user.correctPredictions,
    totalPredictions: row.user.totalPredictions,
    currentStreak: row.user.currentStreak,
    university: row.university
      ? { name: row.university.name, shortName: row.university.shortName }
      : null,
    course: row.course ? { name: row.course.name } : null,
    athletics: row.athletics ? { name: row.athletics.name } : null,
    generalRank,
    universityRank,
  };
}

export async function getUserById(userId: string) {
  const db = requireDb();
  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  return user ?? null;
}
