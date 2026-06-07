export type PlayoffScoreExtras = {
  overtimeHome?: number | null;
  overtimeAway?: number | null;
  penaltyHome?: number | null;
  penaltyAway?: number | null;
};

export type PlayoffWinnerSide = "home" | "away" | "draw" | null;

export type PlayoffWinnerResult = {
  winnerSide: PlayoffWinnerSide;
  method?: "regulation" | "overtime" | "penalties";
};

/** Resolve vencedor de mata-mata (regulamentar → prorrogação → pênaltis). */
export function resolvePlayoffWinner(
  homeScore: number | null,
  awayScore: number | null,
  extras: PlayoffScoreExtras = {},
  options: { isPlayoff?: boolean } = {}
): PlayoffWinnerResult {
  if (homeScore == null || awayScore == null) {
    return { winnerSide: null };
  }

  if (homeScore !== awayScore) {
    return {
      winnerSide: homeScore > awayScore ? "home" : "away",
      method: "regulation",
    };
  }

  const { overtimeHome, overtimeAway, penaltyHome, penaltyAway } = extras;

  if (
    overtimeHome != null &&
    overtimeAway != null &&
    overtimeHome !== overtimeAway
  ) {
    return {
      winnerSide: overtimeHome > overtimeAway ? "home" : "away",
      method: "overtime",
    };
  }

  if (
    penaltyHome != null &&
    penaltyAway != null &&
    penaltyHome !== penaltyAway
  ) {
    return {
      winnerSide: penaltyHome > penaltyAway ? "home" : "away",
      method: "penalties",
    };
  }

  if (options.isPlayoff) {
    return { winnerSide: null };
  }

  return { winnerSide: "draw" };
}

export function extractPlayoffExtraScores(line: string): PlayoffScoreExtras {
  const extras: PlayoffScoreExtras = {};

  const ot = line.match(/Prorrogação:\s*(\d{1,2})\s*x\s*(\d{1,2})/i);
  if (ot) {
    extras.overtimeHome = parseInt(ot[1], 10);
    extras.overtimeAway = parseInt(ot[2], 10);
  }

  const pen = line.match(/Pênaltis:\s*(\d{1,2})\s*x\s*(\d{1,2})/i);
  if (pen) {
    extras.penaltyHome = parseInt(pen[1], 10);
    extras.penaltyAway = parseInt(pen[2], 10);
  }

  return extras;
}
