import { cookies } from "next/headers";
import { createClient } from "./supabase/server";

export const DEV_SESSION_COOKIE = "campus_league_dev_user";

export async function getCurrentUserId(): Promise<string | null> {
  const supabase = await createClient();
  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return user.id;
  }

  const cookieStore = await cookies();
  const devId = cookieStore.get(DEV_SESSION_COOKIE)?.value;
  if (devId && process.env.NODE_ENV === "development") return devId;

  return null;
}

export async function requireUserId(): Promise<string> {
  const id = await getCurrentUserId();
  if (!id) throw new Error("Unauthorized");
  return id;
}
