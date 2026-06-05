"use client";

import { Suspense } from "react";
import { HomeDashboard } from "@/components/home/HomeDashboard";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof HomeDashboard>;

export function HomeDashboardShell(props: Props) {
  return (
    <Suspense
      fallback={
        <div className="py-12 text-center text-zinc-400">Carregando...</div>
      }
    >
      <HomeDashboard {...props} />
    </Suspense>
  );
}
