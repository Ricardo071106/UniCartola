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

/** Re-encoda senha na URL (evita quebrar com # @ % mal escapados) */
function rebuildPostgresUrl(raw: string): string {
  const match = raw.match(
    /^postgres(?:ql)?:\/\/([^:@/]*)(?::([^@]*))?@([^/?#]+)(?:\/([^?#]*))?(.*)?$/i
  );
  if (!match) return raw;

  const [, user, password = "", hostPort, database = "postgres", query = ""] =
    match;
  let decodedPass = password;
  try {
    decodedPass = decodeURIComponent(password);
  } catch {
    decodedPass = password;
  }

  const encodedPass = encodeURIComponent(decodedPass);
  const db = database || "postgres";
  let qs = query || "";
  if (!qs.includes("sslmode=") && hostPort.includes("supabase")) {
    qs = qs ? `${qs}&sslmode=require` : "?sslmode=require";
  }

  return `postgresql://${user}:${encodedPass}@${hostPort}/${db}${qs}`;
}

export function getConnectionString(): string | undefined {
  // SUPABASE_* tem prioridade — evita senha quebrada na DATABASE_URL
  const fromSupabase = buildFromSupabaseEnv();
  if (fromSupabase) return fromSupabase;

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  const rebuilt = rebuildPostgresUrl(raw);
  const host = extractConnectionHost(rebuilt);
  const user = extractConnectionUser(rebuilt);

  // Pooler exige postgres.PROJECT_REF — corrige se veio só "postgres"
  if (
    host?.includes("pooler.supabase.com") &&
    user === "postgres" &&
    process.env.SUPABASE_PROJECT_REF?.trim()
  ) {
    const ref = process.env.SUPABASE_PROJECT_REF.trim();
    console.log(`[db] Corrigindo user → postgres.${ref}`);
    return normalizeDatabaseUrl(
      rebuilt.replace(/\/\/postgres:/, `//postgres.${ref}:`)
    );
  }

  return normalizeDatabaseUrl(rebuilt);
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
    // Supabase pooler no Render: ssl "require" + relaxa verificação de cert
    options.ssl = { rejectUnauthorized: false };
  }

  return postgres(connectionString, options);
}

export async function testDatabaseConnection(): Promise<void> {
  const url = getConnectionString();
  if (!url) throw new Error("DATABASE_URL não definida");

  const client = createPostgresClient(url, 1);
  try {
    await client`SELECT 1 as ok`;
  } finally {
    await client.end({ timeout: 5 });
  }
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

  if (
    msg.includes("enetunreach") ||
    msg.includes("econnrefused") ||
    msg.includes("etimedout") ||
    msg.includes("timeout")
  ) {
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

  if (
    msg.includes("tenant") ||
    msg.includes("user not found") ||
    msg.includes("xx000")
  ) {
    return `
❌ Usuário/tenant incorreto no pooler

Use a URI completa copiada do Supabase (Session pooler).
O usuário deve ser postgres.SEU_PROJECT_REF (ex: postgres.abcdefgh).
`.trim();
  }

  if (
    msg.includes("password authentication failed") ||
    msg.includes("28p01")
  ) {
    return `
❌ Senha do banco incorreta (não é a anon key do Supabase!)

Passo a passo:
1. Supabase → Project Settings → Database → Reset database password
2. Escolha uma senha SIMPLES (só letras e números, sem @ # %)
3. Database → Connection string → Session pooler → URI → copie TUDO
4. Render → Environment → DATABASE_URL → cole a URI nova → Save
5. Redeploy

OU apague DATABASE_URL e use no Render:
  SUPABASE_PROJECT_REF=tbwvsbpabadfjsjofgph
  SUPABASE_POOLER_HOST=aws-1-us-west-2.pooler.supabase.com
  SUPABASE_DB_PASSWORD=senha_que_voce_resetou
`.trim();
  }

  return `
❌ Falha ao conectar no banco

1. DATABASE_URL = Session pooler do Supabase (porta 5432)
2. Não use Direct connection
3. Temporário: SKIP_DB_MIGRATE=1 (app sobe sem sincronizar schema)
`.trim();
}
