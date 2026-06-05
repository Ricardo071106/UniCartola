#!/usr/bin/env bash
set -euo pipefail

if [ "${SKIP_DB_MIGRATE:-}" = "1" ]; then
  echo "[db] SKIP_DB_MIGRATE=1 — pulando migrate"
elif [ -z "${DATABASE_URL:-}" ] && [ -z "${SUPABASE_DB_PASSWORD:-}" ]; then
  echo "[db] AVISO: sem DATABASE_URL — app sobe sem migrate"
else
  echo "[db] Aplicando migrations..."
  if ! npx tsx scripts/migrate-schema.ts; then
    echo ""
    echo "[db] FALHA. Corrija DATABASE_URL ou use SKIP_DB_MIGRATE=1 temporariamente."
    exit 1
  fi
fi

if [ "${RUN_DB_SEED:-}" = "1" ]; then
  echo "[db] RUN_DB_SEED=1 — populando dados mock..."
  npm run db:seed || echo "[db] seed falhou (pode já estar populado)"
fi

echo "==> Starting Next.js on port ${PORT:-3000}..."
exec npm start
