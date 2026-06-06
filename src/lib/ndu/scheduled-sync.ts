import { drizzle } from "drizzle-orm/postgres-js";
import * as schema from "@/lib/db/schema";
import {
  connectionHelp,
  createScriptPostgresClient,
  logConnectionInfo,
} from "@/lib/db/connection";
import {
  clearScriptDbOverride,
  setScriptDbOverride,
} from "@/lib/db/script-context";
import { runFullScrape, type ScrapeOptions } from "./sync";

export type ScheduledSyncResult =
  | { skipped: true; reason: string }
  | Awaited<ReturnType<typeof runFullScrape>> & { skipped?: false };

let syncInFlight = false;

export async function runScheduledNduSync(
  options: ScrapeOptions = {}
): Promise<ScheduledSyncResult> {
  if (!process.env.DATABASE_URL?.trim()) {
    return { skipped: true, reason: "sem DATABASE_URL" };
  }

  if (syncInFlight) {
    console.log("[ndu-cron] Sync já em andamento — ignorando chamada duplicada");
    return { skipped: true, reason: "sync em andamento" };
  }

  syncInFlight = true;
  logConnectionInfo();
  const client = createScriptPostgresClient();
  const db = drizzle(client, { schema });
  setScriptDbOverride(db);

  try {
    await client`SELECT 1`;
    const result = await runFullScrape(options);
    console.log(
      `[ndu-cron] OK: ${result.parsed ?? result.total} jogos, ${result.created} criados, ${result.updated} atualizados, ${result.statsSynced ?? 0} estatísticas`
    );
    if (result.errors.length) {
      console.warn("[ndu-cron] Erros:", result.errors.slice(0, 5));
    }
    return result;
  } catch (e) {
    console.error("[ndu-cron] Falhou:", e);
    console.error("\n" + connectionHelp(e));
    throw e;
  } finally {
    clearScriptDbOverride();
    syncInFlight = false;
    await client.end({ timeout: 10 });
  }
}
