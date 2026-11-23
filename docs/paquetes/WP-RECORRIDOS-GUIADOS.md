# WP-RECORRIDOS-GUIADOS · El recorrido guiado de cada editor, la primera vez

> **El pedido de Dirección (23/11):** «Como en las buenas apps, un tutorial para las primeras veces que se usan las
> interfaces, mostrando sección por sección cuál es el flujo. Que todo se oscurezca menos la zona que estamos explicando y
> aparezca un cartel de fácil lectura que explique cómo funciona o qué es. Tiene que aparecer la primera vez, tener un
> botón de omitir y un botón para volver a mostrar el tutorial si lo omitiste».
>
> Rama `wp-recorridos-guiados`, desde `main`. Registro: **DL-195** en `docs/DEUDA_LEGAJO.md`. Las decisiones de
> continuador (**GUI-D01 a GUI-D12**) están **a ratificar**. La APK no se toca en este paquete (§8). No se integra solo.

## 0. En criollo

La primera vez que el profesional abre el editor del plan de **Entrenamiento** o el de **Nutrición**, la pantalla se
oscurece y queda iluminada una sola zona, con un cartel al lado: «Paso 1 de 6 · Sesiones y días · Cada sesión es un
renglón de «Sesiones»…». Con «Siguiente» pasa a la zona que sigue, en el orden en que se arma un plan, hasta «Revisar y
activar…», donde dice «Terminar». «Omitir» lo cierra cuando quiera. Con el teclado: las flechas, Escape y Tab.

Lo vio o lo omitió: no vuelve a aparecer solo, **tampoco en otra computadora**, porque lo recuerda su cuenta y no el
navegador. Para verlo otra vez, **«Ver el recorrido»**, el primer botón de la barra de arriba del editor.

## 1. Requisitos

| ID | Requisito |
|---|---|
| GUI-01 | Una pieza reutilizable del website: `apps/web/src/components/recorrido-guiado.tsx` (`RecorridoGuiado`, `useRecorridoGuiado`, `BotonVerElRecorrido`). Cada interfaz le da su definición (pasos y textos, en `@be/domain`). |
| GUI-02 | Oscurece toda la pantalla menos un hueco sobre el elemento del paso, con un contorno cian. El cartel va al lado del hueco, sin taparlo y adentro de la ventana: abajo, arriba, a la derecha o a la izquierda, en ese orden. |
| GUI-03 | El cartel dice «Paso n de m», un título y una o dos frases, con «Omitir», «Anterior» y «Siguiente» (en el último, «Terminar»). «Anterior» está siempre; en el primer paso, apagado. |
| GUI-04 | Teclado: Escape omite; flecha derecha avanza y flecha izquierda retrocede; Tab y Shift+Tab no salen del cartel. El foco va al título en cada paso y vuelve adonde estaba al cerrar. |
| GUI-05 | Se adapta a la ventana: un paso cuyo elemento no está (o no se ve) se saltea, y «Paso n de m» cuenta solo los que están; si está cortado, la página se desplaza hasta él; al desplazar o cambiar el tamaño, el hueco y el cartel lo siguen. |
| GUI-06 | La API recuerda, **por usuario**, qué recorridos vio (`SEEN`) u omitió (`SKIPPED`): API-RGU-01 (leer) y API-RGU-02 (marcar uno). |
| GUI-07 | Autorización: cada usuario lee y marca solo lo suyo. La ruta no tiene titular; la identidad sale de la sesión y el cuerpo no la acepta. |
| GUI-08 | Aparece solo la primera vez que el usuario abre la interfaz: cuando la API dice que no lo vio. Mientras no se sabe, no se dibuja nada (no aparece y se va). |
| GUI-09 | Si la API falla al marcar, el navegador lo guarda (`localStorage`, por usuario) y se lo manda a la API la próxima vez que responda. Si falla al leer, decide lo que guardó el navegador. |
| GUI-10 | «Ver el recorrido»: `boton--discreto` (no un enlace subrayado), el primero de la barra de comandos de cada editor. |
| GUI-11 | Accesible: el cartel es un `dialog` con `aria-modal`, nombre, paso, título, texto y cómo se maneja con el teclado; el velo y el hueco son solo para la vista. Con `prefers-reduced-motion`, el desplazamiento no es suave y el cartel no se funde. |
| GUI-12 | Que se vea de BE: los colores salen de los tokens (`--superficie`, `--texto`, `--tenue`, `--borde`, `--cian`, `--sombra` y el nuevo `--velo-del-recorrido`, en los dos temas) y los botones son los del sistema. |
| GUI-13 | Nada se corre al aparecer (RP-19): todo es fijo a la ventana y va en un portal; no se bloquea el desplazamiento de la página. |
| GUI-14 | El recorrido del editor de Entrenamiento: días y sesiones; bloques «Seguido» y «En vueltas»; el ejercicio y sus series; «Cómo se escribe el esfuerzo» (RIR o RPE); «Agregar ejercicios» (el catálogo); «Revisar y activar…». |
| GUI-15 | El recorrido del editor de Nutrición: días tipo y comidas; opciones y alimentos; el «Reparto por comida» y las franjas con el promedio; «Rangos y totales»; «Opción de receta» (el cajón y el Recetario de BE); «Revisar y activar…». |
| GUI-16 | Textos cortos, en criollo, con los nombres de la pantalla. Nunca «cumplimiento», «adherencia», «racha», «puntaje», «asesorado» ni «estación»; en Entrenamiento, nunca «volumen»; ningún «%». |

