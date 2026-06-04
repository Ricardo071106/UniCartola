import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatDateTime } from "@/lib/utils";
import type { Match } from "@/lib/data/types";

type MatchCardProps = {
  match: Match;
  userPrediction?: { outcome: string } | null;
  compact?: boolean;
};

const statusConfig: Record<string, { label: string; variant: "default" | "live" | "secondary" | "success" }> = {
  scheduled: { label: "Não iniciado", variant: "secondary" },
  live: { label: "Ao vivo", variant: "live" },
  finished: { label: "Encerrado", variant: "secondary" },
  postponed: { label: "Adiado", variant: "secondary" },
  cancelled: { label: "Cancelado", variant: "secondary" },
};

export function MatchCard({ match, userPrediction, compact }: MatchCardProps) {
  const hasScore = match.homeScore != null && match.awayScore != null;
  const status = statusConfig[match.status] ?? { label: match.status, variant: "secondary" as const };

  return (
    <Link href={`/jogos/${match.id}`}>
      <Card className="transition-all hover:border-accent/30 hover:shadow-sm">
        <CardContent className={compact ? "p-3" : "p-4"}>
          <div className="mb-3 flex items-center justify-between gap-2">
            <span className="text-xs font-medium text-muted-foreground">{match.modalityName}</span>
            <Badge variant={status.variant}>
              {match.status === "live" && (
                <span className="mr-1.5 inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-red-500" />
              )}
              {status.label}
            </Badge>
          </div>

          <div className="flex items-center gap-3">
            <TeamBlock name={match.homeTeamName} align="right" />
            <ScoreBlock
              homeScore={match.homeScore}
              awayScore={match.awayScore}
              hasScore={hasScore}
              time={formatDateTime(match.scheduledAt)}
            />
            <TeamBlock name={match.awayTeamName} align="left" />
          </div>

          {!compact && match.venue && (
            <p className="mt-2 text-center text-[11px] text-muted-foreground">{match.venue}</p>
          )}

          {userPrediction && (
            <p className="mt-2 text-center text-xs font-medium text-accent">Palpite registrado</p>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}

function TeamBlock({ name, align }: { name: string; align: "left" | "right" }) {
  return (
    <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div className="mx-auto mb-1 flex h-8 w-8 items-center justify-center rounded-full bg-muted text-xs font-bold">
        {name.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-sm font-semibold leading-tight">{name}</p>
    </div>
  );
}

function ScoreBlock({
  homeScore,
  awayScore,
  hasScore,
  time,
}: {
  homeScore: number | null;
  awayScore: number | null;
  hasScore: boolean;
  time: string;
}) {
  return (
    <div className="min-w-[72px] text-center">
      {hasScore ? (
        <p className="text-xl font-bold tabular-nums">
          {homeScore} – {awayScore}
        </p>
      ) : (
        <p className="text-sm font-medium text-muted-foreground">vs</p>
      )}
      <p className="text-[11px] text-muted-foreground">{time}</p>
    </div>
  );
}
