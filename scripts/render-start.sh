#!/usr/bin/env bash
set -euo pipefail

if [ "${SKIP_DB_MIGRATE:-}" = "1" ]; then
  echo "[db] SKIP_DB_MIGRATE=1 — pulando sincronização de schema"
elif [ -z "${DATABASE_URL:-}" ] && [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "[db] AVISO: sem DATABASE_URL — app sobe sem sincronizar schema"
else
  echo "[db] Sincronizando schema..."
  if ! npx tsx scripts/push-schema.ts; then
    echo ""
    echo "[db] FALHA na migração. Corrija DATABASE_URL ou use SKIP_DB_MIGRATE=1 temporariamente."
    exit 1
  fi
fi

if [ "${RUN_DB_SEED:-}" = "1" ]; then
  echo "[db] RUN_DB_SEED=1 — populando dados mock..."
  npm run db:seed || echo "[db] seed falhou (pode já estar populado)"
fi

echo "==> Starting Next.js on port ${PORT:-3000}..."
exec npm start
