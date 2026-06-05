import { requireDb } from "@/lib/db";
import { seasons } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

/** Valor do select NDU: "Semestre Atual" (sempre o semestre corrente). */
export const NDU_CURRENT_SEMESTRE = "";

export async function getCurrentStatsYear(): Promise<number> {
  try {
    const db = requireDb();
    const [active] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);
    if (active?.year) return active.year;
  } catch {
    /* sem banco */
  }
  return new Date().getFullYear();
}
