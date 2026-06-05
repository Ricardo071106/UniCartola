/**
 * Teste local: npx tsx scripts/test-ndu-parse.ts
 * Não precisa de DATABASE_URL.
 */
import { fetchAllNduJogosHtml } from "../src/lib/ndu/fetch";
import { parseNduJogosPage } from "../src/lib/ndu/parser";
import { modalityToSportSlug } from "../src/lib/ndu/normalize";

async function main() {
  console.log("[test] Buscando NDU...");
  const html = await fetchAllNduJogosHtml();
  const rows = parseNduJogosPage(html);

  const bySport = { futsal: 0, futebol: 0, basquete: 0 };
  for (const r of rows) {
    const slug = modalityToSportSlug(r.modality);
    if (slug && slug in bySport) bySport[slug as keyof typeof bySport]++;
  }

  console.log("[test] Total:", rows.length, bySport);
  console.log("[test] Amostra futsal A:");
  console.log(
    rows
      .filter(
        (r) =>
          modalityToSportSlug(r.modality) === "futsal" && r.series === "A"
      )
      .slice(0, 3)
      .map((r) => ({
        id: r.nduMatchId,
        teams: `${r.homeTeamRaw} x ${r.awayTeamRaw}`,
        score: `${r.homeScore}-${r.awayScore}`,
      }))
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
