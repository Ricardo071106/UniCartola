"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { trackEvent } from "@/components/analytics/posthog-provider";

export function StatPredictionForm({
  marketId,
  existingName,
}: {
  marketId: string;
  existingName?: string;
}) {
  const router = useRouter();
  const [name, setName] = useState(existingName ?? "");
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (name.length < 2) return;
    setLoading(true);
    const res = await fetch("/api/predictions/stat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marketId, playerName: name }),
    });
    if (res.ok) {
      trackEvent("prediction_submitted", { type: "stat", market_id: marketId });
      router.refresh();
    }
    setLoading(false);
  }

  return (
    <div className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nome do atleta"
        className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm dark:border-slate-700 dark:bg-slate-900"
      />
      <Button size="sm" onClick={submit} disabled={loading}>
        {loading ? "..." : "Salvar"}
      </Button>
    </div>
  );
}
