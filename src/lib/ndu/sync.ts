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
import {
  fetchAllNduJogosHtml,
  fetchNduHtml,
  NDU_JOGOS_URL,
} from "./fetch";

export { NDU_JOGOS_URL };
export const NDU_STATS_URL = "https://www.ndu.com.br/estatisticas";

const DEFAULT_SCORER_LIMIT = 25;

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
    const bestLogo = exact.logoUrl ?? logoUrl;
    if (bestLogo && exact.logoUrl !== bestLogo) {
      await db
        .update(athletics)
        .set({ logoUrl: bestLogo })
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

async function resolveTeamFromLogo(
  logoUrl?: string
): Promise<{ teamName: string; logoUrl?: string }> {
  if (!logoUrl) return { teamName: "" };

  const db = requireDb();
  const allAthletics = await db.select().from(athletics);
  const athleticId = logoUrl.match(/atleticas\/(\d+)/i)?.[1];

  if (athleticId) {
    const byId = allAthletics.find((a) =>
      a.logoUrl?.includes(`/atleticas/${athleticId}/`)
    );
    if (byId) return { teamName: byId.name, logoUrl };
  }

  const exact = allAthletics.find((a) => a.logoUrl === logoUrl);
  if (exact) return { teamName: exact.name, logoUrl };

  return { teamName: "", logoUrl };
}

async function syncMatchScorers(
  matchId: string,
  nduMatchId: string,
  isBasketball: boolean
) {
  const db = requireDb();
  const { parseNduResultPage } = await import("./parser");

  const html = await fetchNduHtml(
    `https://www.ndu.com.br/jogos/resultado/${nduMatchId}`
  );
  const { scorers } = parseNduResultPage(html);
  if (scorers.length === 0) return;

  const payload = await Promise.all(
    scorers.map(async (s) => {
      const team = await resolveTeamFromLogo(s.teamLogoUrl);
      return {
        name: s.name,
        team: team.teamName,
        teamLogoUrl: team.logoUrl ?? s.teamLogoUrl,
        ...(isBasketball ? { points: s.total } : { goals: s.total }),
      };
    })
  );

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

async function findDuplicateMatch(
  sportId: string,
  row: ParsedMatchRow,
  homeTeamName: string,
  awayTeamName: string
) {
  const { normalizeTeamName } = await import("./parser");
  const db = requireDb();
  if (!row.series || row.homeScore == null || row.awayScore == null) return null;

  const homeNorm = normalizeTeamName(homeTeamName);
  const awayNorm = normalizeTeamName(awayTeamName);

  const candidates = await db
    .select()
    .from(matches)
    .where(eq(matches.sportId, sportId));

  return (
    candidates.find((m) => {
      if (m.series !== row.series) return false;
      if (m.homeScore !== row.homeScore || m.awayScore !== row.awayScore) {
        return false;
      }
      const mHome = normalizeTeamName(m.homeTeamName ?? "");
      const mAway = normalizeTeamName(m.awayTeamName ?? "");
      return (
        (mHome === homeNorm && mAway === awayNorm) ||
        (mHome === awayNorm && mAway === homeNorm)
      );
    }) ?? null
  );
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
  const { parseNduDateFromBoletim } = await import("./boletim-parser");
  const boletimDate = row.dateLabel.match(/(\d{2}\/\d{2})/)?.[1];
  const scheduledAt =
    parseNduDateLabel(row.dateLabel, year) ??
    (boletimDate ? parseNduDateFromBoletim(boletimDate, year) : null) ??
    new Date();
  const status =
    row.isFinished && row.homeScore != null ? "finished" : "scheduled";
  const teams = await resolveMatchTeams(row);

  let existing = await db
    .select()
    .from(matches)
    .where(eq(matches.externalKey, externalKey))
    .limit(1);

  if (!existing[0]) {
    const duplicate = await findDuplicateMatch(
      sportId,
      row,
      teams.homeTeamName ?? row.homeTeamRaw ?? "",
      teams.awayTeamName ?? row.awayTeamRaw ?? ""
    );
    if (duplicate) existing = [duplicate];
  }

  let matchId: string;

  if (existing[0]) {
    matchId = existing[0].id;
    const needsUpdate =
      existing[0].homeScore !== row.homeScore ||
      existing[0].awayScore !== row.awayScore ||
      existing[0].status !== status ||
      existing[0].externalKey !== externalKey ||
      existing[0].groupName !== row.group;

    if (needsUpdate) {
      await db
        .update(matches)
        .set({
          homeScore: row.homeScore ?? null,
          awayScore: row.awayScore ?? null,
          status,
          scheduledAt,
          updatedAt: new Date(),
          externalKey: row.nduMatchId ? externalKey : existing[0].externalKey,
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

export type ScrapeOptions = {
  syncScorers?: boolean;
  scorerLimit?: number;
};

async function ingestMatchRows(
  allRows: ParsedMatchRow[],
  sportBySlug: Map<string, { id: string; slug: string }>,
  year: number,
  seasonId: string | null,
  errors: string[],
  opts: {
    syncMatchScorers: boolean;
    scorerLimit: number;
  }
) {
  const { modalityToSportSlug } = await import("./parser");
  let totalCreated = 0;
  let totalUpdated = 0;
  let scorersSynced = 0;

  const finishedForScorers: {
    matchId: string;
    nduMatchId: string;
    isBasketball: boolean;
  }[] = [];

  for (const row of allRows) {
    const slug = modalityToSportSlug(row.modality);
    if (!slug || !["futebol", "futsal", "basquete"].includes(slug)) continue;

    const sport = sportBySlug.get(slug);
    if (!sport) continue;

    try {
      const result = await upsertMatchRow(row, sport.id, slug, year, seasonId);
      if (result.created) totalCreated++;
      if (result.updated) totalUpdated++;

      if (
        opts.syncMatchScorers &&
        row.nduMatchId &&
        row.isFinished &&
        row.homeScore != null
      ) {
        finishedForScorers.push({
          matchId: result.matchId,
          nduMatchId: row.nduMatchId,
          isBasketball: slug === "basquete",
        });
      }
    } catch (e) {
      errors.push(
        `${slug}/${row.nduMatchId ?? row.dateLabel}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  for (const item of finishedForScorers.slice(0, opts.scorerLimit)) {
    try {
      await syncMatchScorers(item.matchId, item.nduMatchId, item.isBasketball);
      scorersSynced++;
    } catch (e) {
      errors.push(
        `scorers/${item.nduMatchId}: ${e instanceof Error ? e.message : String(e)}`
      );
    }
  }

  return { totalCreated, totalUpdated, scorersSynced };
}

export async function runFullScrape(options: ScrapeOptions = {}) {
  const db = requireDb();
  const syncMatchScorersFlag =
    options.syncScorers ?? process.env.NDU_SYNC_MATCH_SCORERS === "1";
  const scorerLimit =
    options.scorerLimit ??
    parseInt(process.env.NDU_SCORER_LIMIT ?? String(DEFAULT_SCORER_LIMIT), 10);

  const [run] = await db
    .insert(scrapeRuns)
    .values({ source: "ndu", status: "running" })
    .returning();

  const errors: string[] = [];
  let totalCreated = 0;
  let totalUpdated = 0;
  let scorersSynced = 0;
  let athleticsSynced = 0;
  let statsSynced = 0;
  let boletimMatches = 0;
  let boletimTitle: string | null = null;

  try {
    const { parseNduJogosPage } = await import("./parser");
    const { syncNduAthletics } = await import("./athletics-sync");
    const { parseBoletimMatches } = await import("./boletim-sync");
    const { syncNduStats } = await import("./stats-sync");

    const sportRows = await db.select().from(sports);
    const sportBySlug = new Map(sportRows.map((s) => [s.slug, s]));

    const [activeSeason] = await db
      .select()
      .from(seasons)
      .where(eq(seasons.isActive, true))
      .limit(1);

    const year = activeSeason?.year ?? new Date().getFullYear();
    const seasonId = activeSeason?.id ?? null;

    try {
      athleticsSynced = await syncNduAthletics();
    } catch (e) {
      errors.push(
        `athletics: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    let allRows: ParsedMatchRow[] = [];

    try {
      const boletim = await parseBoletimMatches(year);
      if (boletim) {
        boletimMatches = boletim.rows.length;
        boletimTitle = boletim.title;
        allRows = [...boletim.rows];
      }
    } catch (e) {
      errors.push(`boletim: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const html = await fetchAllNduJogosHtml();
      const jogosRows = parseNduJogosPage(html);
      allRows = [...allRows, ...jogosRows];
    } catch (e) {
      errors.push(`jogos: ${e instanceof Error ? e.message : String(e)}`);
    }

    const ingest = await ingestMatchRows(
      allRows,
      sportBySlug,
      year,
      seasonId,
      errors,
      { syncMatchScorers: syncMatchScorersFlag, scorerLimit }
    );
    totalCreated += ingest.totalCreated;
    totalUpdated += ingest.totalUpdated;
    scorersSynced += ingest.scorersSynced;

    try {
      statsSynced = await syncNduStats(year);
    } catch (e) {
      errors.push(`stats: ${e instanceof Error ? e.message : String(e)}`);
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
      parsed: allRows.length,
      boletimMatches,
      boletimTitle,
      athleticsSynced,
      statsSynced,
      scorersSynced,
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
