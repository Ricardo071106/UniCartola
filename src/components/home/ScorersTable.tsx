import Image from "next/image";
import type { ScorerEntry } from "@/types";

export function ScorersTable({
  entries,
  label,
  unit,
}: {
  entries: ScorerEntry[];
  label: string;
  unit: string;
}) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 py-8 text-center text-sm text-gray-500">
        Nenhum {label.toLowerCase()} registrado nesta série.
      </p>
    );
  }

  return (
    <div className="rounded-xl border border-gray-100 bg-white">
      <div className="border-b border-gray-100 px-4 py-3">
        <h3 className="text-sm font-bold text-gray-900">{label}</h3>
      </div>
      <ul className="divide-y divide-gray-50">
        {entries.map((e) => (
          <li
            key={`${e.playerName}-${e.teamName}`}
            className="flex items-center gap-3 px-4 py-3"
          >
            <span className="w-6 text-center text-sm font-bold text-gray-400">
              {e.rank}
            </span>
            {e.logoUrl ? (
              <Image
                src={e.logoUrl}
                alt={e.teamName}
                width={32}
                height={32}
                className="h-8 w-8 rounded-full object-cover"
                unoptimized
              />
            ) : (
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[10px] font-bold text-[#1e3a5f]">
                {e.teamName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <div className="min-w-0 flex-1">
              <p className="truncate font-semibold text-gray-900">
                {e.playerName}
              </p>
              <p className="truncate text-xs text-gray-500">{e.teamName}</p>
            </div>
            <span className="text-sm font-bold text-[#1e3a5f]">
              {e.total} {unit}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
