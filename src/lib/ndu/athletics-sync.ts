import { requireDb } from "@/lib/db";
import { athletics, universities } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import * as cheerio from "cheerio";
import { fetchNduHtml, NDU_ATLETICAS_URL } from "./fetch";
import { normalizeTeamName, nduLogoUrl, normalizeLogoUrl } from "./normalize";
import { parseNduAthleticsMap } from "./parser";

export type NduAthleticRow = {
  nduId: number;
  name: string;
  logoUrl: string;
};

export function parseAtleticasPage(html: string): NduAthleticRow[] {
  const $ = cheerio.load(html);
  const rows: NduAthleticRow[] = [];
  const seen = new Set<number>();

  $(".atletica_box a, #carrega_atleticas a").each((_, a) => {
    const href = $(a).attr("href") ?? "";
    const id = parseInt(href.match(/detalhes\/(\d+)/)?.[1] ?? "", 10);
    if (!id || seen.has(id)) return;
    seen.add(id);

    const imgSrc = $(a).find("img").attr("src");
    const name =
      $(a).find(".atletica_titulo").text().trim() ||
      $(a).text().trim();

    if (!name) return;
    rows.push({
      nduId: id,
      name,
      logoUrl: normalizeLogoUrl(imgSrc) ?? nduLogoUrl(id),
    });
  });

  if (rows.length === 0) {
    for (const [id, name] of parseNduAthleticsMap(html)) {
      const numId = parseInt(id, 10);
      if (!numId || seen.has(numId)) continue;
      seen.add(numId);
      rows.push({ nduId: numId, name, logoUrl: nduLogoUrl(numId) });
    }
  }

  return rows;
}

export async function syncNduAthletics(): Promise<number> {
  const db = requireDb();
  const html = await fetchNduHtml(NDU_ATLETICAS_URL);
  const rows = parseAtleticasPage(html);

  const [fallbackUni] = await db.select().from(universities).limit(1);
  if (!fallbackUni) throw new Error("Sem universidade no banco");

  let upserted = 0;
  const existing = await db.select().from(athletics);

  for (const row of rows) {
    const normalized = normalizeTeamName(row.name);
    const match =
      existing.find((a) => a.nduAthleticId === row.nduId) ??
      existing.find((a) => a.normalizedName === normalized) ??
      existing.find(
        (a) => a.nduAlias && normalizeTeamName(a.nduAlias) === normalized
      );

    if (match) {
      await db
        .update(athletics)
        .set({
          name: row.name,
          nduAthleticId: row.nduId,
          logoUrl: row.logoUrl,
          nduAlias: row.name,
          normalizedName: normalized,
        })
        .where(eq(athletics.id, match.id));
    } else {
      await db.insert(athletics).values({
        universityId: fallbackUni.id,
        name: row.name,
        nduAthleticId: row.nduId,
        logoUrl: row.logoUrl,
        nduAlias: row.name,
        normalizedName: normalized,
      });
    }
    upserted++;
  }

  return upserted;
}
