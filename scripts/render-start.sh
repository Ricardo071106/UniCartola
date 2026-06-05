#!/usr/bin/env bash
set -euo pipefail

echo "[start] Banco removido — subindo app sem migrate/seed"
exec npm start
