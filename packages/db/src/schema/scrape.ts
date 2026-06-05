import { integer, jsonb, pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";
import { scrapeRunStatusEnum } from "./enums";

export const scrapeRuns = pgTable(
  "scrape_runs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: varchar("source", { length: 64 }).notNull(),
    status: scrapeRunStatusEnum("status").default("running").notNull(),
    matchesCreated: integer("matches_created").default(0).notNull(),
    matchesUpdated: integer("matches_updated").default(0).notNull(),
    errors: jsonb("errors"),
    diff: jsonb("diff"),
    startedAt: timestamp("started_at", { withTimezone: true }).defaultNow().notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
  },
  (t) => [index("scrape_runs_started_idx").on(t.startedAt)]
);

export const teamMappingQueue = pgTable(
  "team_mapping_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    rawName: varchar("raw_name", { length: 255 }).notNull(),
    suggestedTeamId: uuid("suggested_team_id"),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("team_mapping_status_idx").on(t.status)]
);
