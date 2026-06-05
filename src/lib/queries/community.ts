import { requireDb } from "@/lib/db";
import {
  posts,
  users,
  universities,
  comments,
  postLikes,
} from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";
import type { PostWithAuthor, CommentWithAuthor } from "@/types";

export async function getFeedPosts(
  currentUserId?: string,
  limit = 20
): Promise<PostWithAuthor[]> {
  const db = requireDb();
  const rows = await db
    .select({
      post: posts,
      user: users,
      university: universities,
    })
    .from(posts)
    .innerJoin(users, eq(posts.userId, users.id))
    .leftJoin(universities, eq(users.universityId, universities.id))
    .orderBy(desc(posts.createdAt))
    .limit(limit);

  let likedPostIds = new Set<string>();
  if (currentUserId) {
    const likes = await db
      .select()
      .from(postLikes)
      .where(eq(postLikes.userId, currentUserId));
    likedPostIds = new Set(likes.map((l) => l.postId));
  }

  return rows.map((r) => ({
    id: r.post.id,
    content: r.post.content,
    likesCount: r.post.likesCount,
    commentsCount: r.post.commentsCount,
    createdAt: r.post.createdAt,
    user: {
      id: r.user.id,
      nickname: r.user.nickname,
      avatarUrl: r.user.avatarUrl,
      university: r.university
        ? { shortName: r.university.shortName }
        : null,
    },
    likedByCurrentUser: likedPostIds.has(r.post.id),
  }));
}

export async function getPostComments(postId: string): Promise<CommentWithAuthor[]> {
  const db = requireDb();
  const rows = await db
    .select({
      comment: comments,
      user: users,
      university: universities,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .leftJoin(universities, eq(users.universityId, universities.id))
    .where(eq(comments.postId, postId))
    .orderBy(desc(comments.createdAt));

  return rows.map((r) => ({
    id: r.comment.id,
    content: r.comment.content,
    createdAt: r.comment.createdAt,
    user: {
      nickname: r.user.nickname,
      avatarUrl: r.user.avatarUrl,
      university: r.university
        ? { shortName: r.university.shortName }
        : null,
    },
  }));
}
