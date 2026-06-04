import dns from "node:dns";
import postgres, { type Options } from "postgres";

// Render e outros hosts às vezes resolvem o DB para IPv6, que falha com ENETUNREACH
dns.setDefaultResultOrder("ipv4first");

export function getConnectionString(): string | undefined {
  return (
    process.env.DATABASE_URL ??
    (process.env.NODE_ENV === "production"
      ? undefined
      : "postgresql://postgres:postgres@localhost:54322/postgres")
  );
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
