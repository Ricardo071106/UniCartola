import * as cheerio from "cheerio";
import { athleticIdFromLogoUrl } from "./parser";
import { normalizeLogoUrl, nduLogoUrl } from "./normalize";

export type ParsedNduScorer = {
  playerName: string;
  athleticNduId: number | null;
  logoUrl: string | null;
  total: number;
  statType: "goals" | "points" | "cards";
};

function parseIntCell(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  cell: cheerio.Cheerio<any>
) {
  const raw = cell.text().replace(/\D/g, "");
  const n = parseInt(raw, 10);
  return Number.isNaN(n) ? 0 : n;
}

function rowFromLogo(
  name: string,
  logoSrc: string | undefined,
  total: number,
  statType: ParsedNduScorer["statType"]
): ParsedNduScorer | null {
  if (!name.trim() || total <= 0) return null;
  const athleticId = athleticIdFromLogoUrl(logoSrc ?? undefined);
  return {
    playerName: name.trim(),
    athleticNduId: athleticId ? parseInt(athleticId, 10) : null,
    logoUrl:
      normalizeLogoUrl(logoSrc) ??
      (athleticId ? nduLogoUrl(athleticId) : null),
    total,
    statType,
  };
}

function parseScorerStatsTable(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading: cheerio.Cheerio<any>,
  statType: "goals" | "points"
): ParsedNduScorer[] {
  const rows: ParsedNduScorer[] = [];
  const table = heading.nextAll("table").first();
  table.find("tr").each((__, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 3) return;

    const name = $(tds[0]).text().trim();
    const logoSrc = $(tds[1]).find("img").attr("src");
    const total = parseIntCell($, $(tds[2]));
    const row = rowFromLogo(name, logoSrc, total, statType);
    if (row) rows.push(row);
  });
  return rows;
}

function parseCardStatsTable(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading: cheerio.Cheerio<any>
): ParsedNduScorer[] {
  const rows: ParsedNduScorer[] = [];
  const table = heading.nextAll("table").first();
  table.find("tr").each((__, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 4) return;

    const name = $(tds[0]).text().trim();
    const logoSrc = $(tds[1]).find("img").attr("src");
    const yellow = parseIntCell($, $(tds[2]));
    const red = parseIntCell($, $(tds[3]));
    const row = rowFromLogo(name, logoSrc, yellow + red, "cards");
    if (row) rows.push(row);
  });
  return rows.sort((a, b) => b.total - a.total);
}

export function parseNduStatsPage(
  html: string,
  isBasketball: boolean
): ParsedNduScorer[] {
  const $ = cheerio.load(html);
  const scorers: ParsedNduScorer[] = [];

  $("h3").each((_, h3) => {
    const title = $(h3).text().toLowerCase();
    const isScorerSection = isBasketball
      ? title.includes("artilheiro") ||
        title.includes("cestinha") ||
        title.includes("cestinhas")
      : title.includes("artilheiro");
    if (!isScorerSection) return;

    scorers.push(
      ...parseScorerStatsTable($, $(h3), isBasketball ? "points" : "goals")
    );
  });

  return scorers;
}

export type ParsedNduAthletic = {
  athleticNduId: number;
  logoUrl: string | null;
};

function parseAthleticsFromStatsTable(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading: cheerio.Cheerio<any>
): ParsedNduAthletic[] {
  const rows: ParsedNduAthletic[] = [];
  const table = heading.nextAll("table").first();
  table.find("tr").each((__, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 2) return;

    const logoSrc = $(tds[1]).find("img").attr("src");
    const athleticId = athleticIdFromLogoUrl(logoSrc ?? undefined);
    if (!athleticId) return;

    rows.push({
      athleticNduId: parseInt(athleticId, 10),
      logoUrl:
        normalizeLogoUrl(logoSrc) ??
        nduLogoUrl(athleticId),
    });
  });
  return rows;
}

/** Atléticas únicas nas tabelas de artilheiros/cestinhas e cartões. */
export function parseNduStatsAthletics(html: string): ParsedNduAthletic[] {
  const $ = cheerio.load(html);
  const seen = new Set<number>();
  const athletics: ParsedNduAthletic[] = [];

  $("h3").each((_, h3) => {
    const title = $(h3)
      .text()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const isRelevantSection =
      title.includes("artilheiro") ||
      title.includes("cestinha") ||
      title.includes("cestinhas") ||
      title.includes("cartoes") ||
      title.includes("cartao");
    if (!isRelevantSection) return;

    for (const row of parseAthleticsFromStatsTable($, $(h3))) {
      if (seen.has(row.athleticNduId)) continue;
      seen.add(row.athleticNduId);
      athletics.push(row);
    }
  });

  return athletics;
}

export function parseNduCardStatsPage(html: string): ParsedNduScorer[] {
  const $ = cheerio.load(html);
  const cards: ParsedNduScorer[] = [];

  $("h3").each((_, h3) => {
    const title = $(h3)
      .text()
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");
    const isCardSection =
      title.includes("cartoes") ||
      title.includes("cartao") ||
      title.includes("advertencia") ||
      title.includes("punic");
    if (!isCardSection) return;

    cards.push(...parseCardStatsTable($, $(h3)));
  });

  return cards;
}
