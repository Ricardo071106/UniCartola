import { matches } from "@/lib/db/schema";
import { and, isNotNull, like, not, type SQL } from "drizzle-orm";

/** Excludes demo matches created by scripts/seed.ts (`external_key` like `seed:%`). */
export function realMatchesOnly(): SQL {
  return and(
    isNotNull(matches.externalKey),
    not(like(matches.externalKey, "seed:%"))
  )!;
}

export function isRealMatch(externalKey: string | null | undefined): boolean {
  if (!externalKey) return false;
  return !externalKey.startsWith("seed:");
}
