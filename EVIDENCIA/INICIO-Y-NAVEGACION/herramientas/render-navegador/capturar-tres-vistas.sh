#!/usr/bin/env bash
# Las capturas de «Mi evolución» en tres vistas (DL-118, 2026-10-05). Individuales de una pantalla, al doble de píxeles
# para verlas en el teléfono sin ampliar, y comparaciones antes y después con la candidata probada (2e53ac8).
# Antes, dos maquetas (variables en construir.mjs; rutas absolutas):
#   node construir.mjs                                         lo nuevo, salida/maqueta.js (telefono.html)
#   git worktree add --detach <árbol> 2e53ac8                  una sola vez, desde la raíz del repo
#   BE_REPO=<árbol> BE_DEPENDENCIAS=<raíz del repo> SALIDA=maqueta-candidata.js node construir.mjs
#                                                              la candidata probada (telefono-candidata.html)
# Uso: capturar-tres-vistas.sh [carpeta de destino] [prefijo, para rehacer solo algunas]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../../MI-EVOLUCION-TRES-VISTAS/capturas}"
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

# ─── Individuales, letra normal ───
captura 01-mapa-corporal 420 1690 2 "Mapa corporal" "Azul noche · 360 dp · letra normal. Los valores de la última toma: nombre y valor, sin gráficos chicos." \
  "evolucion-mapa|azul-noche|360|1|1530"
captura 02-progreso-torso 420 1880 2 "Progreso · Torso" "Azul noche · 360 dp. Perímetros del torso, panel «Cuello y tronco»: figura del tren superior con números y una tarjeta por sitio." \
  "evolucion-progreso|azul-noche|360|1|1720"
captura 03-progreso-pliegues-pecho-y-brazo 420 1880 2 "Progreso · Pliegues · Pecho y brazo" "Claro · 360 dp. El otro panel del torso, con el tríceps y su medición de otro protocolo contada aparte." \
  "evolucion-progreso|claro|360|1|1720|familia=PLIEGUES%26panel=TORSO-BRAZOS"
captura 04-progreso-piernas 420 1880 2 "Progreso · Piernas" "Azul noche · 360 dp. La figura del tren inferior: cadera, muslo, pantorrilla y tobillo." \
  "evolucion-progreso|azul-noche|360|1|1720|panel=PIERNAS"
captura 05-progreso-detalle 420 2460 2 "Progreso · una medida abierta" "Azul noche · 360 dp. La cintura elegida: ficha, anillo y tarjeta resaltados; el gráfico con fechas, la medición elegida y la lista." \
  "evolucion-progreso|azul-noche|360|1|2300|medida=perimetro-cintura"
captura 06-indicadores 420 1760 2 "Indicadores" "Azul noche · 360 dp. Mediciones, resultados marcados como estimación, la edad como dato de la toma y «Más datos de esta toma»." \
  "evolucion-indicadores|azul-noche|360|1|1600"
captura 07-indicadores-detalle 420 2460 2 "Indicadores · el peso abierto" "Claro · 360 dp. Primero el resumen; después el gráfico con fechas, la medición elegida y la lista." \
  "evolucion-indicadores|claro|360|1|2300|medida=peso"

# ─── Individuales, letra grande ───
captura 08-progreso-letra-maxima 420 3060 2 "Progreso con letra ×2" "Azul noche · 360 dp. Pestañas en dos filas, el panel del torso en dos renglones, fichas más grandes y tarjetas que crecen." \
  "evolucion-progreso|azul-noche|360|2|2900"
captura 09-mapa-letra-grande 420 2460 2 "Mapa corporal con letra ×1,3" "Claro · 360 dp. La figura con números y los valores en la lista." \
  "evolucion-mapa|claro|360|1.3|2300"
captura 10-indicadores-letra-maxima 420 3160 2 "Indicadores con letra ×2" "Claro · 360 dp. Una columna; ningún texto se corta." \
  "evolucion-indicadores|claro|360|2|3000"

