"use client";

import { useTransition } from "react";
import { cn } from "@/lib/utils";
import { setCurrencyMode } from "@/actions/currency";
import type { CurrencyMode } from "@/lib/currency/mode";

interface CurrencyToggleProps {
  mode: CurrencyMode;
  playBalance?: number;
  realBalance?: number;
  compact?: boolean;
}

export function CurrencyToggle({
  mode,
  playBalance,
  realBalance,
  compact = false,
}: CurrencyToggleProps) {
  const [pending, startTransition] = useTransition();

  function switchMode(next: CurrencyMode) {
    if (next === mode || pending) return;
    startTransition(async () => {
      await setCurrencyMode(next);
    });
  }

  const balance =
    mode === "play"
      ? (playBalance ?? 10000).toLocaleString("pt-BR")
      : (realBalance ?? 0).toLocaleString("pt-BR");

  return (
    <div
      className={cn(
        "flex flex-col gap-2",
        compact ? "items-end" : "items-stretch"
      )}
    >
      <div className="inline-flex rounded-full border border-zinc-700 bg-zinc-900 p-1">
        <button
          type="button"
          disabled={pending}
          onClick={() => switchMode("play")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            mode === "play"
              ? "accent-bg text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          Sem dinheiro
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => switchMode("real")}
          className={cn(
            "rounded-full px-3 py-1.5 text-xs font-bold transition-colors",
            mode === "real"
              ? "bg-amber-600 text-white"
              : "text-zinc-400 hover:text-white"
          )}
        >
          Dinheiro real
        </button>
      </div>
      {!compact && (
        <p className="text-center text-[11px] text-zinc-500">
          Saldo {mode === "play" ? "fichas" : "real"}:{" "}
          <span className="font-bold text-white">{balance}</span>
        </p>
      )}
    </div>
  );
}
