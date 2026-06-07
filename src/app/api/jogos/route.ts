import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { getCachedMatchesByFilter } from "@/lib/queries/jogos-data";
import {
  getUserPredictionsForMatches,
  predictionToView,
} from "@/lib/queries/predictions";
import { getUserBalances } from "@/lib/queries/user-balances";
import { withTimeout } from "@/lib/utils/timeout";
import type { SportSlug } from "@/types";

export const dynamic = "force-dynamic";

const TABS = ["upcoming", "today", "tomorrow", "week", "finished"] as const;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const sportRaw = searchParams.get("sport");
  const sport = ["futebol", "futsal", "basquete"].includes(sportRaw ?? "")
    ? (sportRaw as SportSlug)
    : undefined;
  const tabRaw = searchParams.get("tab") ?? "upcoming";
  const tab = TABS.includes(tabRaw as (typeof TABS)[number])
    ? (tabRaw as (typeof TABS)[number])
    : "upcoming";

  const matches = await withTimeout(
    getCachedMatchesByFilter({ ...(sport ? { sport } : {}), tab }),
    10000,
    []
  );

  const session = await getSession();
  const currencyMode = await getCurrencyMode();
  let canBet = false;
  let matchPredictions: Record<string, ReturnType<typeof predictionToView>> =
    {};

  if (session) {
    const balances = await withTimeout(
      getUserBalances(session.userId),
      5000,
      {
        playBalance: 10000,
        realBalance: 0,
        realEntryPaid: false,
        totalPoints: 0,
      }
    );
    canBet =
      currencyMode === "play" ||
      (currencyMode === "real" && balances.realEntryPaid);

    const predictionMap = await withTimeout(
      getUserPredictionsForMatches(
        session.userId,
        matches.map((m) => m.id),
        currencyMode
      ),
      5000,
      new Map()
    );

    matchPredictions = Object.fromEntries(
      [...predictionMap.entries()].map(([id, row]) => [
        id,
        predictionToView(row),
      ])
    );
  }

  return Response.json({
    matches,
    isLoggedIn: !!session,
    canBet,
    matchPredictions,
  });
}
