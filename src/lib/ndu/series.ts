import { matches } from "@/lib/db/schema";
import { inArray, type SQL } from "drizzle-orm";

const SERIES_LETTERS = ["A", "B", "C", "D", "E", "F"] as const;
export type SeriesLetter = (typeof SERIES_LETTERS)[number];

export function parseSeriesLetter(value?: string | null): SeriesLetter {
  const normalized = normalizeSeriesLabel(value);
  if (normalized && SERIES_LETTERS.includes(normalized as SeriesLetter)) {
    return normalized as SeriesLetter;
  }
  const candidate = (value?.trim() || "A").toUpperCase();
  return SERIES_LETTERS.includes(candidate as SeriesLetter)
    ? (candidate as SeriesLetter)
    : "A";
}

export function normalizeSeriesLabel(
  series: string | undefined | null
): string | null {
  if (!series?.trim()) return null;
  const t = series.trim().toUpperCase();
  const letter = t.match(/^([A-F])$/)?.[1];
  if (letter) return letter;
  const fromLabel = t.match(/S[EÉ]RIE\s*([A-F])/i)?.[1];
  if (fromLabel) return fromLabel.toUpperCase();
  return t.slice(0, 8);
}

/** Valores legados que podem existir no banco antes da normalização. */
export function seriesFilterValues(letter: string): string[] {
  const L = letter.trim().toUpperCase();
  if (!/^[A-F]$/.test(L)) return [L];
  return [...new Set([L, `Série ${L}`, `SERIE ${L}`])];
}

export function matchSeriesSql(series: string): SQL {
  return inArray(matches.series, seriesFilterValues(series));
}

/** Extrai série do external_key gerado pelo parser (`sport:data:serie:grupo:...`). */
export function inferSeriesFromExternalKey(
  externalKey: string | null | undefined
): string | null {
  if (!externalKey?.trim() || externalKey.startsWith("ndu:")) return null;
  const parts = externalKey.split(":");
  if (parts.length >= 3 && parts[0] !== "hash") {
    return normalizeSeriesLabel(parts[2]);
  }
  return null;
}

export function resolveMatchSeries(
  series: string | null | undefined,
  externalKey?: string | null
): string | null {
  return normalizeSeriesLabel(series) ?? inferSeriesFromExternalKey(externalKey);
}

export function matchBelongsToSeries(
  series: string | null | undefined,
  targetLetter: string,
  externalKey?: string | null
): boolean {
  const resolved = resolveMatchSeries(series, externalKey);
  if (!resolved) return false;
  return resolved === parseSeriesLetter(targetLetter);
}
