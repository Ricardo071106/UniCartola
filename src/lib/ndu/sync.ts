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
import { startOfDayBrazil } from "@/lib/utils";
import type { ParsedMatchRow } from "./parser";
import { fetchAllNduJogosRows } from "./jogos-fetch";
import { fetchNduHtml, NDU_JOGOS_URL } from "./fetch";

export { NDU_JOGOS_URL };
export const NDU_STATS_URL = "https://www.ndu.com.br/estatisticas";

const DEFAULT_SCORER_LIMIT = 25;

type ResolvedTeam = {
  universityId: string;
  athleticsId: string | null;
  teamName: string;
};

type AthleticRow = typeof athletics.$inferSelect;
type MatchRow = typeof matches.$inferSelect;

/** Cache em memória — evita recarregar atléticas/jogos a cada partida (569+ queries). */
class NduSyncContext {
  athletics: AthleticRow[] = [];
  athleticsByNduId = new Map<number, AthleticRow>();
  athleticsByNormalized = new Map<string, AthleticRow>();
  fallbackUniId: string | null = null;
  matchesByExternalKey = new Map<string, MatchRow>();
  matchesBySportId = new Map<string, MatchRow[]>();
  teamCache = new Map<string, ResolvedTeam>();
  normalizeTeamName!: (name: string) => string;

  async init() {
    const { normalizeTeamName } = await import("./parser");
    this.normalizeTeamName = normalizeTeamName;
    const db = requireDb();

    this.athletics = await db.select().from(athletics);
    for (const a of this.athletics) {
      if (a.nduAthleticId != null) {
        this.athleticsByNduId.set(a.nduAthleticId, a);
      }
      if (a.normalizedName) {
        this.athleticsByNormalized.set(a.normalizedName, a);
      }
    }

    const [fallbackUni] = await db.select().from(universities).limit(1);
    if (!fallbackUni) throw new Error("No universities in database");
    this.fallbackUniId = fallbackUni.id;

    const allMatches = await db.select().from(matches);
    for (const m of allMatches) {
      if (m.externalKey) this.matchesByExternalKey.set(m.externalKey, m);
      const list = this.matchesBySportId.get(m.sportId) ?? [];
      list.push(m);
      this.matchesBySportId.set(m.sportId, list);
    }
  }

  private registerAthletic(a: AthleticRow) {
    this.athletics.push(a);
    if (a.nduAthleticId != null) this.athleticsByNduId.set(a.nduAthleticId, a);
    if (a.normalizedName) this.athleticsByNormalized.set(a.normalizedName, a);
  }

  registerMatch(m: MatchRow) {
    if (m.externalKey) this.matchesByExternalKey.set(m.externalKey, m);
    const list = this.matchesBySportId.get(m.sportId) ?? [];
    const idx = list.findIndex((x) => x.id === m.id);
    if (idx >= 0) list[idx] = m;
    else list.push(m);
    this.matchesBySportId.set(m.sportId, list);
  }

  resolveTeamFromLogo(logoUrl?: string): { teamName: string; logoUrl?: string } {
    if (!logoUrl) return { teamName: "" };

    const athleticId = logoUrl.match(/atleticas\/(\d+)/i)?.[1];
    if (athleticId) {
      const byId = this.athletics.find((a) =>
        a.logoUrl?.includes(`/atleticas/${athleticId}/`)
      );
      if (byId) return { teamName: byId.name, logoUrl };
    }

    const exact = this.athletics.find((a) => a.logoUrl === logoUrl);
    if (exact) return { teamName: exact.name, logoUrl };

    return { teamName: "", logoUrl };
  }

