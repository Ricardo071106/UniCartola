import Link from "next/link";
import Image from "next/image";
import { Trophy } from "lucide-react";

export function EsportesHeader() {
  return (
    <header className="esportes-header sticky top-0 z-40 border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/esportes" className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1e3a5f] ring-2 ring-[#c9a227]/50">
            <Trophy className="h-6 w-6 text-[#c9a227]" />
          </div>
          <div className="hidden sm:block">
            <p className="text-lg font-black leading-none tracking-tight text-white">
              NDU Esportes
            </p>
            <p className="text-[11px] font-medium text-zinc-400">
              Competições & Resultados
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/"
            className="flex items-center gap-2 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-[#006b3f] hover:text-white sm:px-4"
          >
            <Image
              src="/logo.png"
              alt="Cartola"
              width={20}
              height={20}
              className="h-5 w-5 rounded-full object-cover"
            />
            <span>Cartola</span>
          </Link>
        </div>
      </div>
    </header>
  );
}
