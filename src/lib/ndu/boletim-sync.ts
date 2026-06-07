// pdf-parse v1 — compatível com Node no servidor
import pdf from "pdf-parse";
import { fetchNduBinary, fetchNduHtml, NDU_BOLETIM_URL } from "./fetch";
import { parseBoletimIndex, parseBoletimPdfText } from "./boletim-parser";
import type { ParsedMatchRow } from "./parser";
import { withTimeout } from "@/lib/utils/timeout";

const BOLETIM_HISTORY_LIMIT = 8;
const PDF_FETCH_TIMEOUT_MS = 10000;
const BOLETIM_PARSE_TIMEOUT_MS = 35000;

export async function fetchLatestBoletimPdf(
  year = 2026
): Promise<{ buffer: Buffer; entryId: string; title: string } | null> {
  const batch = await fetchRecentBoletimPdfs(year, 1);
  return batch[0] ?? null;
}

async function fetchOneBoletimPdf(entry: {
  id: string;
  title: string;
}): Promise<{ buffer: Buffer; entryId: string; title: string } | null> {
  const url = `https://www.ndu.com.br/boletim/ler_boletim/${entry.id}`;
  return withTimeout(
    fetchNduBinary(url, NDU_BOLETIM_URL).then((buffer) => ({
      buffer,
      entryId: entry.id,
      title: entry.title,
    })),
    PDF_FETCH_TIMEOUT_MS,
    null
  );
}

export async function fetchRecentBoletimPdfs(
  year = 2026,
  limit = BOLETIM_HISTORY_LIMIT
): Promise<{ buffer: Buffer; entryId: string; title: string }[]> {
  const html = await fetchNduHtml(NDU_BOLETIM_URL);
  const entries = parseBoletimIndex(html, year).slice(0, limit);
  if (entries.length === 0) return [];

  const settled = await Promise.allSettled(
    entries.map((entry) => fetchOneBoletimPdf(entry))
  );

  return settled
    .filter(
      (
        r
      ): r is PromiseFulfilledResult<{
        buffer: Buffer;
        entryId: string;
        title: string;
      }> => r.status === "fulfilled" && r.value != null
    )
    .map((r) => r.value);
}

async function parseBoletimMatchesInner(
  year = 2026,
  pdfLimit = BOLETIM_HISTORY_LIMIT
): Promise<{ rows: ParsedMatchRow[]; boletimId: string; title: string } | null> {
  const pdfs = await fetchRecentBoletimPdfs(year, pdfLimit);
  if (pdfs.length === 0) return null;

  const seen = new Set<string>();
  const rows: ParsedMatchRow[] = [];

  for (const pdfData of pdfs) {
    try {
      const parsed = await pdf(pdfData.buffer);
      for (const row of parseBoletimPdfText(parsed.text)) {
        const key = `${row.modality}:${row.series}:${row.group}:${row.homeTeamRaw}:${row.awayTeamRaw}:${row.homeScore ?? "s"}:${row.awayScore ?? "s"}`;
        if (seen.has(key)) continue;
        seen.add(key);
        rows.push(row);
      }
    } catch (error) {
      console.error(
        `[boletim] Falha ao ler PDF ${pdfData.entryId}:`,
        error instanceof Error ? error.message : error
      );
    }
  }

  return {
    rows,
    boletimId: pdfs.map((p) => p.entryId).join(","),
    title: pdfs[0].title,
  };
}

export async function parseBoletimMatches(
  year = 2026,
  pdfLimit = BOLETIM_HISTORY_LIMIT
): Promise<{ rows: ParsedMatchRow[]; boletimId: string; title: string } | null> {
  return withTimeout(
    parseBoletimMatchesInner(year, pdfLimit),
    BOLETIM_PARSE_TIMEOUT_MS,
    null
  );
}
