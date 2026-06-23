import { EsportesHeader } from "./EsportesHeader";

export function EsportesShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black">
      <EsportesHeader />
      <main className="mx-auto max-w-5xl px-4 pb-8 pt-4">{children}</main>
    </div>
  );
}
