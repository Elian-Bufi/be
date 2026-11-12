# WP-APP-VUELTA-2 — los oráculos TEST-AV2 de la etapa A

> **Qué es esto.** El paquete (`WP-APP-VUELTA-2.md` §8) declaró los oráculos TEST-AV2-001 a 026 en una línea cada uno.
> Acá van escritos con los trece campos que la §6 del 11A declara obligatorios (11A:150-169), como los TEST-AVR de
> `WP-APP-VUELTA-DE-ROSCA-ORACULOS.md`. Este archivo trae los de la **etapa A** (AV2-01 a AV2-15), que Dirección aprobó el
> 2026-11-11 junto con AV2-D1 (paso 1), AV2-D2 y AV2-D11; para AV2-D3, D4, D5, D7 y D8 rigen las recomendaciones del
> paquete. Los TEST-AV2-017 a 025 son de la etapa B y se escriben con su tanda.
>
> **Qué no es esto.** No modifica el 11A, protegido por `docs/MANIFEST.sha256`.
>
> **De dónde sale cada oráculo.** De DL-170 (`docs/DEUDA_LEGAJO.md`:7347), del paquete (con referencia `archivo:línea`
> a la versión declarada en `bb29e50`) y de las decisiones de Dirección del 2026-11-11. Un oráculo dice qué hay que
> observar para aceptar la prueba: no inventa la regla, la lee.
>
> **Cómo se escribieron.** Cada oráculo se escribió antes del código de su parte, y su prueba se verificó con una
> mutación: se rompe a propósito la regla en el código, la prueba se pone en rojo y se vuelve atrás. La mutación de cada
> uno está en su campo AUTOMATION, y el resultado de las corridas, en `EVIDENCIA/APP-VUELTA-2/LEEME.md`.
>
> **Lo que solo se ve en el teléfono** (el degradé y la sombra dibujados por Android, TalkBack, la letra ×1,3 y el
> rendimiento) se dice en EVIDENCE_EXPECTED y queda para la muestra (AV2-18): ninguna de estas pruebas lo da por
> aprobado. El render del navegador no usa Yoga y no dibuja estas propiedades como Android.

---

## TEST-AV2-001 — La receta pasa AA en el peor punto, en los dos temas

```text
TEST_ID              TEST-AV2-001
TITLE                El texto, los bordes de control y las marcas de Inicio pasan WCAG 2.2 AA sobre el fondo con luz y
                     sobre el vidrio, en Azul noche y en Claro, en el peor punto
LEVEL                APK (tokens de tema.ts)
PRIORITY             P1 — RNF-ACC-001 y B10-10: la accesibilidad no se negocia
SOURCES              AV2-01 (WP-APP-VUELTA-2.md:369-389) · §3.1 (:215-249) · §5.2 (:875-900) · RNF-ACC-001 · B10-10
PRECONDITIONS        Los tokens de §3.1 en `apps/mobile/src/tema.ts`, con las mismas claves en los dos temas.
SYNTHETIC_FIXTURE    No usa datos de personas: solo los colores.
STEPS                1. Armar los puntos del fondo: `fondoArriba`, `fondo` y `fondoAbajo`, cada uno solo, con cada
                        destello solo y con los dos juntos (en los dos órdenes).
                     2. Medir texto, tenue, acento, éxito y error directo sobre cada punto, sobre `vidrio` encima de
                        cada uno (con y sin el brillo de arriba) y sobre `vidrioInterior` encima del vidrio.
                     3. Medir `botonTexto` sobre `botonFondo` y `botonFondoFin`; `bordeControl` sobre el vidrio y el
                        nivel 2; la tilde del día sobre `exito`, el círculo y el aro de hoy contra la tarjeta.
                     4. Medir el tenue y la tilde sobre la etiqueta de estado, y acento, tenue y texto sobre «la que
                        sigue», sobre el vidrio y sobre `superficie` (interruptor apagado o alto contraste).
                     5. Medir las etiquetas de la barra sobre su vidrio, con cada color opaco del tema detrás.
EXPECTED             1-2 → cada texto, 4,5:1 o más en su peor punto. 3 → el botón, 4,5:1 o más arriba y abajo; el borde
                     de control, la tilde, el círculo y el aro, 3:1 o más. 4 → 4,5:1 o más para el texto y 3:1 para la
                     tilde. 5 → 4,5:1 o más. Las cifras coinciden con §5.2 del paquete (Azul noche, tenue directo:
                     4,55; Claro, error directo: 4,54).
NEGATIVE_ASSERTIONS  Ningún color de la APK se escribe fuera de tema.ts (la prueba de siempre falla con un literal). Los
                     dos temas no difieren en las claves. `laminaBrillo` ya no existe.
AUTOMATION           scripts/contraste.test.cjs («APK · la receta de vidrio pasa AA en el peor punto…»). Mutación: los
                     destellos de Azul noche al 14 % y al 18 % (#27D5F924 y #1D98DE2E) → el tenue directo baja a 4,16:1
                     y el error a 4,47:1, y la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde y la tabla de contraste, con el peor punto de cada par, en EVIDENCIA/APP-VUELTA-2/LEEME.md
```

