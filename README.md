# Campus League

Plataforma de fantasy esportivo universitário e palpites focada em campeonatos universitários brasileiros.

**Não é casa de apostas.** Sem apostas em dinheiro, sem odds, sem gambling.

## Stack

- **Frontend:** Next.js 15, TypeScript, TailwindCSS, Shadcn/UI, Lucide React
- **Backend:** Server Actions + API Routes
- **Banco:** PostgreSQL via `DATABASE_URL` (Drizzle ORM)
- **Deploy:** [Render](https://render.com)

## Funcionalidades

- Onboarding (faculdade → curso → atlética → apelido)
- Home com destaque, jogos, rankings e streaks
- Palpites (resultado +3, placar +5, ambos +8)
- Rankings (geral, faculdade, curso, atlética, semanal, histórico)
- Conquistas (badges)
- Comunidade (posts, curtidas, comentários)
- Notificações preparadas
- Filas de importação para dados externos futuros

## Setup local

### 1. Variáveis de ambiente

```bash
cp .env.example .env.local
```

```env
DATABASE_URL=postgresql://usuario:senha@host:5432/postgres
SESSION_SECRET=uma-string-longa-e-aleatoria
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

Use o connection string do PostgreSQL no Supabase (**apenas** `DATABASE_URL` — sem SDK Supabase).

### 2. Instalar e preparar banco

```bash
npm install
npm run db:push
npm run db:seed
```

### 3. Rodar

```bash
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). No primeiro acesso, complete o onboarding ou use um usuário demo após o seed.

## Deploy no Render

1. Conecte o repositório no Render
2. Use o blueprint `render.yaml` ou crie um Web Service Node
3. Configure `DATABASE_URL` (PostgreSQL Supabase ou Render Postgres)
4. `SESSION_SECRET` pode ser gerado automaticamente
5. O build executa `db:push` e `npm run build`

Após o deploy, rode o seed uma vez (Shell do Render):

```bash
npm run db:seed
```

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Desenvolvimento |
| `npm run build` | Build produção |
| `npm run db:push` | Sincroniza schema no PostgreSQL |
| `npm run db:seed` | Popula dados mockados |
| `npm run db:studio` | Drizzle Studio |

## Estrutura

```
src/
  app/           # Rotas Next.js (App Router)
  actions/       # Server Actions
  components/    # UI (MatchCard, Leaderboard, etc.)
  lib/db/        # Drizzle schema + conexão
  lib/queries/   # Consultas ao banco
```

## Identidade visual

Estilo inspirado em SofaScore / FlashScore / ESPN: limpo, mobile-first, azul escuro `#1e3a5f`, verde para positivos.

---

Campus League — rivalidade universitária saudável.