  async resolveTeam(rawName: string, logoUrl?: string): Promise<ResolvedTeam> {
    const { athleticIdFromLogoUrl } = await import("./parser");
    if (rawName.length > 200) {
      rawName = rawName.slice(0, 200).trim();
    }
    const cacheKey = `${rawName}|${logoUrl ?? ""}`;
    const cached = this.teamCache.get(cacheKey);
    if (cached) return cached;

    const db = requireDb();
    const normalized = this.normalizeTeamName(rawName);
    const fallbackUniId = this.fallbackUniId;
    if (!fallbackUniId) throw new Error("No universities in database");

    const nduId = athleticIdFromLogoUrl(logoUrl);
    if (nduId) {
      const byNduId = this.athleticsByNduId.get(parseInt(nduId, 10));
      if (byNduId) {
        const bestLogo = byNduId.logoUrl ?? logoUrl;
        if (bestLogo && byNduId.logoUrl !== bestLogo) {
          await db
            .update(athletics)
            .set({ logoUrl: bestLogo })
            .where(eq(athletics.id, byNduId.id));
          byNduId.logoUrl = bestLogo;
        }
        const resolved = {
          universityId: byNduId.universityId,
          athleticsId: byNduId.id,
          teamName: byNduId.name,
        };
        this.teamCache.set(cacheKey, resolved);
        return resolved;
      }
    }

    const exact =
      this.athleticsByNormalized.get(normalized) ??
      this.athletics.find(
        (a) => a.nduAlias && this.normalizeTeamName(a.nduAlias) === normalized
      ) ??
      this.athletics.find((a) => a.name === rawName);

    if (exact) {
      const bestLogo = exact.logoUrl ?? logoUrl;
      if (bestLogo && exact.logoUrl !== bestLogo) {
        await db
          .update(athletics)
          .set({ logoUrl: bestLogo })
          .where(eq(athletics.id, exact.id));
        exact.logoUrl = bestLogo;
      }
      const resolved = {
        universityId: exact.universityId,
        athleticsId: exact.id,
        teamName: exact.name,
      };
      this.teamCache.set(cacheKey, resolved);
      return resolved;
    }

    const [createdAthletic] = await db
      .insert(athletics)
      .values({
        universityId: fallbackUniId,
        name: rawName,
        nduAlias: rawName,
        normalizedName: normalized,
        logoUrl: logoUrl ?? null,
      })
      .returning();

    this.registerAthletic(createdAthletic);
    await db.insert(teamMappingQueue).values({
      rawName,
      suggestedAthleticsId: createdAthletic.id,
      needsReview: true,
    });

    const resolved = {
      universityId: fallbackUniId,
      athleticsId: createdAthletic.id,
      teamName: rawName,
    };
    this.teamCache.set(cacheKey, resolved);
    return resolved;
  }

  async resolveMatchTeams(row: ParsedMatchRow) {
    const fallbackUniId = this.fallbackUniId;
    if (!fallbackUniId) throw new Error("No universities in database");

    const homeLogo = this.resolveTeamFromLogo(row.homeLogoUrl);
    const awayLogo = this.resolveTeamFromLogo(row.awayLogoUrl);

    const homeRaw = (row.homeTeamRaw || homeLogo.teamName || "").trim();
    const awayRaw = (row.awayTeamRaw || awayLogo.teamName || "").trim();

    if (homeRaw && awayRaw) {
      const [home, away] = await Promise.all([
        this.resolveTeam(homeRaw, row.homeLogoUrl ?? homeLogo.logoUrl),
        this.resolveTeam(awayRaw, row.awayLogoUrl ?? awayLogo.logoUrl),
      ]);
      return {
        homeUniversityId: home.universityId,
        awayUniversityId: away.universityId,
        homeAthleticsId: home.athleticsId,
        awayAthleticsId: away.athleticsId,
        homeTeamName: home.teamName || homeRaw,
        awayTeamName: away.teamName || awayRaw,
      };
    }

    return {
      homeUniversityId: fallbackUniId,
      awayUniversityId: fallbackUniId,
      homeAthleticsId: null,
      awayAthleticsId: null,
      homeTeamName: homeRaw || null,
      awayTeamName: awayRaw || null,
    };
  }

  findDuplicateMatch(
    sportId: string,
    row: ParsedMatchRow,
    homeTeamName: string,
    awayTeamName: string,
    homeAthleticsId: string | null,
    awayAthleticsId: string | null
  ): MatchRow | null {
    if (!row.series || row.homeScore == null || row.awayScore == null) return null;

    const homeNorm = this.normalizeTeamName(homeTeamName);
    const awayNorm = this.normalizeTeamName(awayTeamName);
    const candidates = this.matchesBySportId.get(sportId) ?? [];

    return (
      candidates.find((m) => {
        if (m.series !== row.series) return false;
        if (m.homeScore !== row.homeScore || m.awayScore !== row.awayScore) {
          return false;
        }
        return teamsMatch(
          m,
          homeNorm,
          awayNorm,
          homeAthleticsId,
          awayAthleticsId,
          this.normalizeTeamName
        );
      }) ?? null
    );
  }

  findDuplicateByTeams(
    sportId: string,
    row: ParsedMatchRow,
    homeTeamName: string,
    awayTeamName: string,
    homeAthleticsId: string | null,
    awayAthleticsId: string | null
  ): MatchRow | null {
    if (!row.series || !homeTeamName || !awayTeamName) return null;

    const homeNorm = this.normalizeTeamName(homeTeamName);
    const awayNorm = this.normalizeTeamName(awayTeamName);
    const candidates = this.matchesBySportId.get(sportId) ?? [];

    return (
      candidates.find((m) => {
        if (m.series !== row.series) return false;
        return teamsMatch(
          m,
          homeNorm,
          awayNorm,
          homeAthleticsId,
          awayAthleticsId,
          this.normalizeTeamName
        );
      }) ?? null
    );
  }
}

