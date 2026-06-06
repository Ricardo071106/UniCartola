import type { SportSlug } from "@/types";

/** Pontos por acerto em palpites de partida (somam se vários acertar). */
export const MATCH_PREDICTION_POINTS = {
  result: 3,
  exactScore: 5,
  homeFouls: 3,
  awayFouls: 3,
  homeCards: 2,
  awayCards: 2,
} as const;

/** Pontos por acerto em palpites de temporada. */
export const SEASON_PREDICTION_POINTS = {
  champion: 15,
  top_scorer: 10,
  top_cards: 8,
} as const;

export function maxMatchPredictionPoints(sport: SportSlug): number {
  const base =
    MATCH_PREDICTION_POINTS.result + MATCH_PREDICTION_POINTS.exactScore;
  if (sport === "basquete") return base;
  return (
    base +
    MATCH_PREDICTION_POINTS.homeFouls +
    MATCH_PREDICTION_POINTS.awayFouls +
    MATCH_PREDICTION_POINTS.homeCards +
    MATCH_PREDICTION_POINTS.awayCards
  );
}

export function maxSeasonPredictionPoints(sport: SportSlug): number {
  let total =
    SEASON_PREDICTION_POINTS.champion + SEASON_PREDICTION_POINTS.top_scorer;
  if (sport !== "basquete") total += SEASON_PREDICTION_POINTS.top_cards;
  return total;
}

export function matchPointsBreakdown(sport: SportSlug): {
  key: string;
  label: string;
  points: number;
}[] {
  const items: { key: string; label: string; points: number }[] = [
    { key: "result", label: "Vencedor", points: MATCH_PREDICTION_POINTS.result },
    {
      key: "exactScore",
      label: "Placar exato",
      points: MATCH_PREDICTION_POINTS.exactScore,
    },
  ];
  if (sport !== "basquete") {
    items.push(
      {
        key: "homeFouls",
        label: "Faltas mandante",
        points: MATCH_PREDICTION_POINTS.homeFouls,
      },
      {
        key: "awayFouls",
        label: "Faltas visitante",
        points: MATCH_PREDICTION_POINTS.awayFouls,
      },
      {
        key: "homeCards",
        label: "Cartões mandante",
        points: MATCH_PREDICTION_POINTS.homeCards,
      },
      {
        key: "awayCards",
        label: "Cartões visitante",
        points: MATCH_PREDICTION_POINTS.awayCards,
      }
    );
  }
  return items;
}
