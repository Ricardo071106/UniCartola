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
elif [ -n "${DATABASE_URL:-}" ] && [ "${SKIP_NDU_SCRAPE:-}" != "1" ]; then
  echo "[ndu] Sincronizando jogos da NDU..."
  npx tsx scripts/bootstrap-and-scrape.ts || echo "[ndu] Scrape falhou — app sobe mesmo assim"
fi

exec npm start
