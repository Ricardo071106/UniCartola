import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import {
  userProfiles,
  schools,
  courses,
  athletics,
  matchPredictions,
  pointsLedger,
  userAchievements,
  achievements,
  leaderboardSnapshots,
} from "@unicartola/db/schema";
import { eq, and, sql, isNull } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { getActiveCompetition } from "@/lib/services/leaderboard";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AchievementBadge } from "@/components/gamification/achievement-badge";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const db = await getDb();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [profile] = await db
    .select({
      profile: userProfiles,
      school: schools,
      course: courses,
      athletic: athletics,
    })
    .from(userProfiles)
    .innerJoin(schools, eq(userProfiles.schoolId, schools.id))
    .innerJoin(courses, eq(userProfiles.courseId, courses.id))
    .innerJoin(athletics, eq(userProfiles.athleticId, athletics.id))
    .where(eq(userProfiles.id, userId))
    .limit(1);

  if (!profile) redirect("/cadastro");

  const comp = await getActiveCompetition();

  const [predCount, pointsSum, globalRank, schoolRank, earnedAchievements] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)` })
        .from(matchPredictions)
        .where(eq(matchPredictions.userId, userId)),
      comp
        ? db
            .select({ total: sql<number>`coalesce(sum(${pointsLedger.points}), 0)` })
            .from(pointsLedger)
            .where(
              and(
                eq(pointsLedger.userId, userId),
                eq(pointsLedger.competitionId, comp.id)
              )
            )
        : Promise.resolve([{ total: 0 }]),
      comp
        ? db
            .select()
            .from(leaderboardSnapshots)
            .where(
              and(
                eq(leaderboardSnapshots.userId, userId),
                eq(leaderboardSnapshots.scope, "global"),
                eq(leaderboardSnapshots.competitionId, comp.id),
                isNull(leaderboardSnapshots.scopeId)
              )
            )
            .limit(1)
        : Promise.resolve([]),
      comp
        ? db
            .select()
            .from(leaderboardSnapshots)
            .where(
              and(
                eq(leaderboardSnapshots.userId, userId),
                eq(leaderboardSnapshots.scope, "school"),
                eq(leaderboardSnapshots.scopeId, profile.profile.schoolId),
                eq(leaderboardSnapshots.competitionId, comp.id)
              )
            )
            .limit(1)
        : Promise.resolve([]),
      db
        .select({ achievement: achievements, earnedAt: userAchievements.earnedAt })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(eq(userAchievements.userId, userId)),
    ]);

  const totalPreds = Number(predCount[0]?.count ?? 0);
  const totalPoints = Number(pointsSum[0]?.total ?? 0);

  return (
    <div className="space-y-6 max-w-lg mx-auto">
      <header className="text-center">
        <div className="mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600 text-2xl font-bold text-white">
          {profile.profile.displayName.charAt(0).toUpperCase()}
        </div>
        <h1 className="text-2xl font-bold">{profile.profile.displayName}</h1>
        <p className="text-slate-500">
          {profile.school.name} · {profile.course.name}
        </p>
        <p className="text-sm text-slate-400">{profile.athletic.name}</p>
      </header>

      <div className="grid grid-cols-2 gap-3">
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold text-emerald-600">{totalPoints}</p>
            <p className="text-xs text-slate-500">Pontos totais</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{totalPreds}</p>
            <p className="text-xs text-slate-500">Palpites feitos</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{globalRank[0]?.rank ?? "—"}</p>
            <p className="text-xs text-slate-500">Posição geral</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 text-center">
            <p className="text-2xl font-bold">{schoolRank[0]?.rank ?? "—"}</p>
            <p className="text-xs text-slate-500">Na faculdade</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          {earnedAchievements.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhuma conquista ainda. Continue palpitando!</p>
          ) : (
            <div className="flex flex-wrap gap-2">
              {earnedAchievements.map(({ achievement }) => (
                <AchievementBadge key={achievement.id} achievement={achievement} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
