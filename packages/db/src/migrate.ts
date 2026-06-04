import { migrate } from "drizzle-orm/postgres-js/migrator";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const connectionString =
  process.env.DATABASE_URL ?? "postgresql://postgres:postgres@localhost:54322/postgres";

async function run() {
  const client = postgres(connectionString, { max: 1 });
  const db = drizzle(client);
  await migrate(db, { migrationsFolder: path.join(__dirname, "../drizzle") });
  console.log("Migrations applied.");
  await client.end();
  process.exit(0);
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
