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
  npx tsx scripts/migrate-schema.ts || echo "[db] migrate falhou — app sobe mesmo assim"
fi

if [ "${RUN_DB_SEED:-}" = "1" ]; then
  npm run db:seed || true
elif [ -n "${DATABASE_URL:-}" ] && [ "${SKIP_NDU_SCRAPE:-}" != "1" ]; then
  NDU_BOOT_DELAY="${NDU_BOOT_SCRAPE_DELAY_SECONDS:-120}"
  echo "[ndu] Scrape inicial em ${NDU_BOOT_DELAY}s (subprocesso) — app sobe primeiro"
  (
    sleep "${NDU_BOOT_DELAY}"
    echo "[ndu] Iniciando bootstrap-and-scrape..."
    npx tsx scripts/bootstrap-and-scrape.ts >> /tmp/ndu-scrape.log 2>&1 || true
  ) &
fi

exec npm start
