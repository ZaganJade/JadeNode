#!/usr/bin/env sh
set -eu

mkdir -p \
  storage/app/public \
  storage/framework/cache/data \
  storage/framework/sessions \
  storage/framework/views \
  storage/logs \
  bootstrap/cache
chmod -R ug+rwX storage bootstrap/cache || true

if [ "${RUN_MIGRATIONS:-true}" = "true" ]; then
  php artisan migrate --force
fi

php artisan optimize:clear >/dev/null 2>&1 || true
php artisan config:cache
php artisan route:cache || true
if [ -d resources/views ]; then
  php artisan view:cache || true
fi

exec "$@"
