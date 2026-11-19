# WP-ENTRENAMIENTO-PLANIFICACION — la fase, el bloque dentro de la sesión y el editor que no engaña

> **Las decisiones de Dirección (2026-11-18):** «Lo que hoy se llama "Bloque" pasa a llamarse "Fase"», «un nivel nuevo y
> opcional dentro de la sesión: el "Bloque"», con dos tipos («Seguido» y «En vueltas»), guardado como dato aditivo; las
> correcciones de la prueba de Elián (los presets, los menús, el aviso del plan) y once sugerencias aprobadas, en orden.
>
> Rama `wp-entrenamiento-planificacion`, desde `main` (e13a5583) **con #288 (DL-178, series de calentamiento) y #289
> (DL-179, contexto de la persona) adentro**: las tres tocan el mismo editor. Registro en `docs/DEUDA_LEGAJO.md`
> (**DL-181**; la 180 queda para `wp-nutricion-planificacion`). Las decisiones de continuador (**ENP-D01 a ENP-D16**) están
> **a ratificar**.

## 0. Lo que había

- **La jerarquía del plan** (09v10 §5-§6; B10-06 §8-§23): Bloque → Microciclo opcional → Sesión → Ejercicio → Serie. El
  «Bloque» era la etapa de varias semanas (el mesociclo). No había forma de agrupar ejercicios dentro de una sesión: una
  superserie o un circuito se escribían en una nota.
- **El precedente para un dato nuevo sin reescribir nada:** DL-178 (la clave ausente es el valor por omisión; solo se
  guarda lo que no es el de siempre; el interceptor saca el campo nuevo para el cliente que no declara la capacidad).
  **La condición de las APK instaladas:** DL-152 (validan con esquemas estrictos; lo que leen se congela).
- **La prueba de Elián (18/11)** encontró tres cosas: «Usar» del preset de prescripción apagado con la sesión vacía (parecía
  roto), el menú «⋯» del bloque cortado por el panel izquierdo y «Todavía no hay un plan activo» ocupando un renglón alto.
- **«Nada impide activar»** se leía en el panel antes de que respondiera la revisión del servidor, también con una sesión
  vacía (`editor.tsx`, el paso 6 del asistente y la pestaña «Antes de activar»).

## 1. El alcance de esta rama

| Parte | Qué | Estado |
| --- | --- | --- |
| A | «Fase» en todas las pantallas del website y de la APK, con su ayuda | en esta rama |
| A | El «Bloque» dentro de la sesión: «Seguido» y «En vueltas», guardado como dato aditivo | en esta rama |
| A | La APK agrupa los ejercicios bajo su bloque y, en uno «En vueltas», lo indica en una línea | en esta rama |
| A | Las plantillas y las sesiones habituales conservan los bloques | en esta rama |
| B | Los presets de prescripción con la sesión vacía; los menús enteros; el aviso del plan, compacto | en esta rama |
| C1 | La revisión honesta | en esta rama |
| C2 | El criterio arriba de las series | en esta rama |
| C3 | Las acciones con el nombre del objeto | en esta rama |
| C4 | «Copiar» a la vista y la edición conjunta de series, con repeticiones y rangos | en esta rama |
| C10 | Sin la pestaña «Lo que trabaja la semana» mientras no tenga datos (era una línea) | en esta rama |
| C5 a C9 y C11 | Los días junto a cada sesión, el catálogo, la escritura rápida, de dónde sale cada valor, guardar y revisar encadenados, «Sesiones vacías» | **tramo 2** (§6) |
| §7 | Las bajas de la revisión adversaria que pesan para el profesional: el preset con la sesión vacía, el tope de «Agregar bloque», los bloques en la versión activa y en lo compartido | **tramo 2** (§6) |

## 2. El modelo de datos de los bloques (DL-181)

Una sesión puede tener bloques; si no tiene, es la lista de ejercicios de siempre.

