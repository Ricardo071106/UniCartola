import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { matches, matchPredictions } from "@unicartola/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";

const schema = z.object({
  matchId: z.string().uuid(),
  outcome: z.enum(["home_win", "draw", "away_win"]),
  homeScore: z.number().int().min(0).nullable().optional(),
  awayScore: z.number().int().min(0).nullable().optional(),
});

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const userId = await requireUserId();
    const body = schema.parse(await request.json());

    const [match] = await db
      .select()
      .from(matches)
      .where(eq(matches.id, body.matchId))
      .limit(1);

    if (!match) {
      return NextResponse.json({ error: "Partida não encontrada" }, { status: 404 });
    }

    if (!match.predictionsOpen || match.status !== "scheduled") {
      return NextResponse.json({ error: "Palpites encerrados" }, { status: 400 });
    }

    if (match.scheduledAt && new Date() >= match.scheduledAt) {
      return NextResponse.json({ error: "Prazo encerrado" }, { status: 400 });
    }

    const [existing] = await db
      .select()
      .from(matchPredictions)
      .where(
        and(
          eq(matchPredictions.userId, userId),
          eq(matchPredictions.matchId, body.matchId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(matchPredictions)
        .set({
          outcome: body.outcome,
          homeScore: body.homeScore ?? null,
          awayScore: body.awayScore ?? null,
          updatedAt: new Date(),
        })
        .where(eq(matchPredictions.id, existing.id));
    } else {
      await db.insert(matchPredictions).values({
        userId,
        matchId: body.matchId,
        outcome: body.outcome,
        homeScore: body.homeScore ?? null,
        awayScore: body.awayScore ?? null,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === "Unauthorized") {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
    }
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
