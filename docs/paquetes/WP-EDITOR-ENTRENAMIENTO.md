# WP-EDITOR-ENTRENAMIENTO · El rediseño del editor de Entrenamiento (DL-196), parte A

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
