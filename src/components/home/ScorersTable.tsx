import Image from "next/image";
import { cn } from "@/lib/utils";
import type { ScorerEntry } from "@/types";

function rankBadge(rank: number) {
  if (rank === 1) return { bg: "bg-[#e8a317]", label: "🥇" };
  if (rank === 2) return { bg: "bg-[#9aa3a0]", label: "🥈" };
  if (rank === 3) return { bg: "bg-[#c47d2a]", label: "🥉" };
  return { bg: "bg-[#e8f5ee]", label: String(rank) };
}

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
        <p className="text-3xl">👟</p>
        <p className="mt-2 text-sm font-semibold text-[#5c6b5f]">
          Nenhum registro nesta série ainda
        </p>
      </div>
    );
  }

  const top3 = entries.slice(0, 3);
  const rest = entries.slice(3);

  return (
    <div className="p-4">
      {/* Pódio top 3 — estilo Cartola */}
      {top3.length > 0 && (
        <div className="mb-4 grid grid-cols-3 items-end gap-2">
          {[top3[1], top3[0], top3[2]].filter(Boolean).map((e) => {
            if (!e) return null;
            const isFirst = e.rank === 1;
            const badge = rankBadge(e.rank);
            return (
              <div
                key={e.playerName}
                className={cn(
                  "flex flex-col items-center rounded-2xl bg-[#f4f6f4] p-3 text-center",
                  isFirst && "order-2 -mt-2 bg-[#e8f5ee] ring-2 ring-[#006b3f]/20"
                )}
              >
                <span className="text-xl">{badge.label}</span>
                {e.logoUrl ? (
                  <Image
                    src={e.logoUrl}
                    alt={e.teamName}
                    width={40}
                    height={40}
                    className="mt-1 h-10 w-10 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="mt-1 flex h-10 w-10 items-center justify-center rounded-full bg-[#006b3f] text-xs font-bold text-white">
                    {e.teamName.slice(0, 2).toUpperCase()}
                  </div>
                )}
                <p className="mt-2 line-clamp-2 text-xs font-bold leading-tight text-[#1a1a1a]">
                  {e.playerName}
                </p>
                <p className="mt-0.5 text-[10px] text-[#5c6b5f]">{e.teamName}</p>
                <p className="mt-1 text-lg font-black text-[#006b3f]">
                  {e.total}
                  <span className="ml-0.5 text-[10px] font-semibold">{unit}</span>
                </p>
              </div>
            );
          })}
        </div>
      )}

      {/* Restante */}
      {rest.length > 0 && (
        <ul className="space-y-1">
          {rest.map((e) => (
            <li
              key={`${e.playerName}-${e.teamName}`}
              className="flex items-center gap-3 rounded-xl bg-[#fafcfa] px-3 py-2.5 hover:bg-[#e8f5ee]"
            >
              <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[#e8f5ee] text-xs font-bold text-[#5c6b5f]">
                {e.rank}
              </span>
              {e.logoUrl ? (
                <Image
                  src={e.logoUrl}
                  alt={e.teamName}
                  width={28}
                  height={28}
                  className="h-7 w-7 rounded-full object-cover"
                  unoptimized
                />
              ) : (
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#006b3f]/10 text-[9px] font-bold text-[#006b3f]">
                  {e.teamName.slice(0, 2).toUpperCase()}
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-[#1a1a1a]">
                  {e.playerName}
                </p>
                <p className="truncate text-xs text-[#5c6b5f]">{e.teamName}</p>
              </div>
              <span className="text-sm font-black text-[#006b3f]">
                {e.total} {unit}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Só top 3 */}
    </div>
  );
}
