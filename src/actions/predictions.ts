"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { predictions, matches } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { and, eq, sql } from "drizzle-orm";
import type { PredictionResult } from "@/types";

export async function submitPrediction(data: {
  matchId: string;
  result: PredictionResult;
  homeScore?: number;
  awayScore?: number;
}) {
  try {
    const session = await requireSession();
    const db = requireDb();

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
          eq(predictions.matchId, data.matchId)
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
      await db.insert(predictions).values({
        userId: session.userId,
        matchId: data.matchId,
        result: data.result,
        homeScore: hasScore ? data.homeScore : null,
        awayScore: hasScore ? data.awayScore : null,
      });

      const { users } = await import("@/lib/db/schema");
      await db
        .update(users)
        .set({
          totalPredictions: sql`${users.totalPredictions} + 1`,
        })
        .where(eq(users.id, session.userId));
    }

    revalidatePath(`/partida/${data.matchId}`);
    revalidatePath("/perfil");
    return { success: true };
  } catch (e) {
    return {
      error: e instanceof Error ? e.message : "Erro ao salvar palpite",
    };
  }
}
