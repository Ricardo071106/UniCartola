"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Calendar, Trophy, Users, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppHeader } from "./AppHeader";
import type { SessionPayload } from "@/lib/auth/session";

const navItems = [
  { href: "/", label: "Início", icon: Home },
  { href: "/jogos", label: "Jogos", icon: Calendar },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/comunidade", label: "Liga", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({
  children,
  session,
}: {
  children: React.ReactNode;
  session: SessionPayload | null;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-[#eef2ee]">
      <AppHeader session={session} />

      {/* Nav desktop — estilo Cartola */}
      <nav className="hidden border-b border-[#dce5dc] bg-white md:block">
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
                    : "text-[#5c6b5f] hover:bg-[#e8f5ee] hover:text-[#006b3f]"
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

      {/* Bottom nav mobile */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#dce5dc] bg-white shadow-[0_-4px_20px_rgba(0,0,0,0.06)] md:hidden">
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
                  active ? "text-[#006b3f]" : "text-[#9aa3a0]"
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
