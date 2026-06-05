"use client";

import { useState, useTransition } from "react";
import { Heart, MessageCircle, Send } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { CommentCard } from "./CommentCard";
import { togglePostLike, addComment } from "@/actions/community";
import type { PostWithAuthor, CommentWithAuthor } from "@/types";

interface PostCardProps {
  post: PostWithAuthor;
  comments?: CommentWithAuthor[];
}

export function PostCard({ post, comments = [] }: PostCardProps) {
  const [liked, setLiked] = useState(post.likedByCurrentUser ?? false);
  const [likesCount, setLikesCount] = useState(post.likesCount);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState("");
  const [localComments, setLocalComments] = useState(comments);
  const [pending, startTransition] = useTransition();

  function handleLike() {
    startTransition(async () => {
      const res = await togglePostLike(post.id);
      if (res.success) {
        setLiked(res.liked);
        setLikesCount((c) => (res.liked ? c + 1 : c - 1));
      }
    });
  }

  function handleComment(e: React.FormEvent) {
    e.preventDefault();
    if (!commentText.trim()) return;
    startTransition(async () => {
      const res = await addComment(post.id, commentText.trim());
      if (res.comment) {
        setLocalComments((prev) => [...prev, res.comment!]);
        setCommentText("");
        setShowComments(true);
      }
    });
  }

  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <Avatar>
            {post.user.avatarUrl && (
              <AvatarImage src={post.user.avatarUrl} alt={post.user.nickname} />
            )}
            <AvatarFallback label={post.user.nickname} />
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-gray-900">
                {post.user.nickname}
              </span>
              {post.user.university && (
                <span className="text-xs font-semibold text-[#1e3a5f]">
                  {post.user.university.shortName}
                </span>
              )}
            </div>
            <p className="text-[10px] text-gray-400">
              {new Date(post.createdAt).toLocaleString("pt-BR")}
            </p>
          </div>
        </div>

        <p className="mt-3 text-gray-800 leading-relaxed">{post.content}</p>

        <div className="mt-4 flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={pending}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-red-500 transition-colors"
          >
            <Heart
              className={`h-5 w-5 ${liked ? "fill-red-500 text-red-500" : ""}`}
            />
            {likesCount}
          </button>
          <button
            type="button"
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm text-gray-600 hover:text-[#1e3a5f]"
          >
            <MessageCircle className="h-5 w-5" />
            {post.commentsCount + localComments.length - comments.length}
          </button>
        </div>

        {showComments && (
          <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
            {localComments.map((c) => (
              <CommentCard key={c.id} comment={c} />
            ))}
            <form onSubmit={handleComment} className="flex gap-2">
              <Input
                placeholder="Comentar..."
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
              />
              <Button type="submit" size="icon" disabled={pending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
