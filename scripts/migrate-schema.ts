import "dotenv/config";
import { drizzle } from "drizzle-orm/postgres-js";
import { migrate } from "drizzle-orm/postgres-js/migrator";
import path from "node:path";
import type postgres from "postgres";
import {
  createPostgresClient,
  logConnectionInfo,
  connectionHelp,
} from "../src/lib/db/connection";

async function coreTablesExist(client: postgres.Sql): Promise<boolean> {
  const rows = await client<{ exists: boolean }[]>`
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = 'athletics'
    ) AS exists
  `;
  return rows[0]?.exists === true;
}

async function resetMigrationStateIfNeeded(client: postgres.Sql) {
  const hasTables = await coreTablesExist(client);
  if (hasTables) return;

  const migrationRows = await client<{ count: string }[]>`
    SELECT COUNT(*)::text AS count
    FROM information_schema.tables
    WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'
  `;

  const hasMigrationTable = Number(migrationRows[0]?.count ?? 0) > 0;
  if (!hasMigrationTable) return;

  console.warn(
    "[db] Tabelas do app ausentes, mas histórico drizzle existe — resetando para rodar 0000_init"
  );
  await client.unsafe(`DROP SCHEMA IF EXISTS drizzle CASCADE`);
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log("[db] DATABASE_URL ausente — pulando migrate.");
    return;
  }

  logConnectionInfo();
  console.log(
    `[db] Render=${process.env.RENDER ?? "unset"} | SUPABASE_REGION=${process.env.SUPABASE_REGION ?? "unset"}`
  );

  let client;
  try {
    client = createPostgresClient(1);
  } catch (error) {
    console.error("[db] Falha ao criar cliente:", error);
    console.error("\n" + connectionHelp(error));
    process.exit(1);
  }

  const db = drizzle(client);

  try {
    await client`SELECT 1`;
    await resetMigrationStateIfNeeded(client);
    console.log("[db] Conectado. Aplicando migrations...");
    await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
    console.log("[db] Migrations OK");
  } catch (error) {
    console.error("[db] Falha:", error);
    console.error("\n" + connectionHelp(error));
    process.exit(1);
  } finally {
    await client.end({ timeout: 5 });
  }
}

main();
