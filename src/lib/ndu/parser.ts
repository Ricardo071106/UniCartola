import * as cheerio from "cheerio";
import type { Element } from "domhandler";
import {
  normalizeTeamName,
  modalityToSportSlug,
  normalizeLogoUrl,
} from "./normalize";
import { normalizePlayoffPhase } from "./playoff-phases";
import { parseNduMatchDateTime } from "./match-datetime";

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

export function parseNduDateLabel(
  label: string,
  year = new Date().getFullYear()
): Date | null {
  return parseNduMatchDateTime(label, year);
}

export function parseNduAthleticsMap(html: string): Map<string, string> {
  const $ = cheerio.load(html);
  const map = new Map<string, string>();

  $("select.input_atletica option, select[name='atletica'] option").each(
    (_, opt) => {
      const id = $(opt).attr("value")?.trim();
      const name = $(opt).text().trim();
      if (id && name && id !== "") {
        map.set(id, name);
      }
    }
  );

  return map;
}

export function athleticIdFromLogoUrl(url?: string): string | undefined {
  return url?.match(/atleticas\/(\d+)/i)?.[1];
}

function resolveTeamName(
  title: string | undefined,
  logoUrl: string | undefined,
  athleticsMap: Map<string, string>
): string | undefined {
  const id = athleticIdFromLogoUrl(logoUrl);
  if (id && athleticsMap.has(id)) {
    return athleticsMap.get(id);
  }
  return title;
}

function extractImgMeta(tdHtml: string): { title?: string; src?: string } {
  const title = tdHtml.match(/title="([^"]*)"/i)?.[1]?.trim();
  const src = tdHtml.match(/src="([^"]*)"/i)?.[1]?.trim();
  return { title, src };
}

function extractNduMatchId(
  $: cheerio.CheerioAPI,
  $row: cheerio.Cheerio<Element>
): string | undefined {
  const onclick = $row.attr("onclick") ?? "";
  const fromOnclick = onclick.match(/resultado\/(\d+)/i)?.[1];
  if (fromOnclick) return fromOnclick;

  let found: string | undefined;
  $row.find("a[href*='resultado/']").each((_, a) => {
    if (found) return;
    const href = $(a).attr("href") ?? "";
    found = href.match(/resultado\/(\d+)/i)?.[1];
  });
  return found;
}

function normalizeGroupName(group: string): string {
  if (/^[A-F]$/i.test(group)) return group.toUpperCase();
  return normalizePlayoffPhase(group);
}

export function parseNduJogosPage(html: string): ParsedMatchRow[] {
  const $ = cheerio.load(html);
  const athleticsMap = parseNduAthleticsMap(html);
  const rows: ParsedMatchRow[] = [];
  const seen = new Set<string>();

  $("#placares_partidas tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 9) return;

    const dateHtml = $(tds[0]).html() ?? "";
    const dateLabel = $(tds[0]).text().replace(/\s+/g, " ").trim();
    const modality = $(tds[1]).text().trim();
    const series = $(tds[2]).text().trim();
    const groupRaw = $(tds[3]).text().trim();
    const group = normalizeGroupName(groupRaw);

    if (!dateLabel || /data|modalidade|série|grupo/i.test(dateLabel)) return;
    if (!modality || !series) return;

    const homeMeta = extractImgMeta($(tds[4]).html() ?? "");
    const homeScore = parseInt($(tds[5]).text().trim(), 10);
    const awayScore = parseInt($(tds[7]).text().trim(), 10);
    const awayMeta = extractImgMeta($(tds[8]).html() ?? "");

    if (Number.isNaN(homeScore) || Number.isNaN(awayScore)) return;

    const nduMatchId = extractNduMatchId($, $(tr));
    const homeLogoUrl = normalizeLogoUrl(homeMeta.src);
    const awayLogoUrl = normalizeLogoUrl(awayMeta.src);
    const homeTeamRaw = resolveTeamName(
      homeMeta.title,
      homeLogoUrl,
      athleticsMap
    );
    const awayTeamRaw = resolveTeamName(
      awayMeta.title,
      awayLogoUrl,
      athleticsMap
    );

    const dedupeKey = nduMatchId ?? `${modality}:${series}:${homeTeamRaw}:${awayTeamRaw}:${homeScore}:${awayScore}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    rows.push({
      dateLabel: dateHtml.includes("<br") ? dateLabel : dateLabel,
      modality,
      series,
      group,
      homeScore,
      awayScore,
      homeTeamRaw,
      awayTeamRaw,
      homeLogoUrl,
      awayLogoUrl,
      nduMatchId,
      isFinished: true,
    });
  });

  const upcomingSeen = new Set<string>();

  $("#proximas_partidas tr").each((_, tr) => {
    const tds = $(tr).find("td");
    if (tds.length < 5) return;

    const dateLabel = $(tds[0]).text().replace(/\s+/g, " ").trim();
    const modality = $(tds[1]).text().trim();
    const series = $(tds[2]).text().trim();
    const groupRaw = $(tds[3]).text().trim();
    const group = normalizeGroupName(groupRaw);
    const partidaHtml = $(tds[4]).html() ?? "";

    if (!dateLabel || /ainda não há|não há jogos|data/i.test(dateLabel)) return;

    const teamImgs: { title?: string; src?: string }[] = [];
    for (const tag of partidaHtml.match(/<img[^>]*>/gi) ?? []) {
      teamImgs.push({
        title: tag.match(/title="([^"]*)"/i)?.[1],
        src: tag.match(/src="([^"]*)"/i)?.[1],
      });
    }
    const homeMeta = teamImgs[0];
    const awayMeta = teamImgs[1];
    const venueMatch = partidaHtml.match(/local[:\s]*([^<]+)/i);
    const homeLogoUrl = normalizeLogoUrl(homeMeta?.src);
    const awayLogoUrl = normalizeLogoUrl(awayMeta?.src);
    const homeTeamRaw = resolveTeamName(
      homeMeta?.title,
      homeLogoUrl,
      athleticsMap
    );
    const awayTeamRaw = resolveTeamName(
      awayMeta?.title,
      awayLogoUrl,
      athleticsMap
    );

    if (!homeTeamRaw && !awayTeamRaw) return;

    const nduMatchId =
      partidaHtml.match(/resultado\/(\d+)/i)?.[1] ??
      extractNduMatchId($, $(tr));

    const dedupeKey =
      nduMatchId ??
      `${modality}:${series}:${dateLabel}:${homeTeamRaw}:${awayTeamRaw}`;
    if (upcomingSeen.has(dedupeKey)) return;
    upcomingSeen.add(dedupeKey);

    rows.push({
      dateLabel,
      modality,
      series,
      group,
      homeTeamRaw,
      awayTeamRaw,
      homeLogoUrl,
      awayLogoUrl,
      nduMatchId,
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
