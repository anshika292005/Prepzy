#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
COMPOSE="$ROOT/docker/docker-compose.yml"

info() { printf '\033[0;36m[INFO]\033[0m %s\n' "$*"; }
ok() { printf '\033[0;32m[OK]\033[0m %s\n' "$*"; }
fail() { printf '\033[0;31m[ERROR]\033[0m %s\n' "$*" >&2; exit 1; }

command -v docker >/dev/null || fail "Docker is required."
docker compose version >/dev/null || fail "Docker Compose v2 is required."
docker info >/dev/null || fail "Start the Docker daemon first."
command -v node >/dev/null || fail "Node.js is required."
command -v python3 >/dev/null || fail "Python 3 is required."

cd "$ROOT"

if [ ! -f .env ]; then
  cp .env.example .env
  info "Created .env from .env.example. Add real secrets before production use."
fi

info "Installing web dependencies"
npm install

info "Checking TypeScript"
npx tsc --noEmit

info "Checking Python syntax"
python3 -m compileall -q backend ml_service

info "Building API and web images"
docker compose -f "$COMPOSE" build

info "Starting Prepzy services"
docker compose -f "$COMPOSE" up -d

info "Waiting for health checks"
for attempt in $(seq 1 40); do
  api_status="$(docker inspect --format '{{.State.Health.Status}}' prepzy-api-1 2>/dev/null || true)"
  web_status="$(docker inspect --format '{{.State.Health.Status}}' prepzy-web-1 2>/dev/null || true)"
  if [ "$api_status" = healthy ] && [ "$web_status" = healthy ]; then
    ok "Web and API are healthy"
    break
  fi
  if [ "$attempt" -eq 40 ]; then
    docker compose -f "$COMPOSE" ps
    fail "Services did not become healthy in time."
  fi
  sleep 3
done

"$ROOT/scripts/test.sh" http://127.0.0.1:8080
ok "Prepzy is available at http://localhost"
