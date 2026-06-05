import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import { getAccuracy } from "@/lib/utils";
import type { UserProfile } from "@/types";

interface ProfileCardProps {
  profile: UserProfile;
}

export function ProfileCard({ profile }: ProfileCardProps) {
  const accuracy = getAccuracy(
    profile.correctPredictions,
    profile.totalPredictions
  );

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          <Avatar className="h-20 w-20">
            {profile.avatarUrl && (
              <AvatarImage src={profile.avatarUrl} alt={profile.nickname} />
            )}
            <AvatarFallback label={profile.nickname} className="text-lg" />
          </Avatar>
          <div>
            <h2 className="text-xl font-bold text-white">{profile.nickname}</h2>
            <p className="text-sm text-zinc-500">Membro UniCartola</p>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3">
          <StatBox label="Palpites" value={profile.totalPredictions} />
          <StatBox label="Acertos" value={profile.correctPredictions} />
          <StatBox label="Taxa" value={`${accuracy}%`} positive />
          <StatBox label="Sequência" value={profile.currentStreak} positive />
          <StatBox label="Ranking geral" value={`#${profile.generalRank}`} />
          <StatBox label="Pontos totais" value={profile.totalPoints} />
          <StatBox label="Semana" value={profile.weeklyPoints} positive />
        </div>
      </CardContent>
    </Card>
  );
}

function StatBox({
  label,
  value,
  positive,
}: {
  label: string;
  value: string | number;
  positive?: boolean;
}) {
  return (
    <div className="rounded-lg bg-zinc-900 p-3 text-center ring-1 ring-zinc-800">
      <p
        className={`text-lg font-bold ${positive ? "text-[#00a86b]" : "text-white"}`}
      >
        {value}
      </p>
      <p className="text-[10px] uppercase tracking-wide text-zinc-500">
        {label}
      </p>
    </div>
  );
}
