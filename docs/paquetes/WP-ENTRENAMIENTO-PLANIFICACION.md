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
| C5 a C11 | Los días junto a cada sesión, el catálogo, la escritura rápida, de dónde sale cada valor, guardar y revisar encadenados, la pestaña semanal, «Sesiones vacías» | **tramo siguiente** (§6) |

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
  serie por vuelta. Que no coincidan no impide activar: se dice en «Queda sin completar», con su lugar.
- **ENP-D06 · La APK instalada recibe lo de antes y no se le retiene nada.** A diferencia de DL-178, nada se registra ni se
  cuenta distinto: el registro sigue siendo por ejercicio. Sin la capacidad, la persona ve los mismos ejercicios en orden,
  sin el bloque; el editor lo dice en la ayuda del bloque. No hay migración de capacidades: no se registra ni se exige.
- **ENP-D07 · La APK nueva** muestra los ejercicios agrupados bajo su bloque y, en uno «En vueltas», «Alterná estos 2
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
  por un momento; nunca afirma algo que el servidor no dijo.
- **ENP-D14 · El criterio arriba de las series:** el criterio (RIR o % RM, con su objetivo), la carga sugerida, la base de
  la carga y la de las repeticiones van en una franja arriba de la tabla de series, y la tabla no tiene desplazamiento
  propio en el trabajo principal.
- **ENP-D15 · Cada «Agregar» dice qué agrega:** «Agregar fase», «Agregar sesión», «Agregar bloque», «Agregar ejercicios».
- **ENP-D16 · Copiar y editar varias series, a la vista.** «Copiar…» va al lado de «Duplicar» en cada ejercicio abierto (el
  ejercicio, su prescripción o sus series). «Seleccionar series» marca varias y abre una barra con lo que se escribe en
  todas: repeticiones (un número o un rango), carga, RIR y descanso, más «Copiar hacia abajo» y «Quitar».

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

## 5. Cómo se ve

Las capturas del editor en Claro y Azul noche, a 1280 × 800, 1536 × 730 (Windows al 125 %) y 1920 × 950, salen de la CI
(`.github/workflows/capturas-de-la-planificacion.yml`, con `EVIDENCIA/ENTRENAMIENTO-PLANIFICACION/herramientas/`).
Estados: implementado; verificado automáticamente; observado en captura (lo que diga el informe de la CI). Pendiente de
prueba manual: el teclado y el lector de pantalla en el editor, y la APK con TalkBack.

## 6. El tramo siguiente (C5 a C11, en este orden; nada de esto está a medias en el código)

5. **Los días en un solo lugar,** junto a cada sesión, con «Ver próximas fechas» a pedido (`agenda-del-plan.tsx`).
6. **El catálogo:** la selección a la vista y un pie fijo («Agregar 3 ejercicios a Sesión A»); crear o importar, bajo «No
   encuentro el ejercicio».
7. **La escritura rápida** con su rótulo, su interpretación y «Aplicar»; lo escrito sin aplicar se resuelve antes de
   salir; cambiar de RIR a % RM avisa y se puede deshacer.
8. **De dónde sale cada valor:** común a todas las series, propio de esta serie o sin indicar.
9. **Guardar y revisar encadenados,** con «Ir a…» al campo exacto y la vuelta a la revisión conservando el contexto.
10. **La pestaña semanal vacía** («Lo que trabaja la semana») se saca mientras no tenga datos.
11. **«Sesiones vacías»:** con una cantidad, arma A, B y C dentro de una fase inicial, sin pedir nombre ni propósito.
