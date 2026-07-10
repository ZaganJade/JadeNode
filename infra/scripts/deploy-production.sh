#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/mnt/disk2/projects/JadeNode}"
COMPOSE_FILE="$APP_DIR/infra/docker/docker-compose.prod.yml"
ENV_FILE="$APP_DIR/infra/docker/.env.production"
MAX_LOAD_1M="${MAX_LOAD_1M:-4.0}"
MIN_MEM_AVAILABLE_MB="${MIN_MEM_AVAILABLE_MB:-256}"

cd "$APP_DIR"

for i in $(seq 1 30); do
  load_1m="$(awk '{print $1}' /proc/loadavg)"
  mem_available_mb="$(free -m | awk '/Mem:/ {print $7}')"

  load_ok=true
  mem_ok=true
  if awk -v current_load="$load_1m" -v max="$MAX_LOAD_1M" 'BEGIN { exit !(current_load > max) }'; then
    load_ok=false
  fi
  if [ "$mem_available_mb" -lt "$MIN_MEM_AVAILABLE_MB" ]; then
    mem_ok=false
  fi

  if [ "$load_ok" = true ] && [ "$mem_ok" = true ]; then
    echo "Resource guard OK: load_1m=$load_1m mem_available_mb=$mem_available_mb"
    break
  fi

  if [ "$i" -eq 30 ]; then
    echo "Refusing deploy after wait: load_1m=$load_1m max=$MAX_LOAD_1M mem_available_mb=$mem_available_mb min=$MIN_MEM_AVAILABLE_MB"
    exit 75
  fi

  echo "Resource busy, waiting before deploy ($i/30): load_1m=$load_1m max=$MAX_LOAD_1M mem_available_mb=$mem_available_mb min=$MIN_MEM_AVAILABLE_MB"
  sleep 20
done

if [ ! -f "$ENV_FILE" ]; then
  echo "Missing $ENV_FILE. Create it on server first."
  exit 2
fi

git fetch --prune origin
git reset --hard origin/main

docker compose -f "$COMPOSE_FILE" build backend
docker compose -f "$COMPOSE_FILE" build frontend
docker compose -f "$COMPOSE_FILE" up -d --remove-orphans

docker compose -f "$COMPOSE_FILE" ps
curl -fsS http://127.0.0.1:8091/api/v1/health >/dev/null
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3100/ >/dev/null; then
    break
  fi
  if [ "$i" -eq 30 ]; then
    echo "Frontend did not become ready on 127.0.0.1:3100"
    exit 1
  fi
  sleep 2
done
sudo nginx -t >/dev/null
curl -fsS https://jadenode.vibedev.web.id/api/v1/health >/dev/null

echo "Deploy OK: https://jadenode.vibedev.web.id"