## 2. Alcance

- **Entra:** la pieza del website, los dos recorridos (Entrenamiento y Nutrición), las anclas `data-recorrido` en los dos
  editores, API-RGU-01 y 02 con su tabla y su migración, la guía de UX (II.15), las pruebas.
- **No entra:** la APK (§8); recorridos de otras interfaces (la ficha, Analizar, Antropometría): la pieza ya sirve para
  ellas, con una definición nueva en `@be/domain` y sus anclas; la plantilla y el asistente de Entrenamiento (no lo
  muestran).
- **El otro frente:** `wp-opcion-como-receta` trabaja en `comida-del-editor.tsx`. Ahí solo se sumaron dos atributos
  (`data-recorrido="comida"` y `data-recorrido="opcion-de-receta"`).

## 3. Los pasos

Los textos viven en `packages/domain/src/recorridos-guiados.ts`. Cada paso nombra sus anclas en orden de preferencia.

**Editor del plan de Entrenamiento** (`training-plan-editor`):

| Paso | Ancla | Título |
|---|---|---|
| 1 | `sesiones` (la lista «Sesiones», con los días) | Sesiones y días |
| 2 | `bloque` (el primer bloque) o `agregar-bloque` («Agregar bloque») | Bloques: «Seguido» y «En vueltas» |
| 3 | `ejercicio` (el primer ejercicio) | El ejercicio y sus series |
| 4 | `esfuerzo` («Cómo se escribe el esfuerzo») | Cómo se escribe el esfuerzo |
| 5 | `agregar-ejercicio` («Agregar ejercicios») | Agregar ejercicios |
| 6 | `revisar-y-activar` (su atributo propio `data-revisar-y-activar`) | Revisar y activar… |

**Editor del plan de Nutrición** (`nutrition-plan-editor`):

| Paso | Ancla | Título |
|---|---|---|
| 1 | `dias-tipo` (el «Día tipo» y «Agregar») | Días tipo y comidas |
| 2 | `comida` (la primera comida) | Opciones y alimentos |
| 3 | `reparto` («Reparto por comida») | Reparto por comida |
| 4 | `rangos-y-totales` o, si no está a la vista, `panel-de-nutricion` | Rangos y totales |
| 5 | `opcion-de-receta` («Opción de receta», con una comida abierta) o `comida` | Recetas y Recetario de BE |
| 6 | `revisar-y-activar` | Revisar y activar… |

## 4. La API

- **API-RGU-01** `GET /me/guided-tours` → `{ data: [{ tourId, state, updatedAt }] }`. Uno que no está, no lo vio.
- **API-RGU-02** `PUT /me/guided-tours/{tourId}` con `{ state: 'SEEN' | 'SKIPPED' }` → `{ data: { tourId, state, updatedAt } }`.
  Idempotente por semántica (sin `Idempotency-Key`): el mismo estado no escribe ni audita; el otro lo reemplaza. Un
  `tourId` que no existe es 404; un estado que no existe o un campo de más, 400.
- Familia propia **RGU** (DL-195), declarada en `scripts/trazabilidad-de-operaciones.test.cjs`. `docs/api/openapi.json`
  regenerado.
