import { UserProfileCard } from "@/components/profile/user-profile-card";
import { AchievementBadge } from "@/components/gamification/achievement-badge";
import { NotificationCard } from "@/components/notifications/notification-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getDemoUser,
  getUserAchievements,
  getNotifications,
  getAllAchievements,
  DEMO_USER_ID,
} from "@/lib/data";

export default function PerfilPage() {
  const user = getDemoUser();
  const earned = getUserAchievements(DEMO_USER_ID);
  const earnedIds = new Set(earned.map((a) => a.id));
  const allAchievements = getAllAchievements();
  const notifications = getNotifications(DEMO_USER_ID);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <UserProfileCard user={user} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Conquistas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {allAchievements.map((a) => (
              <AchievementBadge
                key={a.id}
                achievement={a}
                earned={earnedIds.has(a.id)}
                size="sm"
              />
            ))}
          </div>
        </CardContent>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Notificações</h2>
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard key={n.id} notification={n} />
          ))}
        </div>
      </section>
    </div>
  );
}
