"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { marketPredictions, sports } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { requireRealEntryPaid } from "@/lib/currency/real-entry";
import { and, eq } from "drizzle-orm";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { MarketPredictionType } from "@/lib/queries/market-predictions";

export async function submitMarketPrediction(data: {
  sportSlug: SportSlug;
  series: SeriesLetter;
  marketType: MarketPredictionType;
  athleticsId?: string;
  playerName?: string;
}) {
  try {
    const session = await requireSession();
    const db = requireDb();
    const currencyMode = await getCurrencyMode();
    if (currencyMode === "real") {
      await requireRealEntryPaid(session.userId);
    }

    const [sport] = await db
      .select()
      .from(sports)
      .where(eq(sports.slug, data.sportSlug))
      .limit(1);
    if (!sport) return { error: "Esporte não encontrado" };

    if (data.marketType === "champion" && !data.athleticsId) {
      return { error: "Selecione a atlética campeã" };
    }
    if (
      (data.marketType === "top_scorer" || data.marketType === "top_cards") &&
      !data.playerName?.trim()
    ) {
      return { error: "Informe o nome do jogador" };
    }

    const existing = await db
      .select()
      .from(marketPredictions)
      .where(
        and(
          eq(marketPredictions.userId, session.userId),
          eq(marketPredictions.sportId, sport.id),
          eq(marketPredictions.series, data.series),
          eq(marketPredictions.marketType, data.marketType),
          eq(marketPredictions.currencyMode, currencyMode)
        )
      )
      .limit(1);

    if (!existing.length) {
      await db.insert(marketPredictions).values({
        userId: session.userId,
        sportId: sport.id,
        series: data.series,
        currencyMode,
        marketType: data.marketType,
        athleticsId: data.athleticsId ?? null,
        playerName: data.playerName?.trim() ?? null,
        stakeAmount: 0,
      });
    } else {
      await db
        .update(marketPredictions)
        .set({
          athleticsId: data.athleticsId ?? null,
          playerName: data.playerName?.trim() ?? null,
        })
        .where(eq(marketPredictions.id, existing[0].id));
    }

    revalidatePath("/palpites");
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar palpite",
    };
  }
}
