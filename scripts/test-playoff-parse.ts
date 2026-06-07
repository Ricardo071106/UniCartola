import {
  parseBoletimPdfText,
  parsePlayoffRecord,
} from "../src/lib/ndu/boletim-parser";
import { resolvePlayoffWinner } from "../src/lib/ndu/playoff-winner";

const finishedSamples = [
  "31/05 12h30min Idalina 4ªs 2º colocado do grupo B Politécnica USP 7 X 5 3º colocado do grupo A Federal do ABC",
  "31/05 18h30min Palestra 4ªs 1º colocado do grupo B FECAP 04 X 04 4º colocado do grupo A FEA USP Prorrogação: 02 x 00",
];

const scheduledSamples = [
  "13/06 12h Idalina Semi (1) Vencedor das 4ªs (1) Economia Mackenzie X Vencedor das 4ªs (3) Politécnica USP",
  "13/06 13h30min Idalina Semi (2) Vencedor das 4ªs (4) FECAP X Vencedor das 4ªs (2) INSPER",
];

function dump(label: string, row: ReturnType<typeof parsePlayoffRecord>) {
  if (!row) {
    console.log(`FAIL ${label}`);
    return;
  }
  const win = resolvePlayoffWinner(
    row.homeScore ?? null,
    row.awayScore ?? null,
    {
      overtimeHome: row.overtimeHomeScore ?? null,
      overtimeAway: row.overtimeAwayScore ?? null,
      penaltyHome: row.penaltyHomeScore ?? null,
      penaltyAway: row.penaltyAwayScore ?? null,
    },
    { isPlayoff: true }
  );
  console.log(label, {
    date: row.dateLabel,
    phase: row.group,
    home: row.homeTeamRaw,
    away: row.awayTeamRaw,
    finished: row.isFinished,
    score: `${row.homeScore ?? "-"}-${row.awayScore ?? "-"}`,
    winner: win.winnerSide,
  });
}

console.log("=== Finalizados ===");
for (const line of finishedSamples) dump(line.slice(0, 40), parsePlayoffRecord(line));

console.log("\n=== Agendados ===");
for (const line of scheduledSamples) dump(line.slice(0, 40), parsePlayoffRecord(line));

const bulletinChunk = `
Playoffs – Futsal Masculino (Série A)
31/05 08h Idalina 4ªs (1) 1º colocado do grupo A Direito PUC 01 X 02 4º colocado do grupo B Economia Mackenzie
13/06 12h Idalina Semi (1) Vencedor das 4ªs (1) Economia Mackenzie X Vencedor das 4ªs (3) Politécnica USP
13/06 13h30min Idalina Semi (2) Vencedor das 4ªs (4) FECAP X Vencedor das 4ªs (2) INSPER
Final Vencedor da semifinal 1 X Vencedor da semifinal 2
`;

const rows = parseBoletimPdfText(bulletinChunk);
const upcoming = rows.filter((r) => !r.isFinished);
console.log("\n=== Boletim chunk agendados ===", upcoming.length);
for (const row of upcoming) {
  dump(`${row.group} ${row.dateLabel}`, {
    ...row,
    group: row.group,
  });
}
