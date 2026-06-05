import "dotenv/config";
import { requireDb } from "../src/lib/db";
import {
  sports,
  universities,
  seasons,
  competitions,
  matches,
} from "../src/lib/db/schema";
import { like } from "drizzle-orm";
import { runFullScrape } from "../src/lib/ndu/sync";
import { logConnectionInfo } from "../src/lib/db/connection";

async function ensureMinimalData() {
  const db = requireDb();

  const existingSports = await db.select().from(sports);
  if (existingSports.length === 0) {
    await db.insert(sports).values([
      {
        name: "Futebol",
        slug: "futebol",
        icon: "ball",
        nduUrl: "https://www.ndu.com.br/jogos",
      },
      {
        name: "Futsal",
        slug: "futsal",
        icon: "ball",
        nduUrl: "https://www.ndu.com.br/jogos",
      },
      {
        name: "Basquete",
        slug: "basquete",
        icon: "basket",
        nduUrl: "https://www.ndu.com.br/jogos",
      },
    ]);
    console.log("[bootstrap] Esportes criados");
  }

  const existingUnis = await db.select().from(universities);
  if (existingUnis.length === 0) {
    await db.insert(universities).values({
      name: "NDU — Times Universitários",
      shortName: "NDU",
      city: "São Paulo",
    });
    console.log("[bootstrap] Universidade placeholder criada");
  }

  const existingSeasons = await db.select().from(seasons);
  if (existingSeasons.length === 0) {
    const sportRows = await db.select().from(sports);
    const firstSport = sportRows[0];
    if (!firstSport) throw new Error("Esportes não encontrados após bootstrap");

    const [comp] = await db
      .insert(competitions)
      .values({
        name: "NDU 2026",
        sportId: firstSport.id,
        description: "Dados importados da NDU",
      })
      .returning();

    await db.insert(seasons).values({
      competitionId: comp.id,
      name: "2026.1",
      year: 2026,
      isActive: true,
    });
    console.log("[bootstrap] Temporada criada");
  }
}

async function purgeSeedMatches() {
  const db = requireDb();
  const removed = await db
    .delete(matches)
    .where(like(matches.externalKey, "seed:%"))
    .returning({ id: matches.id });
  if (removed.length > 0) {
    console.log(
      `[bootstrap] Removidos ${removed.length} jogos de demonstração (seed)`
    );
  }
}

async function main() {
  if (!process.env.DATABASE_URL?.trim()) {
    console.log("[bootstrap] Sem DATABASE_URL — pulando");
    return;
  }

  logConnectionInfo();
  await ensureMinimalData();
  await purgeSeedMatches();

  console.log("[bootstrap] Sincronizando dados da NDU...");
  const result = await runFullScrape();
  console.log(
    `[bootstrap] NDU: ${result.athleticsSynced ?? 0} atléticas, ${result.boletimMatches ?? 0} jogos do boletim${result.boletimTitle ? ` (${result.boletimTitle})` : ""}, ${result.parsed ?? result.total} total, ${result.created} criados, ${result.statsSynced ?? 0} artilheiros/estatísticas`
  );
  if (result.errors.length) {
    console.warn("[bootstrap] Erros:", result.errors.slice(0, 5));
  }
}

main().catch((e) => {
  console.error("[bootstrap]", e);
  process.exit(1);
});
