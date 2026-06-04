import { integer, jsonb, pgTable, text, timestamp, uuid, varchar, index } from "drizzle-orm/pg-core";

export const matchesImportQueue = pgTable(
  "matches_import_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: varchar("source", { length: 64 }).notNull(),
    externalKey: varchar("external_key", { length: 255 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    index("matches_import_queue_status_idx").on(t.status),
    index("matches_import_queue_external_idx").on(t.externalKey),
  ]
);

export const statisticsImportQueue = pgTable(
  "statistics_import_queue",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    source: varchar("source", { length: 64 }).notNull(),
    matchExternalKey: varchar("match_external_key", { length: 255 }).notNull(),
    payload: jsonb("payload").notNull(),
    status: varchar("status", { length: 32 }).default("pending").notNull(),
    attempts: integer("attempts").default(0).notNull(),
    lastError: text("last_error"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    processedAt: timestamp("processed_at", { withTimezone: true }),
  },
  (t) => [
    index("statistics_import_queue_status_idx").on(t.status),
    index("statistics_import_queue_match_idx").on(t.matchExternalKey),
  ]
);
