"use client";

import { Card, CardContent } from "@/components/ui/card";
import { MatchPredictionForm } from "./MatchPredictionForm";
import type { MatchPredictionView } from "@/types";
import type { SportSlug } from "@/types";

interface PredictionCardProps {
  matchId: string;
  sportSlug?: SportSlug;
  homeShortName: string;
  awayShortName: string;
  existingPrediction?: MatchPredictionView | null;
  matchStatus: string;
}

export function PredictionCard({
  matchId,
  sportSlug = "futsal",
  homeShortName,
  awayShortName,
  existingPrediction,
  matchStatus,
}: PredictionCardProps) {
  return (
    <Card>
      <CardContent className="pt-6">
        <MatchPredictionForm
          matchId={matchId}
          sportSlug={sportSlug}
          homeTeamName={homeShortName}
          awayTeamName={awayShortName}
          matchStatus={matchStatus}
          existingPrediction={existingPrediction}
          variant="card"
        />
      </CardContent>
    </Card>
  );
}
