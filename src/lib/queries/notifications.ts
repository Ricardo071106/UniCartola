import { requireDb } from "@/lib/db";
import { notifications } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";

export async function getUserNotifications(userId: string, limit = 20) {
  const db = requireDb();
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(limit);
}
