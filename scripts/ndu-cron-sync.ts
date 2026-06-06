import "dotenv/config";
import { runScheduledNduSync } from "../src/lib/ndu/scheduled-sync";

async function main() {
  const result = await runScheduledNduSync();
  if ("skipped" in result && result.skipped) {
    console.log(`[ndu-cron] Pulado: ${result.reason}`);
    return;
  }
}

main().catch((e) => {
  console.error("[ndu-cron]", e);
  process.exit(1);
});
