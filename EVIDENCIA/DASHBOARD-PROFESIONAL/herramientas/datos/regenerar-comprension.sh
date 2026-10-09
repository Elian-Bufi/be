#!/usr/bin/env bash
# Regenera los datos de WP-DASHBOARD-COMPRENSION desde cero: los de WP-DASHBOARD-PROFESIONAL (regenerar.sh) y, encima,
# los escenarios D y E (datos/comprension.mjs), con su verificación. Exige la carpeta y la base de este paquete: nunca
# regenera las del paquete anterior por omisión. Deja la API corriendo en :3001 con el límite de inicios de sesión
# reiniciado (vive en memoria), para que los recorridos puedan entrar enseguida.
#
# Uso: BE_TRABAJO=<herramientas>/trabajo-comprension BE_E2E_DATABASE_URL=postgresql://…:55442/be_test_comprension \
#        datos/regenerar-comprension.sh
set -euo pipefail
AQUI="$(cd "$(dirname "$0")/.." && pwd)"
cd "$AQUI"
: "${BE_TRABAJO:?definí BE_TRABAJO: la carpeta de trabajo de este paquete}"
: "${BE_E2E_DATABASE_URL:?definí BE_E2E_DATABASE_URL: la base de este paquete}"
case "$BE_E2E_DATABASE_URL" in
  *be_test_dashboard*) echo "esa es la base del paquete anterior: no se regenera desde acá" >&2; exit 2 ;;
esac
./datos/regenerar.sh
node datos/generar.mjs comprension
node datos/generar.mjs comprension-e
node datos/generar.mjs verificar-comprension
./entorno.sh parar-api >/dev/null
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' "$BE_TRABAJO/demo-profesionales.txt")"