```text
Sesión
  exerciseGroups?: [                       ← ausente o vacío: la sesión es una lista, como hoy
    { groupId, label, kind: SEQUENTIAL | ROUNDS,
      rounds?            (solo ROUNDS: 1 a 20, obligatorio),
      restAfterRoundSeconds? (solo ROUNDS: 0 a 3600, opcional) }
  ]
  prescriptions: [                          ← el orden de siempre: es el orden de la sesión
    { …, exerciseGroupId? }                 ← ausente: el ejercicio va suelto, como hoy
  ]
```

- **Los ejercicios siguen siendo una sola lista**, en el orden en que se hacen. El bloque es una marca encima: qué
  ejercicios van juntos y cómo. Todo lo que recorre las prescripciones (el registro, la comparación serie por serie, la
  instantánea, «La vez pasada», Analizar, la estimación) **no cambia**.
- **Lo que no tiene bloques no lleva las claves.** Una sesión sin bloques y un ejercicio suelto quedan idénticos a los de
  antes, con su huella de instantánea. Ningún dato se reescribe: no hay migración de base (los planes viven en el JSONB de
  la versión, de su instantánea y del borrador).
- **Las reglas al guardar** (API-TRN-10, 422 `TRAINING_PLAN_STRUCTURE_INVALID`):
  - el ejercicio nombra un bloque de su misma sesión (`EXERCISE_GROUP_UNKNOWN`);
  - los ejercicios de un bloque van seguidos, sin otros en el medio (`EXERCISE_GROUP_NOT_CONTIGUOUS`);
  - el identificador de un bloque no se repite en su sesión (`DUPLICATE_NODE_ID`).
- **Lo que falta para activar** (API-TRN-11 y 12): un bloque sin ejercicios (`EXERCISE_GROUP_EMPTY`) y uno «En vueltas»
  con menos de dos (`ROUNDS_GROUP_NEEDS_TWO_EXERCISES`).
- **La salida.** Para el cliente que declara `training-session-groups-1`, cada sesión sale con `exerciseGroups` (vacío si
  no tiene) y cada ejercicio con `exerciseGroupId` (`null` si va suelto), en API-TRN-09, 14, 14-PERIODO, 15 a 20, 19-LISTA
  y API-SER-01 y 02. Para el que no la declara, `SinBloquesDeLaSesionInterceptor` saca las dos claves en el borde: la APK
  instalada recibe exactamente lo de antes, los mismos ejercicios en el mismo orden.
- **Las reglas viven en un solo módulo:** `packages/domain/src/bloques-de-la-sesion.ts`, que usan la API, el website y la
  APK (las partes de la sesión, la indicación «En vueltas», la normalización y los problemas).

## 3. Decisiones de continuador (ENP-D01 a ENP-D16, a ratificar)

**A. La jerarquía**
- **ENP-D01 · «Fase» en pantalla; `blocks` en el contrato.** Renombrar `blocks`/`blockId` tocaría la API, el JSONB de cada
  versión y de cada instantánea (con su huella), la APK instalada, lo congelado de sus lecturas y el 09. El riesgo es alto y
  la persona no gana nada: se cambia solo lo que se lee. Las fases nuevas nacen «Fase 1»; las guardadas con «Bloque 1»
  conservan su nombre, que es un dato. La ayuda: «Una fase es un período de varias semanas con un objetivo».
- **ENP-D02 · El bloque de la sesión es una marca sobre la lista, no un nivel que la contiene** (§2). Anidar los ejercicios
  dentro de los bloques cambiaría la forma de todo lo que recorre una sesión y de lo que la APK instalada sabe leer.
- **ENP-D03 · En el contrato, `exerciseGroups` y `exerciseGroupId`;** en pantalla, «Bloque». Nombres propios para que el
  interceptor los saque sin tocar otra cosa (ninguna otra respuesta los usa).
- **ENP-D04 · Dos tipos:** `SEQUENTIAL` («Seguido», el que viene por defecto: un título, los ejercicios de a uno) y
  `ROUNDS` («En vueltas»: dos o más ejercicios alternados, con las vueltas y el descanso al terminar cada vuelta). Es un
  enum, como `setKind`, para sumar otros después. Sin «superserie» ni «circuito» en pantalla: la ayuda lo explica con un
  ejemplo.
