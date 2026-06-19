#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
#  Prepzy — ML Service Setup Script
#
#  Run from the root of your Prepzy-main directory:
#    chmod +x scripts/setup.sh
#    ./scripts/setup.sh
#
#  What it does:
#    1. Validates required tools (Docker, Node, Python)
#    2. Validates the integrated ML and Node source files
#    3. Ensures src/app.ts registers the analytics route
#    4. Creates .env additions (ML_SERVICE_URL)
#    5. Builds and starts all Docker services
#    6. Runs health checks to confirm everything is live
# ═══════════════════════════════════════════════════════════════

set -euo pipefail   # exit on error, unset vars, pipe failures

# ── Colours ──────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
CYAN='\033[0;36m'; BOLD='\033[1m'; RESET='\033[0m'

info()    { echo -e "${CYAN}[INFO]${RESET}  $*"; }
success() { echo -e "${GREEN}[OK]${RESET}    $*"; }
warn()    { echo -e "${YELLOW}[WARN]${RESET}  $*"; }
error()   { echo -e "${RED}[ERROR]${RESET} $*" >&2; exit 1; }

# ── Determine project root ────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

info "Project root: $PROJECT_ROOT"
cd "$PROJECT_ROOT"

echo ""
echo -e "${BOLD}╔═══════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}║       Prepzy ML Service — Setup           ║${RESET}"
echo -e "${BOLD}╚═══════════════════════════════════════════╝${RESET}"
echo ""

# ══════════════════════════════════════════════════════════════
# STEP 1 — Validate required tools
# ══════════════════════════════════════════════════════════════
info "Step 1/6 — Checking required tools..."

check_tool() {
  local tool=$1
  local install_hint=$2
  if ! command -v "$tool" &>/dev/null; then
    error "$tool is not installed. $install_hint"
  fi
  success "$tool found: $(command -v "$tool")"
}

check_tool docker   "Install from https://docs.docker.com/get-docker/"
if ! docker compose version &>/dev/null; then
  error "Docker Compose v2 is required. Install it with Docker Desktop or the Docker Compose plugin."
fi
check_tool node     "Install from https://nodejs.org"
check_tool python3  "Install Python 3.11+ from https://python.org"

# Check Docker daemon is running
if ! docker info &>/dev/null; then
  error "Docker daemon is not running. Start Docker Desktop or 'sudo systemctl start docker'."
fi
success "Docker daemon is running"

# ══════════════════════════════════════════════════════════════
# STEP 2 — Validate integrated source
# ══════════════════════════════════════════════════════════════
info "Step 2/6 — Validating integrated source files..."

required_files=(
  "ml_service/main.py"
  "ml_service/requirements.txt"
  "docker/Dockerfile.ml"
  "docker/docker-compose.yml"
  "Dockerfile"
  "src/lib/mlClient.ts"
  "src/controllers/analytics.controller.ts"
  "src/routes/analytics.routes.ts"
)

for required_file in "${required_files[@]}"; do
  if [ ! -f "$PROJECT_ROOT/$required_file" ]; then
    error "Missing required file: $required_file"
  fi
done
success "ML, Docker, and Node integration files are present"

# ══════════════════════════════════════════════════════════════
# STEP 3 — Add ML_SERVICE_URL to .env
# ══════════════════════════════════════════════════════════════
info "Step 3/6 — Updating .env..."

ENV_FILE="$PROJECT_ROOT/.env"
ML_ENV_LINE="ML_SERVICE_URL=http://ml_service:8080"

if [ ! -f "$ENV_FILE" ]; then
  warn ".env not found — creating from .env.example"
  if [ -f "$PROJECT_ROOT/.env.example" ]; then
    cp "$PROJECT_ROOT/.env.example" "$ENV_FILE"
  else
    touch "$ENV_FILE"
  fi
fi

if grep -q "ML_SERVICE_URL" "$ENV_FILE"; then
  warn "ML_SERVICE_URL already in .env — skipping"
else
  echo "" >> "$ENV_FILE"
  echo "# Python ML Microservice (internal Docker network)" >> "$ENV_FILE"
  echo "$ML_ENV_LINE" >> "$ENV_FILE"
  success "Added ML_SERVICE_URL to .env"
fi

