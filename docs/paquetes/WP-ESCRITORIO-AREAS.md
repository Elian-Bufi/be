# WP-ESCRITORIO-AREAS · el escritorio del profesional, amable de usar: las pestañas de área

> **Estado:** declarado el 2026-10-11. Segundo paquete del rediseño del escritorio profesional. El primero
> (`WP-ESCRITORIO-AMABLE`) rediseñó la ficha del asesorado y el Espacio profesional; este lleva el mismo criterio a las
> pestañas de cada área: Nutrición, Entrenamiento, Antropometría e Información.
>
> **Dirección** validó las maquetas de estas pantallas el 2026-10-10 («lo que no te corregí es que me parecen
> correctos») y el 2026-10-11 pidió seguir con este paquete. El orden de las partes y las decisiones de cada una las
> propone quien implementa y las corrige Dirección.
>
> **Rama:** `wp-escritorio-areas`, apilada sobre `wp-escritorio-amable` (PR #155). Sin integrar ni desplegar: eso lo
> autoriza Dirección.

## 0. Fuentes leídas

- **El diseño:** `EVIDENCIA/ESCRITORIO-AMABLE/diseno/CRITERIO-Y-AUDITORIA.md` (§3, el mapa de opciones de cada pantalla
  y las reglas para 1280 y 1024 px; §4, los cambios 14, 15, 31, 35 a 43, 45, 49 a 53 y 58 a 81) y las maquetas 06, 16 a
  18 y 20 a 29 (`diseno/maquetas/`). En este documento, **C-58** quiere decir «el cambio 58 de esa lista». Cada maqueta
  se vuelve a abrir antes de programar su parte.
- **El código, pantalla por pantalla:** cuatro planes de implementación, escritos por lectura (sin compilar ni ejecutar
  nada) el 2026-10-11, con la rama en `c565f0c`, y guardados en `EVIDENCIA/ESCRITORIO-AREAS/relevamientos/`: Nutrición
  (656 líneas), Entrenamiento (695), Antropometría (509) e Información (494). Dicen, región por región, qué provee hoy
  cada cosa (con archivo y línea) y qué cambia; lo que hoy existe y la maqueta no dibuja; los datos que la maqueta
  muestra y no llegan; las pruebas y los recorridos que fijan textos o estructura; los pasos, con su riesgo; y las
  decisiones que quedan (102 entre los cuatro). Mientras se escribían se hizo el tercer tramo de Analizar, que de las
  pestañas de área tocó un solo archivo (`nutrition/detalle-de-registro.tsx`: ahora exporta el cuerpo de un registro);
  los números de línea de `globals.css` se corrieron.
- **El primer paquete:** `docs/paquetes/WP-ESCRITORIO-AMABLE.md` (lo que no cambia, las decisiones y las piezas que este
  paquete reutiliza) y `docs/ux/GUIA-UX-UI.md`.
- **Del legajo se abrió una sola cosa para declarar el paquete:** lo que fija sobre pedir información (09 §22.3,
  API-FRM-03, líneas 1518 a 1528; 05 §13.6.7), por la decisión F-05. Donde una parte toque algo que el legajo fija, se
  abre antes y se cita con ruta y sección; una tensión va a `docs/DEUDA_LEGAJO.md`.

## 1. Objetivo y demostrables

Lo mismo que en la ficha: que el profesional encuentre lo que vino a hacer sin desplazarse ni configurar. Las pestañas
de área no tienen opciones de más: tienen todo abierto a la vez. **No se quita ninguna función:** se decide qué queda a
la vista y qué a un clic.

Medido el 2026-10-10 con `herramientas/paginas.mjs`, a 1440 × 900, con el asesorado A
(`EVIDENCIA/ESCRITORIO-AMABLE/parte-0/alturas-antes.json`; el «antes» se vuelve a medir al empezar cada parte, sobre
datos recién generados):

| Pantalla | Hoy | Al cerrar su parte |
|---|---|---|
| Entrenamiento · Plan (con el editor) | 22.719 px de alto (25 pantallas) | Un bloque, una sesión y un ejercicio abiertos; lo demás, a un clic |
| Nutrición · Registros | 3.922 px (4,4 pantallas) | El día como unidad, las vistas con su cantidad y el detalle al costado |
| Antropometría · En preparación (cargar una toma) | 3.016 px (3,4) | Cada campo unido a su sitio de la figura |
| Nutrición · Plan | 2.268 px (2,5) | Un día tipo elegido y una comida abierta |
| Entrenamiento · Registros («Ejecuciones») | 1.298 px (1,4) | La lista con sus vistas y el detalle al costado, en una tabla |
| Antropometría · Tomas («Evaluaciones») | 1.174 px (1,3) | Las tomas por protocolo; corregir y anular, al elegir la medición |

En todas: el mismo marco arriba (quién es, el acceso de esa área, «Actualizar» con la hora, las pestañas con su ícono y
una sola ayuda por vista), los dos temas, la familia de íconos, y a 1280 y 1024 px las reglas escritas en el criterio.
A 768 y 390 px no se rompe.

## 2. Lo que no cambia

Vale entero lo de `WP-ESCRITORIO-AMABLE` §2:

- **Las funciones, las operaciones y los permisos.** Todo lo que una pantalla hace hoy y la maqueta no dibuja tiene un
  lugar; los planes lo listan control por control.
- **Los contratos.** Ninguna lectura ni escritura de la API cambia. Los parámetros de la URL (`vista`, `volver`,
  `preparar`…) y los enumerados guardados no se renombran: `vista=ejecuciones`, `vista=evaluaciones`,
  `vista=preparacion` y `vista=pedir` siguen abriendo lo suyo, aunque el nombre que se lee sea otro.
- **Las reglas de BE:** ubicar, nunca calificar; un hueco no es un cero; una falla no es ausencia de datos; cada dato
  dice de dónde sale; con dato o sin dato se dice por la forma, nunca solo por el color.
- **Los textos que son garantías.** Los que arma el dominio con prueba propia no se reescriben para que entren en una
  composición. `copy-pantallas.test.cjs` manda sobre las palabras de cada pestaña.
- **Lo que guarda un editor.** El editor de Entrenamiento tiene que mandar a la API exactamente lo mismo que hoy por
  cada serie (la clave ausente, `null` o un valor): un error ahí no se ve en el escritorio, se ve en el teléfono.
- **Los puntos anatómicos de la figura no se mueven.**
- **Las bases de la demostración** (`be_test_comprension`, `be_test_dashboard`) no se regeneran. Los datos que el
  escenario no tiene se suman a la base propia del paquete (`be_test_escritorio`).

## 3. Partes

Cada parte deja la rama en un estado que se puede integrar: si el plazo corta el paquete, lo hecho sirve. Los tamaños
son estimaciones de los planes.

| # | Parte | Pantallas | Cambios del criterio | Riesgo |
|---|---|---|---|---|
| 0 | **El marco del área,** una sola pieza para las cuatro: el camino a la ficha, el título y la persona, el acceso de esa área, «Actualizar» con la hora, las pestañas con ícono y el lugar de la ayuda de la vista; los estados con su motivo. Los dos nombres nuevos («Tomas» y «Registros»; las dos pestañas que dejan de serlo se van con su parte, la 3 y la 4). El «antes», medido. Lo que se pensaba hacer acá y va con la primera parte que lo use, para no mover nada que todavía no tiene quién lo use: sacar a un lugar común el detalle al costado, el diálogo de ayuda, el menú de tres puntos y el control de período; y los datos de prueba que faltan (F-04) | Todas | C-43, C-58, C-65 | Medio: lo comparten cuatro áreas |
| 1 | **Nutrición · Registros** | 20 | C-49, C-50, C-51, C-53 | Medio a alto: dos lecturas unidas |
| 2 | **Entrenamiento · Registros** | 25 | C-66, C-67, C-68 | Medio a alto |
| 3 | **Antropometría · Tomas y una medición** | 22 y 29 | C-59, C-61 a C-64, C-79 | Alto: se mudan corregir y anular, que no se deshacen |
| 4 | **Información · Solicitudes y el pedido** | 26 y 27 | C-70 a C-74 | Medio; alto en el pedido (la única escritura) |
| 5 | **Nutrición · Plan activo** | 16 | C-31, C-35, C-39, C-45 | Medio: lo muestra también la ficha |
| 6 | **Entrenamiento · Plan activo** | 24 | C-69, C-80, C-81 | Medio |
| 7 | **Nutrición · La versión en preparación, activar y agregar un ítem** | 17, 18 y 21 | C-37, C-38, C-40 a C-42, C-52 | Alto |
| 8 | **Entrenamiento · La versión en preparación** | 28 | C-75 a C-78 | Alto: la celda de una serie y activar |
| 9 | **Antropometría · Cargar una toma sobre la figura** | 23 | C-60 | Alto. Los pliegues no están dibujados: se dibujan y se le muestran a Dirección antes de programar |
| 10 | **Preparar revisión** | 06 | C-14, C-15 | Medio a alto: la evidencia es compartida |

**Por qué este orden.** El marco va primero porque todo cuelga de él. Después, lo que se mira todos los días (los
registros, las tomas, las solicitudes): son las pantallas que reutilizan lo que el primer paquete ya construyó (las
vistas con nombre, el día como unidad, el detalle al costado) y las de menos riesgo. Después los planes activos, que son
donde vive cada editor. Los editores van al final: son lo más grande y lo más delicado, y cada uno va junto con su
«Activar plan». Cargar una toma queda después porque tiene una mitad sin dibujar.

**La otra opción era ir por área** (terminar Nutrición entera, después Entrenamiento…). Se descartó porque, si el plazo
corta el paquete, quedaría un área completa y tres sin tocar; con este orden, las cuatro quedan con su marco y sus
vistas de lectura nuevas, y lo que falta son los editores, que hoy funcionan.

## 4. Decisiones

Se completan a medida que se implementa (F-01 en adelante). Cada una dice qué se eligió y qué otra opción había. Los
cuatro planes dejan 102 decisiones propuestas, cada una con su recomendación: se toman al llegar a su parte.

**Tomadas al declarar el paquete:**

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| F-01 | **El marco del área es una sola pieza, para las cuatro áreas, y se hace antes que cualquier pantalla.** | Hoy cada pestaña arma el mismo encabezado por su cuenta. Los cuatro planes lo piden igual. Se descartó que cada área arme el suyo: cuatro copias de lo mismo. |
| F-02 | **Lo que la maqueta marca como «propuesta» no entra:** los rangos de macros por día tipo y por comida, y la estimación de cada opción en el website. Ninguna etiqueta «propuesta» llega al producto. | Piden datos que BE no tiene o que la lectura del profesional no trae (ver §6). La tira del objetivo del día sí entra: ese dato llega. |
| F-03 | **Los nombres que se leen cambian; los valores que viajan, no.** «Evaluaciones» pasa a «Tomas», «Ejecuciones» a «Registros», y «En preparación» y «Pedir información» dejan de ser pestañas, pero `vista=evaluaciones`, `vista=ejecuciones`, `vista=preparacion` y `vista=pedir` siguen abriendo lo suyo. | §2. Dirección validó los nombres el 2026-10-10. Un enlace guardado o un pendiente de la cartera se abre igual. |
| F-04 | **Los datos que el escenario de prueba no tiene se suman a la base propia del paquete,** con su verificador: un borrador de Nutrición con dos días tipo, tres opciones y una receta; solicitudes de información sin responder, respondida y corregida; una tercera versión de plan. | Sin ellos, el editor de Nutrición, las solicitudes y el selector de etapa no se pueden ver ni comprobar. Lo que aun así no se pueda generar se mira con una respuesta simulada, dicha como tal (E-98). |
| F-05 | **En «Pedir información» no viene ninguna pregunta elegida,** con «Elegir todas» a un clic, hasta que Dirección decida. | La maqueta (C-73) las trae todas elegidas. El código de hoy no lo hace a propósito (`forms/pedir.tsx`, líneas 7 a 9), y cita el legajo, que se abrió para esta decisión: entre las precondiciones de crear una solicitud están la «pertinencia» y «cada categoría/campo solicitado autorizado para ese contexto», y «una plantilla con campos más amplios no amplía B2» (09 §22.3, líneas 1518 a 1528); y entre las garantías mínimas de UC-P32, «no se solicitan categorías fuera de finalidad/alcance» (05 §13.6.7). El legajo no prohíbe con esas palabras que vengan elegidas, pero con C-73 el pedido que sale sin tocar nada pasa a ser el más amplio. Es una decisión de Dirección: al llegar a la parte 4 se anota en `docs/DEUDA_LEGAJO.md` con las dos opciones. |


**Parte 0 · El marco del área** (2026-10-11).

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| F-06 | **El marco del área tiene los tres renglones del marco de la ficha, a la misma altura:** de quién es y «Actualizar»; el acceso actual; las secciones. Mide 143 px en las cuatro áreas y en la ficha, a 1440, 1280 y 1024 px. | La maqueta lo dibuja en dos renglones, con el acceso en el primero. Con las palabras de BE («Activo · acceso contextual») y las tres áreas de Información no entra en un renglón a 1280 ni a 1024, y a 1440 entra en unas áreas y en otras no: el marco cambiaría de alto de un área a otra. Con los tres de la ficha, al pasar de la ficha a un área, o de un área a otra, nada se mueve de lugar. |
| F-07 | **El camino de vuelta está siempre, delante del título, y reemplaza a la miga.** Si se llegó desde la ficha (`volver`, validado como antes), «Volver a la ficha, donde estabas»; si no (desde un pendiente o un enlace guardado), «Volver a la ficha». Llegando a «Pedir información» desde Entrenamiento, «Volver a Entrenamiento». | La barra de marca ya vuelve al Espacio profesional. Sin la miga, quien llega desde un pendiente se quedaba sin camino a la ficha: por eso el enlace no depende de `volver`. Con `volver=entrenamiento`, el enlace decía «donde estabas» y llevaba al Resumen de la ficha, donde la persona no estaba. `MigasDelAsesorado` y `EnlaceDeRetorno` se retiraron; `Migas` sigue en las páginas de la biblioteca. Se descartó dejar la miga y el enlace, los dos. |
| F-08 | **«Actualizar» vuelve a leer todo lo que la sección muestra, y nunca pierde algo escrito sin preguntar.** La sección se monta de nuevo: cada una de sus lecturas sale otra vez. Quien tiene algo escrito sin guardar se lo avisa al marco (`useCambiosSinGuardar`), y entonces «Actualizar» pregunta, diciendo qué se pierde: «Seguir editando» o «Actualizar y descartar». Lo avisan los dos editores de plan, los dos formularios de revisión, la estimación de una comida, el pedido de información, la toma en preparación, corregir o anular una medición y el fundamento de un resultado. | E-58 del primer paquete (la hora nunca queda sobre datos de una consulta anterior). Los planes proponían dos caminos, y se descartaron: apagar «Actualizar» mientras haya cambios (deja una hora vieja sin explicación, y no se puede actualizar la parte que no se edita) y volver a leer «todo menos el borrador» (cada vista necesitaría dos formas de leer; se puede revisar cuando se recompongan los editores, en las partes 7 y 8). |
| F-09 | **El acceso actual es el de esa área, y no sigue diciendo «Activo» sobre algo que ya no se puede leer.** Sale del vínculo del área, con las palabras de BE; Información nombra las tres. Si una lectura o una escritura responde «no disponible», el marco vuelve a preguntar: los vínculos y lo que el resumen del asesorado deja leer (una lectura corta, de siete días, una sola vez aunque varias respondan lo mismo). Una falla no es una revocación: no pregunta ni cambia nada. Al volver a la pestaña del navegador después de un minuto, se vuelve a preguntar. Nunca dice quién retiró el acceso ni por qué. | Es la regla de la ficha (`estadoDelArea`), que salió a `acceso-por-area.tsx` para que la usen las dos, sin cambiar una clase ni una palabra. Se descartó preguntar el resumen siempre al entrar: es una lectura protegida más por página, para un caso raro. Un «no disponible» de algo puntual (una toma que no existe) no cambia el acceso: lo decide lo que responde el resumen. |
| F-10 | **Las secciones que todavía no se recompusieron conservan su ancho** (72 rem: 1.152 px a 1440, el que les dejaba la página de antes), alineadas con el marco por la izquierda. Una sección recompuesta usa todo el ancho (`ancho`). | Sus textos y sus formularios se hicieron para ese ancho. Se descartó estirarlas ahora (renglones de 1.376 px) y centrarlas debajo de un marco que arranca en el borde izquierdo. |
| F-11 | **Una falla de la lectura de una sección dice su motivo** (C-43). El estado de lectura de las cuatro áreas es una sola pieza (`EstadoDeLecturaDelArea`): cargando; el «no disponible» de siempre, neutral; o el bloque de estado de la ficha, con el motivo (el límite de consultas, la conexión, el servicio) y «Reintentar». | Antes: «No pudimos cargar esta vista. Reintentar», sin motivo. Las demás fallas de cada vista (una escritura, una parte de la pantalla) cambian con su parte. |
| F-12 | **«Tomas» y «Registros»** (C-58 y C-65): las secciones, los enlaces que llevan a ellas desde la ficha («Ver en Antropometría · Tomas», «Ver en Entrenamiento · Registros») y «Ver registros» en el resumen de Entrenamiento. `vista=evaluaciones` y `vista=ejecuciones` siguen abriendo lo suyo (F-03). | El legajo propone esas navegaciones («se propone», B10-07 §6; «propuesta», B10-06 §1): no fija los nombres. Lo que fija, que la navegación no se parta en módulos sueltos, no cambia. «En preparación» y «Pedir información» siguen siendo secciones hasta su parte (3 y 4). Dentro de Antropometría quedan textos que dicen «evaluación» («Evaluación en preparación», «Todavía no hay evaluaciones registradas»): cambian con las partes 3 y 9, junto con el pendiente del Espacio profesional que abre esa pantalla. |
| F-13 | **Cada sección lleva un ícono de la familia:** Resumen, Plan, Registros, Tomas y Solicitudes (la lista), Revisiones, En preparación (el borrador), Evolución (el de Analizar), Lámina (la imagen) y Pedir información (el mismo de «Solicitar contexto», que es el botón de la ficha que la abre). | Los que usa la maqueta. Son decorativos: el nombre del enlace sigue siendo su texto. |
| F-14 | **La ayuda de la vista tiene su lugar en el marco, y cada sección suma la suya con su parte.** Mientras una sección no la tenga, el botón no se muestra. | Como en la ficha (E-47 del primer paquete). Un botón que no abre nada no se dibuja. |

## 5. Pruebas y evidencia

- **En la CI:** typecheck y compilación del website; `contraste.test.cjs`; `copy-pantallas.test.cjs`, con sus bloques por
  área (cambian en el mismo commit que el texto que fijan); las pruebas del dominio y de las funciones puras nuevas.
- **Recorridos con navegador:** ninguno de los siete recorridos de hoy mira el plan, el editor, los registros ni las
  tomas (solo pasan por el marco). Cada parte suma un modo propio a `recorrido.mjs`, con lo esperado calculado a mano
  desde la API. Los guiones viejos de WP-NUTRICION-RECETAS y de WP-ENTRENAMIENTO-SERIES están atados a los campos de hoy:
  lo que protegen se reescribe en el recorrido nuevo, y se dice.
- **Cada comprobación conserva lo que protege** (E-06) y cada negativa va con una positiva del mismo selector.
- **La prueba de la prueba:** las reglas nuevas, rotas de a una; las pantallas, en una compilación rota a propósito.
- **Los editores, además:** lo que guarda la API después de escribir por la pantalla se compara con lo que guardaba
  antes, serie por serie.
- **Antes y después,** accesibilidad (axe, teclado y foco) y los **estados de la evidencia,** como en el primer paquete.

## 6. Fuera de alcance

| Qué | Por qué | Dónde queda |
|---|---|---|
| Los rangos de macros por día tipo y por comida | Datos nuevos: legajo, contrato y base | Criterio §5; sin DL todavía |
| La estimación de cada opción en el website (C-36) | La lectura del plan del profesional no trae el aporte de los ítems | Pide ampliar una lectura de la API |
| La clase del dato («Reportado») en una sesión o en una serie | No existe en el contrato de entrenamiento | Para decidir |
| El protocolo y las «corregidas» de cada toma, en la lista | Están en el detalle de cada toma: una lectura protegida por toma | Se decide en la parte 3 (leer hasta 20, o pedir que la lista los traiga) |
| El alias del asesorado | Decisión del legajo | DL-040, abierta |
| Lo que no está dibujado: Evolución, Lámina y «Calcular con un método» (Antropometría); Resumen y Revisiones de cada área; Plantillas y habituales, Mis recetas y Mis ejercicios | No tienen maqueta | Reciben el marco nuevo, sin cambios de contenido |
| Reordenar o duplicar un ejercicio, quitar una serie del medio, descartar el borrador | No existen hoy: sería agregar funciones | — |
| «Evaluación en preparación» entre los pendientes del Espacio profesional, y la vista «Evaluaciones» de esa lista | La pantalla que abre ese pendiente todavía dice «Evaluación en preparación» (F-12): si cambiara solo el pendiente, serían dos nombres para lo mismo | Con la parte 3, junto con los textos de esa pantalla. Es del primer paquete (E-84) y toca su prueba y su cartera simulada: va en un commit propio |
| «Actualizar» sin perder lo escrito | Hoy pregunta y, si se sigue, lo escrito se descarta (F-08). Volver a leer lo demás conservando el borrador pide que cada editor sepa leer sin rearmarse | Para decidir al recomponer los editores (partes 7 y 8) |
| El estado de un formulario con algo escrito, en ocho de los nueve lugares | Está implementado; con comprobación en pantalla, solo la revisión de Nutrición | Cada uno suma la suya con la parte que recompone su pantalla |
| Unificar los 20 íconos propios de la APK | Pide una APK nueva | Otro paquete |
| Componer para 768 y 390 px | El profesional trabaja en escritorio: ahí solo no se rompe | — |

## 7. Lo que cambia en la guía de UX

La guía (`docs/ux/GUIA-UX-UI.md`) se ajusta en la misma parte que cambia la pantalla: II.3 (las migas de las áreas, que
dejan su lugar al marco), II.6 y II.8 (las piezas nuevas), II.9 (la pestaña Antropometría, entera) y la Parte V.

## 8. Estado

| # | Parte | Estado |
|---|---|---|
| — | Definición y planes de implementación | Hecho el 2026-10-11 |
| 0 | El marco del área | Hecho el 2026-10-11 (código en `b8d556f` y `50530f2`): el marco de las cuatro áreas mide 143 px, lo mismo que el de la ficha, a 1440, 1280 y 1024 px; el camino de vuelta está siempre; dice de quién es la página y el acceso actual de esa área; «Actualizar» vuelve a leer todo y pregunta antes de perder algo escrito; «Tomas» y «Registros». `recorrido.mjs` sumó 21 resultados en `funcional` (240) y uno en `descartable` (22). La primera pasada completa no pasó entera (85 de 86 en un recorrido): la falla mostró un defecto de antes —un enlace de vuelta que cortaba la sesión—, que se corrigió. Las pruebas nuevas se probaron rompiendo lo que protegen: 20 roturas en dos compilaciones; una no se detectó a la primera y la comprobación se reforzó. Las piezas compartidas que faltan mover y los datos de prueba van con la parte que los use |
| 1 | Nutrición · Registros | Sin empezar |
| 2 | Entrenamiento · Registros | Sin empezar |
| 3 | Antropometría · Tomas y una medición | Sin empezar |
| 4 | Información · Solicitudes y el pedido | Sin empezar |
| 5 | Nutrición · Plan activo | Sin empezar |
| 6 | Entrenamiento · Plan activo | Sin empezar |
| 7 | Nutrición · La versión en preparación | Sin empezar |
| 8 | Entrenamiento · La versión en preparación | Sin empezar |
| 9 | Antropometría · Cargar una toma | Sin empezar |
| 10 | Preparar revisión | Sin empezar |
