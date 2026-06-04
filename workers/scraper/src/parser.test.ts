import { parseGamesPage, parseNduDateLabel, buildExternalKey } from "./parser";

const sampleHtml = `
<table>
  <caption>Últimos placares</caption>
  <tr><td>DATA</td><td>MODALIDADE</td><td>SÉRIE</td><td>GRUPO</td><td>RESULTADO</td></tr>
  <tr><td>01MAR</td><td>Futsal Masculino</td><td>A</td><td>B</td><td>5</td><td>X</td><td>3</td></tr>
</table>
`;

const rows = parseGamesPage(sampleHtml);
console.assert(rows.length >= 1, "should parse at least one row");
console.assert(rows[0].homeScore === 5 && rows[0].awayScore === 3, "scores");

const d = parseNduDateLabel("01MAR", 2026);
console.assert(d?.getMonth() === 2, "March");

const key = buildExternalKey(rows[0], "futsal-masculino");
console.assert(key.includes("futsal-masculino"), "external key");

console.log("parser tests passed");
