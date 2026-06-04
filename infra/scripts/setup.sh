#!/usr/bin/env bash
# setup.sh — First-time project setup
# Usage: bash infra/scripts/setup.sh
#
# Prerequisites: PHP 8.3+, Composer, Node.js LTS, pnpm, Docker

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/../.." && pwd)"

echo "=== JadeNode First-Time Setup ==="
echo "Root: $ROOT_DIR"
echo ""

# 1. Copy root .env
if [ ! -f "$ROOT_DIR/.env" ]; then
    echo "[1/6] Copying root .env.example → .env ..."
    cp "$ROOT_DIR/.env.example" "$ROOT_DIR/.env"
else
    echo "[1/6] Root .env already exists, skipping."
fi

# 2. Copy backend .env
if [ ! -f "$ROOT_DIR/backend/.env" ]; then
    echo "[2/6] Copying backend/.env.example → backend/.env ..."
    cp "$ROOT_DIR/backend/.env.example" "$ROOT_DIR/backend/.env"
else
    echo "[2/6] backend/.env already exists, skipping."
fi

# 3. Install backend dependencies
echo ""
echo "[3/6] Installing backend dependencies (composer install) ..."
(cd "$ROOT_DIR/backend" && composer install)

# 4. Install frontend dependencies
echo ""
echo "[4/6] Installing frontend dependencies (pnpm install) ..."
(cd "$ROOT_DIR/apps/web" && pnpm install)

# 5. Generate Laravel application key
echo ""
echo "[5/6] Generating Laravel application key ..."
(cd "$ROOT_DIR/backend" && php artisan key:generate)

# 6. Start Docker and run migrations
echo ""
echo "[6/6] Starting Docker infrastructure ..."
docker compose -f "$ROOT_DIR/infra/docker/docker-compose.local.yml" up -d

echo ""
echo "Waiting for PostgreSQL to be ready ..."
MAX_RETRIES=30
RETRY=0
until docker exec jadenode-postgres pg_isready -U jadenode -d jadenode > /dev/null 2>&1; do
    RETRY=$((RETRY + 1))
    if [ $RETRY -ge $MAX_RETRIES ]; then
        echo "ERROR: PostgreSQL did not become ready in time."
        exit 1
    fi
    sleep 1
done
echo "PostgreSQL is ready."

echo ""
echo "Running database migrations ..."
(cd "$ROOT_DIR/backend" && php artisan migrate)

echo ""
echo "=== Setup Complete ==="
echo ""
echo "To start developing:"
echo "  bash infra/scripts/dev.sh"
echo ""
echo "Or start servers manually:"
echo "  cd backend && php artisan serve"
echo "  cd apps/web && pnpm dev"