- **ENP-D05 · Las vueltas y las series.** En un bloque «En vueltas», cada vuelta es una serie efectiva de cada ejercicio
  (el calentamiento de DL-178 va antes y no es una vuelta). Al cambiar las vueltas, el editor iguala las series efectivas
  de cada ejercicio (copia la última o quita las de abajo, con «Deshacer»); al agregar un ejercicio al bloque, nace con una
  serie por vuelta. Que no coincidan no impide activar: se dice en «Queda sin completar», con su lugar. Varios cambios de
  vueltas seguidos en el mismo bloque (con las flechas, la lista pasa por cada número) se deshacen juntos: «Deshacer»
  vuelve a como estaba antes del primero.
- **ENP-D06 · La APK instalada recibe lo de antes y no se le retiene nada.** A diferencia de DL-178, nada se registra ni se
  cuenta distinto: el registro sigue siendo por ejercicio. Sin la capacidad, la persona ve los mismos ejercicios en orden,
  sin el bloque; el editor lo dice en la ayuda del bloque. No hay migración de capacidades: no se registra ni se exige.
- **ENP-D07 · La APK nueva** (en «Hoy», el detalle de cada sesión del plan, «Ver rutina», el plan tal como se aceptó y «Ya la hice»; en este último, sin «Alterná…»: la persona ya lo hizo) muestra los ejercicios agrupados bajo su bloque y, en uno «En vueltas», «Alterná estos 2
  ejercicios · 3 vueltas · descansá 90 s al terminar cada vuelta». El registro sigue por ejercicio. La guía alternada paso a
  paso **no** va ahora.
- **ENP-D08 · Plantillas, sesiones habituales y copiar.** Las plantillas y las sesiones habituales guardan la estructura
  tal como entra: conservan los bloques. Duplicar un ejercicio lo deja en su bloque; copiarlo a otra sesión lo saca (el
  bloque es de la sesión). Duplicar o copiar una sesión se lleva sus bloques.
- **ENP-D09 · Los identificadores de los bloques los pone el editor** (como los de duplicar el día): el ejercicio nuevo
  nombra su bloque antes de tener identificador propio. Son únicos dentro de la sesión.

**B. Las correcciones**
- **ENP-D10 · El preset con la sesión vacía queda como prescripción de la sesión.** «Usar» se puede elegir siempre. Con la
  sesión vacía, el preset queda arriba de la sesión («Para los ejercicios que agregues: Fuerza 4×5 · Quitar») y se aplica a
  cada ejercicio que se agregue, salvo que el cajón traiga su propia prescripción. Vive en la pantalla, no en el plan: no
  es algo que la persona reciba.
- **ENP-D11 · Los menús salen enteros, por encima de los paneles.** El panel del menú se ubica respecto de la ventana (no
  del panel que lo contiene, que recorta lo que sobresale), abre hacia arriba si abajo no entra y no se sale por los
  costados. Vale para todos los menús de acciones.
- **ENP-D12 · «Todavía no hay un plan activo»** pasa a una etiqueta en la cabecera de la versión, junto a «La persona no
  la ve».

**C. Las sugerencias**
- **ENP-D13 · La revisión tiene cuatro estados, y dice cuál.** «Revisión pendiente» (no se pidió, o el borrador cambió
  después: la anterior deja de valer), «Revisando esta versión…», la lista de lo que falta con «Ir a…» y «Revisión
  terminada: no se encontraron impedimentos para activar». El panel pide la revisión sola cuando lo guardado no cambia
  por un momento; nunca afirma algo que el servidor no dijo. El título de la parte, «Revisión para activar», no afirma
  nada (lo dice el estado). «Revisar ahora» no guarda mientras otro guardado está en curso: queda apagado con su motivo,
  como «Guardar ahora». El cuadro «Antes de activar», sin la revisión de esta versión, está «revisando» y no deja activar.
