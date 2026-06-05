import { NextRequest, NextResponse } from "next/server";
import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { createSession } from "@/lib/auth/session";

export async function POST(request: NextRequest) {
  const userId =
    request.nextUrl.searchParams.get("userId") ??
    (await request.formData()).get("userId");

  if (!userId || typeof userId !== "string") {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  try {
    const db = requireDb();
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, userId))
      .limit(1);

    if (!user) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    await createSession({
      userId: user.id,
      nickname: user.nickname,
    });

    return NextResponse.redirect(new URL("/", request.url));
  } catch {
    return NextResponse.redirect(new URL("/login", request.url));
  }
}

export async function GET(request: NextRequest) {
  return POST(request);
}
