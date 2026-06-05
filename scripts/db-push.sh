#!/usr/bin/env bash
# Direct connection: push só localmente, nunca no build do Render
if [ "${RENDER:-}" = "true" ]; then
  echo "[db:push] Pulado no Render."
  exit 0
fi
if [ -z "${DATABASE_URL:-}" ]; then
  echo "[db:push] Sem DATABASE_URL."
  exit 0
fi
npx drizzle-kit push --force
