import {
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
  varchar,
  index,
  uniqueIndex,
} from "drizzle-orm/pg-core";
import { predictionOutcomeEnum, pointsSourceEnum, statMarketStatusEnum } from "./enums";
import { matches } from "./competition";
import { competitions, modalities } from "./competition";
import { userProfiles } from "./users";
import { players } from "./competition";

export const matchPredictions = pgTable(
  "match_predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userProfiles.id)
      .notNull(),
    matchId: uuid("match_id")
      .references(() => matches.id)
      .notNull(),
    outcome: predictionOutcomeEnum("outcome").notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
    lockedAt: timestamp("locked_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("match_predictions_user_match_idx").on(t.userId, t.matchId),
    index("match_predictions_user_idx").on(t.userId),
    index("match_predictions_match_idx").on(t.matchId),
  ]
);

export const statMarkets = pgTable(
  "stat_markets",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    competitionId: uuid("competition_id")
      .references(() => competitions.id)
      .notNull(),
    modalityId: uuid("modality_id").references(() => modalities.id),
    title: varchar("title", { length: 255 }).notNull(),
    slug: varchar("slug", { length: 255 }).notNull(),
    marketType: varchar("market_type", { length: 64 }).notNull(),
    status: statMarketStatusEnum("status").default("open").notNull(),
    pointsOnCorrect: integer("points_on_correct").default(15).notNull(),
    closesAt: timestamp("closes_at", { withTimezone: true }),
    resolvedPlayerId: uuid("resolved_player_id").references(() => players.id),
    resolvedPlayerName: varchar("resolved_player_name", { length: 255 }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("stat_markets_slug_idx").on(t.competitionId, t.slug),
    index("stat_markets_status_idx").on(t.status),
  ]
);

export const statPredictions = pgTable(
  "stat_predictions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userProfiles.id)
      .notNull(),
    marketId: uuid("market_id")
      .references(() => statMarkets.id)
      .notNull(),
    playerId: uuid("player_id").references(() => players.id),
    playerName: varchar("player_name", { length: 255 }).notNull(),
    normalizedPlayerName: varchar("normalized_player_name", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("stat_predictions_user_market_idx").on(t.userId, t.marketId),
    index("stat_predictions_market_idx").on(t.marketId),
  ]
);

export const pointsLedger = pgTable(
  "points_ledger",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .references(() => userProfiles.id)
      .notNull(),
    competitionId: uuid("competition_id")
      .references(() => competitions.id)
      .notNull(),
    source: pointsSourceEnum("source").notNull(),
    points: integer("points").notNull(),
    matchPredictionId: uuid("match_prediction_id").references(() => matchPredictions.id),
    statPredictionId: uuid("stat_prediction_id").references(() => statPredictions.id),
    matchId: uuid("match_id").references(() => matches.id),
    description: text("description"),
    idempotencyKey: varchar("idempotency_key", { length: 255 }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (t) => [
    uniqueIndex("points_ledger_idempotency_idx").on(t.idempotencyKey),
    index("points_ledger_user_idx").on(t.userId),
    index("points_ledger_comp_idx").on(t.competitionId),
  ]
);
