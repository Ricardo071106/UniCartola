"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { eq } from "drizzle-orm";
import {
  CURRENCY_COOKIE,
  type CurrencyMode,
  isCurrencyMode,
} from "@/lib/currency/mode";

export async function setCurrencyMode(mode: CurrencyMode) {
  if (!isCurrencyMode(mode)) return { error: "Modo inválido" };

  const jar = await cookies();
  jar.set(CURRENCY_COOKIE, mode, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  try {
    const session = await requireSession();
    const db = requireDb();
    await db
      .update(users)
      .set({ currencyMode: mode })
      .where(eq(users.id, session.userId));
  } catch {
    // visitante sem login — só cookie
  }

  revalidatePath("/", "layout");
  return { success: true };
}
