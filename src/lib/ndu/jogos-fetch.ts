import { NDU_MODALITY_IDS } from "./constants";
import {
  fetchNduHtml,
  fetchNduModalityFragment,
  NDU_JOGOS_URL,
} from "./fetch";
import { parseNduJogosPage, type ParsedMatchRow } from "./parser";

/** Busca e parseia cada modalidade separadamente (evita perder jogos no HTML concatenado). */
export async function fetchAllNduJogosRows(): Promise<ParsedMatchRow[]> {
  const modalityIds = [
    ...NDU_MODALITY_IDS.futsal,
    ...NDU_MODALITY_IDS.futebol,
    ...NDU_MODALITY_IDS.basquete,
  ];

  const [baseHtml, ...fragments] = await Promise.all([
    fetchNduHtml(NDU_JOGOS_URL),
    ...modalityIds.map((id) => fetchNduModalityFragment(id)),
  ]);

  const rows: ParsedMatchRow[] = [];
  const seen = new Set<string>();

  for (const html of [baseHtml, ...fragments]) {
    for (const row of parseNduJogosPage(html)) {
      const key =
        row.nduMatchId ??
        `${row.modality}:${row.series}:${row.group}:${row.dateLabel}:${row.homeTeamRaw}:${row.awayTeamRaw}:${row.homeScore ?? "s"}:${row.awayScore ?? "s"}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }

  return rows;
}