---

## TEST-AV2-002 — La superficie por nivel; con alto contraste o con el interruptor apagado, la opaca de hoy

```text
TEST_ID              TEST-AV2-002
TITLE                `superficieDeVidrio` da el nivel 1 con sombra, el nivel 2 sin sombra, y la superficie opaca cuando
                     el vidrio no corresponde
LEVEL                APK (lógica pura de la receta)
PRIORITY             P1 — el vidrio se prende y se apaga desde un solo lugar
SOURCES              AV2-02 (WP-APP-VUELTA-2.md:391-409) · §3.2 (:251-289) · §3.3 (:291-303) · AV2-T2 a T4 (:1020-1022)
PRECONDITIONS        `apps/mobile/src/receta-de-vidrio.ts` (la receta pura) y `vidrio.tsx` (el contexto y los ganchos).
SYNTHETIC_FIXTURE    Las paletas de Azul noche y Claro leídas de tema.ts.
STEPS                1. Pedir la superficie de nivel 1 y de nivel 2 con el vidrio prendido, en los dos temas.
                     2. Pedirla con el interruptor apagado, y con el «Texto de alto contraste» encendido.
                     3. Pedir el nivel que sigue a cada contexto: fuera de toda tarjeta, dentro de una de nivel 1 y
                        dentro de una de nivel 2.
                     4. Pedir el brillo de arriba de un nivel 1.
EXPECTED             1 → nivel 1: `vidrio`, borde de 1 dp en `vidrioFilo`, radio 20, la sombra exterior en
                     `sombraVidrio` {0, 8, 24, −4} (Claro {0, 8, 24}) y la línea de luz por dentro {0, 1, 0} si
                     `vidrioLuz` se ve; nivel 2: `vidrioInterior`, radio 14, sin sombra. 2 → `superficie`, el borde de
                     siempre y nada más. 3 → afuera, nivel 1; dentro de un nivel 1, nivel 2; dentro de un nivel 2, sin
                     relleno (vidrio dentro de vidrio se ensucia). 4 → en Azul noche, un degradé que termina en el mismo
                     color con alfa 00 a 12 dp o menos, que es el relleno más chico de un nivel 1; en Claro, ninguno.
NEGATIVE_ASSERTIONS  El nivel 2 nunca lleva sombra. Ninguna superficie translúcida usa «transparent» en un degradé.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-002 · …»). Mutación: devolver la sombra también en el
                     nivel 2 → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono (AV2-18), Inicio con el vidrio y las demás pantallas como hoy
```

---

## TEST-AV2-003 — El vidrio no agrega vistas hijas, y lo translúcido no usa `elevation`

```text
TEST_ID              TEST-AV2-003
TITLE                La receta se aplica con estilos de la misma vista: sin vistas hijas, sin SVG y sin `elevation`
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — la excepción 13 (nada adentro que pueda quedar recortado) y la sombra sin mancha
SOURCES              AV2-02 (WP-APP-VUELTA-2.md:391-409) · §3.2 (:261-269) · AV2-T3 y T4 (:1021-1022) ·
                     WP-ENTRENAMIENTO-SERIES §7.7
PRECONDITIONS        `receta-de-vidrio.ts`, `vidrio.tsx` y las piezas de `ui.tsx` que la usan.
SYNTHETIC_FIXTURE    Las paletas de los dos temas.
STEPS                1. Pedir las superficies translúcidas (nivel 1 y nivel 2) y revisar sus claves.
                     2. Leer `vidrio.tsx` y `receta-de-vidrio.ts`.
EXPECTED             1 → ninguna lleva `elevation`; la sombra es `boxShadow`. 2 → ninguno dibuja una vista, un SVG ni algo
                     con posición absoluta: solo devuelven estilos y un contexto.
NEGATIVE_ASSERTIONS  `sombraDeVidrio` (con `elevation`) se queda solo para la lámina de la figura: ninguna pieza nueva
                     la usa.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-003 · …»). Mutación: `elevation: 3` en el nivel 1 →
                     la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, la sombra sin mancha a través del vidrio (AV2-18)
```

---

## TEST-AV2-004 — El fondo, fuera del desplazamiento, oculto al lector y sin toques; liso con alto contraste

