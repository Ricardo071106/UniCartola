import Link from "next/link";
import { GraduationCap, LogIn, LogOut, User } from "lucide-react";
import type { SessionPayload } from "@/lib/auth/session";

export function AppHeader({ session }: { session: SessionPayload | null }) {
  return (
    <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur">
      <div className="flex items-center justify-between px-4 py-3 lg:px-6">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f] lg:h-10 lg:w-10 lg:rounded-xl">
            <GraduationCap className="h-5 w-5 text-white lg:h-6 lg:w-6" />
          </div>
          <div className="hidden sm:block">
            <p className="font-bold text-gray-900">Campus League</p>
            <p className="text-[10px] text-gray-500">Fantasy Universitário</p>
          </div>
        </Link>

        <div className="flex items-center gap-2">
          {session ? (
            <>
              <Link
                href="/perfil"
                className="flex items-center gap-2 rounded-lg bg-gray-100 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f]"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">{session.nickname}</span>
              </Link>
              <form action="/api/auth/logout" method="POST">
                <button
                  type="submit"
                  className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Sair</span>
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/onboarding"
              className="flex items-center gap-2 rounded-lg bg-[#1e3a5f] px-4 py-2 text-sm font-semibold text-white hover:bg-[#1e3a5f]/90"
            >
              <LogIn className="h-4 w-4" />
              Fazer login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