async function syncMatchScorers(
  matchId: string,
  nduMatchId: string,
  isBasketball: boolean,
  ctx: NduSyncContext
) {
  const db = requireDb();
  const { parseNduResultPage } = await import("./parser");

  const html = await fetchNduHtml(
    `https://www.ndu.com.br/jogos/resultado/${nduMatchId}`
  );
  const { scorers } = parseNduResultPage(html);
  if (scorers.length === 0) return;

  const payload = scorers.map((s) => {
    const team = ctx.resolveTeamFromLogo(s.teamLogoUrl);
    return {
      name: s.name,
      team: team.teamName,
      teamLogoUrl: team.logoUrl ?? s.teamLogoUrl,
      ...(isBasketball ? { points: s.total } : { goals: s.total }),
    };
  });

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

function teamsMatch(
  m: (typeof matches.$inferSelect),
  homeNorm: string,
  awayNorm: string,
  homeAthleticsId: string | null,
  awayAthleticsId: string | null,
  normalizeTeamName: (name: string) => string
) {
  if (
    homeAthleticsId &&
    awayAthleticsId &&
    m.homeAthleticsId &&
    m.awayAthleticsId
  ) {
    const direct =
      m.homeAthleticsId === homeAthleticsId &&
      m.awayAthleticsId === awayAthleticsId;
    const swapped =
      m.homeAthleticsId === awayAthleticsId &&
      m.awayAthleticsId === homeAthleticsId;
    if (direct || swapped) return true;
  }

  const mHome = normalizeTeamName(m.homeTeamName ?? "");
  const mAway = normalizeTeamName(m.awayTeamName ?? "");
  const direct = mHome === homeNorm && mAway === awayNorm;
  const swapped = mHome === awayNorm && mAway === homeNorm;
  return direct || swapped;
}

function resolveMatchStatus(
  row: ParsedMatchRow,
  scheduledAt: Date
): "scheduled" | "finished" {
  const hasScore =
    row.isFinished &&
    row.homeScore != null &&
    row.awayScore != null;
  const isFuture = scheduledAt >= startOfDayBrazil();
  if (!hasScore && isFuture) return "scheduled";
  if (hasScore && !isFuture) return "finished";
  if (!hasScore) return "scheduled";
  return isFuture ? "scheduled" : "finished";
}

async function upsertMatchRow(
  row: ParsedMatchRow,
  sportId: string,
  sportSlug: string,
  year: number,
  seasonId: string | null,
  ctx: NduSyncContext
) {
  const db = requireDb();
  const { parseNduDateLabel, buildExternalKey } = await import("./parser");

  const externalKey = buildExternalKey(row, sportSlug);
  const { parseNduMatchDateTime } = await import("./match-datetime");
  const scheduledAt =
    parseNduMatchDateTime(row.dateLabel, year) ??
    parseNduDateLabel(row.dateLabel, year) ??
    new Date();
  const status = resolveMatchStatus(row, scheduledAt);
  const teams = await ctx.resolveMatchTeams(row);

  let existing: MatchRow | undefined =
    ctx.matchesByExternalKey.get(externalKey);

  const homeName = teams.homeTeamName ?? row.homeTeamRaw ?? "";
  const awayName = teams.awayTeamName ?? row.awayTeamRaw ?? "";

  if (!existing && row.nduMatchId) {
    existing =
      ctx.findDuplicateMatch(
        sportId,
        row,
        homeName,
        awayName,
        teams.homeAthleticsId,
        teams.awayAthleticsId
      ) ?? undefined;
  }

  if (!existing && homeName && awayName) {
    existing =
      ctx.findDuplicateByTeams(
        sportId,
        row,
        homeName,
        awayName,
        teams.homeAthleticsId,
        teams.awayAthleticsId
      ) ?? undefined;
  }

  let matchId: string;

  if (existing) {
    matchId = existing.id;
    const preferJogos = Boolean(row.nduMatchId);
    const needsUpdate =
      existing.homeScore !== row.homeScore ||
      existing.awayScore !== row.awayScore ||
      existing.status !== status ||
      existing.externalKey !== externalKey ||
      existing.groupName !== row.group ||
      existing.sportId !== sportId ||
      existing.modality !== row.modality ||
      (preferJogos &&
        (existing.homeAthleticsId !== teams.homeAthleticsId ||
          existing.awayAthleticsId !== teams.awayAthleticsId));

    if (needsUpdate) {
      const safeTeams = {
        ...teams,
        homeTeamName: teams.homeTeamName?.slice(0, 255) ?? null,
        awayTeamName: teams.awayTeamName?.slice(0, 255) ?? null,
      };
      const [updated] = await db
        .update(matches)
        .set({
          sportId,
          homeScore: row.homeScore ?? null,
          awayScore: row.awayScore ?? null,
          status,
          scheduledAt,
          updatedAt: new Date(),
          externalKey: row.nduMatchId ? externalKey : existing.externalKey,
          series: row.series,
          groupName: row.group?.slice(0, 8) ?? row.group,
          modality: row.modality,
          venue: row.venue?.slice(0, 200) ?? existing.venue,
          ...safeTeams,
        })
        .where(eq(matches.id, existing.id))
        .returning();
      if (updated) ctx.registerMatch(updated);
    }
    return { created: false, updated: needsUpdate, matchId };
  }

  const safeTeams = {
    ...teams,
    homeTeamName: teams.homeTeamName?.slice(0, 255) ?? null,
    awayTeamName: teams.awayTeamName?.slice(0, 255) ?? null,
  };
  const safeVenue = row.venue?.slice(0, 200) ?? null;
  const safeGroup = row.group?.slice(0, 8) ?? row.group;

  const [inserted] = await db
    .insert(matches)
    .values({
      sportId,
      seasonId,
      modality: row.modality,
      series: row.series,
      groupName: safeGroup,
      externalKey,
      scheduledAt,
      status,
      homeScore: row.homeScore ?? null,
      awayScore: row.awayScore ?? null,
      venue: safeVenue,
      ...safeTeams,
    })
    .returning();

  matchId = inserted.id;
  ctx.registerMatch(inserted);
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

  const sortedRows = [...allRows].sort((a, b) => {
    if (a.isFinished === b.isFinished) return 0;
    return a.isFinished ? -1 : 1;
  });

  const total = sortedRows.filter((row) => {
    const slug = modalityToSportSlug(row.modality);
    return slug && ["futebol", "futsal", "basquete"].includes(slug);
  }).length;

  console.log("[ndu] Carregando cache de atléticas e jogos...");
  const ctx = new NduSyncContext();
  await ctx.init();
  console.log(
    `[ndu] Cache pronto (${ctx.athletics.length} atléticas, ${ctx.matchesByExternalKey.size} jogos existentes)`
  );

  let processed = 0;
  for (const row of sortedRows) {
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
        seasonId,
        ctx
      );
      processed++;
      if (processed === 1 || processed % 25 === 0 || processed === total) {
        console.log(`[ndu] Jogos processados: ${processed}/${total}`);
      }
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
      await syncMatchScorers(
        item.matchId,
        item.nduMatchId,
        item.isBasketball,
        ctx
      );
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
      console.log("[ndu] Sincronizando atléticas...");
      athleticsSynced = await syncNduAthletics();
      console.log(`[ndu] Atléticas: ${athleticsSynced}`);
    } catch (e) {
      errors.push(
        `athletics: ${e instanceof Error ? e.message : String(e)}`
      );
    }

    let allRows: ParsedMatchRow[] = [];

    try {
      console.log("[ndu] Lendo boletim PDF...");
      const boletim = await parseBoletimMatches(year);
      if (boletim) {
        boletimMatches = boletim.rows.length;
        boletimTitle = boletim.title;
        allRows = [...boletim.rows];
        console.log(
          `[ndu] Boletim: ${boletimMatches} jogos${boletimTitle ? ` (${boletimTitle})` : ""}`
        );
      } else {
        console.log("[ndu] Boletim: nenhum PDF disponível");
      }
    } catch (e) {
      errors.push(`boletim: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      console.log("[ndu] Buscando jogos no site...");
      const jogosRows = await fetchAllNduJogosRows();
      allRows = [...allRows, ...jogosRows];
      console.log(`[ndu] Jogos do site: ${jogosRows.length}`);
    } catch (e) {
      errors.push(`jogos: ${e instanceof Error ? e.message : String(e)}`);
    }

    console.log(`[ndu] Gravando ${allRows.length} jogos no banco (pode levar alguns minutos)...`);
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
      console.log("[ndu] Sincronizando artilheiros e cartões...");
      statsSynced = await syncNduStats();
      console.log(`[ndu] Estatísticas: ${statsSynced} registros`);
    } catch (e) {
      errors.push(`stats: ${e instanceof Error ? e.message : String(e)}`);
    }

    try {
      const { scoreFinishedMatchPredictions } = await import(
        "@/lib/services/score-predictions"
      );
      const scored = await scoreFinishedMatchPredictions();
      if (scored > 0) {
        console.log(`[ndu] Palpites pontuados: ${scored}`);
      }
    } catch (e) {
      errors.push(`scoring: ${e instanceof Error ? e.message : String(e)}`);
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
