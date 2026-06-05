import Link from "next/link";
import { ChevronRight, Calendar, Users } from "lucide-react";
import type { SportMeta } from "@/lib/sports";
import { cn } from "@/lib/utils";

interface SportCardProps {
  sport: SportMeta;
  matchCount?: number;
  athleteCount?: number;
  large?: boolean;
}

export function SportCard({
  sport,
  matchCount = 0,
  athleteCount = 0,
  large,
}: SportCardProps) {
  return (
    <Link href={`/esportes/${sport.slug}`}>
      <div
        className={cn(
          "group relative overflow-hidden rounded-2xl bg-gradient-to-br p-5 text-white shadow-lg sport-card-hover",
          sport.gradient,
          large && "p-8 min-h-[180px]"
        )}
      >
        <div className="absolute right-4 top-4 text-4xl opacity-30 group-hover:opacity-50 transition">
          {sport.emoji}
        </div>
        <p className="text-xs font-semibold uppercase tracking-widest text-white/70">
          Modalidade
        </p>
        <h3 className={cn("font-bold mt-1", large ? "text-3xl" : "text-xl")}>
          {sport.name}
        </h3>
        <p className="text-sm text-white/80 mt-1 line-clamp-2">{sport.tagline}</p>
        <div className="mt-4 flex gap-4 text-xs font-medium text-white/90">
          <span className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5" />
            {matchCount} jogos
          </span>
          <span className="flex items-center gap-1">
            <Users className="h-3.5 w-3.5" />
            {athleteCount} atletas
          </span>
        </div>
        <div className="mt-3 flex items-center gap-1 text-xs font-bold">
          Ver página <ChevronRight className="h-4 w-4 group-hover:translate-x-0.5 transition" />
        </div>
      </div>
    </Link>
  );
}
