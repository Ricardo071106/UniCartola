import { requireDb } from "@/lib/db";
import {
  marketPredictions,
  matches,
  sports,
  nduScorerStats,
  athletics,
} from "@/lib/db/schema";
import { and, eq, or } from "drizzle-orm";
import { isPlayoffPhase } from "@/lib/ndu/playoff-phases";
import { normalizeTeamName } from "@/lib/ndu/normalize";
import { endOfDayBrazil } from "@/lib/utils";
import { realMatchesOnly } from "@/lib/queries/match-filters";
import type { SportSlug } from "@/types";
import type { SeriesLetter } from "@/lib/queries/standings";
import type { MarketPredictionType } from "@/lib/queries/market-predictions";

export type MarketLockReason = "eliminated" | "game_day" | "live";

export type MarketLockInfo = {
  locked: boolean;
  reason?: MarketLockReason;
  message?: string;
};

type TeamMatch = typeof matches.$inferSelect;

function teamLostFinishedMatch(m: TeamMatch, athleticsId: string): boolean {
  if (m.status !== "finished" || m.homeScore == null || m.awayScore == null) {
    return false;
  }
  const isHome = m.homeAthleticsId === athleticsId;
  const isAway = m.awayAthleticsId === athleticsId;
  if (!isHome && !isAway) return false;
  if (isHome && m.homeScore < m.awayScore) return true;
  if (isAway && m.awayScore < m.homeScore) return true;
  return false;
}

function isGameDayFreeze(m: TeamMatch, now: Date): boolean {
  const kickoff = new Date(m.scheduledAt);
  if (Number.isNaN(kickoff.getTime())) return false;
  if (now.getTime() < kickoff.getTime()) return false;
  return now.getTime() <= endOfDayBrazil(kickoff).getTime();
}

async function resolveAthleticsIdForPlayer(
  sportSlug: SportSlug,
  sportId: string,
  series: string,
  playerName: string
): Promise<string | null> {
  const db = requireDb();
  const { getCurrentStatsYear } = await import("@/lib/ndu/stats-period");
  const year = await getCurrentStatsYear();

  const [row] = await db
    .select()
    .from(nduScorerStats)
    .where(
      and(
        eq(nduScorerStats.sportSlug, sportSlug),
        eq(nduScorerStats.series, series),
        eq(nduScorerStats.playerName, playerName),
        eq(nduScorerStats.seasonYear, year)
      )
    )
    .limit(1);

  if (!row) return null;

  if (row.athleticNduId != null) {
    const [ath] = await db
      .select({ id: athletics.id })
      .from(athletics)
      .where(eq(athletics.nduAthleticId, row.athleticNduId))
      .limit(1);
    if (ath) return ath.id;
  }

  const teamNorm = row.teamName ? normalizeTeamName(row.teamName) : "";
  if (!teamNorm) return null;

  const teamMatches = await db
    .select({
      homeAthleticsId: matches.homeAthleticsId,
      awayAthleticsId: matches.awayAthleticsId,
      homeTeamName: matches.homeTeamName,
      awayTeamName: matches.awayTeamName,
    })
    .from(matches)
    .where(
      and(
        realMatchesOnly(),
        eq(matches.sportId, sportId),
        eq(matches.series, series)
      )
    );

  for (const m of teamMatches) {
    if (
      m.homeAthleticsId &&
      normalizeTeamName(m.homeTeamName ?? "") === teamNorm
    ) {
      return m.homeAthleticsId;
    }
    if (
      m.awayAthleticsId &&
      normalizeTeamName(m.awayTeamName ?? "") === teamNorm
    ) {
      return m.awayAthleticsId;
    }
  }

  return null;
}

async function getTeamMatches(
  sportId: string,
  series: string,
  athleticsId: string
): Promise<TeamMatch[]> {
  const db = requireDb();
  return db
    .select()
    .from(matches)
    .where(
      and(
        realMatchesOnly(),
        eq(matches.sportId, sportId),
        eq(matches.series, series),
        or(
          eq(matches.homeAthleticsId, athleticsId),
          eq(matches.awayAthleticsId, athleticsId)
        )
      )
    );
}

