#!/bin/sh
set -e

npx prisma migrate deploy
npx prisma db seed
node .next/standalone/server.js
