import type { SportSlug } from "@/types";

export interface SportMeta {
  slug: SportSlug;
  name: string;
  emoji: string;
  tagline: string;
  gradient: string;
  accent: string;
  accentBg: string;
  border: string;
}

export const SPORTS: Record<SportSlug, SportMeta> = {
  futebol: {
    slug: "futebol",
    name: "Futebol",
    emoji: "⚽",
    tagline: "Campo, garra e rivalidade universitária",
    gradient: "from-emerald-600 via-emerald-700 to-teal-800",
    accent: "text-emerald-600",
    accentBg: "bg-emerald-50",
    border: "border-emerald-200",
  },
  futsal: {
    slug: "futsal",
    name: "Futsal",
    emoji: "🥅",
    tagline: "Quadra rápida, jogadas intensas",
    gradient: "from-orange-500 via-orange-600 to-red-700",
    accent: "text-orange-600",
    accentBg: "bg-orange-50",
    border: "border-orange-200",
  },
  basquete: {
    slug: "basquete",
    name: "Basquete",
    emoji: "🏀",
    tagline: "Cestas, enterradas e playoffs",
    gradient: "from-amber-500 via-orange-600 to-rose-700",
    accent: "text-amber-600",
    accentBg: "bg-amber-50",
    border: "border-amber-200",
  },
};

export const SPORT_LIST = Object.values(SPORTS);

export function getSportMeta(slug: string): SportMeta | null {
  return SPORTS[slug as SportSlug] ?? null;
}
