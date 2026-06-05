#!/usr/bin/env bash
set -euo pipefail

if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db:push] DATABASE_URL não definida — ignorando (normal no build do Render)."
  exit 0
fi

echo "[db:push] Sincronizando schema..."
npx drizzle-kit push --force
