import {
  getCachedHomeDashboardData,
} from "@/lib/queries/home-data";
import { parseSeries, parseSport, SERIES } from "@/lib/queries/standings";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = parseSport(searchParams.get("sport"));
  const series = parseSeries(searchParams.get("series"));

  if (!SERIES.includes(series)) {
    return Response.json({ error: "Série inválida" }, { status: 400 });
  }

  try {
    const data = await getCachedHomeDashboardData(
      sport as SportSlug,
      series
    );
    return Response.json(data, {
      headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=300" },
    });
  } catch (error) {
    console.error("[api/home]", error);
    return Response.json(
      {
        standings: [],
        playoffBracket: null,
        goalScorers: [],
        pointScorers: [],
      },
      { status: 200 }
    );
  }
}
