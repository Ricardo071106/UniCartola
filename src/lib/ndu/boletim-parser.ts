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

const PLAYOFF_PHASE_RE = /(8ªs|4ªs|Semi|Final)/i;

const PLAYOFF_END_RE =
  /\n(?:Handebol|Vôlei|Futebol de Campo Masculino|Basquete Masculino|Futsal Masculino)\s+(?:\(Série|Feminino|Masculino)/i;

import { normalizePlayoffPhase } from "./playoff-phases";

export { normalizePlayoffPhase, isPlayoffPhase } from "./playoff-phases";

function isGroupStageSectionMatch(text: string, index: number): boolean {
  const prefix = text.slice(Math.max(0, index - 20), index);
  return (
    /Classificação\s+–\s*$/i.test(prefix) ||
    /Aproveitamento\s+–\s*$/i.test(prefix) ||
    /Playoffs\s+–\s*$/i.test(prefix)
  );
}

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

  return entries.sort((a, b) => parseInt(b.id, 10) - parseInt(a.id, 10));
}

function parseGroupMatchLine(line: string): Omit<
  ParsedMatchRow,
  "modality" | "series"
> | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  const m = trimmed.match(
    /^(\d{2}\/\d{2})\s+(\S+)\s+(.+?)\s+([A-F])\s+(.+?)\s+(\d{1,2})\s+X\s+(\d{1,2})\s+(.+)$/i
  );
  if (!m) return null;

  const homeScore = parseInt(m[6], 10);
  const awayScore = parseInt(m[7], 10);
  if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;

  const venue = m[3].trim();
  const homeTeamRaw = m[5].trim();
  const awayTeamRaw = m[8].trim().replace(/\s*\(DT\)\s*$/i, "").trim();

  return {
    dateLabel: `${m[1]} ${m[2]}`,
    group: m[4].toUpperCase(),
    homeTeamRaw,
    awayTeamRaw,
    homeScore,
    awayScore,
    isFinished: true,
    venue,
  };
}

function stripPlayoffNoise(text: string, stripPhase = false): string {
  let out = text
    .replace(/\s*Prorrogação:\s*[\d]+\s*x\s*[\d]+/gi, "")
    .replace(/\s*Pênaltis:\s*[\d]+\s*x\s*[\d]+/gi, "")
    .replace(/Playoffs\s+[–-].*$/gi, "")
    .replace(/\bVencedor\s+(?:das\s+|da\s+)?(?:4ªs|8ªs)\s*\(\d+\)\s*/gi, "")
    .replace(/\bVencedor\s+das\s+4ªs\s*\(\d+\)\s*/gi, "")
    .replace(/\bVencedor\s+(?:da\s+)?semifinal\s*\d*\s*/gi, "")
    .replace(/\bPerdedor\s+(?:da\s+)?semifinal\s*\d*\s*/gi, "")
    .replace(/\s*\(\d+\)/g, "")
    .replace(/\d+º\s+colocado\s+geral/gi, "")
    .trim();

  if (stripPhase) {
    out = out.replace(/\b(?:4ªs|8ªs)\b/gi, "").trim();
  }

  return out;
}

function parsePlayoffRecord(
  raw: string
): Omit<ParsedMatchRow, "modality" | "series"> | null {
  const line = raw.replace(/\s+/g, " ").trim();
  if (!/^\d{2}\/\d{2}/.test(line)) return null;

  const phaseMatch = line.match(PLAYOFF_PHASE_RE);
  if (!phaseMatch) return null;
  const phase = normalizePlayoffPhase(phaseMatch[1]);

  const dateMatch = line.match(/^(\d{2}\/\d{2})\s+(\S+)\s+/);
  if (!dateMatch) return null;

  const scoreMatch = line.match(/(\d{1,2})\s+X\s+(\d{1,2})/i);
  const scheduledOnly =
    !scoreMatch && /\s+X\s+/i.test(line) && !/\d{1,2}\s+X\s+\d{1,2}/i.test(line);

  let homeScore: number | undefined;
  let awayScore: number | undefined;
  let beforeScore = "";
  let afterScore = "";

  if (scoreMatch && scoreMatch.index !== undefined) {
    homeScore = parseInt(scoreMatch[1], 10);
    awayScore = parseInt(scoreMatch[2], 10);
    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return null;
    beforeScore = line.slice(0, scoreMatch.index);
    afterScore = line.slice(scoreMatch.index + scoreMatch[0].length);
  } else if (scheduledOnly) {
    const parts = line.split(/\s+X\s+/i);
    if (parts.length < 2) return null;
    beforeScore = parts[0];
    afterScore = parts.slice(1).join(" X ");
  } else {
    return null;
  }

  const homePart = beforeScore
    .replace(/^(\d{2}\/\d{2})\s+(\S+)\s+/, "")
    .replace(/^[\wÀ-ú\s-]+?\s+(8ªs|4ªs|Semi|Final)\s*/i, "")
    .trim();

  const homeTeamRaw = stripPlayoffNoise(homePart, true);
  const awayTeamRaw = stripPlayoffNoise(afterScore.trim(), true);

  if (!homeTeamRaw || !awayTeamRaw) return null;
  if (/^X$/i.test(homeTeamRaw) || /^X$/i.test(awayTeamRaw)) return null;

  const venueMatch = beforeScore.match(
    /^(\d{2}\/\d{2})\s+(\S+)\s+([\wÀ-ú\s-]+?)\s+(8ªs|4ªs|Semi|Final)/i
  );

  return {
    dateLabel: `${dateMatch[1]} ${dateMatch[2]}`,
    group: phase,
    homeTeamRaw,
    awayTeamRaw,
    homeScore,
    awayScore,
    isFinished: homeScore != null && awayScore != null,
    venue: venueMatch?.[3]?.trim(),
  };
}

