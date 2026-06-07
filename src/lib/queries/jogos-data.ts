import { unstable_cache } from "next/cache";
import { getMatchesByFilter } from "./matches";
import type { SportSlug } from "@/types";

type JogosTab = "upcoming" | "today" | "tomorrow" | "week" | "finished";

export function getCachedMatchesByFilter(options: {
  sport?: SportSlug;
  tab: JogosTab;
}) {
  const sportKey = options.sport ?? "all";
  return unstable_cache(
    () => getMatchesByFilter(options),
    ["jogos-matches", sportKey, options.tab],
    { revalidate: 60 }
  )();
}