- **ENP-D14 · El criterio arriba de las series:** el criterio (RIR o % RM, con su objetivo), la carga sugerida, la base de
  la carga y la de las repeticiones van en una franja arriba de la tabla de series, y la tabla no tiene desplazamiento
  propio en el trabajo principal.
- **ENP-D15 · Cada «Agregar» dice qué agrega:** «Agregar fase», «Agregar sesión», «Agregar bloque», «Agregar ejercicios».
- **ENP-D16 · Copiar y editar varias series, a la vista.** «Copiar» va a la vista en cada ejercicio abierto, junto a
  «Subir» y «Bajar» (el ejercicio, su prescripción o sus series); «Duplicar» sigue en «Más». «Seleccionar series» marca
  varias y abre una barra con lo que se escribe en todas: repeticiones (un número o un rango que el contrato admite: de 1
  a 1000, y que no termina antes de empezar), carga, RIR y descanso, y «Volver a lo general». «Copiar hacia abajo» sigue
  siendo Ctrl+D en cada celda, y «Quitar», el de cada serie: en la barra **no** están (§7).

**D. El tramo 2** (rama `wp-entrenamiento-planificacion-2`, sobre esta)
- **ENP-D17 · Una sesión nueva nace con su identificador.** «Agregar sesión» y el asistente le ponen a la sesión un
  identificador de nodo (`crypto.randomUUID()`), como ya hacía «Duplicar el día»: el contrato lo admite
  (`IdDeNodoSchema`) y el servidor lo conserva al normalizar. Sus días se eligen enseguida, sin esperar al guardado, y lo
  que la pantalla le ata la sigue aunque se mueva o se quite otra. Nada cambia en el contrato ni en lo que recibe la APK.
- **ENP-D18 · El preset con la sesión vacía vive en la pantalla, atado a la sesión, y lo dice.** Se recuerda por el
  `sessionId` (no por la posición: quitar o mover otra sesión le pasaba la etiqueta a la que quedaba en su lugar); una
  sesión sin identificador todavía (una habitual recién insertada) lo recibe al elegir el preset. El texto ya no dice
  «queda como su prescripción», que se leía como guardado: «Vive en esta pantalla: se escribe en cada ejercicio al
  agregarlo. Si cerrás o recargás el editor antes, no queda.» **Propuesta para Dirección (no se hizo):** guardarlo de
  verdad necesitaría un campo nuevo y opcional en la sesión del contrato (una prescripción por omisión que solo lee el
  website, con su capacidad de cliente como DL-178 y DL-181 para que la APK instalada no lo reciba). Mientras no se
  decida, la pantalla no afirma lo que no guarda.
- **ENP-D19 · La versión activa y el plan compartido agrupan bajo su bloque, y el bloque se describe.** Usan la regla del
  dominio (`partesDeLaSesion`, como el editor y la APK) por `bloques-en-la-lectura.ts`; un bloque sin ejercicios no se
  muestra. Lo leen profesionales (el que armó el plan y, en lo compartido, otros): el encabezado describe, no le indica a
  nadie: «En vueltas · se alternan 2 ejercicios · 3 vueltas · 90 s de descanso al terminar cada vuelta» (la APK le dice a
  la persona «Alterná…»). Uno «Seguido» lleva solo su nombre.
- **ENP-D20 · «Agregar bloque» tiene el tope del contrato** (20 por sesión): en el tope queda apagado, con el motivo a la
  vista («Una sesión admite hasta 20 bloques: para otro, quitá uno.»); y, como los otros topes (TB-48), uno pasado es un
  problema con su lugar antes de guardar.
- **ENP-D21 · «Ir a…» lleva al campo exacto** (C9; `ir-al-campo.ts`): el RIR de la serie 3, el objetivo del criterio, la
  casilla del calentamiento que quedó abajo, «Agregar serie» si no tiene ninguna, «Agregar ejercicios» si la sesión está
  vacía, «Agregar sesión» si la fase no tiene; primero por el código (lo que ve el editor) y después por la ruta (lo que
  dice la API). Si el campo exacto no está dibujado (el RIR por serie de un ejercicio sin el criterio RIR), el siguiente
  de la lista; el último es siempre el renglón del ejercicio. El foco espera a que el ejercicio esté abierto.
