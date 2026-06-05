import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function LoginPage() {
  return (
    <div className="min-h-screen page-gradient flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1e3a5f] to-[#2d5a8e] shadow-xl">
            <GraduationCap className="h-10 w-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Campus League</h1>
        </div>
        <RedesignBanner
          title="Login pausado"
          description="O banco foi removido. Login e cadastro voltam quando a nova estrutura de dados estiver pronta."
        />
        <p className="text-center">
          <Link href="/" className="text-sm font-semibold text-[#1e3a5f] hover:underline">
            Voltar para home
          </Link>
        </p>
      </div>
    </div>
  );
}
