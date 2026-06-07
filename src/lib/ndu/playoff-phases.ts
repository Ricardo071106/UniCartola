const NORMALIZED_PLAYOFF_PHASES = new Set([
  "Oitavas",
  "Quartas",
  "Semi",
  "Final",
]);

/** Detecta fases de mata-mata sem confundir grupos numéricos (ex.: "4" ≠ quartas). */
export function normalizePlayoffPhase(raw: string): string {
  const t = raw.toLowerCase().replace(/\s/g, "");
  if (/^(8ªs|8as|oitavas|8ª|8a)$/.test(t) || t.includes("oitavas")) {
    return "Oitavas";
  }
  if (/^(4ªs|4as|quartas|4ª|4a)$/.test(t) || t.includes("quartas")) {
    return "Quartas";
  }
  if (/^semi(final)?/.test(t)) return "Semi";
  if (/^final/.test(t)) return "Final";
  return raw.trim();
}

export function isPlayoffPhase(group: string | null | undefined): boolean {
  if (!group?.trim()) return false;
  const normalized = normalizePlayoffPhase(group);
  return NORMALIZED_PLAYOFF_PHASES.has(normalized);
}
