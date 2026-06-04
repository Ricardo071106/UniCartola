import { notFound } from "next/navigation";
import { getMatchDetail, getUserPrediction } from "@/lib/services/matches";
import { PredictionForm } from "@/components/matches/prediction-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { getCurrentUserId } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const detail = await getMatchDetail(id);
  if (!detail) notFound();

  const userId = await getCurrentUserId();
  const prediction = userId ? await getUserPrediction(userId, id) : null;

  const canPredict =
    detail.match.predictionsOpen &&
    detail.match.status === "scheduled" &&
    (!detail.match.scheduledAt || new Date() < detail.match.scheduledAt);

  return (
    <div className="mx-auto max-w-lg space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{detail.modality.name}</CardTitle>
          <p className="text-sm text-slate-500">
            Série {detail.match.series} · Grupo {detail.match.groupName} ·{" "}
            {formatDateTime(detail.match.scheduledAt)}
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between py-4">
            <div className="text-center flex-1">
              <p className="text-lg font-bold">{detail.homeTeamName}</p>
            </div>
            <div className="text-center px-4">
              {detail.match.homeScore != null ? (
                <p className="text-3xl font-bold tabular-nums">
                  {detail.match.homeScore} – {detail.match.awayScore}
                </p>
              ) : (
                <p className="text-xl text-slate-400">vs</p>
              )}
            </div>
            <div className="text-center flex-1">
              <p className="text-lg font-bold">{detail.awayTeamName}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Seu palpite</CardTitle>
        </CardHeader>
        <CardContent>
          {userId ? (
            <PredictionForm
              matchId={id}
              homeTeamName={detail.homeTeamName}
              awayTeamName={detail.awayTeamName}
              existing={
                prediction
                  ? {
                      outcome: prediction.outcome,
                      homeScore: prediction.homeScore,
                      awayScore: prediction.awayScore,
                    }
                  : null
              }
              canPredict={canPredict}
            />
          ) : (
            <p className="text-sm text-slate-500">Faça login para palpitar.</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
