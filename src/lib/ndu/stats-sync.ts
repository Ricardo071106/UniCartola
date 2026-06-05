import { requireDb } from "@/lib/db";
import { athletics, matches, nduScorerStats, sports } from "@/lib/db/schema";
import { and, eq } from "drizzle-orm";
import { NDU_MODALITY_IDS } from "./constants";
import { fetchNduStatsFragment } from "./fetch";
import { parseNduStatsPage } from "./stats-parser";

const SERIES = ["A", "B", "C", "D", "E", "F"] as const;

async function athleticNduIdsInSeries(
  sportSlug: string,
  series: string
): Promise<Set<number>> {
  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return new Set();

  const rows = await db
    .select({
      homeAthleticsId: matches.homeAthleticsId,
      awayAthleticsId: matches.awayAthleticsId,
    })
    .from(matches)
    .where(and(eq(matches.sportId, sport.id), eq(matches.series, series)));

  const athIds = [
    ...new Set(
      rows
        .flatMap((r) => [r.homeAthleticsId, r.awayAthleticsId])
        .filter(Boolean)
    ),
  ] as string[];

  if (athIds.length === 0) return new Set();

  const athRows = await db.select().from(athletics);
  const ids = new Set<number>();
  for (const id of athIds) {
    const ath = athRows.find((a) => a.id === id);
    if (ath?.nduAthleticId != null) ids.add(ath.nduAthleticId);
  }
  return ids;
}

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
        let scorers = parseNduStatsPage(html, job.isBasketball);
        if (scorers.length === 0) continue;

        if (job.isBasketball) {
          const seriesAthletics = await athleticNduIdsInSeries(
            job.sportSlug,
            series
          );
          if (seriesAthletics.size > 0) {
            scorers = scorers.filter(
              (s) =>
                s.athleticNduId != null &&
                seriesAthletics.has(s.athleticNduId)
            );
          }
          if (scorers.length === 0) continue;
        }

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
