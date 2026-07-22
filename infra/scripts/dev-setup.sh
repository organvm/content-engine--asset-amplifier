#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

echo "==> Checking prerequisites..."

command -v docker >/dev/null 2>&1 || { echo "ERROR: docker is not installed"; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "ERROR: pnpm is not installed"; exit 1; }
command -v node >/dev/null 2>&1 || { echo "ERROR: node is not installed"; exit 1; }

echo "    docker: $(docker --version | head -1)"
echo "    pnpm:   $(pnpm --version)"
echo "    node:   $(node --version)"

if [ ! -f "${PROJECT_ROOT}/.env" ]; then
  echo "==> Copying .env.example to .env"
  cp "${PROJECT_ROOT}/.env.example" "${PROJECT_ROOT}/.env"
else
  echo "==> .env already exists, skipping copy"
fi

echo "==> Starting docker compose services..."
docker compose -f "${PROJECT_ROOT}/infra/docker/docker-compose.yml" up -d

echo "==> Waiting for postgres to be healthy..."
until docker exec cronus-postgres pg_isready -U cronus -d cronus >/dev/null 2>&1; do
  echo "    waiting..."
  sleep 2
done
echo "    postgres is ready"

echo "==> Creating pgvector extension..."
docker exec -i cronus-postgres psql -U cronus -d cronus -c "CREATE EXTENSION IF NOT EXISTS vector;"

echo "==> Setting up MinIO bucket..."
docker exec cronus-minio mc alias set local http://localhost:9000 minioadmin minioadmin
docker exec cronus-minio mc mb local/cronus-assets --ignore-existing

echo "==> Installing dependencies..."
cd "${PROJECT_ROOT}"
pnpm install

echo "==> Running database migrations..."
pnpm db:migrate

echo "==> Running health check..."
bash "${SCRIPT_DIR}/healthcheck.sh"

echo ""
echo "Dev environment ready"
