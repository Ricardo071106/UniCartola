import postgres from "postgres";

function parsePostgresUrl(raw: string) {
  const cleaned = raw.replace(/^postgres(?:ql)?:\/\//i, "");
  const at = cleaned.lastIndexOf("@");
  if (at === -1) return null;

  const userPass = cleaned.slice(0, at);
  const rest = cleaned.slice(at + 1);
  const colon = userPass.indexOf(":");
  const username = decodeURIComponent(
    colon === -1 ? userPass : userPass.slice(0, colon)
  );
  const password = decodeURIComponent(
    colon === -1 ? "" : userPass.slice(colon + 1)
  );

  const slash = rest.indexOf("/");
  const hostPort = slash === -1 ? rest.split("?")[0] : rest.slice(0, slash).split("?")[0];
  const database =
    slash === -1 ? "postgres" : rest.slice(slash + 1).split("?")[0] || "postgres";

  const portMatch = hostPort.match(/:(\d+)$/);
  const host = portMatch ? hostPort.slice(0, -portMatch[0].length) : hostPort;
  const port = portMatch ? portMatch[1] : "5432";

  return { username, password, host, port, database };
}

function buildUrl(parts: {
  username: string;
  password: string;
  host: string;
  port: string;
  database: string;
}) {
  const user = encodeURIComponent(parts.username);
  const pass = encodeURIComponent(parts.password);
  return `postgresql://${user}:${pass}@${parts.host}:${parts.port}/${parts.database}?sslmode=require`;
}

function isDirectSupabaseUrl(url: string): boolean {
  return url.includes("db.") && url.includes(".supabase.co");
}

export function isOnRender(): boolean {
  return (
    process.env.RENDER === "true" ||
    !!process.env.RENDER_SERVICE_ID ||
    !!process.env.RENDER_SERVICE_NAME
  );
}

function getPoolerHost(): string | undefined {
  const explicit = process.env.SUPABASE_POOLER_HOST?.trim();
  if (explicit) return explicit;

  let region = process.env.SUPABASE_REGION?.trim();
  if (!region && isOnRender()) {
    region = "us-west-2";
    console.warn(
      "[db] SUPABASE_REGION ausente no Render — usando fallback us-west-2"
    );
  }
  if (!region) return undefined;

  // Projetos novos Supabase usam aws-1; antigos aws-0
  const prefix = process.env.SUPABASE_POOLER_PREFIX?.trim() ?? "1";
  return `aws-${prefix}-${region}.pooler.supabase.com`;
}

function convertDirectToPooler(url: string, poolerHost: string): string {
  const parsed = parsePostgresUrl(url);
  if (!parsed) return url;

  const refMatch = parsed.host.match(/^db\.([a-z0-9]+)\.supabase\.co$/i);
  if (!refMatch) return url;

  const ref = refMatch[1];
  const username = parsed.username.includes(".")
    ? parsed.username
    : `postgres.${ref}`;

  console.log(
    `[db] Direct (IPv6) → Session pooler: ${poolerHost} | user: ${username}`
  );

  return buildUrl({
    username,
    password: parsed.password,
    host: poolerHost,
    port: "5432",
    database: parsed.database,
  });
}

function getDatabaseUrl(): string | undefined {
  let url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  if (isDirectSupabaseUrl(url)) {
    const poolerHost = getPoolerHost();
    if (poolerHost) {
      url = convertDirectToPooler(url, poolerHost);
    } else if (isOnRender()) {
      console.error(`
[db] ERRO: Direct connection não funciona no Render (IPv6).

Adicione no Render UMA destas opções:

  A) SUPABASE_REGION=us-west-2
     (mantém DATABASE_URL Direct — converte automaticamente)

  B) SUPABASE_POOLER_HOST=aws-1-us-west-2.pooler.supabase.com

  C) Troque DATABASE_URL pela URI do Session pooler (Supabase → Database → Session pooler)
`);
    }
  }

  if (url.includes("supabase") && !url.includes("sslmode=")) {
    url += url.includes("?") ? "&sslmode=require" : "?sslmode=require";
  }

  return url;
}

export function createPostgresClient(max = 10) {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL não configurada");
  }

  if (isDirectSupabaseUrl(url) && isOnRender()) {
    throw new Error(
      "DATABASE_URL Direct no Render sem SUPABASE_REGION ou SUPABASE_POOLER_HOST"
    );
  }

  return postgres(url, {
    max,
    prepare: false,
    ssl: url.includes("supabase") ? "require" : false,
    connect_timeout: 30,
  });
}