# ─── Individuales, estados ───
captura 11-ultima-toma-solo-indicadores 420 1690 2 "La última toma solo tiene indicadores" "Azul noche · 360 dp. Se abre Indicadores con la T4." \
  "evolucion-solo-indicadores|azul-noche|360|1|1530"
captura 12-mapa-con-la-toma-anterior 420 1690 2 "El mapa, con la toma anterior que tiene sitios" "Azul noche · 360 dp. La T4 no tiene perímetros ni pliegues: el mapa muestra la T3 y lo dice con las dos fechas." \
  "evolucion-solo-indicadores-mapa|azul-noche|360|1|1530"
captura 13-sin-perimetros-ni-pliegues 420 1690 2 "Sin perímetros ni pliegues en el período" "Claro · 360 dp. Ni mapa ni Progreso: Indicadores, sin pestañas vacías." \
  "evolucion-sin-sitios|claro|360|1|1530"
captura 14-dos-evaluaciones-el-mismo-dia 420 2060 2 "Dos evaluaciones el mismo día (D-3)" "Azul noche · 360 dp. El aviso sigue a la vista, y la cintura que tapa la otra evaluación dice «Sin dato en esta toma»." \
  "evolucion-mismo-dia-progreso|azul-noche|360|1|1900"

# ─── Antes (2e53ac8, 0.14.0-candidata.1) y después ───
captura 15-antes-despues-mapa 820 1880 1 "Mapa corporal: antes y después" "Azul noche · 360 dp. Antes: valor, diferencia y gráfico chico por fila. Después: nombre y valor; la diferencia y el progreso, al tocar." \
  "evolucion-mapa|azul-noche|360|1|1720||telefono-candidata|Antes;evolucion-mapa|azul-noche|360|1|1720||telefono|Después"
captura 16-antes-despues-comparar-y-progreso 820 1880 1 "Comparar, antes; Progreso, después" "Azul noche · 360 dp. La comparación con la anterior comparable queda en cada tarjeta de Progreso, por zona." \
  "evolucion-mapa|azul-noche|360|1|1720|vista=COMPARAR|telefono-candidata|Antes · Comparar;evolucion-progreso|azul-noche|360|1|1720||telefono|Después · Progreso"
captura 17-antes-despues-indicadores 820 2160 1 "Indicadores con el peso abierto: antes y después" "Claro · 360 dp. Antes: la lista por toma en el detalle, la edad con gráfico y «0 años», y los diámetros entre las tarjetas. Después: el resumen, el gráfico con fechas, la edad como dato de la toma y los diámetros plegados." \
  "evolucion-indicadores|claro|360|1|2000|medida=peso|telefono-candidata|Antes;evolucion-indicadores|claro|360|1|2000|medida=peso|telefono|Después"
captura 18-antes-despues-evolucion 820 1880 1 "Evolución, antes; el detalle de la medida, después" "Azul noche · 360 dp. Antes: medida, días, protocolo y método antes del gráfico. Después: el gráfico primero, con el grupo comparable de la toma." \
  "evolucion-mapa|azul-noche|360|1|1720|vista=EVOLUCION%26medida=peso|telefono-candidata|Antes · Evolución;evolucion-indicadores|azul-noche|360|1|1720|medida=peso|telefono|Después · Indicadores"
captura 19-antes-despues-barra 1640 960 1 "Lo que pasa detrás de la barra: antes y después" "360 dp. Después, un velo del color del fondo detrás de la cápsula; el último contenido sigue quedando entero por encima." \
  "evolucion-mapa|azul-noche|360|1|800||telefono-candidata|Antes;evolucion-mapa|azul-noche|360|1|800||telefono|Después;evolucion-mapa|claro|360|1|800||telefono-candidata|Antes;evolucion-mapa|claro|360|1|800||telefono|Después"
