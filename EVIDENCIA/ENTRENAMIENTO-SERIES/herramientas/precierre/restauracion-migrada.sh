#!/usr/bin/env bash
# Caso 4 de la prueba de respaldo y restauración (precierre del 2026-10-06, §6): una base restaurada de un respaldo como el
# de be-db-test hoy (sin las migraciones de esta rama) se migra hasta el head con `prisma migrate deploy`, como lo haría el
# despliegue, y la API compilada arranca contra ella y responde `GET /health/ready`. Solo bases locales.
#
# Uso: bash restauracion-migrada.sh <url de la base restaurada, local> <salida.json>
# Requiere la API compilada (apps/api/dist, `entorno.sh compilar`) y Node 22. El secreto de firma es sintético y de un solo
# uso: no firma nada fuera de esta prueba.
set -euo pipefail
BASE="${1:?falta la URL de la base restaurada}"
SALIDA="${2:?falta el archivo de salida}"
case "$BASE" in *localhost*|*127.0.0.1*) ;; *) echo "Guardia: la base tiene que ser local." >&2; exit 2 ;; esac
REPO="$(cd "$(dirname "$0")/../../../.." && pwd)"
PUERTO=3005
cd "$REPO"

antes=$(DATABASE_URL="$BASE" npx prisma migrate status 2>&1 | grep -E "have not yet been applied|Database schema is up to date" | head -1 || true)
inicio=$(date +%s)
DATABASE_URL="$BASE" npx prisma migrate deploy > "$SALIDA.migrar.log" 2>&1
fin_migrar=$(date +%s)
# Una línea por migración aplicada: la de su carpeta (el árbol de Prisma también lista su migration.sql).
aplicadas=$(grep -cE "[└├]─ [0-9]{14}_" "$SALIDA.migrar.log" || true)

SECRETO="$(node -e "process.stdout.write(require('crypto').randomBytes(36).toString('base64url'))")"
APP_ENV=development PORT=$PUERTO DATABASE_URL="$BASE" JWT_SECRET="$SECRETO" BCRYPT_COST=10 TRUST_PROXY_HOPS=0 CORS_ALLOWED_ORIGINS="" \
  node apps/api/dist/main.js > "$SALIDA.api.log" 2>&1 &
PID=$!
trap 'kill $PID 2>/dev/null || true' EXIT
listo=""
for _ in $(seq 1 60); do
  if listo=$(curl -sf "http://localhost:$PUERTO/health/ready" 2>/dev/null); then break; fi
  sleep 1
done
fin=$(date +%s)
ANTES="$antes" APLICADAS="$aplicadas" LISTO="$listo" node -e '
const fs = require("fs");
const [salida, seg, segListo] = process.argv.slice(1);
const listo = process.env.LISTO ? JSON.parse(process.env.LISTO) : null;
const resumen = {
  caso: "4 · una base restaurada de un respaldo como el de test hoy (sin las migraciones de esta rama) se migra hasta el head y la API arranca contra ella",
  estadoAntes: process.env.ANTES || null,
  migracionesAplicadas: Number(process.env.APLICADAS),
  segundos: { migrar: Number(seg), hastaLista: Number(segListo) },
  healthReady: listo,
  resultado: listo ? "LISTA" : "NO RESPONDIÓ",
};
fs.writeFileSync(salida, JSON.stringify(resumen, null, 2) + "\n");
console.log(JSON.stringify(resumen));
process.exit(listo ? 0 : 1);
' "$SALIDA" "$((fin_migrar - inicio))" "$((fin - fin_migrar))"
