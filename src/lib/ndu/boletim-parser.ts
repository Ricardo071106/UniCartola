import * as cheerio from "cheerio";
import type { ParsedMatchRow } from "./parser";
import { modalityToSportSlug } from "./normalize";
import { parseNduMatchDateTime } from "./match-datetime";

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

const PLAYOFF_PHASE_RE = /(8ªs|4ªs|Oitavas|Quartas|Semi|Final)/i;

const PLAYOFF_END_RE =
  /\n(?:Handebol|Vôlei|Futebol de Campo Masculino|Basquete Masculino|Futsal Masculino)\s+(?:\(Série|Feminino|Masculino)/i;

import { normalizePlayoffPhase } from "./playoff-phases";
import { extractPlayoffExtraScores } from "./playoff-winner";

export { normalizePlayoffPhase, isPlayoffPhase } from "./playoff-phases";

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

/** Jogo de grupo ainda sem placar (ex.: `05/06 SAB Ginásio A Time Casa X Time Fora`). */
function parseGroupScheduledLine(line: string): Omit<
  ParsedMatchRow,
  "modality" | "series"
> | null {
  const trimmed = line.replace(/\s+/g, " ").trim();
  if (/\d{1,2}\s+X\s+\d{1,2}/i.test(trimmed)) return null;

  const m = trimmed.match(
    /^(\d{2}\/\d{2})\s+(\S+)\s+(.+?)\s+([A-F])\s+(.+?)\s+X\s+(.+)$/i
  );
  if (!m) return null;

  const homeTeamRaw = m[5].trim();
  const awayTeamRaw = m[6].trim().replace(/\s*\(DT\)\s*$/i, "").trim();
  if (!homeTeamRaw || !awayTeamRaw) return null;
  if (/^X$/i.test(homeTeamRaw) && /^X$/i.test(awayTeamRaw)) return null;

  return {
    dateLabel: `${m[1]} ${m[2]}`,
    group: m[4].toUpperCase(),
    homeTeamRaw,
    awayTeamRaw,
    isFinished: false,
    venue: m[3].trim(),
  };
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
    .replace(/\s*Prorrogação:\s*[\d]+\s*[xX×]\s*[\d]+/gi, "")
    .replace(/\s*Prorrogacao:\s*[\d]+\s*[xX×]\s*[\d]+/gi, "")
    .replace(/\s*Pênaltis:\s*[\d]+\s*[xX×]\s*[\d]+/gi, "")
    .replace(/\s*Penaltis:\s*[\d]+\s*[xX×]\s*[\d]+/gi, "")
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

function playoffTeamLabel(raw: string, stripped: string): string {
  const cleaned = stripped.trim();
  if (cleaned) return cleaned;
  const placeholder = raw.match(
    /Vencedor\s+(?:das?\s+)?(?:4ªs|8ªs|Semifinal|Final).*?(?:\(\d+\))?/i
  );
  if (placeholder) return placeholder[0].trim();
  return "A definir";
}

const MAX_TEAM_NAME_LEN = 200;

/** PDF às vezes cola vários jogos na mesma linha — corta lixo após o placar. */
function trimTeamLabel(text: string): string {
  let t = text.trim();
  const cuts = [
    /\s+\d+º\s+(?:colocado|melhor)\b/i,
    /\s+(?:Semi|Final|4ªs|8ªs|Quartas|Oitavas)\s+(?=[A-Za-zÀ-ú0-9])/i,
    /\s+\d{2}\/\d{2}\s+\S+/,
    /\s+\d{1,2}\s+X\s+\d{1,2}\s+/i,
  ];
  for (const pat of cuts) {
    const m = t.match(pat);
    if (m?.index != null && m.index > 3) {
      t = t.slice(0, m.index).trim();
      break;
    }
  }
  if (t.length > MAX_TEAM_NAME_LEN) t = t.slice(0, MAX_TEAM_NAME_LEN).trim();
  return t;
}

/** Divide registros de playoff colados (várias datas na mesma string). */
function splitMergedPlayoffRecords(record: string): string[] {
  const byDate = record
    .split(/(?=\d{2}\/\d{2}\s+\S+)/)
    .map((s) => s.trim())
    .filter((s) => /^\d{2}\/\d{2}/.test(s));
  if (byDate.length > 1) return byDate;

  // Não dividir após placar quando o texto seguinte é "Nº colocado do grupo…"
  // (nome do visitante, não um novo jogo).
  return [record];
}

function parsePlayoffTeamSide(raw: string): string {
  const cleaned = stripPlayoffNoise(raw, true).trim();
  if (!cleaned) return playoffTeamLabel(raw, cleaned);

  const seedColocado = cleaned.match(
    /^\d+º\s+colocado\s+do\s+grupo\s+[A-F]\s+(.+)$/i
  );
  if (seedColocado?.[1]) return trimTeamLabel(seedColocado[1]);

  const melhor = cleaned.match(/^\d+º\s+melhor\s+.+\s+(.+)$/i);
  if (melhor?.[1]) return trimTeamLabel(melhor[1]);

  return trimTeamLabel(playoffTeamLabel(raw, cleaned));
}

const PLAYOFF_DATE_TIME_RE =
  /^(\d{2}\/\d{2})(?:\s+(\d{1,2}h\d{0,2}(?:min)?|\d{1,2}:\d{2}))?\s*/i;

function parsePlayoffHeader(line: string): {
  dateLabel: string;
  rest: string;
} | null {
  const m = line.match(PLAYOFF_DATE_TIME_RE);
  if (!m) return null;
  const dateLabel = m[2] ? `${m[1]} ${m[2]}` : m[1];
  return { dateLabel, rest: line.slice(m[0].length) };
}

export function parsePlayoffRecord(
  raw: string
): Omit<ParsedMatchRow, "modality" | "series"> | null {
  const line = raw.replace(/\s+/g, " ").trim();
  if (!/^\d{2}\/\d{2}/.test(line)) return null;

  const phaseMatch = line.match(PLAYOFF_PHASE_RE);
  if (!phaseMatch) return null;
  const phase = normalizePlayoffPhase(phaseMatch[1]);

  const header = parsePlayoffHeader(line);
  if (!header) return null;

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
    .replace(PLAYOFF_DATE_TIME_RE, "")
    .replace(/^[\wÀ-ú\s-]+?\s+(8ªs|4ªs|Oitavas|Quartas|Semi|Final)\s*(\(\d+\))?\s*/i, "")
    .trim();

  const homeTeamRaw = parsePlayoffTeamSide(homePart);
  const awaySideRaw = afterScore
    .replace(/\s*(Prorrogação|Prorrogacao|Pênaltis|Penaltis):.*$/i, "")
    .trim();
  const awayTeamRaw = parsePlayoffTeamSide(awaySideRaw);

  if (/^X$/i.test(homeTeamRaw) && /^X$/i.test(awayTeamRaw)) return null;
  if (!homeTeamRaw || !awayTeamRaw) return null;
  if (homeTeamRaw.length > MAX_TEAM_NAME_LEN || awayTeamRaw.length > MAX_TEAM_NAME_LEN) {
    return null;
  }

  const extras = extractPlayoffExtraScores(line);

  const venueMatch = beforeScore.match(
    /^(\d{2}\/\d{2})(?:\s+\S+)?\s+([\wÀ-ú\s-]+?)\s+(8ªs|4ªs|Oitavas|Quartas|Semi|Final)/i
  );

  return {
    dateLabel: header.dateLabel,
    group: phase,
    homeTeamRaw,
    awayTeamRaw,
    homeScore,
    awayScore,
    isFinished: homeScore != null && awayScore != null,
    venue: venueMatch?.[3]?.trim(),
    ...(extras.overtimeHome != null
      ? { overtimeHomeScore: extras.overtimeHome }
      : {}),
    ...(extras.overtimeAway != null
      ? { overtimeAwayScore: extras.overtimeAway }
      : {}),
    ...(extras.penaltyHome != null
      ? { penaltyHomeScore: extras.penaltyHome }
      : {}),
    ...(extras.penaltyAway != null
      ? { penaltyAwayScore: extras.penaltyAway }
      : {}),
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
  series: string
): string | null {
  const headerRe = new RegExp(
    `Playoffs\\s+[–-]\\s+${modality.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\s*\\(Série\\s+${series}\\)`,
    "i"
  );
  const header = text.match(headerRe);
  if (!header || header.index === undefined) return null;

  const chunkStart = header.index + header[0].length;
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
      if (m.index === undefined) continue;

      const series = m[1].toUpperCase();
      const start = m.index + m[0].length;
      const groupEnd = text
        .slice(start)
        .search(/Classificação\s+–|Playoffs\s+–/i);
      const groupChunk =
        groupEnd === -1 ? text.slice(start) : text.slice(start, start + groupEnd);

      for (const line of groupChunk.split("\n")) {
        const parsed =
          parseGroupMatchLine(line) ?? parseGroupScheduledLine(line);
        if (!parsed) continue;
        pushRow(rows, seen, {
          ...parsed,
          modality: sport.modality,
          series,
        });
      }

      const playoffChunk = extractPlayoffChunk(text, sport.modality, series);
      if (playoffChunk) {
        for (const record of mergePlayoffLines(playoffChunk)) {
          for (const piece of splitMergedPlayoffRecords(record)) {
            const parsed = parsePlayoffRecord(piece);
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
  return parseNduMatchDateTime(dateLabel, year);
}
