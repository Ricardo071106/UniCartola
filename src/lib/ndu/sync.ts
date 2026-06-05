import { requireDb } from "@/lib/db";
import {
  athletics,
  matches,
  matchStats,
  seasons,
  sports,
  scrapeRuns,
  teamMappingQueue,
  universities,
} from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import type { ParsedMatchRow } from "./parser";

export const NDU_JOGOS_URL = "https://www.ndu.com.br/jogos";
export const NDU_STATS_URL = "https://www.ndu.com.br/estatisticas";

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (compatible; CampusLeague/1.0; university sports aggregator)",
      Accept: "text/html,application/xhtml+xml",
    },
    next: { revalidate: 0 },
  });
  if (!res.ok) throw new Error(`Failed to fetch ${url}: ${res.status}`);
  return res.text();
}

type ResolvedTeam = {
  universityId: string;
  athleticsId: string | null;
  teamName: string;
};

async function resolveTeam(
  rawName: string,
  logoUrl?: string
): Promise<ResolvedTeam> {
  const { normalizeTeamName } = await import("./parser");
  const db = requireDb();
  const normalized = normalizeTeamName(rawName);

  const allAthletics = await db.select().from(athletics);

  const exact =
    allAthletics.find((a) => a.normalizedName === normalized) ??
    allAthletics.find(
      (a) => a.nduAlias && normalizeTeamName(a.nduAlias) === normalized
    ) ??
    allAthletics.find(
      (a) =>
        a.nduAlias &&
        normalized.includes(normalizeTeamName(a.nduAlias))
    ) ??
    allAthletics.find(
      (a) =>
        normalized.includes(normalizeTeamName(a.name)) ||
        normalizeTeamName(a.name).includes(normalized)
    );

  if (exact) {
    if (logoUrl && !exact.logoUrl) {
      await db
        .update(athletics)
        .set({ logoUrl })
        .where(eq(athletics.id, exact.id));
    }
    return {
      universityId: exact.universityId,
      athleticsId: exact.id,
      teamName: exact.name,
    };
  }

  const [fallbackUni] = await db.select().from(universities).limit(1);
  if (!fallbackUni) throw new Error("No universities in database");

  const [createdAthletic] = await db
    .insert(athletics)
    .values({
      universityId: fallbackUni.id,
      name: rawName,
      nduAlias: rawName,
      normalizedName: normalized,
      logoUrl: logoUrl ?? null,
    })
    .returning();

  await db.insert(teamMappingQueue).values({
    rawName,
    suggestedAthleticsId: createdAthletic.id,
    needsReview: true,
  });

  return {
    universityId: fallbackUni.id,
    athleticsId: createdAthletic.id,
    teamName: rawName,
  };
}

async function resolveMatchTeams(row: ParsedMatchRow) {
  const db = requireDb();
  const [fallbackUni] = await db.select().from(universities).limit(1);
  if (!fallbackUni) throw new Error("No universities in database");

  if (row.homeTeamRaw && row.awayTeamRaw) {
    const [home, away] = await Promise.all([
      resolveTeam(row.homeTeamRaw, row.homeLogoUrl),
      resolveTeam(row.awayTeamRaw, row.awayLogoUrl),
    ]);
    return {
      homeUniversityId: home.universityId,
      awayUniversityId: away.universityId,
      homeAthleticsId: home.athleticsId,
      awayAthleticsId: away.athleticsId,
      homeTeamName: row.homeTeamRaw,
      awayTeamName: row.awayTeamRaw,
    };
  }

  return {
    homeUniversityId: fallbackUni.id,
    awayUniversityId: fallbackUni.id,
    homeAthleticsId: null,
    awayAthleticsId: null,
    homeTeamName: row.homeTeamRaw ?? null,
    awayTeamName: row.awayTeamRaw ?? null,
  };
}

