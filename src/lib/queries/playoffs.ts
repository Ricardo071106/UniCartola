import { requireDb } from "@/lib/db";
import { matches, sports, universities, athletics } from "@/lib/db/schema";
import { and, eq, inArray, or, sql } from "drizzle-orm";
import type { PlayoffBracket, PlayoffMatch, SportSlug } from "@/types";
import type { SeriesLetter } from "./standings";

const PLAYOFF_PHASES = ["Oitavas", "Quartas", "Semi", "Final"] as const;
const ROUND_ORDER: Record<(typeof PLAYOFF_PHASES)[number], number> = {
  Oitavas: 0,
  Quartas: 1,
  Semi: 2,
  Final: 3,
};

const PLAYOFF_PHASE_ALIASES: Record<string, (typeof PLAYOFF_PHASES)[number]> = {
  oitavas: "Oitavas",
  "8ªs": "Oitavas",
  "8as": "Oitavas",
  quartas: "Quartas",
  "4ªs": "Quartas",
  "4as": "Quartas",
  semi: "Semi",
  semifinal: "Semi",
  final: "Final",
};

function normalizePhase(phase: string): (typeof PLAYOFF_PHASES)[number] | null {
  const key = phase.toLowerCase().replace(/\s/g, "");
  return PLAYOFF_PHASE_ALIASES[key] ?? null;
}

function phaseRank(phase: string): number {
  const normalized = normalizePhase(phase);
  return normalized ? ROUND_ORDER[normalized] : 99;
}

function winnerSide(
  homeScore: number | null,
  awayScore: number | null
): "home" | "away" | "draw" | null {
  if (homeScore == null || awayScore == null) return null;
  if (homeScore > awayScore) return "home";
  if (awayScore > homeScore) return "away";
  return "draw";
}

export async function getPlayoffBracket(
  sportSlug: SportSlug,
  series: SeriesLetter
): Promise<PlayoffBracket | null> {
  const db = requireDb();

  const [sport] = await db
    .select()
    .from(sports)
    .where(eq(sports.slug, sportSlug))
    .limit(1);

  if (!sport) return null;

  const playoffRows = await db
    .select()
    .from(matches)
    .where(
      and(
        eq(matches.sportId, sport.id),
        eq(matches.series, series),
        or(
          ...Object.keys(PLAYOFF_PHASE_ALIASES).map(
            (phase) => sql`lower(${matches.groupName}) = lower(${phase})`
          )
        )
      )
    );

  if (playoffRows.length === 0) return null;

  const uniIds = [
    ...new Set(
      playoffRows.flatMap((m) => [m.homeUniversityId, m.awayUniversityId])
    ),
  ];
  const athIds = [
    ...new Set(
      playoffRows
        .flatMap((m) => [m.homeAthleticsId, m.awayAthleticsId])
        .filter(Boolean)
    ),
  ] as string[];

  const [uniRows, athRows] = await Promise.all([
    db.select().from(universities).where(inArray(universities.id, uniIds)),
    athIds.length
      ? db.select().from(athletics).where(inArray(athletics.id, athIds))
      : Promise.resolve([]),
  ]);

  const uniMap = new Map(uniRows.map((u) => [u.id, u]));
  const athMap = new Map(athRows.map((a) => [a.id, a]));

  const playoffMatches: PlayoffMatch[] = playoffRows
    .map((m) => {
      const homeAth = m.homeAthleticsId
        ? athMap.get(m.homeAthleticsId)
        : null;
      const awayAth = m.awayAthleticsId
        ? athMap.get(m.awayAthleticsId)
        : null;
      const homeUni = uniMap.get(m.homeUniversityId);
      const awayUni = uniMap.get(m.awayUniversityId);

      const homeName =
        m.homeTeamName ?? homeAth?.name ?? homeUni?.shortName ?? "Casa";
      const awayName =
        m.awayTeamName ?? awayAth?.name ?? awayUni?.shortName ?? "Fora";

      const phase = normalizePhase(m.groupName ?? "") ?? m.groupName ?? "";
      const win = winnerSide(m.homeScore, m.awayScore);

      return {
        id: m.id,
        phase,
        scheduledAt: m.scheduledAt,
        homeName,
        awayName,
        homeLogoUrl: homeAth?.logoUrl ?? homeUni?.logoUrl ?? null,
        awayLogoUrl: awayAth?.logoUrl ?? awayUni?.logoUrl ?? null,
        homeScore: m.homeScore,
        awayScore: m.awayScore,
        status: m.status,
        winnerSide: win,
      };
    })
    .sort(
      (a, b) =>
        phaseRank(a.phase) - phaseRank(b.phase) ||
        a.scheduledAt.getTime() - b.scheduledAt.getTime()
    );

  const rounds = PLAYOFF_PHASES.map((phase) => ({
    phase,
    matches: playoffMatches.filter((m) => m.phase === phase),
  })).filter((r) => r.matches.length > 0);

  return { rounds };
}
