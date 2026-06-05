"use client";

import { useState, useTransition } from "react";
import { Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createPost } from "@/actions/community";

export function CreatePostForm() {
  const [content, setContent] = useState("");
  const [pending, startTransition] = useTransition();

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
      className="rounded-xl border border-gray-100 bg-white p-4 shadow-sm"
    >
      <textarea
        className="w-full resize-none rounded-lg border border-gray-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#1e3a5f]"
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