```text
TEST_ID              TEST-AV2-004
TITLE                `FondoDeLaApp` es el primer hijo de la raíz, quieto, sin toques y sin lector, y su degradé sale de
                     los tokens con las medidas de la ventana
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1
SOURCES              AV2-03 (WP-APP-VUELTA-2.md:411-428) · §3.2 (:273-274, :278-280) · AV2-T1 (:1017-1019)
PRECONDITIONS        `apps/mobile/src/fondo-de-la-app.tsx`, `receta-de-vidrio.ts` (`recetaDelFondo`) y `App.tsx`.
SYNTHETIC_FIXTURE    Una ventana de 360 × 800 dp y otra de 412 × 915 dp, en los dos temas.
STEPS                1. Pedir la receta del fondo para cada ventana y cada tema.
                     2. Leer la raíz de App.tsx y el componente del fondo.
                     3. Leer el velo de la barra.
EXPECTED             1 → tres capas: los dos destellos radiales (en `destello` y `destelloAzul`, que se apagan en el
                     mismo color con alfa 00) y el degradé lineal de `fondoArriba` a `fondoAbajo` con `fondo` al 55 %
                     (Azul noche) o al medio (Claro). Las posiciones y los tamaños de los destellos son números de dp
                     calculados con el ancho y el alto de la ventana, no porcentajes. 2 → `<FondoDeLaApp` va antes de
                     la cabecera y del desplazamiento; es absoluto, con `pointerEvents="none"`, `accessible={false}` y
                     oculto al lector; sus medidas salen de `useWindowDimensions`; con alto contraste no dibuja nada y
                     la raíz pinta `fondo` liso. 3 → el velo sale de `fondoAbajo`.
NEGATIVE_ASSERTIONS  El fondo no está dentro del `ScrollView` (no se vuelve a dibujar al desplazar). No hay SVG ni mapa
                     de bits en el fondo (AV2-T1).
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-004 · …»). Mutación: quitar
                     `pointerEvents="none"` del fondo → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, el fondo quieto al desplazar y sin saltos al abrir el teclado (AV2-18)
```

---

## TEST-AV2-005 — El resplandor solo en el principal habilitado; el enlace con flecha sin subrayado; la etiqueta sin borde

```text
TEST_ID              TEST-AV2-005
TITLE                Las piezas base: el botón principal, el enlace con flecha y la etiqueta de estado
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — el cian solo en lo que se toca; nada parece un botón si no lo es
SOURCES              AV2-04 (WP-APP-VUELTA-2.md:430-453) · §3.3 (:293-297) · GUIA-UX-UI I.8
PRECONDITIONS        `receta-de-vidrio.ts` (`botonPrincipal`, `estiloDeLaEtiqueta`, `subrayadoDelEnlace`) y `ui.tsx`.
SYNTHETIC_FIXTURE    Las paletas de los dos temas.
STEPS                1. Pedir el botón principal habilitado y deshabilitado, con el vidrio prendido y apagado.
                     2. Pedir el estilo de un enlace con flecha y de uno sin flecha; leer el enlace en `ui.tsx`.
                     3. Pedir la etiqueta de estado sobre una tarjeta de nivel 1 y dentro de un nivel 2; leer la
                        `Insignia` de `ui.tsx`.
EXPECTED             1 → con el vidrio y habilitado: el degradé de `botonFondo` a `botonFondoFin`, radio 14, el borde
                     de 2 dp sin color y el resplandor en `resplandorPrimario` {0, 6, 18}; deshabilitado, sin
                     resplandor; sin el vidrio, el botón de siempre. 2 → con flecha, sin subrayado y con el chevron
                     (`derecha`, 18 dp) pegado al texto; sin flecha, subrayado; el rol sigue siendo «link». 3 → sin
                     borde, rellena con `etiquetaFondo` sobre un nivel 1 y sin relleno dentro de un nivel 2; el texto en
                     `tenue`; lo hecho lleva la tilde en `exito`.
NEGATIVE_ASSERTIONS  Nada pulsa ni se anima: el resplandor es quieto. La etiqueta no tiene borde de 2 dp ni el texto en
                     cian.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-005 · …»). Mutación: el resplandor también con el
                     botón deshabilitado → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, «Continuar» con degradé y brillo, y TalkBack leyendo «enlace» (AV2-18)
```

---

## TEST-AV2-006 — La cabecera: el logo con nombre, el punto sin número y el ambiente en `test`

