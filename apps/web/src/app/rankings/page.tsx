import { Suspense } from "react";
import { RankingTable } from "@/components/rankings/ranking-table";
import { RankingsTabs } from "@/components/rankings/rankings-tabs";
import {
  getLeaderboard,
  getUniversities,
  getCourses,
  getAthletics,
  getDemoUser,
} from "@/lib/data";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; id?: string }>;
}) {
  const params = await searchParams;
  const scope = (params.scope ?? "global") as
    | "global"
    | "school"
    | "course"
    | "athletic"
    | "weekly"
    | "historical";

  const demoUser = getDemoUser();
  let scopeId = params.id ?? null;

  if (scope === "school" && !scopeId) scopeId = demoUser.schoolId;
  if (scope === "course" && !scopeId) scopeId = demoUser.courseId;
  if (scope === "athletic" && !scopeId) scopeId = demoUser.athleticId;

  const entries = getLeaderboard(scope, scopeId, 30);

  const scopeTitles: Record<string, string> = {
    global: "Ranking geral",
    school: "Ranking por faculdade",
    course: "Ranking por curso",
    athletic: "Ranking por atlética",
    weekly: "Ranking semanal",
    historical: "Ranking histórico",
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Rankings</h1>
        <p className="text-sm text-muted-foreground">
          Usuário vs usuário · Faculdade vs faculdade · Atlética vs atlética
        </p>
      </div>

      <Suspense fallback={<div className="h-20 animate-pulse rounded-lg bg-muted" />}>
        <RankingsTabs
          currentScope={scope}
          currentId={scopeId}
          schools={getUniversities()}
          courses={getCourses()}
          athletics={getAthletics()}
        />
      </Suspense>

      <RankingTable
        title={scopeTitles[scope] ?? "Ranking"}
        entries={entries}
        showAccuracy
      />
    </div>
  );
}
