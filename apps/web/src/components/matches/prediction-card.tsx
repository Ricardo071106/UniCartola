import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import type { PredictionOutcome } from "@/lib/data/types";

const outcomeLabels: Record<PredictionOutcome, string> = {
  home_win: "Vitória Casa",
  draw: "Empate",
  away_win: "Vitória Visitante",
};

type PredictionCardProps = {
  homeTeamName: string;
  awayTeamName: string;
  outcome: PredictionOutcome;
  homeScore?: number | null;
  awayScore?: number | null;
  points?: number;
};

export function PredictionCard({
  homeTeamName,
  awayTeamName,
  outcome,
  homeScore,
  awayScore,
  points,
}: PredictionCardProps) {
  const hasExactScore = homeScore != null && awayScore != null;

  return (
    <Card className="border-accent/20 bg-accent/[0.03]">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">Seu palpite</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-center gap-2">
          <Badge variant="default">{outcomeLabels[outcome]}</Badge>
          {hasExactScore && (
            <Badge variant="outline">
              {homeTeamName} {homeScore} x {awayScore} {awayTeamName}
            </Badge>
          )}
        </div>
        {points != null && points > 0 && (
          <p className="text-center text-sm font-semibold text-success">+{points} pontos</p>
        )}
      </CardContent>
    </Card>
  );
}
