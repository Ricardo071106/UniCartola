import Link from "next/link";
import { Target, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { formatMatchDate, formatMatchTime } from "@/lib/utils";
import type { MatchWithTeams } from "@/types";

export function FeaturedMatchBanner({ match }: { match: MatchWithTeams }) {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] p-6 text-white shadow-lg">
      <Badge className="mb-3 bg-white/20 text-white border-0">
        Destaque
      </Badge>
      <p className="text-xs uppercase tracking-widest text-white/70">
        {match.modality}
      </p>
      <div className="mt-4 flex items-center justify-center gap-6">
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
            {match.homeUniversity.shortName}
          </div>
          <p className="mt-2 text-sm font-semibold">
            {match.homeUniversity.shortName}
          </p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">VS</p>
          <p className="text-xs text-white/70 mt-1">{match.sport.name}</p>
        </div>
        <div className="text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-white/15 text-xl font-bold">
            {match.awayUniversity.shortName}
          </div>
          <p className="mt-2 text-sm font-semibold">
            {match.awayUniversity.shortName}
          </p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap justify-center gap-4 text-xs text-white/80">
        <span className="flex items-center gap-1">
          <Clock className="h-3 w-3" />
          {formatMatchDate(match.scheduledAt)} · {formatMatchTime(match.scheduledAt)}
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
          className="w-full bg-white text-[#1e3a5f] hover:bg-white/90 font-bold"
          size="lg"
        >
          <Target className="h-5 w-5" />
          Dar Palpite
        </Button>
      </Link>
    </div>
  );
}
