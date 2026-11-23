# WP-EDITOR-ENTRENAMIENTO · El rediseño del editor de Entrenamiento (DL-196), partes A y B

**Estado:** PROGRAMADO en `wp-editor-entrenamiento-a` (PR en borrador, sin integrar). Las decisiones EE-D01 a EE-D17 están
**a ratificar** por Dirección. La parte B (progresiones y descargas, distribución por grupo muscular con la silueta,
frecuencia, equilibrios, estructuras, zonas a cuidar, filtro del catálogo por músculo y gráficos X/Y) va después, sobre el
marco que deja esta parte.

**Origen.** El recorrido de Dirección por el editor del plan de Entrenamiento del profesional (2026-11-23, observaciones E1
a E20): «la pantalla está muy sobrecargada»; «sacar la columna izquierda y hacerlo como Nutrición»; un almanaque mensual;
el panel derecho contextual; las aproximaciones calculadas por BE; ninguna traba por la versión de la app. «La estética es
primordial: altos estándares».

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. La jerarquía del plan sigue siendo Fase → microciclo
opcional → sesión → ejercicio → series (B10-06). El criterio de intensidad sigue siendo uno de dos (% RM o RIR); el RPE es
otra forma de escribir el RIR (DL-192). Las series de aproximación son las de calentamiento de DL-178 (`setKind:
WARM_UP`): se indican y se registran, y no entran en ninguna cuenta.

---

## 1. Requisitos (EE-01 a EE-12)

| Id | Requisito | Dónde |
| --- | --- | --- |
| EE-01 | **Dos columnas, como Nutrición.** Sin la columna izquierda: el centro se desplaza con la página (sin alto fijo, E1) y el panel contextual queda a la derecha desde 80 rem, pegado arriba con su propio desplazamiento. Cada acción aparece una vez («Agregar sesión», «Agregar fase»). El contexto de la persona se abre como cajón, por encima, sin comprimir el editor. | `training/editor.tsx`, `globals.css` (`.editor-de-entrenamiento__zonas`), `contexto/panel-de-contexto.ts` (`modoDelPanelEnElArea`) |
| EE-02 | **Las fases en desplegables ordenados**, cada una con su número y su color: nombre, semanas (con sus fechas), objetivo, anotaciones privadas, los días de la semana con qué sesión va cada día y las sesiones con sus ejercicios. «Agregar fase» y «Copiar la fase anterior», al pie. El nombre de una fase nueva no se repite (E6). | `training/editor.tsx`, `training/plan-y-fases.tsx`, `training/fases-del-plan.ts` |
| EE-03 | **El plan, arriba:** inicio, duración en semanas o fin (uno sale del otro), objetivo general, anotaciones privadas y la notación del esfuerzo. | `training/plan-y-fases.tsx` (`DatosDelPlan`) |
| EE-04 | **El almanaque:** un mes de lunes a domingo, cada semana del color de su fase (el renglón entero), los días de sesión con un círculo y su letra, flechas para cambiar de mes, tocar un día lleva a la sesión; «Abrir grande», tres meses. Una tabla con título, encabezados de columna y botones con su fecha entera; ← y → pasan de un día de sesión al otro. | `training/almanaque.tsx`, `planificacion-del-plan.ts` (`mesDelAlmanaque`) |
| EE-05 | **El panel contextual:** según el foco (plan, fase, sesión o ejercicio) muestra su herramienta, con «Abrir grande». Plan, fase y sesión: el almanaque. Ejercicio: la carga en el tiempo (si ya hay datos) y «La vez pasada»; grande, el cuadro de «La vez pasada» con el historial del ejercicio y sus gráficos. Abajo, «Otras áreas» (solo si tiene algo) y «Patrones», a pedido. El registro de herramientas deja nombradas las de la parte B. | `training/panel-contextual.ts`, `training/panel-del-editor.tsx` |
| EE-06 | **«Antes de activar» al lado de «Revisar y activar»**, ya no como pestaña: «4 cosas impiden activar ›» despliega la lista (lo que impide y lo que queda sin completar), cada cosa con su «Ir a…». | `training/lo-que-impide-activar.tsx` |
| EE-07 | **Las aproximaciones**, antes de las efectivas: carga de trabajo, cuántas, «Por porcentaje» (BE las calcula, con la base a la vista y las repeticiones que bajan) o «A mano»; el redondeo de a 1, 2,5, 5 o 10, con el de su implemento por omisión. En la tabla van agrupadas arriba, en un tono más suave, rotuladas A1, A2…; la casilla dice «Aproximación» (ya no «C»). | `training/aproximaciones.ts`, `training/aproximaciones-del-ejercicio.tsx`, `planificacion-del-plan.ts` |
| EE-08 | **Sin trabas por la versión de la app** (E3): ni el aviso «Todavía no podés activar este plan», ni el ítem de calentamiento en «Antes de activar», ni el 409 al activar, ni la retención de la entrega. Quedan solo los recortes de forma que necesita la APK 0.32 (§4). | API y dominio (§4), `training/editor.tsx` |
| EE-09 | **La planilla de series, compacta:** el criterio en un renglón con todas sus explicaciones en el «?» (con el RPE primero como escala de esfuerzo percibido y después su relación con el RIR, E16); la barra de varias series como frase («En las 2 series elegidas, poner [campo] en [valor] → Aplicar»); las acciones rápidas de carga (−5 · −2,5 · −1 · +1 · +2,5 · +5) y de descanso (−15 · −5 · +5 · +15 s); la máscara mm:ss en los tiempos («3» es 03:00; «130», 01:30); la marca «común» arriba de la celda (E14) y el menú de cada celda discreto hasta que se usa. | `training/ejercicio-del-editor.tsx`, `training/mascara-de-tiempo.ts` |
| EE-10 | **Ningún botón subrayado** (E2): los «Ir a…» de listas y avisos van como `boton--discreto` con flecha (`boton--con-flecha`); el subrayado queda para un enlace dentro de una frase. La guardia lo exige. | 16 botones en Nutrición, Entrenamiento y Recetas; `scripts/acciones-y-ayudas.test.cjs` |
| EE-11 | **El «?» en la esquina** para todo «Qué es…» (E4): la fase, el bloque, las sesiones vacías, el preset de la sesión, las aproximaciones, el criterio y la barra de varias series. | varios |
| EE-12 | **La planificación se guarda** en el contenido de la versión (`planning`), por API-TRN-10, y se lee en API-SER-01; nunca en una lectura del titular ni en la exportación de sus datos. La agenda de «Hoy» pone cada sesión en las semanas de su fase. | `contratos-entrenamiento.ts`, `planes.service.ts`, `series.service.ts`, `agenda-del-asesorado.ts`, `derechos/exportacion.ts` |

