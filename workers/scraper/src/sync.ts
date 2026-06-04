import { db } from "@unicartola/db/client";
import {
  teams,
  matches,
  modalities,
  competitions,
  scrapeRuns,
  teamMappingQueue,
} from "@unicartola/db/schema";
import { eq, and } from "drizzle-orm";
import { parseGamesPage, parseNduDateLabel, normalizeTeamName, buildExternalKey, type ParsedMatchRow } from "./parser";

const MVP_MODALITY_SLUGS = new Set([
  "futsal-masculino",
  "futsal-feminino",
  "futebol-masculino",
  "basquete-masculino",
  "basquete-feminino",
]);

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { "User-Agent": "Unicartola/1.0 (university sports aggregator)" },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

async function resolveTeam(rawName: string): Promise<string> {
  const normalized = normalizeTeamName(rawName);
  const existing = await db
    .select()
    .from(teams)
    .where(eq(teams.normalizedName, normalized))
    .limit(1);

  if (existing[0]) return existing[0].id;

  const [created] = await db
    .insert(teams)
    .values({
      name: rawName,
      normalizedName: normalized,
      nduAlias: rawName,
      needsReview: true,
    })
    .returning();

  await db.insert(teamMappingQueue).values({ rawName, suggestedTeamId: created.id });
  return created.id;
}

async function getPlaceholderTeams(): Promise<{ homeId: string; awayId: string }> {
  const home = await resolveTeam("Time A NDU");
  const away = await resolveTeam("Time B NDU");
  return { homeId: home, awayId: away };
}

export async function syncModality(modality: typeof modalities.$inferSelect, year: number) {
  const url = modality.nduUrl ?? "https://www.ndu.net.br/jogos";
  const html = await fetchHtml(url);
  const rows = parseGamesPage(html, modality.name);
  const { homeId, awayId } = await getPlaceholderTeams();

  let created = 0;
  let updated = 0;

  for (const row of rows) {
    const externalKey = buildExternalKey(row, modality.slug);
    const scheduledAt = parseNduDateLabel(row.dateLabel, year);

    const existing = await db
      .select()
      .from(matches)
      .where(eq(matches.externalKey, externalKey))
      .limit(1);

    const status = row.isFinished && row.homeScore != null ? "finished" : "scheduled";

    if (existing[0]) {
      const needsUpdate =
        existing[0].homeScore !== row.homeScore ||
        existing[0].awayScore !== row.awayScore ||
        existing[0].status !== status;

      if (needsUpdate) {
        await db
          .update(matches)
          .set({
            homeScore: row.homeScore ?? null,
            awayScore: row.awayScore ?? null,
            status,
            scheduledAt: scheduledAt ?? existing[0].scheduledAt,
            updatedAt: new Date(),
          })
          .where(eq(matches.id, existing[0].id));
        updated++;
      }
    } else {
      await db.insert(matches).values({
        competitionId: modality.competitionId,
        modalityId: modality.id,
        homeTeamId: homeId,
        awayTeamId: awayId,
        series: row.series,
        groupName: row.group,
        scheduledAt,
        status,
        homeScore: row.homeScore ?? null,
        awayScore: row.awayScore ?? null,
        venue: row.venue ?? null,
        externalKey,
        sourceHash: externalKey,
      });
      created++;
    }
  }

  return { created, updated, rows: rows.length };
}

export async function runFullScrape() {
  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: "ndu", status: "running" })
    .returning();

  const errors: string[] = [];
  let totalCreated = 0;
  let totalUpdated = 0;

  try {
    const activeComp = await db
      .select()
      .from(competitions)
      .where(eq(competitions.isActive, true))
      .limit(1);

    const comp = activeComp[0];
    if (!comp) throw new Error("No active competition");

    const mods = await db
      .select()
      .from(modalities)
      .where(eq(modalities.competitionId, comp.id));

    const year = parseInt(comp.season, 10) || new Date().getFullYear();

    for (const mod of mods) {
      if (!MVP_MODALITY_SLUGS.has(mod.slug)) continue;
      try {
        const result = await syncModality(mod, year);
        totalCreated += result.created;
        totalUpdated += result.updated;
      } catch (e) {
        errors.push(`${mod.slug}: ${e instanceof Error ? e.message : String(e)}`);
      }
    }

    await db
      .update(scrapeRuns)
      .set({
        status: errors.length ? "partial" : "success",
        matchesCreated: totalCreated,
        matchesUpdated: totalUpdated,
        errors: errors.length ? errors : null,
        finishedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id));

    return { created: totalCreated, updated: totalUpdated, errors };
  } catch (e) {
    await db
      .update(scrapeRuns)
      .set({
        status: "failed",
        errors: [e instanceof Error ? e.message : String(e)],
        finishedAt: new Date(),
      })
      .where(eq(scrapeRuns.id, run.id));
    throw e;
  }
}
