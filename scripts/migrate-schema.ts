import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import {
  createPostgresClient,
  logConnectionPreview,
  supabaseConnectionHelp,
} from "../src/lib/db/connection";

async function main() {
  logConnectionPreview();

  let client;
  try {
    client = createPostgresClient(1);
  } catch {
    console.log("[db] Sem credenciais — pulando migrate.");
    return;
  }

  const db = drizzle(client);

  try {
    console.log("[db] Testando conexão...");
    await client`SELECT 1 as ok`;
    console.log("[db] Conexão OK. Aplicando migrations...");
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[db] Migrations aplicadas.");
  } catch (error) {
    console.error("[db] Erro:", error);
    console.error("\n" + supabaseConnectionHelp(error));
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
