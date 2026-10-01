#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

git pull --ff-only origin master
docker compose --env-file docker.env build app
docker compose --env-file docker.env up -d db
docker compose --env-file docker.env run --rm --user root app sh -c 'until npx prisma db push; do sleep 2; done && npm run db:seed'
docker compose --env-file docker.env up -d app
docker compose --env-file docker.env ps db app