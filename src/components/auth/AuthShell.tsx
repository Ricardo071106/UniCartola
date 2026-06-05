import Link from "next/link";
import Image from "next/image";

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
          <Image
            src="/logo.png"
            alt="Cartola"
            width={40}
            height={40}
            className="h-10 w-10 rounded-full object-cover"
          />
          <span className="text-lg font-black text-white">Cartola</span>
        </Link>
      </header>

      <div className="mx-auto max-w-md px-4 py-10">
        <div className="mb-6 flex justify-center">
          <Image
            src="/logo.png"
            alt="Cartola — Campeonato Universitário"
            width={96}
            height={96}
            className="h-24 w-24 rounded-full object-cover shadow-lg shadow-[#c9a227]/30 ring-2 ring-[#c9a227]/40"
          />
        </div>
        <h1 className="text-2xl font-black text-white">{title}</h1>
        <p className="mt-1 text-sm text-zinc-400">{subtitle}</p>
        <div className="mt-8 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          {children}
        </div>
      </div>
    </div>
  );
}
