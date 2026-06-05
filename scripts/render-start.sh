#!/usr/bin/env bash
set -euo pipefail

if [ "${SKIP_DB_MIGRATE:-}" = "1" ]; then
  echo "[db] SKIP_DB_MIGRATE=1 — pulando db:push"
elif [ -z "${DATABASE_URL:-}" ]; then
  echo "[db] AVISO: DATABASE_URL não definida — app sobe sem sincronizar schema"
else
  echo "[db] Sincronizando schema (drizzle push)..."
  npm run db:push
fi

if [ "${RUN_DB_SEED:-}" = "1" ]; then
  echo "[db] RUN_DB_SEED=1 — populando dados mock..."
  npm run db:seed || echo "[db] seed falhou (pode já estar populado)"
fi

echo "==> Starting Next.js on port ${PORT:-3000}..."
exec npm start
