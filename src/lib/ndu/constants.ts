/** IDs da NDU (select modalidade em ndu.com.br/jogos) */
export const NDU_MODALITY_IDS = {
  basquete: ["1"],
  futsal: ["2"],
  futebol: ["3"],
} as const;

export const NDU_BROWSER_HEADERS: Record<string, string> = {
  "User-Agent":
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
  "Accept-Language": "pt-BR,pt;q=0.9,en;q=0.8",
};
