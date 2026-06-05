import postgres from "postgres";

function getDatabaseUrl(): string | undefined {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) return undefined;

  if (url.includes("supabase.co") && !url.includes("sslmode=")) {
    return url.includes("?") ? `${url}&sslmode=require` : `${url}?sslmode=require`;
  }

  return url;
}

export function createPostgresClient(max = 10) {
  const url = getDatabaseUrl();
  if (!url) {
    throw new Error("DATABASE_URL não configurada");
  }

  return postgres(url, {
    max,
    prepare: false,
    ssl: url.includes("supabase.co") || url.includes("sslmode=require")
      ? "require"
      : false,
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
    console.log(
      `[db] Direct → ${parsed.hostname}:${parsed.port || "5432"} | user: ${parsed.username}`
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
❌ Senha incorreta na DATABASE_URL

Supabase → Project Settings → Database → Reset database password
Depois: Database → Connection string → Direct connection → URI
Cole a URI completa em DATABASE_URL no Render.
`.trim();
  }

  if (msg.includes("enetunreach") || msg.includes("econnrefused")) {
    return `
❌ Render não alcançou o host (comum com Direct IPv6)

No Supabase: Settings → Database → habilite "IPv4 add-on" se disponível,
ou use a connection string Direct com host IPv4 que o Supabase fornece.
`.trim();
  }

  return `❌ Erro de conexão. Verifique DATABASE_URL no Render.`;
}
