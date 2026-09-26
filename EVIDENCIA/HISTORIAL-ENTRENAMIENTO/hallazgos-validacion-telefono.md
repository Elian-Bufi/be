# «Tu historial» (DL-096) — hallazgos de la validación en teléfono y su corrección

Validación manual de Dirección sobre la **APK 0.11.0**. Tres hallazgos; sus correcciones se hacen en el código y se prueban por regresión, pero **la comprobación visual en dispositivo queda pendiente** (no la doy por resuelta leyendo código). DL-096 permanece **EN CURSO**.

## 1. Navegación — volver desde el detalle (defecto confirmado en teléfono)

- **Observado por Dirección:** Cuenta → «Tu historial» → «Ver la sesión» → volver regresaba a **«Entrenamiento de hoy»**, no a «Tu historial».
- **Causa (confirmada en código):** el detalle de ejecución (`ejecucion-de-entrenamiento`) se abre desde dos recorridos —«Hoy» y «Tu historial»—, pero `anterior()` (`apps/mobile/src/navegacion.ts`) devolvía siempre `entrenamiento` (Hoy). El botón Atrás de Android y el enlace visible usan la misma `anterior()`, así que ambos fallaban igual.
- **Corrección:** la ruta del detalle lleva ahora `origen: 'hoy' | 'historial'`; `anterior()` vuelve al origen. Desde «Hoy» (origen ausente o `'hoy'`) sigue yendo a Hoy; desde «Tu historial» va a «Tu historial». **No** se cambió el destino globalmente. El período por defecto («últimos 90 días») se conserva porque la pantalla lo recalcula igual al volver.
- **Retorno tras corregir:** la corrección es **en la misma pantalla** (no navega), así que volver después de corregir usa la misma `anterior()` ya corregida; no se tocaron reglas de autorización ni de corrección.
- **Verificado por pruebas:** `scripts/historial-navegacion.test.mjs` — vuelve a historial con origen historial; vuelve a Hoy con origen `'hoy'` o ausente; la pantalla de registro sigue volviendo a Hoy; el enlace nombra «Volver a Tu historial».
- **Pendiente en dispositivo:** confirmar el recorrido real (enlace y Atrás) en la próxima APK.

## 2. Fecha — lista 24 vs detalle 25 (causa confirmada, no era «suposición de UTC»)

- **Observado:** misma «Sesión A» — lista «24 de septiembre», detalle «25 de septiembre».
- **Traza:** ambas pantallas usan el **mismo campo**, `date` (la fecha civil de la sesión, `YYYY-MM-DD`), **no** `recordedAt`. No se mezclan fecha de sesión y de registro.
- **Causa (demostrada, no supuesta):** el detalle formatea `dia(\`${date}T12:00:00Z\`)` (mediodía UTC); la **lista** formateaba `dia(date)`. `new Date('2026-09-25')` se interpreta como **medianoche UTC**, y en Buenos Aires (UTC−3) retrocede a **24**. Reproducido con el propio formateador:
  - `dia('2026-09-25T12:00:00Z')` → `25 sept 2026`
  - `dia('2026-09-25')` → `24 sept 2026`
- **Semántica preservada:** es una fecha **civil**; el detalle ya mostraba la correcta (25). Se corrige la **lista** para anclarla igual (mediodía UTC), como el detalle y las tarjetas de «Hoy». **No se modificó ningún dato almacenado.**
- **Verificado por pruebas:** el test corre `dia` en un subproceso con TZ de Buenos Aires (donde el bug aparece; la CI corre en UTC, donde no) y exige día 25 con anclaje y 24 sin él.
- **Pendiente en dispositivo:** confirmar que lista y detalle coinciden en la próxima APK.

## 3. Área inferior — barra de navegación de Android sobre «Corregir registro» (posible defecto)

- **Observado por Dirección (capturas):** la barra de navegación del sistema se superpone parcialmente al botón «Corregir registro» y al contenido inferior.
- **Causa probable (código):** Android es **edge-to-edge** desde Expo SDK 54 (el APK es Expo 57), así que el `ScrollView` global (`apps/mobile/App.tsx`) llega por detrás de la barra del sistema; el margen inferior era `48` y `safe-area-context` **no es dependencia** del APK, por lo que no se aplicaba inset.
- **Corrección (acotada, sin nueva dependencia):** se subió el margen inferior del contenido a `96`, suficiente para dejar el último control por encima de una barra de 3 botones (~48) con aire, al desplazar hasta el fondo. El botón siempre fue alcanzable por scroll; el cambio evita que quede tapado en reposo.
- **NO verificado en dispositivo:** no dispongo de teléfono ni emulador; **queda pendiente de comprobación en dispositivo** que el margen despeje la barra en los modelos de Dirección (gestos y 3 botones). Si resultara insuficiente, el fix definitivo es incorporar `react-native-safe-area-context` y usar el inset real —se deja anotado, no se hace acá para no ampliar el paquete ni agregar dependencia en un release bajo auditoría.

## Evidencia positiva que se conservó (sin cambios)

El detalle sigue mostrando registro original y corrección sin ocultar el original (press de banca 60 kg × 8 · esfuerzo 7 → corrección × 9), con autor, fecha y motivo. No se tocó ese comportamiento ni las reglas de corrección.
