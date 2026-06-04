#!/usr/bin/env bash
# dev.sh — Start Docker, backend, and frontend dev servers
# Usage: bash infra/scripts/dev.sh

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/docker/docker-compose.local.yml"

echo "=== JadeNode Dev Starter ==="

# 1. Start Docker infrastructure
echo ""
echo "[1/3] Starting Docker infrastructure..."
docker compose -f "$COMPOSE_FILE" up -d

# 2. Start backend (background)
echo ""
echo "[2/3] Starting Laravel backend on http://127.0.0.1:8000 ..."
(cd "$ROOT_DIR/backend" && php artisan serve) &
BACKEND_PID=$!

# 3. Start frontend (background)
echo ""
echo "[3/3] Starting Next.js frontend on http://localhost:3000 ..."
(cd "$ROOT_DIR/apps/web" && pnpm dev) &
FRONTEND_PID=$!

echo ""
echo "=== All services starting ==="
echo "  Frontend : http://localhost:3000"
echo "  Backend  : http://localhost:8000"
echo "  Mailpit  : http://localhost:8025"
echo "  MinIO    : http://localhost:9001"
echo ""
echo "Press Ctrl+C to stop backend and frontend."
echo "Run 'docker compose -f $COMPOSE_FILE down' to stop Docker services."

# Trap exit to clean up background processes
cleanup() {
    echo ""
    echo "Stopping dev servers..."
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    wait 2>/dev/null || true
    echo "Dev servers stopped."
}
trap cleanup EXIT INT TERM

# Wait for either process to exit
wait
