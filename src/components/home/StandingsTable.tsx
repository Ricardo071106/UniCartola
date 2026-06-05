import Image from "next/image";
import type { StandingsEntry } from "@/types";

export function StandingsTable({ entries }: { entries: StandingsEntry[] }) {
  if (entries.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-gray-200 py-10 text-center text-sm text-gray-500">
        Nenhum jogo finalizado nesta série ainda.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-100 bg-white">
      <table className="w-full min-w-[480px] text-sm">
        <thead>
          <tr className="border-b border-gray-100 bg-gray-50 text-left text-xs font-semibold uppercase text-gray-500">
            <th className="px-3 py-2.5">#</th>
            <th className="px-3 py-2.5">Time</th>
            <th className="px-3 py-2.5 text-center">V</th>
            <th className="px-3 py-2.5 text-center">E</th>
            <th className="px-3 py-2.5 text-center">D</th>
            <th className="px-3 py-2.5 text-center">GP</th>
            <th className="px-3 py-2.5 text-center">GC</th>
            <th className="px-3 py-2.5 text-center">SG</th>
            <th className="px-3 py-2.5 text-center font-bold">Pts</th>
          </tr>
        </thead>
        <tbody>
          {entries.map((e) => (
            <tr
              key={`${e.athleticsId ?? e.universityId}`}
              className="border-b border-gray-50 last:border-0"
            >
              <td className="px-3 py-2.5 font-semibold text-gray-500">
                {e.rank}
              </td>
              <td className="px-3 py-2.5">
                <div className="flex items-center gap-2">
                  <TeamLogo name={e.teamName} logoUrl={e.logoUrl} />
                  <span className="font-semibold text-gray-900">{e.teamName}</span>
                </div>
              </td>
              <td className="px-3 py-2.5 text-center text-emerald-600 font-medium">
                {e.wins}
              </td>
              <td className="px-3 py-2.5 text-center text-gray-600">{e.draws}</td>
              <td className="px-3 py-2.5 text-center text-red-500">{e.losses}</td>
              <td className="px-3 py-2.5 text-center">{e.goalsFor}</td>
              <td className="px-3 py-2.5 text-center">{e.goalsAgainst}</td>
              <td className="px-3 py-2.5 text-center">
                {e.goalDifference > 0 ? "+" : ""}
                {e.goalDifference}
              </td>
              <td className="px-3 py-2.5 text-center font-bold text-[#1e3a5f]">
                {e.points}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function TeamLogo({ name, logoUrl }: { name: string; logoUrl: string | null }) {
  if (logoUrl) {
    return (
      <Image
        src={logoUrl}
        alt={name}
        width={28}
        height={28}
        className="h-7 w-7 rounded-full object-cover"
        unoptimized
      />
    );
  }
  return (
    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#1e3a5f]/10 text-[10px] font-bold text-[#1e3a5f]">
      {name.slice(0, 2).toUpperCase()}
    </div>
  );
}
