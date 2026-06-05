#!/usr/bin/env bash
set -euo pipefail

if [ "${SKIP_DB_MIGRATE:-}" = "1" ]; then
  echo "[db] SKIP_DB_MIGRATE=1"
elif [ -z "${DATABASE_URL:-}" ]; then
  echo "[db] Sem DATABASE_URL — app sobe sem migrate"
else
  echo "[db] Iniciando migrate (RENDER=${RENDER:-unset}, SUPABASE_REGION=${SUPABASE_REGION:-unset})"
  npx tsx scripts/migrate-schema.ts
fi

if [ "${RUN_DB_SEED:-}" = "1" ]; then
  npm run db:seed || true
fi

exec npm start
