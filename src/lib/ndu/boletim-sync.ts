// pdf-parse v1 — compatível com Node no servidor
import pdf from "pdf-parse";
import { fetchNduBinary, fetchNduHtml, NDU_BOLETIM_URL } from "./fetch";
import { parseBoletimIndex, parseBoletimPdfText } from "./boletim-parser";
import type { ParsedMatchRow } from "./parser";

export async function fetchLatestBoletimPdf(
  year = 2026
): Promise<{ buffer: Buffer; entryId: string; title: string } | null> {
  const html = await fetchNduHtml(NDU_BOLETIM_URL);
  const entries = parseBoletimIndex(html, year);
  if (entries.length === 0) return null;

  const latest = entries[0];
  const url = `https://www.ndu.com.br/boletim/ler_boletim/${latest.id}`;
  const buffer = await fetchNduBinary(url, NDU_BOLETIM_URL);
  return { buffer, entryId: latest.id, title: latest.title };
}

export async function parseBoletimMatches(
  year = 2026
): Promise<{ rows: ParsedMatchRow[]; boletimId: string; title: string } | null> {
  const pdfData = await fetchLatestBoletimPdf(year);
  if (!pdfData) return null;

  const parsed = await pdf(pdfData.buffer);
  const rows = parseBoletimPdfText(parsed.text);

  return {
    rows,
    boletimId: pdfData.entryId,
    title: pdfData.title,
  };
}

