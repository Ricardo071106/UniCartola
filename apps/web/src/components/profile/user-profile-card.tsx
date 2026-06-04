import { Card, CardContent } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import type { DemoUser } from "@/lib/data/types";

type UserProfileCardProps = {
  user: DemoUser;
  showStats?: boolean;
};

export function UserProfileCard({ user, showStats = true }: UserProfileCardProps) {
  const accuracy =
    user.predictionsCount > 0
      ? Math.round((user.correctPredictions / user.predictionsCount) * 100)
      : 0;

  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-4">
        <Avatar name={user.displayName} size="lg" />
        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-bold">{user.displayName}</h2>
          <p className="text-sm text-muted-foreground">{user.schoolName}</p>
          <p className="text-xs text-muted-foreground">
            {user.courseName} · {user.athleticName}
          </p>
        </div>
        {showStats && (
          <div className="text-right">
            <p className="text-2xl font-bold text-accent">{user.totalPoints}</p>
            <p className="text-[10px] text-muted-foreground">pontos</p>
          </div>
        )}
      </CardContent>
      {showStats && (
        <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
          {[
            { label: "Palpites", value: user.predictionsCount },
            { label: "Acerto", value: `${accuracy}%` },
            { label: "Geral", value: `#${user.globalRank}` },
            { label: "Faculdade", value: `#${user.schoolRank}` },
          ].map((stat) => (
            <div key={stat.label} className="px-2 py-3 text-center">
              <p className="text-sm font-bold">{stat.value}</p>
              <p className="text-[10px] text-muted-foreground">{stat.label}</p>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
