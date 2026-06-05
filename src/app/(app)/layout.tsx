import { AppShell } from "@/components/layout/AppShell";
import { getSession } from "@/lib/auth/session";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  return <AppShell session={session}>{children}</AppShell>;
}
