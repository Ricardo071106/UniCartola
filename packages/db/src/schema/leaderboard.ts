import { integer, pgTable, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { leaderboardScopeEnum } from "./enums";
import { competitions } from "./competition";
import { userProfiles } from "./users";

export const leaderboardSnapshots = pgTable(
  "leaderboard_snapshots",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitionId: uuid("competition_id")
      .references(() => competitions.id)
      .notNull(),
    userId: uuid("user_id")
      .references(() => userProfiles.id)
      .notNull(),
    scope: leaderboardScopeEnum("scope").notNull(),
    scopeId: uuid("scope_id"),
    matchPoints: integer("match_points").default(0).notNull(),
    statPoints: integer("stat_points").default(0).notNull(),
    totalPoints: integer("total_points").default(0).notNull(),
    rank: integer("rank"),
    predictionsCount: integer("predictions_count").default(0).notNull(),
    correctPredictions: integer("correct_predictions").default(0).notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("leaderboard_comp_scope_idx").on(t.competitionId, t.scope, t.scopeId),
    index("leaderboard_user_idx").on(t.userId),
    index("leaderboard_rank_idx").on(t.competitionId, t.scope, t.totalPoints),
  ]
);
