# WP-PRESETS-POR-NIVEL · Reutilizar en cada nivel: plan, fase, sesión y series

> **El pedido de Dirección (26/11):** poder reutilizar patrones en cada nivel del plan y adaptarlos después. Y dos
> decisiones del mismo día: sacar los microciclos del editor, porque el modelo nuevo los cubre, y arreglar la galería de
> presets de prescripción (dicen «RIR 2» en cualquier plan, el «Elegí un preset» repetido y el «?» sin ejemplo).
>
> Rama `entrenamiento/presets-por-nivel`, desde `ux/zoom-escritorio` (PR #329, todavía sin integrar, que trae el editor de
> la tanda 8). Registro: **DL-203** en `docs/DEUDA_LEGAJO.md`. Las decisiones de continuador (**PN-D01 a PN-D17**) están
> **a ratificar**, salvo las que Dirección ya fijó (se dice en cada una). No se integra sola.

## 0. En criollo

El profesional ya podía reutilizar un plan entero (las plantillas) y unas series (los presets de prescripción). Ahora puede
reutilizar también **una fase** y **una sesión**: desde el «⋯» de una fase o de una sesión, «Guardar como preset». Después,
en otro plan, la galería de presets tiene una pestaña por nivel —Plan, Fase, Sesión y Series— y en cada una lo de BE y lo
suyo. Una fase guardada entra como fase nueva, con sus semanas, sus sesiones con sus ejercicios y series, sus días, su
progresión y sus aproximaciones. Una sesión guardada va en la sesión vacía que se está mirando, o como sesión nueva. Todo se
deshace con Ctrl+Z.

Lo que se guarda: los ejercicios sí (los eligió el profesional). Las cargas en kg nunca: son de cada persona. Si el
ejercicio va en % RM, se guarda el % y la carga sale del 1RM de la persona que lo recibe. Las notas de los ejercicios y de
las series nunca, ni las anotaciones privadas de la fase: pueden nombrar a la persona. Antes de guardar, el cuadro dice qué
no viaja y muestra los textos que sí viajan (los nombres, el objetivo de la fase, las indicaciones de la sesión) para
revisar que no digan nada de nadie.

Los presets de BE de series ahora hablan el idioma del plan: en un plan en RPE, «Hipertrofia» dice «RPE 8»; en % RM, «70 %
RM» y la carga sale del 1RM; en «Solo carga y repeticiones», no lleva esfuerzo.

Y el editor ya no arma microciclos («Semana 1», «Semana 2»…, cada una con sus sesiones desde cero): una fase de N semanas
con su semana tipo, la progresión, la descarga y «Duplicar la fase» cubren lo mismo con menos trabajo. Los planes que ya
los tienen se siguen leyendo y editando.

## 1. Lo que se hizo

| Parte | Qué | Dónde |
|---|---|---|
| 1 | Sin «Organizar por microciclos» ni «Agregar microciclo». Un plan viejo con semanas se lee y se edita (elegir la semana, cambiarle el nombre o quitarla, y sus sesiones). Al quitar la última semana, la fase vuelve a tener sus sesiones directamente. El contrato, la API, la app y el lector del plan compartido no cambian. | `training/editor.tsx`, `advisees/editar-la-estructura.ts`, `copy-entrenamiento.ts`, `test/editores.test.mjs`, el recorrido F-108 |
| 2.1 | Los presets de BE en la intensidad del plan o del ejercicio: RIR, RPE (= 10 − RIR), % RM por objetivo o sin esfuerzo. En % RM la carga sale del 1RM con el redondeo del plan. `VERSION_DE_LOS_PRESETS_DE_BE` = 3. | `presets-de-be.ts`, `prescripcion-rapida.ts`, `alcance-del-preset.ts`, `galeria-de-presets.tsx`, `training/editor.tsx` |
| 2.2 | «Elegí un preset para ver qué trae.» una sola vez, junto a «Usar» apagado. | `galeria-de-presets.tsx` |
| 2.3 | El «?» pegado al título, con definición, pasos y un ejemplo resuelto (II.17). | `training/ayudas-del-editor.tsx` (`presets`) |
| 3 | Presets de fase y de sesión: guardar desde el «⋯», aplicar desde la galería con su pestaña, por el mecanismo de API-HAB-06 a 08 con `kind`. | `presets-por-nivel.ts`, `contratos-habituales.ts`, `habituales.service.ts`, `presets-propios.ts`, `limite-de-cuerpo.ts`, `training/guardar-como-preset.tsx`, `training/prescripcion-habitual.tsx`, `galeria-de-presets.tsx`, `training/editor.tsx` |

