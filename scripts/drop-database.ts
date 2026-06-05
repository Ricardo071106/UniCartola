/**
 * Apaga TODAS as tabelas, enums e dados do Postgres (Supabase).
 *
 * Uso:
 *   DATABASE_URL="postgresql://..." npx tsx scripts/drop-database.ts
 *
 * No Supabase Dashboard também funciona: SQL Editor → DROP SCHEMA public CASCADE; CREATE SCHEMA public;
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

  console.log("⚠️  Apagando banco por completo...");

  await sql.unsafe(`
    DROP SCHEMA public CASCADE;
    CREATE SCHEMA public;
    GRANT ALL ON SCHEMA public TO postgres;
    GRANT ALL ON SCHEMA public TO public;
  `);

  console.log("✅ Banco zerado. Schema public recriado vazio.");
  await sql.end({ timeout: 5 });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
