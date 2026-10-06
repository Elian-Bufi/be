#!/usr/bin/env bash
# Las capturas de Nutrición de la APK (WP-NUTRICION-RECETAS §10.4): renders de los componentes REALES en el navegador,
# con datos sintéticos (shims/api.ts). Cada imagen dice arriba, en rojo, que no es la APK. Al doble de píxeles.
# Antes: npm install (una vez) y node construir.mjs (salida/maqueta.js, con las fotos del paquete en salida/fotos).
# Necesita Node 22 y Chrome en C:/Program Files/Google/Chrome. Por omisión escribe en ../../capturas-apk.
# Uso: capturar-nutricion.sh [carpeta de destino] [prefijos separados por comas, para rehacer solo algunas: 04,10]
# Cada captura: nombre · escena · tema · ancho (dp) · escala de letra · alto del teléfono · modo · título.
# Modo «entera»: el teléfono crece hasta mostrar todo el contenido, con la barra al final. Modo «final»: un teléfono
# común de 800 dp, desplazado hasta el último contenido, para ver que la barra no lo tapa.
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../capturas-apk}"
SOLO="${2:-}"
mkdir -p "$DESTINO"
unset EXPRESION
codificar() { node -e 'process.stdout.write(encodeURIComponent(process.argv[1]))' "$1"; }
captura() {
  local nombre="$1" escena="$2" tema="$3" ancho="$4" escala="$5" alto="$6" modo="$7" titulo="$8"
  if [ -n "$SOLO" ]; then
    local quiero=0 prefijo
    IFS=',' read -ra prefijos <<< "$SOLO"
    for prefijo in "${prefijos[@]}"; do [[ "$nombre" == $prefijo* ]] && quiero=1; done
    [ "$quiero" = 1 ] || return 0
  fi
  local final="" ajustar="0"
  if [ "$modo" = "final" ]; then final="&final=1"; else ajustar="1"; fi
  AJUSTAR="$ajustar" ESCALA_DE_PANTALLA=2 node "$AQUI/cdp.mjs" "$DESTINO/$nombre.png" $((ancho + 28)) $((alto + 150)) \
    "file:///$AQUI/salida/evidencia.html?escena=$escena&tema=$tema&ancho=$ancho&alto=$alto&escala=$escala$final&titulo=$(codificar "$titulo")" 7000
}

# ─── Hoy: el carrusel ───
captura 01-hoy-carrusel-tres-opciones nutricion-hoy azul-noche 360 1 800 entera "Hoy · Almuerzo con tres opciones"
captura 02-hoy-carrusel-claro nutricion-hoy claro 390 1 800 entera "Hoy · el carrusel en Claro"
captura 03-hoy-carrusel-letra-1-3 nutricion-hoy azul-noche 412 1.3 800 entera "Hoy · letra ×1,3: fichas y franja dos por dos"
captura 04-hoy-carrusel-letra-2 nutricion-hoy claro 360 2 800 entera "Hoy · letra ×2: la franja en una columna"
captura 05-hoy-segunda-opcion nutricion-hoy-segunda azul-noche 390 1 800 entera "Hoy · Opción 2 de 3: las dos flechas habilitadas"
captura 06-una-opcion nutricion-una-opcion azul-noche 360 1 800 entera "Hoy · Cena con una sola opción: sin contador ni flechas"
captura 07-una-opcion-claro-letra-1-3 nutricion-una-opcion claro 412 1.3 800 entera "Hoy · una sola opción, Claro, letra ×1,3"
captura 08-opcion-sin-imagen nutricion-sin-imagen azul-noche 390 1 800 entera "Hoy · una opción sin imagen de referencia (la última: la flecha siguiente, deshabilitada)"
captura 09-falla-de-la-descarga nutricion-falla-imagen claro 360 1 800 entera "Hoy · la imagen no se pudo descargar: el contenido y el registro siguen"
captura 10-falla-de-la-descarga-letra-2 nutricion-falla-imagen azul-noche 412 2 800 entera "Hoy · la imagen no se pudo descargar, letra ×2"

