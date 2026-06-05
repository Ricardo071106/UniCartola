#!/usr/bin/env bash
set -euo pipefail

export NEXT_TELEMETRY_DISABLED=1
export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=460}"

echo "==> Installing dependencies (incl. devDependencies for build)..."
npm install --include=dev

echo "==> Building Next.js (db:push roda no start, não no build)..."
npm run build

echo "==> Build OK"
