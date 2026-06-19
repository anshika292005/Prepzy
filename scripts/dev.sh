#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
VENV="$ROOT/.venv-ml"
PYTHON="${PYTHON:-python3}"

cleanup() {
  trap - INT TERM EXIT
  jobs -pr | xargs -r kill 2>/dev/null || true
}
trap cleanup INT TERM EXIT

if [ ! -x "$VENV/bin/python" ]; then
  "$PYTHON" -m venv "$VENV"
fi

"$VENV/bin/pip" install -q -r "$ROOT/ml_service/requirements.txt"

set -a
if [ -f "$ROOT/.env" ]; then source "$ROOT/.env"; fi
if [ -f "$ROOT/.env.local" ]; then source "$ROOT/.env.local"; fi
set +a

export PYTHON_API_URL="${PYTHON_API_URL:-http://127.0.0.1:8080}"
export ML_SERVICE_URL="$PYTHON_API_URL"

echo "Starting unified Python API on http://127.0.0.1:8080"
(
  cd "$ROOT"
  "$VENV/bin/uvicorn" backend.main:app \
    --host 127.0.0.1 \
    --port 8080 \
    --reload \
    --reload-dir backend \
    --reload-dir ml_service
) &

echo "Starting Next.js web application"
(
  cd "$ROOT"
  npm run dev
) &

wait