# ══════════════════════════════════════════════════════════════
# STEP 4 — Patch src/app.ts to register analytics route
# ══════════════════════════════════════════════════════════════
info "Step 4/6 — Patching src/app.ts..."

APP_TS="$PROJECT_ROOT/src/app.ts"

if [ ! -f "$APP_TS" ]; then
  error "src/app.ts not found. Are you in the Prepzy-main directory?"
fi

# Check if already patched
if grep -q "analytics.routes" "$APP_TS"; then
  warn "src/app.ts already has analytics route — skipping patch"
else
  # Add import after the last existing route import (before the first app.use)
  # Uses Python for reliable multi-line sed (cross-platform)
  python3 - "$APP_TS" <<'PYEOF'
import sys, re

path = sys.argv[1]
with open(path, 'r') as f:
    content = f.read()

# Add import line after last import statement
import_line = "import analyticsRoutes from './routes/analytics.routes';"
# Find position after last import
last_import = list(re.finditer(r"^import .+;$", content, re.MULTILINE))
if last_import:
    pos = last_import[-1].end()
    content = content[:pos] + "\n" + import_line + content[pos:]

# Add route registration after last app.use('/api/...') line
route_line = "\napp.use('/api/analytics', analyticsRoutes);   // ML-backed analytics"
last_route = list(re.finditer(r"app\.use\('/api/[^']+',\s*\w+\);", content))
if last_route:
    pos = last_route[-1].end()
    content = content[:pos] + route_line + content[pos:]

with open(path, 'w') as f:
    f.write(content)

print("  src/app.ts patched successfully")
PYEOF
  success "src/app.ts patched with analytics route"
fi

# ══════════════════════════════════════════════════════════════
# STEP 5 — Validate Node-side analytics files
# ══════════════════════════════════════════════════════════════
info "Step 5/6 — Validating Node analytics integration..."
npm run server:build
success "Node analytics integration compiles"

# ══════════════════════════════════════════════════════════════
# STEP 6 — Build Docker images and start services
# ══════════════════════════════════════════════════════════════
info "Step 6/6 — Building Docker images and starting services..."

COMPOSE_FILE="$PROJECT_ROOT/docker/docker-compose.yml"

docker compose -f "$COMPOSE_FILE" build --no-cache ml_service
success "ML service Docker image built"

docker compose -f "$COMPOSE_FILE" up -d
success "All services started"

# ── Wait for services to be healthy ──────────────────────────
info "Waiting for services to become healthy..."
MAX_WAIT=60
ELAPSED=0
SLEEP=3

while [ $ELAPSED -lt $MAX_WAIT ]; do
  ML_STATUS=$(docker inspect --format='{{.State.Health.Status}}' prepzy_ml 2>/dev/null || echo "starting")
  NODE_STATUS=$(docker inspect --format='{{.State.Health.Status}}' prepzy_node 2>/dev/null || echo "starting")

  if [ "$ML_STATUS" = "healthy" ]; then
    success "ML service is healthy ✓"
    break
  fi

  echo -ne "\r  Waiting... ${ELAPSED}s  (ml: $ML_STATUS)"
  sleep $SLEEP
  ELAPSED=$((ELAPSED + SLEEP))
done

echo ""

# ── Final health check ────────────────────────────────────────
ML_HEALTH=$(curl -sf http://localhost:8080/health 2>/dev/null || echo "unreachable")
if echo "$ML_HEALTH" | grep -q "ok"; then
  success "ML service health check passed: $ML_HEALTH"
else
  warn "ML service health check: $ML_HEALTH (may still be starting)"
fi

echo ""
echo -e "${BOLD}${GREEN}════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${GREEN}  Prepzy ML Service is ready!               ${RESET}"
echo -e "${BOLD}${GREEN}════════════════════════════════════════════${RESET}"
echo ""
echo -e "  Node backend:   ${CYAN}http://localhost:5000${RESET}"
echo -e "  ML service:     ${CYAN}http://localhost:8080/docs${RESET}  (Swagger UI)"
echo -e "  ML health:      ${CYAN}http://localhost:8080/health${RESET}"
echo ""
echo -e "  Logs:  ${YELLOW}docker compose -f docker/docker-compose.yml logs -f ml_service${RESET}"
echo -e "  Stop:  ${YELLOW}docker compose -f docker/docker-compose.yml down${RESET}"
echo ""
