"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { marketPredictions, sports, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { requireRealEntryPaid } from "@/lib/currency/real-entry";
import { DEFAULT_STAKE, type CurrencyMode } from "@/lib/currency/mode";
import { and, eq } from "drizzle-orm";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { MarketPredictionType } from "@/lib/queries/market-predictions";

async function ensureStake(userId: string, mode: CurrencyMode) {
  const db = requireDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!user) throw new Error("Usuário não encontrado");

  const balance = mode === "play" ? user.playBalance : user.realBalance;
  if (balance < DEFAULT_STAKE) {
    throw new Error(
      mode === "play"
        ? "Saldo de fichas insuficiente"
        : "Saldo real insuficiente — adicione fundos para palpitar"
    );
  }

  await db
    .update(users)
    .set(
      mode === "play"
        ? { playBalance: user.playBalance - DEFAULT_STAKE }
        : { realBalance: user.realBalance - DEFAULT_STAKE }
    )
    .where(eq(users.id, userId));
}

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
      await ensureStake(session.userId, currencyMode);
      await db.insert(marketPredictions).values({
        userId: session.userId,
        sportId: sport.id,
        series: data.series,
        currencyMode,
        marketType: data.marketType,
        athleticsId: data.athleticsId ?? null,
        playerName: data.playerName?.trim() ?? null,
        stakeAmount: DEFAULT_STAKE,
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
