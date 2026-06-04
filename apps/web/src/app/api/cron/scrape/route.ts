import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { runFullScrape } = await import("@unicartola/scraper/sync");
    const result = await runFullScrape();
    const { processAllFinishedMatches } = await import("@/lib/services/scoring");
    await processAllFinishedMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Scrape failed" },
      { status: 500 }
    );
  }
}
