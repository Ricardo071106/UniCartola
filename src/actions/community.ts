"use server";

import { revalidatePath } from "next/cache";
import { requireDb } from "@/lib/db";
import { posts, postLikes, comments, users, universities } from "@/lib/db/schema";
import { requireSession } from "@/lib/auth/session";
import { and, eq, sql } from "drizzle-orm";

export async function createPost(content: string) {
  const session = await requireSession();
  if (!content.trim()) return { error: "Escreva algo para publicar" };

  const db = requireDb();
  await db.insert(posts).values({
    userId: session.userId,
    content: content.trim(),
  });

  revalidatePath("/comunidade");
  return { success: true };
}

export async function togglePostLike(postId: string) {
  const session = await requireSession();
  const db = requireDb();

  const existing = await db
    .select()
    .from(postLikes)
    .where(
      and(eq(postLikes.postId, postId), eq(postLikes.userId, session.userId))
    )
    .limit(1);

  if (existing.length) {
    await db
      .delete(postLikes)
      .where(eq(postLikes.id, existing[0].id));
    await db
      .update(posts)
      .set({ likesCount: sql`GREATEST(0, ${posts.likesCount} - 1)` })
      .where(eq(posts.id, postId));
    revalidatePath("/comunidade");
    return { success: true, liked: false };
  }

  await db.insert(postLikes).values({
    postId,
    userId: session.userId,
  });
  await db
    .update(posts)
    .set({ likesCount: sql`${posts.likesCount} + 1` })
    .where(eq(posts.id, postId));

  revalidatePath("/comunidade");
  return { success: true, liked: true };
}

export async function addComment(postId: string, content: string) {
  const session = await requireSession();
  if (!content.trim()) return { error: "Comentário vazio" };

  const db = requireDb();
  const [comment] = await db
    .insert(comments)
    .values({
      postId,
      userId: session.userId,
      content: content.trim(),
    })
    .returning();

  await db
    .update(posts)
    .set({ commentsCount: sql`${posts.commentsCount} + 1` })
    .where(eq(posts.id, postId));

  const [row] = await db
    .select({
      comment: comments,
      user: users,
      university: universities,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(universities, eq(users.universityId, universities.id))
    .where(eq(comments.id, comment.id))
    .limit(1);

  revalidatePath("/comunidade");

  return {
    comment: {
      id: row.comment.id,
      content: row.comment.content,
      createdAt: row.comment.createdAt,
      user: {
        nickname: row.user.nickname,
        avatarUrl: row.user.avatarUrl,
        university: row.university
          ? { shortName: row.university.shortName }
          : null,
      },
    },
  };
}
