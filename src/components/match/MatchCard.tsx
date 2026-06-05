import Link from "next/link";
import Image from "next/image";
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
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  return (
    <div className="flex min-w-[80px] max-w-[110px] flex-col items-center gap-1">
      {logoUrl ? (
        <Image
          src={logoUrl}
          alt=""
          width={48}
          height={48}
          className="h-12 w-12 rounded-full object-cover ring-2 ring-zinc-700"
          unoptimized
        />
      ) : (
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-800 text-sm font-bold text-[#00a86b] ring-2 ring-zinc-700">
          {name.slice(0, 3).toUpperCase()}
        </div>
      )}
      <span className="line-clamp-2 text-center text-xs font-semibold leading-tight text-white">
        {name}
      </span>
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
          <div className="mb-3 flex items-center justify-between gap-2">
            <Badge variant="secondary" className="truncate max-w-[60%]">
              {match.modality}
            </Badge>
            <Badge variant={status.variant}>{status.label}</Badge>
          </div>

          <div className="flex items-center justify-between gap-2">
            <TeamBadge
              name={match.homeTeam.name}
              logoUrl={match.homeTeam.logoUrl}
            />
            <div className="flex shrink-0 flex-col items-center px-2">
              <span className="text-xl font-bold text-white">{score}</span>
              <span className="text-[10px] uppercase tracking-wide text-zinc-500">
                {match.sport.name}
              </span>
            </div>
            <TeamBadge
              name={match.awayTeam.name}
              logoUrl={match.awayTeam.logoUrl}
            />
          </div>

          {!compact && (
            <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-zinc-500">
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
