import Link from "next/link";
import { GraduationCap } from "lucide-react";
import { RedesignBanner } from "@/components/layout/RedesignBanner";

export default function OnboardingPage() {
  return (
    <div className="min-h-screen page-gradient">
      <div className="mx-auto max-w-lg px-4 py-12">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#1e3a5f]">
            <GraduationCap className="h-9 w-9 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Campus League</h1>
        </div>
        <RedesignBanner
          title="Cadastro pausado"
          description="Estamos repensando a organização dos dados e o benchmark antes de reabrir o cadastro."
        />
        <p className="mt-6 text-center text-sm text-gray-500">
          <Link href="/" className="font-semibold text-[#1e3a5f] hover:underline">
            Ir para home
          </Link>
        </p>
      </div>
    </div>
  );
}
