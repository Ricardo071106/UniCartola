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

function parseStatsTable(
  $: cheerio.CheerioAPI,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  heading: cheerio.Cheerio<any>,
  statType: ParsedNduScorer["statType"]
): ParsedNduScorer[] {
  const rows: ParsedNduScorer[] = [];
  const table = heading.nextAll("table").first();
  table.find("tr").each((__, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 3) return;

    const name = $(tds[0]).text().trim();
    const logoSrc = $(tds[1]).find("img").attr("src");
    const total = parseInt($(tds[2]).text().trim(), 10);
    if (!name || Number.isNaN(total)) return;

    const athleticId = athleticIdFromLogoUrl(logoSrc ?? undefined);
    rows.push({
      playerName: name,
      athleticNduId: athleticId ? parseInt(athleticId, 10) : null,
      logoUrl:
        normalizeLogoUrl(logoSrc) ??
        (athleticId ? nduLogoUrl(athleticId) : null),
      total,
      statType,
    });
  });
  return rows;
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
      ? title.includes("artilheiro") || title.includes("cestinha")
      : title.includes("artilheiro");
    if (!isScorerSection) return;

    scorers.push(
      ...parseStatsTable($, $(h3), isBasketball ? "points" : "goals")
    );
  });

  return scorers;
}

export function parseNduCardStatsPage(html: string): ParsedNduScorer[] {
  const $ = cheerio.load(html);
  const cards: ParsedNduScorer[] = [];

  $("h3").each((_, h3) => {
    const title = $(h3).text().toLowerCase();
    const isCardSection =
      title.includes("cartão") ||
      title.includes("cartao") ||
      title.includes("advertência") ||
      title.includes("advertencia") ||
      title.includes("puniç") ||
      title.includes("punido");
    if (!isCardSection) return;

    cards.push(...parseStatsTable($, $(h3), "goals").map((r) => ({
      ...r,
      statType: "cards" as const,
    })));
  });

  return cards;
}
