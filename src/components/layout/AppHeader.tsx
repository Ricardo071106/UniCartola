import Link from "next/link";
import Image from "next/image";
import { LogIn, LogOut, User, UserPlus } from "lucide-react";
import type { SessionPayload } from "@/lib/auth/session";

export function AppHeader({ session }: { session: SessionPayload | null }) {
  return (
    <header className="cartola-header sticky top-0 z-40 border-b border-zinc-800">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/logo.svg"
            alt="UniCartola"
            width={40}
            height={40}
            className="h-10 w-10 rounded-xl ring-1 ring-[#00a86b]/40"
          />
          <div>
            <p className="text-lg font-black leading-none tracking-tight text-white">
              UniCartola
            </p>
            <p className="text-[11px] font-medium text-zinc-400">
              Fantasy Universitário
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
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
                className="flex items-center gap-1.5 rounded-full bg-[#006b3f] px-4 py-2 text-sm font-bold text-white hover:bg-[#00a86b]"
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
