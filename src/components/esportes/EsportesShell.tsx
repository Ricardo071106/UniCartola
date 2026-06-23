import { Suspense } from "react";
import { EsportesHeader } from "./EsportesHeader";

export function EsportesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <Suspense fallback={null}>
        <EsportesHeader />
      </Suspense>
      <main className="mx-auto max-w-5xl px-4 pb-24 pt-4 md:pb-8">
        {children}
      </main>
    </div>
  );
}
