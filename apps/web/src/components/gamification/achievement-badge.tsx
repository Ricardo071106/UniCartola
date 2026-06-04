import { cn } from "@/lib/utils";
import {
  Trophy,
  Flame,
  Target,
  Crown,
  Medal,
  GraduationCap,
  CircleDot,
} from "lucide-react";

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  trophy: Trophy,
  flame: Flame,
  target: Target,
  crown: Crown,
  medal: Medal,
  school: GraduationCap,
  soccer: CircleDot,
  basketball: CircleDot,
  football: CircleDot,
};

type AchievementBadgeProps = {
  achievement: { title: string; description: string; icon: string };
  earned?: boolean;
  size?: "sm" | "md";
};

export function AchievementBadge({ achievement, earned = true, size = "md" }: AchievementBadgeProps) {
  const Icon = iconMap[achievement.icon] ?? Trophy;

  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 rounded-lg border px-3 py-2",
        earned ? "border-accent/20 bg-accent/5" : "border-border bg-muted opacity-50",
        size === "sm" && "px-2 py-1 text-xs"
      )}
      title={achievement.description}
    >
      <Icon className={cn("text-accent", size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4")} />
      <span className={cn("font-medium", size === "sm" ? "text-xs" : "text-sm")}>
        {achievement.title}
      </span>
    </div>
  );
}
