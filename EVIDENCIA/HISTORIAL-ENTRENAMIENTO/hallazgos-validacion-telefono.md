# «Tu historial» (DL-096) — hallazgos de la validación en teléfono y su corrección

Validación manual de Dirección sobre la **APK 0.11.0**. Cada hallazgo separa lo **observado**, la **causa comprobada**, la **hipótesis** (cuando la causa no se pudo confirmar entera) y la **verificación pendiente en dispositivo**. Las correcciones se prueban por lógica; **no se declara nada resuelto visualmente**. DL-096 permanece **EN CURSO**. Las correcciones viajan en la próxima APK (**0.11.1**); la comprobación visual sigue pendiente.

## 1. Navegación — volver desde el detalle

- **Observado (teléfono, Dirección):** Cuenta → «Tu historial» → «Ver la sesión» → volver regresaba a «Entrenamiento de hoy», no a «Tu historial».
- **Causa comprobada (código):** el detalle `ejecucion-de-entrenamiento` se abre desde «Hoy» y desde «Tu historial», pero `anterior()` (`apps/mobile/src/navegacion.ts`) devolvía siempre `entrenamiento`. El botón Atrás de Android y el enlace visible usan la misma `anterior()`.
- **Corrección:** la ruta del detalle lleva `origen: 'hoy' | 'historial'`; `anterior()` vuelve al origen. Desde «Hoy» (origen ausente o `'hoy'`) sigue yendo a Hoy; el destino **no** se cambió globalmente. La corrección de una ejecución ocurre **en la misma pantalla** (no navega), así que su retorno usa la misma `anterior()` ya corregida; no se tocaron reglas de autorización ni de corrección.
- **Comprobado por pruebas:** `scripts/historial-navegacion.test.mjs` — ambos orígenes, la pantalla de registro sigue volviendo a Hoy, el enlace nombra «Volver a Tu historial».
- **Pendiente en dispositivo:** el recorrido real del **enlace**, del **Atrás de Android** y del **retorno tras una corrección**, en la próxima APK.

## 2. Fecha — lista «24» vs detalle «25»

- **Observado (teléfono):** misma «Sesión A» — lista «24 de septiembre», detalle «25 de septiembre».
- **Causa comprobada:** ambas pantallas usan el **mismo campo** `date` (fecha civil `YYYY-MM-DD`), **no** `recordedAt`. La lista formateaba `dia(date)`, que `new Date('YYYY-MM-DD')` toma como medianoche UTC y, al oeste de UTC (Buenos Aires), retrocede un día. El anclaje a mediodía UTC del primer arreglo tampoco era independiente de zona: en zonas muy al este avanzaba un día.
- **Corrección:** se agregó `fechaCivil` en `apps/mobile/src/formato.ts`: toma los diez primeros caracteres (`YYYY-MM-DD`), los ancla a **medianoche UTC** (`T00:00:00Z`) y los formatea con un `Intl.DateTimeFormat` es-AR **fijado en `timeZone: 'UTC'`**. Ancla y formateador están en la misma zona, así que día/mes/año se conservan sea cual sea la zona del dispositivo; ya no hay anclaje a mediodía UTC. Se reutiliza en la lista y el detalle del historial, en las tarjetas de «Hoy» y en la pantalla de registro (todos los usos de fecha civil del circuito). Los **timestamps reales** (`recordedAt`, `activatedAt`, `occurredAt`) siguen con `fecha`/`dia`, en la zona de la persona. **No se modificó ningún dato almacenado.**
- **Comprobado por pruebas:** el test corre la función de producción `fechaCivil` en subprocesos con TZ de Buenos Aires (UTC−3), UTC, Pacific/Auckland, Pacific/Kiritimati (UTC+14) y Asia/Kathmandu (UTC+05:45); exige el mismo día civil en todas, en límites de mes y de año y en una fecha bisiesta.
- **Latente fuera de alcance:** el patrón viejo (`dia(\`${x}T12:00:00Z\`)`) sigue en `nutricion.tsx` y `antropometria.tsx`. Tienen la misma debilidad en zonas extremas al este; **queda registrado para una tarea aparte** (no se toca acá para no ampliar el paquete).
- **Pendiente en dispositivo:** confirmar que lista y detalle coinciden en la próxima APK.

## 3. Área inferior — barra de navegación de Android sobre el contenido