- **La base:** `recorrido_guiado_visto` (identidad, recorrido, estado `VISTO`/`OMITIDO`, procedencia, momento), con clave
  primaria (identidad, recorrido) y un `CHECK` de la forma del identificador. Migración
  `20261123120000_recorridos_guiados`, que solo agrega. Cada cambio queda en la auditoría (`API-RGU-02`).

## 5. Decisiones del continuador (a ratificar)

| ID | Decisión | Por qué |
|---|---|---|
| GUI-D01 | **Sin librería: la pieza es propia.** driver.js (MIT) servía, pero suma una dependencia y su CSS para algo de unas 250 líneas, y había que pisarle los estilos y el foco para que se vea de BE y respete RP-19. | Menos superficie en la auditoría de dependencias; el foco, el teclado y los temas son los del sistema. |
| GUI-D02 | El hueco es **una sombra enorme** alrededor de un rectángulo fijo (no una máscara SVG), con contorno `--cian`, y una capa transparente toma los clics: mientras se recorre, la pantalla no se toca. | Es lo más simple que funciona en los dos temas y no mueve nada; tocar lo iluminado a mitad del recorrido lo dejaría desfasado. |
| GUI-D03 | Se recuerda **por usuario en la API**, con una tabla mínima propia (no había un lugar para preferencias del profesional: lo más parecido, `preferencia_de_recordatorio`, es por tipo de aviso con un enum cerrado). | Lo pidió Dirección («no por navegador»). Una tabla aparte no ensucia las preferencias de los avisos. |
| GUI-D04 | **Omitir y terminar cuentan igual:** los dos lo dan por visto. Se guarda cuál fue (`SKIPPED` o `SEEN`) para saber, más adelante, si se omite mucho. | Que aparezca de nuevo después de omitirlo sería insistir; para eso está «Ver el recorrido». |
| GUI-D05 | La base guarda el identificador como texto con un `CHECK` de forma; la **lista cerrada la valida la API** (@be/domain). | Sumar el recorrido de otra interfaz no pide una migración. |
| GUI-D06 | Las anclas son `data-recorrido="…"` en la pantalla, no clases ni `id`; si el lugar ya tenía un atributo propio `data-<ancla>`, vale ese («Revisar y activar…» es `data-revisar-y-activar`, que las guardias de la barra piden tal cual). Un paso puede tener varias; sin ninguna a la vista, se saltea. | Un atributo propio no se rompe cuando cambia el estilo, y la prueba del website comprueba que cada ancla exista. |
| GUI-D07 | **«Ver el recorrido»: el primer botón de la barra de comandos del editor**, a la izquierda del estado de guardado, con el ícono «info». No junto al «?» de «Cómo se lee esta vista». | El «?» está en el marco del área y se ve también sin el editor; la barra del editor es fija (ED-15), está siempre a la vista y el botón no se mueve al escribir. El «?» explica qué significa cada cosa; el recorrido, dónde está cada cosa. |
| GUI-D08 | Aparece solo cuando el editor cargó su versión, **una vez por apertura**: guardar o recargar la versión no lo vuelve a abrir. En la plantilla de Entrenamiento y en el asistente, no aparece ni se ofrece. | El asistente ya guía paso a paso; la plantilla no tiene sesiones con días ni «Revisar y activar…». |
| GUI-D09 | Los pasos presentes se calculan **al abrir**: «Paso n de m» no cambia mientras se recorre. Si un elemento desaparece a mitad, ese paso se saltea. | Un total que cambia a mitad confunde más que un paso que no está. |
| GUI-D10 | Si la API falla al leer, **aparece** (salvo que el navegador lo tenga guardado). Si falla al marcar, se guarda en el navegador y se manda después. | Mostrarlo una vez de más es menos grave que no mostrarlo nunca. |
| GUI-D11 | **Sin bloquear el desplazamiento** de la página mientras está abierto; el hueco no se anima (sigue al elemento cuadro a cuadro) y el cartel aparece con un fundido corto, que no está con `prefers-reduced-motion`. | Sacar la barra de desplazamiento corre todo de costado (RP-19); un hueco animado se atrasa al desplazar. |
| GUI-D12 | El recorrido de Nutrición explica el **cajón de recetas** desde su botón («Opción de receta»), sin abrirlo. | Abrir el cajón a mitad del recorrido cambia la pantalla y es una acción del profesional, no del tutorial. |

## 6. Pruebas