```text
TEST_ID              TEST-AV2-006
TITLE                La cabecera transparente: logo en las raíces, «Volver» en un detalle, la campana con un punto y el
                     número solo para el lector
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1
SOURCES              AV2-05 (WP-APP-VUELTA-2.md:455-470) · AV2-D7 (:986-989) · AV2-D8 (:990-993) · 08 §33 · §3.4 (:312-313)
PRECONDITIONS        `apps/mobile/src/cabecera.tsx` y `App.tsx`.
SYNTHETIC_FIXTURE    47 novedades sin leer; ninguna sin leer.
STEPS                1. Pedir el nombre accesible de la campana con 47 sin leer y con ninguna.
                     2. Pedir si se dibuja el punto, en los dos casos.
                     3. Leer la cabecera: la fila, el logo, «Volver» y la línea del ambiente.
EXPECTED             1 → «Novedades, 47 sin leer» y «Novedades»; el lector agrega «botón». 2 → con 47, un punto de 8 dp
                     en el acento; con ninguna, nada. 3 → la fila mide 48 dp; el fondo es transparente y no hay línea
                     abajo; el logo va a la izquierda solo en las raíces, accesible y con el nombre «BE», sin el texto
                     «BE» visible; en un detalle va «Volver»; la línea «Ambiente de prueba · solo datos sintéticos»
                     sigue, en `tenue`, debajo de la fila.
NEGATIVE_ASSERTIONS  La campana no dibuja el número ni «99+». El brillo del logo no se lee.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-006 · …»). Mutación: volver a dibujar el número dentro
                     de la campana → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; TalkBack en el teléfono: «BE» una vez y «Novedades, 47 sin leer, botón» (AV2-18)
```

---

## TEST-AV2-007 — La barra: un destino de 52 dp, dos filas con ×1,3 y opaca en la sesión

```text
TEST_ID              TEST-AV2-007
TITLE                La barra con la receta: el destino más bajo, la misma disposición con letra grande y la sesión opaca
LEVEL                APK (lógica pura de la disposición y estructura del código)
PRIORITY             P1 — PV-11: durante la sesión nada se ve a través de la barra
SOURCES              AV2-06 (WP-APP-VUELTA-2.md:472-486) · DL-166 PV-11 y PV-13 · DL-117
PRECONDITIONS        `disposicion-de-la-barra.ts` y `barra-de-zonas.tsx`.
SYNTHETIC_FIXTURE    Anchos de 320, 360, 390 y 412 dp; letra ×1 a ×2.
STEPS                1. Leer el alto del destino.
                     2. Disponer la barra a 360 dp con letra ×1,3.
                     3. Pedir el fondo de la barra flotante y de la fija.
                     4. Leer la cápsula.
EXPECTED             1 → 52 dp, por encima de los 48 del objetivo táctil. 2 → dos filas enteras, Evolución y Perfil
                     abajo, sin achicar la letra. 3 → flotante, `barraVidrio`; fija, `fondo`, opaco en los dos temas.
                     4 → borde y línea de luz y `boxShadow`, sin `elevation`.
NEGATIVE_ASSERTIONS  Ninguna etiqueta se corta ni se achica en una fila. La barra fija no usa el vidrio.
AUTOMATION           scripts/barra-de-zonas.test.mjs («TEST-AV2-007 · …»). Mutación: la barra fija con `barraVidrio` →
                     la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, la sesión con la barra opaca (AV2-18)
```

---

## TEST-AV2-008 — Inicio según la maqueta: la fecha, los bloques, una columna con ×1,3 y el nombre del día

