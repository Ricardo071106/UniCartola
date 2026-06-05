# Fontes de dados NDU

Site ativo: **https://www.ndu.com.br** (não usar ndu.net.br)

## URLs principais

| Recurso | URL |
|---------|-----|
| Jogos (placares + próximas) | https://www.ndu.com.br/jogos |
| Estatísticas (artilheiros/cestinhas) | https://www.ndu.com.br/estatisticas |
| Detalhe do jogo (cestinhas/artilheiros por partida) | https://www.ndu.com.br/jogos/resultado/{id} |
| Ícones das atléticas | `https://www.ndu.net.br/atleticas/{id}/logo_thumb.jpg` |

## Formato HTML — Jogos

Tabela `#placares_partidas` com colunas:

`DATA | MODALIDADE | SÉRIE | GRUPO | [logo casa] | placar | X | placar | [logo fora]`

- Data: `31 MAI` (com `<br>` no HTML)
- Nome do time: atributo `title` da tag `<img>`
- ID do jogo: URL `resultado/{id}` no `onclick` da linha

Modalidades relevantes:

| NDU | Campus League |
|-----|---------------|
| Futsal Masculino | futsal |
| Futebol de Campo Masculino | futebol |
| Basquete Masculino | basquete |

## Formato HTML — Resultado do jogo

Página `/jogos/resultado/{id}` contém tabela **Cestinhas** (basquete) ou **Artilheiros** (futebol/futsal) com nome do aluno e pontos/gols.

## Worker

Implementação em `src/lib/ndu/parser.ts` e `src/lib/ndu/sync.ts`.

- `parseNduJogosPage(html)` — extrai jogos de https://www.ndu.com.br/jogos
- `parseNduResultPage(html)` — extrai cestinhas/artilheiros de cada partida
- `runFullScrape()` — upsert em `matches` + `match_stats`
- Times não mapeados → `team_mapping_queue` com `needs_review`

## Agendamento

```bash
curl -X POST https://seu-app.onrender.com/api/cron/scrape \
  -H "Authorization: Bearer $CRON_SECRET"
```
