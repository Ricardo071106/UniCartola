import {
  NDU_BROWSER_HEADERS,
  NDU_MODALITY_IDS,
} from "./constants";
import { NDU_CURRENT_SEMESTRE } from "./stats-period";

export const NDU_JOGOS_URL = "https://www.ndu.com.br/jogos";
export const NDU_LISTAR_URL = "https://www.ndu.com.br/jogos/listar_todos_jogos";
export const NDU_BOLETIM_URL = "https://www.ndu.com.br/boletim";
export const NDU_STATS_URL = "https://www.ndu.com.br/estatisticas";
export const NDU_STATS_MODALITY_URL =
  "https://www.ndu.com.br/estatisticas/por_modalidade";
export const NDU_ATLETICAS_URL = "https://www.ndu.com.br/atletica";

export async function fetchNduHtml(
  url: string,
  init?: RequestInit
): Promise<string> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...NDU_BROWSER_HEADERS,
      ...init?.headers,
    },
    next: { revalidate: 0 },
  });

  if (!res.ok) {
    throw new Error(`NDU fetch failed ${url}: ${res.status}`);
  }

  const text = await res.text();
  if (/Not Acceptable|Mod_Security/i.test(text)) {
    throw new Error(`NDU blocked request to ${url}`);
  }

  return text;
}

export async function fetchNduModalityFragment(
  modalityId: string
): Promise<string> {
  const body = new URLSearchParams({
    modalidade: modalityId,
    semestre: "",
    ano: "",
    atletica: "",
  });

  return fetchNduHtml(NDU_LISTAR_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: NDU_JOGOS_URL,
      "X-Requested-With": "XMLHttpRequest",
    },
    body,
  });
}

/** Página inicial + POST por modalidade (futsal, futebol, basquete). */
export async function fetchAllNduJogosHtml(): Promise<string> {
  const baseHtml = await fetchNduHtml(NDU_JOGOS_URL);
  const modalityIds = [
    ...NDU_MODALITY_IDS.futsal,
    ...NDU_MODALITY_IDS.futebol,
    ...NDU_MODALITY_IDS.basquete,
  ];

  const fragments = await Promise.all(
    modalityIds.map((id) => fetchNduModalityFragment(id))
  );

  return [baseHtml, ...fragments].join("\n");
}

export async function fetchNduBinary(
  url: string,
  referer: string
): Promise<Buffer> {
  const res = await fetch(url, {
    headers: {
      ...NDU_BROWSER_HEADERS,
      Accept: "application/pdf,*/*",
      Referer: referer,
    },
  });
  if (!res.ok) throw new Error(`NDU binary fetch failed ${url}: ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  if (buf.slice(0, 15).toString().includes("Not Acceptable")) {
    throw new Error(`NDU blocked binary request to ${url}`);
  }
  return buf;
}

let statsSessionWarmed = false;

async function warmNduStatsSession(): Promise<void> {
  if (statsSessionWarmed) return;
  try {
    await fetchNduHtml(NDU_STATS_URL);
    statsSessionWarmed = true;
  } catch {
    /* segue sem cookie de sessão */
  }
}

export async function fetchNduStatsFragment(
  modalityId: string,
  series: string,
  year: string,
  semestre: string = NDU_CURRENT_SEMESTRE
): Promise<string> {
  await warmNduStatsSession();

  const body = new URLSearchParams({
    modalidade: modalityId,
    serie: series,
    semestre,
    ano: year,
    id_atletica: "",
  });

  return fetchNduHtml(NDU_STATS_MODALITY_URL, {
    method: "POST",
    cache: "no-store",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Referer: NDU_STATS_URL,
      "X-Requested-With": "XMLHttpRequest",
    },
    body,
  });
}