```text
TEST_ID              TEST-AV2-008
TITLE                Inicio: la fecha como título, qué bloques aparecen y en qué orden, la composición con ×1 y ×1,3, y
                     el nombre del día solo con más de un tipo de día
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1
SOURCES              AV2-07 (WP-APP-VUELTA-2.md:488-517) · §1.1 (:81-108) · §1.2 (:110-144) · DL-049 · DL-077 · DL-143
PRECONDITIONS        `pantallas/inicio.tsx` y sus tarjetas; `inicio-de-hoy.ts`.
SYNTHETIC_FIXTURE    Una persona con planes de Entrenamiento y de Nutrición; un plan con un solo tipo de día y otro con
                     dos; una toma con peso y otra sin peso.
STEPS                1. Leer el título y el orden de los bloques de `inicio.tsx`.
                     2. Pedir las columnas a 360 y a 412 dp con letra ×1, ×1,15 y ×1,3, también con la escala como la
                        manda Android: un `float` pasado a `double` (`DeviceInfoModule.kt`, `fontScale.toDouble()`),
                        así que «×1,3» llega como 1,2999999523… (`Math.fround(1.3)`) y «×1,15» como 1,1499999761…; con
                        nombres de comidas de una palabra larga («Preentrenamiento») y con los títulos de las tarjetas
                        chicas («Mediciones», que se ve cada vez que Inicio carga, y «Actividad»). Pedir el círculo de
                        cada día de la tira a 360 dp.
                     3. Pedir el nombre del día bajo «Comidas» con uno y con dos tipos de día.
                     4. Pedir el texto de la tarjeta de la medida con diferencia cero, con diferencia y sin anterior.
EXPECTED             1 → el título es la fecha («Lunes 9 de noviembre»), sin «Hola»; de arriba abajo: el paso que falta,
                     la tira, Entrenamiento, Comidas, «Para responder» y, al final, la medida y la actividad. Sin el
                     rótulo «Para mirar». 2 → ×1 y ×1,15: dos columnas; ×1,3, también 1,2999999523…: una. Las fichas
                     pasan a una columna si la palabra más larga de algún nombre no entra en media tarjeta. En las
                     tarjetas chicas, el ícono va arriba del título si al lado no entra («Mediciones» a 360 dp), y pasan
                     a una columna si tampoco entra arriba. Con dos columnas, ninguna palabra se parte (con la
                     estimación de Nutrición, 0,56 em por carácter en negrita). El círculo del día mide 34 dp a 360 dp:
                     la tira ocupa la tarjeta entera, no media. 3 → con uno, nada; con dos, su nombre.
                     4 → «Sin cambio desde el 2 sept», «+0,4 kg desde el 2 sept» (sin color ni flecha), y el texto de
                     siempre sin anterior; el título es el nombre de la medida destacada.
NEGATIVE_ASSERTIONS  Inicio no escribe nada. No hay «%» ni «2/4» en Inicio. No dice «16 medidas · 6 resultados de
                     fórmulas» ni «Ver su evolución». Ninguna escala se compara con un literal: el umbral de la letra
                     grande vive en `escala-de-letra.ts`.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-008 · …») y scripts/inicio.test.mjs. Mutaciones:
                     mostrar el nombre del día con un solo tipo → la prueba falla; comparar la escala con el literal
                     (`>= 1.3`) → 1,2999999523… da dos columnas y la prueba falla; las fichas sin mirar los nombres →
                     «Preentrenamiento» queda en dos columnas y la prueba falla; el ícono siempre al lado → la prueba
                     falla; la tira con media tarjeta → el círculo mide 17 dp y la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, Inicio a 360 dp con letra ×1, ×1,15 y ×1,3 (la de los ajustes de
                     Android, no un valor exacto), en los dos temas, mientras carga y con una cuenta sin tomas (AV2-18)
```

---

## TEST-AV2-009 — La tira: la tilde solo con una realizada; lo demás neutro; hoy con aro; sin días seguidos ni ceros

```text
TEST_ID              TEST-AV2-009
TITLE                La tira de la semana, de lunes a domingo, celebra lo hecho y deja neutro lo demás
LEVEL                APK (lógica pura)
PRIORITY             P1 — TEST-PRJ-009 y la decisión del 2026-11-08: celebrar sin rachas, lo no hecho neutro
SOURCES              AV2-08 (WP-APP-VUELTA-2.md:519-539) · AV2-D5 (:976-978) · §3.4 (:315) · DL-106 · DL-170
PRECONDITIONS        `inicio-de-hoy.ts` (`semanaDeEntrenamiento`) y `lecturas-de-inicio.ts` (el detalle por día).
SYNTHETIC_FIXTURE    Una semana con una realizada el lunes, una realizada con desvío el miércoles, una «No realizada»
                     el martes, una corregida de «No realizada» a «Realizada», un día por venir y hoy; el domingo y el
                     lunes siguientes para el cambio de semana.
STEPS                1. Armar la semana con el detalle por día de la lectura de 30 días y lo registrado hoy en API-TRN-14.
                     2. Armarla mientras la lectura todavía no llegó.
                     3. Pedir la etiqueta para el lector y la línea de abajo.
EXPECTED             1 → lunes a domingo de la semana de hoy; el lunes y el miércoles, con la tilde; el martes, neutro
                     como un día sin sesión y como uno por venir; la corregida cuenta como quedó; hoy, con el aro;
                     lo de hoy en API-TRN-14 se suma sin contarlo dos veces. 2 → los siete días sin tildes y sin línea.
                     3 → «Esta semana: lunes y miércoles con sesión realizada. Hoy, lunes 9»; «2 sesiones realizadas esta
                     semana»; sin ninguna, sin línea.
NEGATIVE_ASSERTIONS  Nunca rojo ni cruz; ninguna cuenta de días seguidos; nada pasa a la semana siguiente (el lunes
                     arranca vacía); ningún «0».
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-009 · …»). Mutación: la tilde también en un día con
                     solo una «No realizada» → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, la tira con la cuenta sintética y TalkBack con una sola etiqueta (AV2-18)
```

