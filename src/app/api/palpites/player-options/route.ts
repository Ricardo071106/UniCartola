import { NextResponse } from "next/server";
import {
  getCardPlayerOptions,
  getScorerOptions,
} from "@/lib/queries/palpites-options";
import { parseSeries, parseSport } from "@/lib/queries/standings";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const series = parseSeries(searchParams.get("series"));

  try {
    const [scorers, cards] = await Promise.all([
      getScorerOptions(sport, series),
      getCardPlayerOptions(sport, series),
    ]);

    return NextResponse.json({ sport, series, scorers, cards });
  } catch (error) {
    console.error("[api/palpites/player-options]", error);
    return NextResponse.json(
      { sport, series, scorers: [], cards: [], error: "fetch_failed" },
      { status: 500 }
    );
  }
}
