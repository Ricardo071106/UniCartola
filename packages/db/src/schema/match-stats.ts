import { integer, jsonb, pgTable, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { matches } from "./competition";

export const matchStats = pgTable(
  "match_stats",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    matchId: uuid("match_id")
      .references(() => matches.id, { onDelete: "cascade" })
      .notNull(),
    goals: jsonb("goals"),
    assists: jsonb("assists"),
    cards: jsonb("cards"),
    topScorers: jsonb("top_scorers"),
    extra: jsonb("extra"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("match_stats_match_idx").on(t.matchId)]
);
