import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export async function getRealEntryPaid(userId: string): Promise<boolean> {
  try {
    const db = requireDb();
    const [user] = await db
      .select({ realEntryPaid: users.realEntryPaid })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return user?.realEntryPaid ?? false;
  } catch {
    return false;
  }
}

export async function requireRealEntryPaid(userId: string): Promise<void> {
  const paid = await getRealEntryPaid(userId);
  if (!paid) {
    throw new Error(
      "Pague a inscrição de R$ 30,00 para palpitar no modo dinheiro real."
    );
  }
}
