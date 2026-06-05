import Link from "next/link";
import { LogIn, LogOut, User } from "lucide-react";
import type { SessionPayload } from "@/lib/auth/session";

export function AppHeader({ session }: { session: SessionPayload | null }) {
  return (
    <header className="cartola-header sticky top-0 z-40 shadow-lg">
      <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/15 ring-2 ring-white/30 backdrop-blur">
            <span className="text-lg font-black tracking-tighter text-white">UC</span>
          </div>
          <div>
            <p className="text-lg font-black leading-none tracking-tight text-white">
              UniCartola
            </p>
            <p className="text-[11px] font-medium text-white/75">
              Fantasy Universitário
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-full bg-white/15 px-3 py-2 text-sm font-bold text-white ring-1 ring-white/25 hover:bg-white/25"
              >
                <User className="h-4 w-4" />
                <span className="hidden max-w-[120px] truncate sm:inline">
                  {session.nickname}
                </span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white hover:bg-white/20"
                  aria-label="Sair"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/onboarding"
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-bold text-[#006b3f] shadow-md hover:bg-white/90"
            >
              <LogIn className="h-4 w-4" />
              Entrar
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