function mergePlayoffLines(chunk: string): string[] {
  const records: string[] = [];
  let current = "";

  for (const line of chunk.split("\n")) {
    const t = line.replace(/\s+/g, " ").trim();
    if (!t || /^DIA HORÁRIO/i.test(t) || /^EQUIPE Mandante/i.test(t)) continue;
    if (/^Playoffs\s+[–-]/i.test(t)) {
      if (current) records.push(current);
      current = "";
      continue;
    }
    if (/^Final$/i.test(t)) {
      if (current) records.push(current);
      current = "";
      continue;
    }
    if (/^3º e/i.test(t)) break;

    if (/^\d{2}\/\d{2}/.test(t)) {
      if (current) records.push(current);
      current = t;
      continue;
    }

    if (current && PLAYOFF_PHASE_RE.test(t) && !/\d{1,2}\s+X\s+\d{1,2}/i.test(t)) {
      current += ` ${t}`;
      continue;
    }

    if (current) current += ` ${t}`;
  }

  if (current) records.push(current);
  return records;
}

function extractPlayoffChunk(
  text: string,
  modality: string,
  series: string,
  fromIndex: number
): string | null {
  const headerRe = new RegExp(
    `Playoffs\\s+[–-]\\s+${modality.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(Série\\s+${series}\\)`,
    "i"
  );
  const slice = text.slice(fromIndex);
  const header = slice.match(headerRe);
  if (!header || header.index === undefined) return null;

  const chunkStart = fromIndex + header.index + header[0].length;
  const rest = text.slice(chunkStart);
  const sportEnd = rest.search(PLAYOFF_END_RE);
  return sportEnd === -1 ? rest : rest.slice(0, sportEnd);
}

function pushRow(
  rows: ParsedMatchRow[],
  seen: Set<string>,
  row: ParsedMatchRow
) {
  const key = `${row.modality}:${row.series}:${row.group}:${row.homeTeamRaw}:${row.awayTeamRaw}:${row.homeScore}:${row.awayScore}`;
  if (seen.has(key)) return;
  seen.add(key);
  rows.push(row);
}

export function parseBoletimPdfText(text: string): ParsedMatchRow[] {
  const rows: ParsedMatchRow[] = [];
  const seen = new Set<string>();

  for (const sport of TARGET_SPORTS) {
    const re = new RegExp(sport.pattern.source, "gi");
    let m: RegExpExecArray | null;

    while ((m = re.exec(text)) !== null) {
      if (m.index === undefined || isGroupStageSectionMatch(text, m.index)) {
        continue;
      }

      const series = m[1].toUpperCase();
      const start = m.index + m[0].length;

      const groupEnd = text
        .slice(start)
        .search(/Classificação\s+–|Playoffs\s+–/i);
      const groupChunk =
        groupEnd === -1 ? text.slice(start) : text.slice(start, start + groupEnd);

      for (const line of groupChunk.split("\n")) {
        const parsed = parseGroupMatchLine(line);
        if (!parsed) continue;
        pushRow(rows, seen, {
          ...parsed,
          modality: sport.modality,
          series,
        });
      }

      const playoffChunk = extractPlayoffChunk(
        text,
        sport.modality,
        series,
        m.index
      );
      if (playoffChunk) {
        for (const record of mergePlayoffLines(playoffChunk)) {
          const parsed = parsePlayoffRecord(record);
          if (!parsed) continue;
          pushRow(rows, seen, {
            ...parsed,
            modality: sport.modality,
            series,
          });
        }
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