- **ENP-D22 · Volver a la revisión conserva el contexto** (C9): después de «Ir a…», arriba de la sesión queda «Volver a la
  revisión» mientras se corrige. Desde «Antes de activar», vuelve al cuadro con la fecha de la próxima revisión que se
  había elegido (antes se perdía); desde el panel, que a menos de 1440 está encima de la sesión y tapaba el campo, «Ir
  a…» lo cierra y volver lo abre en «Antes de activar». «Revisar ahora» sigue apagado con el autoguardado en curso (§7),
  y ahora lo dice a la vista: «la revisión se pide sola apenas termine» (guardar y revisar quedan encadenados: el
  autoguardado termina y la revisión se pide sola).
- **ENP-D23 · La escritura rápida tiene rótulo, lectura en vivo y «Aplicar»** (C7; `linea-de-prescripcion.tsx`): «Escritura
  rápida» a la vista, el ejemplo como «Ej.: …» (antes se leía como algo cargado), «Se lee: …» mientras se escribe y
  «Aplicar» al lado, apagado con su motivo mientras no haya qué aplicar o no se entienda; Enter sigue aplicando.
- **ENP-D24 · Lo escrito sin aplicar se pregunta, no se pierde** (C7; `escritura-rapida.ts`). Vive en el editor, por
  ejercicio (su identificador o su lugar, y pasa al identificador cuando un guardado se lo da; antes, ese guardado volvía
  a armar el ejercicio y lo borraba): plegar, ir a otra sesión o al paso 4 del asistente no lo borra, y plegado se dice
  («Escritura rápida sin aplicar: «…»»). No es parte del plan: no se guarda ni impide guardar. Pero el panel y «Antes de
  activar» lo listan con «Ir a…» a su línea, y no se activa sin resolverlo (aplicarlo o borrarlo); salir del editor o
  recargar pregunta.
- **ENP-D25 · Cambiar de criterio dice qué se quita y se puede deshacer** (C7; `cambio-de-criterio.ts`): «Al pasar a % RM
  se quitaron el objetivo RIR 2 y el RIR propio de 3 series. Falta escribir el objetivo de % RM.», con «Deshacer», que
  devuelve el criterio, el objetivo y el RIR de cada serie («Sin objetivo» incluido) y se ofrece mientras siga el criterio
  elegido (un guardado en el medio no lo retira). Sin nada que perder no se dice nada: no se suma una confirmación.
- **ENP-D26 · Los días se eligen en un solo lugar: los chips junto a cada sesión** (C5). Antes aparecían también en la
  tabla de «Días de entrenamiento», en la tira de la semana arriba de la sesión, en el renglón de cada sesión y en el
  selector de la sesión. Ahora el renglón dice solo lo que tiene la sesión y, al pie de la lista, «Desde el …» con «Ver
  próximas fechas», que abre arriba de la sesión lo que sale de los días: cuándo empieza, la semana con «Duplicar el día»
  (ED-24, que no se pierde: va adentro), las dos semanas que siguen con «Mover» y «Quitar los días». Sin días, una línea
  dice qué pasa. Con ENP-D17, una sesión nueva elige sus días enseguida.
- **ENP-D27 · El catálogo: los elegidos a la vista y un solo principal** (C6; `agregar-ejercicio.tsx`). En el pie fijo del
  cajón, «3 elegidos, en el orden en que entran:» con cada uno como ficha que se quita sin perder la búsqueda (con muchos,
  la lista se desplaza sola) y «Agregar 3 ejercicios a Sesión A» (o al bloque desde cuyo pie se abrió). «Crear un
  ejercicio propio» e «Importar desde wger» van en «No encuentro el ejercicio», al final de la búsqueda, plegado; sin
  resultados, abierto. Lo creado o importado queda elegido, como antes.

