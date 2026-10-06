#!/usr/bin/env bash
# La API local del recorrido, en primer plano (se lanza como tarea de fondo de la sesión). Uso: api-en-primer-plano.sh [BE_DEMO_PROFESIONALES]
set -euo pipefail
# Requiere Node 22 en el PATH (el repo lo exige con engine-strict).
AQUI="${BE_TRABAJO:-$(cd "$(dirname "$0")" && pwd)/trabajo}"
mkdir -p "$AQUI"
test -f "$AQUI/.secreto" || node -e "process.stdout.write(require('crypto').randomBytes(36).toString('base64url'))" >"$AQUI/.secreto"
cd "$(dirname "$0")/../../../.."
export APP_ENV=development PORT=3001 DATABASE_URL="${BE_E2E_DATABASE_URL:-postgresql://be_test:be_test@localhost:55442/be_test_nutricion_web}" BCRYPT_COST=10 TRUST_PROXY_HOPS=0
export CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002" BE_DEMO_PROFESIONALES="${1:-}"
JWT_SECRET="$(cat "$AQUI/.secreto")" exec node apps/api/dist/main.js
