"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { registerUser } from "@/actions/auth";

export function RegisterForm() {
  const [nickname, setNickname] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await registerUser({ nickname });
      if (res?.error) setError(res.error);
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-xs font-bold uppercase tracking-wide text-zinc-400">
          Escolha seu apelido
        </label>
        <Input
          placeholder="Ex: craque_sp_99"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          maxLength={50}
          autoComplete="username"
        />
        <p className="mt-2 text-xs text-zinc-500">
          Aparece nos rankings e na comunidade. Não precisa escolher faculdade.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <Button type="submit" disabled={pending} className="w-full">
        {pending ? "Criando conta..." : "Criar conta"}
      </Button>

      <p className="text-center text-sm text-zinc-500">
        Já tem conta?{" "}
        <Link href="/login" className="font-bold text-[#00a86b] hover:underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}
