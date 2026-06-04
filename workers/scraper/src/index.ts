import { runFullScrape } from "./sync";

const INTERVAL_MS = parseInt(process.env.SCRAPER_INTERVAL_MS ?? "3600000", 10);

async function loop() {
  console.log(`[scraper] Starting at ${new Date().toISOString()}`);
  try {
    const result = await runFullScrape();
    console.log("[scraper] Result:", result);
  } catch (e) {
    console.error("[scraper] Error:", e);
  }
  setTimeout(loop, INTERVAL_MS);
}

loop();
