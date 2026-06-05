import {
  boolean,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { matchStatusEnum } from "./enums";
import { schools, athletics } from "./taxonomy";

export const competitions = pgTable("competitions", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 255 }).notNull().unique(),
  season: varchar("season", { length: 32 }).notNull(),
  semester: varchar("semester", { length: 16 }),
  isActive: boolean("is_active").default(true).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const modalities = pgTable(
  "modalities",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitionId: uuid("competition_id")
      .references(() => competitions.id)
      .notNull(),
    name: varchar("name", { length: 128 }).notNull(),
    slug: varchar("slug", { length: 128 }).notNull(),
    gender: varchar("gender", { length: 16 }),
    isMvpEnabled: boolean("is_mvp_enabled").default(true).notNull(),
    nduUrl: text("ndu_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("modalities_comp_slug_idx").on(t.competitionId, t.slug),
    index("modalities_comp_idx").on(t.competitionId),
  ]
);

export const teams = pgTable(
  "teams",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
    schoolId: uuid("school_id").references(() => schools.id),
    athleticId: uuid("athletic_id").references(() => athletics.id),
    nduAlias: varchar("ndu_alias", { length: 255 }),
    needsReview: boolean("needs_review").default(false).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    index("teams_normalized_idx").on(t.normalizedName),
    index("teams_school_idx").on(t.schoolId),
  ]
);

export const matches = pgTable(
  "matches",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitionId: uuid("competition_id")
      .references(() => competitions.id)
      .notNull(),
    modalityId: uuid("modality_id")
      .references(() => modalities.id)
      .notNull(),
    homeTeamId: uuid("home_team_id")
      .references(() => teams.id)
      .notNull(),
    awayTeamId: uuid("away_team_id")
      .references(() => teams.id)
      .notNull(),
    series: varchar("series", { length: 8 }),
    groupName: varchar("group_name", { length: 8 }),
    scheduledAt: timestamp("scheduled_at", { withTimezone: true }),
    status: matchStatusEnum("status").default("scheduled").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    venue: varchar("venue", { length: 255 }),
    predictionsOpen: boolean("predictions_open").default(true).notNull(),
    sourceHash: varchar("source_hash", { length: 64 }),
    externalKey: varchar("external_key", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("matches_external_key_idx").on(t.externalKey),
    index("matches_comp_idx").on(t.competitionId),
    index("matches_modality_idx").on(t.modalityId),
    index("matches_status_idx").on(t.status),
    index("matches_scheduled_idx").on(t.scheduledAt),
  ]
);

export const players = pgTable(
  "players",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    name: varchar("name", { length: 255 }).notNull(),
    normalizedName: varchar("normalized_name", { length: 255 }).notNull(),
    teamId: uuid("team_id").references(() => teams.id),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [index("players_normalized_idx").on(t.normalizedName)]
);
