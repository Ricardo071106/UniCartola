"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { predictions, matches, users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { DEFAULT_STAKE } from "@/lib/currency/mode";
import { and, eq, sql } from "drizzle-orm";
import type { PredictionResult } from "@/types";

async function chargeStake(userId: string, mode: "play" | "real") {
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
        : "Saldo real insuficiente"
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

export async function submitPrediction(data: {
  matchId: string;
  result: PredictionResult;
  homeScore?: number;
  awayScore?: number;
}) {
  try {
    const session = await requireSession();
    const db = requireDb();
    const currencyMode = await getCurrencyMode();

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, data.matchId))
      .limit(1);

    if (!match) return { error: "Partida não encontrada" };
    if (match.status === "finished" || match.status === "live") {
      return { error: "Palpites encerrados para esta partida" };
    }

    const hasScore =
      data.homeScore !== undefined && data.awayScore !== undefined;

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

    if (existing.length) {
      await db
        .update(predictions)
        .set({
          result: data.result,
          homeScore: hasScore ? data.homeScore : null,
          awayScore: hasScore ? data.awayScore : null,
        })
        .where(eq(predictions.id, existing[0].id));
    } else {
      await chargeStake(session.userId, currencyMode);
      await db.insert(predictions).values({
        userId: session.userId,
        matchId: data.matchId,
        result: data.result,
        homeScore: hasScore ? data.homeScore : null,
        awayScore: hasScore ? data.awayScore : null,
        currencyMode,
        stakeAmount: DEFAULT_STAKE,
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
    revalidatePath("/perfil");
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar palpite",
    };
  }
}
