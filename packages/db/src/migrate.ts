import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import { fileURLToPath } from "url";
import { createPostgresClientResolved, getConnectionString } from "./connection";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error(
      "DATABASE_URL não definida. No Render: Postgres → Environment → Add from database (Internal URL)."
    );
    process.exit(1);
  }

  const resolved = await resolveConnectionString(connectionString);
  try {
    const host = new URL(resolved.replace(/^postgresql:\/\//, "postgres://")).hostname;
    console.log(`[db] Conectando ao host: ${host}`);
  } catch {
    /* ignore parse */
  }

  const client = await createPostgresClientResolved(connectionString, 1);
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
    console.log("Migrations applied.");
  } catch (e) {
    const err = e as { code?: string; cause?: { code?: string } };
    if (err.code === "ENETUNREACH" || err.cause?.code === "ENETUNREACH") {
      console.error(`
❌ Ainda não consegue alcançar o banco (IPv6).

No Render:
1. Crie um PostgreSQL no mesmo dashboard
2. No Web Service → Environment → remova DATABASE_URL manual
3. Clique "Add from database" e selecione esse Postgres
4. Redeploy

Se usar Supabase: Database → Connection string → "Session pooler" → porta 6543
Opcional: defina DATABASE_HOST_IPV4 com o IP IPv4 do host (painel do provedor)
`);
    }
    throw e;
  } finally {
    await client.end();
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
