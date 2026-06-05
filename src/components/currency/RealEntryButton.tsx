"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function RealEntryButton({ paid }: { paid: boolean }) {
  const [loading, setLoading] = useState(false);

  async function handlePay() {
    setLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = (await res.json()) as { url?: string; error?: string };
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      alert(data.error ?? "Não foi possível iniciar o pagamento");
    } catch {
      alert("Erro ao conectar com o pagamento");
    } finally {
      setLoading(false);
    }
  }

  if (paid) {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-amber-600/50",
          "bg-amber-600/20 px-4 py-2 text-sm font-bold text-amber-400"
        )}
      >
        Pago R$ 30,00
      </span>
    );
  }

  return (
    <Button
      type="button"
      onClick={handlePay}
      disabled={loading}
      className="bg-amber-600 text-white hover:bg-amber-500"
    >
      {loading ? "Abrindo..." : "Pagar inscrição R$ 30,00"}
    </Button>
  );
}
