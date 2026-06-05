#!/usr/bin/env bash
set -euo pipefail

export NODE_OPTIONS="${NODE_OPTIONS:---max-old-space-size=460}"
export NEXT_TELEMETRY_DISABLED=1

echo "==> Installing dependencies..."
npm install --include=dev

echo "==> Building web app..."
npm run build -w web

echo "==> Build OK"
