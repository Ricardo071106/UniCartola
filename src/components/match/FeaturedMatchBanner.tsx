import Link from "next/link";
import Image from "next/image";
import { Target, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMatchDate, formatMatchTime } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

function TeamCircle({
  name,
  logoUrl,
}: {
  name: string;
  logoUrl: string | null;
}) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={64}
        height={64}
        className="mx-auto h-16 w-16 rounded-full object-cover ring-2 ring-white/30"
        unoptimized
      />
    );
  }
  return (
    <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
      {name.slice(0, 3)}
    </div>
  );
}

export function FeaturedMatchBanner({ match }: { match: MatchWithTeams }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] p-6 text-white shadow-lg">
      <Badge className="mb-3 border-0 bg-white/20 text-white">Destaque</Badge>
      <p className="text-xs uppercase tracking-widest text-white/70">
        {match.modality}
      </p>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="max-w-[120px] text-center">
          <TeamCircle
            name={match.homeTeam.name}
            logoUrl={match.homeTeam.logoUrl}
          />
          <p className="mt-2 line-clamp-2 text-sm font-semibold">
            {match.homeTeam.name}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">VS</p>
          <p className="mt-1 text-xs text-white/70">{match.sport.name}</p>
        </div>
        <div className="max-w-[120px] text-center">
          <TeamCircle
            name={match.awayTeam.name}
            logoUrl={match.awayTeam.logoUrl}
          />
          <p className="mt-2 line-clamp-2 text-sm font-semibold">
            {match.awayTeam.name}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-white/80">
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
      <Link href={`/partida/${match.id}`} className="mt-5 block">
        <Button
          variant="secondary"
          className="w-full bg-white font-bold text-[#1e3a5f] hover:bg-white/90"
          size="lg"
        >
          <Target className="h-5 w-5" />
          Dar Palpite
        </Button>
      </Link>
    </div>
  );
}
