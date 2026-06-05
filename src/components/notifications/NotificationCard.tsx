import { Bell, TrendingUp, Trophy, Calendar, Award } from "lucide-react";
import { cn } from "@/lib/utils";

interface NotificationCardProps {
  id: string;
  type: string;
  title: string;
  body: string;
  read: boolean;
  createdAt: Date;
}

const typeIcons: Record<string, React.ReactNode> = {
  new_match: <Calendar className="h-4 w-4" />,
  ranking_up: <TrendingUp className="h-4 w-4" />,
  top_10: <Trophy className="h-4 w-4" />,
  university_lead: <Award className="h-4 w-4" />,
  achievement: <Award className="h-4 w-4" />,
  prediction_result: <Bell className="h-4 w-4" />,
};

export function NotificationCard({
  type,
  title,
  body,
  read,
  createdAt,
}: NotificationCardProps) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-lg border p-4",
        read ? "border-gray-50 bg-white" : "border-[#1e3a5f]/20 bg-[#1e3a5f]/5"
      )}
    >
      <div
        className={cn(
          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
          read ? "bg-gray-100 text-gray-500" : "bg-[#1e3a5f] text-white"
        )}
      >
        {typeIcons[type] ?? <Bell className="h-4 w-4" />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-gray-900 text-sm">{title}</p>
        <p className="text-xs text-gray-600 mt-0.5">{body}</p>
        <p className="text-[10px] text-gray-400 mt-1">
          {new Date(createdAt).toLocaleString("pt-BR")}
        </p>
      </div>
      {!read && (
        <span className="h-2 w-2 shrink-0 rounded-full bg-[#1e3a5f] mt-2" />
      )}
    </div>
  );
}
