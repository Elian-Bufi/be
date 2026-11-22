# WP-SIN-ASISTENTE-DE-NUTRICION · El plan de Nutrición sin el asistente de 7 pasos

> **La decisión de Dirección (22/11):** «El asistente de 7 pasos la verdad que lo sacaría, porque está muy engorroso, y le
> pusimos tanto esfuerzo a la forma normal que quedó muy bien, y hace anticuado el asistente ya».
>
> Rama `wp-sin-asistente-de-nutricion`, desde `main`. Registro: **DL-193** en `docs/DEUDA_LEGAJO.md`. Las decisiones de
> continuador (**SAN-D01 a SAN-D10**) están **a ratificar**. **El asistente de Entrenamiento no se toca:** Dirección todavía
> no lo probó. No se integra solo.

## 0. En criollo

En Nutrición ya no hay asistente. Un plan se empieza donde siempre, en la vista del plan: **«Crear nuevo plan»** (sin
plan activo, nace con un día tipo vacío), **«Nueva versión del plan»** (copia la activa), **«Empezar en blanco»** (con
una activa, una versión nueva sin copiarla: lo único de arrancar que solo tenía el asistente) o **desde una plantilla**. Y
se arma en el editor de siempre, que ya hacía todo lo de los pasos 3 a 7.

Del asistente se trajeron al editor las dos cosas del paso 2 que el editor no decía: el objetivo **con su versión y su
fecha** («Versión 3, vigente desde el martes 10 de noviembre») y el aviso de un objetivo viejo con macros **en proporción**
de las kcal. Y cuando hay un objetivo más nuevo que el que usa la versión en preparación, el aviso de siempre suma
**«Usarla ahora»**: antes, pasar al objetivo nuevo sin tocar nada más solo lo hacía el paso 2 del asistente.

Todo camino que llevaba al asistente lleva ahora a la vista del plan o al editor. Una dirección vieja con `asistente=N`
(un enlace guardado, el historial del navegador) abre la misma vista y se le quita ese pedazo.

Un borrador armado con el asistente se abre igual en el editor: el asistente no guardaba nada propio (ni en la API ni en el
navegador). Era el mismo borrador, con otra pantalla encima.

## 1. Lo que hacía cada paso, y adónde fue

| Paso del asistente | Lo que hacía | Dónde está ahora |
|---|---|---|
| **1 · Punto de partida** (en la vista del plan, sin borrador) | Tarjetas sin nada elegido: «Copiar el plan vigente» (con una activa), «Desde una plantilla» y «En blanco» (un día tipo vacío). «Siguiente» creaba la versión y seguía en el paso 2. Sin objetivo, un aviso: «el asistente empieza por la evaluación» | Vista del plan: «Nueva versión del plan» (copia la activa), «Empezar desde una plantilla» (el botón sin activa; el menú «Plantillas» con activa), «Crear nuevo plan» (sin activa, en blanco) y **«Empezar en blanco» (con activa, nuevo: SAN-03)**. Sin objetivo, los pasos de «Empezar el plan» (evaluación, objetivo y plan; DL-145), como siempre |
| **2 · Objetivo** | «Objetivo general»: la tira, las kcal que suman los gramos, lo que está en proporción y «Versión N, vigente desde…». «Escribir una versión nueva del objetivo» con el formulario de siempre (con los repartos habituales) y la versión en preparación pasaba a usarla | Editor, «Objetivo del día»: la tira y las kcal (ya estaban), **lo que está en proporción y la versión con su fecha (nuevo: SAN-04)**. La versión nueva del objetivo, con el mismo formulario, en el Resumen («Nueva versión de objetivo»); al volver, el aviso «Hay una versión de objetivo más nueva…» con **«Usarla ahora» (nuevo: SAN-05)** |
| **3 · Días tipo** | El nombre de cada día tipo, «Duplicar», «Quitar», «Agregar un día tipo» (hasta 7) y el rango del día | Editor: los días tipo en segmentos, su menú (duplicar, mover antes o después, quitar), «Agregar día tipo», el nombre y el rango del día en «Rangos y totales» |
| **4 · Comidas** | «Agregar una comida» (con su opción 1), el nombre, «Usar una comida habitual», el rango de cada comida y la suma de los rangos frente al objetivo | Editor: «Agregar comida ▾» (vacía o habitual), el nombre, el rango en cada comida y la suma como una línea del «Reparto por comida» (RP-19) |
| **5 · Opciones** | Las opciones de todos los días tipo a la vez, «Armar …» en el cuadro de la opción, «Agregar una opción de alimentos» (entraba al borrador recién al guardar el cuadro), «+ Opción de receta», «Copiar desde otra comida» y «Usar una comida habitual» | Editor, en cada comida: «+ Opción de alimentos», «+ Opción de receta», «⋯ → Copiar desde otra comida / Usar una comida habitual» y «Agregar ítem», que abre el mismo cuadro. Se mira de a un día tipo (SAN-D07) |
| **6 · Revisar** | Lo que impide activar y lo que queda sin completar, con «Corregirlo en el plan»; los rangos indicados y el reparto por comida de todos los días tipo | Editor: el panel en vivo (lo que impide y lo que falta, con «Ir a corregir»), «Rangos y totales» y «Reparto por comida» del día tipo que se mira, y «Antes de activar» con la lista entera |
| **7 · Activar** | «Revisar y activar…» | La barra del editor, el mismo botón, siempre a la vista |
| Todo el asistente | «Lo que llevás armado», «Paso N de 7», «Atrás», «Seguir en el plan», «Siguiente» que guardaba y esperaba | El editor muestra la estructura y cuenta las comidas de cada día tipo; guarda solo (autoguardado) y no deja salir con algo sin guardar (salida segura) |

