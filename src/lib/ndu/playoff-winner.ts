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

const SCORE_SEP = String.raw`(?:\s*[xX×\-–—]\s*|\s+a\s+)`;

function parseScorePairAfterLabel(
  text: string,
  labelPattern: string
): { home: number; away: number } | null {
  const patterns = [
    new RegExp(
      `${labelPattern}\\s*(?:[:\\(–-]\\s*)?(\\d{1,2})${SCORE_SEP}(\\d{1,2})`,
      "i"
    ),
    new RegExp(
      `${labelPattern}\\s*(\\d{1,2})${SCORE_SEP}(\\d{1,2})`,
      "i"
    ),
    new RegExp(
      `(\\d{1,2})${SCORE_SEP}(\\d{1,2})\\s*${labelPattern}`,
      "i"
    ),
  ];

  for (const pattern of patterns) {
    const m = text.match(pattern);
    if (!m) continue;
    const home = parseInt(m[1], 10);
    const away = parseInt(m[2], 10);
    if (!Number.isNaN(home) && !Number.isNaN(away)) {
      return { home, away };
    }
  }
  return null;
}

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

  if (overtimeHome != null && overtimeAway != null && overtimeHome !== overtimeAway) {
    return {
      winnerSide: overtimeHome > overtimeAway ? "home" : "away",
      method: "overtime",
    };
  }

  if (penaltyHome != null && penaltyAway != null && penaltyHome !== penaltyAway) {
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

const OT_LABEL =
  String.raw`(?:Prorrogação|Prorrogacao|Prorrog\.?)`;
const PEN_LABEL =
  String.raw`(?:P[eê]naltis|Pênaltis|Penaltis|P[eê]nalti|Pen\.?|Disputa\s+de\s+p[eê]naltis|Decis[aã]o\s+(?:nos?\s+)?p[eê]naltis)`;

export function extractPlayoffExtraScores(line: string): PlayoffScoreExtras {
  const text = line
    .replace(/\s+/g, " ")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

  const extras: PlayoffScoreExtras = {};

  const ot = parseScorePairAfterLabel(text, OT_LABEL);
  if (ot) {
    extras.overtimeHome = ot.home;
    extras.overtimeAway = ot.away;
  }

  const pen = parseScorePairAfterLabel(text, PEN_LABEL);
  if (pen) {
    extras.penaltyHome = pen.home;
    extras.penaltyAway = pen.away;
  }

  return extras;
}

export function extrasFromPlayoffMatch(match: {
  overtimeHomeScore?: number | null;
  overtimeAwayScore?: number | null;
  penaltyHomeScore?: number | null;
  penaltyAwayScore?: number | null;
}): PlayoffScoreExtras {
  return {
    overtimeHome: match.overtimeHomeScore ?? null,
    overtimeAway: match.overtimeAwayScore ?? null,
    penaltyHome: match.penaltyHomeScore ?? null,
    penaltyAway: match.penaltyAwayScore ?? null,
  };
}

/** Vencedor para exibição quando winnerSide ainda não foi resolvido. */
export function displayPlayoffWinnerSide(match: {
  homeScore: number | null;
  awayScore: number | null;
  winnerSide: PlayoffWinnerSide;
  winnerMethod?: "regulation" | "overtime" | "penalties";
  status: string;
  overtimeHomeScore?: number | null;
  overtimeAwayScore?: number | null;
  penaltyHomeScore?: number | null;
  penaltyAwayScore?: number | null;
}): PlayoffWinnerSide {
  if (match.winnerSide === "home" || match.winnerSide === "away") {
    return match.winnerSide;
  }

  const resolved = resolvePlayoffWinner(
    match.homeScore,
    match.awayScore,
    extrasFromPlayoffMatch(match),
    { isPlayoff: true }
  );
  if (resolved.winnerSide === "home" || resolved.winnerSide === "away") {
    return resolved.winnerSide;
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

export function resolvePlayoffMatchDisplay(match: {
  homeScore: number | null;
  awayScore: number | null;
  winnerSide: PlayoffWinnerSide;
  winnerMethod?: "regulation" | "overtime" | "penalties";
  status: string;
  overtimeHomeScore?: number | null;
  overtimeAwayScore?: number | null;
  penaltyHomeScore?: number | null;
  penaltyAwayScore?: number | null;
}): {
  winnerSide: PlayoffWinnerSide;
  winnerMethod?: "regulation" | "overtime" | "penalties";
} {
  const extras = extrasFromPlayoffMatch(match);
  const resolved = resolvePlayoffWinner(match.homeScore, match.awayScore, extras, {
    isPlayoff: true,
  });

  if (resolved.winnerSide === "home" || resolved.winnerSide === "away") {
    return {
      winnerSide: resolved.winnerSide,
      winnerMethod: resolved.method,
    };
  }

  const winner = displayPlayoffWinnerSide(match);
  if (winner === "home" || winner === "away") {
    return {
      winnerSide: winner,
      winnerMethod: match.winnerMethod ?? resolved.method ?? "regulation",
    };
  }

  if (match.winnerSide === "draw") {
    return { winnerSide: null, winnerMethod: match.winnerMethod };
  }

  return { winnerSide: match.winnerSide, winnerMethod: match.winnerMethod };
}
