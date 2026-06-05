import postgres from "postgres";

/** Extrai user, senha, host do postgres URL (senha pode conter @) */
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

/** Direct (db.xxx.supabase.co) → Session pooler (IPv4, funciona no Render) */
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

  const poolerHost = process.env.SUPABASE_POOLER_HOST?.trim();
  const isDirect = url.includes("db.") && url.includes(".supabase.co");

  // Render não alcança IPv6 do Direct — converte automaticamente se pooler host definido
  if (isDirect && poolerHost) {
    url = convertDirectToPooler(url, poolerHost);
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

  const isPooler = url.includes("pooler.supabase.com");

  return postgres(url, {
    max,
    prepare: false, // obrigatório no pooler Supabase
    ssl: url.includes("supabase") ? "require" : false,
    connect_timeout: 30,
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
  const msg =
    error && typeof error === "object" && "message" in error
      ? String((error as Error).message).toLowerCase()
      : "";

  if (msg.includes("28p01") || msg.includes("password authentication")) {
    return `
❌ Senha incorreta

Supabase → Database → Reset database password
Use a senha nova na DATABASE_URL (ou Session pooler URI).
`.trim();
  }

  if (msg.includes("enetunreach")) {
    return `
❌ ENETUNREACH — Render não acessa Direct connection (IPv6)

SOLUÇÃO: no Render, adicione esta variável junto com DATABASE_URL:

  SUPABASE_POOLER_HOST=aws-1-us-west-2.pooler.supabase.com

Ou troque DATABASE_URL pela URI do Session pooler:
  Supabase → Database → Connection string → Session pooler → URI

postgresql://postgres.tbwvsbpabadfjsjofgph:SENHA@aws-1-us-west-2.pooler.supabase.com:5432/postgres
`.trim();
  }

  return `❌ Erro de conexão. Verifique DATABASE_URL no Render.`;
}
