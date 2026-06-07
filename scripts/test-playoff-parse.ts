import { parsePlayoffRecord } from "../src/lib/ndu/boletim-parser";
import { resolvePlayoffWinner } from "../src/lib/ndu/playoff-winner";

const samples = [
  "05/06 SAB Ginásio 4ªs 2º colocado do grupo B Politécnica USP 7 X 5 3º colocado do grupo A Federal do ABC",
  "05/06 SAB Ginásio Semi 1º colocado do grupo B FECAP 4 X 4 4º colocado do grupo A FEA USP Prorrogação: 0 x 1",
  "05/06 SAB Ginásio Semi 1º colocado do grupo B FECAP 4 X 4 4º colocado do grupo A FEA USP Pênaltis: 3 x 4",
];

for (const line of samples) {
  const row = parsePlayoffRecord(line);
  if (!row) {
    console.log("FAIL parse:", line.slice(0, 60));
    continue;
  }
  const win = resolvePlayoffWinner(row.homeScore ?? null, row.awayScore ?? null, {
    overtimeHome: row.overtimeHomeScore ?? null,
    overtimeAway: row.overtimeAwayScore ?? null,
    penaltyHome: row.penaltyHomeScore ?? null,
    penaltyAway: row.penaltyAwayScore ?? null,
  }, { isPlayoff: true });
  console.log({
    home: row.homeTeamRaw,
    away: row.awayTeamRaw,
    score: `${row.homeScore}-${row.awayScore}`,
    ot: [row.overtimeHomeScore, row.overtimeAwayScore],
    pen: [row.penaltyHomeScore, row.penaltyAwayScore],
    winner: win,
  });
}
