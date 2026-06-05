import dns from "node:dns";
import postgres, { type Options } from "postgres";

dns.setDefaultResultOrder("ipv4first");

export interface ConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
}

function trimSecret(value: string): string {
  return value.replace(/\r/g, "").trim();
}

/** Parseia URL mesmo quando a senha contém @ (usa lastIndexOf) */
export function parsePostgresUrl(raw: string): ConnectionConfig | null {
  const cleaned = raw.trim().replace(/^postgres(?:ql)?:\/\//i, "");
  const at = cleaned.lastIndexOf("@");
  if (at === -1) return null;

  const userPass = cleaned.slice(0, at);
  const rest = cleaned.slice(at + 1);

  const slash = rest.indexOf("/");
  const hostPort = slash === -1 ? rest : rest.slice(0, slash);
  const dbAndQuery = slash === -1 ? "" : rest.slice(slash + 1);
  const database = dbAndQuery.split("?")[0] || "postgres";

  const colon = userPass.indexOf(":");
  const username = decodeURIComponent(
    colon === -1 ? userPass : userPass.slice(0, colon)
  );
  const password = trimSecret(
    decodeURIComponent(colon === -1 ? "" : userPass.slice(colon + 1))
  );

  const portMatch = hostPort.match(/:(\d+)$/);
  const host = portMatch ? hostPort.slice(0, -portMatch[0].length) : hostPort;
  const port = portMatch ? parseInt(portMatch[1], 10) : 5432;

  if (!host || !username) return null;

  return { host, port, database, username, password };
}

function fromSupabaseEnv(): ConnectionConfig | null {
  const password = trimSecret(process.env.SUPABASE_DB_PASSWORD ?? "");
  const ref = trimSecret(process.env.SUPABASE_PROJECT_REF ?? "");
  const host =
    trimSecret(process.env.SUPABASE_POOLER_HOST ?? "") ||
    (process.env.SUPABASE_REGION
      ? `aws-0-${trimSecret(process.env.SUPABASE_REGION)}.pooler.supabase.com`
      : "");

  if (!password || !ref || !host) return null;

  console.log(
    `[db] Credenciais via SUPABASE_* (host: ${host}, user: postgres.${ref})`
  );

  return {
    host,
    port: 5432,
    database: "postgres",
    username: `postgres.${ref}`,
    password,
  };
}

function fixPoolerUsername(config: ConnectionConfig): ConnectionConfig {
  if (
    config.host.includes("pooler.supabase.com") &&
    config.username === "postgres" &&
    process.env.SUPABASE_PROJECT_REF?.trim()
  ) {
    const ref = trimSecret(process.env.SUPABASE_PROJECT_REF!);
    console.log(`[db] Corrigindo user → postgres.${ref}`);
    return { ...config, username: `postgres.${ref}` };
  }
  return config;
}

export function getConnectionConfig(): ConnectionConfig | undefined {
  const fromEnv = fromSupabaseEnv();
  if (fromEnv) return fromEnv;

  const raw = process.env.DATABASE_URL?.trim();
  if (!raw) return undefined;

  const parsed = parsePostgresUrl(raw);
  if (!parsed) {
    console.warn("[db] Não foi possível parsear DATABASE_URL");
    return undefined;
  }

  return fixPoolerUsername(parsed);
}

export function buildConnectionString(config: ConnectionConfig): string {
  const user = encodeURIComponent(config.username);
  const pass = encodeURIComponent(config.password);
  const ssl = config.host.includes("supabase") ? "?sslmode=require" : "";
  return `postgresql://${user}:${pass}@${config.host}:${config.port}/${config.database}${ssl}`;
}

export function getConnectionString(): string | undefined {
  if (process.env.DATABASE_POOLER_URL?.trim()) {
    return process.env.DATABASE_POOLER_URL.trim();
  }
  const config = getConnectionConfig();
  return config ? buildConnectionString(config) : undefined;
}

export function createPostgresClient(max = 10) {
  const config = getConnectionConfig();
  if (!config) {
    throw new Error("DATABASE_URL ou SUPABASE_* não configurados");
  }

  const needsSsl =
    config.host.includes("supabase") ||
    process.env.DATABASE_URL?.includes("sslmode=require");

  const options: Options<Record<string, never>> = {
    host: config.host,
    port: config.port,
    database: config.database,
    username: config.username,
    password: config.password,
    max,
    prepare: false,
    connect_timeout: 30,
    idle_timeout: 20,
  };

  if (needsSsl) {
    options.ssl = { rejectUnauthorized: false };
  }

  return postgres(options);
}

export function logConnectionPreview() {
  const config = getConnectionConfig();
  if (!config) {
    console.log("[db] Sem configuração de banco");
    return;
  }
  console.log(
    `[db] Host: ${config.host}:${config.port} | User: ${config.username} | Senha: ${config.password ? `***(${config.password.length} chars)` : "VAZIA"}`
  );
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
❌ Não conectou ao PostgreSQL (rede)

Use Session pooler (porta 5432), não Direct connection.
`.trim();
  }

  if (
    msg.includes("password authentication failed") ||
    msg.includes("28p01")
  ) {
    return `
❌ Senha do banco incorreta

No Render, APAGUE DATABASE_URL e use só estas 3 variáveis:

  SUPABASE_PROJECT_REF=tbwvsbpabadfjsjofgph
  SUPABASE_POOLER_HOST=aws-1-us-west-2.pooler.supabase.com
  SUPABASE_DB_PASSWORD=<senha resetada no Supabase>

Supabase → Database → Reset database password (senha simples: Abc12345)
Depois cole a senha em SUPABASE_DB_PASSWORD (sem aspas, sem espaço no fim).
Redeploy.
`.trim();
  }

  if (msg.includes("tenant") || msg.includes("user not found")) {
    return `
❌ Usuário do pooler incorreto — deve ser postgres.SEU_PROJECT_REF
`.trim();
  }

  return `
❌ Falha ao conectar. Use SUPABASE_PROJECT_REF + SUPABASE_POOLER_HOST + SUPABASE_DB_PASSWORD
ou SKIP_DB_MIGRATE=1 para subir sem banco temporariamente.
`.trim();
}
