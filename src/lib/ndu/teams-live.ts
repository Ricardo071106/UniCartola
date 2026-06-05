import { requireDb } from "@/lib/db";
import { athletics } from "@/lib/db/schema";
import { inArray } from "drizzle-orm";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduModalityFragment, fetchNduStatsFragment } from "./fetch";
import { athleticIdFromLogoUrl, parseNduJogosPage } from "./parser";
import { modalityToSportSlug } from "./normalize";
import { getCurrentStatsYear } from "./stats-period";
import { parseNduStatsAthletics } from "./stats-parser";
import type { TeamOption } from "@/lib/queries/palpites-options";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";

function addTeamFromLogo(
  teams: Map<number, string | null>,
  logoUrl?: string
) {
  const id = athleticIdFromLogoUrl(logoUrl);
  if (!id) return;
  const nduId = parseInt(id, 10);
  if (!teams.has(nduId)) teams.set(nduId, logoUrl ?? null);
}

/** Times da série ao vivo (NDU estatísticas + jogos). */
export async function fetchNduSeriesTeamsLive(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<TeamOption[]> {
  const modalityIds = NDU_MODALITY_IDS[sportSlug];
  if (!modalityIds?.length) return [];

  const year = await getCurrentStatsYear();
  const nduTeams = new Map<number, string | null>();

  for (const modalityId of modalityIds) {
    try {
      const statsHtml = await fetchNduStatsFragment(
        modalityId,
        series,
        String(year)
      );
      for (const ath of parseNduStatsAthletics(statsHtml)) {
        nduTeams.set(ath.athleticNduId, ath.logoUrl);
      }
    } catch (error) {
      console.error(
        `[teams-live] stats ${sportSlug} série ${series} mod ${modalityId}:`,
        error
      );
    }

    try {
      const jogosHtml = await fetchNduModalityFragment(modalityId);
      for (const row of parseNduJogosPage(jogosHtml)) {
        if (modalityToSportSlug(row.modality) !== sportSlug) continue;
        if (row.series !== series) continue;
        addTeamFromLogo(nduTeams, row.homeLogoUrl);
        addTeamFromLogo(nduTeams, row.awayLogoUrl);
      }
    } catch (error) {
      console.error(
        `[teams-live] jogos ${sportSlug} série ${series} mod ${modalityId}:`,
        error
      );
    }
  }

  if (nduTeams.size === 0) return [];

  try {
    const db = requireDb();
    const nduIds = [...nduTeams.keys()];
    const rows = await db
      .select({
        id: athletics.id,
        name: athletics.name,
        nduAthleticId: athletics.nduAthleticId,
      })
      .from(athletics)
      .where(inArray(athletics.nduAthleticId, nduIds));

    const byNduId = new Map(
      rows
        .filter((r) => r.nduAthleticId != null)
        .map((r) => [r.nduAthleticId!, r])
    );

    const options: TeamOption[] = [];
    for (const nduId of nduIds) {
      const ath = byNduId.get(nduId);
      if (!ath) continue;
      options.push({ id: ath.id, name: ath.name.trim() });
    }

    return options.sort((a, b) => a.name.localeCompare(b.name, "pt-BR"));
  } catch {
    return [];
  }
}
