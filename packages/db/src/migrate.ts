import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import path from "path";
import { fileURLToPath } from "url";
import { createPostgresClient, getConnectionString } from "./connection";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function run() {
  const connectionString = getConnectionString();
  if (!connectionString) {
    console.error(
      "DATABASE_URL não definida. No Render: Postgres → vincule ao Web Service (Environment → Add from database) e use a Internal Database URL."
    );
    process.exit(1);
  }

  const client = createPostgresClient(connectionString, 1);
  const db = drizzle(client);

  try {
    await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
    console.log("Migrations applied.");
  } catch (e) {
    const err = e as { code?: string; cause?: { code?: string } };
    if (err.code === "ENETUNREACH" || err.cause?.code === "ENETUNREACH") {
      console.error(
        "\nErro de rede (IPv6). No Render use a Internal Database URL do Postgres Render,\n" +
          "não a External. Se usar Supabase, use a connection string do Pooler (porta 6543).\n"
      );
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