---

## TEST-AV2-010 — Con una sesión en curso, ninguna otra ofrece empezar; «En curso» es la corrida abierta

```text
TEST_ID              TEST-AV2-010
TITLE                `sePuedeIniciar` y la etiqueta de la sesión: la corrida abierta manda
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — error 1 de la crítica de la 0.23
SOURCES              AV2-09 (WP-APP-VUELTA-2.md:541-565) · §1.3 fila 1 (:153) · AV2-D4 (:972-975) · DL-077
PRECONDITIONS        `sesion-en-curso.ts`, `pantallas/inicio-entrenamiento.tsx` y `pantallas/entrenamiento.tsx`.
SYNTHETIC_FIXTURE    «Piernas A» en curso (de la API o del teléfono) y «Torso B» planificada hoy; un borrador de «Ya la
                     hice» a medias sin corrida; la corrida en pausa.
STEPS                1. Preguntar si se puede iniciar cada sesión, sin ninguna en curso y con «Piernas A» en curso.
                     2. Pedir la etiqueta de cada sesión.
                     3. Pedir la línea del ejercicio y la serie de una corrida de este teléfono.
                     4. Leer Inicio y Entrenamiento.
EXPECTED             1 → sin ninguna, las dos; con «Piernas A», solo «Piernas A». 2 → «En curso» (o «En pausa») solo para
                     la corrida abierta; el borrador sin corrida dice «Sin registrar». 3 → «Sentadilla goblet · serie 3»
                     solo si la corrida es de este teléfono. 4 → con una en curso, Inicio muestra solo esa sesión con
                     «Continuar» y «Ver las N sesiones»; Entrenamiento no ofrece «Iniciar entrenamiento» ni «Hacerla hoy»
                     a otra y dice «Hay un entrenamiento en curso: Piernas A. Para iniciar otra, primero continualo o
                     dejalo incompleto.»; «Ya la hice» sigue en Entrenamiento y no en Inicio.
NEGATIVE_ASSERTIONS  El freno reactivo de `useAbrirOcurrencia` sigue como red de seguridad.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-010 · …»). Mutación: `sePuedeIniciar` siempre
                     verdadero → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, con una sesión en curso, Inicio y Entrenamiento (AV2-18)
```

---

## TEST-AV2-011 — «La que sigue», anclada en la última registrada hoy; las anteriores, neutras

```text
TEST_ID              TEST-AV2-011
TITLE                La comida que sigue es la primera sin registrar después de la registrada que va más adelante en el
                     plan, para Inicio y para Nutrición
LEVEL                APK (lógica pura)
PRIORITY             P1 — error 2 de la crítica, con AV2-D1 (paso 1) ratificada por Dirección el 2026-11-11
SOURCES              AV2-10 (WP-APP-VUELTA-2.md:567-585) · AV2-D1 (:944-955) · §1.3 fila 2 (:154) · DL-049
PRECONDITIONS        `inicio-de-hoy.ts` y `comidas-de-hoy.ts` (`comidaQueSeMuestra`).
SYNTHETIC_FIXTURE    Desayuno, Almuerzo, Merienda y Cena; el Almuerzo registrado a las 13:10; registros fuera de orden
                     (el Desayuno registrado después del Almuerzo); una comida diferente; la Cena registrada.
STEPS                1. Armar las fichas con el Almuerzo registrado.
                     2. Armarlas con la Merienda registrada antes que el Desayuno.
                     3. Armarlas con la Cena registrada, y sin nada registrado.
                     4. Pedir la comida que abre Nutrición sin elegida.
EXPECTED             1 → Merienda «la que sigue» («Registrar», con el borde del acento y el tinte), Desayuno «Sin
                     registrar», Almuerzo registrado con su hora y Cena «3 opciones». 2 → manda el orden del plan: sigue
                     la Cena. 3 → con la Cena, ninguna destacada; sin nada, la primera del plan. 4 → la misma que Inicio
                     destaca.
NEGATIVE_ASSERTIONS  Ningún texto dice «te salteaste» ni «pendiente»; nada va en rojo; la hora de los registros no
                     decide.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs (TEST-AVR-010, actualizado con AV2-D1, y «TEST-AV2-011 · …»).
                     Mutación: anclar en la primera registrada y no en la última → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, a las 18:27 con el almuerzo registrado, la Merienda destacada (AV2-18)
```

---

## TEST-AV2-012 — El título de la ayuda, sin `flex`

