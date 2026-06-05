import { redirect } from "next/navigation";
import { getDb } from "@/lib/db";
import { userProfiles, scrapeRuns, teamMappingQueue } from "@unicartola/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentUserId } from "@/lib/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminActions } from "@/components/admin/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const db = await getDb();
  const userId = await getCurrentUserId();
  if (!userId) redirect("/login");

  const [profile] = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.id, userId))
    .limit(1);

  if (!profile?.isAdmin) {
    return (
      <p className="text-center text-slate-500 py-12">
        Acesso restrito. Defina <code>is_admin = true</code> no perfil.
      </p>
    );
  }

  const [runs, pendingTeams] = await Promise.all([
    db.select().from(scrapeRuns).orderBy(desc(scrapeRuns.startedAt)).limit(10),
    db.select().from(teamMappingQueue).where(eq(teamMappingQueue.status, "pending")).limit(20),
  ]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Admin</h1>
      <AdminActions />

      <Card>
        <CardHeader>
          <CardTitle>Últimos scrapes</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm">
            {runs.map((r) => (
              <li key={r.id} className="flex justify-between border-b border-slate-100 py-2 dark:border-slate-800">
                <span>
                  {r.status} — +{r.matchesCreated} / ~{r.matchesUpdated}
                </span>
                <span className="text-slate-400">
                  {r.startedAt?.toLocaleString("pt-BR")}
                </span>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Times pendentes de revisão</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTeams.length === 0 ? (
            <p className="text-sm text-slate-500">Nenhum pendente.</p>
          ) : (
            <ul className="text-sm space-y-1">
              {pendingTeams.map((t) => (
                <li key={t.id}>{t.rawName}</li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
