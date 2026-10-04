#!/usr/bin/env bash
# Rehace las comparaciones de EVIDENCIA/INICIO-Y-NAVEGACION/capturas. Antes: npm i en esta carpeta (o en una copia
# fuera del repo, con BE_REPO apuntando a la raíz) y node construir.mjs. Necesita Chrome y conexión para Roboto.
# Uso: capturar-todo.sh [carpeta de destino] [prefijo, para rehacer solo algunas]
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../capturas}"
SOLO="${2:-}"
B="file:///$AQUI/salida/comparacion.html?"
unset EXPRESION
codificar() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }
captura() {
  local nombre="$1" ancho="$2" alto="$3" titulo="$4" nota="$5" m="$6"
  if [ -n "$SOLO" ] && [[ "$nombre" != $SOLO* ]]; then return; fi
  node "$AQUI/cdp.mjs" "$DESTINO/$nombre.png" "$ancho" "$alto" "${B}titulo=$(codificar "$titulo")&nota=$(codificar "$nota")&m=$m" 12000
}

captura 01-inicio-arriba 2420 960 "Inicio arriba" "Azul noche y Claro, en 360, 390 y 412 dp, con letra ×1, ×1,3 y ×2. Con letra ×1,3 en 360 dp y con ×2, la barra va en dos filas." \
  "inicio|azul-noche|360|1|820;inicio|claro|360|1.3|820;inicio|azul-noche|390|2|820;inicio|claro|412|1|820;inicio|azul-noche|412|1.3|820;inicio|claro|360|2|820"
captura 02-inicio-al-final 1240 960 "El final de Inicio" "La última tarjeta queda libre sobre la cápsula, con gestos y con tres botones." \
  "inicio|azul-noche|360|1|820|final=1;inicio|claro|390|1|820|final=1%26abajo=48;inicio|azul-noche|360|1.3|820|final=1"
captura 03-inicio-estados 1660 960 "Estados de Inicio" "Sin el A3, sin plan ni datos, sin conexión y mientras se verifica." \
  "inicio-sin-a3|azul-noche|360|1|820;inicio-vacio|claro|360|1|820;inicio-sin-red|azul-noche|360|1|820;inicio-cargando|claro|360|1|820"
captura 04-menu-y-cuenta 860 960 "Menú y Cuenta" "El menú auxiliar abierto, y Cuenta desde el avatar, con «Volver» y sin destino resaltado." \
  "menu|azul-noche|360|1|820;cuenta|claro|360|1|820"
captura 05-evolucion 1260 1160 "Mi evolución: vistas y selector de tomas" "Mapa corporal con la T2 elegida y con la última, y Comparar. La vista Toma ahora es Mapa corporal e Indicadores." \
  "evolucion-mapa-t2|azul-noche|360|1|1020;evolucion-mapa|claro|360|1|1020;evolucion-comparar|azul-noche|390|1|1020"
captura 06-graficos-chicos 1260 1160 "Gráficos chicos: otro grupo y doce tomas" "El tríceps de agosto se tomó con ISAK: una raya sobre la base y «no comparable» en la lista. Con doce tomas, los puntos se achican y no desbordan." \
  "evolucion-mapa|azul-noche|360|1|1020|medida=pliegue-triceps%26bajar=1150;evolucion-12|claro|360|1|1020|medida=pliegue-triceps%26bajar=430;evolucion-12-indicadores|azul-noche|390|1|1020|bajar=560"
captura 07-mapa-corporal 1260 1660 "Mapa corporal" "Cada sitio con su valor, su diferencia y su gráfico chico de puntos por toma, unido al sitio por la guía. Cintura elegida: fila, guía y sitio resaltados." \
  "evolucion-mapa|azul-noche|360|1|1520|medida=perimetro-cintura;evolucion-mapa|claro|390|1|1520;evolucion-mapa|azul-noche|412|1|1520|medida=pliegue-subescapular"
captura 08-mapa-detalle-y-letra-grande 1260 1160 "Mapa corporal: detalle y letra grande" "El detalle de la medida elegida, con su gráfico, su lista y «Ver su evolución». Con letra ×1,3 o más, la figura va con números y cada fila de la lista lleva su gráfico." \
  "evolucion-mapa|azul-noche|360|1|1020|medida=perimetro-cintura%26bajar=1150;evolucion-mapa|claro|360|1.3|1020|bajar=1250;evolucion-mapa|azul-noche|360|2|1020|bajar=1750"
captura 09-indicadores 1260 1560 "Indicadores" "Tarjetas sin cuerpo para lo que no tiene sitio en la figura. Dos columnas cuando entran; una con letra ×1,3 en 360 dp. La tarjeta elegida se abre a todo el ancho." \
  "evolucion-indicadores|azul-noche|360|1|1420|medida=peso;evolucion-indicadores|claro|360|1.3|1420;evolucion-indicadores|azul-noche|412|1|1420|bajar=560"
captura 10-barra-letra-grande 2060 960 "La barra con letra grande" "Las etiquetas crecen con la letra, sin tope. En una fila mientras entren con al menos el 90 % de su tamaño; si no, dos filas (decisión visual explícita). Tamaños medidos en el LEEME." \
  "inicio|azul-noche|320|1|820|final=1;inicio|claro|360|1.15|820|final=1;inicio|azul-noche|360|1.3|820|final=1;inicio|claro|360|2|820|final=1;inicio|azul-noche|320|2|820|final=1"
captura 11-sin-datos-y-toma-incompleta 1260 1060 "Sin datos y una toma que puede estar incompleta" "Sin mediciones en el período; y dos evaluaciones el mismo día (D-3): la pantalla lo avisa y cuenta «a la vista»." \
  "evolucion-vacia|azul-noche|360|1|920;evolucion-mismo-dia|claro|360|1|920;evolucion-mismo-dia-indicadores|azul-noche|360|1|920"
