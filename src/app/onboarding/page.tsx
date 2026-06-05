import { OnboardingWizard } from "./OnboardingWizard";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import { GraduationCap } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  let demoUsers: { id: string; nickname: string }[] = [];

  try {
    const db = requireDb();
    demoUsers = await db
      .select({ id: users.id, nickname: users.nickname })
      .from(users)
      .where(eq(users.onboardingComplete, true))
      .orderBy(desc(users.totalPoints))
      .limit(8);
  } catch {
    // DB not configured yet
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-lg px-4 py-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e3a5f]">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Campus League</h1>
          <p className="mt-2 text-sm text-gray-500">
            Represente sua faculdade. Palpite nos jogos universitários.
          </p>
        </div>

        <OnboardingWizard />

        {demoUsers.length > 0 && (
          <div className="mt-10 rounded-xl border border-gray-100 bg-white p-4">
            <p className="mb-3 text-xs font-semibold uppercase text-gray-500">
              Demo — entrar como usuário existente
            </p>
            <div className="flex flex-wrap gap-2">
              {demoUsers.map((u) => (
                <form key={u.id} action={`/api/demo-login?userId=${u.id}`}>
                  <button
                    type="submit"
                    className="rounded-full bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-[#1e3a5f]/10 hover:text-[#1e3a5f]"
                  >
                    {u.nickname}
                  </button>
                </form>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