## 2. Alcance

| ID | Qué | Dónde |
|---|---|---|
| SAN-01 | Se retiran las piezas del asistente de Nutrición: sus pasos y su paso 1, sus textos, el paso sugerido y «Lo que llevás armado». El armazón común (`asistente/`) queda para Entrenamiento | `nutrition/pasos-del-asistente.tsx` y `nutrition/asistente-de-nutricion.ts` (borrados); `asistente/asistente.tsx` (sin la prop `pasos`) |
| SAN-02 | Ningún camino lleva al asistente: «Empezar el plan» de la ficha va a la vista del plan; sin «Armar con el asistente» ni «Seguir con el asistente»; una dirección con `asistente=N` abre la vista del plan y se le quita el parámetro; el editor y la vista del plan ya no lo leen | `accion-de-la-ficha.ts`, `nutrition/plan.tsx`, `nutrition/editor.tsx` |
| SAN-03 | Los puntos de partida, en la vista del plan: de cero, copiando la activa, desde una plantilla y **«Empezar en blanco» con una activa**, con su propia clave de intento | `nutrition/plan.tsx` (`COPY_EMPEZAR_EN_BLANCO`, `intentoEnBlanco`) |
| SAN-04 | El objetivo del editor dice su versión y su fecha (EDC-12) y lo que está en proporción; el número se cuenta como lo contaba el asistente, en su propio módulo | `nutrition/version-del-objetivo.ts`, `nutrition/numero-del-objetivo.ts`, `nutrition/editor.tsx`, `nutrition/cuadro-de-la-opcion.tsx` |
| SAN-05 | «Usarla ahora» en el aviso del objetivo más nuevo: la versión en preparación pasa al objetivo vigente con el autoguardado, sin esperar otro cambio | `nutrition/editor.tsx` (`objetivoPedido`) |
| SAN-06 | Un borrador armado con el asistente se abre entero en el editor (no había estado propio que migrar) | Sin cambios en la API ni en la base |
| SAN-07 | El código muerto de Nutrición: la opción «nueva» del cuadro, la lista de rangos sin título, el título por día del reparto, la lectura de los alimentos de todos los días tipo y los estilos que eran solo del asistente | `editor.tsx`, `opcion-en-un-cuadro.ts`, `rangos-indicados-del-plan.tsx`, `propuesta-de-rangos-del-plan.tsx`, `propuesta-de-rangos.ts`, `suma-de-los-rangos.tsx`, `globals.css` |

## 3. Los caminos que llevaban al asistente

| Camino | Antes | Ahora |
|---|---|---|
| La ficha, «Empezar el plan» (Nutrición sin plan) | `vista=plan&asistente=1`: el paso 1 | `vista=plan`: los pasos de «Empezar el plan» o, con objetivo, «Crear nuevo plan» y la plantilla. En Entrenamiento sigue abriendo su asistente |
| La vista del plan, «Armar con el asistente» (sin plan y con plan activo) | El paso 1 | Sin plan, no está (las otras dos acciones siguen); con activa, en su lugar, «Empezar en blanco» |
| El editor, «⋯ → Seguir con el asistente · paso N de 7» | El paso sugerido | No está: el «⋯» queda con «Descartar la versión en preparación» |
| Crear o aplicar una plantilla desde el paso 1 | Seguía en el paso 2 | El editor |
| Activar desde el paso 7 o descartar desde el asistente | La vista del plan o el paso 1 | La vista del plan |
| Una dirección vieja con `asistente=1` a `7` | El paso pedido | La vista del plan (o el editor, si hay borrador), sin el parámetro |
| «Te toca a vos», los avisos y la tarjeta de Nutrición del Resumen | Ya llevaban a `vista=plan` | Sin cambios (verificado) |
| Las ayudas («Cómo se usa el plan») y la APK | No nombraban el asistente | Sin cambios (verificado) |

