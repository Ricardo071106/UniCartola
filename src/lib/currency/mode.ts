export type CurrencyMode = "play" | "real";

export const CURRENCY_COOKIE = "cartola_currency_mode";
export const DEFAULT_PLAY_BALANCE = 10000;
export const DEFAULT_STAKE = 100;

export function isCurrencyMode(value: string | undefined): value is CurrencyMode {
  return value === "play" || value === "real";
}

export function currencyLabel(mode: CurrencyMode): string {
  return mode === "play" ? "Fichas" : "Dinheiro real";
}
