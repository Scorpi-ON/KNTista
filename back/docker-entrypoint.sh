#!/usr/bin/env sh
set -e

if [ -n "$DATABASE_URL" ]; then
    if [ -d "./prisma/migrations" ] && [ "$(ls -A ./prisma/migrations)" ]; then
        bun run --bun prisma migrate deploy
    else
        bun run --bun prisma db push
    fi

    if [ "${RUN_SEED:-true}" = "true" ]; then
        bun run --bun ./dist/seed/seed.js
    fi
fi

exec "$@"