## 2. El contrato

- `PlanificacionDelPlanSchema` (estricto): `startDate`, `weeks` (1 a 104), `goal`, `phases[]` (`blockId`, `weeks` de 1 a
  52), `warmUps[]` (`prescriptionId`, `mode` `FROM_WORKING_LOAD` o `MANUAL`, `workingLoadShares` de 5 a 95, `step` 1, 2,5, 5 o 10) y
  `privateNotes` (`plan`, `phases[]`).
- API-TRN-10: `planning` opcional. Ausente, la que había (podada); `null`, se quita; un valor se guarda podado: lo que
  nombra fases o ejercicios que ya no están se va (`planificacionPodada`). Sin migración: va en el JSON de la versión, como
  `effortNotation` (DL-192) y la agenda (DL-137).
- API-SER-01: `planning` (o `null`), solo para el profesional autor. Sin `setTargetsDelivery` ni `setKindsDelivery`.
- La instantánea al activar la conserva (el profesional la sigue leyendo en la activada) y la sucesora la hereda.
- La exportación de la persona saca `contenido.planning.privateNotes`.
- `docs/api/openapi.json` regenerado.

## 3. Decisiones a ratificar (EE-D01 a EE-D17)

| Id | Decisión |
| --- | --- |
| EE-D01 | El plan tiene inicio y duración en semanas; el fin sale de los dos. Escribir el fin cambia la duración, contando la última semana aunque esté incompleta. La agenda empieza con el plan: cambiar el inicio mueve el de la agenda (y quita los cambios de día anteriores al inicio, que la API rechazaría). |
| EE-D02 | (Decidido por Dirección: las fases por semanas.) Las fases van una detrás de la otra desde el inicio del plan. Una fase sin semanas no tiene fechas, y las que siguen tampoco. Con fechas, cada sesión va solo en las semanas de su fase (también en «Hoy» de la persona); sin fechas, todas las semanas, como antes. Si las fases suman otra cosa que el plan, se dice («Las fases suman 6 de 8 semanas»): no se impide. |
| EE-D03 | El paso del redondeo por omisión sale del implemento, que la v1 del catálogo no guarda: se deduce del nombre y de la base de carga. En kg: máquina de placas o polea, 5; barra o discos, 2,5; mancuernas de hasta unos 10 kg, 1 (más pesadas, 2,5); lo demás, 2,5. En lb: máquina, 10; mancuernas de hasta 25 lb, 2,5; lo demás, 5. |
| EE-D04 | Los porcentajes propuestos por cantidad: 1 → 60; 2 → 50/75; 3 → 40/60/80; 4 → 40/55/70/85; 5 → 35/50/65/75/85; 6 → 30/45/55/65/75/85. Las repeticiones: 5; 6/3; 8/5/3; 8/5/3/2; 10/8/5/3/2; 10/8/6/4/3/2. Ninguna aproximación llega a la carga de trabajo ni baja de un paso, y no bajan de una a la siguiente. |
| EE-D05 | «Por porcentaje» no pisa nada solo: si la carga de trabajo cambia en otro lado o se toca una aproximación, se dice («ya no coinciden») con «Recalcular» y «Dejarlas a mano». La carga de trabajo es la común de las efectivas. |
| EE-D06 | Las anotaciones privadas viven en la planificación de la versión: el profesional las lee en el borrador y en la activada; la sucesora las hereda; la persona no las ve en ninguna lectura ni en la exportación de sus datos. «Copiar la fase anterior» no las copia. |
| EE-D07 | El objetivo general se guarda con la planificación y hoy lo ven el profesional y la exportación de la persona; la APK 0.32 no lo muestra (su esquema estricto no lo conoce). El objetivo de cada fase es su propósito de siempre (`purpose`), que la persona ya recibe. |
| EE-D08 | En el almanaque, una semana partida (un plan que no empieza un lunes) toma el color de la fase que cubre más días; seis colores (`--fase-1` a `--fase-6`, en los dos temas) y después se repiten; la fase se nombra en la leyenda y en el título de la semana. Tocar un día con dos sesiones lleva a la primera. |
| EE-D09 | El foco del panel lo marca el centro con `data-foco`; un ejercicio recién agregado (sin el ejercicio del catálogo todavía) muestra el almanaque hasta que se guarda. «Patrones» se abre a pedido; «Otras áreas» no ocupa nada si no tiene datos. El panel no tiene pestañas. |
| EE-D10 | «Antes de activar» es un botón discreto en la barra, antes de «Revisar y activar»: dice cuántas cosas impiden, «Revisando lo guardado…», «Sin revisar todavía» o «Nada impide activar». La lista se despliega encima de la página; Escape la cierra; «Volver a la revisión» la vuelve a abrir. |
| EE-D11 | En Entrenamiento, el contexto de la persona se abre siempre como cajón (Nutrición sigue al costado desde 1680 px). |
| EE-D12 | La máscara de tiempo: al entrar al campo se elige todo y la primera cifra empieza de nuevo; con 1 o 2 cifras, minutos; con 3 o 4, mm:ss; Borrar saca la última cifra; pegar «2:30» o los segundos se entiende como antes. |
| EE-D13 | Las acciones rápidas no se llevan el foco (el campo sigue siendo el que se edita) y no están en el orden de Tab: con el teclado siguen las flechas (↑ y ↓; con Mayúsculas, cuatro pasos). En lb, los mismos pasos. |
| EE-D14 | En la guardia de textos de Entrenamiento, un «%» se admite como «% RM» o como «% de la carga de trabajo» (la base de una aproximación). El modo se llama «Por porcentaje» en pantalla. |
| EE-D15 | Capacidades que quedan (§4): `training-set-kinds-1`, `training-session-groups-1` y `training-effort-notation-1` moldean la forma para la APK 0.32; `training-set-targets-1` ya no decide nada (la APK la declara igual); `forms-format-3` y `pending-steps-texts-1` no son de los planes y no se tocaron. La tabla `capacidad_de_cliente_declarada` queda en desuso, sin migración destructiva. |
| EE-D16 | La guardia de acciones es más estricta (E2): un `<button>` nunca lleva `boton--enlace`, y uno con `data-navega` es `boton--discreto`; la flecha es decorativa (`content: '›' / ''`). |
| EE-D17 | La ayuda de primer uso del editor cambió con la forma: su clave pasa a `v2` y se muestra una vez más. El paso «Sesiones y días» del recorrido guiado (DL-195) ahora se ancla en las sesiones de la fase abierta y dice que los días se eligen en la fase. |

