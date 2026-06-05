"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RankingTable } from "@/components/ranking/RankingTable";
import type { LeaderboardEntry, UniversityRankingEntry, RankingTab } from "@/types";

const userTabs: { id: RankingTab | "universities"; label: string }[] = [
  { id: "general", label: "Geral" },
  { id: "university", label: "Faculdade" },
  { id: "course", label: "Curso" },
  { id: "athletics", label: "Atlética" },
  { id: "weekly", label: "Semanal" },
  { id: "historical", label: "Histórico" },
  { id: "universities", label: "Faculdades" },
];

interface RankingsClientProps {
  initialTab: RankingTab | "universities";
  userEntries: LeaderboardEntry[];
  universityEntries: UniversityRankingEntry[];
}

export function RankingsClient({
  initialTab,
  userEntries,
  universityEntries,
}: RankingsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setTab(tab: string) {
    const p = new URLSearchParams(searchParams.toString());
    p.set("tab", tab);
    router.push(`/rankings?${p.toString()}`);
  }

  return (
    <Tabs value={initialTab} onValueChange={setTab}>
      <TabsList className="w-full flex flex-wrap h-auto gap-1 p-1">
        {userTabs.map((t) => (
          <TabsTrigger
            key={t.id}
            value={t.id}
            className="text-xs flex-1 min-w-[80px]"
          >
            {t.label}
          </TabsTrigger>
        ))}
      </TabsList>

      {userTabs.map((t) => (
        <TabsContent key={t.id} value={t.id}>
          {t.id === "universities" ? (
            <RankingTable
              type="universities"
              universityEntries={universityEntries}
            />
          ) : (
            <RankingTable type="users" userEntries={userEntries} />
          )}
          {t.id === "weekly" && (
            <p className="mt-3 text-xs text-zinc-400 text-center">
              Ranking semanal — reinicia toda segunda-feira
            </p>
          )}
        </TabsContent>
      ))}
    </Tabs>
  );
}