- **TEST-GUI-001 a 010** (`packages/domain/src/recorridos-guiados.test.ts`): los pasos sin ancla se saltean y «Paso n de
  m» cuenta solo los presentes; la primera ancla presente gana; moverse; cuándo aparece solo; el respaldo del navegador por
  usuario, unido con la API; el contrato; dónde va el cartel (abajo, arriba, derecha, izquierda, encima) sin tapar el
  hueco y adentro de la ventana; el hueco recortado a la ventana; los textos cortos y sin términos prohibidos; los pasos
  pedidos con los nombres de la pantalla.
- **TEST-GUI-011 a 015** (`apps/api/src/recorridos/recorridos.service.spec.ts`, sin base): cada usuario lee solo lo suyo;
  marcar escribe con la identidad de la sesión y no toca lo del otro; repetir no escribe ni audita; un recorrido que no
  existe es 404 sin tocar la base; un cuerpo con otro estado o con una identidad es 400.
- **TEST-GUI-016 a 019** (`test/integration/recorridos-guiados.int-spec.ts`, PostgreSQL): 401 sin sesión; dos usuarios
  que no se ven ni se pisan; repetir no audita otra vez; 404, 400 y el `CHECK` de la base.
- **TEST-GUI-020 a 023** (`apps/web/test/recorridos-guiados.test.mjs`): cada ancla está en la pantalla; los dos editores
  montan su recorrido y su botón; el botón es discreto y el cartel un diálogo con su teclado; el estilo sale de los tokens.
- **Navegador** (`test/navegador/recorridos.mjs`, `recorridosGuiados`): aparece la primera vez (diálogo modal, foco
  adentro, «Paso 1 de n»), el cartel no tapa el hueco y queda en la ventana, las flechas y Tab, Escape lo omite (la API lo
  guarda) sin correr nada, «Ver el recorrido» lo vuelve a mostrar hasta «Terminar» (la API dice visto), y al recargar no
  aparece. Los demás recorridos del navegador empiezan con los dos recorridos guiados omitidos por la API, porque el
  recorrido es modal.
- `scripts/contraste.test.cjs`, `scripts/acciones-y-ayudas.test.cjs` y `scripts/trazabilidad-de-operaciones.test.cjs`
  siguen en verde; el CSS se leyó con postcss.

## 7. A qué prestar atención al probarlo

- La primera vez en cada editor aparece solo; en otra computadora, con la misma cuenta, ya no.
- A 1280 × 800 y al 200 %: el cartel no tapa la zona y no sale de la ventana; si la zona es más alta que la ventana, la
  página se desplaza hasta su comienzo.
- En Nutrición, si el panel de la derecha está en otra pestaña o cerrado, el paso de «Rangos y totales» ilumina el panel.
- Con un lector de pantalla: al abrir lee el nombre del recorrido, el paso, el título, el texto y cómo se maneja.

## 8. La APK (para una versión siguiente)

No se tocó en este paquete. Cómo se haría:

- **La misma fuente:** las definiciones de `@be/domain` sirven tal cual (los pasos, los textos, `pasosPresentes`,
  `moverse`, `apareceSolo`, `ubicarCartel`), con una definición por pantalla (Nutrición · Hoy, Entrenamiento · Hoy, la
  sesión en curso) y API-RGU-01 y 02 con identificadores nuevos (`app-…`), que la API acepta sumándolos a la lista.
- **Las anclas:** en React Native no hay `data-*`: cada zona registra su `ref` en un contexto (`useAnclaDelRecorrido('…')`)
  y se mide con `measureInWindow`. Si la zona está en un `ScrollView`, se desplaza con `scrollTo` antes de medir.
- **El velo:** un `Modal` transparente con cuatro rectángulos alrededor del hueco (o `react-native-svg` con una máscara,
  que ya está en la APK); el cartel, con los colores de `tema.ts` en los dos temas.
- **Accesibilidad:** `accessibilityViewIsModal` en el cartel, el foco de TalkBack al título en cada paso
  (`AccessibilityInfo.setAccessibilityFocus`) y el botón Atrás de Android como «Omitir». Sin gestos exclusivos (B10-06).
- **Dónde se vuelve a ver:** en el menú de la app, una entrada «Ver el recorrido» por pantalla, o el «?» de la cabecera.
- **Compatibilidad:** sin una API con RGU (una APK nueva contra una API vieja), el respaldo local (`AsyncStorage`) decide.
