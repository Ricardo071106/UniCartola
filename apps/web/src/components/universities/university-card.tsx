import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import type { University } from "@/lib/data/types";

type UniversityCardProps = {
  university: University;
  compact?: boolean;
};

export function UniversityCard({ university, compact }: UniversityCardProps) {
  return (
    <Link href={`/faculdades/${university.slug}`}>
      <Card className="transition-all hover:border-accent/30 hover:shadow-sm">
        <CardContent className={compact ? "flex items-center gap-3 p-3" : "p-4"}>
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-muted text-xs font-bold">
            {university.shortName.slice(0, 3)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate font-semibold">{university.name}</p>
            <p className="text-xs text-muted-foreground">{university.city}</p>
          </div>
          {!compact && (
            <div className="text-right">
              <p className="text-lg font-bold tabular-nums text-accent">#{university.rank}</p>
              <p className="text-[10px] text-muted-foreground">{university.weeklyPoints} pts</p>
            </div>
          )}
        </CardContent>
      </Card>
    </Link>
  );
}
