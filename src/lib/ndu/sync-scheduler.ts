import { getInternalAppBaseUrl } from "@/lib/app-url";

const DEFAULT_INTERVAL_SECONDS = 21_600; // 6h
const MIN_PAGE_TRIGGER_SECONDS = 3_600; // 1h

let schedulerStarted = false;
let lastSyncAttemptAt = 0;
let lastSyncSuccessAt = 0;

function intervalMs(): number {
  const raw = parseInt(
    process.env.NDU_SYNC_INTERVAL_SECONDS ?? String(DEFAULT_INTERVAL_SECONDS),
    10
  );
  return Number.isFinite(raw) && raw > 0 ? raw * 1000 : DEFAULT_INTERVAL_SECONDS * 1000;
}

function appBaseUrl(): string {
  return getInternalAppBaseUrl();
}

function shouldRunSync(minGapMs: number): boolean {
  if (!process.env.DATABASE_URL?.trim()) return false;
  if (process.env.DISABLE_NDU_AUTO_SYNC === "1") return false;
  const now = Date.now();
  if (now - lastSyncAttemptAt < minGapMs) return false;
  if (lastSyncSuccessAt > 0 && now - lastSyncSuccessAt < intervalMs()) {
    return false;
  }
  return true;
}

async function triggerSyncViaApi(
  reason: "startup" | "interval" | "page"
): Promise<void> {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret && process.env.NODE_ENV === "production") {
    console.warn("[ndu-scheduler] CRON_SECRET ausente — sync automático desativado");
    return;
  }

  const headers: Record<string, string> = {};
  if (secret) headers.Authorization = `Bearer ${secret}`;

  const response = await fetch(`${appBaseUrl()}/api/cron/scrape`, {
    method: "POST",
    headers,
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  lastSyncSuccessAt = Date.now();
  console.log(`[ndu-scheduler] Sync solicitado (${reason})`);
}

export async function maybeRunBackgroundSync(
  reason: "startup" | "interval" | "page" = "page"
): Promise<void> {
  const minGap =
    reason === "page"
      ? MIN_PAGE_TRIGGER_SECONDS * 1000
      : reason === "startup"
        ? 0
        : intervalMs();

  if (!shouldRunSync(minGap)) return;

  lastSyncAttemptAt = Date.now();

  try {
    await triggerSyncViaApi(reason);
  } catch (error) {
    console.error(`[ndu-scheduler] Falhou (${reason}):`, error);
  }
}

export function startNduSyncScheduler(): void {
  if (schedulerStarted) return;
  if (!process.env.DATABASE_URL?.trim()) return;
  if (process.env.DISABLE_NDU_AUTO_SYNC === "1") return;

  schedulerStarted = true;
  const every = intervalMs();

  console.log(
    `[ndu-scheduler] Sync automático ativo (intervalo ${Math.round(every / 1000 / 60)} min)`
  );

  setTimeout(() => {
    void maybeRunBackgroundSync("startup");
  }, 15_000);

  setInterval(() => {
    void maybeRunBackgroundSync("interval");
  }, every);
}