## 4. Sin trabas por la versión de la app (E3)

**Se sacó:** el 409 `CLIENT_CAPABILITY_REQUIRED` al activar (API-TRN-12) por objetivos por serie o por series de
aproximación; la retención de la entrega (el 404 o «no disponible») en «Hoy», el período, la agenda, el detalle, abrir el
borrador y la sesión para registrar; el registro de lo que declara el cliente (`registrarDeclaracion`, `titularCapaz`,
`registrarRetencion`); `setTargetsDelivery` y `setKindsDelivery` de API-SER-01; en el dominio,
`COPY_COMPATIBILIDAD_DE_CLIENTES`, `COPY_CALENTAMIENTO_Y_LA_APP`, `planExigeObjetivosPorSerie`,
`prescripcionExigeObjetivosPorSerie` y `planTieneCalentamiento`; en el website, el aviso, el ítem de «Antes de activar» y
la nota de «la app anterior» de los bloques.

**Queda, porque la APK 0.32 lo necesita para leer:** las capacidades que moldean la forma (EE-D15). A un cliente que no
declara `training-set-kinds-1` le llega el plan sin `setKind` (vería las aproximaciones como efectivas): es lo que decidió
Dirección, y la APK 0.32 la declara. **Nutrición** no tenía ninguna traba por versión del cliente (su «capacidad» es la del
profesional en el Proceso).

