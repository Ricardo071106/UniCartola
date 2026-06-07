function normalizeBaseUrl(url: string): string {
  const trimmed = url.trim().replace(/\/$/, "");
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }
  return `https://${trimmed}`;
}

function isLocalhostUrl(url: string): boolean {
  try {
    const parsed = new URL(
      url.startsWith("http://") || url.startsWith("https://")
        ? url
        : `http://${url}`
    );
    return parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
  } catch {
    return /localhost|127\.0\.0\.1/i.test(url);
  }
}

/** URL pública do app (Stripe, links, cron externo). */
export function getAppBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_APP_URL?.trim();

  if (configured && !isLocalhostUrl(configured)) {
    return normalizeBaseUrl(configured);
  }

  const renderUrl = process.env.RENDER_EXTERNAL_URL?.trim();
  if (renderUrl) return normalizeBaseUrl(renderUrl);

  const vercelUrl = process.env.VERCEL_URL?.trim();
  if (vercelUrl) return normalizeBaseUrl(vercelUrl);

  if (configured) return normalizeBaseUrl(configured);

  const port = process.env.PORT ?? "3000";
  return `http://127.0.0.1:${port}`;
}

/** URL para chamadas server-side no mesmo processo (sync automático). */
export function getInternalAppBaseUrl(): string {
  if (process.env.RENDER || process.env.NODE_ENV === "production") {
    const port = process.env.PORT ?? "10000";
    return `http://127.0.0.1:${port}`;
  }
  return getAppBaseUrl();
}
