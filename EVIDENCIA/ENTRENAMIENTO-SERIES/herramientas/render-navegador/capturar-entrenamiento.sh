#!/usr/bin/env bash
# Las capturas de Entrenamiento de la APK (WP-ENTRENAMIENTO-SERIES §11, V01): renders de los componentes REALES en el
# navegador, con datos sintéticos (shims/api.ts) y el reloj detenido (shims/reloj-de-sesion.ts). Cada imagen dice arriba,
# en rojo, que no es la APK. No prueban el teclado real, TalkBack, la zona segura ni el dibujo de Yoga: eso es de Android.
# Antes: npm install (una vez) y node construir.mjs (salida/maqueta.js, con las imágenes del paquete en salida/fotos).
# Necesita Node 22 y Chrome en C:/Program Files/Google/Chrome. Por omisión escribe en ../../capturas-apk-navegador.
# Uso: capturar-entrenamiento.sh [carpeta de destino] [prefijos separados por comas, para rehacer solo algunas: 07,13]
# PIXELES=2 saca las imágenes al doble de píxeles; por omisión, 1: imágenes chicas, que se leen igual en una pantalla.
# Cada captura: nombre · escena · tema · ancho (dp) · escala de letra · alto del teléfono · modo · título.
# Modo «entera»: el teléfono crece hasta mostrar todo el contenido. Modo «fija»: un teléfono común de 800 dp, sin crecer
# (para un diálogo, que ocupa el teléfono).
set -euo pipefail
AQUI="$(cd "$(dirname "$0")" && pwd -W 2>/dev/null || pwd)"
DESTINO="${1:-$AQUI/../../capturas-apk-navegador}"
SOLO="${2:-}"
PIXELES="${PIXELES:-1}"
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
  local ajustar="1"
  if [ "$modo" = "fija" ]; then ajustar="0"; fi
  AJUSTAR="$ajustar" ESCALA_DE_PANTALLA="$PIXELES" node "$AQUI/cdp.mjs" "$DESTINO/$nombre.png" $((ancho + 28)) $((alto + 150)) \
    "file:///$AQUI/salida/evidencia.html?escena=$escena&tema=$tema&ancho=$ancho&alto=$alto&escala=$escala&titulo=$(codificar "$titulo")" 7000
}

# ─── La sesión enfocada, serie 1: 360/390/412 dp × Azul noche/Claro × letra ×1/×1,3/×2 ───
for tema in azul-noche claro; do
  for ancho in 360 390 412; do
    for escala in 1 1.3 2; do
      captura "01-serie-1-${tema}-${ancho}-letra-${escala/./-}" sesion-serie-1 "$tema" "$ancho" "$escala" 800 entera "Sesión enfocada · serie 1 de la sentadilla goblet"
    done
  done
done

# ─── Entrenamiento: Hoy y Plan ───
captura 02-hoy entrenamiento-hoy azul-noche 390 1 800 entera "Entrenamiento · Hoy: la sesión con «N ejercicios · M series» e «Iniciar entrenamiento»"
captura 03-hoy-claro-letra-1-3 entrenamiento-hoy claro 360 1.3 800 entera "Entrenamiento · Hoy, Claro, letra ×1,3"
captura 04-plan entrenamiento-plan azul-noche 390 1 800 entera "Entrenamiento · Plan: la sesión abierta, con imágenes y objetivos por serie (sin calendario)"
captura 05-plan-claro entrenamiento-plan claro 412 1 800 entera "Entrenamiento · Plan, Claro"

# ─── La sesión enfocada: escribir, descansar, la técnica y la rutina ───
captura 06-serie-escrita sesion-escrita azul-noche 390 1 800 entera "Sesión enfocada · 14 repeticiones y RIR 2,5 escritos: la banda del plan sigue a la vista"
captura 07-descanso-en-curso sesion-descanso azul-noche 390 1 800 entera "Descanso en curso · la serie 1 guardada, el aro y «Al terminar, seguís con la serie 2»"
captura 08-descanso-en-curso-claro sesion-descanso claro 360 1 800 entera "Descanso en curso · Claro, 360 dp"
captura 09-tecnica sesion-tecnica azul-noche 390 1 800 fija "Ver técnica · la imagen, su texto alternativo, su rol, procedencia, autoría, licencia y revisión"
captura 10-tecnica-claro-letra-1-3 sesion-tecnica claro 412 1.3 800 fija "Ver técnica · Claro, letra ×1,3"
captura 11-rutina sesion-rutina azul-noche 390 1 800 fija "Ver rutina · los ejercicios; ver la técnica de otro no cambia el activo"
captura 12-sin-objetivo sesion-sin-objetivo claro 390 1 800 entera "Zancada estática · sin RIR planificado («Sin objetivo»), carga 0 kg y repeticiones por lado"
captura 13-primera-vez sesion-primera-vez azul-noche 390 1 800 entera "La primera vez · «Guardamos los tiempos que marcás…», una vez por cuenta"

# ─── Antes de finalizar ───
captura 14-resumen sesion-resumen azul-noche 390 1 800 entera "Antes de finalizar · «N de M series registradas», «Sin registrar» y los tiempos con su calidad"
captura 15-resumen-claro-letra-1-3 sesion-resumen claro 412 1.3 800 entera "Antes de finalizar · Claro, letra ×1,3"

# ─── La recuperación de la sesión (referencia 02) ───
captura 16-recuperacion-comprobando recuperacion-comprobando azul-noche 390 1 800 fija "Recuperación · comprobando la sesión guardada"
captura 17-recuperacion-comprobando-claro recuperacion-comprobando claro 360 1 800 fija "Recuperación · comprobando, Claro"
captura 18-recuperacion-tardando recuperacion-tardando azul-noche 390 1 800 fija "Recuperación · a los 5 s: «Está tardando más de lo habitual» y «Reintentar»"
captura 19-recuperacion-tardando-claro-letra-2 recuperacion-tardando claro 412 2 800 entera "Recuperación · tardando, Claro, letra ×2"
captura 20-recuperacion-sin-conexion recuperacion-sin-conexion azul-noche 390 1 800 fija "Recuperación · sin conexión: la credencial sigue guardada"
