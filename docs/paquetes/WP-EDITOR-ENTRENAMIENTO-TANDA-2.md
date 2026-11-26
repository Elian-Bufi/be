# WP-EDITOR-ENTRENAMIENTO-TANDA-2 · El editor de Entrenamiento, tanda 2 (DL-198)

**Estado:** PROGRAMADO en `wp-editor-entrenamiento-tanda-2`, que sale de la tanda 1 (`wp-editor-entrenamiento-tanda-1`, PR
#324, en revisión). PR en borrador, sin integrar. Las decisiones ET2-D01 a ET2-D17 están **a ratificar** por Dirección.

**Origen.** Las decisiones de Dirección del 2026-11-25 sobre Entrenamiento (Elián, licenciado y entrenador): el 1RM se
estima por cálculo en todos los ejercicios con carga externa, con el último registro en rango (RIR 0 a 2, de 8 a 12
repeticiones), también puede ser declarado, y el profesional puede **calcularlo** en una calibración del día cero («30 kg
× 8 a RIR 1 → 39 kg, calculado en la calibración del 25/11»); siempre se muestra el origen. Del análisis de sus fallas
quedaron para esta tanda: el % RM con un 1RM numérico, la carga de cada semana en la app, «Ver como la persona», el esfuerzo
de la sesión, las plantillas con su planificación, la clasificación de un propio editable (ET1-D14) y borrar lo que la
tanda 1 dejó sin uso (ET1-D20). «La estética es primordial: altos estándares».

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. La jerarquía del plan (B10-06), el criterio de intensidad
por ejercicio (uno o ninguno, REG-06-128), el RPE como otra forma de escribir el RIR (DL-192), la progresión como regla de
la fase (EE-D30) y las aproximaciones de DL-178. La «Fuerza estimada» de DL-171 (Epley v1, la lista cerrada de seis) sigue
igual (ET2-D01).

---

## 1. Requisitos (ET2-01 a ET2-15)

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET2-01 | **El 1RM de referencia, con tres orígenes siempre a la vista:** la **calibración** (carga, repeticiones y RIR de una serie que vio el profesional; BE calcula con Epley y lo guarda «calculado en la calibración del 25 nov»), el **último registro** de la persona en rango y lo **declarado**. | `repeticion-maxima.ts`, `contratos-repeticion-maxima.ts`, `uno-rm.service.ts`, `uno-rm-del-ejercicio.tsx` |
| ET2-02 | **El registro, con `BE-E1RM` v2 (`EPLEY_V2`):** todos los ejercicios con carga externa (amplía la lista cerrada de seis de la v1), de 8 a 12 repeticiones a RIR 0 a 2, escritas por la persona. Fuera de la barra, «orientativo». | `ultimoRegistroEnRango`, `sesionesDeLosRegistros`, `esConBarra` |
| ET2-03 | **BE usa el más reciente.** Si un registro más nuevo se aleja más del 10 % de lo guardado, **avisa y no cambia nada solo**: «Usar el registro» o «Seguir con el guardado». | `vigenteDelUnoRM`, `avisoEnPalabras`, `RenglonDelUnoRM` |
| ET2-04 | **En % RM, la carga sale del 1RM**, redondeada al paso del implemento, con la base a la vista («70 % de 39 kg = 27 kg»): «Poner las cargas desde el 1RM» y, si ya no coinciden, «Recalcular con el 1RM». | `cargaDelPorcentaje`, `baseDelPorcentaje`, `conLasCargasDelUnoRM` |
| ET2-05 | **La carga de cada semana llega a la app:** las lecturas del titular (API-TRN-09 con la fecha de hoy; «Hoy», el período, el borrador, la ejecución registrada y API-SER-02 con la de la ocurrencia) entregan la carga, las repeticiones y las series de **esa semana** de la fase, con la progresión aplicada. | `carga-de-la-semana.ts`, `lectura-entrenamiento.ts` (`sesionEnLaSemana`), `series.service.ts`, `planes.service.ts`, `ejecuciones.service.ts` |
| ET2-06 | **La APK lo muestra:** las cargas ya vienen bien; con `training-week-load-1`, API-SER-02 suma `week` y la app dice «Semana 3 de 6» (o «· descarga») junto al nombre de la sesión. | `apps/mobile/src/esfuerzo-de-la-sesion.ts`, `pantallas/entrenamiento.tsx`, `sesion-enfocada.tsx`, `plan-por-serie.tsx` |
| ET2-07 | **El esfuerzo de la sesión (Foster):** la opción del plan «Pedir el esfuerzo de la sesión al terminar» (`planning.askSessionEffort`), aparte del RIR de cada serie. A la app le llega `askSessionEffort` en API-SER-02 con `training-session-effort-1`. | `contratos-entrenamiento.ts`, `cuadros-del-plan.tsx`, `series.service.ts` |
| ET2-08 | **La pregunta en la app**, al terminar la sesión (y en «Ya la hice»): de 0 a 10, con los minutos del cronómetro o escritos; «Guardar» o «Ahora no». Viaja aparte (API-ESF-01): la sesión ya quedó registrada. | `apps/mobile/src/pantallas/esfuerzo-de-la-sesion.tsx`, `esfuerzo-de-la-sesion.service.ts` |
| ET2-09 | **En el website:** el esfuerzo en el detalle de cada sesión de lo registrado y el gráfico de la **carga de la sesión** (esfuerzo × minutos), desde 0, con su «?» y su tabla (API-ESF-02). | `ejecuciones.tsx`, `grafico-de-la-carga-de-la-sesion.tsx` |
| ET2-10 | **Plantillas con su planificación:** guardan y aplican las semanas del plan y de cada fase, las aproximaciones, las progresiones, la intensidad y el esfuerzo de la sesión. En el editor de una plantilla, «Configurar plan» (sin fechas, objetivo ni anotaciones), las semanas de cada fase, las aproximaciones, la intensidad y la progresión. | `contratos-plantillas.ts` (`PlanificacionDeLaPlantillaSchema`), `planificacion-de-la-plantilla.ts`, `plantillas.service.ts`, `preparaciones-de-plantilla.service.ts`, `planes.service.ts`, `editor.tsx`, `plantillas.tsx` |
| ET2-11 | **La clasificación de un propio, editable** (ET1-D14): en «Mis ejercicios», «Cambiar la clasificación», en un cuadro; es la siguiente de su historia por adición (API-EJE-06). | `clasificacion-de-ejercicios.ts`, `imagenes.service.ts`, `clasificacion-del-propio.tsx`, `mis-ejercicios.tsx` |
| ET2-12 | **«Ver como la persona»:** la sesión de una semana de la fase tal como le llega a la app (los ejercicios, cada serie con su objetivo, la carga de esa semana, RIR o RPE, las aproximaciones y, si el plan lo pide, la pregunta del esfuerzo), en un cuadro de solo lectura con los textos de la APK. | `vista-de-la-persona.tsx`, `editor.tsx` |
| ET2-13 | **Selectores y campos parejos** en el editor de Entrenamiento y sus cuadros: 44 px, la letra del cuerpo, la flecha de BE con su lugar, el texto largo con «…»; las filas compactas de la planilla y de los bloques, también a 44 px. Se borraron `plan-y-fases.tsx` y `notacion-del-plan.tsx` (ET1-D20). | `globals.css` (bloque DL-198), `letra-de-la-sesion.ts` |
| ET2-14 | **Las fases de más, también en el cuadro «Antes de activar»:** el impedimento con sus dos salidas, «Llevar el plan a N semanas» y «Recortar la última fase» (pedido de la revisión de #324). | `cuadro-antes-de-activar.tsx`, `renglon-de-aviso.tsx` (`acciones`), `editor.tsx` (`accionesDeLasFasesDeMas`) |
| ET2-15 | **Un plan activo con fases de más avisa:** desde la tanda 1 nada se ubica después del fin del plan, y la persona deja de ver lo que queda afuera; en «Plan activo», un renglón lo dice con lo que se puede hacer (una versión nueva). | `plan.tsx` (`FasesDeMasEnElPlanActivo`) |

## 2. El contrato

- **API-RMX-01** `GET /advisees/{adviseeId}/training/one-rep-max?exerciseIds=…` (de 1 a 60) y **API-RMX-02** `POST` en la
  misma ruta (con `Idempotency-Key`), familia propia de BE. RMX-02 es una unión por `origin`: `CALIBRATION` (la serie; BE
  hace la cuenta), `DECLARED` (el valor) o `RECORD` (cuál: ejecución, prescripción y serie; BE lo vuelve a leer y a
  calcular, y si ya no es el último, 422 `RECORD_NOT_CURRENT`). Fuera de rango, 422 con el motivo; fecha futura, 422
  `DATE_IN_FUTURE`. Los permisos, los de la serie observada: el PDP de Entrenamiento, y lo ajeno es el 404 de lo
  inexistente.
- **API-ESF-01** `POST /training/executions/{executionId}/session-effort` (la persona, con `Idempotency-Key`; uno por sesión:
  409 `RESOURCE_CONFLICT` con `SESSION_EFFORT_ALREADY_RECORDED`) y **API-ESF-02** `GET
  /advisees/{adviseeId}/training/session-efforts?periodStart&periodEnd` (el profesional, hasta 366 días).
- **API-EJE-06** `PUT /training/exercises/{exerciseId}/classification` (con `expectedClassificationVersion`). API-EJE-01 suma,
  opcionales, `classification` y `classificationVersion`.
- **API-SER-02** suma, opcionales y con capacidad: `week` (`training-week-load-1`) y `askSessionEffort`
  (`training-session-effort-1`). **Las cargas de la semana van en los campos de siempre** (ET2-D07).
- **`planning.askSessionEffort`** (`true` o ausente) en la planificación del plan. Las plantillas (API-TPL-01, 04, 10 y sus
  lecturas) suman `planning`, opcional (`PlanificacionDeLaPlantillaSchema`: sin `startDate`, `goal`, `privateNotes` ni
  `favoriteCharts`).
- **Migraciones aditivas:** `20261125125900_tipo_de_evento_del_uno_rm` (el valor `UnoRMDeReferenciaSumado`, aparte porque
  PostgreSQL no deja usarlo en la misma transacción) y `20261125130000_uno_rm_y_esfuerzo_de_la_sesion`: las tablas
  `uno_rm_de_referencia` y `esfuerzo_de_sesion_de_entrenamiento`, **de solo agregar** (ni UPDATE, ni DELETE, ni TRUNCATE),
  con sus restricciones; y la columna `planificacion` (nula) en las versiones y las preparaciones de las plantillas.
- La exportación de la persona suma `entrenamiento.esfuerzosDeLaSesion`.
- `docs/api/openapi.json` regenerado.

## 3. Decisiones a ratificar (ET2-D01 a ET2-D17)

| Id | Decisión |
| --- | --- |
| ET2-D01 | **El 1RM de referencia es `BE-E1RM` v2 (`EPLEY_V2`)**, un método nuevo con su identidad, para las cargas en % RM. **La «Fuerza estimada» de DL-171 (v1, la lista de seis) no cambia**: pasarla a la v2 es otra decisión. Ninguno es un máximo probado ni una marca. |
| ET2-D02 | **El valor se muestra al medio kilo** (a la libra en lb), con la cuenta exacta de Epley en enteros, la misma que la v1: 32,5 × (1 + 12/30) = 45,5. |
| ET2-D03 | **El que usa BE es el más reciente** entre lo guardado (calibración, declarado o un registro elegido) y el último registro en rango. Si el registro es más nuevo y se aleja **más del 10 %** de lo guardado, BE sigue con lo guardado y avisa; «Usar el registro» lo guarda con origen `RECORD`. A igual fecha, lo guardado. Entre kg y lb no se compara ni se convierte. |
| ET2-D04 | **El registro** (decidido por Dirección: de 8 a 12 repeticiones a RIR 0 a 2): solo series efectivas que escribió la persona (carga, repeticiones y RIR con procedencia `PERSON`, ED-70), no tildadas con lo del plan ni de una sustitución, de las sesiones de los planes de **este** profesional del último año; de la sesión más nueva, la de mayor carga (a igual carga, la primera), como la regla por sesión de la v1. **Ojo:** 12 a RIR 2 son 14 repeticiones equivalentes, más que el tope de 12 de la v1. «Con barra» lo dice la clasificación (`BARBELL`); sin ella, el nombre. |
| ET2-D05 | **La calibración** admite de 1 a 12 repeticiones a RIR 0 a 2 (la ventana confiable de DL-171 R3) y una fecha que no sea futura. |
| ET2-D06 | **La semana que rige** una fecha: dentro de la fase, la suya; antes, la primera; después, la última (en una fase cortada por el fin del plan, la última que entra). El detalle del plan (API-TRN-09) usa la de hoy. Una fase sin fechas o sin progresión: la sesión de siempre. |
| ET2-D07 | **La compatibilidad, sin cambiar la forma:** la carga de la semana va a todos los clientes en los mismos campos (otros valores); la capacidad solo suma el rótulo (`week`) y la pregunta (`askSessionEffort`). Cómo se lleva la carga: lineal y doble, se corren todas las efectivas lo mismo (una pirámide sigue siendo pirámide); ondulante y descarga por carga, cada una por la misma parte, al paso; descarga por series, se van las últimas efectivas; las aproximaciones «Por porcentaje» se recalculan, las escritas a mano quedan. **Lo indicado de una sesión registrada es el de su semana**: la comparación de «Registros» compara con eso. El profesional (API-SER-01) sigue editando la base. |
| ET2-D08 | **La guardia del «%» de Entrenamiento** admite también el 1RM con su base («70 % de 39 kg») y la diferencia de un registro frente a lo guardado («15 % más que la calibración», «del valor guardado»). |
| ET2-D09 | **Cada profesional ve y suma lo suyo** con la persona, como las series observadas (DL-057); el registro sale de las sesiones de sus planes. Como la serie observada, el 1RM no va en la exportación de la persona (es una referencia del profesional). |
| ET2-D10 | **La planificación de una plantilla** lleva las semanas, las fases, las aproximaciones, las progresiones, la intensidad y el esfuerzo de la sesión; no la fecha de inicio, el objetivo, las anotaciones, los favoritos **ni la notación** (RPE-D10 sigue: la plantilla no tiene notación). Al aplicarla, cada fase y cada ejercicio pasan al suyo **por su lugar** en la estructura; lo que no tiene lugar se poda. Un cambio solo de la planificación es una versión nueva de la plantilla. |
| ET2-D11 | **El esfuerzo de la sesión:** la escala de Foster (CR-10 adaptada), de 0 a 10 en enteros; los minutos del cronómetro («sin pausas») o escritos por la persona, o sin minutos (sin carga de la sesión). **Uno por sesión, no se corrige** (409). Va en su propia tabla y en una operación aparte, como la nota para tu profe: la ejecución registrada no cambia. Entra en la exportación de la persona. |
| ET2-D12 | **«Poner las cargas desde el 1RM»** escribe la carga común y saca las cargas propias de las efectivas (las aproximaciones quedan), y deja en la referencia del % RM el 1RM con su origen («1RM 39 kg · calculado en la calibración del 25 nov»), que la persona ve en su plan. Si el 1RM cambia, el renglón dice que no coinciden y ofrece «Recalcular»: nada cambia solo. |
| ET2-D13 | **«Ver como la persona»** es un cuadro de solo lectura en la cabecera de la sesión elegida, con la sesión y la semana en desplegables; muestra lo del editor aunque no se haya guardado. También en una plantilla (sin persona). |
| ET2-D14 | **La clasificación de un propio:** el equipamiento en casillas (el principal y los apoyos); el grupo, el patrón y las articulaciones en desplegables con «Sin indicar». Con la versión que se vio (otra pestaña: 409). La de los ejercicios de BE no se edita acá: la cura Dirección en una migración. |
| ET2-D15 | **Los desplegables y los campos** del editor y sus cuadros, a 44 px, con la flecha de BE y su relleno (varias reglas viejas lo pisaban); las filas compactas de la planilla y de los bloques, de 40 a 44 px. |
| ET2-D17 | **Un plan activo con fases de más no se cambia** (está congelado, REG-06-112): se avisa en «Plan activo», en un renglón sin color de juicio, con la salida (una versión nueva con el plan más largo o la última fase más corta). En el cuadro «Antes de activar», las fases de más van primero, con las mismas dos salidas del panel, y el 422 de la API no se repite. |
| ET2-D18 | **RATIFICADA por Dirección el 2026-11-26, con un matiz (PR #329, tandas 6 y 8).** El % RM y la carga van atados con el 1RM en las dos direcciones (carga = 1RM × %, redondeada; % = carga ÷ 1RM, a 0,5 %); lo que se guarda como objetivo es el %. «Redondear las cargas a» en «Configurar plan» (automático, 1, 2,5 o 5; **2,5 por omisión**), con excepción por ejercicio en «Más opciones» (`loadRounding` y `loadRoundingByExercise`, opcionales, en la planificación); el automático es el redondeo de ET1-D06 (1 kg por debajo de 40 kg, solo ahí). **El matiz:** en el borrador las cargas en % RM siguen al 1RM: si cambia, se recalculan todas las del borrador, también las de los ejercicios plegados, en un solo cambio que se deshace («Se recalcularon N cargas con el 1RM nuevo»). **Al activar, el 1RM queda congelado** en la instantánea de la versión (`planning.oneRepMaxAtActivation`, con valor, origen, fecha y día de la activación; lo completa API-TRN-12; activar no cambia el contenido validado, REG-06-104): un 1RM posterior no cambia las cargas de la versión activa ni su vista («1RM 101,5 kg · el de la activación (26 nov)»). Rige para la versión siguiente: el borrador toma el vigente y, si difiere del congelado, recalcula y avisa («El 1RM de X cambió de 100 a 105 kg: las cargas se recalcularon»). Reemplaza, en el borrador, el «nada cambia solo» de ET2-D12. El encargo la llamó «ET2-D05», pero ese número ya era la calibración: queda como ET2-D18 (los mensajes de los commits de las tandas 6 y 7 dicen D05 y D06). |
| ET2-D19 | **A ratificar (PR #329, tanda 7).** Al cambiar la intensidad del plan, la casilla «Pasar los N ejercicios a…» (los que pierden el objetivo: % RM ↔ RIR o RPE) **viene marcada**: quien cambia la intensidad del plan espera ver el cambio. Entre RIR y RPE pasa solo, sin casilla: es la misma medida. El encargo la llamó «ET2-D06» (ese número ya era la semana que rige). |
| ET2-D16 | **`letraDeLaSesion`** pasó a `letra-de-la-sesion.ts`; `plan-y-fases.tsx`, `notacion-del-plan.tsx` y su CSS se borraron, y sus pruebas de fuente apuntan a lo que los reemplazó. |

## 4. Pruebas

- **Dominio** (`packages/domain/src/editor-de-entrenamiento-tanda-2.test.ts`): TEST-ET2-01 (la calibración y su cuenta),
  02 (el registro de la v2), 03 (el más reciente y el aviso), 04 (el % RM y su base), 05 y 06 (la carga de cada semana:
  lineal, doble, ondulante, descarga, aproximaciones, la semana que rige y el plan entero), 07 (el esfuerzo de la sesión),
  08 (las plantillas con su planificación) y 09 (las capacidades y el contrato de API-RMX-02).
- **Integración** (corre en la CI, `test/integration/editor-de-entrenamiento-tanda-2.int-spec.ts`): TEST-ET2-API-01 (la
  calibración, lo declarado, lo más reciente, lo que no se calibra y la base de solo agregar), 02 (el último registro, el
  aviso y elegir el registro), 03 (lo ajeno, la persona y lo inexistente: el mismo 404), 04 (la carga de la semana 3 para el
  titular en los mismos campos, el rótulo con la capacidad, la base para el profesional y **la última APK congelada sin
  rechazos**), 05 (el esfuerzo de la sesión), 06 (las plantillas) y 07 (la clasificación de un propio). Y
  `schema.int-spec.ts`: las dos tablas nuevas no se truncan.
- **Website** (`apps/web/test/editor-de-entrenamiento-tanda-2.test.mjs`): TEST-ET2-10 a 19. Se ajustaron las pruebas de
  fuente de la tanda 1, de las plantillas y del RPE que describían lo anterior.
- **APK** (jest, `apps/mobile/src/esfuerzo-de-la-sesion.test.ts`, 20 casos) y `scripts/historial-navegacion.test.mjs` (la
  pregunta es de una sola vez); `scripts/copy-pantallas.test.cjs` mira las pantallas nuevas.
- **Navegador** (`test/navegador/recorridos.mjs`, `editorTanda2`, TEST-ET2-NAV-01): un ejercicio en % RM al 70, la
  calibración con la cuenta en vivo, el renglón con su origen y su base, «Poner las cargas», «Pedir el esfuerzo de la sesión
  al terminar», «Ver como la persona» con 27 kg y la pregunta, y lo guardado por la API; capturas en los dos temas.
- Guardias: `contraste`, `acciones-y-ayudas`, `copy-pantallas`.

## 5. Lo que queda

- Ratificar ET2-D01 a ET2-D17; en particular, el umbral del 10 % (ET2-D03) y que 12 a RIR 2 entre en la v2 (ET2-D04).
- **La APK:** subir la versión y el `versionCode`, taggear `be-apk-<versión>`, congelar lo que lee con `node
  scripts/congelar-lo-que-lee-la-apk.mjs be-apk-<versión>` (DL-152), actualizar `VIGENTES` en `lecturas-de-la-apk.test.ts`,
  y probar en el teléfono contra test: una fase con progresión (el rótulo y las cargas de esa semana), un plan con el
  esfuerzo de la sesión (en vivo y en «Ya la hice»; «Ahora no»; los minutos cambiados quedan DECLARED; sin red, y el 409) y
  TalkBack en la grilla. La construye Elián.
- Mirarlo en pantalla, en los dos temas, a 1280, 1440 y 1920, y con un lector de pantalla: por la memoria del equipo no se
  corrieron localmente `tsc` de la API, del website ni de la APK, `next build` ni los recorridos; los corre la CI.
- Después: pasar la «Fuerza estimada» a la v2 si Dirección lo pide (ET2-D01), y corregir un esfuerzo de la sesión ya
  respondido (ET2-D11).

## 6. Revisión adversaria (2026-11-25)

- **El 1RM fuera de lo que guarda la base:** una calibración o un registro cuya cuenta da 0 (una carga de décimas) o más
  de 1000 respondía un 500 por la restricción `uno_rm_de_referencia_valor`. Ahora no calibra (422 `FUERA_DE_ESCALA`, junto
  a la carga) ni es el registro (`ESCALA_DEL_UNO_RM`).
- **El aviso del 10 %, con redondeo simétrico:** −10,5 % se decía «10 % menos»; ahora «11 % menos», como +10,5 % es «11 %
  más».
- **«No pude realizarla» no lleva el esfuerzo:** la app ya no lo pregunta después de una sesión no realizada, y API-ESF-01 la
  rechaza con 422 `SESSION_NOT_COMPLETED` (según lo que hoy rige: la última corrección o el original). Sin esto, el gráfico
  del profesional mostraba la carga de una sesión que no hubo.
- **Una plantilla sin cambios** (PLT-D10) se comparaba con `JSON.stringify` contra lo que devuelve JSONB, que ordena las
  claves a su manera: una edición sin cambios de una plantilla con planificación se guardaba como versión nueva. Ahora la
  comparación es canónica.
- **«Semana N de M» en una fase cortada por el fin del plan:** la «M» es la de las semanas que entran (la persona nunca ve
  las de afuera); la regla sigue con las semanas enteras de la fase (`semanasQueEntran`).
