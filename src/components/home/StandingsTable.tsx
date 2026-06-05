import Image from "next/image";
import type { StandingsEntry } from "@/types";

function rankStyle(rank: number) {
  if (rank === 1) return "bg-[#e8a317] text-black";
  if (rank === 2) return "bg-zinc-500 text-black";
  if (rank === 3) return "bg-[#c47d2a] text-black";
  return "bg-zinc-800 text-zinc-400";
}

export function StandingsTable({ entries }: { entries: StandingsEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="mx-2 mb-2 rounded-xl bg-zinc-900 py-12 text-center">
        <p className="text-3xl">📊</p>
        <p className="mt-2 text-sm font-semibold text-zinc-500">
          Nenhum jogo finalizado nesta série
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2">
      <div className="grid grid-cols-[28px_1fr_repeat(4,32px)] gap-1 px-2 text-[10px] font-bold uppercase tracking-wide text-zinc-600 sm:grid-cols-[32px_1fr_repeat(7,36px)]">
        <span>#</span>
        <span>Time</span>
        <span className="text-center">V</span>
        <span className="text-center">E</span>
        <span className="text-center">D</span>
        <span className="hidden text-center sm:block">GP</span>
        <span className="hidden text-center sm:block">GC</span>
        <span className="hidden text-center sm:block">SG</span>
        <span className="text-center">Pts</span>
      </div>

      {entries.map((e) => (
        <div
          key={`${e.athleticsId ?? e.universityId}`}
          className="grid grid-cols-[28px_1fr_repeat(4,32px)] items-center gap-1 rounded-xl bg-zinc-900 px-2 py-2.5 hover:bg-zinc-800 sm:grid-cols-[32px_1fr_repeat(7,36px)]"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${rankStyle(e.rank)}`}
          >
            {e.rank}
          </span>

          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo name={e.teamName} logoUrl={e.logoUrl} />
            <span className="truncate text-sm font-bold text-white">
              {e.teamName}
            </span>
          </div>

          <span className="text-center text-sm font-bold text-[#00a86b]">
            {e.wins}
          </span>
          <span className="text-center text-sm text-zinc-400">{e.draws}</span>
          <span className="text-center text-sm text-red-400">{e.losses}</span>
          <span className="hidden text-center text-sm text-zinc-300 sm:block">
            {e.goalsFor}
          </span>
          <span className="hidden text-center text-sm text-zinc-300 sm:block">
            {e.goalsAgainst}
          </span>
          <span className="hidden text-center text-sm text-zinc-300 sm:block">
            {e.goalDifference > 0 ? "+" : ""}
            {e.goalDifference}
          </span>
          <span className="text-center text-sm font-black text-[#00a86b]">
            {e.points}
          </span>
        </div>
      ))}
    </div>
  );
}

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={32}
        height={32}
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-zinc-700"
        unoptimized
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006b3f] text-[10px] font-black text-white ring-2 ring-zinc-700">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