# ─── El detalle de una opción ───
captura 11-detalle nutricion-detalle azul-noche 360 1 800 entera "Detalle · porciones del plan, preparación y «¿Cuánto comiste?»"
captura 12-detalle-casilla-al-final nutricion-detalle-casilla azul-noche 360 1 800 final "Detalle · «Comí las porciones del plan» marcada"
captura 13-detalle-cantidades nutricion-detalle-cantidades claro 390 1.3 800 entera "Detalle · cantidades informadas: una vacía y «No lo comí» en el aceite"
captura 14-detalle-cero-al-final nutricion-detalle-cero azul-noche 412 1 800 final "Detalle · un cero no se acepta: se ofrece «No lo comí»"
captura 15-detalle-letra-2 nutricion-detalle claro 360 2 800 entera "Detalle · letra ×2"

# ─── Registrado ───
captura 16-registrado-sin-confirmar nutricion-exito azul-noche 360 1 800 entera "Almuerzo registrado · cantidades sin confirmar"
captura 17-registrado-claro nutricion-exito claro 390 1 800 entera "Almuerzo registrado · Claro: la imagen al lado"
captura 18-registrado-letra-1-3 nutricion-exito azul-noche 412 1.3 800 entera "Almuerzo registrado · letra ×1,3"
captura 19-registrado-letra-2 nutricion-exito claro 360 2 800 entera "Almuerzo registrado · letra ×2"
captura 20-registrado-algo-diferente nutricion-exito-diferente azul-noche 390 1 800 entera "Merienda registrada · algo diferente, con foto: macros sin calcular"

# ─── Comí algo diferente ───
captura 21-diferente-vacia nutricion-diferente azul-noche 360 1 800 entera "Comí algo diferente · vacía"
captura 22-diferente-vacia-claro-letra-1-3 nutricion-diferente claro 412 1.3 800 entera "Comí algo diferente · Claro, letra ×1,3"
captura 23-diferente-con-texto nutricion-diferente-texto azul-noche 390 1 800 entera "Comí algo diferente · con texto y cantidad aproximada"
captura 24-diferente-con-foto nutricion-diferente-foto claro 360 1 800 entera "Comí algo diferente · con foto: reemplazar o quitar antes de guardar"
captura 25-diferente-con-foto-letra-2 nutricion-diferente-foto azul-noche 412 2 800 entera "Comí algo diferente · con foto, letra ×2"
captura 26-diferente-error-de-subida nutricion-diferente-error azul-noche 360 1 800 entera "Comí algo diferente · la foto no subió: el texto queda, reintentar o guardar sin la foto"
captura 27-diferente-falta-contenido nutricion-diferente-vacia-guardar claro 390 1 800 entera "Comí algo diferente · guardar vacía: hace falta texto o foto"

# ─── Registros ───
captura 28-registros nutricion-registros azul-noche 390 1 800 entera "Registros · por día, con el estado de las cantidades y lo deshecho marcado"
captura 29-registro-detalle nutricion-registro-detalle claro 360 1 800 entera "Detalle de registro · lo informado y la estimación de lo que comiste"
captura 30-registro-detalle-letra-1-3 nutricion-registro-detalle azul-noche 412 1.3 800 entera "Detalle de registro · letra ×1,3"

# ─── La barra y el último contenido, en un teléfono de 800 dp ───
captura 31-hoy-al-final nutricion-hoy azul-noche 360 1 800 final "Hoy · desplazada hasta el final: la barra no tapa «Comí algo diferente»"
captura 32-diferente-al-final-letra-2 nutricion-diferente claro 412 2 800 final "Comí algo diferente · letra ×2, hasta el final: «Volver al plan» queda sobre la barra"
