#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Prepzy — Local Dev Script  (no Docker required)
#
#  Starts the Python ML service directly with uvicorn for fast
#  local development with hot-reload.
#
#  Usage:
#    chmod +x scripts/dev.sh
#    ./scripts/dev.sh
#
#  Prerequisites:
#    Python 3.11+   pip install -r ml_service/requirements.txt
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

GREEN='\033[0;32m'; CYAN='\033[0;36m'; YELLOW='\033[1;33m'; RESET='\033[0m'

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ML_DIR="$PROJECT_ROOT/ml_service"

echo -e "${GREEN}Prepzy ML — Local Dev Mode${RESET}"
echo ""

# ── Check Python version ──────────────────────────────────────
PYTHON=$(command -v python3.11 || command -v python3 || echo "")
if [ -z "$PYTHON" ]; then
  echo -e "${YELLOW}python3 not found. Install Python 3.11+ first.${RESET}"
  exit 1
fi
PY_VERSION=$("$PYTHON" --version 2>&1)
echo -e "${CYAN}Using $PY_VERSION${RESET}"

# ── Create / activate virtual environment ────────────────────
VENV_DIR="$PROJECT_ROOT/.venv-ml"
if [ ! -d "$VENV_DIR" ]; then
  echo "Creating virtual environment at .venv-ml ..."
  "$PYTHON" -m venv "$VENV_DIR"
fi

# shellcheck source=/dev/null
source "$VENV_DIR/bin/activate"
echo -e "${GREEN}Virtual environment activated${RESET}"

# ── Install / update dependencies ────────────────────────────
echo "Installing Python dependencies..."
pip install --quiet --upgrade pip
pip install --quiet -r "$ML_DIR/requirements.txt"
echo -e "${GREEN}Dependencies ready${RESET}"

# ── Load .env ────────────────────────────────────────────────
if [ -f "$PROJECT_ROOT/.env" ]; then
  # Export only the vars we need (don't pollute the shell)
  export ANTHROPIC_API_KEY=$(
    sed -n 's/^ANTHROPIC_API_KEY=//p' "$PROJECT_ROOT/.env" \
      | tail -n 1 \
      | tr -d '"'
  )
  echo -e "${CYAN}Loaded ANTHROPIC_API_KEY from .env${RESET}"
else
  echo -e "${YELLOW}.env not found — ANTHROPIC_API_KEY may not be set${RESET}"
fi

# ── Start uvicorn with hot-reload ────────────────────────────
echo ""
echo -e "${GREEN}Starting ML service on http://localhost:8080${RESET}"
echo -e "${CYAN}Swagger UI: http://localhost:8080/docs${RESET}"
echo -e "${YELLOW}Hot-reload enabled — changes to ml_service/ restart automatically${RESET}"
echo ""

cd "$ML_DIR"
exec uvicorn main:app \
  --host 0.0.0.0 \
  --port 8080 \
  --reload \
  --reload-dir "$ML_DIR" \
  --log-level debug
