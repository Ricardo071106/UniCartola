import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getMatchById,
  getMatchStats,
  getUserPrediction,
  DEMO_USER_ID,
} from "@/lib/data";
import { PredictionForm } from "@/components/matches/prediction-form";
import { PredictionCard } from "@/components/matches/prediction-card";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/utils";
import { MapPin, Calendar, ChevronLeft } from "lucide-react";

export default async function MatchPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const match = getMatchById(id);
  if (!match) notFound();

  const stats = getMatchStats(id);
  const prediction = getUserPrediction(DEMO_USER_ID, id);
  const canPredict = match.predictionsOpen && match.status === "scheduled";

  const statusLabel =
    match.status === "live"
      ? "Ao vivo"
      : match.status === "finished"
        ? "Encerrado"
        : "Não iniciado";

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link
        href="/jogos"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="h-4 w-4" />
        Voltar aos jogos
      </Link>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <Badge variant={match.status === "live" ? "live" : "secondary"}>{statusLabel}</Badge>
            <span className="text-sm text-muted-foreground">{match.modalityName}</span>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4 py-2">
            <TeamHeader name={match.homeTeamName} />
            <div className="text-center">
              {match.homeScore != null ? (
                <p className="text-4xl font-bold tabular-nums">
                  {match.homeScore} – {match.awayScore}
                </p>
              ) : (
                <p className="text-2xl font-medium text-muted-foreground">vs</p>
              )}
            </div>
            <TeamHeader name={match.awayTeamName} align="right" />
          </div>

          <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <Calendar className="h-4 w-4" />
              {formatDateTime(match.scheduledAt)}
            </span>
            {match.venue && (
              <span className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4" />
                {match.venue}
              </span>
            )}
          </div>
        </CardContent>
      </Card>

      {stats && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Estatísticas</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {stats.goals.length > 0 && (
              <StatSection title="Gols">
                {stats.goals.map((g, i) => (
                  <p key={i} className="text-sm">
                    {g.minute}&apos; — {g.player} ({g.team})
                  </p>
                ))}
              </StatSection>
            )}
            {stats.assists.length > 0 && (
              <StatSection title="Assistências">
                {stats.assists.map((a, i) => (
                  <p key={i} className="text-sm">
                    {a.player} ({a.team})
                  </p>
                ))}
              </StatSection>
            )}
            {stats.cards.length > 0 && (
              <StatSection title="Cartões">
                {stats.cards.map((c, i) => (
                  <p key={i} className="text-sm">
                    {c.type === "yellow" ? "🟨" : "🟥"} {c.player} ({c.team})
                  </p>
                ))}
              </StatSection>
            )}
            {stats.topScorers.length > 0 && (
              <StatSection title="Artilheiros">
                {stats.topScorers.map((s, i) => (
                  <p key={i} className="text-sm">
                    {s.player} ({s.team}) — {s.count} gol{s.count > 1 ? "s" : ""}
                  </p>
                ))}
              </StatSection>
            )}
          </CardContent>
        </Card>
      )}

      {prediction && !canPredict ? (
        <PredictionCard
          homeTeamName={match.homeTeamName}
          awayTeamName={match.awayTeamName}
          outcome={prediction.outcome}
          homeScore={prediction.homeScore}
          awayScore={prediction.awayScore}
        />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Seu palpite</CardTitle>
          </CardHeader>
          <CardContent>
            <PredictionForm
              matchId={id}
              homeTeamName={match.homeTeamName}
              awayTeamName={match.awayTeamName}
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
          </CardContent>
        </Card>
      )}

      <Card className="bg-muted/50">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground">
            <strong>Pontuação:</strong> Vencedor +3 pts · Placar exato +5 pts · Ambos +8 pts
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function TeamHeader({ name, align = "left" }: { name: string; align?: "left" | "right" }) {
  return (
    <div className={`flex-1 ${align === "right" ? "text-right" : "text-left"}`}>
      <div
        className={`mb-2 flex h-14 w-14 items-center justify-center rounded-xl bg-muted text-lg font-bold ${align === "right" ? "ml-auto" : ""}`}
      >
        {name.slice(0, 2).toUpperCase()}
      </div>
      <p className="text-lg font-bold">{name}</p>
    </div>
  );
}

function StatSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
        {title}
      </p>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
