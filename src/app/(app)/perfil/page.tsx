import { getSession } from "@/lib/auth/session";
import { getUserProfile } from "@/lib/queries/users";
import { getUserAchievements } from "@/lib/queries/achievements";
import { getUserNotifications } from "@/lib/queries/notifications";
import { ProfileCard } from "@/components/profile/ProfileCard";
import { AchievementBadge } from "@/components/achievements/AchievementBadge";
import { NotificationCard } from "@/components/notifications/NotificationCard";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function PerfilPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const [profile, achievements, notifications] = await Promise.all([
    getUserProfile(session.userId),
    getUserAchievements(session.userId),
    getUserNotifications(session.userId, 10),
  ]);

  if (!profile) redirect("/cadastro");

  const earned = achievements.filter((a) => a.earned);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Perfil</h1>
        <p className="text-sm text-zinc-500">Suas estatísticas e conquistas</p>
      </div>

      <ProfileCard profile={profile} />

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">
          Conquistas ({earned.length}/{achievements.length})
        </h2>
        <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
          {achievements.map((a) => (
            <AchievementBadge key={a.id} achievement={a} size="sm" />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-bold text-white">Notificações</h2>
        <div className="space-y-2">
          {notifications.map((n) => (
            <NotificationCard
              key={n.id}
              id={n.id}
              type={n.type}
              title={n.title}
              body={n.body}
              read={n.read}
              createdAt={n.createdAt}
            />
          ))}
          {notifications.length === 0 && (
            <p className="py-6 text-center text-sm text-zinc-500">
              Nenhuma notificação ainda
            </p>
          )}
        </div>
      </section>
    </div>
  );
}
