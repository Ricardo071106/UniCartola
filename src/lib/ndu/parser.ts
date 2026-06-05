import * as cheerio from "cheerio";
import {
  normalizeTeamName,
  modalityToSportSlug,
  normalizeLogoUrl,
} from "./normalize";

export { normalizeTeamName, modalityToSportSlug };

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
  homeLogoUrl?: string;
  awayLogoUrl?: string;
  nduMatchId?: string;
  venue?: string;
};

export type ParsedScorer = {
  name: string;
  teamLogoUrl?: string;
  total: number;
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

export function parseNduDateLabel(
  label: string,
  year = new Date().getFullYear()
): Date | null {
  const cleaned = label.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  const m = cleaned.match(
    /^(\d{1,2})\s*(JAN|FEV|MAR|ABR|MAI|JUN|JUL|AGO|SET|OUT|NOV|DEZ)$/i
  );
  if (!m) return null;
  const day = parseInt(m[1], 10);
  const month = MONTH_MAP[m[2].toUpperCase()];
  if (month === undefined) return null;
  return new Date(year, month, day, 12, 0, 0);
}

function extractImgMeta(tdHtml: string): { title?: string; src?: string } {
  const title = tdHtml.match(/title="([^"]*)"/i)?.[1]?.trim();
  const src = tdHtml.match(/src="([^"]*)"/i)?.[1]?.trim();
  return { title, src };
}

export function parseNduJogosPage(html: string): ParsedMatchRow[] {
  const $ = cheerio.load(html);
  const rows: ParsedMatchRow[] = [];

  $("#placares_partidas tr[onclick], #placares_partidas tr").each((_, tr) => {
    const onclick = $(tr).attr("onclick") ?? "";
    const nduMatchId = onclick.match(/resultado\/(\d+)/i)?.[1];
    const tds = $(tr).find("td");
    if (tds.length < 9) return;

    const dateHtml = $(tds[0]).html() ?? "";
    const dateLabel = $(tds[0]).text().replace(/\s+/g, " ").trim();
    const modality = $(tds[1]).text().trim();
    const series = $(tds[2]).text().trim();
    const group = $(tds[3]).text().trim();

    if (!dateLabel || /data|modalidade/i.test(dateLabel)) return;
    if (!modality || !series) return;

    const homeMeta = extractImgMeta($(tds[4]).html() ?? "");
    const homeScore = parseInt($(tds[5]).text().trim(), 10);
    const awayScore = parseInt($(tds[7]).text().trim(), 10);
    const awayMeta = extractImgMeta($(tds[8]).html() ?? "");

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;

    rows.push({
      dateLabel: dateHtml.includes("<br") ? dateLabel : dateLabel,
      modality,
      series,
      group,
      homeScore,
      awayScore,
      homeTeamRaw: homeMeta.title,
      awayTeamRaw: awayMeta.title,
      homeLogoUrl: normalizeLogoUrl(homeMeta.src),
      awayLogoUrl: normalizeLogoUrl(awayMeta.src),
      nduMatchId,
      isFinished: true,
    });
  });

  $("#proximas_partidas tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    const dateLabel = $(tds[0]).text().replace(/\s+/g, " ").trim();
    const modality = $(tds[1]).text().trim();
    const series = $(tds[2]).text().trim();
    const group = $(tds[3]).text().trim();
    const partidaHtml = $(tds[4]).html() ?? "";

    if (!dateLabel || /ainda não há|não há jogos|data/i.test(dateLabel)) return;

    const imgs = [...partidaHtml.matchAll(/title="([^"]*)"[^>]*src="([^"]*)"/gi)];
    const homeMeta = imgs[0];
    const awayMeta = imgs[1];
    const venueMatch = partidaHtml.match(/local[:\s]*([^<]+)/i);

    rows.push({
      dateLabel,
      modality,
      series,
      group,
      homeTeamRaw: homeMeta?.[1],
      awayTeamRaw: awayMeta?.[1],
      homeLogoUrl: normalizeLogoUrl(homeMeta?.[2]),
      awayLogoUrl: normalizeLogoUrl(awayMeta?.[2]),
      isFinished: false,
      venue: venueMatch?.[1]?.trim(),
    });
  });

  return rows;
}

/** @deprecated use parseNduJogosPage */
export function parseGamesPage(
  html: string,
  modalityName?: string
): ParsedMatchRow[] {
  const rows = parseNduJogosPage(html);
  if (modalityName) {
    return rows.filter((r) =>
      r.modality.toLowerCase().includes(modalityName.toLowerCase().split(" ")[0])
    );
  }
  return rows;
}

export function parseNduResultPage(html: string): {
  isBasketball: boolean;
  scorers: ParsedScorer[];
} {
  const $ = cheerio.load(html);
  const isBasketball = /basquete/i.test($("h1").first().text());
  const sectionTitle = isBasketball ? "cestinhas" : "artilheiros";
  const scorers: ParsedScorer[] = [];

  $("h1").each((_, h1) => {
    if (!$(h1).text().toLowerCase().includes(sectionTitle)) return;

    const table = $(h1).nextAll("table").first();
    table.find("tr").each((__, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 3) return;

      const name = $(tds[0]).text().trim();
      const logoSrc = $(tds[1]).find("img").attr("src");
      const total = parseInt($(tds[2]).text().trim(), 10);

      if (!name || Number.isNaN(total)) return;
      scorers.push({
        name,
        teamLogoUrl: normalizeLogoUrl(logoSrc),
        total,
      });
    });
  });

  return { isBasketball, scorers };
}

export function buildExternalKey(
  row: ParsedMatchRow,
  sportSlug: string
): string {
  if (row.nduMatchId) return `ndu:${row.nduMatchId}`;
  const teams = `${row.homeTeamRaw ?? "h"}:${row.awayTeamRaw ?? "a"}`;
  return `${sportSlug}:${row.dateLabel}:${row.series}:${row.group}:${teams}:${row.homeScore ?? "x"}:${row.awayScore ?? "x"}`;
}
