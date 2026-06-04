import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { randomUUID } from "crypto";
import { getDb } from "@/lib/db";
import { userProfiles } from "@unicartola/db/schema";
import { eq } from "drizzle-orm";
import { DEV_SESSION_COOKIE } from "@/lib/auth";

export async function POST(request: Request) {
  const db = await getDb();
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not available" }, { status: 403 });
  }

  const body = await request.json();
  const userId = body.userId as string | undefined;

  let id = userId;
  if (!id) {
    id = randomUUID();
  } else {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, id))
      .limit(1);
    if (!profile) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }
  }

  const cookieStore = await cookies();
  cookieStore.set(DEV_SESSION_COOKIE, id!, {
    httpOnly: true,
    secure: false,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });

  return NextResponse.json({ userId: id });
}
