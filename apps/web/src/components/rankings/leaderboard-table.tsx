import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

type Entry = {
  rank: number | null;
  displayName: string;
  totalPoints: number;
  matchPoints: number;
  statPoints: number;
};

export function LeaderboardTable({
  title,
  entries,
}: {
  title: string;
  entries: Entry[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        {entries.length === 0 ? (
          <p className="py-4 text-center text-sm text-slate-500">Nenhum participante ainda.</p>
        ) : (
          <ol className="space-y-2">
            {entries.map((e, i) => (
              <li
                key={i}
                className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 dark:bg-slate-800/50"
              >
                <div className="flex items-center gap-3">
                  <span
                    className={`flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                      e.rank === 1
                        ? "bg-amber-100 text-amber-700"
                        : e.rank === 2
                          ? "bg-slate-200 text-slate-600"
                          : e.rank === 3
                            ? "bg-orange-100 text-orange-700"
                            : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {e.rank ?? i + 1}
                  </span>
                  <span className="font-medium">{e.displayName}</span>
                </div>
                <div className="text-right">
                  <p className="font-bold tabular-nums text-emerald-600">{e.totalPoints} pts</p>
                  <p className="text-xs text-slate-400">
                    {e.matchPoints} jogos · {e.statPoints} mercados
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