## 2. Decisiones a ratificar

| ID | Decisión | Por qué |
|---|---|---|
| PN-D01 | **Sin microciclos nuevos** (Dirección, 26/11). El editor no los crea; los planes viejos se leen y se editan; no hay «Desarmar las semanas». Al quitar la última semana de una fase, la fase vuelve a tener sus sesiones directamente. Una fase con microciclos no se guarda como preset («Copiala con «Duplicar la fase»»). | El modelo de fases de N semanas lo cubre. Un preset de fase con semanas obligaría a crear microciclos al aplicarlo. |
| PN-D02 | El nombre sigue siendo **«Presets»** (Dirección). La acción del «⋯» de la versión pasa a decir «Presets: plan, fase, sesión y series» y abre la pestaña «Plan». | Una sola galería para los cuatro niveles. |
| PN-D03 | Los presets de BE de series se leen y se aplican **en la intensidad del ejercicio**: la suya si la cambia (su criterio propio o «Sin criterio de intensidad») y si no, la del plan. En RPE se escriben como RPE (10 − RIR) y se guardan como RIR (DL-192). | Lo que el profesional ve es lo que queda escrito. |
| PN-D04 | **% RM por objetivo:** Hipertrofia 70 %, Fuerza 85 % y Resistencia 60 % (ratificados por Dirección). **Técnica 50 %, a ratificar** (propuesta de Claude: carga liviana para aprender el gesto). | — |
| PN-D05 | En % RM, **la carga sale del 1RM de la persona con el redondeo del plan** (ET2-D05), calculada en cuanto se lee el 1RM y sin apilarse aparte: Ctrl+Z vuelve a antes del preset. Sin 1RM, la carga escrita se conserva (no se borra nada). Las series en % RM no llevan RIR propio, y se dice antes. | Como ET2-D18: en el borrador, las cargas del % RM siguen al 1RM. |
| PN-D06 | «Elegí un preset para ver qué trae.» queda **junto a «Usar» apagado**; el panel, con nada elegido, dice en qué intensidad se leen los presets. | Es donde explica por qué el botón no hace nada. |
| PN-D07 | Los presets de sesión y de fase usan **el mecanismo de las prescripciones habituales** (API-HAB-06 a 08) con `kind`: `SERIES` (sin `kind`, como hasta ahora), `SESION` o `FASE`. | Lo pidió Dirección; una sola familia de presets propios, con las mismas reglas de nombre, versión y auditoría. |
| PN-D08 | **Sin migración.** El nivel va dentro del contenido guardado (la columna JSON de siempre); lo guardado antes, sin nivel, es `SERIES`. | La migración aditiva no hizo falta: nada se aplica en ninguna base. |
| PN-D09 | **El nombre es único entre los tres niveles** (el índice único de siempre). El cuadro avisa antes si un preset de otro nivel ya lo usa; uno del mismo nivel se reemplaza solo si se elige. | No cambiar el índice (sería una migración no aditiva). Propuesta alternativa: único por nivel, con una migración que cambie el índice. |
| PN-D10 | **Qué se guarda:** los ejercicios sí; las cargas nunca (el esquema las rechaza, 400); las notas de los ejercicios y de las series nunca; las anotaciones privadas de la fase nunca; la referencia del % RM nunca. Los nombres, el objetivo de la fase, las indicaciones de la sesión y los parámetros escritos sí, y se muestran antes de guardar para revisarlos. | Como API-HAB-07. Las indicaciones y el objetivo son parte del armado; si no viajaran, el preset de sesión perdería «las notas de la sesión» que pidió Dirección. |
| PN-D11 | **Un preset de sesión** va en la sesión vacía que se mira (por omisión; conserva su identificador y sus días, y si cambia su nombre o sus indicaciones, primero «antes → después») o como sesión nueva al final de la fase. En una sesión con ejercicios, solo como nueva. | Nunca pisa ejercicios. |
| PN-D12 | **Un preset de fase** entra como fase nueva, después de la que se mira, con sus semanas, sus sesiones, su progresión (también la de los ejercicios elegidos) y sus aproximaciones. Los días, como al duplicar una fase (DL-196): solo si la fase nueva tiene fechas; si no, se dice. | Sin fechas, sus sesiones irían todas las semanas junto con las de otra fase. |
| PN-D13 | **La galería única:** Plan (tus plantillas, que reemplazan el borrador; las Plantillas de BE se eligen en «Empezar desde una plantilla», con un enlace a «Plantillas y habituales»), Fase (de BE, las estructuras de la semana; tuyos, los presets de fase), Sesión (BE no tiene: no elige ejercicios, ED-D2; tuyos, los presets de sesión y las sesiones habituales) y Series. Se abre en la pestaña del lugar: «Usar un preset de sesión» en la sesión, «Agregar una fase desde un preset» en la fase, la de series en la sesión y en el ejercicio, «Plan» en el «⋯» de la versión. | No se inventan presets de BE de fase ni de sesión. |
| PN-D14 | **Las sesiones habituales (DL-109) siguen**, en la pestaña Sesión junto a los presets de sesión, y «Guardar como habitual» sigue en el menú. **Propuesta:** unificarlas en una próxima tanda (la habitual copia cargas a pedido; el preset nunca). | No cambiar algo que funciona sin que Dirección lo decida. |
| PN-D15 | **API-HAB-07 pasa al límite de 700 KB**, como los planes y las sesiones habituales. | Un preset de fase lleva la fase entera (hasta 30 sesiones de 40 ejercicios). |
| PN-D16 | La lista de API-HAB-06 trae **los tres niveles juntos**, hasta 200 en total; el website los separa. | Sin parámetros nuevos en la consulta. |
| PN-D17 | Aplicar un preset de sesión o de fase es **un cambio grande con su «Deshacer»** (y Ctrl+Z): la estructura, la planificación y la agenda vuelven juntas. | ET3-D21. |

