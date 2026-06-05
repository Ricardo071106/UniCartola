"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loginByNickname } from "@/actions/auth";

export function LoginForm() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await loginByNickname({ nickname });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Apelido
        </label>
        <Input
          placeholder="Seu apelido no UniCartola"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
          autoComplete="username"
        />
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Entrando..." : "Entrar"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Não tem conta?{" "}
        <Link href="/cadastro" className="font-bold text-[#00a86b] hover:underline">
          Cadastre-se
        </Link>
      </p>
    </form>
  );
}
