import {
  parseBoletimPdfText,
  parsePlayoffRecord,
} from "../src/lib/ndu/boletim-parser";
import { resolvePlayoffWinner } from "../src/lib/ndu/playoff-winner";

const finishedSamples = [
  {
    label: "quartas 7x5",
    line: "31/05 12h30min Idalina 4ªs 2º colocado do grupo B Politécnica USP 7 X 5 3º colocado do grupo A Federal do ABC",
  },
  {
    label: "quartas OT",
    line: "31/05 18h30min Palestra 4ªs 1º colocado do grupo B FECAP 04 X 04 4º colocado do grupo A FEA USP Prorrogação: 02 x 00",
  },
  {
    label: "semi penaltis (colon)",
    line: "05/06 SAB Ginásio Semi 1º colocado do grupo B FECAP 4 X 4 4º colocado do grupo A FEA USP Pênaltis: 3 x 4",
  },
  {
    label: "semi penaltis (sem colon)",
    line: "31/05 18h30min Palestra 4ªs 1º colocado do grupo B FECAP 04 X 04 4º colocado do grupo A FEA USP Pênaltis 3 x 4",
  },
  {
    label: "semi OT 0x0 + penaltis",
    line: "31/05 18h30min Palestra Semi FECAP 04 X 04 FEA USP Prorrogação: 0 x 0 Pênaltis: 5 x 4",
  },
  {
    label: "semi penaltis (3 a 4)",
    line: "31/05 18h30min Palestra Semi FECAP 04 X 04 FEA USP Pênaltis 3 a 4",
  },
  {
    label: "semi penaltis (parenteses)",
    line: "31/05 18h30min Palestra Semi FECAP 04 X 04 FEA USP Penaltis (3 x 4)",
  },
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
    home: row.homeTeamRaw,
    away: row.awayTeamRaw,
    score: `${row.homeScore}-${row.awayScore}`,
    ot: [row.overtimeHomeScore, row.overtimeAwayScore],
    pen: [row.penaltyHomeScore, row.penaltyAwayScore],
    winner: win,
  });
}

console.log("=== Mata-mata finalizados ===");
for (const sample of finishedSamples) {
  dump(sample.label, parsePlayoffRecord(sample.line));
}

const multilineChunk = `Playoffs – Futsal Masculino (Série A)
31/05 18h30min Palestra 4ªs (4) 1º colocado do grupo B FECAP 04 X 04 4º colocado do grupo A FEA USP
Prorrogação: 0 x 0
Pênaltis: 3 x 4
`;

const multilineRows = parseBoletimPdfText(multilineChunk).filter((r) => r.isFinished);
console.log("\n=== PDF multilinha penaltis ===", multilineRows.length);
for (const row of multilineRows) {
  dump(`${row.group} pen`, parsePlayoffRecord(
    `${row.dateLabel} ${row.group} ${row.homeTeamRaw} ${row.homeScore} X ${row.awayScore} ${row.awayTeamRaw}${row.overtimeHomeScore != null ? ` Prorrogação: ${row.overtimeHomeScore} x ${row.overtimeAwayScore}` : ""}${row.penaltyHomeScore != null ? ` Pênaltis: ${row.penaltyHomeScore} x ${row.penaltyAwayScore}` : ""}`
  ));
}
