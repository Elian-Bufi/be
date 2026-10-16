#!/usr/bin/env bash
# Entorno local de WP-DASHBOARD-PROFESIONAL: PostgreSQL 16 local (puerto 55442, base be_test_dashboard), la API compilada
# en :3001 y el export estático del website en :3000 con la CSP de render.yaml.
# Uso: entorno.sh compilar-api | compilar-web | migrar | api [BE_DEMO_PROFESIONALES] | parar-api | web | parar-web
# Las credenciales son sintéticas; el secreto de firma se genera por corrida y no se imprime.
# Un proceso pesado por vez: compilar el website con la API apagada (la máquina tiene poca memoria).
set -euo pipefail
# Requiere Node 22 en el PATH (el repo lo exige con engine-strict).
REPO="$(cd "$(dirname "$0")/../../.." && pwd)"
AQUI="${BE_TRABAJO:-$(cd "$(dirname "$0")" && pwd)/trabajo}"
mkdir -p "$AQUI"
# La base de estas herramientas: un PostgreSQL 16 local y una base propia (nunca la de otro trabajo ni la de test).
# La base por omisión es la de este paquete (be_test_dashboard). Con otra carpeta de trabajo, la base se declara: si no,
# la API de otro paquete se conectaba a esta (pasó el 2026-10-09 con WP-DASHBOARD-COMPRENSION: dos inicios de sesión
# rechazados quedaron auditados acá).
if [ -n "${BE_TRABAJO:-}" ] && [ "$(basename "$BE_TRABAJO")" != "trabajo" ] && [ -z "${BE_E2E_DATABASE_URL:-}" ]; then
  echo "entorno.sh: con BE_TRABAJO=$BE_TRABAJO hay que declarar BE_E2E_DATABASE_URL (la base por omisión es be_test_dashboard)." >&2
  exit 1
fi
BASE="${BE_E2E_DATABASE_URL:-postgresql://be_test:be_test@localhost:55442/be_test_dashboard}"
SECRETO="$AQUI/.secreto"

case "${1:-}" in
  compilar-api)
    cd "$REPO"
    npm run build:domain >/dev/null
    (cd apps/api && npx prisma generate --schema ../../prisma/schema.prisma >/dev/null)
    npm run build -w @be/api >/dev/null
    echo "compilado: dominio y API (apps/api/dist)"
    ;;
  compilar-web)
    cd "$REPO"
    npm run build:domain >/dev/null
    rm -rf apps/web/.next apps/web/out
    BE_API_BASE_URL=http://localhost:3001 npm run build -w @be/web >"$AQUI/build-web.log" 2>&1
    echo "compilado: web estática (apps/web/out)"
    ;;
  migrar)
    cd "$REPO/apps/api"
    DATABASE_URL="$BASE" npx prisma migrate deploy --schema ../../prisma/schema.prisma >"$AQUI/migrar.log" 2>&1
    tail -2 "$AQUI/migrar.log"
    ;;
  api)
    test -f "$SECRETO" || node -e "process.stdout.write(require('crypto').randomBytes(36).toString('base64url'))" >"$SECRETO"
    cd "$REPO"
    APP_ENV=development PORT=3001 DATABASE_URL="$BASE" JWT_SECRET="$(cat "$SECRETO")" BCRYPT_COST=10 TRUST_PROXY_HOPS=0 \
      CORS_ALLOWED_ORIGINS="http://localhost:3000,http://localhost:3002" BE_DEMO_PROFESIONALES="${2:-}" \
      nohup node apps/api/dist/main.js >>"$AQUI/api.log" 2>&1 &
    echo $! >"$AQUI/api.pid"
    for _ in $(seq 1 60); do
      if curl -sf http://localhost:3001/health/ready >/dev/null 2>&1; then echo "API lista en :3001 (pid $(cat "$AQUI/api.pid"))"; exit 0; fi
      sleep 1
    done
    echo "la API no respondió; ver api.log" >&2
    exit 1
    ;;
  parar-api)
    if [ -f "$AQUI/api.pid" ]; then kill "$(cat "$AQUI/api.pid")" 2>/dev/null || true; rm -f "$AQUI/api.pid"; fi
    for _ in $(seq 1 20); do curl -sf http://localhost:3001/health/live >/dev/null 2>&1 || { echo "API detenida"; exit 0; }; sleep 1; done
    echo "la API sigue respondiendo" >&2
    exit 1
    ;;
  web)
    nohup node "$(dirname "$0")/servir-web.mjs" "$REPO/apps/web/out" 3000 http://localhost:3001 >"$AQUI/web.log" 2>&1 &
    echo $! >"$AQUI/web.pid"
    sleep 1
    curl -sf http://localhost:3000/login >/dev/null && echo "web estática en :3000"
    ;;
  parar-web)
    if [ -f "$AQUI/web.pid" ]; then kill "$(cat "$AQUI/web.pid")" 2>/dev/null || true; rm -f "$AQUI/web.pid"; fi
    echo "web detenida"
    ;;
  *)
    echo "uso: entorno.sh compilar-api | compilar-web | migrar | api [BE_DEMO_PROFESIONALES] | parar-api | web | parar-web" >&2
    exit 2
    ;;
esac
