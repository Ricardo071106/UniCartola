import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import postgres, { type Options } from "postgres";

dns.setDefaultResultOrder("ipv4first");

export function getConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://postgres:postgres@localhost:54322/postgres")
  );
}

function parseDbUrl(connectionString: string): URL {
  return new URL(connectionString.replace(/^postgresql:\/\//, "postgres://"));
}

function rebuildConnectionString(original: string, newHost: string): string {
  const url = parseDbUrl(original);
  url.hostname = newHost;
  return url.toString().replace(/^postgres:\/\//, "postgresql://");
}

/** Força IPv4 — evita ENETUNREACH no Render quando o host só resolve para IPv6 */
export async function resolveConnectionString(connectionString: string): Promise<string> {
  if (process.env.DATABASE_HOST_IPV4) {
    return rebuildConnectionString(connectionString, process.env.DATABASE_HOST_IPV4);
  }

  const url = parseDbUrl(connectionString);
  const hostname = url.hostname;

  if (/^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return connectionString;
  }

  try {
    const { address } = await dnsPromises.lookup(hostname, { family: 4 });
    console.log(`[db] Host ${hostname} → IPv4 ${address}`);
    return rebuildConnectionString(connectionString, address);
  } catch (err) {
    console.warn(`[db] Falha ao resolver IPv4 para ${hostname}, usando URL original`, err);
    return connectionString;
  }
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
  const resolved = await resolveConnectionString(connectionString);
  return createPostgresClient(resolved, max);
}
