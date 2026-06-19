#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PYTHON="$ROOT/.venv-ml/bin/python"
[ -x "$PYTHON" ] || { echo "Run scripts/dev.sh once to create the Python environment."; exit 1; }
cd "$ROOT"
"$PYTHON" -m backend.tools.migrate_legacy
