#!/usr/bin/env bash
# Regenera los datos sintéticos de WP-DASHBOARD-PROFESIONAL desde cero, en la base LOCAL be_test_dashboard, y los verifica.
# Requiere: Node 22 en el PATH, PostgreSQL 16 local en :55442 (usuario be_test) y la API compilada (entorno.sh compilar-api).
# Borra y vuelve a crear SOLO la base local de estas herramientas. Deja la API corriendo en :3001 con los profesionales
# sintéticos verificados. Las credenciales quedan en trabajo/ (ignorado por git) y no se imprimen.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")/.." && pwd)"
cd "$AQUI"
# La carpeta de trabajo es la de BE_TRABAJO (la misma que usan entorno.sh, generar.mjs y recorrido.mjs); sin ella, trabajo/.
TRABAJO="${BE_TRABAJO:-$AQUI/trabajo}"
mkdir -p "$TRABAJO"
./entorno.sh parar-api >/dev/null 2>&1 || true
node datos/base-nueva.mjs
rm -f "$TRABAJO/estado.json"
./entorno.sh migrar
./entorno.sh api >/dev/null
node datos/generar.mjs cuentas > "$TRABAJO/demo-profesionales.txt"
./entorno.sh parar-api >/dev/null
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' "$TRABAJO/demo-profesionales.txt")"
node datos/generar.mjs base
node datos/generar.mjs historia
node datos/generar.mjs recientes
node datos/generar.mjs verificar
# El asesorado C (volumen, PRO-24): un año de comidas, sesiones y tomas, para medir.
node datos/generar.mjs volumen
# Las fases inician sesión varias veces y el límite de inicios (5 cada 15 minutos) vive en memoria: se reinicia la API
# para que el recorrido pueda iniciar sesión enseguida.
./entorno.sh parar-api >/dev/null
./entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' "$TRABAJO/demo-profesionales.txt")"
