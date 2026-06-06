"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { predictions, matches, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { requireRealEntryPaid } from "@/lib/currency/real-entry";
import { and, eq, sql } from "drizzle-orm";
import type { PredictionResult } from "@/types";

export async function submitPrediction(data: {
  matchId: string;
  result: PredictionResult;
  homeScore?: number;
  awayScore?: number;
  homeFouls?: number;
  awayFouls?: number;
  homeCards?: number;
  awayCards?: number;
}) {
  try {
    const session = await requireSession();
    const db = requireDb();
    const currencyMode = await getCurrencyMode();
    if (currencyMode === "real") {
      await requireRealEntryPaid(session.userId);
    }

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, data.matchId))
      .limit(1);

    if (!match) return { error: "Partida não encontrada" };
    if (match.status === "finished" || match.status === "live") {
      return { error: "Palpites encerrados para esta partida" };
    }

    const existing = await db
      .select()
      .from(predictions)
      .where(
        and(
          eq(predictions.userId, session.userId),
          eq(predictions.matchId, data.matchId),
          eq(predictions.currencyMode, currencyMode)
        )
      )
      .limit(1);

    const values = {
      result: data.result,
      homeScore: data.homeScore ?? null,
      awayScore: data.awayScore ?? null,
      homeFouls: data.homeFouls ?? null,
      awayFouls: data.awayFouls ?? null,
      homeCards: data.homeCards ?? null,
      awayCards: data.awayCards ?? null,
    };

    if (existing.length) {
      await db
        .update(predictions)
        .set(values)
        .where(eq(predictions.id, existing[0].id));
    } else {
      await db.insert(predictions).values({
        userId: session.userId,
        matchId: data.matchId,
        currencyMode,
        stakeAmount: 0,
        ...values,
      });

      await db
        .update(users)
        .set({
          totalPredictions: sql`${users.totalPredictions} + 1`,
        })
        .where(eq(users.id, session.userId));
    }

    revalidatePath(`/partida/${data.matchId}`);
    revalidatePath("/palpites");
    revalidatePath("/jogos");
    revalidatePath("/perfil");
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar palpite",
    };
  }
}
