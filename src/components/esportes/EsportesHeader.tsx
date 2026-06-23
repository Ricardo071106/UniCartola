"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { BarChart3, Calendar, GitBranch, Home, Trophy } from "lucide-react";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/esportes", label: "Início", icon: Home },
  { href: "/esportes/jogos", label: "Jogos", icon: Calendar },
  { href: "/esportes/matamata", label: "Mata-mata", icon: GitBranch },
  { href: "/esportes/estatisticas", label: "Estatísticas", icon: BarChart3 },
];

export function EsportesHeader() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const activeTab = searchParams.get("tab");

  function isActive(href: string) {
    const [itemPath, query] = href.split("?");
    const itemTab = query ? new URLSearchParams(query).get("tab") : null;

    if (itemTab) return pathname === itemPath && activeTab === itemTab;
    if (href === "/esportes") return pathname === "/esportes";
    return pathname === itemPath && !activeTab;
  }

  function withCurrentFilters(href: string) {
    if (
      !href.startsWith("/esportes/jogos") &&
      !href.startsWith("/esportes/matamata") &&
      !href.startsWith("/esportes/estatisticas")
    ) {
      return href;
    }

    const [path, query] = href.split("?");
    const params = new URLSearchParams(query ?? "");
    const sport = searchParams.get("sport");
    const series = searchParams.get("series");
    if (sport) params.set("sport", sport);
    if (series) params.set("series", series);

    const queryString = params.toString();
    return queryString ? `${path}?${queryString}` : path;
  }

  return (
    <>
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

      <nav className="hidden border-b border-zinc-800 bg-zinc-950 md:block">
        <div className="mx-auto flex max-w-5xl gap-1 overflow-x-auto px-4 py-2 scrollbar-none">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={withCurrentFilters(item.href)}
                className={cn(
                  "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors",
                  active
                    ? "bg-[#1e3a5f] text-white"
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

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-zinc-800 bg-zinc-950 md:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2 overflow-x-auto px-2 py-1.5 safe-area-pb scrollbar-none">
          {navItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={withCurrentFilters(item.href)}
                className={cn(
                  "flex shrink-0 flex-col items-center gap-0.5 rounded-lg px-3 py-1 text-[10px] font-bold",
                  active ? "text-[#c9a227]" : "text-zinc-600"
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
    </>
  );
}
