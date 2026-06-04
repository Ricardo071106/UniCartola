export type PredictionOutcome = "home_win" | "draw" | "away_win";

export type MatchPredictionInput = {
  outcome: PredictionOutcome;
  homeScore?: number | null;
  awayScore?: number | null;
};

export type MatchResult = {
  homeScore: number;
  awayScore: number;
};

export function getActualOutcome(result: MatchResult): PredictionOutcome {
  if (result.homeScore > result.awayScore) return "home_win";
  if (result.homeScore < result.awayScore) return "away_win";
  return "draw";
}

export function scoreMatchPrediction(
  prediction: MatchPredictionInput,
  result: MatchResult
): { points: number; description: string } {
  const actual = getActualOutcome(result);
  const correctOutcome = prediction.outcome === actual;
  const hasExactScore =
    prediction.homeScore != null &&
    prediction.awayScore != null &&
    prediction.homeScore === result.homeScore &&
    prediction.awayScore === result.awayScore;

  if (correctOutcome && hasExactScore) {
    return { points: 8, description: "Vencedor e placar exato" };
  }
  if (hasExactScore) {
    return { points: 5, description: "Placar exato" };
  }
  if (correctOutcome) {
    return { points: 3, description: "Vencedor correto" };
  }
  return { points: 0, description: "Palpite incorreto" };
}
