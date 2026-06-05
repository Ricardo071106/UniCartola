import Image from "next/image";
import type { StandingsEntry } from "@/types";

function rankStyle(rank: number) {
  if (rank === 1) return "bg-[#e8a317] text-white";
  if (rank === 2) return "bg-[#9aa3a0] text-white";
  if (rank === 3) return "bg-[#c47d2a] text-white";
  return "bg-[#e8f5ee] text-[#5c6b5f]";
}

export function StandingsTable({ entries }: { entries: StandingsEntry[] }) {
  if (entries.length === 0) {
    return (
      <div className="mx-2 mb-2 rounded-xl bg-[#f4f6f4] py-12 text-center">
        <p className="text-3xl">📊</p>
        <p className="mt-2 text-sm font-semibold text-[#5c6b5f]">
          Nenhum jogo finalizado nesta série
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1.5 p-2">
      {/* Header row */}
      <div className="grid grid-cols-[28px_1fr_repeat(4,32px)] gap-1 px-2 text-[10px] font-bold uppercase tracking-wide text-[#9aa3a0] sm:grid-cols-[32px_1fr_repeat(7,36px)]">
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
          className="grid grid-cols-[28px_1fr_repeat(4,32px)] items-center gap-1 rounded-xl bg-[#fafcfa] px-2 py-2.5 transition-colors hover:bg-[#e8f5ee] sm:grid-cols-[32px_1fr_repeat(7,36px)]"
        >
          <span
            className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-black ${rankStyle(e.rank)}`}
          >
            {e.rank}
          </span>

          <div className="flex min-w-0 items-center gap-2">
            <TeamLogo name={e.teamName} logoUrl={e.logoUrl} />
            <span className="truncate text-sm font-bold text-[#1a1a1a]">
              {e.teamName}
            </span>
          </div>

          <span className="text-center text-sm font-bold text-[#006b3f]">
            {e.wins}
          </span>
          <span className="text-center text-sm text-[#5c6b5f]">{e.draws}</span>
          <span className="text-center text-sm text-[#c0392b]">{e.losses}</span>
          <span className="hidden text-center text-sm sm:block">{e.goalsFor}</span>
          <span className="hidden text-center text-sm sm:block">
            {e.goalsAgainst}
          </span>
          <span className="hidden text-center text-sm sm:block">
            {e.goalDifference > 0 ? "+" : ""}
            {e.goalDifference}
          </span>
          <span className="text-center text-sm font-black text-[#006b3f]">
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
        className="h-8 w-8 shrink-0 rounded-full object-cover ring-2 ring-white"
        unoptimized
      />
    );
  }
  return (
    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#006b3f] text-[10px] font-black text-white ring-2 ring-white">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
