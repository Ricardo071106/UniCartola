import type { ScorerEntry } from "@/types";

export function ScorersTable({
  entries,
  unit,
}: {
  entries: ScorerEntry[];
  label: string;
  unit: string;
}) {
  if (entries.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Nenhum registro nesta série ainda
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-1 p-4">
      {entries.map((e) => (
        <li
          key={`${e.playerName}-${e.teamName}`}
          className="flex items-center gap-3 rounded-xl bg-zinc-900 px-3 py-2.5 hover:bg-zinc-800"
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-zinc-800 text-xs font-bold text-zinc-400">
            {e.rank}
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">
              {e.playerName}
            </p>
            <p className="truncate text-xs text-zinc-500">{e.teamName}</p>
          </div>
          <span className="accent-text shrink-0 text-sm font-black">
            {e.total} {unit}
          </span>
        </li>
      ))}
    </ul>
  );
}
