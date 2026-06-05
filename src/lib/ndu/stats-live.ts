import { requireDb } from "@/lib/db";
import { athletics } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduStatsFragment } from "./fetch";
import { parseNduCardStatsPage, parseNduStatsPage } from "./stats-parser";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { PlayerOption } from "@/lib/queries/palpites-options";

async function getSeasonYear(): Promise<number> {
  const { seasons } = await import("@/lib/db/schema");
  const db = requireDb();
  const [active] = await db
    .select()
    .from(seasons)
    .where(eq(seasons.isActive, true))
    .limit(1);
  return active?.year ?? new Date().getFullYear();
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

export async function fetchNduStatsPlayersLive(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<{ scorers: PlayerOption[]; cards: PlayerOption[] }> {
  const modalityIds = NDU_MODALITY_IDS[sportSlug];
  if (!modalityIds?.length) return { scorers: [], cards: [] };

  const year = await getSeasonYear();
  const isBasketball = sportSlug === "basquete";

  const db = requireDb();
  const athleticRows = await db
    .select({
      nduAthleticId: athletics.nduAthleticId,
      name: athletics.name,
    })
    .from(athletics);
  const teamByNduId = new Map(
    athleticRows
      .filter((a) => a.nduAthleticId != null)
      .map((a) => [a.nduAthleticId!, a.name])
  );

  let scorers: PlayerOption[] = [];
  let cards: PlayerOption[] = [];

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
    } catch {
      /* modalidade sem dados */
    }
  }

  return { scorers, cards };
}
