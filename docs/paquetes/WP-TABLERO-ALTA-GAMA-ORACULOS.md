# WP-TABLERO-ALTA-GAMA — los oráculos TEST-TAG

> **Qué es esto.** El paquete declaró los oráculos TEST-TAG-001 a 033, en una línea cada uno
> (`WP-TABLERO-ALTA-GAMA.md` §6). Acá van escritos con los trece campos que la §6 del 11A declara obligatorios
> (11A:150-169), como los de `WP-FORMULARIOS-DE-INICIO-ORACULOS.md`. Cada uno se escribe antes del código de su parte,
> en el mismo commit.
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Cuando Dirección consolide,
> toma estos oráculos y reemite el documento.
>
> **De dónde sale cada oráculo.** De DL-163 (`docs/DEUDA_LEGAJO.md`, ratificada el 2026-11-05, de D-1 a D-21), del
> paquete y de la propuesta «Tablero de alta gama», cuyos números (el anexo A7 para las marcas) están en el paquete o
> en el código que cita cada uno. Un oráculo dice qué hay que observar para aceptar la prueba. No inventa la regla: la
> lee.
>
> **Estado.** Escritos: TEST-TAG-003 y TEST-TAG-004 (TB-05), TEST-TAG-005 (con los pares de TB-03, TB-04 y TB-05;
> los demás tokens, con su parte), TEST-TAG-006 y TEST-TAG-007. Los demás se escriben con su parte (§10 del paquete).

---

## TEST-TAG-006 — La gramática de las marcas

```text
TEST_ID              TEST-TAG-006
TITLE                Una sola regla de tamaño para las marcas de los cuatro gráficos: cada estado con su mínimo,
                     el lleno distinto del hueco y ningún punto fuera del lienzo
LEVEL                Unidad (geometría pura del website, sin la biblioteca de gráficos)
PRIORITY             P1 — legibilidad: un punto que no se distingue dice otra cosa de la persona
SOURCES              DL-163 D-3 (DEUDA_LEGAJO, «marcas según el lugar de cada día, con mínimos por estado, y una
                     sola forma de lo elegido») · WP-TABLERO-ALTA-GAMA TB-02 («Una sola función de radio […] que
                     usan los cuatro gráficos. Lleno y hueco se distinguen a densidad 1. Lo elegido y el foco tienen
                     una sola forma cada uno, el rombo es proporcional y el piso de la letra rige en todos») · la
                     propuesta, anexos A7 (las marcas) y A11 (lo elegido y el foco) · GUIA-UX-UI I.7
PRECONDITIONS        Ninguna: funciones puras de apps/web/src/app/pro/advisees/seguimiento/geometria.ts.
SYNTHETIC_FIXTURE    Puntos analíticos armados en la prueba (septiembre y octubre de 2026), con los estados
                     completo, subtotal (PARTIAL), balde sin completar, reportado y calculado; lugares por día de
                     0,4 a 80 px; minigráficos de 7, 30, 90 y 365 días en 120 a 300 px de ancho.
STEPS                1. Para cada lugar por día, pedir la medida del lleno, del hueco, de lo reportado y de lo
                        calculado (medidaDeMarca).
                     2. Pedir la medida del aro de lo elegido (medidaDelAro), del rombo de lo indicado
                        (medidaDelRombo) y de la raya de lo corregido (rayaDeCorregido).
                     3. Pedir el estado de puntos con cada calidad y clase (estadoDeMarca).
                     4. Armar minigráficos de 7, 30, 90 y 365 días con subtotales y reportados, y medir cada punto
                        contra el lienzo.
EXPECTED             1 → el lleno mide de 1,25 a 3,5, sin trazo, y lleva halo solo con 6 px por día o más; el hueco,
                     2,75 como mínimo, y lo reportado y lo calculado, 3,25; toda marca con estado es por lo menos 1
                     más grande que el lleno; el trazo es 1,25, o 1,5 desde R 4; en el SVG va R menos medio trazo;
                     el agujero del hueco mide 1,25 o más. Lo reportado va cortado en cuatro trazos y cuatro cortes
                     iguales; lo calculado lleva un punto central de 0,75 o más, adentro del aro.
                     2 → el aro deja libre la marca de cualquier estado, con su separación; el rombo tiene media
                     diagonal R_hueco + 1, menos que el doble del hueco; la raya va encima de la marca sin tocarla.
                     3 → lleno, hueco (subtotal y balde sin completar), reportado y calculado; la clase manda sobre
                     el subtotal. El piso de la letra es 12,5.
                     4 → todo punto queda entero dentro del lienzo, y su radio es el de su medida.
NEGATIVE_ASSERTIONS  Un hueco nunca mide como un lleno ni tiene un agujero que desaparezca a densidad 1. El rombo
                     de lo indicado no es el doble de la marca. El aro de lo elegido no tapa la marca. Mutación
                     verificada: con el hueco en «lleno + 0,4, mínimo 1,6» fallan tres casos.
AUTOMATION           scripts/geometria-del-minigrafico.test.mjs («TEST-TAG-006 · …», cinco casos), en `npm test`
ENVIRONMENT          CI (verificar · typecheck · unit · build · audit) y local, sin servicios
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; las capturas de capturas-del-tablero de la corrida de TB-02,
                     comparadas con la línea de base (EVIDENCIA/TABLERO-ALTA-GAMA/)
```

