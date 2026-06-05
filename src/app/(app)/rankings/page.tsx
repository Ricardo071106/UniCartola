import { RankingsClient } from "./RankingsClient";
import {
  getRankingByTab,
  getUniversityRankings,
} from "@/lib/queries/rankings";
import { getSession } from "@/lib/auth/session";
import { getUserById } from "@/lib/queries/users";
import type { RankingTab } from "@/types";

export const dynamic = "force-dynamic";

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const params = await searchParams;
  const tabParam = params.tab ?? "general";
  const isUniTab = tabParam === "universities";
  const tab = (
    [
      "general",
      "university",
      "course",
      "athletics",
      "weekly",
      "historical",
    ].includes(tabParam)
      ? tabParam
      : "general"
  ) as RankingTab;

  const session = await getSession();
  const user = session ? await getUserById(session.userId) : null;

  const [userRankings, universityRankings] = await Promise.all([
    isUniTab
      ? Promise.resolve([])
      : getRankingByTab(tab, {
          universityId: user?.universityId,
          courseId: user?.courseId,
          athleticsId: user?.athleticsId,
        }),
    isUniTab || tab === "general"
      ? getUniversityRankings(30)
      : Promise.resolve([]),
  ]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rankings</h1>
        <p className="text-sm text-zinc-400">
          Usuário · Curso · Atlética · Faculdade
        </p>
      </div>
      <RankingsClient
        initialTab={isUniTab ? "universities" : tab}
        userEntries={userRankings}
        universityEntries={universityRankings}
      />
    </div>
  );
}
