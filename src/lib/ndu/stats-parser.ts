import * as cheerio from "cheerio";
import { athleticIdFromLogoUrl } from "./parser";
import { normalizeLogoUrl, nduLogoUrl } from "./normalize";

export type ParsedNduScorer = {
  playerName: string;
  athleticNduId: number | null;
  logoUrl: string | null;
  total: number;
  statType: "goals" | "points";
};

export function parseNduStatsPage(
  html: string,
  isBasketball: boolean
): ParsedNduScorer[] {
  const $ = cheerio.load(html);
  const scorers: ParsedNduScorer[] = [];

  $("h3").each((_, h3) => {
    const title = $(h3).text().toLowerCase();
    const isScorerSection = isBasketball
      ? title.includes("cestinha")
      : title.includes("artilheiro");
    if (!isScorerSection) return;

    const table = $(h3).nextAll("table").first();
    table.find("tr").each((__, tr) => {
      const tds = $(tr).find("td");
      if (tds.length < 3) return;

      const name = $(tds[0]).text().trim();
      const logoSrc = $(tds[1]).find("img").attr("src");
      const total = parseInt($(tds[2]).text().trim(), 10);
      if (!name || Number.isNaN(total)) return;

      const athleticId = athleticIdFromLogoUrl(logoSrc ?? undefined);
      scorers.push({
        playerName: name,
        athleticNduId: athleticId ? parseInt(athleticId, 10) : null,
        logoUrl:
          normalizeLogoUrl(logoSrc) ??
          (athleticId ? nduLogoUrl(athleticId) : null),
        total,
        statType: isBasketball ? "points" : "goals",
      });
    });
  });

  return scorers;
}
