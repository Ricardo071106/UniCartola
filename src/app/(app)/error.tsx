"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[app-error]", error);
  }, [error]);

  return (
    <div className="py-16 text-center">
      <h1 className="text-xl font-bold text-white">Algo deu errado</h1>
      <p className="mt-2 text-sm text-zinc-400">
        Não foi possível carregar esta página. Tente novamente em instantes.
      </p>
      {error.digest && (
        <p className="mt-1 text-xs text-zinc-600">Ref: {error.digest}</p>
      )}
      <div className="mt-6 flex justify-center gap-3">
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-full bg-[#006b3f] px-5 py-2 text-sm font-bold text-white hover:bg-[#00a86b]"
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="rounded-full border border-zinc-700 px-5 py-2 text-sm font-bold text-zinc-300 hover:text-white"
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
