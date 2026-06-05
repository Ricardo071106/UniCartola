"use server";

import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function completeOnboarding(data: {
  universityId: string;
  courseId: string;
  athleticsId: string;
  nickname: string;
}): Promise<{ error?: string } | void> {
  if (!data.nickname.trim() || data.nickname.length < 2) {
    return { error: "Apelido deve ter pelo menos 2 caracteres" };
  }

  const db = requireDb();

  const [user] = await db
    .insert(users)
    .values({
      nickname: data.nickname.trim(),
      universityId: data.universityId,
      courseId: data.courseId,
      athleticsId: data.athleticsId,
      onboardingComplete: true,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(data.nickname)}`,
    })
    .returning();

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}

export async function resumeDemoUser(userId: string) {
  const db = requireDb();
  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  if (!user) return { error: "Usuário não encontrado" };

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}
