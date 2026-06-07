export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;

  const { startNduSyncScheduler } = await import("./lib/ndu/sync-scheduler");
  startNduSyncScheduler();
}