## 5. Pruebas

- **Dominio** (`packages/domain/src/planificacion-del-plan.test.ts`): TEST-EE-01 (fin y semanas), 02 (fechas de las
  fases), 03 (cada sesión en su fase, en la agenda), 04 (el almanaque), 05 (cambiar de mes), 06 (redondeo y cargas de las
  aproximaciones), 07 (el paso por implemento), 08 (la poda y las anotaciones), 09 (el contrato).
- **Website** (`apps/web/test/editor-de-entrenamiento.test.mjs`): TEST-EE-10 (máscara mm:ss), 11 (nombre de la fase nueva),
  12 (copiar la fase), 13 (lo que se escribe del plan), 14 (aproximaciones), 15 (el foco del panel y la carga en el tiempo),
  16 (el almanaque), 17 («Antes de activar»), 18 (cada acción una vez), 19 (el plan), 20 (el criterio y el RPE), 21 (varias
  series y acciones rápidas), 22 (palabras prohibidas, «volumen» incluida), 23 (el cajón del contexto). Se ajustaron las
  pruebas de fuente que describían la estación de tres zonas.
- **API, en la CI** (`test/integration/editor-de-entrenamiento.int-spec.ts`): TEST-EE-API-01 (guardar, podar, conservar,
  quitar y rechazar lo mal formado), 02 (la persona no ve la planificación ni las anotaciones, tampoco en la exportación),
  03 (lo ajeno es el 404 de lo inexistente). Las de compatibilidad, calentamiento, contrato y lecturas de la APK, ajustadas
  a que nada se traba.
- **Navegador, en la CI** (`test/navegador/recorridos.mjs`): `editorDeEntrenamiento` (TEST-EE-NAV-01: dos columnas, el
  plan, la fase, los días, el almanaque, tocar un día, «Antes de activar», copiar la fase, E1) y
  `aproximacionesPorPorcentaje` (TEST-EE-NAV-02: 8 × 25, 5 × 35 y 3 × 47,5 kg; de a 5; la máscara; +2,5 kg; «Recalcular»).
  Las capturas quedan en el artefacto `resultados-recorridos` de la corrida.
- Guardias: `acciones-y-ayudas` (más estricta), `contraste` (los seis colores de fase en los dos temas), `copy-pantallas`.

## 6. Mapa de las observaciones de Dirección (E1 a E20)

