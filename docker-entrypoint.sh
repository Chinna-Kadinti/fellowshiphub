#!/bin/sh
set -e

npx prisma migrate deploy

if [ "${SEED_DATABASE:-false}" = "true" ]; then
  npx prisma db seed
fi

exec node server.js
