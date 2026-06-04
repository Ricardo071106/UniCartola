"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Trophy, Target, Building2, User, BarChart3 } from "lucide-react";

const links = [
  { href: "/", label: "Feed", icon: Home },
  { href: "/palpites", label: "Palpites", icon: Target },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/mercados", label: "Mercados", icon: BarChart3 },
  { href: "/perfil", label: "Perfil", icon: User },
];

export function Nav() {
  const pathname = usePathname();
  const hideNav = pathname.startsWith("/login") || pathname.startsWith("/cadastro");

  if (hideNav) return null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/90 backdrop-blur dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex h-14 max-w-5xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-600 text-sm text-white">
              UC
            </span>
            Unicartola
          </Link>
          <nav className="hidden gap-1 sm:flex">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  pathname === href
                    ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400"
                    : "text-slate-600 hover:bg-slate-100 dark:text-slate-400"
                )}
              >
                {label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white sm:hidden dark:border-slate-800 dark:bg-slate-950">
        <div className="flex justify-around py-2">
          {links.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-xs",
                pathname === href ? "text-emerald-600" : "text-slate-500"
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
