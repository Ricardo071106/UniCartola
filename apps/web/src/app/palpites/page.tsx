import Link from "next/link";
import { db } from "@/lib/db";
import { matchPredictions, matches, modalities, teams } from "@unicartola/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateTime } from "@/lib/utils";
import { alias } from "drizzle-orm/pg-core";

const homeTeam = alias(teams, "home");
const awayTeam = alias(teams, "away");

export const dynamic = "force-dynamic";

export default async function PalpitesPage() {
  const userId = await getCurrentUserId();
  if (!userId) {
    return <p className="text-center text-slate-500">Faça login para ver seus palpites.</p>;
  }

  const preds = await db
    .select({
      prediction: matchPredictions,
      match: matches,
      modality: modalities,
      homeName: homeTeam.name,
      awayName: awayTeam.name,
    })
    .from(matchPredictions)
    .innerJoin(matches, eq(matchPredictions.matchId, matches.id))
    .innerJoin(modalities, eq(matches.modalityId, modalities.id))
    .innerJoin(homeTeam, eq(matches.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(matches.awayTeamId, awayTeam.id))
    .where(eq(matchPredictions.userId, userId))
    .orderBy(desc(matchPredictions.createdAt));

  const outcomeLabels: Record<string, string> = {
    home_win: "Vitória mandante",
    away_win: "Vitória visitante",
    draw: "Empate",
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Meus palpites</h1>

      {preds.length === 0 ? (
        <p className="text-slate-500">Você ainda não fez nenhum palpite.</p>
      ) : (
        <div className="space-y-3">
          {preds.map(({ prediction, match, modality, homeName, awayName }) => (
            <Link key={prediction.id} href={`/jogos/${match.id}`}>
              <Card className="hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-500">{modality.name}</p>
                      <p className="font-semibold">
                        {homeName} vs {awayName}
                      </p>
                      <p className="text-sm text-emerald-600 mt-1">
                        {outcomeLabels[prediction.outcome]}
                        {prediction.homeScore != null &&
                          ` · ${prediction.homeScore}×${prediction.awayScore}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-slate-400">
                      <p>{match.status}</p>
                      <p>{formatDateTime(match.scheduledAt)}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
