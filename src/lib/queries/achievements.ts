import { requireDb } from "@/lib/db";
import { achievements, userAchievements } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { AchievementItem } from "@/types";

export async function getUserAchievements(
  userId: string
): Promise<AchievementItem[]> {
  const db = requireDb();
  const all = await db.select().from(achievements);
  const earned = await db
    .select()
    .from(userAchievements)
    .where(eq(userAchievements.userId, userId));

  const earnedMap = new Map(
    earned.map((e) => [e.achievementId, e.earnedAt])
  );

  return all.map((a) => ({
    id: a.id,
    slug: a.slug,
    name: a.name,
    description: a.description,
    icon: a.icon,
    earned: earnedMap.has(a.id),
    earnedAt: earnedMap.get(a.id) ?? null,
  }));
}
