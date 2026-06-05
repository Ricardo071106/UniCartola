import { Construction } from "lucide-react";

export function RedesignBanner({
  title = "Plataforma em redesign",
  description = "O banco de dados foi removido para repensarmos a organização dos dados e o benchmark. Em breve, nova estrutura.",
}: {
  title?: string;
  description?: string;
}) {
  return (
    <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50 p-6 text-center">
      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
        <Construction className="h-6 w-6 text-amber-700" />
      </div>
      <h2 className="text-lg font-bold text-gray-900">{title}</h2>
      <p className="mt-2 text-sm text-gray-600 max-w-md mx-auto">{description}</p>
    </div>
  );
}
