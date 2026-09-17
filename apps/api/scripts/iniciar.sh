#!/bin/sh
# Fase de migración + arranque de la API (07 §36, DEUDA_LEGAJO DL-006).
# Si `prisma migrate deploy` falla, el proceso termina con error: la instancia nueva nunca pasa
# /health/ready y la plataforma conserva la versión anterior. Nunca `migrate dev`, `db push` ni `reset` (07 §38).
set -eu

echo '{"nivel":"info","evento":"migraciones_inicio"}'
./node_modules/.bin/prisma migrate deploy --schema prisma/schema.prisma
echo '{"nivel":"info","evento":"migraciones_fin"}'

exec node apps/api/dist/main.js
