"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { MatchCard } from "@/components/match/MatchCard";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import type { MatchWithTeams, SportSlug } from "@/types";

const sports: { slug: SportSlug | "all"; label: string }[] = [
  { slug: "all", label: "Todos" },
  { slug: "futebol", label: "Futebol" },
  { slug: "futsal", label: "Futsal" },
  { slug: "basquete", label: "Basquete" },
];

const tabs = [
  { id: "today", label: "Hoje" },
  { id: "tomorrow", label: "Amanhã" },
  { id: "week", label: "Próxima Semana" },
  { id: "finished", label: "Encerrados" },
] as const;

interface JogosClientProps {
  initialMatches: MatchWithTeams[];
  initialSport?: SportSlug;
  initialTab: (typeof tabs)[number]["id"];
}

export function JogosClient({
  initialMatches,
  initialSport,
  initialTab,
}: JogosClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function updateParams(sport?: string, tab?: string) {
    const p = new URLSearchParams(searchParams.toString());
    if (sport && sport !== "all") p.set("sport", sport);
    else p.delete("sport");
    if (tab) p.set("tab", tab);
    router.push(`/jogos?${p.toString()}`);
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {sports.map((s) => {
          const active =
            (s.slug === "all" && !initialSport) || s.slug === initialSport;
          return (
            <button
              key={s.slug}
              type="button"
              onClick={() =>
                updateParams(s.slug === "all" ? undefined : s.slug, initialTab)
              }
              className={cn(
                "shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors",
                active
                  ? "bg-[#1e3a5f] text-white"
                  : "bg-white border border-gray-200 text-gray-600"
              )}
            >
              {s.label}
            </button>
          );
        })}
      </div>

      <Tabs
        value={initialTab}
        onValueChange={(v) =>
          updateParams(initialSport, v)
        }
      >
        <TabsList className="w-full grid grid-cols-4">
          {tabs.map((t) => (
            <TabsTrigger key={t.id} value={t.id} className="text-xs">
              {t.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value={initialTab}>
          <div className="space-y-3 mt-2">
            {initialMatches.map((m) => (
              <MatchCard key={m.id} match={m} />
            ))}
            {initialMatches.length === 0 && (
              <p className="py-12 text-center text-sm text-gray-500">
                Nenhuma partida neste período
              </p>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