```text
TEST_ID              TEST-AV2-012
TITLE                «Cómo se lee» y su (?) quedan en la misma línea: el título de la ayuda no se estira
LEVEL                APK (estructura del código)
PRIORITY             P2 — error 4 de la crítica
SOURCES              AV2-11 (WP-APP-VUELTA-2.md:587-596) · §1.3 fila 4 (:156)
PRECONDITIONS        `apps/mobile/src/ui.tsx`.
SYNTHETIC_FIXTURE    No usa datos.
STEPS                1. Leer el estilo `tituloDeAyuda`.
EXPECTED             1 → no lleva `flex` (ni `flex: 1` ni `flexGrow`): el ancho lo toma `textoDeDesplegable`.
NEGATIVE_ASSERTIONS  Ningún estilo del título de un desplegable vuelve a llevar `flex`.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-012 · …»). Mutación: volver a poner `flex: 1` en
                     `tituloDeAyuda` → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, con letra ×1 y ×1,3, el título y el (?) centrados (el render del
                     navegador no usa Yoga)
```

---

## TEST-AV2-013 — La actividad: sin ceros, sin sumar lo hecho con lo no hecho, la misma cuenta en las tres vistas

```text
TEST_ID              TEST-AV2-013
TITLE                Inicio, Tu historial y la tira cuentan igual, desde la misma lectura y la misma clave
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — errores 5 y 6 de la crítica, con AV2-D2 ratificada por Dirección el 2026-11-11
SOURCES              AV2-12 (WP-APP-VUELTA-2.md:598-619) · AV2-D2 (:956-963) · §3.4 (:319) · DL-106
PRECONDITIONS        `inicio-de-hoy.ts`, `textos-del-descanso.ts`, `pantallas/historial.tsx` y `pantallas/inicio.tsx`.
SYNTHETIC_FIXTURE    2 realizadas (1 con desvío) y 1 no realizada en 30 días; sin desvío; solo no realizadas; nada.
STEPS                1. Armar el texto de Inicio, el de Tu historial y la línea de la tira.
                     2. Leer de dónde salen.
EXPECTED             1 → Inicio: «2 realizadas · 1 no realizada · 30 días»; Tu historial: «Últimos 30 días: 2 realizadas
                     (1 con desvío) y 1 no realizada.»; sin desvío: «Últimos 30 días: 2 realizadas y 1 no realizada.»;
                     el lector de Inicio: «Actividad de los últimos 30 días: 2 realizadas y 1 no realizada». Las
                     realizadas de Inicio son las realizadas más las con desvío del historial, y las no realizadas son
                     las mismas. 2 → las tres usan `leerActividadDeEntrenamiento` con la clave `inicio-actividad:…`.
NEGATIVE_ASSERTIONS  Ninguna frase muestra un cero («0 con desvío», «0 no realizadas»). Ninguna suma lo hecho con lo no
                     hecho en un solo número.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs (TEST-AVR-012 y 013, actualizados con AV2-D2, y «TEST-AV2-013 ·
                     …»). Mutación: volver a imprimir «0 con desvío» → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, las dos pantallas con la misma cuenta (AV2-18)
```

---

## TEST-AV2-014 — La comida diferente cuenta como registrada en Inicio, como en Nutrición

```text
TEST_ID              TEST-AV2-014
TITLE                Inicio lee API-ING-01, como Nutrición: una comida diferente ocupa su comida y no es «fuera del plan»
LEVEL                APK (lógica pura y estructura del código)
PRIORITY             P1 — defecto nuevo, severidad alta
SOURCES              AV2-13 (WP-APP-VUELTA-2.md:621-635) · §1.3 «Nuevo, severidad alta» (:159) · DL-121 · API-ING-01
PRECONDITIONS        `inicio-de-hoy.ts` (`comidasDeHoy`), `comidas-de-hoy.ts` y `pantallas/inicio-nutricion.tsx`.
SYNTHETIC_FIXTURE    Un día con Desayuno, Almuerzo, Merienda y Cena; una «comida diferente» registrada en el Almuerzo a
                     las 13:10 (`DIFFERENT`, con la comida); un registro fuera del plan (sin comida); una comida anulada.
STEPS                1. Armar las fichas de Inicio con esos registros.
                     2. Leer de dónde sale la lectura de Inicio.
EXPECTED             1 → el Almuerzo figura registrado a las 13:10; «fuera del plan» cuenta 1 (solo el que no ocupa una
                     comida); la anulada no cuenta, y su comida queda libre. 2 → Inicio usa `useHoyConOpciones`, la
                     misma lectura y la misma clave que Nutrición (`hoy-con-opciones:…`), y ya no lee API-NUT-14.
NEGATIVE_ASSERTIONS  Una comida diferente nunca se cuenta «fuera del plan». API-NUT-14 no cambia.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-014 · …»). Mutación: volver a contar solo los registros
                     de una opción del plan (`PLAN_OPTION`) → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, una comida diferente registrada en Nutrición y vista en Inicio (AV2-18)
```

