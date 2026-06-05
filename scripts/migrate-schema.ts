import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import {
  createPostgresClient,
  logConnectionInfo,
  connectionHelp,
} from "../src/lib/db/connection";

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log("[db] DATABASE_URL ausente — pulando migrate.");
    return;
  }

  logConnectionInfo();
  const client = createPostgresClient(1);
  const db = drizzle(client);

  try {
    await client`SELECT 1`;
    console.log("[db] Conectado. Aplicando migrations...");
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[db] OK");
  } catch (error) {
    console.error("[db]", error);
    console.error("\n" + connectionHelp(error));
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
