export async function safeQuery<T>(
  fn: () => Promise<T>,
  fallback: T
): Promise<T> {
  if (!process.env.DATABASE_URL) return fallback;
  try {
    return await fn();
  } catch (error) {
    console.error("[safeQuery]", error);
    return fallback;
  }
}
