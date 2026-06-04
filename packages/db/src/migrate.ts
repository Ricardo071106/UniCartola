import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import { sql } from "drizzle-orm";
import path from "path";
import { fileURLToPath } from "url";
import {
  createPostgresClientResolved,
  getConnectionString,
  logConnectionPreview,
  formatDbError,
  supabaseConnectionHelp,
} from "./connection";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error(
      "DATABASE_URL não definida. Cole a URI do Session pooler do Supabase no Render."
    );
    process.exit(1);
  }

  logConnectionPreview(connectionString);

  const client = await createPostgresClientResolved(connectionString, 1);
  const db = drizzle(client);

  try {
    await db.execute(sql`SELECT 1`);
    console.log("[db] Conexão OK");

    await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
    console.log("Migrations applied.");
  } catch (e) {
    console.error("[db] Erro:", formatDbError(e));
    console.error(supabaseConnectionHelp(e));
    throw e;
  } finally {
    await client.end();
  }
  process.exit(0);
}

run().catch((e) => {
  console.error(formatDbError(e));
  process.exit(1);
});
