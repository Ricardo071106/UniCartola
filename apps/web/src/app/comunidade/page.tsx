"use client";

import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { getPosts, getComments, getDemoUser } from "@/lib/data";
import { Heart, MessageCircle, Send } from "lucide-react";

export default function ComunidadePage() {
  const demoUser = getDemoUser();
  const initialPosts = getPosts(20);
  const [posts, setPosts] = useState(initialPosts);
  const [newPost, setNewPost] = useState("");
  const [expandedPost, setExpandedPost] = useState<string | null>(null);

  function handlePost() {
    if (newPost.trim().length < 3) return;
    const post = {
      id: `local-${Date.now()}`,
      userId: demoUser.id,
      userName: demoUser.displayName,
      schoolName: demoUser.schoolName.split(" ")[0],
      content: newPost.trim(),
      createdAt: new Date(),
      reactions: 0,
      commentsCount: 0,
    };
    setPosts([post, ...posts]);
    setNewPost("");
  }

  function handleReaction(postId: string) {
    setPosts(
      posts.map((p) => (p.id === postId ? { ...p, reactions: p.reactions + 1 } : p))
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Comunidade</h1>
        <p className="text-sm text-muted-foreground">
          Rivalidade saudável entre faculdades
        </p>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Avatar name={demoUser.displayName} size="sm" />
            <div className="flex-1 space-y-3">
              <Input
                value={newPost}
                onChange={(e) => setNewPost(e.target.value)}
                placeholder="FEI vai atropelar a Mauá hoje..."
                onKeyDown={(e) => e.key === "Enter" && handlePost()}
              />
              <div className="flex justify-end">
                <Button size="sm" onClick={handlePost} disabled={newPost.trim().length < 3}>
                  <Send className="mr-1.5 h-4 w-4" />
                  Publicar
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {posts.map((post) => {
          const comments = getComments(post.id);
          const isExpanded = expandedPost === post.id;

          return (
            <Card key={post.id}>
              <CardContent className="p-4">
                <div className="flex gap-3">
                  <Avatar name={post.userName} size="sm" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{post.userName}</p>
                      <span className="text-xs text-muted-foreground">{post.schoolName}</span>
                    </div>
                    <p className="mt-1 text-sm leading-relaxed">{post.content}</p>
                    <p className="mt-2 text-[10px] text-muted-foreground">
                      {post.createdAt.toLocaleDateString("pt-BR", {
                        day: "2-digit",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>

                    <div className="mt-3 flex items-center gap-4">
                      <button
                        onClick={() => handleReaction(post.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-red-500"
                      >
                        <Heart className="h-4 w-4" />
                        {post.reactions}
                      </button>
                      <button
                        onClick={() => setExpandedPost(isExpanded ? null : post.id)}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-accent"
                      >
                        <MessageCircle className="h-4 w-4" />
                        {comments.length || post.commentsCount}
                      </button>
                    </div>

                    {isExpanded && comments.length > 0 && (
                      <div className="mt-3 space-y-2 border-t border-border pt-3">
                        {comments.map((c) => (
                          <div key={c.id} className="flex gap-2">
                            <Avatar name={c.userName} size="sm" className="h-6 w-6 text-[10px]" />
                            <div>
                              <p className="text-xs font-semibold">{c.userName}</p>
                              <p className="text-xs text-muted-foreground">{c.content}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
