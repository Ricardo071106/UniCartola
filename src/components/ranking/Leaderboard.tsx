import { Trophy, Flame } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import type { LeaderboardEntry } from "@/types";

interface LeaderboardProps {
  entries: LeaderboardEntry[];
  title?: string;
  highlightTop?: number;
  showUniversity?: boolean;
}

export function Leaderboard({
  entries,
  title,
  highlightTop = 3,
  showUniversity = true,
}: LeaderboardProps) {
  return (
    <div className="space-y-3">
      {title && (
        <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">
          {title}
        </h3>
      )}
      <div className="space-y-2">
        {entries.map((entry) => (
          <div
            key={entry.userId}
            className={cn(
              "flex items-center gap-3 rounded-lg p-3",
              entry.rank <= highlightTop
                ? "bg-[#1e3a5f]/5 border border-[#1e3a5f]/10"
                : "bg-gray-50"
            )}
          >
            <span
              className={cn(
                "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                entry.rank === 1
                  ? "bg-amber-100 text-amber-700"
                  : entry.rank === 2
                    ? "bg-gray-200 text-gray-700"
                    : entry.rank === 3
                      ? "bg-orange-100 text-orange-700"
                      : "bg-white text-gray-500"
              )}
            >
              {entry.rank <= 3 ? (
                <Trophy className="h-4 w-4" />
              ) : (
                entry.rank
              )}
            </span>
            <Avatar className="h-9 w-9">
              {entry.avatarUrl && (
                <AvatarImage src={entry.avatarUrl} alt={entry.nickname} />
              )}
              <AvatarFallback label={entry.nickname} />
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">
                {entry.nickname}
              </p>
              {showUniversity && entry.universityShortName && (
                <p className="text-xs text-gray-500">
                  {entry.universityShortName}
                </p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-[#1e3a5f]">{entry.points}</p>
              <p className="text-[10px] text-gray-500">pts</p>
            </div>
          </div>
        ))}
        {entries.length === 0 && (
          <p className="text-center text-sm text-gray-500 py-6">
            Nenhum dado disponível
          </p>
        )}
      </div>
    </div>
  );
}

export function StreakHighlights({
  entries,
}: {
  entries: LeaderboardEntry[];
}) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-2">
      {entries.map((entry) => (
        <div
          key={entry.userId}
          className="flex shrink-0 flex-col items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-4 min-w-[120px]"
        >
          <Avatar className="h-12 w-12">
            <AvatarFallback label={entry.nickname} />
          </Avatar>
          <p className="text-sm font-bold text-gray-900">{entry.nickname}</p>
          <span className="flex items-center gap-1 text-xs font-semibold text-emerald-700">
            <Flame className="h-3 w-3" />
            Em sequência
          </span>
        </div>
      ))}
    </div>
  );
}
