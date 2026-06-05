import Link from "next/link";
import { MapPin, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatMatchDate, formatMatchTime } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

interface MatchCardProps {
  match: MatchWithTeams;
  compact?: boolean;
}

function TeamBadge({
  shortName,
  name,
  showFullName,
}: {
  shortName: string;
  name: string;
  showFullName: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 text-sm font-bold text-[#1e3a5f]">
        {shortName.slice(0, 3)}
      </div>
      <span className="text-xs font-semibold text-gray-900 text-center line-clamp-1">
        {shortName}
      </span>
      {showFullName && (
        <span className="text-[10px] text-gray-500 text-center line-clamp-1 max-w-[80px]">
          {name}
        </span>
      )}
    </div>
  );
}

function statusLabel(status: string) {
  switch (status) {
    case "live":
      return { label: "Ao vivo", variant: "live" as const };
    case "finished":
      return { label: "Encerrado", variant: "secondary" as const };
    case "cancelled":
      return { label: "Cancelado", variant: "outline" as const };
    default:
      return { label: "Agendado", variant: "outline" as const };
  }
}

export function MatchCard({ match, compact = false }: MatchCardProps) {
  const status = statusLabel(match.status);
  const showScore =
    match.status === "finished" || match.status === "live";
  const score =
    showScore && match.homeScore != null && match.awayScore != null
      ? `${match.homeScore} - ${match.awayScore}`
      : "vs";

  return (
    <Link href={`/partida/${match.id}`}>
      <Card className="transition-shadow hover:shadow-md active:scale-[0.99]">
        <CardContent className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <Badge variant="secondary">{match.modality}</Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <TeamBadge
              shortName={match.homeUniversity.shortName}
              name={match.homeUniversity.name}
              showFullName={!compact}
            />
            <div className="flex flex-col items-center px-2">
              <span className="text-xl font-bold text-gray-900">{score}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wide">
                {match.sport.name}
              </span>
            </div>
            <TeamBadge
              shortName={match.awayUniversity.shortName}
              name={match.awayUniversity.name}
              showFullName={!compact}
            />
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatMatchDate(match.scheduledAt)} ·{" "}
                {formatMatchTime(match.scheduledAt)}
              </span>
              {match.venue && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {match.venue}
                </span>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
