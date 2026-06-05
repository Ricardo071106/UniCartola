# Pontuação

## Palpites de partida

Função: `apps/web/src/lib/scoring/match.ts`

| Resultado | Pontos |
|-----------|--------|
| Vencedor (ou empate) | 3 |
| Placar exato | 5 |
| Vencedor + placar exato | 8 |

Prioridade: 8 > 5 > 3 (não acumulam 3+5).

Processamento: ao finalizar partida (`status = finished`), `processFinishedMatch` grava `points_ledger` e atualiza rankings.

## Mercados estatísticos

| Mercado | Pontos |
|---------|--------|
| Artilheiro / pontuador da temporada | 15 |

Resolução manual/admin: `stat_markets.status = resolved` + `resolved_player_name`.

## Rankings

Escopos em `leaderboard_snapshots`:

- `global`
- `school`
- `course`
- `athletic`

Atualização: `refreshLeaderboards(competitionId)` após cada scoring.