/** Transaction pooler (:6543) — não compete com o limite de sessões do app (:5432). */
export function getScriptDatabaseUrl(): string {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL não configurada");
  }

  if (url.includes(".pooler.supabase.com") && !url.includes(":6543")) {
    const txUrl = url.replace(/:5432(?=\/|$)/, ":6543");
    if (txUrl !== url) {
      console.log(
        "[db] Script: transaction pooler :6543 (não usa pool de sessões do app)"
      );
      return txUrl;
    }
  }

  return url;
}

export function createScriptPostgresClient() {
  const url = getScriptDatabaseUrl();

  if (isDirectSupabaseUrl(url) && isOnRender()) {
    throw new Error(
      "DATABASE_URL Direct no Render sem SUPABASE_REGION ou SUPABASE_POOLER_HOST"
    );
  }

  return postgres(url, {
    max: 1,
    prepare: false,
    ssl: url.includes("supabase") ? "require" : false,
    connect_timeout: 60,
    idle_timeout: 10,
  });
}

export function logConnectionInfo() {
  const url = getDatabaseUrl();
  if (!url) {
    console.log("[db] DATABASE_URL não definida");
    return;
  }

  try {
    const parsed = new URL(url.replace(/^postgresql:\/\//, "https://"));
    const mode = parsed.hostname.includes("pooler")
      ? "Session pooler"
      : "Direct";
    console.log(
      `[db] ${mode} → ${parsed.hostname}:${parsed.port || "5432"} | user: ${parsed.username}`
    );
  } catch {
    console.log("[db] DATABASE_URL configurada");
  }
}

export function connectionHelp(error?: unknown): string {
  const raw =
    error && typeof error === "object" && "message" in error
      ? String((error as Error).message)
      : String(error ?? "");
  const msg = raw.toLowerCase();

  if (
    msg.includes("direct no render") ||
    msg.includes("supabase_region")
  ) {
    return `
❌ DATABASE_URL Direct não funciona no Render.

No Render → Environment, adicione:
  SUPABASE_REGION=us-west-2

Ou troque DATABASE_URL pela URI do Session pooler (Supabase → Database → Session pooler, porta 5432).
`.trim();
  }

  if (msg.includes("28p01") || msg.includes("password authentication")) {
    return `❌ Senha incorreta — reset em Supabase → Database → Reset password`;
  }

  if (
    msg.includes("enetunreach") ||
    msg.includes("econnrefused") ||
    msg.includes("getaddrinfo") ||
    msg.includes("timeout") ||
    msg.includes("etimedout")
  ) {
    return `
❌ Não conseguiu conectar ao Postgres.

No Render:
  1. Confirme DATABASE_URL (Session pooler, porta 5432)
  2. Adicione SUPABASE_REGION=us-west-2 (se usar URL Direct)
  3. Verifique se o projeto Supabase não está pausado

Erro: ${raw}
`.trim();
  }

  if (
    msg.includes("emaxconnsession") ||
    msg.includes("max clients reached")
  ) {
    return `
❌ Pool de sessões do Supabase cheio (app + scrape usando as 15 conexões).

Scripts (db:cleanup, ndu:sync) agora usam transaction pooler :6543.
Se ainda falhar, aguarde 30s e tente de novo, ou pause o scrape:
  SKIP_NDU_SCRAPE=1 no Render → redeploy → rode o script → remova SKIP_NDU_SCRAPE.

Erro: ${raw}
`.trim();
  }

  if (msg.includes("does not exist") && msg.includes("athletics")) {
    return `
❌ Banco sem tabelas, mas migrations antigas registradas.

O deploy vai corrigir automaticamente na próxima versão.
Ou rode no Supabase SQL Editor:
  DROP SCHEMA IF EXISTS drizzle CASCADE;
Depois redeploy.
`.trim();
  }

  if (msg.includes("already exists") || msg.includes("duplicate")) {
    return `
❌ Erro na migration (objeto já existe no banco).

Erro: ${raw}

Tente no Supabase SQL Editor ou localmente:
  npm run db:migrate
`.trim();
  }

  return `❌ Erro de banco: ${raw || "verifique DATABASE_URL no Render"}`;
}
