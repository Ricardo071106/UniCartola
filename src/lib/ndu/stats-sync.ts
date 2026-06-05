import { requireDb } from "@/lib/db";
import { athletics, nduScorerStats } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduStatsFragment } from "./fetch";
import { parseNduStatsPage } from "./stats-parser";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;

export async function syncNduStats(year = 2026): Promise<number> {
  const db = requireDb();
  const athleticRows = await db.select().from(athletics);
  const byNduId = new Map(
    athleticRows
      .filter((a) => a.nduAthleticId != null)
      .map((a) => [a.nduAthleticId!, a])
  );

  let saved = 0;

  const jobs: { sportSlug: string; modalityId: string; isBasketball: boolean }[] =
    [
      ...NDU_MODALITY_IDS.futsal.map((id) => ({
        sportSlug: "futsal",
        modalityId: id,
        isBasketball: false,
      })),
      ...NDU_MODALITY_IDS.futebol.map((id) => ({
        sportSlug: "futebol",
        modalityId: id,
        isBasketball: false,
      })),
      ...NDU_MODALITY_IDS.basquete.map((id) => ({
        sportSlug: "basquete",
        modalityId: id,
        isBasketball: true,
      })),
    ];

  for (const job of jobs) {
    for (const series of SERIES) {
      try {
        const html = await fetchNduStatsFragment(
          job.modalityId,
          series,
          String(year)
        );
        const scorers = parseNduStatsPage(html, job.isBasketball);
        if (scorers.length === 0) continue;

        await db
          .delete(nduScorerStats)
          .where(
            and(
              eq(nduScorerStats.sportSlug, job.sportSlug),
              eq(nduScorerStats.series, series),
              eq(nduScorerStats.statType, job.isBasketball ? "points" : "goals"),
              eq(nduScorerStats.seasonYear, year)
            )
          );

        for (const s of scorers) {
          const ath = s.athleticNduId
            ? byNduId.get(s.athleticNduId)
            : undefined;
          await db.insert(nduScorerStats).values({
            sportSlug: job.sportSlug,
            series,
            playerName: s.playerName,
            athleticNduId: s.athleticNduId,
            teamName: ath?.name ?? null,
            logoUrl: s.logoUrl ?? ath?.logoUrl ?? null,
            total: s.total,
            statType: s.statType,
            seasonYear: year,
          });
          saved++;
        }
      } catch {
        /* série/modalidade sem dados */
      }
    }
  }

  return saved;
}
