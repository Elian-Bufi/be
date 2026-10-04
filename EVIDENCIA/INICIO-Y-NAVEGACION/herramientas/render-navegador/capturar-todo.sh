#!/usr/bin/env bash
# Rehace las seis comparaciones de EVIDENCIA/INICIO-Y-NAVEGACION/capturas. Antes: npm i en esta carpeta (o en una copia
# fuera del repo, con BE_REPO apuntando a la raíz) y node construir.mjs. Necesita Chrome y conexión para Roboto.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../capturas}"
B="file:///$AQUI/salida/comparacion.html?"
foto() { node "$AQUI/cdp.mjs" "$DESTINO/$1.png" 1640 920 "${B}$2" "${3:-8000}"; }
foto 01-inicio-arriba "titulo=Inicio%2C%20arriba&m=inicio|azul-noche|360|1|780|;inicio|azul-noche|360|2|780|;inicio|claro|390|1|780|;inicio|claro|412|1.3|780|"
foto 02-inicio-al-final "titulo=Inicio%2C%20al%20final&m=inicio|azul-noche|360|1|780|final=1;inicio|azul-noche|360|1|780|final=1%26abajo=48;inicio|claro|390|2|780|final=1;inicio|claro|412|1.3|780|final=1" 9000
foto 03-inicio-estados "titulo=Inicio%3A%20estados&m=inicio-sin-a3|azul-noche|360|1|780|;inicio-vacio|claro|390|1|780|;inicio-sin-red|azul-noche|360|1|780|;inicio-cargando|claro|390|1|780|"
foto 04-menu-y-cuenta "titulo=Men%C3%BA%20y%20Cuenta&m=menu|azul-noche|360|1|780|;menu|claro|390|1.3|780|;cuenta|azul-noche|360|1|780|;cuenta|claro|412|2|780|"
foto 05-evolucion "titulo=Mi%20evoluci%C3%B3n&m=evolucion-toma-t2|azul-noche|360|1|780|;evolucion-toma|claro|390|1|780|;evolucion-comparar|azul-noche|360|1.3|780|;evolucion-toma-t2|claro|412|2|780|" 9000
foto 06-evolucion-graficos-chicos "titulo=Gr%C3%A1ficos%20chicos&m=evolucion-toma|azul-noche|360|1|780|final=1;evolucion-toma-t2|azul-noche|360|1|780|final=1;evolucion-toma|claro|390|1.3|780|final=1;evolucion-toma-t2|claro|412|2|780|final=1" 9000
