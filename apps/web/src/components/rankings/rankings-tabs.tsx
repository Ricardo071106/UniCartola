"use client";

import Link from "next/link";
import { cn } from "@/lib/utils";

type Item = { id: string; name: string; slug: string };

export function RankingsTabs({
  currentScope,
  currentId,
  schools,
  courses,
  athletics,
}: {
  currentScope: string;
  currentId: string | null;
  schools: Item[];
  courses: Item[];
  athletics: Item[];
}) {
  const tabs = [
    { scope: "global", label: "Geral" },
    { scope: "school", label: "Faculdade" },
    { scope: "course", label: "Curso" },
    { scope: "athletic", label: "Atlética" },
  ];

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
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => (
          <Link
            key={t.scope}
            href={`/rankings?scope=${t.scope}`}
            className={cn(
              "rounded-full px-4 py-2 text-sm font-medium",
              currentScope === t.scope
                ? "bg-emerald-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-slate-800"
            )}
          >
            {t.label}
          </Link>
        ))}
      </div>

      {filterItems.length > 0 && currentScope !== "global" && (
        <div className="flex flex-wrap gap-2">
          {filterItems.map((item) => (
            <Link
              key={item.id}
              href={`/rankings?scope=${currentScope}&id=${item.id}`}
              className={cn(
                "rounded-lg border px-3 py-1 text-xs",
                currentId === item.id
                  ? "border-emerald-600 text-emerald-700"
                  : "border-slate-200 text-slate-500"
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
