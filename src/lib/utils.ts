import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const BR_TZ = "America/Sao_Paulo";

function brazilDateParts(date: Date) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: BR_TZ,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value])
  );
  return {
    year: parts.year!,
    month: parts.month!,
    day: parts.day!,
  };
}

export function startOfDayBrazil(date = new Date()): Date {
  const { year, month, day } = brazilDateParts(date);
  return new Date(`${year}-${month}-${day}T00:00:00-03:00`);
}

export function endOfDayBrazil(date = new Date()): Date {
  const { year, month, day } = brazilDateParts(date);
  return new Date(`${year}-${month}-${day}T23:59:59.999-03:00`);
}

export function addDaysBrazil(date: Date, days: number): Date {
  const start = startOfDayBrazil(date);
  return new Date(start.getTime() + days * 24 * 60 * 60 * 1000);
}

export function formatMatchTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleTimeString("pt-BR", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: BR_TZ,
  });
}

export function formatMatchDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("pt-BR", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    timeZone: BR_TZ,
  });
}

export function getAccuracy(correct: number, total: number): number {
  if (total === 0) return 0;
  return Math.round((correct / total) * 100);
}

export function getUniversityInitials(name: string): string {
  return name
    .split(" ")
    .filter((w) => w.length > 2)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 3);
}
