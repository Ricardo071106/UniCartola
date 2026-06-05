import * as cheerio from "cheerio";
import type { ParsedMatchRow } from "./parser";
import { modalityToSportSlug } from "./normalize";

export type BoletimEntry = {
  id: string;
  dateLabel: string;
  title: string;
};

const TARGET_SPORTS = [
  { pattern: /Futsal Masculino\s*\(Série\s+([A-F])\)/i, modality: "Futsal Masculino" },
  {
    pattern: /Futebol de Campo Masculino\s*\(Série\s+([A-F])\)/i,
    modality: "Futebol de Campo Masculino",
  },
  {
    pattern: /Basquete Masculino\s*\(Série\s+([A-F])\)/i,
    modality: "Basquete Masculino",
  },
];

export function parseBoletimIndex(html: string, year = 2026): BoletimEntry[] {
  const $ = cheerio.load(html);
  const entries: BoletimEntry[] = [];

  $("a[href*='ler_boletim']").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const id = href.match(/ler_boletim\/(\d+)/)?.[1];
    const text = $(a).text().replace(/\s+/g, " ").trim();
    if (!id || !text) return;

    const isYear = text.includes(String(year));
    const isResultados =
      /resultados/i.test(text) &&
      /primeiro semestre|segundo semestre/i.test(text);

    if (isYear && isResultados) {
      entries.push({
        id,
        dateLabel: text.slice(0, 12).trim(),
        title: text,
      });
    }
  });

  return entries;
}

function parseMatchLine(line: string): Omit<
  ParsedMatchRow,
  "modality" | "series"
> | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  const header = trimmed.match(/^(\d{2}\/\d{2})\s+(\S+)\s+(\S+)\s+([A-F])\s+/i);
  if (!header) return null;

  const rest = trimmed.slice(header[0].length);
  const body = rest.match(/^(.+)\s+(\d{1,2})\s+X\s+(\d{1,2})\s+(.+)$/i);
  if (!body) return null;

  const homeScore = parseInt(body[2], 10);
  const awayScore = parseInt(body[3], 10);
  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;

  return {
    dateLabel: `${header[1]} ${header[2]}`,
    group: header[4].toUpperCase(),
    homeTeamRaw: body[1].trim(),
    awayTeamRaw: body[4].trim().replace(/\s*\(DT\)\s*$/i, "").trim(),
    homeScore,
    awayScore,
    isFinished: true,
    venue: header[3],
  };
}

export function parseBoletimPdfText(
  text: string,
  year = 2026
): ParsedMatchRow[] {
  const rows: ParsedMatchRow[] = [];
  const seen = new Set<string>();

  for (const sport of TARGET_SPORTS) {
    const re = new RegExp(sport.pattern.source, "gi");
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      const series = m[1].toUpperCase();
      const start = m.index + m[0].length;
      const nextSection = text.slice(start).search(
        /(?:Futsal Masculino|Futebol de Campo Masculino|Basquete Masculino)\s*\(Série|Classificação\s+–/i
      );
      const chunk =
        nextSection === -1
          ? text.slice(start)
          : text.slice(start, start + nextSection);

      for (const line of chunk.split("\n")) {
        const parsed = parseMatchLine(line);
        if (!parsed) continue;

        const key = `${sport.modality}:${series}:${parsed.homeTeamRaw}:${parsed.awayTeamRaw}:${parsed.homeScore}:${parsed.awayScore}`;
        if (seen.has(key)) continue;
        seen.add(key);

        rows.push({
          ...parsed,
          modality: sport.modality,
          series,
          dateLabel: parsed.dateLabel,
        });
      }
    }
  }

  return rows.filter((r) => {
    const slug = modalityToSportSlug(r.modality);
    return slug === "futsal" || slug === "futebol" || slug === "basquete";
  });
}

export function parseNduDateFromBoletim(
  dateLabel: string,
  year: number
): Date | null {
  const m = dateLabel.match(/^(\d{2})\/(\d{2})/);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = parseInt(m[2], 10) - 1;
  if (month < 0 || month > 11) return null;
  return new Date(year, month, day, 12, 0, 0);
}
