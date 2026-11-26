# WP-EDITOR-ENTRENAMIENTO-TANDA-1 · Las correcciones del editor de Entrenamiento (DL-197), tanda 1

**Estado:** PROGRAMADO en `wp-editor-entrenamiento-tanda-1` (PR en borrador, sin integrar). Las decisiones ET1-D01 a
ET1-D20 están **a ratificar** por Dirección. La **clasificación de los 186 ejercicios** del catálogo base es una
**propuesta, a validar por Elián**: `prisma/datos/catalogo-base/clasificacion-de-ejercicios.csv`.

**Origen.** Dirección (Elián, licenciado y entrenador) recorrió el editor rediseñado (DL-196, partes A y B), encontró
fallas (F1 a F25) y eligió, de un prototipo, una estructura nueva: «Fases del plan» con una barra horizontal, cuadros para
configurar y las sesiones como tarjetas. El 25/11 sumó una captura de la planilla con aproximaciones (30 kg de trabajo:
salieron 15, 25 y 25; columnas cortadas; el descanso común heredado). «La estética es primordial: altos estándares».

**Lo que no cambia.** El legajo (`docs/legajo/**`) no se edita. La jerarquía Fase → microciclo opcional → sesión →
ejercicio → series (B10-06), el criterio de intensidad por ejercicio (uno o ninguno) y el RPE como otra forma de escribir
el RIR (DL-192). Las aproximaciones son las series de calentamiento de DL-178. La APK 0.32 lee igual: nada nuevo le llega.

---

## 1. Requisitos (ET1-01 a ET1-14)

| Id | Requisito | Dónde |
| --- | --- | --- |
| ET1-01 | **«Fases del plan · 30 nov – 21 feb»**, con «Agregar fase» y «Configurar plan» a la derecha y el «?» en la esquina. Debajo, **la barra de fases**: cada fase es una tarjeta con su color arriba, su nombre, «Semanas 3–10» y «8 sem.», con un ancho proporcional a sus semanas; la elegida, resaltada; con muchas, se desplaza de costado; con el teclado es una lista de pestañas (← → Inicio Fin). Lo que pasa del fin del plan va rayado. | `training/barra-de-fases.ts`, `training/barra-de-fases-en-pantalla.tsx` |
| ET1-02 | **«Configurar plan»** (cuadro): inicio, duración en semanas o fin, objetivo, anotaciones privadas e intensidad del plan (ET1-10). Reemplaza la tarjeta del plan descuadrada (F1). | `training/cuadros-del-plan.tsx` |
| ET1-03 | **«Editar fase»** (cuadro, desde el botón junto al título de la fase): nombre y semanas, con «Al cambiar la duración, se ajustan las fechas de las fases siguientes», más su objetivo y sus anotaciones; al pie, «Duplicar fase», «Quitar fase» (con confirmación), «Cancelar» y «Guardar fase». | `training/cuadros-del-plan.tsx`, `training/editor.tsx` (`duplicarLaFase`) |
| ET1-04 | **«Días de la semana»** (cuadro): una matriz con todas las sesiones de la fase (su letra y su nombre, que se edita ahí) contra L a D; los círculos se prenden con la letra; las flechas se mueven por la tabla. En la fase queda la semana tipo en un renglón («A Lun · Jue · B Mar · Vie»). | `training/cuadros-del-plan.tsx` |
| ET1-05 | **Las sesiones de la fase como tarjetas** («A Torso · Lun · Jue»), la elegida resaltada y «Nueva sesión» al final. | `training/editor.tsx` (`tarjetasDeSesiones`) |
| ET1-06 | **F4 · fases de más:** no se activa (`PHASES_EXCEED_PLAN_WEEKS` al validar y al activar); el aviso a la vista en «Fases del plan» (renglón reservado) y, en «Antes de activar», un ítem con «Llevar el plan a N semanas» y «Recortar la última fase». Nada se ubica después del fin del plan: ni en el almanaque ni en la agenda de la persona. | `planificacion-del-plan.ts`, `plan-de-entrenamiento.ts`, `training/editor.tsx`, `training/revision-del-plan.tsx` |
| ET1-07 | **La planilla (F9 a F17):** al abrir un ejercicio, la planilla con «Común» y tres botones que abren cuadros: «Aproximaciones · 3» con «8 × 40 · 5 × 60 · 3 × 80 kg», «Editar todas las series» (lo vacío conserva su valor) y «Más opciones» (la intensidad, las bases, la escritura rápida, la referencia, las notas y los parámetros). La unidad, un chip kg/lb en el encabezado de la carga; la casilla «Aproximación» en su columna; los anchos por columna y el `colSpan` real; subir y bajar dentro de «Más»; el chevrón al extremo derecho y el resalte en toda la tarjeta. | `training/ejercicio-del-editor.tsx`, `globals.css` |
| ET1-08 | **F19 · los «?» con definición y ejemplo resuelto:** la fase, la semana tipo, la intensidad, las aproximaciones, la progresión, la carga para N repeticiones, el plan, «Editar fase» y «Agregar ejercicios». En los cuadros, en la esquina de la cabecera. | `training/ayudas-del-editor.tsx`, `components/cuadro-enfocado.tsx` (`ayuda`) |
| ET1-09 | **«Agregar ejercicios»**, cuadro central: el buscador «Buscar por ejercicio, músculo o equipo…»; los filtros Grupo muscular, Equipamiento, Patrón y Articulaciones; «Favoritos» (los habituales); la selección múltiple; cada renglón con el nombre, «Pecho · Barra · Multiarticular», la estrella y «Elegir»; el pie «N seleccionados · Cancelar · Agregar a la sesión». **Al abrir lista todo el catálogo.** | `training/agregar-ejercicio.tsx` |
| ET1-10 | **La intensidad del plan, elegida una vez:** RIR · RPE · % RM · Solo carga y repeticiones. Cada ejercicio la hereda; se cambia por excepción en «Más opciones». | `contratos-entrenamiento.ts` (`intensity`, `withoutIntensity`), `training/intensidad-del-plan.ts` |
| ET1-11 | **F23 · «Catálogo de BE» en «Mis ejercicios»,** con el selector de origen como el del Recetario. | `pro/exercises/catalogo-de-be.tsx`, `mis-ejercicios.tsx` |
| ET1-12 | **F25 · la clasificación del catálogo:** grupo muscular, equipamiento, patrón y articulaciones, guardados en su propia historia por adición (`clasificacion_de_ejercicio`; migración aditiva y siembra de los 186); los propios la aceptan opcional. | `prisma/migrations/20261125120000_clasificacion_de_ejercicios`, `scripts/catalogo-base/generar-clasificacion.mjs`, `clasificacion-de-ejercicios.ts` |
| ET1-13 | **El panel (F6 a F8):** las vistas como control segmentado compacto, con ícono y nombre entero; «Abrir grande» en su renglón; el almanaque fluido. «Carga para N repeticiones», si no aplica, en un renglón con su «?». Los gráficos de carga y de cantidades, desde 0. | `training/editor.tsx`, `panel-del-editor.tsx`, `panel-de-la-parte-b.tsx`, `grafico-de-semanas.tsx` |
| ET1-14 | **F18 · el renglón del profesional:** «+ 3 aproximaciones» y «repeticiones 8-8-6-6»; el de la APK, igual que antes. | `renglonDelEjercicio(…, { delProfesional: true })` |