---

## TEST-TAG-005 — Cada token nuevo, con su par

```text
TEST_ID              TEST-TAG-005
TITLE                Cada color nuevo del tablero entra en tokens.css con su par medido en la prueba de contraste
LEVEL                Unidad (lectura de apps/web/src/app/tokens.css, sin navegador)
PRIORITY             P1 — accesibilidad: un fondo o una marca que no se ve no dice nada (RNF-ACC-001)
SOURCES              DL-163 D-2, D-3 y D-11 · WP-TABLERO-ALTA-GAMA TB-03 («La vigencia va en --banda, con 1,3:1
                     como mínimo […] y --grafico-planificado y --grafico-registrado salen de los gráficos») · la
                     propuesta, anexo A4 (los tokens nuevos y sus pares) · scripts/contraste.test.cjs (WCAG 2.2:
                     4,5:1 para texto y 3:1 para marcas)
PRECONDITIONS        Ninguna.
SYNTHETIC_FIXTURE    Ninguno: los tokens reales de Claro y Azul noche.
STEPS                1. Leer los dos temas de tokens.css.
                     2. Medir cada par nuevo: los fondos de datos contra la superficie y las métricas encima.
                     3. Buscar los dos colores de antes en tokens.css y en todo apps/web/src.
EXPECTED             1-2 → TB-03: --banda contra --superficie, 1,3:1 o más en los dos temas; las tres métricas y
                     --grafico-hueco sobre --banda, 3:1 o más. Se suman con su parte: --ahora y --pista (TB-04 y
                     TB-10), --retrato-fondo y --retrato-tinta (TB-05), --composicion-libre y --composicion-grasa
                     (TB-24), con las iniciales y las métricas contra --ahora a ΔE 20 o más. TB-05:
                     --retrato-tinta sobre --retrato-fondo, 4,5:1; la tinta y el círculo, a ΔE 20 o más de
                     --ahora; la tinta con croma de CIELAB de 12 o menos, y el círculo, de 16 o menos: neutros,
                     nunca el acento.
                     3 → --grafico-planificado y --grafico-registrado no se definen ni se usan.
NEGATIVE_ASSERTIONS  Ningún estilo escribe un color fuera de los tokens (la prueba que ya existía). Un gráfico de
                     Entrenamiento no distingue lo planificado de lo registrado por un naranja contra un azul: lo
                     distingue la forma.
AUTOMATION           scripts/contraste.test.cjs (los pares de PARES_GRAFICO con FONDO_DE_DATO, «los gráficos ya
                     no usan los colores de planificado y registrado (TB-03)» y «las iniciales van en tinta neutra
                     y lejos de la luz de hoy (TB-05)»), en `npm test`
ENVIRONMENT          CI y local, sin servicios
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; las capturas de la corrida de TB-03 en los dos temas
```

