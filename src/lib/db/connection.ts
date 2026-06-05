import dns from "node:dns";
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
  console.log(
    `[db] URL montada via SUPABASE_* (host: ${host}, user: postgres.${ref})`
  );
  return `postgresql://postgres.${ref}:${encoded}@${host}:5432/postgres?sslmode=require`;
}

export function extractConnectionHost(
  connectionString: string
): string | null {
  const match = connectionString.match(/@([^/?]+)/);
  if (!match) return null;
  return match[1].split(":")[0] ?? null;
}

export function extractConnectionUser(
  connectionString: string
): string | null {
  const match = connectionString.match(/\/\/([^:@/]+)(?::|@)/);
  return match?.[1] ?? null;
}

function replaceConnectionHost(
  connectionString: string,
  newHost: string
): string {
  return connectionString.replace(/@([^/?]+)/, (_full, hostPort: string) => {
    const portMatch = hostPort.match(/:(\d+)$/);
    const port = portMatch ? `:${portMatch[1]}` : ":5432";
    return `@${newHost}${port}`;
  });
}

function ensurePoolerUsername(
  connectionString: string,
  projectRef: string
): string {
  if (connectionString.includes(`postgres.${projectRef}`)) {
    return connectionString;
  }
  return connectionString.replace(
    /\/\/postgres(:|@)/,
    `//postgres.${projectRef}$1`
  );
}

/**
 * Direct (db.xxx.supabase.co) usa IPv6 — falha no Render (ENETUNREACH).
 * Reescreve para Session pooler quando SUPABASE_REGION está definida.
 */
export function normalizeDatabaseUrl(connectionString: string): string {
  if (process.env.DATABASE_POOLER_URL?.trim()) {
    console.log("[db] Usando DATABASE_POOLER_URL");
    return process.env.DATABASE_POOLER_URL.trim();
  }

  const host = extractConnectionHost(connectionString);
  if (!host) return connectionString;

  const directMatch = host.match(/^db\.([a-z0-9]+)\.supabase\.co$/);
  if (!directMatch) {
    let result = connectionString;
    if (
      host.includes("supabase") &&
      !result.includes("sslmode=")
    ) {
      result += result.includes("?") ? "&sslmode=require" : "?sslmode=require";
    }
    return result;
  }

  const projectRef = directMatch[1];
  const region =
    process.env.SUPABASE_REGION ?? process.env.SUPABASE_POOLER_REGION;

  if (!region) {
    console.warn(
      `[db] URL Direct (db.${projectRef}.supabase.co) detectada. ` +
        `No Render use Session pooler no DATABASE_URL ou defina SUPABASE_REGION.`
    );
    return connectionString;
  }

  const poolerHost = `aws-0-${region}.pooler.supabase.com`;
  console.log(
    `[db] Direct → Session pooler: ${poolerHost} (user postgres.${projectRef})`
  );

  let result = replaceConnectionHost(connectionString, poolerHost);
  result = ensurePoolerUsername(result, projectRef);

  if (!result.includes("sslmode=")) {
    result += result.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }

  return result;
}

export function getConnectionString(): string | undefined {
  const fromSupabase = buildFromSupabaseEnv();
  if (fromSupabase) return fromSupabase;

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  return normalizeDatabaseUrl(raw);
}

export function createPostgresClient(connectionString: string, max = 10) {
  const needsSsl =
    connectionString.includes("supabase") ||
    connectionString.includes("sslmode=require");

  const options: Options<Record<string, never>> = {
    max,
    prepare: false,
    connect_timeout: 30,
    idle_timeout: 20,
  };

  if (needsSsl) {
    options.ssl = "require";
  }

  return postgres(connectionString, options);
}

export function logConnectionPreview(connectionString: string) {
  const host = extractConnectionHost(connectionString);
  const user = extractConnectionUser(connectionString);
  console.log(`[db] Host: ${host ?? "?"} | User: ${user ?? "?"}`);
}

export function supabaseConnectionHelp(error?: unknown): string {
  const parts: string[] = [];
  if (error && typeof error === "object" && "message" in error) {
    parts.push(String((error as Error).message));
  }
  const msg = parts.join(" ").toLowerCase();

  if (msg.includes("enetunreach") || msg.includes("econnrefused")) {
    return `
❌ Não conectou ao PostgreSQL (rede/IPv6)

No Supabase: Database → Connection string → Session pooler → URI (porta 5432)
Cole em DATABASE_URL no Render. NÃO use "Direct connection" (db.xxx.supabase.co).

Ou defina separado (senha sem @ # %):
  SUPABASE_PROJECT_REF=seu_ref
  SUPABASE_POOLER_HOST=aws-0-sa-east-1.pooler.supabase.com
  SUPABASE_DB_PASSWORD=sua_senha
`.trim();
  }

  if (msg.includes("tenant") || msg.includes("user not found")) {
    return `
❌ Usuário/tenant incorreto no pooler

Use a URI completa copiada do Supabase (Session pooler).
O usuário deve ser postgres.SEU_PROJECT_REF (ex: postgres.abcdefgh).
`.trim();
  }

  if (msg.includes("password authentication failed")) {
    return `
❌ Senha incorreta

Supabase → Database → Reset database password.
Se a senha tiver caracteres especiais, use SUPABASE_DB_PASSWORD (sem URL encode manual).
`.trim();
  }

  return `
❌ Falha ao conectar no banco

1. DATABASE_URL = Session pooler do Supabase (porta 5432)
2. Não use Direct connection
3. Temporário: SKIP_DB_MIGRATE=1 (app sobe sem sincronizar schema)
`.trim();
}
