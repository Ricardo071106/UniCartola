import { MATCH_PREDICTION_POINTS } from "./scoring-config";
import type { predictionResultEnum } from "./db/schema";

export type PredictionResult = (typeof predictionResultEnum.enumValues)[number];

export interface PredictionInput {
  result: PredictionResult;
  homeScore?: number | null;
  awayScore?: number | null;
  homeFouls?: number | null;
  awayFouls?: number | null;
  homeCards?: number | null;
  awayCards?: number | null;
}

export interface MatchActuals {
  homeScore: number;
  awayScore: number;
  homeFouls?: number | null;
  awayFouls?: number | null;
  homeCards?: number | null;
  awayCards?: number | null;
}

export interface PointsBreakdown {
  result: number;
  exactScore: number;
  homeFouls: number;
  awayFouls: number;
  homeCards: number;
  awayCards: number;
  total: number;
}

export function getActualResult(
  homeScore: number,
  awayScore: number
): PredictionResult {
  if (homeScore > awayScore) return "home";
  if (homeScore < awayScore) return "away";
  return "draw";
}

export function calculatePredictionPoints(
  prediction: PredictionInput,
  actual: MatchActuals
): PointsBreakdown {
  const actualResult = getActualResult(actual.homeScore, actual.awayScore);
  const breakdown: PointsBreakdown = {
    result: 0,
    exactScore: 0,
    homeFouls: 0,
    awayFouls: 0,
    homeCards: 0,
    awayCards: 0,
    total: 0,
  };

  if (prediction.result === actualResult) {
    breakdown.result = MATCH_PREDICTION_POINTS.result;
  }

  const hasExactScore =
    prediction.homeScore != null &&
    prediction.awayScore != null &&
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore;

  if (hasExactScore) {
    breakdown.exactScore = MATCH_PREDICTION_POINTS.exactScore;
  }

  if (
    prediction.homeFouls != null &&
    actual.homeFouls != null &&
    prediction.homeFouls === actual.homeFouls
  ) {
    breakdown.homeFouls = MATCH_PREDICTION_POINTS.homeFouls;
  }

  if (
    prediction.awayFouls != null &&
    actual.awayFouls != null &&
    prediction.awayFouls === actual.awayFouls
  ) {
    breakdown.awayFouls = MATCH_PREDICTION_POINTS.awayFouls;
  }

  if (
    prediction.homeCards != null &&
    actual.homeCards != null &&
    prediction.homeCards === actual.homeCards
  ) {
    breakdown.homeCards = MATCH_PREDICTION_POINTS.homeCards;
  }

  if (
    prediction.awayCards != null &&
    actual.awayCards != null &&
    prediction.awayCards === actual.awayCards
  ) {
    breakdown.awayCards = MATCH_PREDICTION_POINTS.awayCards;
  }

  breakdown.total =
    breakdown.result +
    breakdown.exactScore +
    breakdown.homeFouls +
    breakdown.awayFouls +
    breakdown.homeCards +
    breakdown.awayCards;

  return breakdown;
}
