import { requireDb } from "@/lib/db";
import { seasons, sports } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { parseBoletimMatches } from "./boletim-sync";
import { parseNduMatchDateTime } from "./match-datetime";
import { modalityToSportSlug } from "./normalize";
import { matchBelongsToSeries, parseSeriesLetter } from "./series";
import type { ParsedMatchRow } from "./parser";
import type { SportSlug } from "@/types";
import { withTimeout } from "@/lib/utils/timeout";

/** Garante que jogos agendados do boletim (ex.: semifinais) existam no banco. */
export async function ensureBoletimScheduledMatches(options?: {
  sport?: SportSlug;
  series?: string;
}): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;

  const boletim = await withTimeout(parseBoletimMatches(), 25000, null);
  if (!boletim?.rows.length) return 0;

  const db = requireDb();
  const [activeSeason] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  const year = activeSeason?.year ?? new Date().getFullYear();
  const targetSeries = options?.series
    ? parseSeriesLetter(options.series)
    : null;

  const scheduled = boletim.rows.filter((row) => {
    if (row.isFinished) return false;
    const slug = modalityToSportSlug(row.modality);
    if (!slug || !["futsal", "futebol", "basquete"].includes(slug)) return false;
    if (options?.sport && slug !== options.sport) return false;
    if (
      targetSeries &&
      !matchBelongsToSeries(row.series, targetSeries, null, {
        includeUnknown: true,
      })
    ) {
      return false;
    }
    const kickoff = parseNduMatchDateTime(row.dateLabel, year);
    if (!kickoff || kickoff.getTime() <= Date.now()) return false;
    return Boolean(row.homeTeamRaw?.trim() && row.awayTeamRaw?.trim());
  });

  if (scheduled.length === 0) return 0;

  const { ingestParsedMatchRows } = await import("./sync");
  const result = await ingestParsedMatchRows(scheduled);
  return result.created + result.updated;
}

export function filterFutureScheduledRows(
  rows: ParsedMatchRow[],
  year: number,
  options?: { sport?: SportSlug; series?: string }
): ParsedMatchRow[] {
  const targetSeries = options?.series
    ? parseSeriesLetter(options.series)
    : null;

  return rows.filter((row) => {
    if (row.isFinished) return false;
    const slug = modalityToSportSlug(row.modality);
    if (!slug) return false;
    if (options?.sport && slug !== options.sport) return false;
    if (
      targetSeries &&
      !matchBelongsToSeries(row.series, targetSeries, null, {
        includeUnknown: true,
      })
    ) {
      return false;
    }
    const kickoff = parseNduMatchDateTime(row.dateLabel, year);
    return Boolean(kickoff && kickoff.getTime() > Date.now());
  });
}
