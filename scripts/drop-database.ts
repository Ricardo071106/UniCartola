/**
 * Limpa TODOS os dados do Postgres — apaga tabelas e enums, recria schema vazio.
 * Depois rode: npm run db:migrate && RUN_DB_SEED=1 npm run db:seed
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npm run db:drop
 */
import "dotenv/config";
import postgres from "postgres";

async function main() {
  const url = process.env.DATABASE_URL?.trim();
  if (!url) {
    console.error("DATABASE_URL é obrigatória.");
    process.exit(1);
  }

  const sql = postgres(url, { max: 1, ssl: "require" });

  console.log("⚠️  Limpando banco (DROP SCHEMA public CASCADE)...");

  await sql.unsafe(`
    DROP SCHEMA IF EXISTS drizzle CASCADE;
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);

  console.log("✅ Banco zerado (inclui histórico drizzle). Rode: npm run db:migrate");
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
