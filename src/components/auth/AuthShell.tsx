import Link from "next/link";

export function AuthShell({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-black">
      <header className="border-b border-zinc-800 bg-black px-4 py-4">
        <Link href="/" className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#006b3f]">
            <span className="text-sm font-black text-white">UC</span>
          </div>
          <span className="text-lg font-black text-white">UniCartola</span>
        </Link>
      </header>

      <div className="mx-auto max-w-md px-4 py-10">
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
