#!/usr/bin/env bash
# Wrapper na raiz para Render usar sem path scripts/ (copie como Build Command se quiser)
set -euo pipefail
export NEXT_TELEMETRY_DISABLED=1
npm install --include=dev
npm run build
echo "Build OK — db:push roda no start, não aqui."