## 4. Las reglas, y dónde se prueban

| Regla | Prueba |
| --- | --- |
| Una sesión sin bloques se guarda igual que antes, sin claves nuevas | `packages/domain/src/bloques-de-la-sesion.test.ts` |
| Bloque desconocido, no contiguo o repetido: 422 al guardar | dominio y `test/integration/bloques-de-la-sesion.int-spec.ts` |
| Bloque vacío o «En vueltas» con uno solo: impide activar | dominio e integración |
| Lo viejo sigue igual: la misma huella, la misma respuesta | integración |
| Los bloques se guardan, se activan, quedan en la instantánea y se entregan | integración |
| La APK sin la capacidad recibe lo de antes (sin las dos claves) | integración |
| Las plantillas y las sesiones habituales conservan los bloques | integración |
| Las partes de la sesión y la indicación «En vueltas» | dominio y `apps/mobile/src/bloques-en-la-sesion.test.ts` |
| Los textos del editor (fase, bloque, revisión, acciones) | `apps/web/test/entrenamiento-planificacion.test.mjs` |
| Lo que corrigió la revisión adversaria en el editor (§7) | `apps/web/test/entrenamiento-planificacion.test.mjs` («Revisión · …») |
| La sesión de respaldo de la APK conserva el tipo de serie y los bloques | `apps/mobile/src/sesion-de-respaldo.test.ts` |
| Tramo 2: el preset atado a la sesión, el tope de bloques, las lecturas agrupadas y C5 a C9 y C11 | `apps/web/test/entrenamiento-planificacion-2.test.mjs` |

## 5. Cómo se ve

Las capturas del editor en Claro y Azul noche, a 1280 × 800, 1536 × 730 (Windows al 125 %) y 1920 × 950, salen de la CI
(`.github/workflows/capturas-de-la-planificacion.yml`, con `EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/`).
Estados: implementado; verificado automáticamente; observado en captura (lo que diga el informe de la CI). Pendiente de
prueba manual: el teclado y el lector de pantalla en el editor, y la APK con TalkBack.

## 6. El tramo siguiente (C5 a C9 y C11, en este orden; nada de esto está a medias en el código)

5. **Los días en un solo lugar,** junto a cada sesión, con «Ver próximas fechas» a pedido (`agenda-del-plan.tsx`).
6. **El catálogo:** la selección a la vista y un pie fijo («Agregar 3 ejercicios a Sesión A»); crear o importar, bajo «No
   encuentro el ejercicio».
7. **La escritura rápida** con su rótulo, su interpretación y «Aplicar»; lo escrito sin aplicar se resuelve antes de
   salir; cambiar de RIR a % RM avisa y se puede deshacer.
8. **De dónde sale cada valor:** común a todas las series, propio de esta serie o sin indicar.
9. **Guardar y revisar encadenados,** con «Ir a…» al campo exacto y la vuelta a la revisión conservando el contexto.
11. **«Sesiones vacías»:** con una cantidad, arma A, B y C dentro de una fase inicial, sin pedir nombre ni propósito.

## 7. La revisión adversaria (2026-11-19)

Se revisó solo lo propio de esta rama: no las series de calentamiento (DL-178) ni el contexto de la persona (DL-179), que
trae adentro, salvo lo que hereda de DL-178 en la APK.

**Lo corregido** (cada corrección con una prueba que queda en rojo sin ella):

