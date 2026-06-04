import { NextResponse } from "next/server";
import { requireUserId } from "@/lib/auth";
import { db } from "@/lib/db";
import { userProfiles } from "@unicartola/db/schema";
import { eq } from "drizzle-orm";

export async function POST() {
  try {
    const userId = await requireUserId();
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (!profile?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { runFullScrape } = await import("@unicartola/scraper/sync");
    const result = await runFullScrape();
    const { processAllFinishedMatches } = await import("@/lib/services/scoring");
    await processAllFinishedMatches();

    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Failed" },
      { status: 500 }
    );
  }
}