---

## TEST-TAG-007 — El minigráfico no esconde días

```text
TEST_ID              TEST-TAG-007
TITLE                En el minigráfico del indicador, cada día tiene su estado en la tira, la línea se corta donde
                     falta un dato completo y lo que cae fuera de la escala se marca sin ubicarlo
LEVEL                Unidad (geometría pura del website)
PRIORITY             P1 — «un hueco es un hueco, nunca un cero» (REG-06-166): ningún día puede desaparecer
SOURCES              DL-163 D-5 («la tira de cobertura lleva el estado de cada día; llevan marca el último día, el
                     elegido y los aislados; lo que cae fuera de escala va con una muesca en la base y su cuenta. A
                     90 días, la línea es la media de cada semana de BE, con su denominador, y los días van como
                     puntos claros detrás») · WP-TABLERO-ALTA-GAMA TB-04 · la propuesta, anexos A7, A9, A13 y A14 ·
                     REG-06-166 (sin interpolar ni completar huecos)
PRECONDITIONS        Ninguna: geometriaDelIndicador y estadosDeLosDias, en seguimiento/geometria.ts.
SYNTHETIC_FIXTURE    Períodos diarios de 30 y 90 días desde el lunes 10 de agosto de 2026, con días sin registros,
                     subtotales (PARTIAL), un subtotal muy bajo y días aislados; sesiones de dos tramos; anchos de
                     100 y 300 px.
STEPS                1. 90 días en 300 px (3,3 px por día): leer el estado de la tira en el centro de cada día.
                     2. 90 días en 300 px: leer las semanas de BE, sus denominadores y los puntos de los días.
                     3. 30 días en 100 px: contar los tramos de la línea y las marcas.
                     4. 30 días en 300 px: contar las marcas.
                     5. Un subtotal muy por debajo del resto: buscar su muesca y su punto.
                     6. Tres días con valor en 90: leer el modo, la línea y la media.
                     7. Sesiones de dos tramos: contar los trazos y la tira.
                     8. Tres tomas de peso con 0,2 kg de diferencia, con y sin la escala mínima del kilo.
EXPECTED             1 → cada uno de los 90 días tiene en la tira el estado que da estadosDeLosDias (con valor, sin
                     completar o sin registros); hoy lleva su raya debajo.
                     2 → la línea es la media semanal: la primera semana, de lunes a domingo, con 6 días con valor de
                     7 y su media exacta, llena; la de hoy, hueca, con 6 días en el período y 5 en la media (hoy
                     sigue en curso); cada día con valor es un punto claro (89 de 89).
                     3 → tres tramos (la línea se corta en los días sin registros y en el subtotal); llevan marca solo
                     la aislada y la última.
                     4 → todo día con valor tiene su marca.
                     5 → una muesca en su día, en la base, contada como «debajo de la escala»; ningún punto la ubica.
                     6 → puntos sueltos, sin línea ni media.
                     7 → un trazo por tramo; las sesiones no llevan tira.
                     8 → con la escala mínima (2 kg, 2 cm, 4 mm), 0,2 kg ocupa menos de un octavo del alto; sin ella,
                     casi todo: una diferencia chica no parece un precipicio.
NEGATIVE_ASSERTIONS  La línea no une días con un día sin registros o un subtotal en el medio, ni dos tramos. Lo de
                     fuera de la escala no se dibuja a una altura que no es la suya. Hoy no entra en la media de su
                     semana. Mutaciones verificadas: sin la celda de los días sin registros falla el paso 1; con hoy
                     en la media falla el paso 2.
AUTOMATION           scripts/geometria-del-minigrafico.test.mjs («TEST-TAG-007 · …», ocho casos), en `npm test`
ENVIRONMENT          CI y local, sin servicios
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; las capturas del Resumen de la corrida de TB-04, a 1440 y a
                     1920 × 950, comparadas con la línea de base
```