| Severidad | Qué pasaba | Dónde quedó |
| --- | --- | --- |
| Media | La sesión de respaldo de la APK (API-SER-02 sin respuesta) perdía el tipo de serie (DL-178): un calentamiento se veía como «Serie 1», se numeraba entre las efectivas y se registraba sin su tipo | `apps/mobile/src/series-de-la-sesion.ts`, `sesion-de-respaldo.test.ts` |
| Media | El panel «Antes de activar» y el paso del asistente titulaban «⚠ Impide activar» arriba de «✓ … no se encontraron impedimentos» | `revision-del-plan.tsx` («Revisión para activar») |
| Media | «Revisar ahora» guardaba con el autoguardado en curso: dos guardados con la misma versión de base, un conflicto falso (409) | `editor.tsx` (`motivoSinRevisar`) |
| Media | El cuadro «Antes de activar», recién abierto y sin la revisión de esta versión, decía «Nada impide activar» y dejaba «Activar» encendido hasta que llegaba la revisión | `editor.tsx` (`revisando`) |
| Media | «Ir a…» un bloque sin nombre abría el nombre de la sesión | `bloques-del-editor.ts` (`destinoDelProblemaDelBloque`) |
| Media | Cambiar las vueltas con las flechas pasa por cada número y «Deshacer» volvía solo al paso anterior: las series que quitó el primero se perdían | `bloques-del-editor.ts` (`deshacerTrasCambiarLasVueltas`) |
| Media | «Lo que cambia frente a la vigente» no miraba los bloques: cambiar solo el descanso de las vueltas, o pasar de «En vueltas» a «Seguido», decía «No cambia nada frente a la vigente» | `comparar-versiones.ts` |
| Media | La edición conjunta (y la celda) leían «12-8» o «0-10» como un rango bueno: se escribía en todas las elegidas y el guardado automático fallaba en el servidor sin nombrar el lugar | `planilla-de-series.ts` (`leerRepeticiones`) |
| Baja | El bloque de las capturas se llamaba «Torso» dentro de «Piernas A» | `EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/capturas.mjs` |

**Lo que se miró y está bien:** el interceptor está en los cinco controladores que entregan sesiones (los mismos de DL-178:
Entrenamiento —«Hoy», el plan, la instantánea aceptada, las plantillas—, por serie —lo que lee «Ya la hice»—, Analizar,
la historia anterior y lo compartido); las sesiones habituales (API-HAB) solo las lee el website, que declara la
capacidad. La huella de la instantánea es del servidor y no cambia al sacar las claves en el borde. Quitar el bloque no
deja `exerciseGroupId` colgando; subir, bajar, «Pasar a…», duplicar y quitar un ejercicio dejan los bloques seguidos. Los
`groupId` son de la sesión (las reglas miran solo la sesión), así que copiar una sesión o una plantilla con los mismos
identificadores no choca. Igualar las vueltas no toca el calentamiento. En la APK, un `exerciseGroupId` que la sesión no
tiene se muestra suelto, y el registro sigue por ejercicio. Los textos nuevos de pantalla ubican y no califican: ninguno
usa el vocabulario que B05 excluye.

**Lo que queda abierto (baja):**
- ~~El preset con la sesión vacía se recordaba por la posición de la sesión y se leía como guardado~~: **resuelto en el
  tramo 2** (ENP-D17 y ENP-D18).
- **La barra de «Seleccionar series» no tiene «Copiar hacia abajo» ni «Quitar»** (el documento los prometía): hoy son
  Ctrl+D en cada celda y el «Quitar» de cada serie. Decidir si van.
- ~~«Agregar bloque» no tenía tope y el bloque 21 lo rechazaba el servidor~~: **resuelto en el tramo 2** (ENP-D20).
- **Quitar un ejercicio no reordena los bloques** (un bloque que queda vacío no pasa al final, como lo guarda el servidor):
  solo pesa si se pierde la respuesta de un guardado (ED-61), que entonces puede leer un conflicto donde no lo hay.
- **La selección de series guarda posiciones:** si las series cambian desde afuera (las vueltas del bloque, la línea de
  prescripción), «Escribir en 3 series» puede contar posiciones que ya no están (escribe solo en las que existen).
- **Los menús fijos a la ventana** siguen a su botón aunque un panel interior lo haya desplazado fuera de la vista.
- **La revisión se anuncia en cada autoguardado** (`role="status"`: «Revisando esta versión…» y su resultado): verificar
  con un lector de pantalla si molesta y, si es así, anunciar solo el resultado.
- ~~La lectura de la versión activa y el plan compartido no agrupaban bajo su bloque~~: **resuelto en el tramo 2**
  (ENP-D19).
