import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const DEFAULT_PLAY_BALANCE = 10000;

export async function getUserBalances(userId: string): Promise<{
  playBalance: number;
  realBalance: number;
  realEntryPaid: boolean;
  totalPoints: number;
}> {
  try {
    const db = requireDb();
    const [user] = await db
      .select({
        playBalance: users.playBalance,
        realBalance: users.realBalance,
        realEntryPaid: users.realEntryPaid,
        totalPoints: users.totalPoints,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);
    return {
      playBalance: user?.playBalance ?? DEFAULT_PLAY_BALANCE,
      realBalance: user?.realBalance ?? 0,
      realEntryPaid: user?.realEntryPaid ?? false,
      totalPoints: user?.totalPoints ?? 0,
    };
  } catch (error) {
    console.error("[getUserBalances]", error);
    return {
      playBalance: DEFAULT_PLAY_BALANCE,
      realBalance: 0,
      realEntryPaid: false,
      totalPoints: 0,
    };
  }
}
