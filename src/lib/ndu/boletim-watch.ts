import { requireDb } from "@/lib/db";
import { syncMetadata } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { fetchNduHtml, NDU_BOLETIM_URL } from "./fetch";
import { parseBoletimIndex } from "./boletim-parser";

const METADATA_KEY = "last_boletim_id";

export async function getLatestBoletimId(year = 2026): Promise<string | null> {
  const html = await fetchNduHtml(NDU_BOLETIM_URL);
  const entries = parseBoletimIndex(html, year);
  return entries[0]?.id ?? null;
}

export async function syncIfNewBoletim(year = 2026): Promise<boolean> {
  if (!process.env.DATABASE_URL?.trim()) return false;

  const latestId = await getLatestBoletimId(year);
  if (!latestId) return false;

  const db = requireDb();
  const [stored] = await db
    .select()
    .from(syncMetadata)
    .where(eq(syncMetadata.key, METADATA_KEY))
    .limit(1);

  if (stored?.value === latestId) return false;

  await db
    .insert(syncMetadata)
    .values({ key: METADATA_KEY, value: latestId })
    .onConflictDoUpdate({
      target: syncMetadata.key,
      set: { value: latestId, updatedAt: new Date() },
    });

  const { runFullScrape } = await import("./sync");
  await runFullScrape({ syncScorers: false, scorerLimit: 0 });
  return true;
}
