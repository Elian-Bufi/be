# AV2-16 · El rendimiento, antes y después (WP-APP-VUELTA-2 §5.3)

> **Estado (2026-11-11): preparado, sin medir.** No hay un teléfono conectado. El procedimiento y sus dos herramientas
> están listos; la medición «antes» se puede hacer ya con la 0.23 que Dirección tiene instalada, y la «después», con la
> 0.24.0-candidata.1 de la muestra (AV2-18). Las capturas del render del navegador no sirven para esto: no usa Yoga y no
> dibuja como Android el degradé, la sombra ni el vidrio.

## Qué hace falta

- El teléfono de Dirección y, si hay, uno con Android 11 o menos (la sombra exterior pide Android 9 y la línea de luz,
  Android 10: antes no se dibujan y la tarjeta se ve plana).
- La depuración USB activada (Ajustes → Opciones para desarrolladores) y el cable.
- `adb` (Android SDK platform-tools) en el `PATH`, y Bash (Git Bash en Windows). Node 22 para el resumen.
- La misma persona sintética y el mismo día en las dos mediciones, con el mismo tema y la misma letra.

## Cómo se mide

1. Con la 0.23 instalada: `bash medir.sh antes`. Por cada pantalla (Inicio, Nutrición Hoy, Entrenamiento y Tu historial)
   y por cada una de las tres corridas, el guion pide abrir la pantalla y apretar Enter. Después borra las estadísticas
   (`adb shell dumpsys gfxinfo com.elianbufi.be reset`), hace diez deslizamientos iguales con `adb shell input swipe`
   (las mismas coordenadas, del 75 % al 30 % del alto, en 300 ms) y guarda `dumpsys gfxinfo` crudo.
2. Instalar la 0.24.0-candidata.1 encima (el mismo certificado y un `versionCode` mayor) y repetir: `bash medir.sh despues`.
3. En las opciones de desarrollador, «Depurar superposición de GPU»: una captura de Inicio
   (`adb exec-out screencap -p > despues/superposicion-inicio.png`). Nada en rojo debajo del texto.
4. `node resumir.mjs`: arma `RESUMEN.md` con la mediana de las tres corridas de cada pantalla, los percentiles 50, 90 y
   95, los cuadros lentos y la memoria de gráficos (`dumpsys meminfo`, la línea Graphics), antes y después.

`node resumir.mjs --prueba` verifica el lector de `gfxinfo` y el criterio con un ejemplo, sin teléfono.

## El criterio

- El percentil 90 en **16,7 ms o menos a 60 Hz** (11,1 ms a 90 Hz y 8,3 ms a 120 Hz: el guion lee la frecuencia de la
  pantalla), y **no más de 2 puntos de cuadros lentos** que la 0.23 en las mismas condiciones.
- Si no se cumple, primero se baja el costo (sin el brillo, un solo destello) y después se apaga el interruptor del
  vidrio en la pantalla que no pasa (`App.tsx`). Todo el contenido vive en un solo desplazamiento, sin listas
  virtualizadas: los costos nuevos son la mezcla de cada tarjeta translúcida con el fondo y el desenfoque de cada sombra.

## Qué queda en esta carpeta

- `medir.sh` y `resumir.mjs`: las herramientas.
- `antes/` y `despues/`: los crudos de cada corrida, el dispositivo y la memoria (los crea `medir.sh`).
- `RESUMEN.md`: la tabla con el resultado (la crea `resumir.mjs`).
