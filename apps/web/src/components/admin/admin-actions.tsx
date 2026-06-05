"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

export function AdminActions() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function runScrape() {
    setLoading(true);
    setResult(null);
    const res = await fetch("/api/admin/scrape", { method: "POST" });
    const data = await res.json();
    setResult(res.ok ? `OK: +${data.created} criados, ${data.updated} atualizados` : data.error);
    setLoading(false);
  }

  return (
    <div className="space-y-2">
      <Button onClick={runScrape} disabled={loading}>
        {loading ? "Executando..." : "Forçar re-scrape NDU"}
      </Button>
      {result && <p className="text-sm text-slate-600">{result}</p>}
    </div>
  );
}