| Obs. | Qué pidió | Qué se hizo |
| --- | --- | --- |
| E1 | La página se desplaza más abajo del editor | EE-01: sin alto fijo; el centro va con la página y el panel queda pegado arriba. Nutrición ya era así. |
| E2 | «Ir a…» subrayado | EE-10 y la guardia (EE-D16). |
| E3 | El aviso de la versión de la app y el ítem del calentamiento | EE-08 y §4. |
| E4 | «Qué es una fase» en un renglón | EE-11. |
| E5 | Pantalla sobrecargada | EE-01, EE-09 y EE-11: sin la columna izquierda, ayudas al «?», campos compactos. Una pasada fina de densidad del resto del panel queda para mirar en pantalla con Dirección. |
| E6 | Dos «Fase 3» y el selector partido | EE-02: el nombre libre, y las fases en una lista ordenada con su número (el «…» va en la cabecera de la fase abierta). |
| E7 | Rediseño: dos columnas, fechas, duraciones, objetivos, almanaque, panel contextual, «Antes de activar» de última, «Otras áreas», el contexto que comprime | EE-01 a EE-06. **Parte B:** en RPE, la carga calculada para N repeticiones desde el RIR estimado; los gráficos favoritos del plan (GR-27). |
| E8 | El recuadro del criterio | EE-09. |
| E9 | «C» → serie de aproximación, calculada por BE | EE-07. |
| E10 | Varias series a la vez | EE-09. |
| E11 | Acciones rápidas | EE-09. |
| E12 | Progresiones y descargas | **Parte B.** |
| E13 | Cómo arma la rutina un entrenador (distribución por grupo) | **Parte B.** |
| E14 | «común 03:0(» y el desplegable de cada serie | EE-09: la marca arriba, la celda vacía sin «Sin indicar», el menú discreto. |
| E15 | Máscara mm:ss | EE-09 (EE-D12). |
| E16 | El RPE en la ayuda | EE-09. |
| E17 | La mini sección de aproximaciones | EE-07. |
| E18 | Gráficos X/Y de lo que se cambia | **Parte B.** En la parte A, la carga en el tiempo de un ejercicio en el panel. |
| E19 | Copiar una fase y aplicarle una progresión | Copiar: EE-02. La progresión al copiar: **parte B**. |
| E20 | Series por semana por grupo muscular, estructuras, la silueta | **Parte B** (el panel ya tiene el lugar: `HerramientaDeLaParteB`). |

## 7. Lo que queda

- Ratificar EE-D01 a EE-D17.
- Mirarlo en pantalla, en los dos temas, a 1280, 1440 y 1920 (con el zoom de Dirección), y con un lector de pantalla.
- La APK: mostrar el objetivo general del plan (EE-D07) y, si hace falta, las fechas de las fases.
- La parte B, sobre el panel contextual de esta parte.

---

# Parte B · Progresiones, distribución con la silueta y gráficos X/Y

**Estado:** PROGRAMADA en `wp-editor-entrenamiento-b` (PR en borrador, sin integrar). Las decisiones EE-D30 a EE-D43 están
**a ratificar** por Dirección. Una, EE-D34, es un **desvío del legajo decidido por Dirección** (REG-06-139; B10-06 §59):
queda en DEUDA_LEGAJO DL-196, y el legajo no se edita.

**Origen.** Las observaciones E7, E12, E13, E18, E19 y E20 del recorrido del 2026-11-23: las progresiones y las descargas
«no se encuentran»; copiar una fase y aplicarle una progresión; gráficos X/Y de lo que se cambia; la carga calculada para N
repeticiones; la distribución por grupo muscular y las estructuras, con la silueta («sacarle mucho jugo»); los gráficos
favoritos del plan (GR-27).

## 8. Requisitos (EE-20 a EE-27)

| Id | Requisito | Dónde |
| --- | --- | --- |
| EE-20 | **«Progresión…» en cada fase:** el botón en el desplegable de la fase y, al lado, la regla guardada en un renglón fijo («Lineal: +2,5 kg por semana · descarga en la semana 4 (60 % de la carga de trabajo)»). | `training/editor.tsx` (`fase-del-plan__progresion`) |
| EE-21 | **El asistente, corto:** el modelo (sin progresión, lineal, doble progresión u ondulante) como control segmentado, con sus campos en un renglón; la semana de descarga (por carga o por series), combinable; a toda la fase o a los ejercicios elegidos; «Usar la de…» otra fase; el «?» de la esquina con un ejemplo de cada modelo y otro de la descarga. **La vista previa antes de aplicar:** el gráfico X/Y (semanas en X, carga en Y, con la curva y el escalón de la descarga) y la tabla semana × ejercicio. | `training/asistente-de-progresion.tsx`, `progresiones.ts` (dominio), `training/progresion-del-editor.ts` |
| EE-22 | **Copiar la fase anterior + progresión (E19):** la copia abre el asistente; si la original tenía regla, viene traída y se puede «Arrancar donde terminó». | `training/editor.tsx` (`copiarLaFaseAnterior`, `aplicarLaProgresion`) |
| EE-23 | **El gráfico X/Y de un ejercicio (E7, E18):** en el panel del ejercicio, la carga por semana de su fase: lo planificado (punteado, con la regla), lo realizado (lleno) y el máximo estimado (Epley v1, rombos; huecos si son de la banda orientativa), con la franja de la descarga, la lectura con el teclado y «Ver la tabla». | `training/grafico-de-semanas.tsx`, `training/panel-de-la-parte-b.tsx` (`CargaPorSemana`) |
| EE-24 | **La carga para N repeticiones (E7):** repeticiones y RIR (o RPE, según la notación del plan); la carga, con la cuenta a la vista y los límites del método; sin datos, lo dice. | `cargaParaRepeticiones` (dominio), `CargaParaRepeticiones` |
| EE-25 | **«Distribución» (E13, E20):** en el panel de la fase o de la sesión, la silueta como mapa de calor de series por semana (al pasar el puntero, sobre la zona exacta: «Pectoral: 12 series por semana (de 3 ejercicios) · 2 días»), su escala, la tabla con la frecuencia (que es también lo del lector de pantalla y del teclado), los equilibrios, las zonas a cuidar y el acceso a las estructuras; «Abrir grande». | `distribucion-por-musculo.ts` (dominio), `components/figura-de-calor.tsx`, `DistribucionDeLaFase` |
| EE-26 | **Estructuras y catálogo por músculo:** el reparto semanal de cada estructura en la silueta, en la galería de presets; «Por músculo» en el catálogo de ejercicios: tocar un músculo (o elegirlo en la lista) busca los ejercicios que lo trabajan. Un ejercicio que trabaja una zona a cuidar da un aviso discreto en su panel, con su renglón reservado (RP-19). | `galeria-de-presets.tsx`, `training/agregar-ejercicio.tsx`, API-TRN-13-BUSQUEDA (`zoneId`), `AvisoDeZonaACuidar` |
| EE-27 | **Favoritos del plan (GR-27):** la estrella en la carga por semana, la progresión y la distribución; la vista «Favoritos» los dibuja con lo de hoy y, debajo, el enfoque de gráficos del plan («Patrones», que pasó ahí). | `progresion-del-editor.ts` (`conFavorito`), `training/editor.tsx` |

## 9. El contrato (parte B)

- `PlanificacionDelPlanSchema` suma, opcionales: `progressions[]` (`ProgresionDeLaFaseSchema`: `blockId`; `model`
  `LINEAR`, `DOUBLE`, `UNDULATING` o `null`; `loadStep` de 0 a 50; `repStep` de 0 a 5; `repRange` con `max > min`; `waves`
  de tres partes de 40 a 100; `deload` con `week`, `mode` `LOAD` o `SETS`, `workingLoadShare` de 40 a 95 y `setsRemoved`
  de 1 a 10; `prescriptionIds` o `null`; hasta 12) y `favoriteCharts[]` (`kind` `EXERCISE_LOAD`, `PHASE_PROGRESSION` o
  `PHASE_DISTRIBUTION`, e `id`; hasta 30). Sin migración: van en el JSON de la versión, como la parte A.
- `planificacionPodada`: la progresión de una fase que no está se va; la de ejercicios elegidos queda con los que siguen
  (si no queda ninguno, se va); los favoritos de lo que no está, también.
- API-TRN-13-BUSQUEDA (`POST /training/exercises/search`) acepta `zoneId`: solo los ejercicios que trabajan esa zona en su
  asignación vigente, como principal o secundaria; una zona que no es de las 17 es un 422 `INVALID_FILTER`.
- Presets de BE, versión 2: cada sesión de una estructura dice sus zonas típicas; se suma «Por grupo muscular · 5 días».
- `docs/api/openapi.json` regenerado.

## 10. Decisiones a ratificar (EE-D30 a EE-D43)

| Id | Decisión |
| --- | --- |
| EE-D30 | **La progresión es una regla de la fase, no series nuevas.** Hoy una sesión es la misma todas las semanas de su fase; la regla se guarda en la planificación (`progressions`) y se lee encima: en el editor, en la vista previa y en los gráficos. **La persona ve, por ahora, la carga de la sesión** (la base): la planificación solo viaja al profesional, así que la APK 0.32 no recibe nada distinto. La carga de cada semana le llega en una versión siguiente: el dominio ya la calcula (`semanasDelEjercicio`, `semanaDeLaFecha`) para «Hoy» y la sesión. |
| EE-D31 | **Los modelos.** Lineal: más carga y/o más repeticiones por semana. Doble: de `min` a `max` repeticiones, de a una por semana; al llegar arriba, más carga y vuelve a `min`. Ondulante semanal: pesada, liviana y media (100, 80 y 90 % de la carga de trabajo, por omisión), y se repite. Descarga: por carga (un % de la carga de trabajo de la semana anterior) o por series (n menos, nunca menos de una); la semana de descarga no cuenta para el modelo: la siguiente retoma donde quedó. Una regla por fase. |
| EE-D32 | **La base y el redondeo.** La base es la carga de trabajo (la común de las efectivas, EE-D05), las repeticiones de las efectivas (la cifra o el piso del rango) y sus series efectivas. Cada carga se redondea al paso del ejercicio: el de sus aproximaciones si se eligió y, si no, el de su implemento (EE-D03). Un aumento menor que el paso se ve redondeado en la vista previa: no se esconde. Un ejercicio sin carga escrita solo mueve repeticiones o series. |
| EE-D33 | **Copiar + progresión (E19).** «Copiar la fase anterior» abre el asistente para la copia; cerrarlo deja la copia como está. Con la regla de la original, viene traída (con sus ejercicios traducidos) y «Arrancar donde terminó» corre las cargas de trabajo de la copia a las de la última semana sin descarga de la original: todas las efectivas se corren lo mismo (una pirámide sigue siendo pirámide); las aproximaciones «Por porcentaje» dicen que ya no coinciden, con «Recalcular» (EE-D05). Sin semanas en la fase, el asistente las pide (4 por omisión) y las guarda. |
| EE-D34 | **Series por semana por músculo: desvío de REG-06-139 y B10-06 §59 («no se cuenta por zona») decidido por Dirección** (DEUDA_LEGAJO DL-196). Cada serie efectiva cuenta 1 en las zonas principales del ejercicio y ½ en las secundarias, por cada día de la semana en que va su sesión; una sesión sin días cuenta una vez y se dice; las aproximaciones no cuentan; un ejercicio sin zonas no suma y se dice. Son las zonas vigentes de la ficha visual (API-EJE-05), no las de la instantánea. El mapa usa cuatro niveles relativos al máximo de la fase, sin umbrales: ubica, no califica. **Frecuencia:** los días distintos en que se trabaja la zona (principal o secundaria); una sesión sin días es un día propio. |
| EE-D35 | **Los equilibrios.** Cuatro pares lado a lado, con barras enfrentadas en un tono neutro y sus series en texto: empuje (pectoral y tríceps) / tracción (dorsal, romboides y bíceps); cuádriceps / isquiotibiales; pectoral / espalda alta (romboides y trapecio); abdomen / erectores. El catálogo tiene un solo deltoides (REG-06-137, 17 zonas): el par deltoides anterior / posterior se mira con pectoral / espalda alta hasta que el catálogo de zonas los separe. El deltoides no entra en empuje ni en tracción (está en los dos). |
| EE-D36 | **La carga para N repeticiones.** Del último máximo estimado de la persona (el de la tarjeta, Epley v1, DL-171): máximo × 30 ÷ (30 + repeticiones + RIR), hacia abajo al paso de la barra (2,5 kg o 5 lb). El límite ratificado es el del método: hasta 12 repeticiones equivalentes y, de más de 10, orientativa. El RIR de destino no se limita a 2 (ese límite es el de lo que entra a la estimación). Con la notación RPE, el RIR es 10 − RPE (la escala anclada, DL-192). Solo los seis ejercicios de la lista v1; sin estimación, «no hay datos suficientes». |
| EE-D37 | **Las estructuras (E13).** Los presets pasan a la versión 2: cada sesión de una estructura dice las zonas que trabaja como principales en un reparto típico (no son ejercicios: ED-D2 sigue), y se suma «Por grupo muscular · 5 días» (pecho, espalda, piernas, hombros y brazos). Su reparto se dibuja en la silueta, en la vista previa de la galería; desde «Distribución», un botón abre la galería. Como todo preset de BE, Dirección los valida antes de publicarlos. |
| EE-D38 | **Los favoritos del plan (GR-27).** Viven en la planificación (`favoriteCharts`): la carga por semana de un ejercicio, la progresión o la distribución de una fase, hasta 30, con la estrella de cada gráfico; se podan con la estructura y la sucesora los hereda. No son gráficos del registro GR (son del editor, no de los datos de la persona): por eso no se guardan en un enfoque. La vista «Favoritos» los dibuja y, debajo, el enfoque GR-27 del plan («Patrones», que se movió ahí desde el pie del panel). |
| EE-D39 | **Las zonas a cuidar.** Del formulario más nuevo que responde `trn_zonas` con «sí» en `dolor_o_lesiones`: cada región declarada se lleva a los músculos que la rodean o la cargan (cuello → trapecio; hombros → deltoides; codos → bíceps, tríceps y antebrazo; muñecas → antebrazo; espalda alta → trapecio y romboides; lumbar → erectores; cadera → glúteos y aductores; rodillas → cuádriceps; tobillos → gemelos y tibial). «Otra» no se ubica. Van rayadas en violeta sobre la silueta y, en un ejercicio que las trabaja, con un aviso discreto en su panel. Ubica, no indica. |
| EE-D40 | **El panel tiene vistas** (enmienda de EE-D09, «sin pestañas»): en el plan, «Almanaque» y «Favoritos»; en la fase y la sesión, además, «Distribución» y «Progresión». Una por vez, como pestañas (← y →). En un ejercicio no hay vistas: el aviso, la carga por semana, la carga para N repeticiones y «La vez pasada», uno debajo del otro. |
| EE-D41 | **El catálogo por músculo.** API-TRN-13-BUSQUEDA filtra por `zoneId` en la asignación vigente (principal o secundaria); el filtro es del catálogo entero, con o sin texto (hasta 50). En el cajón, «Por músculo» abre la silueta tocable (y una lista de las 17 zonas para el teclado); los chips por zona de lo encontrado siguen como estaban. |
| EE-D42 | **La silueta.** Por ahora, la masculina (la femenina está en desarrollo; que el cuerpo salga del perfil queda pendiente). El puntero ubica la zona por la transparencia de su máscara (cada capa se lee una vez). Los niveles (`--calor-1` a `--calor-4`), la raya de las zonas a cuidar (`--zona-a-cuidar`) y el velo de la señalada (`--calor-senalada`) son tokens; van sobre el maniquí, que es el mismo en los dos temas, y la guardia de contraste los mide contra él. |
| EE-D43 | **El gráfico X/Y.** Lo planificado y lo realizado van en el mismo color y se distinguen por la forma (TB-03): punteado con puntos huecos contra línea llena; el máximo estimado, en el segundo color, con rombos. Lo realizado es lo más alto registrado en cada semana de la fase; sin fechas en la fase, no se ubica y se dice. La lectura de cada semana tiene su renglón reservado; el dibujo recibe el foco (← → Inicio Fin) y tiene su tabla. |

## 11. Pruebas (parte B)

- **Dominio:** `progresiones.test.ts` (TEST-EE-30 a 37: lineal, doble, ondulante, descarga, alcance y copia, contrato y
  poda, carga para N repeticiones, semanas en el calendario y textos) y `distribucion-por-musculo.test.ts` (TEST-EE-40 a
  44: el conteo 1 y ½, sin aproximaciones, sin días, sin zonas, la frecuencia, el calor, los equilibrios, las estructuras y
  las zonas a cuidar). En `prescripcion-rapida.test.ts`, los presets: versión 2 y ocho.
- **Website:** `apps/web/test/editor-de-entrenamiento-b.test.mjs` (TEST-EE-50 a 57: la base y la vista previa, arrancar
  donde terminó, la distribución desde la estructura, los favoritos, las vistas del panel, lo pedido por Dirección en la
  fuente y las reglas de pantalla).
- **API, en la CI:** `test/integration/editor-de-entrenamiento-b.int-spec.ts` (TEST-EE-API-10: progresiones y favoritos
  guardados y podados, lo mal formado rechazado y nada para la persona; TEST-EE-API-11: el buscador por zona y su 422).
- **Navegador, en la CI:** `progresionYDistribucion` (TEST-EE-NAV-03: el asistente con la descarga y la vista previa en
  los dos temas, aplicar y la API; la distribución en los dos temas, las vistas con el teclado, la estrella y «Favoritos»;
  el ejercicio con su carga por semana y la carga para N repeticiones) y, en `editorDeEntrenamiento`, la copia que ofrece
  la progresión. Las capturas quedan en el artefacto `resultados-recorridos`.
- Guardias: `contraste` (los cuatro niveles y la raya, sobre el maniquí), `acciones-y-ayudas` (el «?» en la esquina) y
  `copy-pantallas`.

## 12. Lo que queda (parte B)

- Ratificar EE-D30 a EE-D43 y, en especial, el desvío de EE-D34.
- La APK: mostrar la carga de cada semana (EE-D30) y el cuerpo según el perfil.
- Separar deltoides anterior y posterior en el catálogo de zonas, si Dirección quiere ese par (EE-D35).
- La silueta femenina, cuando esté.
- La pasada de densidad (E5) de todo el editor, mirando las capturas con Dirección.
