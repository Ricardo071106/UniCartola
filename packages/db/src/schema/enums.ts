import { pgEnum } from "drizzle-orm/pg-core";

export const matchStatusEnum = pgEnum("match_status", [
  "scheduled",
  "live",
  "finished",
  "postponed",
  "cancelled",
]);

export const predictionOutcomeEnum = pgEnum("prediction_outcome", [
  "home_win",
  "draw",
  "away_win",
]);

export const pointsSourceEnum = pgEnum("points_source", [
  "match_prediction",
  "stat_prediction",
  "bonus",
  "adjustment",
]);

export const leaderboardScopeEnum = pgEnum("leaderboard_scope", [
  "global",
  "school",
  "course",
  "athletic",
]);

export const statMarketStatusEnum = pgEnum("stat_market_status", [
  "open",
  "closed",
  "resolved",
]);

export const scrapeRunStatusEnum = pgEnum("scrape_run_status", [
  "running",
  "success",
  "partial",
  "failed",
]);
