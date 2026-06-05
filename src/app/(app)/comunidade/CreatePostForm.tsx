"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/actions/community";

export function CreatePostForm({ isLoggedIn }: { isLoggedIn: boolean }) {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

  if (!isLoggedIn) {
    return (
      <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4 text-center">
        <p className="text-sm text-zinc-500">
          <Link href="/login" className="font-bold text-[#00a86b] hover:underline">
            Entre
          </Link>{" "}
          ou{" "}
          <Link href="/cadastro" className="font-bold text-[#00a86b] hover:underline">
            cadastre-se
          </Link>{" "}
          para publicar
        </p>
      </div>
    );
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      await createPost(content);
      setContent("");
    });
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-zinc-800 bg-zinc-950 p-4"
    >
      <textarea
        className="w-full resize-none rounded-lg border border-zinc-700 bg-zinc-900 p-3 text-sm text-white placeholder:text-zinc-600 focus:outline-none focus:ring-2 focus:ring-[#00a86b]"
        rows={3}
        placeholder='Ex: "Hoje a FEI leva essa."'
        value={content}
        onChange={(e) => setContent(e.target.value)}
      />
      <div className="mt-3 flex justify-end">
        <Button type="submit" disabled={pending || !content.trim()} size="sm">
          <Send className="h-4 w-4" />
          Publicar
        </Button>
      </div>
    </form>
  );
}
