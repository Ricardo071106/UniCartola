import { jsonb, pgTable, text, timestamp, uuid, varchar, index, uniqueIndex } from "drizzle-orm/pg-core";
import { userProfiles } from "./users";

export const achievements = pgTable("achievements", {
  id: uuid("id").primaryKey().defaultRandom(),
  code: varchar("code", { length: 64 }).notNull().unique(),
  title: varchar("title", { length: 128 }).notNull(),
  description: text("description").notNull(),
  icon: varchar("icon", { length: 32 }).default("trophy").notNull(),
  ruleConfig: jsonb("rule_config"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const userAchievements = pgTable(
  "user_achievements",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userProfiles.id)
      .notNull(),
    achievementId: uuid("achievement_id")
      .references(() => achievements.id)
      .notNull(),
    earnedAt: timestamp("earned_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("user_achievements_user_achievement_idx").on(t.userId, t.achievementId),
    index("user_achievements_user_idx").on(t.userId),
  ]
);
