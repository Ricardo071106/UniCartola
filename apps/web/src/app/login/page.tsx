"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDevLogin() {
    setLoading(true);
    const res = await fetch("/api/auth/dev-login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    if (res.ok) {
      router.push("/cadastro");
      return;
    }
    setError("Falha no login de desenvolvimento");
    setLoading(false);
  }

  async function handleSupabaseLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("Configure Supabase (NEXT_PUBLIC_SUPABASE_URL) para login por email.");
  }

  const isDev = process.env.NODE_ENV === "development";

  return (
    <div className="mx-auto max-w-md py-12">
      <Card>
        <CardHeader>
          <CardTitle>Entrar no Unicartola</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSupabaseLogin} className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.edu.br"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 dark:border-slate-700 dark:bg-slate-900"
            />
            <Button type="submit" className="w-full" disabled={loading}>
              Continuar com email
            </Button>
          </form>

          {isDev && (
            <>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-slate-200" />
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="bg-white px-2 text-slate-400 dark:bg-slate-900">dev</span>
                </div>
              </div>
              <Button variant="secondary" className="w-full" onClick={handleDevLogin} disabled={loading}>
                Entrar como dev
              </Button>
            </>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}

          <p className="text-center text-sm text-slate-500">
            Novo por aqui?{" "}
            <Link href="/cadastro" className="text-emerald-600 hover:underline">
              Criar perfil
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
