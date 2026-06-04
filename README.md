# Unicartola

Plataforma de palpites e rankings para esporte universitário brasileiro (NDU — futsal, futebol, basquete).

## Stack

- **apps/web** — Next.js 16, Tailwind, Supabase Auth (opcional)
- **packages/db** — Drizzle ORM + PostgreSQL
- **workers/scraper** — Ingestão NDU (cheerio)

## Setup rápido

```bash
# 1. Banco local
docker compose up -d

# 2. Variáveis
cp .env.example .env

# 3. Instalar e migrar
npm install
npm run db:migrate
npm run db:seed

# 4. App
npm run dev
```

Acesse [http://localhost:3000](http://localhost:3000). Em desenvolvimento, use **Entrar como dev** em `/login` e complete o cadastro em `/cadastro`.

## Scripts

| Comando | Descrição |
|---------|-----------|
| `npm run dev` | Next.js dev server |
| `npm run db:migrate` | Aplica migrations |
| `npm run db:seed` | Faculdades, competição NDU, mercados, jogos demo |
| `npm run scraper:run` | Scrape único da NDU |
| `npm run scraper` | Worker contínuo (intervalo configurável) |

## Scraper NDU

Fontes: [ndu.net.br/jogos](https://www.ndu.net.br/jogos) e páginas por modalidade.

```bash
npm run scraper:run
```

Ou via admin (`is_admin = true` no perfil) em `/admin`, ou cron:

```bash
curl -X POST http://localhost:3000/api/cron/scrape \
  -H "Authorization: Bearer $CRON_SECRET"
```

## Pontuação

- Vencedor correto: **+3**
- Placar exato: **+5**
- Vencedor + placar: **+8**
- Mercados (artilheiro/pontuador): **+15**

## Admin

```sql
UPDATE user_profiles SET is_admin = true WHERE display_name = 'Seu Apelido';
```

## Documentação

- [docs/data-sources.md](docs/data-sources.md) — URLs e parsing NDU
- [docs/scoring.md](docs/scoring.md) — Regras de pontuação
