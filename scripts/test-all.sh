#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
npx tsc --noEmit
npm run build
"$ROOT/.venv-ml/bin/pytest" -q tests
