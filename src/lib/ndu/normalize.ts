export function normalizeTeamName(name: string): string {
  return name
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ");
}

export function modalityToSportSlug(modality: string): string | null {
  const m = modality.toLowerCase();
  if (m.includes("futsal")) return "futsal";
  if (m.includes("futebol") || m.includes("campo")) return "futebol";
  if (m.includes("basquete")) return "basquete";
  return null;
}

export function normalizeLogoUrl(url?: string): string | undefined {
  if (!url) return undefined;
  return url.replace(/^http:\/\//i, "https://");
}