export async function evaluateMarketLock(
  sportSlug: SportSlug,
  series: SeriesLetter,
  marketType: MarketPredictionType,
  athleticsId: string | null | undefined,
  playerName: string | null | undefined,
  persistedLocked = false,
  persistedReason?: string | null
): Promise<MarketLockInfo> {
  if (persistedLocked && persistedReason === "eliminated") {
    return {
      locked: true,
      reason: "eliminated",
      message:
        "Time ou jogador eliminado no mata-mata — aposta perdida, sem alterações",
    };
  }

  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);
  if (!sport) return { locked: false };

  let teamAthleticsId = athleticsId ?? null;
  if (!teamAthleticsId && playerName?.trim()) {
    teamAthleticsId = await resolveAthleticsIdForPlayer(
      sportSlug,
      sport.id,
      series,
      playerName.trim()
    );
  }

  if (!teamAthleticsId) return { locked: false };

  const teamMatches = await getTeamMatches(sport.id, series, teamAthleticsId);
  const now = new Date();

  for (const m of teamMatches) {
    if (
      isPlayoffPhase(m.groupName) &&
      teamLostFinishedMatch(m, teamAthleticsId)
    ) {
      return {
        locked: true,
        reason: "eliminated",
        message:
          marketType === "champion"
            ? "Seu time foi eliminado no mata-mata — aposta perdida"
            : "Time do jogador eliminado no mata-mata — aposta perdida",
      };
    }
  }

  for (const m of teamMatches) {
    if (m.status === "live") {
      return {
        locked: true,
        reason: "live",
        message: "Jogo do time em andamento — palpite congelado até meia-noite",
      };
    }
  }

  for (const m of teamMatches) {
    if (isGameDayFreeze(m, now)) {
      return {
        locked: true,
        reason: "game_day",
        message:
          "Jogo do time hoje — palpite congelado do apito inicial até meia-noite",
      };
    }
  }

  return { locked: false };
}

export async function syncEliminationLocks(
  userId: string,
  currencyMode: "play" | "real"
): Promise<number> {
  const db = requireDb();
  const rows = await db
    .select({
      prediction: marketPredictions,
      sport: sports,
    })
    .from(marketPredictions)
    .innerJoin(sports, eq(marketPredictions.sportId, sports.id))
    .where(
      and(
        eq(marketPredictions.userId, userId),
        eq(marketPredictions.currencyMode, currencyMode),
        eq(marketPredictions.isLocked, false)
      )
    );

  let locked = 0;

  for (const row of rows) {
    const lock = await evaluateMarketLock(
      row.sport.slug as SportSlug,
      row.prediction.series as SeriesLetter,
      row.prediction.marketType,
      row.prediction.athleticsId,
      row.prediction.playerName
    );

    if (lock.reason === "eliminated") {
      await db
        .update(marketPredictions)
        .set({
          isLocked: true,
          lockReason: "eliminated",
          pointsEarned: 0,
        })
        .where(eq(marketPredictions.id, row.prediction.id));
      locked++;
    }
  }

  return locked;
}

export async function getMarketLocksForUser(
  userId: string,
  sportSlug: SportSlug,
  series: SeriesLetter,
  currencyMode: "play" | "real"
): Promise<Record<MarketPredictionType, MarketLockInfo>> {
  const db = requireDb();
  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);

  const defaults: Record<MarketPredictionType, MarketLockInfo> = {
    champion: { locked: false },
    top_scorer: { locked: false },
    top_cards: { locked: false },
  };

  if (!sport) return defaults;

  const rows = await db
    .select()
    .from(marketPredictions)
    .where(
      and(
        eq(marketPredictions.userId, userId),
        eq(marketPredictions.sportId, sport.id),
        eq(marketPredictions.series, series),
        eq(marketPredictions.currencyMode, currencyMode)
      )
    );

  for (const row of rows) {
    const lock = await evaluateMarketLock(
      sportSlug,
      series,
      row.marketType,
      row.athleticsId,
      row.playerName,
      row.isLocked,
      row.lockReason
    );
    defaults[row.marketType] = lock;
  }

  return defaults;
}
