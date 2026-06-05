/**
 * Remove dados de demonstração (seed) e registros obsoletos, preservando
 * usuários reais (com email/senha) e dados sincronizados da NDU.
 *
 * Uso:
 *   npm run db:cleanup              # dry-run (só contagens)
 *   npm run db:cleanup -- --confirm   # executa limpeza
 *   npm run db:cleanup -- --confirm --sync  # limpa + scrape NDU
 */
import "dotenv/config";
import { requireDb } from "../src/lib/db";
import {
  matchesImportQueue,
  players,
  scrapeRuns,
  statisticsImportQueue,
} from "../src/lib/db/schema";
import { sql } from "drizzle-orm";
import { logConnectionInfo } from "../src/lib/db/connection";
import { runFullScrape } from "../src/lib/ndu/sync";
import {
  cleanupDemoData,
  getCleanupCounts,
  SEED_UNIVERSITY_SHORT_NAMES,
} from "./cleanup-database-lib";

const args = new Set(process.argv.slice(2));
const confirm = args.has("--confirm");
const withSync = args.has("--sync");

async function report() {
  const db = requireDb();
  const counts = await getCleanupCounts(db);

  const [importQueue] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(matchesImportQueue);
  const [statsQueue] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(statisticsImportQueue);
  const [playersCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(players);
  const [scrapeCount] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(scrapeRuns);

  console.log("\n[cleanup] Resumo (dry-run):");
  console.log(`  Usuários demo a remover: ${counts.demoUserIds.length}`);
  console.log(`  Usuários reais a preservar: ${counts.realUsers}`);
  console.log(`  Jogos demo/órfãos a remover: ${counts.demoMatchIds.length}`);
  console.log(`  Jogos NDU a preservar: ${counts.nduMatches}`);
  console.log(
    `  Estatísticas NDU fora de ${counts.activeYear} a remover: ${counts.oldStats}`
  );
  console.log(`  Atléticas demo a remover: ${counts.demoAthletics}`);
  console.log(
    `  Universidades demo a remover: ${counts.demoUniIds.length} (${SEED_UNIVERSITY_SHORT_NAMES.join(", ")})`
  );
  console.log(`  Fila import jogos a limpar: ${importQueue?.count ?? 0}`);
  console.log(`  Fila import stats a limpar: ${statsQueue?.count ?? 0}`);
  console.log(`  Players (não usados) a limpar: ${playersCount?.count ?? 0}`);
  console.log(`  Histórico scrape_runs a podar: ${scrapeCount?.count ?? 0}`);

  if (!confirm) {
    console.log(
      "\n[cleanup] Nada foi alterado. Rode com --confirm para executar."
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.error("DATABASE_URL é obrigatória.");
    process.exit(1);
  }

  logConnectionInfo();
  await report();

  if (!confirm) return;

  console.log("\n[cleanup] Executando limpeza...");
  await cleanupDemoData(requireDb());
  console.log("[cleanup] Concluído.");

  if (withSync) {
    console.log("[cleanup] Sincronizando NDU...");
    const result = await runFullScrape();
    console.log(
      `[cleanup] NDU: ${result.athleticsSynced ?? 0} atléticas, ${result.boletimMatches ?? 0} jogos boletim, ${result.created} criados, ${result.statsSynced ?? 0} estatísticas`
    );
    if (result.errors.length) {
      console.warn("[cleanup] Erros NDU:", result.errors.slice(0, 5));
    }
  }
}

main().catch((e) => {
  console.error("[cleanup]", e);
  process.exit(1);
});
