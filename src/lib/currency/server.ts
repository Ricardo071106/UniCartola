import { cookies } from "next/headers";
import {
  CURRENCY_COOKIE,
  type CurrencyMode,
  isCurrencyMode,
} from "./mode";

export async function getCurrencyMode(): Promise<CurrencyMode> {
  const jar = await cookies();
  const fromCookie = jar.get(CURRENCY_COOKIE)?.value;
  if (isCurrencyMode(fromCookie)) return fromCookie;
  return "play";
}
