"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; slug?: string };

const scopes = [
  { key: "global", label: "Geral" },
  { key: "weekly", label: "Semanal" },
  { key: "historical", label: "Histórico" },
  { key: "school", label: "Faculdade" },
  { key: "course", label: "Curso" },
  { key: "athletic", label: "Atlética" },
] as const;

export function RankingsTabs({
  currentScope,
  currentId,
  schools,
  courses,
  athletics,
}: {
  currentScope: string;
  currentId?: string | null;
  schools: Item[];
  courses: Item[];
  athletics: Item[];
}) {
  const searchParams = useSearchParams();

  function buildHref(scope: string, id?: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    params.set("scope", scope);
    if (id) params.set("id", id);
    else params.delete("id");
    return `/rankings?${params.toString()}`;
  }

  const filterItems =
    currentScope === "school"
      ? schools
      : currentScope === "course"
        ? courses
        : currentScope === "athletic"
          ? athletics
          : [];

  return (
    <div className="space-y-3">
      <div className="flex gap-2 overflow-x-auto pb-1">
        {scopes.map((s) => (
          <Link
            key={s.key}
            href={buildHref(s.key)}
            className={cn(
              "shrink-0 rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
              currentScope === s.key
                ? "bg-accent text-white"
                : "bg-muted text-muted-foreground hover:text-foreground"
            )}
          >
            {s.label}
          </Link>
        ))}
      </div>

      {filterItems.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {filterItems.slice(0, 12).map((item) => (
            <Link
              key={item.id}
              href={buildHref(currentScope, item.id)}
              className={cn(
                "shrink-0 rounded-lg border px-3 py-1.5 text-xs font-medium transition-colors",
                currentId === item.id
                  ? "border-accent bg-accent/5 text-accent"
                  : "border-border text-muted-foreground hover:border-accent/30"
              )}
            >
              {item.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