**F2 y F3.** Las fases ya no se pliegan: se elige una en la barra y su contenido va debajo (F2 deja de aplicar). El
almanaque tiene su `.almanaque [data-fase='1']` y una prueba mira los seis colores (F3).

## 2. El contrato

- `PlanificacionDelPlanSchema` suma, opcionales: `intensity` (`RIR`, `PERCENT_RM` o `NONE`; RIR, la de siempre, no se
  escribe) y `withoutIntensity` (los ejercicios sin intensidad por excepción; se podan con la estructura). Sin migración:
  van en el JSON de la versión. La planificación solo viaja al profesional.
- `problemasDeCompletitud` suma `PHASES_EXCEED_PLAN_WEEKS` (`planning.phases`): validar lo informa y activar lo rechaza
  (422 `OPERATION_NOT_READY`). Se guarda igual.
- **La clasificación** (`ClasificacionDeEjercicioSchema`): `muscleGroup`, `equipment[]`, `movementPattern` y `joints`.
  API-TRN-13-BUSQUEDA acepta `withClassification: true` y entonces cada ejercicio trae `classification`; **sin pedirla, la
  forma de siempre** (la APK 0.32 busca con esta operación y su esquema estricto la rechazaría). API-INT-TRN-01 acepta
  `classification` opcional. API-TRN-13 (la legada) no cambia.
- Migración `20261125120000_clasificacion_de_ejercicios`: cuatro enums y la tabla `clasificacion_de_ejercicio`, una
  **historia por adición** como las zonas (DL-081): cada fila tiene su número y la vigente es la más alta; ni UPDATE, ni
  DELETE, ni TRUNCATE. El catálogo es append-only (la versión de un ejercicio no se modifica), por eso la clasificación no
  va en sus columnas. La siembra es la primera clasificación de cada ejercicio de wger, por su ítem externo. Generada (y
  verificada en la prueba) por `scripts/catalogo-base/generar-clasificacion.mjs` desde el CSV. **Corregirla con lo que
  valide Dirección es sumar la clasificación siguiente**, en una migración nueva.
