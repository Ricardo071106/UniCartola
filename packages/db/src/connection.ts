import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import postgres, { type Options } from "postgres";

dns.setDefaultResultOrder("ipv4first");

export function getConnectionString(): string | undefined {
  const raw =
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://postgres:postgres@localhost:54322/postgres");

  if (!raw) return undefined;
  return normalizeDatabaseUrl(raw);
}

function parseDbUrl(connectionString: string): URL {
  return new URL(connectionString.replace(/^postgresql:\/\//, "postgres://"));
}

function rebuildConnectionString(original: string, mutate: (url: URL) => void): string {
  const url = parseDbUrl(original);
  mutate(url);
  return url.toString().replace(/^postgres:\/\//, "postgresql://");
}

/**
 * Supabase Direct (db.xxx.supabase.co) often resolves to IPv6 only.
 * Render cannot reach IPv6 → ENETUNREACH.
 * Session pooler (aws-0-REGION.pooler.supabase.com) has IPv4.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  if (process.env.DATABASE_POOLER_URL) {
    console.log("[db] Using DATABASE_POOLER_URL");
    return process.env.DATABASE_POOLER_URL;
  }

  const url = parseDbUrl(connectionString);
  const directMatch = url.hostname.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  if (!directMatch) return connectionString;

  const projectRef = directMatch[1];
  const region =
    process.env.SUPABASE_REGION ??
    process.env.SUPABASE_POOLER_REGION ??
    (process.env.RENDER ? "sa-east-1" : undefined);

  if (!region) return connectionString;

  const poolerHost = `aws-0-${region}.pooler.supabase.com`;
  console.log(
    `[db] Supabase direct → session pooler (${poolerHost}). Defina SUPABASE_REGION se falhar.`
  );

  return rebuildConnectionString(connectionString, (u) => {
    u.hostname = poolerHost;
    u.port = "5432";
    if (u.username === "postgres") {
      u.username = `postgres.${projectRef}`;
    }
  });
}

/** Força IPv4 — evita ENETUNREACH no Render */
export async function resolveConnectionString(connectionString: string): Promise<string> {
  if (process.env.DATABASE_HOST_IPV4) {
    return rebuildConnectionString(connectionString, (u) => {
      u.hostname = process.env.DATABASE_HOST_IPV4!;
    });
  }

  const normalized = normalizeDatabaseUrl(connectionString);
  const url = parseDbUrl(normalized);
  const hostname = url.hostname;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return normalized;
  }

  try {
    const addresses = await dnsPromises.resolve4(hostname);
    if (addresses.length > 0) {
      console.log(`[db] Host ${hostname} → IPv4 ${addresses[0]}`);
      return rebuildConnectionString(normalized, (u) => {
        u.hostname = addresses[0];
      });
    }
  } catch {
    try {
      const { address } = await dnsPromises.lookup(hostname, { family: 4 });
      console.log(`[db] Host ${hostname} → IPv4 ${address}`);
      return rebuildConnectionString(normalized, (u) => {
        u.hostname = address;
      });
    } catch (err) {
      console.warn(`[db] Falha ao resolver IPv4 para ${hostname}`, err);
    }
  }

  return normalized;
}

export function createPostgresClient(connectionString: string, max = 10) {
  const needsSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require");

  const options: Options<Record<string, never>> = {
    max,
    connect_timeout: 30,
    idle_timeout: 20,
  };

  if (needsSsl) {
    options.ssl = "require";
  }

  return postgres(connectionString, options);
}

export async function createPostgresClientResolved(connectionString: string, max = 10) {
  const raw = getConnectionString() ?? connectionString;
  const resolved = await resolveConnectionString(raw);
  return createPostgresClient(resolved, max);
}

export function supabaseConnectionHelp(): string {
  return `
❌ ENETUNREACH — Render não alcança o Supabase via IPv6.

Solução A (recomendada): no Render, troque DATABASE_URL pela URI do
  Supabase → Database → Connection string → Session pooler (porta 5432)

Solução B: mantenha Direct URL e adicione no Render:
  SUPABASE_REGION=sa-east-1
  (use a região do seu projeto: us-east-1, eu-west-1, etc.)

Solução C: defina DATABASE_POOLER_URL com a URI completa do Session pooler.
`.trim();
}
