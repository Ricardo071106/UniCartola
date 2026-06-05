// pdf-parse v1 — compatível com Node no servidor
import pdf from "pdf-parse";
import { fetchNduBinary, fetchNduHtml, NDU_BOLETIM_URL } from "./fetch";
import { parseBoletimIndex, parseBoletimPdfText } from "./boletim-parser";
import type { ParsedMatchRow } from "./parser";

const BOLETIM_HISTORY_LIMIT = 8;

export async function fetchLatestBoletimPdf(
  year = 2026
): Promise<{ buffer: Buffer; entryId: string; title: string } | null> {
  const batch = await fetchRecentBoletimPdfs(year, 1);
  return batch[0] ?? null;
}

export async function fetchRecentBoletimPdfs(
  year = 2026,
  limit = BOLETIM_HISTORY_LIMIT
): Promise<{ buffer: Buffer; entryId: string; title: string }[]> {
  const html = await fetchNduHtml(NDU_BOLETIM_URL);
  const entries = parseBoletimIndex(html, year).slice(0, limit);
  if (entries.length === 0) return [];

  const results: { buffer: Buffer; entryId: string; title: string }[] = [];
  for (const entry of entries) {
    const url = `https://www.ndu.com.br/boletim/ler_boletim/${entry.id}`;
    const buffer = await fetchNduBinary(url, NDU_BOLETIM_URL);
    results.push({ buffer, entryId: entry.id, title: entry.title });
  }
  return results;
}

export async function parseBoletimMatches(
  year = 2026
): Promise<{ rows: ParsedMatchRow[]; boletimId: string; title: string } | null> {
  const pdfs = await fetchRecentBoletimPdfs(year);
  if (pdfs.length === 0) return null;

  const seen = new Set<string>();
  const rows: ParsedMatchRow[] = [];

  for (const pdfData of pdfs) {
    const parsed = await pdf(pdfData.buffer);
    for (const row of parseBoletimPdfText(parsed.text)) {
      const key = `${row.modality}:${row.series}:${row.group}:${row.homeTeamRaw}:${row.awayTeamRaw}:${row.homeScore}:${row.awayScore}`;
      if (seen.has(key)) continue;
      seen.add(key);
      rows.push(row);
    }
  }

  return {
    rows,
    boletimId: pdfs.map((p) => p.entryId).join(","),
    title: pdfs[0].title,
  };
}

