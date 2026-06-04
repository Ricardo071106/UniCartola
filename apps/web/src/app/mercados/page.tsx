import { getDb } from "@/lib/db";
import { statMarkets, statPredictions, modalities } from "@unicartola/db/schema";
import { eq, and } from "drizzle-orm";
import { getActiveCompetition } from "@/lib/services/leaderboard";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatPredictionForm } from "@/components/markets/stat-prediction-form";

export const dynamic = "force-dynamic";

export default async function MercadosPage() {
  const db = await getDb();
  const comp = await getActiveCompetition();
  const userId = await getCurrentUserId();

  if (!comp) return <p>Competição não configurada.</p>;

  const markets = await db
    .select({
      market: statMarkets,
      modality: modalities,
    })
    .from(statMarkets)
    .leftJoin(modalities, eq(statMarkets.modalityId, modalities.id))
    .where(eq(statMarkets.competitionId, comp.id));

  const userPreds = userId
    ? await db
        .select()
        .from(statPredictions)
        .where(eq(statPredictions.userId, userId))
    : [];

  const predByMarket = Object.fromEntries(userPreds.map((p) => [p.marketId, p]));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Mercados de estatística</h1>
        <p className="text-slate-500">
          Palpite quem será o artilheiro ou maior pontuador da temporada (+15 pts)
        </p>
      </div>

      <div className="space-y-4 max-w-lg">
        {markets.map(({ market, modality }) => (
          <Card key={market.id}>
            <CardHeader>
              <CardTitle className="text-base">{market.title}</CardTitle>
              {modality && (
                <p className="text-xs text-slate-500">{modality.name}</p>
              )}
            </CardHeader>
            <CardContent>
              <p className="mb-3 text-sm text-slate-500">
                Status:{" "}
                <span
                  className={
                    market.status === "open"
                      ? "text-emerald-600 font-medium"
                      : "text-slate-400"
                  }
                >
                  {market.status === "open" ? "Aberto" : market.status}
                </span>
                {" · "}
                {market.pointsOnCorrect} pontos se acertar
              </p>

              {predByMarket[market.id] && (
                <p className="mb-2 text-sm text-emerald-600">
                  Seu palpite: <strong>{predByMarket[market.id].playerName}</strong>
                </p>
              )}

              {userId && market.status === "open" ? (
                <StatPredictionForm
                  marketId={market.id}
                  existingName={predByMarket[market.id]?.playerName}
                />
              ) : !userId ? (
                <p className="text-sm text-slate-500">Faça login para palpitar.</p>
              ) : null}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
