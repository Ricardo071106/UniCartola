import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import type { LeaderboardEntry } from "@/lib/data/types";

type RankingTableProps = {
  title: string;
  entries: LeaderboardEntry[];
  showSchool?: boolean;
  showAccuracy?: boolean;
};

export function RankingTable({
  title,
  entries,
  showSchool = true,
  showAccuracy = false,
}: RankingTableProps) {
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-border">
          {entries.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-muted-foreground">Nenhum dado ainda.</p>
          ) : (
            entries.map((entry) => (
              <div key={entry.userId} className="flex items-center gap-3 px-4 py-3">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                    entry.rank <= 3 ? "bg-accent text-white" : "bg-muted text-muted-foreground"
                  }`}
                >
                  {entry.rank}
                </span>
                <Avatar name={entry.displayName} size="sm" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{entry.displayName}</p>
                  {showSchool && (
                    <p className="truncate text-xs text-muted-foreground">{entry.schoolName}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold tabular-nums">{entry.totalPoints}</p>
                  {showAccuracy && (
                    <p className="text-[10px] text-muted-foreground">{entry.correctRate}% acerto</p>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}

export const Leaderboard = RankingTable;
