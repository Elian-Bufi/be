#!/usr/bin/env bash
# WP-APP-VUELTA-2 · AV2-16 · La medición de cuadros en el teléfono, antes y después (paquete §5.3).
#
# Uso (con el teléfono conectado por USB y la depuración USB activada; `adb` en el PATH):
#   bash medir.sh antes      # con la 0.23 instalada
#   bash medir.sh despues    # con la 0.24.0-candidata.1 instalada
# Después: node resumir.mjs   (arma la tabla y aplica el criterio)
#
# Por cada pantalla (Inicio, Nutrición Hoy, Entrenamiento y Tu historial) y por cada una de las tres corridas:
#   1. pide abrir la pantalla en el teléfono y esperar a que cargue (sin tocar nada después);
#   2. borra las estadísticas de cuadros (`dumpsys gfxinfo <paquete> reset`);
#   3. hace diez deslizamientos iguales (`input swipe`), con las mismas coordenadas, hacia abajo y hacia arriba;
#   4. guarda `dumpsys gfxinfo <paquete>` crudo en etapa/pantalla-corrida.txt.
# Antes y después de las corridas guarda `dumpsys meminfo <paquete>` (la línea Graphics) y la frecuencia de la pantalla.
# No toca la app ni la API: solo lee las estadísticas del sistema. No hace capturas de datos de la persona.
set -euo pipefail

ETAPA="${1:-}"
if [[ "$ETAPA" != "antes" && "$ETAPA" != "despues" ]]; then
  echo "Uso: bash medir.sh antes|despues" >&2
  exit 2
fi
PAQUETE="${PAQUETE:-com.elianbufi.be}"
CORRIDAS="${CORRIDAS:-3}"
DESLIZAMIENTOS="${DESLIZAMIENTOS:-10}"
DIR="$(cd "$(dirname "$0")" && pwd)/$ETAPA"
mkdir -p "$DIR"

command -v adb >/dev/null || { echo "No encuentro adb en el PATH." >&2; exit 1; }
DISPOSITIVOS=$(adb devices | awk 'NR>1 && $2=="device" {print $1}')
[[ -n "$DISPOSITIVOS" ]] || { echo "No hay un teléfono conectado con la depuración USB activada (adb devices)." >&2; exit 1; }
[[ $(echo "$DISPOSITIVOS" | wc -l) -eq 1 ]] || { echo "Hay más de un dispositivo: dejá conectado solo el teléfono de la medición." >&2; exit 1; }
adb shell pm path "$PAQUETE" >/dev/null 2>&1 || { echo "El teléfono no tiene instalada $PAQUETE." >&2; exit 1; }

# La versión instalada, el modelo, Android y la frecuencia de la pantalla: van al encabezado del resumen.
{
  echo "etapa=$ETAPA"
  echo "fecha=$(date -Iseconds)"
  echo "version=$(adb shell dumpsys package "$PAQUETE" | grep -m1 -o 'versionName=[^ ]*' | cut -d= -f2 | tr -d '\r')"
  echo "versionCode=$(adb shell dumpsys package "$PAQUETE" | grep -m1 -o 'versionCode=[0-9]*' | cut -d= -f2 | tr -d '\r')"
  echo "modelo=$(adb shell getprop ro.product.model | tr -d '\r')"
  echo "android=$(adb shell getprop ro.build.version.release | tr -d '\r')"
  echo "frecuencia=$(adb shell dumpsys display | grep -m1 -oE 'renderFrameRate [0-9.]+|fps=[0-9.]+' | grep -oE '[0-9.]+' | head -1 | tr -d '\r')"
  echo "pantalla=$(adb shell wm size | grep -oE '[0-9]+x[0-9]+' | tail -1 | tr -d '\r')"
} > "$DIR/dispositivo.txt"
cat "$DIR/dispositivo.txt"

# Las coordenadas del deslizamiento, en proporción de la pantalla: el centro, del 75 % al 30 % del alto, en 300 ms.
TAMANO=$(grep -m1 '^pantalla=' "$DIR/dispositivo.txt" | cut -d= -f2)
ANCHO=${TAMANO%x*}
ALTO=${TAMANO#*x}
X=$((ANCHO / 2))
ABAJO=$((ALTO * 75 / 100))
ARRIBA=$((ALTO * 30 / 100))

adb shell dumpsys meminfo "$PAQUETE" > "$DIR/memoria-antes.txt"

for PANTALLA in inicio nutricion-hoy entrenamiento tu-historial; do
  for CORRIDA in $(seq 1 "$CORRIDAS"); do
    echo
    echo "▶ Abrí «$PANTALLA» en el teléfono, arriba de todo, esperá a que cargue y apretá Enter (corrida $CORRIDA de $CORRIDAS)."
    read -r _
    adb shell dumpsys gfxinfo "$PAQUETE" reset >/dev/null
    for i in $(seq 1 "$DESLIZAMIENTOS"); do
      if (( i % 2 == 1 )); then adb shell input swipe "$X" "$ABAJO" "$X" "$ARRIBA" 300; else adb shell input swipe "$X" "$ARRIBA" "$X" "$ABAJO" 300; fi
      sleep 0.6
    done
    sleep 1
    adb shell dumpsys gfxinfo "$PAQUETE" > "$DIR/$PANTALLA-$CORRIDA.txt"
    grep -E 'Total frames rendered|Janky frames:|90th percentile' "$DIR/$PANTALLA-$CORRIDA.txt" | tr -d '\r' || true
  done
done

adb shell dumpsys meminfo "$PAQUETE" > "$DIR/memoria-despues.txt"
echo
echo "Listo: los crudos quedaron en $DIR. Falta, a mano: «Depurar superposición de GPU» en las opciones de desarrollador,"
echo "una captura de Inicio con la superposición (adb exec-out screencap -p > $DIR/superposicion-inicio.png), y nada en rojo"
echo "debajo del texto. Después: node resumir.mjs"
