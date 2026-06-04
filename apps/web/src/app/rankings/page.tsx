import { db } from "@/lib/db";
import { schools, courses, athletics, userProfiles } from "@unicartola/db/schema";
import { getActiveCompetition, getLeaderboard } from "@/lib/services/leaderboard";
import { LeaderboardTable } from "@/components/rankings/leaderboard-table";
import { getCurrentUserId } from "@/lib/auth";
import { eq } from "drizzle-orm";
import { RankingsTabs } from "@/components/rankings/rankings-tabs";

export const dynamic = "force-dynamic";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; id?: string }>;
}) {
  const params = await searchParams;
  const scope = (params.scope ?? "global") as "global" | "school" | "course" | "athletic";
  const scopeId = params.id ?? null;

  const comp = await getActiveCompetition();
  if (!comp) return <p>Nenhuma competição ativa.</p>;

  const userId = await getCurrentUserId();
  let effectiveScopeId = scopeId;

  if (userId && scope !== "global" && !effectiveScopeId) {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);
    if (profile) {
      if (scope === "school") effectiveScopeId = profile.schoolId;
      if (scope === "course") effectiveScopeId = profile.courseId;
      if (scope === "athletic") effectiveScopeId = profile.athleticId;
    }
  }

  const entries = await getLeaderboard(comp.id, scope, effectiveScopeId, 30);

  const [schoolRows, courseRows, athleticRows] = await Promise.all([
    db.select().from(schools),
    db.select().from(courses),
    db.select().from(athletics),
  ]);

  const scopeTitles: Record<string, string> = {
    global: "Ranking geral",
    school: "Por faculdade",
    course: "Por curso",
    athletic: "Por atlética",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Rankings</h1>
      <RankingsTabs
        currentScope={scope}
        currentId={effectiveScopeId}
        schools={schoolRows}
        courses={courseRows}
        athletics={athleticRows}
      />
      <LeaderboardTable
        title={scopeTitles[scope] ?? "Ranking"}
        entries={entries.map((e) => ({
          rank: e.rank,
          displayName: e.displayName,
          totalPoints: e.totalPoints,
          matchPoints: e.matchPoints,
          statPoints: e.statPoints,
        }))}
      />
    </div>
  );
}
