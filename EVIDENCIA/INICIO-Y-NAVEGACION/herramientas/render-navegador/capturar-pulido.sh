#!/usr/bin/env bash
# Las capturas del pulido del mapa (2026-10-04): cuatro individuales, de una pantalla cada una y al doble de píxeles para
# verlas en el teléfono sin ampliar, y las comparaciones antes y después, con el mismo simulador y los mismos datos.
# Antes, las tres maquetas (variables en construir.mjs; rutas absolutas):
#   node construir.mjs                                         la candidata, salida/maqueta.js (telefono.html)
#   git worktree add --detach <árbol> 6acc4c0                  una sola vez, desde la raíz del repo
#   BE_REPO=<árbol> BE_DEPENDENCIAS=<raíz del repo> SALIDA=maqueta-antes.js node construir.mjs
#                                                              el «antes» (telefono-antes.html)
#   ENCUADRE=1.55,0.09 SALIDA=maqueta-c.js node construir.mjs  la variante C del encuadre (telefono-c.html)
# Uso: capturar-pulido.sh [carpeta de destino] [prefijo, para rehacer solo algunas]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../capturas}"
SOLO="${2:-}"
B="file:///$AQUI/salida/comparacion.html?"
unset EXPRESION
codificar() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }
captura() {
  local nombre="$1" ancho="$2" alto="$3" escala="$4" titulo="$5" nota="$6" m="$7"
  if [ -n "$SOLO" ] && [[ "$nombre" != $SOLO* ]]; then return; fi
  ESCALA_DE_PANTALLA="$escala" node "$AQUI/cdp.mjs" "$DESTINO/$nombre.png" "$ancho" "$alto" "${B}titulo=$(codificar "$titulo")&nota=$(codificar "$nota")&m=$m" 12000
}

# Las cuatro individuales: una pantalla cada una, al doble de píxeles.
captura 12-perimetros-letra-normal 420 1720 2 "Perímetros, letra normal" "Azul noche · 360 dp. El cuerpo grande, arriba y recortado a la derecha." \
  "evolucion-mapa|azul-noche|360|1|1560"
captura 13-pliegues-letra-normal 420 1960 2 "Pliegues, letra normal" "Claro · 360 dp. El tríceps elegido: su fila, su guía y su sitio resaltados, y el detalle abajo." \
  "evolucion-mapa|claro|360|1|1800|medida=pliegue-triceps"
captura 14-indicadores-letra-normal 420 1720 2 "Indicadores, letra normal" "Azul noche · 360 dp. Tarjetas de vidrio en dos columnas: nombre, valor, diferencia y puntos por toma." \
  "evolucion-indicadores|azul-noche|360|1|1560"
captura 15-letra-grande 420 2120 2 "Adaptación con letra grande" "Claro · 360 dp · letra ×1,3. Pestañas en dos filas, la figura con números y los valores en la lista, con sus puntos." \
  "evolucion-mapa|claro|360|1.3|1960"

# Antes y después, con el mismo simulador y los mismos datos.
captura 16-antes-despues-perimetros 860 1720 1 "Perímetros: antes y después" "Azul noche · 360 dp · letra normal. Antes (6acc4c0): cuerpo chico y centrado en la lámina, con un hueco arriba; cabecera de cinco bloques. Después: cuerpo grande, arriba y recortado a la derecha; cabecera compacta." \
  "evolucion-mapa|azul-noche|360|1|1560||telefono-antes|Antes;evolucion-mapa|azul-noche|360|1|1560||telefono|Después"
captura 17-antes-despues-pliegues 940 1960 1 "Pliegues con una medida elegida: antes y después" "Claro · 390 dp · letra normal. Subescapular elegido: fila, guía y sitio resaltados en los dos; el detalle debajo de la figura." \
  "evolucion-mapa|claro|390|1|1800|medida=pliegue-subescapular|telefono-antes|Antes;evolucion-mapa|claro|390|1|1800|medida=pliegue-subescapular|telefono|Después"
captura 18-encuadres 1260 1720 1 "El encuadre: actual y dos propuestas" "Perímetros · 360 dp. A: el actual. B, elegida: imagen de 1,44 veces el ancho de la lámina y 13 % visible a la derecha del eje del cuerpo. C: 1,55 veces y 9 %, que corta los anillos del tronco casi por el centro." \
  "evolucion-mapa|azul-noche|360|1|1560||telefono-antes|A · actual;evolucion-mapa|azul-noche|360|1|1560||telefono|B · elegida;evolucion-mapa|azul-noche|360|1|1560||telefono-c|C · más recortada"
