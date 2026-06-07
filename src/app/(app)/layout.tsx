import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { getUserBalances } from "@/lib/queries/user-balances";
import { safeQuery } from "@/lib/db/safe-query";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  const currencyMode = await getCurrencyMode();

  let totalPoints = 0;
  let realBalance = 0;
  if (session) {
    const balances = await safeQuery(
      () => getUserBalances(session.userId),
      {
        playBalance: 10000,
        realBalance: 0,
        realEntryPaid: false,
        totalPoints: 0,
      },
      4000
    );
    totalPoints = balances.totalPoints;
    realBalance = balances.realBalance;
  }

  return (
    <AppShell
      session={session}
      currencyMode={currencyMode}
      totalPoints={totalPoints}
      realBalance={realBalance}
    >
      {children}
    </AppShell>
  );
}
