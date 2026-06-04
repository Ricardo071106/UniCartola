import { db } from "@/lib/db";
import {
  matches,
  teams,
  modalities,
  matchPredictions,
  schools,
} from "@unicartola/db/schema";
import { eq, desc, and, inArray } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";

const homeTeam = alias(teams, "home_team");
const awayTeam = alias(teams, "away_team");

export async function getMatchesByStatus(
  competitionId: string,
  statuses: ("scheduled" | "live" | "finished")[],
  limit = 20
) {
  return db
    .select({
      match: matches,
      modality: modalities,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
    })
    .from(matches)
    .innerJoin(modalities, eq(matches.modalityId, modalities.id))
    .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(
      and(
        eq(matches.competitionId, competitionId),
        inArray(matches.status, statuses)
      )
    )
    .orderBy(desc(matches.scheduledAt))
    .limit(limit);
}

export async function getMatchDetail(matchId: string) {
  const rows = await db
    .select({
      match: matches,
      modality: modalities,
      homeTeamName: homeTeam.name,
      awayTeamName: awayTeam.name,
    })
    .from(matches)
    .innerJoin(modalities, eq(matches.modalityId, modalities.id))
    .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(eq(matches.id, matchId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getSchoolMatches(schoolId: string, competitionId: string, limit = 15) {
  const schoolTeams = await db
    .select({ id: teams.id })
    .from(teams)
    .where(eq(teams.schoolId, schoolId));

  const teamIds = schoolTeams.map((t) => t.id);
  if (!teamIds.length) return [];

  const allMatches = await getMatchesByStatus(competitionId, ["scheduled", "live", "finished"], 50);
  return allMatches.filter(
    (m) => teamIds.includes(m.match.homeTeamId) || teamIds.includes(m.match.awayTeamId)
  ).slice(0, limit);
}

export async function getUserPrediction(userId: string, matchId: string) {
  const [pred] = await db
    .select()
    .from(matchPredictions)
    .where(
      and(eq(matchPredictions.userId, userId), eq(matchPredictions.matchId, matchId))
    )
    .limit(1);
  return pred ?? null;
}
