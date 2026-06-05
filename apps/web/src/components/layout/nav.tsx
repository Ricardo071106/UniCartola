"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Home, Trophy, CalendarDays, Users, User, GraduationCap } from "lucide-react";

const links = [
  { href: "/", label: "Home", icon: Home },
  { href: "/jogos", label: "Jogos", icon: CalendarDays },
  { href: "/rankings", label: "Rankings", icon: Trophy },
  { href: "/comunidade", label: "Comunidade", icon: Users },
  { href: "/perfil", label: "Perfil", icon: User },
];

function NavLink({
  href,
  label,
  icon: Icon,
  pathname,
  variant,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  pathname: string;
  variant: "sidebar" | "mobile";
}) {
  const active = pathname === href || (href !== "/" && pathname.startsWith(href));

  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
          active
            ? "bg-accent text-accent-foreground"
            : "text-muted-foreground hover:bg-muted hover:text-foreground"
        )}
      >
        <Icon className="h-5 w-5" />
        {label}
      </Link>
    );
  }

  return (
    <Link
      href={href}
      className={cn(
        "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium",
        active ? "text-accent" : "text-muted-foreground"
      )}
    >
      <Icon className={cn("h-5 w-5", active && "stroke-[2.5]")} />
      {label}
    </Link>
  );
}

export function Nav() {
  const pathname = usePathname();
  const hideNav =
    pathname.startsWith("/login") ||
    pathname.startsWith("/cadastro") ||
    pathname.startsWith("/onboarding");

  if (hideNav) return null;

  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[var(--sidebar-width)] border-r border-border bg-white lg:flex lg:flex-col">
        <div className="flex h-16 items-center gap-2 border-b border-border px-5">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent text-sm font-bold text-white">
            CL
          </div>
          <div>
            <p className="text-sm font-bold leading-none">Campus League</p>
            <p className="text-[10px] text-muted-foreground">Esporte universitário</p>
          </div>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-4">
          {links.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} variant="sidebar" />
          ))}
        </nav>
        <div className="border-t border-border p-4">
          <div className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2">
            <GraduationCap className="h-4 w-4 text-accent" />
            <p className="text-xs text-muted-foreground">Temporada 2026.1</p>
          </div>
        </div>
      </aside>

      <header className="sticky top-0 z-30 border-b border-border bg-white/95 backdrop-blur lg:hidden">
        <div className="flex h-14 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-accent text-xs font-bold text-white">
              CL
            </div>
            <span className="font-bold">Campus League</span>
          </Link>
        </div>
      </header>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-white lg:hidden">
        <div className="flex justify-around py-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
          {links.map((link) => (
            <NavLink key={link.href} {...link} pathname={pathname} variant="mobile" />
          ))}
        </div>
      </nav>
    </>
  );
}
