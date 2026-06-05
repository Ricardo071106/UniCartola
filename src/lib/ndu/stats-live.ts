import { requireDb } from "@/lib/db";
import { athletics } from "@/lib/db/schema";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduStatsFragment } from "./fetch";
import { getCurrentStatsYear } from "./stats-period";
import { parseNduCardStatsPage, parseNduStatsPage } from "./stats-parser";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { PlayerOption } from "@/lib/queries/palpites-options";

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

/** Busca artilheiros e cartões ao vivo em ndu.com.br/estatisticas (ano + semestre atual). */
export async function fetchNduStatsPlayersLive(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<{ scorers: PlayerOption[]; cards: PlayerOption[] }> {
  const modalityIds = NDU_MODALITY_IDS[sportSlug];
  if (!modalityIds?.length) return { scorers: [], cards: [] };

  const year = await getCurrentStatsYear();
  const isBasketball = sportSlug === "basquete";
  const teamByNduId = await loadTeamNames();

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

      const nextScorers = toPlayerOptions(parsedScorers, teamByNduId);
      const nextCards = toPlayerOptions(parsedCards, teamByNduId);

      if (nextScorers.length > scorers.length) scorers = nextScorers;
      if (nextCards.length > cards.length) cards = nextCards;
    } catch (error) {
      console.error(
        `[stats-live] ${sportSlug} série ${series} mod ${modalityId} ano ${year}:`,
        error
      );
    }
  }

  return { scorers, cards };
}