## 4. Lo que se borró

- `apps/web/src/app/pro/advisees/nutrition/pasos-del-asistente.tsx` y `nutrition/asistente-de-nutricion.ts`.
- En el editor: el montaje de los pasos, `pasoDelAsistente` y `enElAsistente`, el `hidden` de la estación, «Seguir con el
  asistente», `onObjetivoNuevo` y la opción «nueva» del cuadro (`opcionNueva`), que vivía solo en el cuadro hasta guardarla.
- En la vista del plan: el paso 1, «Armar con el asistente», el aviso de «sin objetivo» del asistente y el `asistente` de
  cada `ir(…)`.
- La lista de rangos indicados sin título (`titulo={false}`) y el título por día del reparto (`nombreDelDia`,
  `COPY_PROPUESTA.tituloDelDia`), que solo usaba el paso 6.
- Los estilos de `.asistente__comida`, `.asistente__opciones`, `.asistente__objetivo`, `.asistente__revisar`,
  `.asistente__formas-de-sumar`, `.campo.asistente__nombre` y `.editor-de-nutricion__zonas[hidden]`.
- Las pruebas del asistente de Nutrición: las de `asistente-de-nutricion.ts` y de sus pasos en `editores-cierre`,
  `planificacion-de-nutricion`, `imagen-de-la-receta` (NUA-07), `recorrido-plan-pulido` y `franjas-por-comida`. Lo que
  probaban y sigue vivo (el número de la versión del objetivo, los repartos habituales del formulario, las cuatro formas de
  sumar una opción, el objetivo en proporción) se prueba ahora en el editor.

**Lo que no se tocó:** `asistente/asistente.tsx` (salvo la prop de los pasos de otra área), `operaciones-del-asistente.ts`,
`paso-que-sigue.ts` (con el texto de NUP-14, igual byte a byte: lo usa Entrenamiento) y `punto-de-partida.tsx`;
`test/asistente.test.mjs` y `lo-armado.test.mjs`, que prueban el de Entrenamiento; nada de `training/**`; el cajón de
recetas.

## 5. El borrador a medio armar

- **El asistente no guardaba estado propio.** El paso pedido vivía en la dirección (`asistente=N`) y el sugerido se
  deducía del borrador (EDT-13, EDC-11). No hay un campo «paso del asistente» en la API, en la base ni en el navegador
  (verificado: `apps/api`, `prisma/schema.prisma` y `packages/domain` no lo nombran; el website no usa `localStorage` para
  esto).
- **Lo que escribía el asistente es el borrador de siempre:** días tipo, comidas, opciones, rangos indicados (API-PLN-02 y
  03) y el objetivo que cita. El editor lo abre entero.
- **Sin migraciones ni borrados de datos.** No queda ningún campo de la API sin uso.

## 6. Decisiones del continuador (a ratificar)

- **SAN-D01 · El armazón común queda.** Lo usa el asistente de Entrenamiento, que Dirección todavía no probó: se le quita
  solo la prop que dejaba a otra área poner los nombres de sus pasos. `paso-que-sigue.ts` no cambia.
- **SAN-D02 · Una dirección vieja no avisa:** se abre la vista del plan y se quita `asistente=N`, sin un cartel de «el
  asistente se retiró». Alternativa: un aviso la primera vez (no hay a quién explicárselo: el asistente no llegó a la
  persona ni a otros profesionales).
- **SAN-D03 · «Empezar en blanco» solo con una versión activa,** como botón quieto junto a «Nueva versión del plan», con una
  pista que dice que no copia la activa y que la activa no cambia. Sin activa no aparece: «Crear nuevo plan» ya nace en
  blanco. Alternativas: en el menú «Plantillas» (no es una plantilla) o no ofrecerlo (se perdía lo único de arrancar que
  solo tenía el asistente).
- **SAN-D04 · El objetivo del editor dice su versión y su fecha,** contada como en el asistente (todas las páginas de
  API-NUT-05; con la lista a medias, solo la fecha). Cuesta una lectura más al abrir el editor. Y dice lo que está en
  proporción de las kcal en un objetivo viejo, como el paso 2.
- **SAN-D05 · La versión nueva del objetivo se sigue escribiendo en el Resumen,** con el formulario de siempre; el editor no
  trae el formulario. A cambio, el aviso del objetivo más nuevo suma «Usarla ahora», que hace lo que hacía el paso 2 al
  escribirlo: la versión en preparación lo cita con el próximo autoguardado. Sin tocarlo, sigue como antes: lo cita con el
  próximo guardado. Alternativa: el formulario del objetivo dentro del editor.
