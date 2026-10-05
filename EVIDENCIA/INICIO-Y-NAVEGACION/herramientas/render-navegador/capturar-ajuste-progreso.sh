#!/usr/bin/env bash
# Las capturas del ajuste de Progreso y la cabecera (DL-118, Dirección 2026-10-05), con la altura de un teléfono común:
# 360 × 800 dp. Individuales al doble de píxeles, y comparaciones con el cierre que revisó Dirección (7bcf5dc).
# Antes, dos maquetas (variables en construir.mjs; rutas absolutas):
#   node construir.mjs                                         lo nuevo, salida/maqueta.js (telefono.html)
#   git worktree add --detach <árbol> 7bcf5dc                  una sola vez, desde la raíz del repo
#   BE_REPO=<árbol> BE_DEPENDENCIAS=<raíz del repo> SALIDA=maqueta-cierre.js node construir.mjs
#                                                              el cierre revisado (telefono-cierre.html)
# Uso: capturar-ajuste-progreso.sh [carpeta de destino] [prefijo, para rehacer solo algunas]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../../MI-EVOLUCION-TRES-VISTAS/capturas-ajuste}"
SOLO="${2:-}"
B="file:///$AQUI/salida/comparacion.html?"
unset EXPRESION
codificar() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }
captura() {
  local nombre="$1" ancho="$2" alto="$3" escala="$4" titulo="$5" nota="$6" m="$7"
  if [ -n "$SOLO" ] && [[ "$nombre" != $SOLO* ]]; then return; fi
  ESCALA_DE_PANTALLA="$escala" node "$AQUI/cdp.mjs" "$DESTINO/$nombre.png" "$ancho" "$alto" "${B}titulo=$(codificar "$titulo")&nota=$(codificar "$nota")&m=$m" 12000
}
mkdir -p "$DESTINO"

# ─── Progreso, como se abre y con la figura junto a las tarjetas ───
captura 20-progreso-al-abrir 420 980 2 "Progreso, al abrir" "Azul noche · 360 × 800 dp · letra normal. La pantalla tal como se abre: la cabecera sin «se compara con» y la figura compacta." \
  "evolucion-progreso|azul-noche|360|1|800"
captura 21-progreso-figura-y-tarjetas 420 980 2 "Progreso, la figura junto a las tarjetas" "Azul noche · 360 × 800 dp · letra normal. Bajando hasta la figura: se ven la figura y las primeras tarjetas en la misma pantalla." \
  "evolucion-progreso|azul-noche|360|1|800|bajar=300"
captura 22-progreso-letra-maxima-al-abrir 420 980 2 "Progreso con letra ×2, al abrir" "Azul noche · 360 × 800 dp. Todo apilado: las pestañas, los controles y la parte del torso bajan de fila; nada se achica." \
  "evolucion-progreso|azul-noche|360|2|800"
captura 23-progreso-letra-maxima-figura 420 980 2 "Progreso con letra ×2, la figura y la primera tarjeta" "Azul noche · 360 × 800 dp. Los números crecen hasta su tope y la figura les deja lugar; el cambio va debajo del valor." \
  "evolucion-progreso|azul-noche|360|2|800|bajar=500"
captura 24-progreso-letra-maxima-tarjetas 420 980 2 "Progreso con letra ×2, las tarjetas" "Azul noche · 360 × 800 dp. Cada tarjeta, apilada: nombre, valor, cambio con su fecha, el gráfico y los valores en fila." \
  "evolucion-progreso|azul-noche|360|2|800|bajar=1100"
captura 25-progreso-pliegues-claro 420 980 2 "Progreso · Pliegues, en Claro" "Claro · 360 × 800 dp · letra normal. La franja de los pliegues del torso, con los dos paneles." \
  "evolucion-progreso|claro|360|1|800|familia=PLIEGUES%26bajar=300"
captura 26-progreso-piernas 420 980 2 "Progreso · Piernas" "Azul noche · 360 × 800 dp · letra normal. La franja del tren inferior, de la cadera al tobillo." \
  "evolucion-progreso|azul-noche|360|1|800|panel=PIERNAS%26bajar=300"
captura 27-indicadores-tarjetas 420 980 2 "Indicadores, con los gráficos nuevos" "Claro · 360 × 800 dp · letra normal. En tarjetas angostas, el cambio va debajo del valor; la toma bajo cada punto y los valores en fila." \
  "evolucion-indicadores|claro|360|1|800|bajar=200"

# ─── Antes (7bcf5dc, el cierre que revisó Dirección) y después, a la misma altura y con el mismo desplazamiento ───
captura 30-antes-despues-progreso-al-abrir 820 980 1 "Progreso al abrir: antes y después" "Azul noche · 360 × 800 dp · letra normal. La cabecera ya no dice «se compara con»; la figura es una franja más baja." \
  "evolucion-progreso|azul-noche|360|1|800||telefono-cierre|Antes;evolucion-progreso|azul-noche|360|1|800||telefono|Después"
captura 31-antes-despues-progreso-bajando 820 980 1 "Progreso bajando 300 dp: antes y después" "Azul noche · 360 × 800 dp · letra normal. Antes, la figura llenaba la pantalla; después, la figura y la primera tarjeta entran juntas." \
  "evolucion-progreso|azul-noche|360|1|800|bajar=300|telefono-cierre|Antes;evolucion-progreso|azul-noche|360|1|800|bajar=300|telefono|Después"
captura 32-antes-despues-letra-maxima 820 980 1 "Progreso con letra ×2, bajando hasta la figura: antes y después" "Azul noche · 360 × 800 dp. La figura deja lugar a los números grandes sin ocupar toda la pantalla." \
  "evolucion-progreso|azul-noche|360|2|800|bajar=500|telefono-cierre|Antes;evolucion-progreso|azul-noche|360|2|800|bajar=500|telefono|Después"
captura 33-antes-despues-tarjeta 820 980 2 "Una tarjeta de Progreso: antes y después" "Claro · 360 dp · letra normal. Después, con la forma del ejemplo de Dirección: valor grande, cambio con flecha y su fecha, tres líneas de referencia, la toma bajo cada punto y los valores en fila. Los puntos siguen sin unirse." \
  "evolucion-progreso|claro|360|1|800|bajar=560|telefono-cierre|Antes;evolucion-progreso|claro|360|1|800|bajar=380|telefono|Después"
captura 34-antes-despues-indicadores 820 980 1 "Indicadores: antes y después" "Claro · 360 × 800 dp · letra normal. Las mismas tarjetas, con el gráfico nuevo y el cambio debajo del valor." \
  "evolucion-indicadores|claro|360|1|800|bajar=200|telefono-cierre|Antes;evolucion-indicadores|claro|360|1|800|bajar=200|telefono|Después"
