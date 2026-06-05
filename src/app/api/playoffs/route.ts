import { getPlayoffBracketWithBoletim } from "@/lib/queries/playoffs";
import { SERIES } from "@/lib/queries/standings";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sport = searchParams.get("sport") ?? "futsal";
  const series = searchParams.get("series") ?? "A";

  if (
    !["futsal", "futebol", "basquete"].includes(sport) ||
    !SERIES.includes(series as (typeof SERIES)[number])
  ) {
    return Response.json({ error: "Parâmetros inválidos" }, { status: 400 });
  }

  try {
    const bracket = await getPlayoffBracketWithBoletim(
      sport as SportSlug,
      series as (typeof SERIES)[number]
    );
    return Response.json(bracket);
  } catch (error) {
    console.error("[api/playoffs]", error);
    return Response.json(null);
  }
}
