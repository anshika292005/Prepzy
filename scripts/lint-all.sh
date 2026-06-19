#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"
npx tsc --noEmit
python3 -m compileall -q backend ml_service tests
if command -v ruff >/dev/null; then ruff check backend ml_service tests; fi
if command -v shellcheck >/dev/null; then shellcheck scripts/*.sh; fi
