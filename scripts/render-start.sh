#!/usr/bin/env bash
set -euo pipefail

# Render define RENDER_EXTERNAL_URL automaticamente — corrige NEXT_PUBLIC_APP_URL se estiver em localhost
if [ -n "${RENDER_EXTERNAL_URL:-}" ]; then
  case "${NEXT_PUBLIC_APP_URL:-}" in
    ""|http://localhost:*|https://localhost:*|http://127.0.0.1:*|https://127.0.0.1:*)
      export NEXT_PUBLIC_APP_URL="${RENDER_EXTERNAL_URL}"
      echo "[app] NEXT_PUBLIC_APP_URL=${NEXT_PUBLIC_APP_URL} (via RENDER_EXTERNAL_URL)"
      ;;
  esac
fi

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
  echo "[ndu] Scrape NDU em background — app sobe sem esperar"
  nohup npx tsx scripts/bootstrap-and-scrape.ts > /tmp/ndu-scrape.log 2>&1 &

  NDU_SYNC_INTERVAL="${NDU_SYNC_INTERVAL_SECONDS:-21600}"
  echo "[ndu] Sync automático a cada ${NDU_SYNC_INTERVAL}s (logs: /tmp/ndu-cron.log)"
  (
    while true; do
      sleep "${NDU_SYNC_INTERVAL}"
      echo "[ndu-cron] $(date -Iseconds) iniciando sync agendado..."
      npx tsx scripts/ndu-cron-sync.ts >> /tmp/ndu-cron.log 2>&1 || true
    done
  ) &
fi

exec npm start
