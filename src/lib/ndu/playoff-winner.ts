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

const OT_PATTERNS = [
  /Prorrogação:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  /Prorrogacao:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  /Prorrog\.?:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
];

const PEN_PATTERNS = [
  /Pênaltis:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  /Penaltis:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  /Pênalti:\s*(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
];

export function extractPlayoffExtraScores(line: string): PlayoffScoreExtras {
  const text = line.replace(/\s+/g, " ");
  const extras: PlayoffScoreExtras = {};

  const otPatterns = [
    ...OT_PATTERNS,
    /(?:Prorrogação|Prorrogacao|Prorrog\.?)\s*[:\s]+(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  ];
  const penPatterns = [
    ...PEN_PATTERNS,
    /(?:Pênaltis|Penaltis|Pênalti)\s*[:\s]+(\d{1,2})\s*[xX×]\s*(\d{1,2})/i,
  ];

  for (const pattern of otPatterns) {
    const m = text.match(pattern);
    if (m) {
      extras.overtimeHome = parseInt(m[1], 10);
      extras.overtimeAway = parseInt(m[2], 10);
      break;
    }
  }

  for (const pattern of penPatterns) {
    const m = text.match(pattern);
    if (m) {
      extras.penaltyHome = parseInt(m[1], 10);
      extras.penaltyAway = parseInt(m[2], 10);
      break;
    }
  }

  return extras;
}

/** Vencedor para exibição quando winnerSide ainda não foi resolvido. */
export function displayPlayoffWinnerSide(match: {
  homeScore: number | null;
  awayScore: number | null;
  winnerSide: PlayoffWinnerSide;
  winnerMethod?: "regulation" | "overtime" | "penalties";
  status: string;
}): PlayoffWinnerSide {
  if (match.winnerSide === "home" || match.winnerSide === "away") {
    return match.winnerSide;
  }
  if (
    match.status === "finished" &&
    match.homeScore != null &&
    match.awayScore != null &&
    match.homeScore !== match.awayScore
  ) {
    return match.homeScore > match.awayScore ? "home" : "away";
  }
  return match.winnerSide;
}
