import { requireDb } from "@/lib/db";
import { athletics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduStatsFragment } from "./fetch";
import { parseNduCardStatsPage, parseNduStatsPage } from "./stats-parser";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { PlayerOption } from "@/lib/queries/palpites-options";

async function getSeasonYear(): Promise<number | null> {
  try {
    const { seasons } = await import("@/lib/db/schema");
    const db = requireDb();
    const [active] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);
    return active?.year ?? null;
  } catch {
    return null;
  }
}

async function yearsToTry(): Promise<number[]> {
  const years = new Set<number>();
  const seasonYear = await getSeasonYear();
  if (seasonYear != null) years.add(seasonYear);
  const current = new Date().getFullYear();
  years.add(current);
  years.add(current - 1);
  return [...years];
}

async function loadTeamNames(): Promise<Map<number, string>> {
  try {
    const db = requireDb();
    const athleticRows = await db
      .select({
        nduAthleticId: athletics.nduAthleticId,
        name: athletics.name,
      })
      .from(athletics);
    return new Map(
      athleticRows
        .filter((a) => a.nduAthleticId != null)
        .map((a) => [a.nduAthleticId!, a.name])
    );
  } catch {
    return new Map();
  }
}

function toPlayerOptions(
  rows: ReturnType<typeof parseNduStatsPage>,
  teamByNduId: Map<number, string>
): PlayerOption[] {
  const seen = new Set<string>();
  return rows
    .filter((r) => {
      const key = r.playerName.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((r) => ({
      name: r.playerName,
      teamName:
        (r.athleticNduId != null
          ? teamByNduId.get(r.athleticNduId)
          : undefined) ?? "",
    }));
}

/** Busca artilheiros e cartões ao vivo em ndu.com.br/estatisticas. */
export async function fetchNduStatsPlayersLive(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<{ scorers: PlayerOption[]; cards: PlayerOption[] }> {
  const modalityIds = NDU_MODALITY_IDS[sportSlug];
  if (!modalityIds?.length) return { scorers: [], cards: [] };

  const isBasketball = sportSlug === "basquete";
  const teamByNduId = await loadTeamNames();

  let scorers: PlayerOption[] = [];
  let cards: PlayerOption[] = [];

  for (const year of await yearsToTry()) {
    for (const modalityId of modalityIds) {
      try {
        const html = await fetchNduStatsFragment(
          modalityId,
          series,
          String(year)
        );
        const parsedScorers = parseNduStatsPage(html, isBasketball);
        const parsedCards = isBasketball ? [] : parseNduCardStatsPage(html);

        if (parsedScorers.length > scorers.length) {
          scorers = toPlayerOptions(parsedScorers, teamByNduId);
        }
        if (parsedCards.length > cards.length) {
          cards = toPlayerOptions(parsedCards, teamByNduId);
        }
      } catch (error) {
        console.error(
          `[stats-live] ${sportSlug} série ${series} mod ${modalityId} ano ${year}:`,
          error
        );
      }
    }

    if (scorers.length > 0 || cards.length > 0) break;
  }

  return { scorers, cards };
}
