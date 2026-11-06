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
> **Estado.** Escritos: TEST-TAG-005 (con los pares de TB-03; los demás tokens, con su parte) y TEST-TAG-006. Los demás
> se escriben con su parte (§10 del paquete).

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
                     (TB-24), con las iniciales y las métricas contra --ahora a ΔE 20 o más.
                     3 → --grafico-planificado y --grafico-registrado no se definen ni se usan.
NEGATIVE_ASSERTIONS  Ningún estilo escribe un color fuera de los tokens (la prueba que ya existía). Un gráfico de
                     Entrenamiento no distingue lo planificado de lo registrado por un naranja contra un azul: lo
                     distingue la forma.
AUTOMATION           scripts/contraste.test.cjs (los pares de PARES_GRAFICO con FONDO_DE_DATO y «los gráficos ya
                     no usan los colores de planificado y registrado (TB-03)»), en `npm test`
ENVIRONMENT          CI y local, sin servicios
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; las capturas de la corrida de TB-03 en los dos temas
```
