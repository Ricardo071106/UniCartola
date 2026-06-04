# Campus League

Plataforma de fantasy esportivo universitário e palpites focada em campeonatos universitários brasileiros.

**Não é uma casa de apostas.** É engajamento esportivo universitário inspirado em Cartola, SofaScore e ESPN.

## Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, Shadcn-style UI, Lucide Icons
- **Backend:** Supabase Auth + API Routes
- **Banco:** PostgreSQL (Supabase) via Drizzle ORM
- **Deploy:** Vercel

## Estrutura

```
apps/web/          → Next.js app (Campus League)
packages/db/       → Schema Drizzle, migrations, seed
workers/scraper/   → Arquitetura preparada para importação futura
```

## Páginas

| Rota | Descrição |
|------|-----------|
| `/` | Home — banner, jogos do dia, rankings, destaques |
| `/jogos` | Lista de jogos com filtros |
| `/jogos/[id]` | Detalhe do jogo, stats, palpite |
| `/rankings` | Rankings geral, semanal, histórico, faculdade, curso, atlética |
| `/comunidade` | Feed social universitário |
| `/perfil` | Perfil, conquistas, notificações |
| `/onboarding` | Cadastro em 5 etapas |

## Dados mockados

O MVP inclui dados fictícios completos (20 faculdades, 100 usuários, 200 jogos) via `apps/web/src/lib/mock/generator.ts`. Funciona imediatamente sem banco configurado.

Para popular o PostgreSQL:

```bash
cp .env.example .env
# Configure DATABASE_URL

npm install
npm run db:migrate
npm run db:seed
npm run dev
```

## Pontuação

| Resultado | Pontos |
|-----------|--------|
| Acertou vencedor | +3 |
| Acertou placar exato | +5 |
| Acertou ambos | +8 |
| Errou | 0 |

## Identidade visual

- Fundo branco, tons neutros
- Azul escuro (`#1e3a5f`) para destaque
- Verde apenas para resultados positivos
- Mobile-first com menu inferior; sidebar fixa no desktop

## Deploy (Vercel)

1. Conecte o repositório na Vercel
2. Configure `DATABASE_URL`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Build command: `npm run build`
4. Root directory: `/`

## Arquitetura futura

- `matches_import_queue` — fila para importação de jogos
- `statistics_import_queue` — fila para estatísticas
- `workers/scraper` — scraping NDU (não implementado no MVP)