- `docs/api/openapi.json` regenerado.

## 3. Decisiones a ratificar (ET1-D01 a ET1-D20)

| Id | Decisión |
| --- | --- |
| ET1-D01 | **Una fase por vez:** la barra elige la fase y su contenido va debajo (una pestaña). Por eso F2 (las fases que no se plegaban) deja de aplicar. |
| ET1-D02 | **Las tarjetas de las sesiones llevan la letra** (A, B, C…) y no el número del prototipo («1 Torso A»): es la misma marca del almanaque y de la matriz de días, y así una sesión se reconoce igual en las tres. |
| ET1-D03 | **Fases de más (decidido por Dirección: no se activa).** Nada después del fin del plan: una fase que lo cruza se corta en el fin y dice cuántas semanas quedan fuera; una que empieza después no tiene fechas y sus sesiones no van ninguna semana (sin esto, irían todas, también en «Hoy»). Las dos salidas: llevar el plan a la suma de las fases, o recortar la última fase con semanas (solo si le queda una semana por lo menos; si no, se dice). |
| ET1-D04 | **«Copiar la fase anterior» pasa a «Duplicar fase»** (en «Editar fase» y en el «⋯» de la fase): la copia va justo después de la original, con sus semanas, sus aproximaciones y los días de sus sesiones, y sigue ofreciendo la progresión (EE-D33). «Agregar fase» y «Configurar plan» van una sola vez, en la cabecera. |
| ET1-D05 | **Los cuadros escriben con su principal** («Guardar», «Guardar fase», «Guardar días»): lo de adentro es un borrador; cerrar con cambios pregunta. El de las aproximaciones escribe en vivo, como antes, porque la tabla de abajo lo muestra. |
| ET1-D06 | **El paso del redondeo, más fino con cargas chicas** (la captura del 25/11): con menos de 40 kg de trabajo, de a 1 (en una máquina, 2,5); en lb, con menos de 90, de a 2,5 (máquina, 5). Las mancuernas siguen su regla (EE-D03). |
| ET1-D07 | **Ninguna aproximación repite la carga de la anterior, ni iguala o pasa la de trabajo.** Si al redondear dos coinciden, la anterior baja un paso; si no entran todas entre un paso y la carga de trabajo, quedan menos (se van las más livianas). Se dice en el renglón reservado del cuadro. Con 30 kg, de a 1: 12, 18 y 24. |
| ET1-D08 | **Las aproximaciones no llevan RIR** (`rir: null`, «—» en la tabla) **y tienen su descanso propio, 60 s por omisión**, al calcularlas, al sumarlas a mano y al marcar una serie como aproximación. No heredan lo común de las efectivas. |
| ET1-D09 | **«Editar todas las series»** reemplaza la barra «Cambiar varias series»: elige las series (las efectivas, por omisión) y escribe solo lo que no se deja vacío. La carga desde la fuerza estimada para las elegidas (ED-76) sigue ahí. |
| ET1-D10 | **La intensidad del plan** se guarda como `planning.intensity` (y la notación RIR o RPE de DL-192). Al cambiarla, los ejercicios que ya tienen otra quedan como están, salvo que se marque «Pasarlos»: entonces quedan sin criterio propio (heredan la nueva, sin objetivo todavía) y sin el RIR de sus series. |
| ET1-D11 | **La herencia sin cambiar el modelo:** un ejercicio sin criterio propio muestra la columna de la intensidad del plan; escribir el objetivo en «Común» crea el criterio; vaciarlo vuelve a heredar. La excepción «Sin criterio de intensidad» se guarda en `planning.withoutIntensity`. Así, **un ejercicio nuevo no traba el guardado** por un objetivo vacío. |
| ET1-D12 | **La clasificación.** El grupo muscular es la categoría de wger (8: Pecho, Espalda, Piernas, Hombros, Brazos, Abdomen, Pantorrillas y Cardio); el equipamiento, el material de wger completado o corregido donde la nota dice «equipamiento propuesto»; el patrón (empuje, tracción, sentadilla, bisagra, zancada, core, cardio, otro) y las articulaciones (mono o multi), propuestos por BE con criterio de entrenador. Va en su propia historia por adición (`clasificacion_de_ejercicio`), no en la versión, que es inmutable. **Propuesta, a validar por Elián**: corregirla es sumar la clasificación siguiente, en una migración nueva. |
| ET1-D13 | **«Agregar ejercicios» lee el catálogo entero al abrir** (de a 50, con el cursor) y filtra en el navegador mientras se escribe. El texto busca en el nombre y en la clasificación. «Grupo muscular» reemplaza a la silueta «Por músculo» del cajón (el filtro por zona de la API, `zoneId`, queda). «Favoritos» son «Mis habituales»; la estrella los marca. Crear un ejercicio propio o importarlo de wger siguen en «No encuentro el ejercicio». |
| ET1-D14 | **Los ejercicios propios** aceptan la clasificación al crearlos («Mis ejercicios»), opcional. Cambiarla en uno ya creado queda para la tanda 2 (hoy no hay edición de un ejercicio propio). |
| ET1-D15 | **El renglón del profesional** (el plegado del editor) dice «+ 3 aproximaciones» y «repeticiones 8-8-6-6» (con rangos, «8–10 / 6–8»); el de la persona y la APK no cambia («de calentamiento», «repeticiones por serie»). |
| ET1-D16 | **El % RM va de 30 a 100.** Debajo de 30 no se guarda y se pregunta «¿Quisiste escribir un RIR?». |
| ET1-D17 | **Los gráficos de carga y de cantidades empiezan en 0** (GUIA-UX-UI II.16). Solo un gráfico del máximo estimado puede acercarse, y lo dice. |
| ET1-D18 | **El panel:** las vistas, un control segmentado con el ícono arriba y el nombre entero abajo; «Abrir grande», en su renglón; el almanaque, fluido. Sin desplazamiento de costado. |
| ET1-D19 | **«Carga para N repeticiones» que no aplica** (el ejercicio no está en la lista del método): un renglón, «no aplica a este ejercicio», con su «?»; sin campos. El pie del gráfico ya no lo repite. |
| ET1-D20 | **La regla de diseño** (GUIA-UX-UI II.16): los cuadros configuran; el panel lateral es para mirar. `plan-y-fases.tsx` (salvo `letraDeLaSesion`) y `notacion-del-plan.tsx` quedan sin uso en el editor; se borran en la tanda 2 con sus pruebas de fuente. |

