import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, Trophy, User, UserPlus } from "lucide-react";
import type { SessionPayload } from "@/lib/auth/session";
import type { CurrencyMode } from "@/lib/currency/mode";
import { CurrencyToggle } from "@/components/currency/CurrencyToggle";

export function AppHeader({
  session,
  currencyMode = "play",
  totalPoints,
  realBalance,
}: {
  session: SessionPayload | null;
  currencyMode?: CurrencyMode;
  totalPoints?: number;
  realBalance?: number;
}) {
  return (
    <header className="cartola-header sticky top-0 z-40 border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="Cartola — Campeonato Universitário"
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover ring-2 ring-[#c9a227]/50"
            priority
          />
          <div className="hidden sm:block">
            <p className="text-lg font-black leading-none tracking-tight text-white">
              Cartola
            </p>
            <p className="text-[11px] font-medium text-zinc-400">
              Campeonato Universitário
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          <Link
            href="/esportes"
            className="flex items-center gap-1.5 rounded-full border border-zinc-700 bg-zinc-900/80 px-3 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-[#1e3a5f] hover:text-white sm:px-4"
          >
            <Trophy className="h-4 w-4 text-[#c9a227]" />
            <span className="hidden sm:inline">NDU Esportes</span>
            <span className="sm:hidden">Esportes</span>
          </Link>
          <div className="hidden lg:block">
            <CurrencyToggle
              mode={currencyMode}
              totalPoints={totalPoints}
              realBalance={realBalance}
              compact
            />
          </div>
          {session ? (
            <>
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-full bg-zinc-900 px-3 py-2 text-sm font-bold text-white ring-1 ring-zinc-700 hover:bg-zinc-800"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {session.nickname}
                </span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-full text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-bold text-zinc-300 hover:text-white"
              >
                <LogIn className="h-4 w-4" />
                <span className="hidden sm:inline">Entrar</span>
              </Link>
              <Link
                href="/cadastro"
                className="accent-bg flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold text-white hover:opacity-90"
              >
                <UserPlus className="h-4 w-4" />
                Cadastre-se
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
