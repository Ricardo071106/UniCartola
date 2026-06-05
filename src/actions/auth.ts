"use server";

import { requireDb } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { createSession } from "@/lib/auth/session";
import { redirect } from "next/navigation";
import { eq } from "drizzle-orm";
import bcrypt from "bcryptjs";

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export async function registerUser(data: {
  email: string;
  username: string;
  password: string;
}): Promise<{ error?: string } | void> {
  const email = data.email.trim().toLowerCase();
  const username = data.username.trim();
  const password = data.password;

  if (!isValidEmail(email)) {
    return { error: "Digite um e-mail válido" };
  }
  if (username.length < 2) {
    return { error: "Nome de usuário deve ter pelo menos 2 caracteres" };
  }
  if (password.length < 6) {
    return { error: "Senha deve ter pelo menos 6 caracteres" };
  }

  const db = requireDb();

  const [emailTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (emailTaken) {
    return { error: "Este e-mail já está cadastrado. Faça login." };
  }

  const [nickTaken] = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.nickname, username))
    .limit(1);

  if (nickTaken) {
    return { error: "Este nome de usuário já está em uso." };
  }

  const passwordHash = await bcrypt.hash(password, 10);

  const [user] = await db
    .insert(users)
    .values({
      email,
      passwordHash,
      nickname: username,
      onboardingComplete: true,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${encodeURIComponent(username)}`,
    })
    .returning();

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}

export async function loginByEmail(data: {
  email: string;
  password: string;
}): Promise<{ error?: string } | void> {
  const email = data.email.trim().toLowerCase();
  const password = data.password;

  if (!email) return { error: "Digite seu e-mail" };
  if (!password) return { error: "Digite sua senha" };

  const db = requireDb();

  const [user] = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);

  if (!user) {
    return { error: "E-mail não encontrado. Cadastre-se primeiro." };
  }

  if (!user.passwordHash) {
    return {
      error: "Conta antiga sem senha. Cadastre-se novamente com e-mail.",
    };
  }

  const ok = await bcrypt.compare(password, user.passwordHash);
  if (!ok) {
    return { error: "Senha incorreta." };
  }

  await createSession({
    userId: user.id,
    nickname: user.nickname,
  });

  redirect("/");
}
