import { requireDb } from "@/lib/db";
import { marketPredictions, sports, athletics } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import type { CurrencyMode } from "@/lib/currency/mode";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "./standings";

export type MarketPredictionType = "champion" | "top_scorer" | "top_cards";

export type MarketPredictionView = {
  marketType: MarketPredictionType;
  athleticsId: string | null;
  athleticsName: string | null;
  playerName: string | null;
};

export async function getUserMarketPredictions(
  userId: string,
  sportSlug: SportSlug,
  series: SeriesLetter,
  currencyMode: CurrencyMode
): Promise<MarketPredictionView[]> {
  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return [];

  const rows = await db
    .select({
      prediction: marketPredictions,
      athletic: athletics,
    })
    .from(marketPredictions)
    .leftJoin(athletics, eq(marketPredictions.athleticsId, athletics.id))
    .where(
      and(
        eq(marketPredictions.userId, userId),
        eq(marketPredictions.sportId, sport.id),
        eq(marketPredictions.series, series),
        eq(marketPredictions.currencyMode, currencyMode)
      )
    );

  return rows.map((r) => ({
    marketType: r.prediction.marketType,
    athleticsId: r.prediction.athleticsId,
    athleticsName: r.athletic?.name ?? null,
    playerName: r.prediction.playerName,
  }));
}
