import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import type { matches } from "@unicartola/db/schema";

type MatchCardProps = {
  match: typeof matches.$inferSelect;
  modalityName: string;
  homeTeamName: string;
  awayTeamName: string;
  userPrediction?: { outcome: string } | null;
};

const statusLabels: Record<string, string> = {
  scheduled: "Agendado",
  live: "Ao vivo",
  finished: "Finalizado",
  postponed: "Adiado",
  cancelled: "Cancelado",
};

export function MatchCard({
  match,
  modalityName,
  homeTeamName,
  awayTeamName,
  userPrediction,
}: MatchCardProps) {
  const hasScore = match.homeScore != null && match.awayScore != null;
  const isLive = match.status === "live";

  return (
    <Link href={`/jogos/${match.id}`}>
      <Card className="transition-shadow hover:shadow-md">
        <CardContent className="pt-4">
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>{modalityName}</span>
            <span
              className={
                isLive
                  ? "font-semibold text-red-600"
                  : match.status === "finished"
                    ? "text-slate-400"
                    : "text-emerald-600"
              }
            >
              {isLive && (
                <span className="mr-1 inline-block h-2 w-2 animate-pulse rounded-full bg-red-500" />
              )}
              {statusLabels[match.status] ?? match.status}
            </span>
          </div>

          <div className="flex items-center justify-between gap-4">
            <div className="flex-1 text-right">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{homeTeamName}</p>
              {match.series && (
                <p className="text-xs text-slate-400">
                  Série {match.series} · Grupo {match.groupName}
                </p>
              )}
            </div>

            <div className="min-w-[72px] text-center">
              {hasScore ? (
                <p className="text-xl font-bold tabular-nums">
                  {match.homeScore} – {match.awayScore}
                </p>
              ) : (
                <p className="text-sm font-medium text-slate-400">vs</p>
              )}
              <p className="text-xs text-slate-400">{formatDateTime(match.scheduledAt)}</p>
            </div>

            <div className="flex-1 text-left">
              <p className="font-semibold text-slate-900 dark:text-slate-100">{awayTeamName}</p>
            </div>
          </div>

          {userPrediction && (
            <p className="mt-2 text-center text-xs text-emerald-600">
              Seu palpite registrado
            </p>
          )}

          {match.predictionsOpen && match.status === "scheduled" && !userPrediction && (
            <p className="mt-2 text-center text-xs font-medium text-emerald-600">
              Fazer palpite →
            </p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
