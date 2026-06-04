import { achievements } from "@unicartola/db/schema";

type Achievement = typeof achievements.$inferSelect;

const iconMap: Record<string, string> = {
  flame: "🔥",
  crown: "👑",
  soccer: "⚽",
  school: "🎓",
  basketball: "🏀",
  trophy: "🏆",
};

export function AchievementBadge({ achievement }: { achievement: Achievement }) {
  return (
    <div
      className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 dark:border-amber-900 dark:bg-amber-950/30"
      title={achievement.description}
    >
      <span className="mr-1">{iconMap[achievement.icon] ?? "🏆"}</span>
      <span className="text-sm font-medium">{achievement.title}</span>
    </div>
  );
}
