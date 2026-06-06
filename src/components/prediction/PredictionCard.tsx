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
  scheduledAt: Date | string;
}

export function PredictionCard({
  matchId,
  sportSlug = "futsal",
  homeShortName,
  awayShortName,
  existingPrediction,
  matchStatus,
  scheduledAt,
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
          scheduledAt={scheduledAt}
          existingPrediction={existingPrediction}
          variant="card"
        />
      </CardContent>
    </Card>
  );
}