## 4. Pruebas

- **Dominio:** `planificacion-del-plan.test.ts` (TEST-ET1-01: las aproximaciones de una carga chica, ninguna repetida, en
  todos los pasos y cantidades; TEST-ET1-02: las fases de más, el corte en el fin y las ventanas vacías);
  `recorridos-guiados.test.ts` (los textos nuevos).
- **Catálogo:** `scripts/catalogo-base.test.mjs` (TEST-ET1-03: los 186 con valores conocidos, el grupo igual a la
  categoría de wger y la migración igual a la que sale de la tabla).
- **Website:** `apps/web/test/editor-de-entrenamiento-tanda-1.test.mjs` (TEST-ET1-10 a 20: los seis colores de fase, la
  barra, la intensidad, las aproximaciones, la planilla, el renglón, el catálogo, los cuadros y sus «?», las fases de más,
  el panel y las palabras). Se ajustaron las pruebas de fuente que describían la estructura anterior.
- **API, en la CI:** `test/integration/editor-de-entrenamiento-tanda-1.int-spec.ts` (TEST-ET1-API-01: la clasificación
  solo si se pide, el catálogo entero por el cursor y los propios; 02: con fases de más no se activa; 03: la intensidad
  del plan).
- **Navegador, en la CI** (`test/navegador/recorridos.mjs`): `editorDeEntrenamiento` (TEST-ET1-NAV-01: la barra con el
  teclado, los tres cuadros con su «?», la matriz con las flechas, el almanaque, «Duplicar fase», y las fases de más: el
  aviso, lo rayado, «Antes de activar» con sus dos salidas y el 422 de la API), `agregarEjerciciosConFiltros`
  (TEST-ET1-NAV-02: todo el catálogo al abrir, los filtros, «Favoritos», la estrella y «Agregar a la sesión»),
  `aproximacionesPorPorcentaje` (en su cuadro; sin RIR y con su descanso), `progresionYDistribucion`, `notacionDelEsfuerzo`
  (desde «Configurar plan») y `sinSaltos`, ajustados. Las capturas quedan en el artefacto `resultados-recorridos`.
- Guardias: `contraste`, `acciones-y-ayudas`, `copy-pantallas`.

## 5. Lo que queda

- Ratificar ET1-D01 a ET1-D20 y **validar la clasificación de los 186** (las dudas, en la columna «nota» del CSV).
- Mirarlo en pantalla, en los dos temas, a 1280, 1440 y 1920, y con un lector de pantalla.
- La tanda 2: el 1RM numérico para el % RM, editar la clasificación de un propio, borrar `plan-y-fases.tsx` y
  `notacion-del-plan.tsx`.
