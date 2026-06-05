"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Calendar,
  Trophy,
  Users,
  User,
  GraduationCap,
} from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jogos", label: "Jogos", icon: Calendar },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-100 bg-white lg:flex lg:flex-col">
        <div className="flex items-center gap-2 border-b border-gray-100 px-6 py-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1e3a5f]">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900">Campus League</p>
            <p className="text-[10px] text-gray-500">Fantasy Universitário</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-4 py-3 text-sm font-semibold transition-colors",
                  active
                    ? "bg-[#1e3a5f] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <item.icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="border-t border-gray-100 p-4">
          <p className="text-[10px] text-center text-gray-400">
            Palpites · Rankings · Comunidade
          </p>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-100 bg-white/95 backdrop-blur lg:hidden">
          <div className="flex items-center gap-2 px-4 py-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#1e3a5f]">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <p className="font-bold text-gray-900">Campus League</p>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 lg:max-w-4xl lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>

      {/* Mobile bottom nav */}
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white lg:hidden">
        <div className="mx-auto flex max-w-lg items-center justify-around px-2 py-2 safe-area-pb">
          {navItems.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-3 py-1 text-[10px] font-semibold",
                  active ? "text-[#1e3a5f]" : "text-gray-400"
                )}
              >
                <item.icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
