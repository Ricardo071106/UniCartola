import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClient } from "@/lib/supabase/server";
import { DEV_SESSION_COOKIE } from "@/lib/auth";

export async function POST() {
  const supabase = await createClient();
  if (supabase) await supabase.auth.signOut();

  const cookieStore = await cookies();
  cookieStore.delete(DEV_SESSION_COOKIE);

  return NextResponse.json({ ok: true });
}
