import * as cheerio from "cheerio";

export type ParsedMatchRow = {
  dateLabel: string;
  modality: string;
  series: string;
  group: string;
  homeScore?: number;
  awayScore?: number;
  isFinished: boolean;
  homeTeamRaw?: string;
  awayTeamRaw?: string;
  venue?: string;
};

const MONTH_MAP: Record<string, number> = {
  JAN: 0,
  FEV: 1,
  MAR: 2,
  ABR: 3,
  MAI: 4,
  JUN: 5,
  JUL: 6,
  AGO: 7,
  SET: 8,
  OUT: 9,
  NOV: 10,
  DEZ: 11,
};

export function parseNduDateLabel(label: string, year = new Date().getFullYear()): Date | null {
  const m = label.trim().match(/^(\d{2})(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i);
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTH_MAP[m[2].toUpperCase()];
  if (month === undefined) return null;
  return new Date(year, month, day, 12, 0, 0);
}

export function normalizeTeamName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function parseGamesPage(html: string, modalityName?: string): ParsedMatchRow[] {
  const $ = cheerio.load(html);
  const rows: ParsedMatchRow[] = [];

  $("table").each((_, table) => {
    const caption = $(table).prev("h3, h4, h2").text() || "";
    const isUpcoming = /próximas|proximas/i.test(caption) || /próximas|proximas/i.test($(table).find("caption").text());
    const isResults = /últimos|ultimos|placares/i.test(caption) || /últimos|ultimos/i.test($(table).find("caption").text());

    $(table)
      .find("tr")
      .each((_, tr) => {
        const cells = $(tr)
          .find("td")
          .map((__, td) => $(td).text().trim())
          .get();

        if (cells.length < 4) return;

        const [dateLabel, modOrSeries, seriesOrGroup, groupOrResult, ...rest] = cells;
        if (!dateLabel || /data|modalidade|série|serie|grupo|resultado/i.test(dateLabel)) return;
        if (/ainda não há|não há jogos/i.test(dateLabel)) return;

        let modality = modalityName ?? modOrSeries;
        let series = seriesOrGroup;
        let group = groupOrResult;
        let resultParts = rest;

        if (cells.length >= 5 && !modalityName) {
          modality = modOrSeries;
          series = seriesOrGroup;
          group = groupOrResult;
          resultParts = rest;
        }

        const resultText = resultParts.join(" ");
        const scoreMatch = resultText.match(/(\d+)\s*[xX|×]\s*(\d+)/);
        const venueMatch = resultText.match(/local[:\s]*(.+)/i);

        if (scoreMatch) {
          rows.push({
            dateLabel,
            modality,
            series,
            group,
            homeScore: parseInt(scoreMatch[1], 10),
            awayScore: parseInt(scoreMatch[2], 10),
            isFinished: isResults || !isUpcoming,
          });
        } else if (isUpcoming || /local/i.test(resultText)) {
          rows.push({
            dateLabel,
            modality,
            series,
            group,
            isFinished: false,
            venue: venueMatch?.[1]?.trim(),
          });
        }
      });
  });

  return rows;
}

export function buildExternalKey(row: ParsedMatchRow, modalitySlug: string): string {
  return `${modalitySlug}:${row.dateLabel}:${row.series}:${row.group}:${row.homeScore ?? "x"}:${row.awayScore ?? "x"}`;
}
