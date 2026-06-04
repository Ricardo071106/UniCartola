import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { userProfiles } from "@unicartola/db/schema";
import { eq } from "drizzle-orm";
import { requireUserId, getCurrentUserId } from "@/lib/auth";
import { randomUUID } from "crypto";

const schema = z.object({
  displayName: z.string().min(2).max(64),
  schoolId: z.string().uuid(),
  courseId: z.string().uuid(),
  athleticId: z.string().uuid(),
});

export async function POST(request: Request) {
  try {
    const db = await getDb();
    let userId = await getCurrentUserId();
    const body = schema.parse(await request.json());

    if (!userId) {
      if (process.env.NODE_ENV !== "development") {
        return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
      }
      userId = randomUUID();
    }

    const [existing] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.id, userId))
      .limit(1);

    if (existing) {
      await db
        .update(userProfiles)
        .set({
          displayName: body.displayName,
          schoolId: body.schoolId,
          courseId: body.courseId,
          athleticId: body.athleticId,
          onboardingComplete: true,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.id, userId));
    } else {
      await db.insert(userProfiles).values({
        id: userId,
        displayName: body.displayName,
        schoolId: body.schoolId,
        courseId: body.courseId,
        athleticId: body.athleticId,
        onboardingComplete: true,
      });
    }

    return NextResponse.json({ userId, ok: true });
  } catch {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 });
  }
}
