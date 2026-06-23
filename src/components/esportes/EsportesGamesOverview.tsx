import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { EsportesGameList } from "./EsportesGameList";
import type { EsporteGameWithDetails } from "@/lib/esportes/types";

export function EsportesGamesOverview({
  upcomingGames,
  finishedGames,
  showViewAll = false,
}: {
  upcomingGames: EsporteGameWithDetails[];
  finishedGames: EsporteGameWithDetails[];
  showViewAll?: boolean;
}) {
  return (
    <div className="space-y-5">
      <section className="cartola-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <div>
            <h2 className="text-base font-black text-white">Próximos Jogos</h2>
            <p className="text-xs font-medium text-zinc-500">
              Agenda das competições NDU
            </p>
          </div>
          {showViewAll && (
            <Link
              href="/esportes/jogos"
              className="flex items-center gap-1 text-xs font-bold text-[#c9a227] hover:text-white"
            >
              Ver todos
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          )}
        </div>
        <div className="p-3">
          <EsportesGameList
            games={upcomingGames}
            emptyMessage="Nenhum jogo agendado"
          />
        </div>
      </section>

      <section className="cartola-card overflow-hidden">
        <div className="border-b border-zinc-800 bg-zinc-900 px-4 py-3">
          <h2 className="text-base font-black text-white">Encerrados</h2>
          <p className="text-xs font-medium text-zinc-500">
            Resultados recentes das competições
          </p>
        </div>
        <div className="p-3">
          <EsportesGameList
            games={finishedGames}
            emptyMessage="Nenhum jogo encerrado"
          />
        </div>
      </section>
    </div>
  );
}
