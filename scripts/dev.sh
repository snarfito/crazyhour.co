#!/usr/bin/env bash
# Starts local Supabase (if down) + the Next dev server (if down), then opens the browser.
# Usage: scripts/dev.sh   — safe to re-run; Ctrl+C stops the dev server (Supabase keeps running).
set -euo pipefail
cd "$(dirname "$0")/.."   # supabase CLI must run from app/ (wrong cwd silently no-ops)

PORT=3000
URL="http://localhost:$PORT"

docker info >/dev/null 2>&1 || { echo "Docker isn't running — open Docker Desktop first."; exit 1; }
supabase status >/dev/null 2>&1 || supabase start
[ -d node_modules ] || npm install

if lsof -iTCP:$PORT -sTCP:LISTEN >/dev/null 2>&1; then
  echo "Dev server already running on $URL"
  open "$URL"
else
  (sleep 3 && open "$URL") &
  exec npm run dev -- --port $PORT
fi