---

## TEST-TAG-003 — Las iniciales salen del nombre visible y nunca se inventan

```text
TEST_ID              TEST-TAG-003
TITLE                El monograma lleva las iniciales del nombre que el profesional ya ve, sin títulos ni
                     partículas, y sin nombre (la referencia neutral) lleva el ícono «persona»
LEVEL                Unidad (función pura del website, sin React)
PRIORITY             P1 — un monograma inventado le pone a alguien una cara que no es la suya (D-2)
SOURCES              DL-163 D-2 («Un monograma de un solo tono neutro con las iniciales del nombre visible, donde ya se
                     ve el nombre y con la regla de DL-040»; salvaguarda: «inicialesDe, con sus casos») ·
                     WP-TABLERO-ALTA-GAMA TB-05 y §6 («títulos, partículas, tildes, una sola palabra, emojis y la
                     referencia neutral, que lleva el ícono "persona"») · DL-040 (la referencia neutral) ·
                     apps/api/src/vinculo/lectura.ts (`nombreDeProfesional`: «Profesional» sin nombre)
PRECONDITIONS        Ninguna: inicialesDe, en apps/web/src/lib/retrato.ts.
SYNTHETIC_FIXTURE    Los nombres de la cohorte («Lic. Sofía Paz», «Prof. Martín Acosta», «Federico Álvarez»…), con
                     y sin «(sintética)»; nombres con «de los», «del» y «van»; con tildes compuestas y separadas; con
                     emojis y comillas; una sola palabra; la referencia neutral de una identidad sintética.
STEPS                1. Pedir las iniciales de nombres de dos, tres y una palabra, en mayúscula y en minúscula.
                     2. Pedirlas con títulos delante (con y sin punto, varios seguidos) y con un título solo.
                     3. Pedirlas con partículas y con lo que va entre paréntesis.
                     4. Pedirlas con tildes, eñes, una tilde escrita aparte y un nombre con guion.
                     5. Pedirlas con emojis, números, comillas, vacío, null y undefined.
                     6. Pedirlas de la referencia neutral, de «Asesorado», de «Profesional» y de «Profesional · …».
EXPECTED             1 → «DS», «CO», «D»; la primera y la última palabra, nunca las del medio.
                     2 → «SP», «MA», «AG», «PR», «JP»; un título solo da null. «J. Pérez» da «JP».
                     3 → «MP», «AV», «LB»; «(sintética)» no cuenta.
                     4 → «FÁ», «ÍÑ», «HF», «ÉD», «MP»: la tilde se conserva y se junta con su letra.
                     5 → lo que no es letra no cuenta; sin letras, null.
                     6 → null en los cuatro: el monograma lleva el ícono «persona».
NEGATIVE_ASSERTIONS  Nunca una inicial de un título, de una partícula, de un emoji ni de la referencia neutral. El
                     reemplazo de la API para un profesional sin nombre («Profesional») no da «P». Mutaciones
                     verificadas: sin «profesional» en la regla de la referencia fallan dos casos; sin la lista de
                     títulos fallan dos.
AUTOMATION           apps/web/test/retrato.test.mjs («TEST-TAG-003 · …», seis casos), en `npm run test -w @be/web`
ENVIRONMENT          CI (verificar · unit) y local, sin servicios
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; las capturas de la corrida de TB-05 (el Espacio y la ficha),
                     con los monogramas de la cohorte
```

---

## TEST-TAG-004 — «Ocultar nombres» no deja pasar un nombre