- **Observado (capturas de Dirección):** la barra de navegación del sistema se superpone parcialmente al botón «Corregir registro» y al contenido inferior.
- **Causa (hipótesis respaldada por código, no confirmada en dispositivo):** Android es **edge-to-edge** desde Expo SDK 54 (el APK es Expo 57), así que el `ScrollView` global (`apps/mobile/App.tsx`) se dibuja por detrás de la barra del sistema, y el contenido no reservaba el espacio de esa barra.
- **Corrección:** se incorporó **`react-native-safe-area-context`** (`~5.7.0`, la versión que resuelve `expo install` para SDK 57). La app se envuelve en `SafeAreaProvider` y el margen inferior del contenido usa el **inset real del sistema** (`useSafeAreaInsets().bottom`) más un margen base de 32 (`paddingBottom: 32 + insets.bottom`), en lugar del valor fijo del intento anterior. El **espacio superior no se tocó**: ya lo maneja la barra con `Constants.statusBarHeight`, así que no se duplica. El inset se suma al `contentContainerStyle` del `ScrollView`, dentro del `KeyboardAvoidingView` existente, que no se modificó. **El comportamiento con el teclado abierto no está comprobado**: no hay ejecución en dispositivo que lo muestre.
- **NO verificado en dispositivo:** no dispongo de teléfono ni emulador. **Queda pendiente de comprobación en dispositivo** que el inset despeje la barra tanto con **navegación por gestos** como con **tres botones**, en los modelos de Dirección. No se afirma que el control quedara siempre alcanzable ni que un margen concreto sea suficiente: eso lo determina la comprobación visual.

## 4. «Sesiones registradas» no carga de 21 a 24 h (validación de la APK 0.11.1)

- **Observado (teléfono, Dirección, 2026-09-26, 21:04–21:06 en Buenos Aires):** APK 0.11.1, ambiente `test`, commit `44bea3a`, cuenta sintética A01. En Cuenta → «Tu historial», «Sesiones registradas» muestra «No pudimos cargar esta vista», y «Tus planes» carga bien. El error persiste al reintentar y al volver a iniciar sesión.
- **Causa comprobada (en vivo contra la API desplegada, `periodo-en-futuro-reproduccion.txt`):** la pantalla calculaba el período con `toISOString()`, que da la fecha **UTC**. A las 21:04 de Buenos Aires son las 00:04 UTC del día siguiente, así que la APK pedía `periodEnd=2026-09-27`. La API resuelve «hoy» en `America/Argentina/Buenos_Aires` (`ejecuciones.service.ts`, `listarHistoriaPropia`) y rechaza el futuro: **HTTP 400 `INVALID_REQUEST`, issue `PERIOD_IN_FUTURE` en `periodEnd`**.
  - El cliente reconoce bien ese error: no es una falla de validación de la respuesta. La pantalla lo trata como un error genérico, porque no es `ACTION_FORBIDDEN`.
  - Con el mismo rango en fecha civil de Buenos Aires (`2026-06-29` a `2026-09-26`), la misma sesión recibe **200** con 1 sesión.
  - Reintentar o volver a entrar no lo arregla, porque el período se recalcula igual. Antes de las 21 h en Buenos Aires no ocurre.
  - No es un problema de conexión ni de consentimiento: el A3 se evalúa después de la validación del período, y con el período correcto la respuesta es 200.
