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

  try {
    const host = new URL(
      connectionString.replace(/^postgresql:\/\//, "postgres://")
    ).hostname;
    console.log(`[db] Conectando ao host: ${host}`);
  } catch {
    /* ignore */
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
❌ Não alcança o banco (IPv6/rede).

No Render:
1. Web Service → Environment → apague DATABASE_URL manual
2. "Add from database" → selecione o Postgres do Render
3. Redeploy

Supabase: use Session pooler porta 6543
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
