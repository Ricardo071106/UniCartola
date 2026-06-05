# Fontes de dados NDU

## URLs principais

| Recurso | URL |
|---------|-----|
| Jogos geral | https://www.ndu.net.br/jogos |
| Futsal M | https://www.ndu.net.br/index.php/modalidades/lista_jogos/futsal-masculino |
| Futebol M | https://www.ndu.net.br/index.php/modalidades/lista_jogos/futebol-masculino |
| Basquete M | https://www.ndu.net.br/index.php/modalidades/lista_jogos/basquete-masculino |
| Boletins | https://www.ndu.net.br/boletim |

## Formato HTML

Tabelas com colunas: `DATA | MODALIDADE/SÉRIE | SÉRIE | GRUPO | RESULTADO`

- Resultados: `54 X 46` ou `54 | X | 46`
- Datas: `01MAR`, `05MAR` (dia + mês abreviado PT)
- Próximas partidas sem placar podem incluir `Local`

## Worker

Implementação em `workers/scraper/src/parser.ts` e `sync.ts`.

- `parseGamesPage(html)` — extrai linhas
- `buildExternalKey(row, modalitySlug)` — idempotência
- `syncModality(mod)` — upsert em `matches`
- Times não mapeados → `team_mapping_queue` com `needs_review`

## Agendamento

- Dias de jogo: horário (padrão 1h via `SCRAPER_INTERVAL_MS`)
- Cron Vercel: `POST /api/cron/scrape` com `CRON_SECRET`