- **SAN-D06 · Se retira «la opción que entra recién al guardar el cuadro»** (`opcionNueva`), que solo usaba el paso 5. En el
  editor, «+ Opción de alimentos» suma la opción enseguida, y una vacía se quita como cualquier otra.
- **SAN-D07 · No se trae la vista de todos los días tipo a la vez** (pasos 5 y 6): el editor mira de a un día tipo, y
  «Antes de activar» lista todo lo que impide y lo que falta de la versión entera. Queda anotado (§8).
- **SAN-D08 · «Empezar el plan» de la ficha** va en Nutrición a `vista=plan` y en Entrenamiento sigue con `asistente=1`.
  La acción del plan de la tarjeta de Entrenamiento (ED-16) no cambia.
- **SAN-D09 · La evidencia de su momento queda.** Las capturas del asistente de Nutrición de WP-EDITORES-PROFESIONAL (13 y
  14) y de WP-NUTRICION-PLANIFICACION (01 a 05) siguen en `EVIDENCIA/`. Las herramientas ya no pasan por el asistente: crean
  la versión en la vista del plan, escriben el objetivo en el Resumen y no sacan los pasos 3 a 5. No se corrieron (§8).
- **SAN-D10 · El recorrido `asistenteDeNutricion` pasa a `planDeNutricionSinAsistente`,** con lo que seguía vivo: la ficha,
  una dirección vieja, crear, un borrador con `asistente=5`, una comida con su opción en el cuadro, activar y «Empezar en
  blanco» con la activa. `primerPlan` crea con «Crear nuevo plan» y mira la versión del objetivo.

## 7. Pruebas

- **Website** (`apps/web/test/editores-cierre.test.mjs`, sección DL-193): SAN-01 (los archivos no están y nadie los importa;
  el armazón de Entrenamiento sigue entero), SAN-02 («Empezar el plan» en cada área; la dirección vieja; el editor sin el
  asistente), SAN-03 (los cuatro puntos de partida y sus claves), SAN-04 (el número de la versión del objetivo, sus textos y
  dónde se dicen), SAN-06 (sin estado propio) y la de EDC-12 y SAN-05 («Usarla ahora» cuenta como algo por guardar).
- **Las que cambiaron:** `planificacion-de-nutricion` (NUP-04 a NUP-07 y NUP-12 a 14, ahora en el editor),
  `recorrido-plan-pulido`, `franjas-por-comida`, `imagen-de-la-receta` y `scripts/espacio-profesional.test.mjs` (la acción de
  la ficha de Nutrición, sin `&asistente=1`).
- **Navegador** (`test/navegador/recorridos.mjs`): `planDeNutricionSinAsistente` (reemplaza a `asistenteDeNutricion`) y
  `primerPlan`, en la CI.
- Corridas acá: las 812 pruebas del website y las de `espacio-profesional`, con Node 22; el CSS con postcss y el contraste.

## 8. Lo que queda (anotado para el repaso de la entrega)

- Ratificar SAN-D01 a SAN-D10.
- **Mirarlo en pantalla:** por la memoria del equipo no se corrió `next build`, el chequeo de tipos completo ni el navegador
  localmente; los corre la CI. Las herramientas de captura de EDITORES-PROFESIONAL y NUTRICION-PLANIFICACION se ajustaron
  sin correrlas: si se vuelven a sacar, verificar las capturas 01, 02, 13 y 14.
- **La vista de todos los días tipo a la vez** (SAN-D07), si Dirección la extraña al armar planes con varios días tipo.
- **Los documentos de paquetes ya cerrados** que describen el asistente de Nutrición se dejan como registro de su momento y
  no se reescriben: WP-EDITORES-PROFESIONAL (ED-30, EDC-11, EDC-12, EDT-13, EDT-16 y EDT-66), WP-NUTRICION-PLANIFICACION
  (NUP-05, NUP-06, NUP-13 y NUP-14 en los pasos), WP-NUTRICION-ALIMENTOS (NUA-07 en los pasos 3 y 4), WP-RECORRIDO-PLAN-PULIDO
  (RP-06 y RP-19 en el paso de los rangos) y WP-OBJETIVO-Y-CALCULADOR. DL-193 los deja sin efecto en lo que toca al asistente.
  La guía de UX (`docs/ux/GUIA-UX-UI.md`, II.13) ya dice que solo Entrenamiento tiene asistente.
- **Para la tesis y los manuales** (fuera de este repositorio): si una captura o un texto muestra el asistente de Nutrición,
  cambiarlo por la vista del plan y el editor.
