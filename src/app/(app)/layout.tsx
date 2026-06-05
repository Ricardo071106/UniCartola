import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";
import { getCurrencyMode } from "@/lib/currency/server";
import { getUserBalances } from "@/lib/queries/user-balances";

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
    const balances = await getUserBalances(session.userId);
    playBalance = balances.playBalance;
    realBalance = balances.realBalance;
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