---

## TEST-AV2-015 — Tocar una ficha abre esa comida

```text
TEST_ID              TEST-AV2-015
TITLE                La ruta de una ficha lleva su comida, y Nutrición la toma como la elegida
LEVEL                APK (lógica pura de la navegación y de Nutrición)
PRIORITY             P1 — defecto nuevo
SOURCES              AV2-14 (WP-APP-VUELTA-2.md:637-643) · §1.3 «Nuevo» (:160)
PRECONDITIONS        `navegacion.ts`, `inicio-de-hoy.ts` (`rutaDeLaFicha`) y `comidas-de-hoy.ts`.
SYNTHETIC_FIXTURE    «Merienda · Registrar», «Desayuno · Sin registrar», «Almuerzo» registrado; una comida que no está
                     en el plan.
STEPS                1. Pedir la ruta de cada ficha.
                     2. Navegar con esa ruta desde Inicio.
                     3. Pedir la comida que abre Nutrición con el pedido, con una elección anterior recordada.
EXPECTED             1 → sin registro: `{ nombre: 'hoy', accion: 'registrar', comida: mealId }`; registrada: su registro.
                     2 → la ruta conserva la comida. 3 → la del pedido, aunque haya otra recordada; si el pedido no está
                     en el plan, la recordada.
NEGATIVE_ASSERTIONS  Volver a Nutrición desde un detalle no repite el pedido.
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-015 · …»). Mutación: perder la comida al armar la
                     ruta → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; en el teléfono, tocar «Merienda · Registrar» abre la Merienda (AV2-18)
```

---

## TEST-AV2-016 — Las fechas en tres formas y la hora en 24 h

```text
TEST_ID              TEST-AV2-016
TITLE                El título del día, la fecha dentro de un texto y la hora de 24 h, desde un solo lugar
LEVEL                APK (lógica pura)
PRIORITY             P1
SOURCES              AV2-15 (WP-APP-VUELTA-2.md:645-655) · §1.4 «Cuatro formatos de fecha» (:170)
PRECONDITIONS        `apps/mobile/src/formato.ts`.
SYNTHETIC_FIXTURE    El lunes 2026-11-09; un registro a las 16:10 UTC (13:10 en Buenos Aires); el 2025-09-02; la
                     medianoche.
STEPS                1. Pedir el título del día.
                     2. Pedir la fecha en un texto, del mismo año y de otro, con el día de la API de referencia.
                     3. Pedir la hora y el instante, con la zona fija.
EXPECTED             1 → «Lunes 9 de noviembre», sin coma. 2 → «9 nov» y «2 sept 2025». 3 → «13:10» y «9 nov · 13:10»;
                     la medianoche, «00:05».
NEGATIVE_ASSERTIONS  Nunca «p. m.» ni «a. m.»; el día civil no se corre con la zona del teléfono (la prueba de siempre).
AUTOMATION           scripts/vuelta-de-rosca.test.mjs («TEST-AV2-016 · …») y scripts/historial-navegacion.test.mjs.
                     Mutación: la hora en 12 h → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde; la hora se confirma en el teléfono: el `Intl` de Hermes no es el del navegador (AV2-18)
```

---

## TEST-AV2-026 — Ningún texto nuevo dice «cumplimiento», «adherencia» ni «racha»

```text
TEST_ID              TEST-AV2-026
TITLE                Los textos de la vuelta 2 no califican
LEVEL                APK (los textos de las pantallas)
PRIORITY             P1 — TEST-PRJ-009
SOURCES              §0 (WP-APP-VUELTA-2.md:28-29) · §8 · DL-170 · la decisión de Dirección del 2026-11-08
PRECONDITIONS        Los archivos que esta vuelta toca o crea, con sus textos.
SYNTHETIC_FIXTURE    No usa datos.
STEPS                1. Extraer los textos de esos archivos (literales y plantillas, sin estilos ni comentarios).
                     2. Buscar «cumplimiento», «incumplimiento», «adherencia» y «racha».
EXPECTED             2 → ninguno, tampoco en negación. Las listas de T13 de cada dominio siguen pasando.
NEGATIVE_ASSERTIONS  Ninguna palabra de juicio entra por un texto nuevo de la tira, de Inicio o de la cabecera.
AUTOMATION           scripts/copy-pantallas.test.cjs («TEST-AV2-026 · …»). Mutación: escribir «racha» en un texto de la
                     tira → la prueba falla.
ENVIRONMENT          `npm test`
EVIDENCE_EXPECTED    La CI verde
```