- **Registros del servidor:** no los consulté. No hay acceso a los logs de Render desde este entorno. La reproducción en vivo muestra el HTTP y el cuerpo exactos.
- **Corrección (PR #94):** `ultimosDiasEnZona` (`apps/mobile/src/formato.ts`) calcula los 90 días civiles en **Buenos Aires, configurada de forma explícita** en `historial.tsx` (`ZONA_DEL_HISTORIAL`). Esa zona coincide con la que hoy usa el servidor para resolver «hoy» (`ZONA_POR_DEFECTO`). La APK **no la descubre** de `period.timeZone`: si la zona del servidor cambiara, esa constante tiene que cambiar con ella. Es el mismo criterio que ya usaban `hoyEn` en `entrenamiento.tsx` y la lista de ingestas de nutrición. No cambian el contrato ni la API.
- **Comprobado por pruebas:** `scripts/historial-navegacion.test.mjs`. La prueba reproduce la causa en el instante observado y exige `2026-06-29` a `2026-09-26` con el dispositivo en Buenos Aires, UTC, Kiritimati y Los Ángeles. También cubre los límites de mes y de año.
- **Pendiente en dispositivo:** que «Sesiones registradas» cargue después de las 21 h con la **APK 0.11.2**, que incluye esta corrección.

## 5. El teclado tapa los campos de abajo en Android (validación de la APK 0.11.2)

- **Observado (teléfono, Dirección, 2026-09-27, 16:11–16:27, APK 0.11.2, navegación de tres botones):** en «Corregir registro», con el teclado abierto, los elementos quedan **en la misma posición** que sin teclado (`capturas-0.11.2/01` y `02`: «Motivo (opcional)» a la misma altura). Al tocar «Reps», el campo queda **debajo del teclado numérico**: solo se ve su borde superior (`03`). Con el teclado cerrado, el formulario completo y «Registrar corrección» sí se alcanzan desplazando.
- **Causa comprobada (código):** `apps/mobile/App.tsx` pasaba `behavior={Platform.OS === 'ios' ? 'padding' : undefined}` al `KeyboardAvoidingView` raíz. En Android no hacía nada y dependía de que el sistema achicara la ventana (`android:windowSoftInputMode="adjustResize"`). El proyecto generado tiene `edgeToEdgeEnabled=true` (Expo SDK 54+), y con edge-to-edge Android ya no achica la ventana al abrir el teclado, así que nada reaccionaba a él. La posición idéntica de los elementos con y sin teclado es la consecuencia visible.
- **Alcance:** no es propio de «Tu historial». El `KeyboardAvoidingView` es el raíz de toda la APK, así que afecta a cualquier formulario con campos en la mitad inferior de la pantalla. Probablemente viene desde que la APK es edge-to-edge; no se verificó en versiones anteriores.
- **Corrección propuesta:** `behavior="padding"` en todas las plataformas. El `KeyboardAvoidingView` agrega abajo la altura del teclado, el `ScrollView` global se achica y el campo enfocado puede quedar a la vista. No agrega dependencias ni cambia API ni datos.
- **Comprobado por pruebas:** solo la configuración (`scripts/historial-navegacion.test.mjs` §4, que lee el código fuente). **El efecto con el teclado abierto no se puede comprobar sin dispositivo.**
- **Incluida en la APK 0.11.3** (`be-apk-0.11.3`, commit `13280e6`, PR #97).
- **Pendiente en dispositivo, con la 0.11.3:** tocar «Reps» y «RIR» con el teclado abierto y ver que quedan visibles; llegar a «Registrar corrección» con el teclado abierto; comprobar que con el teclado cerrado no queda espacio de más.

## Estado de la validación de la APK 0.11.2 (2026-09-27, 16:01–16:27, capturas de Dirección)

| Punto | Resultado |
|---|---|
| Versión en pantalla: `app 0.11.2 · test · commit 46fd1fa` | ✅ |
| «Sesiones registradas» carga | ✅ a las 16:02; **falta después de las 21 h** |
| Historial → detalle → volver, con el enlace y con el gesto de Atrás | ✅ (el gesto, informado por Dirección) |
| Misma fecha en lista y detalle («25 de sept de 2026») | ✅ |
| Último control accesible, tres botones (`05`) | ✅ |
| Último control accesible, navegación por gestos | ⏳ sin captura |
| Guardar una corrección: validación del motivo y la corrección registrada con el original conservado (`04`) | ✅ |
| Volver después de guardar la corrección | ⏳ el detalle muestra «Volver a Tu historial», pero no hay captura del destino |
| Teclado sobre el primer campo («Motivo de la corrección») | ✅ visible |
| Teclado sobre campos de abajo («Reps») | ❌ tapado: hallazgo 5 |
| Hoy → detalle → volver a Hoy | ⏳ sin captura |

## Comportamiento del período (precisión sobre una afirmación anterior)

La pantalla **no conserva un período elegido por la persona**: recalcula automáticamente una **ventana de los últimos 90 días** cada vez que se monta. Al volver desde el detalle, esa ventana se vuelve a calcular (mismo rango salvo cambio de día) y **el desplazamiento de la lista se reinicia** —la navegación monta y desmonta pantallas, no conserva scroll—. La afirmación previa de que «se conserva el período seleccionado» era imprecisa: no hay selección de período que conservar.
**Limitación registrada para revisión funcional posterior:** no hay selector de período ni paginación en la pantalla; sesiones anteriores a 90 días no se ven. No se agrega un selector en esta tarea.

## Evidencia positiva conservada (sin cambios)

El detalle sigue mostrando registro original y corrección sin ocultar el original (press de banca 60 kg × 8 · esfuerzo 7 → corrección × 9), con autor, fecha y motivo. No se tocó ese comportamiento ni las reglas de corrección.
