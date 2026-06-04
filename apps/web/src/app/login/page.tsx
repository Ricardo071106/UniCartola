"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();

  function enterDemo() {
    router.push("/onboarding");
  }

  function enterPlatform() {
    router.push("/");
  }

  return (
    <div className="mx-auto max-w-md py-12">
      <div className="mb-8 text-center">
        <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-xl bg-accent text-xl font-bold text-white">
          CL
        </div>
        <h1 className="text-2xl font-bold">Campus League</h1>
        <p className="text-sm text-muted-foreground">Fantasy esportivo universitário</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Entrar</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <Button className="w-full" onClick={enterPlatform}>
            Explorar plataforma
          </Button>
          <Button variant="outline" className="w-full" onClick={enterDemo}>
            Criar perfil — onboarding
          </Button>

          <p className="pt-2 text-center text-xs text-muted-foreground">
            Configure Supabase para autenticação em produção.{" "}
            <Link href="/onboarding" className="text-accent hover:underline">
              Começar agora
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
