#!/usr/bin/env bash
set -euo pipefail

# No Render o build tem DATABASE_URL, mas a rede do build não conecta ao Supabase.
# Schema sincroniza no start (scripts/render-start.sh).
if [ "${RENDER:-}" = "true" ] && [ "${RUN_DB_PUSH_IN_BUILD:-}" != "1" ]; then
  echo "[db:push] Pulado no Render build — rode no start via render-start.sh."
  exit 0
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db:push] DATABASE_URL não definida — ignorando."
  exit 0
fi

echo "[db:push] Sincronizando schema..."
npx drizzle-kit push --force
