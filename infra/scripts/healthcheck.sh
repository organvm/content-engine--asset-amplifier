#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

failed=0

check() {
  local name="$1"
  local cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $name"
  else
    echo -e "  ${RED}✗${NC} $name"
    failed=1
  fi
}

echo "==> Dev environment health check"
echo ""

echo "  Infrastructure:"
check "Postgres (pg_isready)" "docker exec cronus-postgres pg_isready -U cronus -d cronus"
check "Redis (redis-cli ping)"  "docker exec cronus-redis redis-cli ping | grep -q PONG"
check "MinIO (mc ls)"           "docker exec cronus-minio mc alias set local http://localhost:9000 minioadmin minioadmin >/dev/null 2>&1 && docker exec cronus-minio mc ls local/cronus-assets >/dev/null 2>&1"
check "Temporal (grpc health)"  "docker exec cronus-temporal tctl admin cluster health 2>/dev/null | head -1 | grep -q 'pass'"

echo ""
echo "  Node environment:"
check "Node.js ≥ 22"            "node --version | grep -q '^v2[2-9]'"
check "pnpm ≥ 9"                "pnpm --version | grep -q '^[9-9]'"
check ".env file exists"        "test -f '${PROJECT_ROOT}/.env'"

echo ""
echo "  Dependencies:"
check "node_modules installed"  "test -d '${PROJECT_ROOT}/node_modules'"

if [ $failed -eq 0 ]; then
  echo -e "\n${GREEN}All checks passed.${NC}"
else
  echo -e "\n${RED}Some checks failed.${NC}"
  echo "  Run: docker compose -f infra/docker/docker-compose.yml ps"
  exit 1
fi
