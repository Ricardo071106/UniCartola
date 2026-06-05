"use server";

import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";

export async function registerUser(data: {
  nickname: string;
}): Promise<{ error?: string } | void> {
  const nickname = data.nickname.trim();
  if (nickname.length < 2) {
    return { error: "Apelido deve ter pelo menos 2 caracteres" };
  }

  const db = requireDb();

  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nickname, nickname))
    .limit(1);

  if (existing[0]) {
    return { error: "Este apelido já está em uso. Tente outro ou faça login." };
  }

  const [user] = await db
    .insert(users)
    .values({
      nickname,
      onboardingComplete: true,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(nickname)}`,
    })
    .returning();

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}

export async function loginByNickname(data: {
  nickname: string;
}): Promise<{ error?: string } | void> {
  const nickname = data.nickname.trim();
  if (!nickname) return { error: "Digite seu apelido" };

  const db = requireDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.nickname, nickname))
    .limit(1);

  if (!user) {
    return { error: "Apelido não encontrado. Cadastre-se primeiro." };
  }

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}
