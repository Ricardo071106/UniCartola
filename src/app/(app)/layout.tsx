import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const currencyMode = await getCurrencyMode();

  let playBalance = 10000;
  let realBalance = 0;
  if (session) {
    try {
      const db = requireDb();
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, session.userId))
        .limit(1);
      playBalance = user?.playBalance ?? 10000;
      realBalance = user?.realBalance ?? 0;
    } catch (error) {
      console.error("[layout] Falha ao carregar saldo do usuário:", error);
    }
  }

  return (
    <AppShell
      session={session}
      currencyMode={currencyMode}
      playBalance={playBalance}
      realBalance={realBalance}
    >
      {children}
    </AppShell>
  );
}