async function syncMatchScorers(
  matchId: string,
  nduMatchId: string,
  isBasketball: boolean
) {
  const db = requireDb();
  const { parseNduResultPage } = await import("./parser");

  const html = await fetchHtml(
    `https://www.ndu.com.br/jogos/resultado/${nduMatchId}`
  );
  const { scorers } = parseNduResultPage(html);
  if (scorers.length === 0) return;

  const payload = scorers.map((s) => ({
    name: s.name,
    team: "",
    ...(isBasketball ? { points: s.total } : { goals: s.total }),
  }));

  const existing = await db
    .select()
    .from(matchStats)
    .where(eq(matchStats.matchId, matchId))
    .limit(1);

  if (existing[0]) {
    await db
      .update(matchStats)
      .set(
        isBasketball
          ? { topScorers: payload }
          : { goalScorers: payload }
      )
      .where(eq(matchStats.id, existing[0].id));
  } else {
    await db.insert(matchStats).values({
      matchId,
      ...(isBasketball ? { topScorers: payload } : { goalScorers: payload }),
    });
  }
}

async function upsertMatchRow(
  row: ParsedMatchRow,
  sportId: string,
  sportSlug: string,
  year: number,
  seasonId: string | null
) {
  const db = requireDb();
  const { parseNduDateLabel, buildExternalKey } = await import("./parser");

  const externalKey = buildExternalKey(row, sportSlug);
  const scheduledAt = parseNduDateLabel(row.dateLabel, year) ?? new Date();
  const status =
    row.isFinished && row.homeScore != null ? "finished" : "scheduled";
  const teams = await resolveMatchTeams(row);

  const existing = await db
    .select()
    .from(matches)
    .where(eq(matches.externalKey, externalKey))
    .limit(1);

  let matchId: string;

  if (existing[0]) {
    matchId = existing[0].id;
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
          scheduledAt,
          updatedAt: new Date(),
          series: row.series,
          groupName: row.group,
          modality: row.modality,
          ...teams,
        })
        .where(eq(matches.id, existing[0].id));
    }
    return { created: false, updated: needsUpdate, matchId };
  }

  const [inserted] = await db
    .insert(matches)
    .values({
      sportId,
      seasonId,
      modality: row.modality,
      series: row.series,
      groupName: row.group,
      externalKey,
      scheduledAt,
      status,
      homeScore: row.homeScore ?? null,
      awayScore: row.awayScore ?? null,
      venue: row.venue ?? null,
      ...teams,
    })
    .returning();

  matchId = inserted.id;
  return { created: true, updated: false, matchId };
}

export async function runFullScrape() {
  const db = requireDb();

  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: "ndu", status: "running" })
    .returning();

  const errors: string[] = [];
  let totalCreated = 0;
  let totalUpdated = 0;

  try {
    const { parseNduJogosPage, modalityToSportSlug } = await import("./parser");
    const sportRows = await db.select().from(sports);
    const sportBySlug = new Map(sportRows.map((s) => [s.slug, s]));

    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    const year = activeSeason?.year ?? new Date().getFullYear();
    const seasonId = activeSeason?.id ?? null;

    const html = await fetchHtml(NDU_JOGOS_URL);
    const allRows = parseNduJogosPage(html);

    for (const row of allRows) {
      const slug = modalityToSportSlug(row.modality);
      if (!slug || !["futebol", "futsal", "basquete"].includes(slug)) continue;

      const sport = sportBySlug.get(slug);
      if (!sport) continue;

      try {
        const result = await upsertMatchRow(
          row,
          sport.id,
          slug,
          year,
          seasonId
        );
        if (result.created) totalCreated++;
        if (result.updated) totalUpdated++;

        if (
          row.nduMatchId &&
          row.isFinished &&
          row.homeScore != null
        ) {
          await syncMatchScorers(
            result.matchId,
            row.nduMatchId,
            slug === "basquete"
          );
        }
      } catch (e) {
        errors.push(
          `${slug}/${row.nduMatchId ?? row.dateLabel}: ${e instanceof Error ? e.message : String(e)}`
        );
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

    return {
      created: totalCreated,
      updated: totalUpdated,
      total: allRows.length,
      errors,
    };
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
