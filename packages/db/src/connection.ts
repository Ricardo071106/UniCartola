import dns from "node:dns";
import dnsPromises from "node:dns/promises";
import postgres, { type Options } from "postgres";

dns.setDefaultResultOrder("ipv4first");

function buildFromSupabaseEnv(): string | undefined {
  const password = process.env.SUPABASE_DB_PASSWORD?.trim();
  const ref = process.env.SUPABASE_PROJECT_REF?.trim();
  const host =
    process.env.SUPABASE_POOLER_HOST?.trim() ??
    (process.env.SUPABASE_REGION
      ? `aws-0-${process.env.SUPABASE_REGION.trim()}.pooler.supabase.com`
      : undefined);

  if (!password || !ref || !host) return undefined;

  const encoded = encodeURIComponent(password);
  console.log(`[db] Montando URL a partir de SUPABASE_* (host: ${host}, user: postgres.${ref})`);
  return `postgresql://postgres.${ref}:${encoded}@${host}:5432/postgres?sslmode=require`;
}

export function getConnectionString(): string | undefined {
  const fromEnv = buildFromSupabaseEnv();
  if (fromEnv) return fromEnv;

  const raw =
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://postgres:postgres@localhost:54322/postgres");

  if (!raw) return undefined;
  return normalizeDatabaseUrl(raw.trim());
}

/** Extrai host sem parsear senha (evita quebrar URLs com @ na senha) */
export function extractConnectionHost(connectionString: string): string | null {
  const match = connectionString.match(/@([^/?]+)/);
  if (!match) return null;
  return match[1].split(":")[0] ?? null;
}

export function extractConnectionUser(connectionString: string): string | null {
  const match = connectionString.match(/\/\/([^:@/]+)(?::|@)/);
  return match?.[1] ?? null;
}

function replaceConnectionHost(connectionString: string, newHost: string): string {
  return connectionString.replace(/@([^/?]+)/, (_full, hostPort: string) => {
    const portMatch = hostPort.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : ":5432";
    return `@${newHost}${port}`;
  });
}

function ensurePoolerUsername(connectionString: string, projectRef: string): string {
  if (connectionString.includes(`postgres.${projectRef}`)) {
    return connectionString;
  }
  return connectionString.replace(/\/\/postgres(:|@)/, `//postgres.${projectRef}$1`);
}

/**
 * Supabase Direct (db.xxx.supabase.co) → IPv6 no Render → ENETUNREACH.
 * Só reescreve se SUPABASE_REGION estiver definida (não adivinhamos região).
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  if (process.env.DATABASE_POOLER_URL?.trim()) {
    console.log("[db] Using DATABASE_POOLER_URL");
    return process.env.DATABASE_POOLER_URL.trim();
  }

  const host = extractConnectionHost(connectionString);
  if (!host) return connectionString;

  const directMatch = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  if (!directMatch) return connectionString;

  const projectRef = directMatch[1];
  const region = process.env.SUPABASE_REGION ?? process.env.SUPABASE_POOLER_REGION;

  if (!region) {
    console.warn(
      `[db] URL Direct detectada (db.${projectRef}.supabase.co). ` +
        `No Render, cole a URI do Session pooler no DATABASE_URL ou defina SUPABASE_REGION.`
    );
    return connectionString;
  }

  const poolerHost = `aws-0-${region}.pooler.supabase.com`;
  console.log(`[db] Direct → Session pooler: ${poolerHost} (user postgres.${projectRef})`);

  let result = replaceConnectionHost(connectionString, poolerHost);
  result = ensurePoolerUsername(result, projectRef);

  if (!result.includes("sslmode=")) {
    result += result.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }

  return result;
}

export async function resolveConnectionString(connectionString: string): Promise<string> {
  if (process.env.DATABASE_HOST_IPV4) {
    return replaceConnectionHost(connectionString, process.env.DATABASE_HOST_IPV4);
  }

  const normalized = normalizeDatabaseUrl(connectionString);
  const hostname = extractConnectionHost(normalized);
  if (!hostname || /^\d+\.\d+\.\d+\.\d+$/.test(hostname)) {
    return normalized;
  }

  // Pooler Supabase já resolve IPv4 — não substituir por IP (quebra SNI/SSL)
  if (hostname.includes("pooler.supabase.com")) {
    return normalized;
  }

  try {
    const addresses = await dnsPromises.resolve4(hostname);
    if (addresses.length > 0) {
      console.log(`[db] Host ${hostname} → IPv4 ${addresses[0]}`);
      return replaceConnectionHost(normalized, addresses[0]);
    }
  } catch {
    try {
      const { address } = await dnsPromises.lookup(hostname, { family: 4 });
      console.log(`[db] Host ${hostname} → IPv4 ${address}`);
      return replaceConnectionHost(normalized, address);
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

export function logConnectionPreview(connectionString: string) {
  const host = extractConnectionHost(connectionString);
  const user = extractConnectionUser(connectionString);
  console.log(`[db] Host: ${host ?? "?"} | User: ${user ?? "?"}`);
}

export function formatDbError(error: unknown): string {
  if (!error || typeof error !== "object") return String(error);
  const err = error as Record<string, unknown>;
  const cause = err.cause as Record<string, unknown> | undefined;
  return [
    err.message,
    err.code,
    err.severity ?? err.severity_local,
    cause?.message,
    cause?.code,
  ]
    .filter(Boolean)
    .join(" | ");
}

export function supabaseConnectionHelp(error?: unknown): string {
  const msg = error ? formatDbError(error).toLowerCase() : "";

  if (msg.includes("enetunreach")) {
    return `
❌ ENETUNREACH (IPv6)
→ Supabase → Database → Connection string → Session pooler (porta 5432)
→ Cole a URI completa em DATABASE_URL no Render (não use Direct db.xxx.supabase.co)
`.trim();
  }

  if (msg.includes("tenant") || msg.includes("user not found")) {
    return `
❌ Tenant / user not found
→ Use a URI do Session pooler copiada do Supabase (não monte manualmente)
→ User deve ser postgres.SEU_PROJECT_REF (ex: postgres.abcdefgh)
→ Host deve ser aws-0-SUA-REGIAO.pooler.supabase.com (região do projeto)
→ Se usar Direct URL, defina SUPABASE_REGION=sa-east-1 (ou us-east-1, etc.)
`.trim();
  }

  if (msg.includes("password authentication failed")) {
    return `
❌ Senha incorreta
→ Supabase → Database → Reset database password (sem @ # % na senha)
→ No Render, use variáveis separadas (evita encoding):
    SUPABASE_PROJECT_REF=seu_ref
    SUPABASE_POOLER_HOST=aws-1-us-west-2.pooler.supabase.com
    SUPABASE_DB_PASSWORD=senha_nova
→ Apague DATABASE_URL antiga se usar SUPABASE_DB_PASSWORD
`.trim();
  }

  return `
❌ Falha ao conectar no Supabase

Checklist Render → Environment:
1. DATABASE_URL = URI do Session pooler (Supabase → Database → Session pooler → URI)
2. NÃO use Direct connection (db.xxx.supabase.co)
3. Senha com caracteres especiais → URL encode
4. Temporário: SKIP_DB_MIGRATE=1 sobe o app com dados mock (sem banco)

Exemplo:
postgresql://postgres.xxxxx:SENHA@aws-0-sa-east-1.pooler.supabase.com:5432/postgres
`.trim();
}
