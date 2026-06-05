import { notFound } from "next/navigation";
import { MapPin, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { PredictionCard } from "@/components/prediction/PredictionCard";
import { getMatchById } from "@/lib/queries/matches";
import { getUserPredictionForMatch } from "@/lib/queries/predictions";
import { getSession } from "@/lib/auth/session";
import { formatMatchDate, formatMatchTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PartidaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = await getMatchById(id);
  if (!match) notFound();

  const session = await getSession();
  const prediction = session
    ? await getUserPredictionForMatch(session.userId, id)
    : null;

  return (
    <div className="space-y-6">
      <div className="cartola-card p-6">
        <div className="flex justify-center gap-2 mb-4">
          <Badge variant="secondary">{match.modality}</Badge>
          <Badge
            variant={
              match.status === "live"
                ? "live"
                : match.status === "finished"
                  ? "secondary"
                  : "outline"
            }
          >
            {match.status === "live"
              ? "Ao vivo"
              : match.status === "finished"
                ? "Encerrado"
                : "Agendado"}
          </Badge>
        </div>

        <div className="flex items-center justify-between gap-4">
          <TeamBlock uni={match.homeUniversity} score={match.homeScore} />
          <div className="text-center">
            {match.homeScore != null && match.awayScore != null ? (
              <p className="text-3xl font-bold text-white">
                {match.homeScore} - {match.awayScore}
              </p>
            ) : (
              <p className="text-2xl font-bold text-zinc-500">VS</p>
            )}
            <p className="text-xs text-zinc-500 mt-1">{match.sport.name}</p>
          </div>
          <TeamBlock uni={match.awayUniversity} score={match.awayScore} />
        </div>

        <div className="mt-6 flex flex-wrap justify-center gap-4 text-sm text-zinc-400">
          <span className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            {formatMatchDate(match.scheduledAt)} ·{" "}
            {formatMatchTime(match.scheduledAt)}
          </span>
          {match.venue && (
            <span className="flex items-center gap-1">
              <MapPin className="h-4 w-4" />
              {match.venue}
            </span>
          )}
        </div>
      </div>

      {match.stats && match.status === "finished" && (
        <div className="cartola-card p-4">
          <h3 className="font-bold text-white mb-3 flex items-center gap-2">
            <Target className="h-4 w-4 text-[#00a86b]" />
            Estatísticas
          </h3>
          <div className="grid grid-cols-2 gap-3 text-sm">
            {match.stats.goalsHome != null && (
              <>
                <StatRow label="Gols (mandante)" value={match.stats.goalsHome} />
                <StatRow label="Gols (visitante)" value={match.stats.goalsAway} />
              </>
            )}
            {match.stats.basketsHome != null && (
              <>
                <StatRow label="Cestas (mandante)" value={match.stats.basketsHome} />
                <StatRow label="Cestas (visitante)" value={match.stats.basketsAway} />
              </>
            )}
            <StatRow label="Assist. mandante" value={match.stats.assistsHome} />
            <StatRow label="Assist. visitante" value={match.stats.assistsAway} />
            <StatRow label="Amarelos (M/V)" value={`${match.stats.yellowCardsHome}/${match.stats.yellowCardsAway}`} />
            <StatRow label="Vermelhos (M/V)" value={`${match.stats.redCardsHome}/${match.stats.redCardsAway}`} />
          </div>
        </div>
      )}

      <PredictionCard
        matchId={match.id}
        homeShortName={match.homeUniversity.shortName}
        awayShortName={match.awayUniversity.shortName}
        matchStatus={match.status}
        existingPrediction={
          prediction
            ? {
                result: prediction.result,
                homeScore: prediction.homeScore,
                awayScore: prediction.awayScore,
              }
            : null
        }
      />
    </div>
  );
}

function TeamBlock({
  uni,
  score,
}: {
  uni: { shortName: string; name: string };
  score: number | null;
}) {
  return (
    <div className="flex flex-col items-center flex-1">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#006b3f]/20 text-2xl font-bold text-[#00a86b]">
        {uni.shortName.slice(0, 3)}
      </div>
      <p className="mt-2 font-bold text-white">{uni.shortName}</p>
      <p className="text-xs text-zinc-500 text-center line-clamp-2">{uni.name}</p>
      {score != null && (
        <p className="mt-1 text-lg font-bold text-[#00a86b]">{score}</p>
      )}
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string | number | null }) {
  return (
    <div className="flex justify-between rounded-lg bg-zinc-900 px-3 py-2">
      <span className="text-zinc-400">{label}</span>
      <span className="font-semibold text-white">{value ?? "—"}</span>
    </div>
  );
}
