export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T,
  timeoutMs = 8000
): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    const { withTimeout } = await import("@/lib/utils/timeout");
    return await withTimeout(fn(), timeoutMs, fallback);
  } catch (error) {
    console.error("[safeQuery]", error);
    return fallback;
  }
}
