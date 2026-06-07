export async function register() {
  if (process.env.NEXT_RUNTIME === "edge") return;
  // Sync pesado roda via Render Cron + subprocesso — não agendar no processo web.
  if (process.env.RENDER === "true" || process.env.RENDER_SERVICE_ID) return;

  const { startNduSyncScheduler } = await import("./lib/ndu/sync-scheduler");
  startNduSyncScheduler();
}