```text
TEST_ID              TEST-TAG-004
TITLE                Con «Ocultar nombres», ninguna pantalla de /pro muestra un nombre ni una inicial, tampoco en
                     el título de la pestaña
LEVEL                Unidad (funciones puras y una guardia sobre el código) y recorrido en el navegador (CI)
PRIORITY             P1 — privacidad: mostrar la pantalla no puede mostrar a quién se acompaña
SOURCES              DL-163 D-2 (salvaguarda: «"Ocultar nombres", con una prueba que falla si aparece un nombre o una
                     inicial») · WP-TABLERO-ALTA-GAMA TB-05 («rige en todas las rutas /pro/** […] y en el título de
                     la pestaña, y se recuerda en el navegador. La prueba recorre el Espacio, el Resumen y el cajón,
                     y falla si aparece un nombre o una inicial») · §5 (se recuerda en el navegador, sin datos de
                     personas) · 08 §33 (solo datos sintéticos)
PRECONDITIONS        Unidad: ninguna. Recorrido: la cohorte cargada en el PostgreSQL efímero de
                     capturas-del-tablero, con la API y el website compilados.
SYNTHETIC_FIXTURE    Unidad: Diego Sosa y Lic. Sofía Paz con identidades sintéticas. Recorrido: la cohorte entera
                     (seis personas y tres profesionales), con los nombres sacados de sus archivos.
STEPS                1. Pedir el nombre que se ve de una persona y de un profesional, con los nombres a la vista y
                        ocultos (nombreQueSeVe), y el papel de quien escribió (rolDe).
                     2. Pasar por textoSinNombres «Corregida por Diego Sosa» y un texto con dos nombres.
                     3. Buscar `.displayName` en todo apps/web/src/app/pro y {n.title} en el centro de novedades.
                     4. Buscar asignaciones a document.title y leer los títulos fijos de /pro.
                     5. En el navegador, por cada profesional: prender «Ocultar nombres» en el menú de la cuenta,
                        abrir el Espacio y el Resumen de Diego, y leer el texto visible, los rótulos accesibles, el
                        título de la pestaña y los monogramas con iniciales. El cajón se suma con TB-12.
EXPECTED             1 → a la vista, el nombre; ocultos, «Asesorado · …» o «Profesional · …», sin iniciales.
                     2 → cada nombre conocido pasa a su referencia, el más largo primero.
                     3 → ninguna línea: todo nombre de /pro pasa por useNombres.
                     4 → nadie cambia el título; los títulos de /pro son textos fijos.
                     5 → ninguna palabra de un nombre de la cohorte y ningún monograma con iniciales; mediciones.json
                        lo anota en `ocultarNombres`.
NEGATIVE_ASSERTIONS  Ningún nombre ni inicial con los nombres ocultos, ni en el título de la pestaña. Fuera de /pro
                     no rige. El monograma no aparece en las solicitudes, las invitaciones, los avisos ni
                     Administración (D-2). Mutación verificada: con `{p.advisee.displayName}` de vuelta en
                     «Pendientes», la guardia falla. Lo que alguien escribió a mano (el texto de una nota) no se
                     toca: no se puede saber qué es un nombre (TA-11).
AUTOMATION           apps/web/test/retrato.test.mjs («TEST-TAG-004 · …» y «D-2 · …», seis casos), en
                     `npm run test -w @be/web`; el recorrido, en EVIDENCIA/TABLERO-ALTA-GAMA/herramientas/
                     capturas.mjs (`recorrerConNombresOcultos`), que hace fallar la corrida
ENVIRONMENT          Unidad: CI y local. Recorrido: CI (capturas-del-tablero), con Chrome sin cabeza
EVIDENCE_EXPECTED    La corrida verde de la CI; la corrida de capturas-del-tablero de TB-05, con
                     `ocultarNombres` vacío de apariciones en mediciones.json
```
