import {
  Target,
  Flame,
  Trophy,
  Medal,
  Star,
  Zap,
  Award,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { AchievementItem } from "@/types";

const iconMap: Record<string, React.ReactNode> = {
  target: <Target className="h-5 w-5" />,
  flame: <Flame className="h-5 w-5" />,
  trophy: <Trophy className="h-5 w-5" />,
  medal: <Medal className="h-5 w-5" />,
  star: <Star className="h-5 w-5" />,
  zap: <Zap className="h-5 w-5" />,
  award: <Award className="h-5 w-5" />,
};

interface AchievementBadgeProps {
  achievement: AchievementItem;
  size?: "sm" | "md";
}

export function AchievementBadge({
  achievement,
  size = "md",
}: AchievementBadgeProps) {
  const earned = achievement.earned;

  return (
    <div
      className={cn(
        "flex flex-col items-center gap-2 rounded-xl border p-4 text-center transition-all",
        earned
          ? "border-emerald-200 bg-emerald-50"
          : "border-gray-100 bg-gray-50 opacity-60",
        size === "sm" && "p-3"
      )}
      title={achievement.description}
    >
      <div
        className={cn(
          "flex items-center justify-center rounded-full",
          earned ? "bg-emerald-600 text-white" : "bg-gray-200 text-gray-400",
          size === "md" ? "h-12 w-12" : "h-10 w-10"
        )}
      >
        {iconMap[achievement.icon] ?? <Award className="h-5 w-5" />}
      </div>
      <p className="text-xs font-bold text-gray-900 line-clamp-2">
        {achievement.name}
      </p>
      {earned && achievement.earnedAt && (
        <p className="text-[10px] text-emerald-600">
          {new Date(achievement.earnedAt).toLocaleDateString("pt-BR")}
        </p>
      )}
    </div>
  );
}
