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
  Medal,
  Star,
  Dumbbell,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SPORT_LIST } from "@/lib/sports";

const mainNav = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jogos", label: "Jogos", icon: Calendar },
  { href: "/resultados", label: "Resultados", icon: Medal },
  { href: "/atletas", label: "Atletas", icon: Star },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const mobileNav = [
    mainNav[0],
    mainNav[1],
    mainNav[2],
    mainNav[4],
    mainNav[6],
  ];

  return (
    <div className="min-h-screen page-gradient">
      <aside className="fixed left-0 top-0 z-40 hidden h-screen w-64 border-r border-gray-100/80 bg-white/90 backdrop-blur lg:flex lg:flex-col shadow-sm">
        <div className="flex items-center gap-3 border-b border-gray-100 px-6 py-5">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] shadow-lg shadow-[#1e3a5f]/20">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 tracking-tight">Campus League</p>
            <p className="text-[10px] font-medium text-emerald-600">
              Fantasy Universitário
            </p>
          </div>
        </div>

        <nav className="flex-1 overflow-y-auto p-4 space-y-6">
          <div className="space-y-1">
            {mainNav.map((item) => (
              <NavLink key={item.href} item={item} pathname={pathname} />
            ))}
          </div>

          <div>
            <p className="mb-2 px-4 text-[10px] font-bold uppercase tracking-widest text-gray-400">
              Esportes
            </p>
            <div className="space-y-1">
              {SPORT_LIST.map((sport) => {
                const href = `/esportes/${sport.slug}`;
                const active = pathname === href;
                return (
                  <Link
                    key={sport.slug}
                    href={href}
                    className={cn(
                      "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
                      active
                        ? "bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] text-white shadow-md"
                        : "text-gray-600 hover:bg-gray-50"
                    )}
                  >
                    <span className="text-base">{sport.emoji}</span>
                    {sport.name}
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>

        <div className="border-t border-gray-100 p-4">
          <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2">
            <Dumbbell className="h-4 w-4 text-emerald-600" />
            <p className="text-[10px] font-medium text-emerald-700">
              Palpites · Rankings · Comunidade
            </p>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 border-b border-gray-100/80 bg-white/90 backdrop-blur lg:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e]">
                <GraduationCap className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900 text-sm">Campus League</p>
                <p className="text-[9px] text-emerald-600 font-medium">
                  Fantasy Universitário
                </p>
              </div>
            </div>
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-4 pb-24 pt-4 lg:max-w-4xl lg:pb-8 lg:pt-6">
          {children}
        </main>
      </div>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-100 bg-white/95 backdrop-blur lg:hidden safe-area-pb">
        <div className="mx-auto flex max-w-lg items-center justify-around px-1 py-2">
          {mobileNav.map((item) => {
            const active =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex flex-col items-center gap-0.5 px-2 py-1 text-[9px] font-bold",
                  active ? "text-[#1e3a5f]" : "text-gray-400"
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

function NavLink({
  item,
  pathname,
}: {
  item: (typeof mainNav)[number];
  pathname: string;
}) {
  const active =
    pathname === item.href ||
    (item.href !== "/" && pathname.startsWith(item.href));

  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all",
        active
          ? "bg-gradient-to-r from-[#1e3a5f] to-[#2d5a8e] text-white shadow-md"
          : "text-gray-600 hover:bg-gray-50"
      )}
    >
      <item.icon className="h-5 w-5" />
      {item.label}
    </Link>
  );
}
