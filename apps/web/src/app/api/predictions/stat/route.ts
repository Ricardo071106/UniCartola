import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { statMarkets, statPredictions } from "@unicartola/db/schema";
import { eq, and } from "drizzle-orm";
import { requireUserId } from "@/lib/auth";

function normalizePlayerName(name: string) {
  return name.trim().toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

const schema = z.object({
  marketId: z.string().uuid(),
  playerName: z.string().min(2).max(255),
});

export async function POST(request: Request) {
  try {
    const db = await getDb();
    const userId = await requireUserId();
    const body = schema.parse(await request.json());

    const [market] = await db
      .select()
      .from(statMarkets)
      .where(eq(statMarkets.id, body.marketId))
      .limit(1);

    if (!market || market.status !== "open") {
      return NextResponse.json({ error: "Mercado fechado" }, { status: 400 });
    }

    if (market.closesAt && new Date() >= market.closesAt) {
      return NextResponse.json({ error: "Prazo encerrado" }, { status: 400 });
    }

    const normalized = normalizePlayerName(body.playerName);

    const [existing] = await db
      .select()
      .from(statPredictions)
      .where(
        and(
          eq(statPredictions.userId, userId),
          eq(statPredictions.marketId, body.marketId)
        )
      )
      .limit(1);

    if (existing) {
      await db
        .update(statPredictions)
        .set({
          playerName: body.playerName.trim(),
          normalizedPlayerName: normalized,
        })
        .where(eq(statPredictions.id, existing.id));
    } else {
      await db.insert(statPredictions).values({
        userId,
        marketId: body.marketId,
        playerName: body.playerName.trim(),
        normalizedPlayerName: normalized,
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
