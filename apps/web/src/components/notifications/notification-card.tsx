import { Bell, TrendingUp, Trophy, Clock } from "lucide-react";
import type { Notification } from "@/lib/data/types";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  match_reminder: Clock,
  rank_up: TrendingUp,
  school_top: Trophy,
  school_lead: Trophy,
  default: Bell,
};

type NotificationCardProps = {
  notification: Notification;
};

export function NotificationCard({ notification }: NotificationCardProps) {
  const Icon = typeIcons[notification.type] ?? typeIcons.default;

  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-3 transition-colors",
        notification.read ? "border-border bg-white" : "border-accent/20 bg-accent/[0.03]"
      )}
    >
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-muted">
        <Icon className="h-4 w-4 text-accent" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold">{notification.title}</p>
        <p className="text-xs text-muted-foreground">{notification.body}</p>
        <p className="mt-1 text-[10px] text-muted-foreground">
          {notification.createdAt.toLocaleDateString("pt-BR", {
            day: "2-digit",
            month: "short",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </div>
      {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" />}
    </div>
  );
}