## 3. Contrato

- `GuardarPrescripcionHabitualRequestSchema` (API-HAB-07): unión de `{ name, kind?: 'SERIES', prescription }`,
  `{ name, kind: 'SESION', session: PresetDeSesionContenido }` y `{ name, kind: 'FASE', phase: PresetDeFaseContenido }`,
  con `replaces` y `expectedVersion` como siempre.
- `PresetPropioDeEntrenamientoSchema` (respuesta de API-HAB-06 a 08): discriminada por `kind`. La de series es la
  prescripción habitual de siempre con `kind: 'SERIES'`; las de sesión y de fase traen `exercises` (el nombre vigente de
  cada ejercicio, como las sesiones habituales).
- Topes: los del plan (40 ejercicios por sesión, 20 series, 30 sesiones por fase, 7 días, 400 aproximaciones, una
  progresión). Las claves son locales (`s1`, `p1`, `g1`) y la API rechaza un día, una aproximación o una progresión que
  cite una que el preset no tiene (422 `TRAINING_PLAN_STRUCTURE_INVALID`, `PRESET_REFERENCE_UNKNOWN`). Los ejercicios se
  validan contra el catálogo del profesional (422 `EXERCISE_REFERENCE_INVALID`).
- La APK no lee nada de esto.

## 4. Pruebas

- Dominio: `presets-por-nivel.test.ts` (qué se guarda y qué no, las claves locales, aplicar dos veces sin chocar, la fase
  con días, progresión y aproximaciones, el contrato de los tres niveles) y `prescripcion-rapida.test.ts` (las cuatro
  intensidades, la del ejercicio sobre la del plan, aplicar en RPE, % RM y sin esfuerzo).
- Web: `presets-por-nivel.test.mjs` (la galería por pestañas, el editor, los menús, «Deshacer») y `editores.test.mjs`
  (sin microciclos nuevos, un plan viejo se edita).
- API: `limite-de-cuerpo.spec.ts` (API-HAB-07 con 700 KB).
- Falta: la prueba de integración contra PostgreSQL de los tres niveles (`test/integration/presets-propios.int-spec.ts`
  sigue con los de series) y la recorrida en pantalla.

## 5. Lo que queda afuera

- Renombrar o quitar presets de sesión y de fase desde «Plantillas y habituales» (API-HAB-08 ya lo hace; la pantalla no
  lista ninguno de estos presets, tampoco los de series).
- Unificar las sesiones habituales con los presets de sesión (PN-D14).
- Presets de BE de fase o de sesión: BE no elige ejercicios (ED-D2).
- La prueba de integración y la recorrida en pantalla con Dirección.
