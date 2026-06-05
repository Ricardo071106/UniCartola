const NORMALIZED_PLAYOFF_PHASES = new Set([
  "Oitavas",
  "Quartas",
  "Semi",
  "Final",
]);

export function normalizePlayoffPhase(raw: string): string {
  const t = raw.toLowerCase().replace(/\s/g, "");
  if (t.includes("8") || t === "oitavas") return "Oitavas";
  if (t.includes("4") || t === "quartas") return "Quartas";
  if (t.startsWith("semi")) return "Semi";
  if (t.startsWith("final")) return "Final";
  return raw;
}

export function isPlayoffPhase(group: string | null | undefined): boolean {
  if (!group) return false;
  return NORMALIZED_PLAYOFF_PHASES.has(normalizePlayoffPhase(group));
}
