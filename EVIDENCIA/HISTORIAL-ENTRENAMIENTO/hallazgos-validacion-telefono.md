# «Tu historial» (DL-096) — hallazgos de la validación en teléfono y su corrección

Validación manual de Dirección sobre la **APK 0.11.0**. Cada hallazgo separa lo **observado**, la **causa comprobada**, la **hipótesis** (cuando la causa no se pudo confirmar entera) y la **verificación pendiente en dispositivo**. Las correcciones se prueban por lógica; **no se declara nada resuelto visualmente**. DL-096 permanece **EN CURSO**. Esta tarea no construye ni publica una APK nueva.

## 1. Navegación — volver desde el detalle

- **Observado (teléfono, Dirección):** Cuenta → «Tu historial» → «Ver la sesión» → volver regresaba a «Entrenamiento de hoy», no a «Tu historial».
- **Causa comprobada (código):** el detalle `ejecucion-de-entrenamiento` se abre desde «Hoy» y desde «Tu historial», pero `anterior()` (`apps/mobile/src/navegacion.ts`) devolvía siempre `entrenamiento`. El botón Atrás de Android y el enlace visible usan la misma `anterior()`.
- **Corrección:** la ruta del detalle lleva `origen: 'hoy' | 'historial'`; `anterior()` vuelve al origen. Desde «Hoy» (origen ausente o `'hoy'`) sigue yendo a Hoy; el destino **no** se cambió globalmente. La corrección de una ejecución ocurre **en la misma pantalla** (no navega), así que su retorno usa la misma `anterior()` ya corregida; no se tocaron reglas de autorización ni de corrección.
- **Comprobado por pruebas:** `scripts/historial-navegacion.test.mjs` — ambos orígenes, la pantalla de registro sigue volviendo a Hoy, el enlace nombra «Volver a Tu historial».
- **Pendiente en dispositivo:** el recorrido real del **enlace**, del **Atrás de Android** y del **retorno tras una corrección**, en la próxima APK.

## 2. Fecha — lista «24» vs detalle «25»

- **Observado (teléfono):** misma «Sesión A» — lista «24 de septiembre», detalle «25 de septiembre».
- **Causa comprobada:** ambas pantallas usan el **mismo campo** `date` (fecha civil `YYYY-MM-DD`), **no** `recordedAt`. La lista formateaba `dia(date)`, que `new Date('YYYY-MM-DD')` toma como medianoche UTC y, al oeste de UTC (Buenos Aires), retrocede un día. El anclaje a mediodía UTC del primer arreglo tampoco era independiente de zona: en zonas muy al este avanzaba un día.
- **Corrección:** se agregó `fechaCivil` en `apps/mobile/src/formato.ts`, que **fija la zona en UTC** al formatear una fecha civil, de modo que día/mes/año se conservan en cualquier zona. Se reutiliza en la lista y el detalle del historial, en las tarjetas de «Hoy» y en la pantalla de registro (todos los usos de fecha civil del circuito). Los **timestamps reales** (`recordedAt`, `activatedAt`, `occurredAt`) siguen con `fecha`/`dia`, en la zona de la persona. **No se modificó ningún dato almacenado.**
- **Comprobado por pruebas:** el test corre la función de producción `fechaCivil` en subprocesos con TZ de Buenos Aires (UTC−3), UTC, Pacific/Auckland, Pacific/Kiritimati (UTC+14) y Asia/Kathmandu (UTC+05:45); exige el mismo día civil en todas, en límites de mes y de año y en una fecha bisiesta.
- **Latente fuera de alcance:** el patrón viejo (`dia(\`${x}T12:00:00Z\`)`) sigue en `nutricion.tsx` y `antropometria.tsx`. Tienen la misma debilidad en zonas extremas al este; **queda registrado para una tarea aparte** (no se toca acá para no ampliar el paquete).
- **Pendiente en dispositivo:** confirmar que lista y detalle coinciden en la próxima APK.

## 3. Área inferior — barra de navegación de Android sobre el contenido

- **Observado (capturas de Dirección):** la barra de navegación del sistema se superpone parcialmente al botón «Corregir registro» y al contenido inferior.
- **Causa (hipótesis respaldada por código, no confirmada en dispositivo):** Android es **edge-to-edge** desde Expo SDK 54 (el APK es Expo 57), así que el `ScrollView` global (`apps/mobile/App.tsx`) se dibuja por detrás de la barra del sistema, y el contenido no reservaba el espacio de esa barra.
- **Corrección:** se incorporó **`react-native-safe-area-context`** (`~5.7.0`, la versión que resuelve `expo install` para SDK 57). La app se envuelve en `SafeAreaProvider` y el margen inferior del contenido usa el **inset real del sistema** (`useSafeAreaInsets().bottom`) más un margen base, en lugar del valor fijo del intento anterior. El **espacio superior no se tocó**: ya lo maneja la barra con `Constants.statusBarHeight`, así que no se duplica. La interacción con el `ScrollView` y el `KeyboardAvoidingView` se mantiene (el inset se suma al `contentContainerStyle`, no interfiere con el teclado).
- **NO verificado en dispositivo:** no dispongo de teléfono ni emulador. **Queda pendiente de comprobación en dispositivo** que el inset despeje la barra tanto con **navegación por gestos** como con **tres botones**, en los modelos de Dirección. No se afirma que el control quedara siempre alcanzable ni que un margen concreto sea suficiente: eso lo determina la comprobación visual.

## Comportamiento del período (precisión sobre una afirmación anterior)

La pantalla **no conserva un período elegido por la persona**: recalcula automáticamente una **ventana de los últimos 90 días** cada vez que se monta. Al volver desde el detalle, esa ventana se vuelve a calcular (mismo rango salvo cambio de día) y **el desplazamiento de la lista se reinicia** —la navegación monta y desmonta pantallas, no conserva scroll—. La afirmación previa de que «se conserva el período seleccionado» era imprecisa: no hay selección de período que conservar.
**Limitación registrada para revisión funcional posterior:** no hay selector de período ni paginación en la pantalla; sesiones anteriores a 90 días no se ven. No se agrega un selector en esta tarea.

## Evidencia positiva conservada (sin cambios)

El detalle sigue mostrando registro original y corrección sin ocultar el original (press de banca 60 kg × 8 · esfuerzo 7 → corrección × 9), con autor, fecha y motivo. No se tocó ese comportamiento ni las reglas de corrección.
