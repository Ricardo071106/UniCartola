"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Target, Trophy, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import type { SessionPayload } from "@/lib/auth/session";
import type { CurrencyMode } from "@/lib/currency/mode";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/jogos", label: "Jogos", icon: Calendar },
  { href: "/palpites", label: "Palpites", icon: Target },
  { href: "/rankings", label: "Ranking", icon: Trophy },
  { href: "/comunidade", label: "Fórum", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({
  children,
  session,
  currencyMode = "play",
  playBalance,
  realBalance,
}: {
  children: React.ReactNode;
  session: SessionPayload | null;
  currencyMode?: CurrencyMode;
  playBalance?: number;
  realBalance?: number;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-black">
      <AppHeader
        session={session}
        currencyMode={currencyMode}
        playBalance={playBalance}
        realBalance={realBalance}
      />

      <nav className="hidden border-b border-zinc-800 bg-zinc-950 md:block">
        <div className="mx-auto flex max-w-5xl gap-1 px-4 py-2">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-[#006b3f] text-white"
                    : "text-zinc-500 hover:bg-zinc-900 hover:text-white"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:pb-8">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-1.5 safe-area-pb">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-bold",
                  active ? "text-[#00a86b]" : "text-zinc-600"
                )}
              >
                <item.icon
                  className={cn("h-5 w-5", active && "stroke-[2.5]")}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
