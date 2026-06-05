import type { PredictionResult } from "@/types";

export type { PredictionResult };

export interface PredictionInput {
  result: PredictionResult;
  homeScore?: number | null;
  awayScore?: number | null;
}

export interface MatchResult {
  homeScore: number;
  awayScore: number;
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
  actual: MatchResult
): number {
  const actualResult = getActualResult(actual.homeScore, actual.awayScore);
  const resultCorrect = prediction.result === actualResult;

  const hasExactScore =
    prediction.homeScore != null &&
    prediction.awayScore != null &&
    prediction.homeScore === actual.homeScore &&
    prediction.awayScore === actual.awayScore;

  if (resultCorrect && hasExactScore) return 8;
  if (hasExactScore) return 5;
  if (resultCorrect) return 3;
  return 0;
}
