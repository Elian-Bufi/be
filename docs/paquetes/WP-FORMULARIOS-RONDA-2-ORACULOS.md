# WP-FORMULARIOS-RONDA-2 — los oráculos TEST-FR2

> **Qué es esto.** Lo que la ronda 2 de los formularios cambió (DL-165), escrito como oráculos con los trece campos que la
> §6 del 11A declara obligatorios (11A:150-169), igual que los TEST-FRI de WP-FORMULARIOS-DE-INICIO
> (`WP-FORMULARIOS-DE-INICIO-ORACULOS.md`). El paquete (`WP-FORMULARIOS-RONDA-2.md`) no los había declarado: salen de sus
> criterios de aceptación (§1 y §3) y del FR-10 (§4). Los seis de la ronda 2.1 (TEST-FR2-011 a 016) salen de FR-12 a
> FR-16 (§8).
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Los TEST-FRM de WP-07 y los
> TEST-FRI siguen como están. Cuando Dirección consolide, toma estos dieciséis y reemite el documento.
>
> **De dónde sale cada oráculo.** De DL-165 (`docs/DEUDA_LEGAJO.md`, ratificada el 2026-11-05 con D-1 a D-9; D-10 a D-13
> ratificadas el mismo día; del FR-10, D-14, D-16 y D-18 ratificadas el 2026-11-06, D-15 y D-17 reemplazadas ese día por
> las nuevas, y D-19 a ratificar; de la ronda 2.1, D-20 a D-28, a ratificar), del paquete y de las normas que cita, con
> referencia `archivo:línea`. Un oráculo derivado dice qué hay que observar para aceptar la prueba; no inventa la regla,
> la lee. Las referencias a DEUDA_LEGAJO y al paquete se actualizaron el 2026-11-06: las de los diez primeros se habían
> corrido con la ronda 2.1. Las de D-15 y D-17 anteriores, que ya no están en DL-165, apuntan al §7 del paquete.
>
> **Estado de la automatización.** Los dieciséis se ejecutan en la CI: lo de la API, con PostgreSQL 16 real
> (Testcontainers); lo del dominio, la APK y el website, en `npm test`. Lo que solo se ve en el teléfono o en el
> escritorio se dice en EVIDENCE_EXPECTED y está en la guía de la prueba de Dirección
> (`EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md`).

---

## TEST-FR2-001 — Una parte por pantalla y el repaso

```text
TEST_ID              TEST-FR2-001
TITLE                El formulario se responde por partes, con el aviso de lo que falta y un repaso antes de enviar
LEVEL                Dominio (la lógica de las partes) y APK (lógica pura); el recorrido, en el teléfono
PRIORITY             P1 — la experiencia de la persona; no cambia lo que se guarda
SOURCES              DL-165 D-1 (DEUDA_LEGAJO:6569: «"Parte N de 6", "Anterior", "Siguiente" y un repaso antes
                     de enviar. Si falta una obligatoria, se avisa al pasar de parte y se deja seguir y volver») ·
                     DL-165 D-3 (DEUDA_LEGAJO:6578) y la D-15 anterior (WP-FORMULARIOS-RONDA-2.md:261, siete
                     partes; reemplazada el 2026-11-06 por la nueva, DEUDA_LEGAJO:6678) ·
                     WP-FORMULARIOS-RONDA-2.md FR-03 y FR-04 (:89-90) · 05 UC-P33 (05:15197)
PRECONDITIONS        Una versión con secciones (las partes) y una Solicitud que pide algunas de sus preguntas,
                     con obligatorias, una condicional y una sección sin nada pedido.
SYNTHETIC_FIXTURE    PARTES y PEDIDO de formularios-ronda-2.test.ts: cuatro secciones; «El detalle» se abre con
                     «¿Tenés alergias?»; «Otra» no tiene nada pedido. En el teléfono, «Antes de entrenar» v3
                     pedida a una cuenta sintética de la prueba breve.
STEPS                1. Armar las partes de la Solicitud.
                     2. Responder de modo que la condicional quede oculta.
                     3. Contar lo que falta en cada parte con distintas respuestas.
                     4. Simular un problema al enviar en dos preguntas de partes distintas.
                     5. En la APK: pasar las partes con «Siguiente» hasta «Repasar», con una obligatoria sin
                        responder, y enviar desde el repaso.
EXPECTED             1 → las partes son las secciones con algo pedido, en el orden de la plantilla (tres de
                     cuatro); el repaso es el paso que sigue a la última, y un paso fuera de rango se acota.
                     2 → la parte con todo oculto sigue contando: «Parte 3 de 3» no pasa a «de 2» mientras se
                     responde. 3 → falta solo lo obligatorio que se ve; una opcional sin responder no falta; el
                     aviso dice «En «Tu día» quedó 1 pregunta obligatoria sin responder. Podés volver cuando
                     quieras.». 4 → lleva a la primera parte, en el orden del formulario, con una pregunta con
                     problema; una pregunta no pedida no lleva a ninguna. 5 → «Parte N de 7» con lo que viene
                     pedido en «Antes de entrenar» v3; se puede seguir con lo que falta, y el repaso dice lo
                     respondido por parte, lo que falta y «Cambiar».
NEGATIVE_ASSERTIONS  Lo oculto por una condición no cuenta como faltante. Ningún texto de los formularios V2 dice
                     cuántos minutos lleva, ni califica, ni presenta la falta como incumplimiento (D-3).
AUTOMATION           packages/domain/src/formularios-ronda-2.test.ts («DL-165 D-1 · …», tres casos; «DL-165 D-3 ·
                     ningún texto …») · apps/mobile/src/formulario-v2.test.ts («DL-165 D-1 · lo que falta en
                     cada parte …») · packages/domain/src/plantillas-de-inicio.test.ts («DL-165 D-9 · … siete
                     partes en cada una (D-15)»)
ENVIRONMENT          `npm test` (dominio y APK); el teléfono con la 0.21.0-candidata.1 contra `test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 2
```

---

## TEST-FR2-002 — No más días que los marcados

```text
TEST_ID              TEST-FR2-002
TITLE                Los días por semana no pasan de los marcados en la tabla; «No puedo» no cuenta
LEVEL                Integración (API + PostgreSQL real), dominio, APK y website (lógica pura), y contrato
                     congelado de la 0.21.0-candidata.1
PRIORITY             P1 — la coherencia del dato con el que se arma el plan
SOURCES              DL-165 D-5 (DEUDA_LEGAJO:6586: «`trn_dias_por_semana` no puede pasar de los días marcados:
                     es una regla del dominio y de la API, y la app la avisa antes de enviar») · DL-165 D-11
                     (DEUDA_LEGAJO:6642: «Lo aplican igual la API (FRI-04, 05 y 06), la app y la web, que además
                     dicen junto al número cuánto admite») · WP-FORMULARIOS-RONDA-2.md FR-07 (:92)
PRECONDITIONS        Profesional de Nutrición verificado y habilitado; persona con A3, vínculo aceptado y B2; una
                     versión de formato 3 con la tabla de días y un número con su tope en ella (maxFromMatrix), y
                     una Solicitud sobre esa versión.
SYNTHETIC_FIXTURE    SECCIONES_V3 y RESPUESTAS_V3 de soporte-formularios-v2.ts: lunes a la mañana, martes «No
                     puedo» y jueves a la tarde (cuentan dos días); conDiasParaReservar(n).
STEPS                1. La persona responde por FRI-04 con 3 días para reservar.
                     2. Responde con 2.
                     3. Rectifica por FRI-05 con 4.
                     4. En otra Solicitud, el profesional carga por FRI-06 con 5; después, sin la tabla.
                     5. En otra Solicitud, la persona responde con 8.
                     6. En el dominio: tres días marcados y un «No puedo», con 3 y con 4; todo «No puedo»; la
                        tabla después del número.
                     7. En la APK y en «Cargar con la persona»: marcar 3 días y poner 5.
EXPECTED             1 → 422 FORM_RESPONSE_INVALID con un solo issue, FORM_ANSWER_MORE_THAN_MARKED, en
                     answers[i].answer del número y con su fieldCode; ninguna respuesta escrita. 2 → 201.
                     3 → 422 con el mismo issue. 4 → 422 con el mismo issue; sin la tabla, 201: no hay tope más
                     allá de sus límites. 5 → 422 con un solo issue, FORM_ANSWER_ABOVE_MAXIMUM. 6 → 3 pasa y 4
                     no; con todo «No puedo» el tope es cero; el orden de las respuestas no importa. 7 → junto al
                     número, «Hasta 3, por lo que marcaste en «¿Qué días y en qué momento podés?».», y el envío
                     se frena en ese número con «Es más de lo que marcaste en la tabla.».
NEGATIVE_ASSERTIONS  El 422 no repite el valor enviado («"number":3»). El issue va en el número, nunca en la
                     tabla. Un número fuera de sus límites dice solo eso: no suma la regla encima.
AUTOMATION           test/integration/formularios-ronda-2.int-spec.ts («FR-07 · …», dos casos) ·
                     packages/domain/src/formularios-ronda-2.test.ts («DL-165 D-5 · …», dos casos) ·
                     apps/mobile/src/formulario-v2.test.ts («DL-165 D-5 · antes de enviar, la app avisa …») ·
                     apps/web/test/formulario-de-inicio.test.mjs («DL-165 D-5 · al cargar con la persona, pasar
                     de los días marcados frena el envío en ese número») · test/integration/
                     lecturas-de-las-apk.int-spec.ts (la 0.21.0-candidata.1 lee el 422 al responder y al
                     rectificar)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, la APK y la web, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 2
```

---

## TEST-FR2-003 — El renglón con varias opciones, solo para quien lo lee

```text
TEST_ID              TEST-FR2-003
TITLE                El subtipo de varias opciones en un renglón (formato 3) se lee, se responde, se carga y se
                     rectifica con la capacidad forms-format-3; sin ella, no existe
LEVEL                Integración (API + PostgreSQL real), dominio y contrato congelado de cada APK publicada
PRIORITY             P0 — compatibilidad: una APK instalada no se actualiza sola
SOURCES              DL-165 D-6 (DEUDA_LEGAJO:6591) · DL-165 D-10 (DEUDA_LEGAJO:6632: «Se entregan solo a un
                     cliente que declara `forms-format-3` en `X-BE-Capabilities` […]: para los demás, FRI-02 no
                     las lista y FRI-01 y FRI-03 a 08 responden el 404 de lo inexistente») · WP-FORMULARIOS-
                     RONDA-2.md FR-08 (:91) · DL-152 (lo que lee cada APK, congelado) · DL-122 (las capacidades)
PRECONDITIONS        Las de TEST-FR2-002. Congeladas, la 0.20.0-candidata.1 (sin la capacidad) y la
                     0.21.0-candidata.1 (con ella).
SYNTHETIC_FIXTURE    SECCIONES_V3: «Otras actividades de tu semana», con «Cuál» (con su ejemplo) y «Qué días»
                     (varias opciones en el renglón); RESPUESTAS_V3 (fútbol, lunes y jueves).
STEPS                1. Sin la capacidad, como la 0.20: la bandeja con y sin filtros, la vista, la definición,
                        responder y rechazar; el profesional sin la capacidad: ver, cargar y retirar; FRM-06,
                        FRM-05 y FRM-02.
                     2. Con la capacidad: la definición y la bandeja.
                     3. Responder con un día que la pregunta no tiene, con uno repetido y con los días
                        desordenados.
                     4. Rectificar con otros días; rectificar desde la 0.20.
                     5. El profesional carga con la capacidad; la persona confirma con los mismos días en otro
                        orden.
                     6. Por cada APK congelada, pedir lo que lee como lo pide, con las capacidades que declara
                        (lecturas-de-las-apk.int-spec.ts).
EXPECTED             1 → la bandeja no la trae; todo lo demás, 404 con el cuerpo idéntico al de lo inexistente;
                     ninguna respuesta ni propuesta escrita; FRM no la lista ni la sirve. 2 → format 3,
                     usesNewTypes true y estimatedMinutes null; el renglón con TEXT y MULTI_CHOICE; en la
                     bandeja, PENDING y respondable. 3 → 422 FORM_ANSWER_ITEM_FIELD_INVALID en
                     .items[0].que_dias, en los dos primeros; desordenados, 201, y se guardan en el orden de la
                     pregunta (lunes, jueves), sin los espacios de más. 4 → 201; desde la 0.20, el mismo 404.
                     5 → 201, y correctedFieldCodes vacío: un cambio de orden no es una corrección. 6 → la 0.20
                     lee la Solicitud de formato 3 como inexistente. La 0.21, que declara
                     «training-set-targets-1,forms-format-3», lee la bandeja y las dos versiones de formato 3
                     del catálogo; responde, confirma lo cargado con otros días, descarta y rectifica sin una
                     sola respuesta que su esquema rechace.
NEGATIVE_ASSERTIONS  El 404 no se distingue del de lo inexistente: no confirma que la Solicitud exista. A la 0.20
                     nunca le llega un formato 3, ni en la bandeja. Lo congelado de una APK no se edita para que
                     la prueba pase.
AUTOMATION           test/integration/formularios-ronda-2.int-spec.ts («FR-08 · …», tres casos) ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (DL-152: el bloque de FRI, con lo de «no
                     existe» para las APK sin la capacidad, y el de formato 3 para la 0.21.0-candidata.1) ·
                     packages/domain/src/formularios-ronda-2.test.ts («DL-165 D-6 · …», tres casos; «DL-152 ·
                     la APK 0.20 no lee el formato 3 …») · packages/domain/src/lecturas-de-la-apk.test.ts
                     (VIGENTES y el contrato de hoy)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md («Las lecturas
                     congeladas» y la parte 2 de la guía)
```

---

## TEST-FR2-004 — El embarazo, sin pedir

```text
TEST_ID              TEST-FR2-004
TITLE                En las versiones nuevas, el embarazo no viene pedido ni es obligatorio; el profesional lo
                     suma si corresponde
LEVEL                Dominio, website (lógica pura) e integración (lo que sirve la API)
PRIORITY             P1 — minimización: el profesional decide qué pedir
SOURCES              DL-165 D-4 (DEUDA_LEGAJO:6580: «El embarazo, sin elegir al pedir y no obligatorio, en los dos
                     formularios; cada pregunta dice si viene pedida por defecto»; cita 09:1528) · DL-165 D-12
                     (DEUDA_LEGAJO:6649: «"pedida por defecto" es `requestedByDefault`, que va solo cuando es
                     `false`») · 04 RNF-PRI-001 (04:788) · 06 REG-06-209 (06:8485)
PRECONDITIONS        Las versiones de formato 3 del catálogo, sembradas por la migración
                     20261105120000_formularios_ronda_2_plantillas: FRM-NUTRICION-INICIO v2 y FRM-ENTRENAMIENTO
                     v3; las de DL-164, históricas.
SYNTHETIC_FIXTURE    Las plantillas del dominio (`plantillas-de-inicio.ts`); en el website, una versión con
                     trn_embarazo en requestedByDefault false.
STEPS                1. Leer nut_embarazo y trn_embarazo en las cuatro versiones (las dos de DL-164 y las dos
                        nuevas).
                     2. Leer por FRI-01, con la capacidad, cada versión sembrada.
                     3. En «Pedir información», elegir una versión con una pregunta que no viene pedida.
                     4. En el escritorio, pedir «Antes de entrenar» desde Entrenamiento.
EXPECTED             1 → en las dos nuevas, requestedByDefault false y requiredByDefault false; en las de DL-164,
                     como estaban. 2 → lo que sirve FRI-01 es igual a lo del dominio, con sus metadatos y
                     requestedByDefault. 3 → esa pregunta viene sin marcar y tampoco obligatoria; las demás,
                     marcadas como siempre. 4 → el embarazo viene sin marcar (parte 2 de la guía).
NEGATIVE_ASSERTIONS  La pregunta sigue en la plantilla: el profesional la puede marcar. Las versiones de DL-164 no
                     cambian (REG-06-209): la prueba compara cada una con el dominio.
AUTOMATION           packages/domain/src/plantillas-de-inicio.test.ts («DL-165 D-4 · el embarazo no viene
                     pedido ni es obligatorio …») · apps/web/test/formulario-de-inicio.test.mjs («DL-165 D-4 ·
                     al pedir, la pregunta que la plantilla no trae pedida …») · test/integration/
                     plantillas-de-inicio.int-spec.ts («cada versión sembrada es la del dominio …»)
ENVIRONMENT          `npm test` (dominio y website); CI (PostgreSQL 16 real) para lo sembrado
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 2
```

---

## TEST-FR2-005 — La Línea de tiempo, solo para quien pidió

```text
TEST_ID              TEST-FR2-005
TITLE                Los formularios entran en la Línea de tiempo como hechos de quien los hizo, sin lo
                     respondido, y solo para el profesional que los pidió
LEVEL                Integración (API + PostgreSQL real) y website (lógica pura)
PRIORITY             P0 — segregación: otro profesional no ve qué se le preguntó a la persona
SOURCES              DL-165 D-8 (DEUDA_LEGAJO:6598) · DL-165 D-13 (DEUDA_LEGAJO:6663: «Los ve solo el profesional
                     que pidió el formulario, en sus Alcances permitidos: la regla de API-FRI-03») · 08 §11
                     (08:183) · 04 RNF-SEC-006 (04:777) · WP-FORMULARIOS-RONDA-2.md FR-09 (:94) · DL-127
                     (API-DSH-04)
PRECONDITIONS        Profesional de Nutrición y persona con A3, vínculo aceptado y B2, con una Solicitud V2; otra
                     profesional, de Entrenamiento, vinculada con la misma persona.
SYNTHETIC_FIXTURE    circuitoV2 y RESPUESTAS_V2 de soporte-formularios-v2.ts, con «Milanesa con puré», «Café con
                     leche», «Leche» y «tipo_2» como textos testigo.
STEPS                1. Leer la Línea de tiempo, filtrada a los cinco tipos, al pedir.
                     2. El profesional carga; la persona rechaza; el profesional carga de nuevo y la persona
                        confirma.
                     3. Leer la Línea de tiempo y sus conteos del período.
                     4. La otra profesional lee la Línea de tiempo de la persona.
                     5. En otra Solicitud, la persona responde sola y rectifica.
EXPECTED             1 → un FORM_REQUESTED del profesional, «Formulario pedido · …», con «Para qué» y
                     «Preguntas». 2 y 3 → un hecho por cada cosa: pedido, cargado (dos), rechazado y confirmado,
                     cada uno de quien lo hizo (cargar, el profesional; rechazar y confirmar, la persona); lo
                     cargado y rechazado dice que se borró y que el formulario sigue pendiente; el confirmado
                     dice cuántas respondió, quién lo cargó y que lo confirmó tal cual; los conteos los suman.
                     4 → ninguno. 5 → FORM_RESPONDED, «Formulario respondido · …», en estado RECTIFIED y con
                     «Correcciones: 1».
NEGATIVE_ASSERTIONS  Ninguna entrada lleva lo respondido: ni los textos testigo, ni las unidades, ni el motivo de
                     la rectificación. Otra profesional de la misma persona no ve los formularios que no pidió.
AUTOMATION           test/integration/formularios-ronda-2.int-spec.ts («FR-09 · …», dos casos) ·
                     scripts/hecho-en-un-renglon.test.mjs («DL-165 D-8: un formulario dice qué pasó …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el website, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 2
```

---

## TEST-FR2-006 — Los hábitos se agregan, no se pisan

```text
TEST_ID              TEST-FR2-006
TITLE                Responder un formulario con «Tus hábitos» agrega una versión de los hábitos de la persona;
                     «Mis hábitos» también, con la vigente que se vio
LEVEL                Integración (API + PostgreSQL real), dominio, APK (lógica pura) y contrato congelado de la
                     0.21.0-candidata.1
PRIORITY             P0 — el dato es de la persona: cada cambio queda, ninguno se pisa
SOURCES              DL-165 D-9 (DEUDA_LEGAJO:6604) · DL-165 D-16 (DEUDA_LEGAJO:6698: «Lo que el formulario
                     preguntó de la parte […] reemplaza lo vigente […]. Rectificar una respuesta (FRI-05) no
                     cambia los hábitos») · DL-165 D-18 (DEUDA_LEGAJO:6726) · WP-FORMULARIOS-RONDA-2.md §4.2
                     (:152) · 06 T-06-77 (06:8298, SELF_REPORTED) · 06 REG-06-209 (06:8485)
PRECONDITIONS        Persona con A3; una nutricionista y un entrenador con su vínculo aceptado y su B2; las
                     versiones vigentes del catálogo, con la parte «Tus hábitos».
SYNTHETIC_FIXTURE    HABITOS de habitos-de-la-persona.int-spec.ts: horarios de semana y de fin de semana, 7,5 h
                     de sueño, el día «sentado y de pie», fútbol lunes y jueves a la noche, estrés normal.
STEPS                1. La persona responde «Cómo comés hoy» v2 con la parte entera.
                     2. El entrenador carga «Antes de entrenar» v3 con dos preguntas de la parte y una suya; la
                        persona confirma.
                     3. La persona responde un formulario sin la parte, y rectifica el de Nutrición.
                     4. En «Mis hábitos» (HBT-02): registrar sin vigente; repetir con la misma clave; repetir
                        sin la vigente; registrar una sola respuesta con la vigente; mandar un número fuera de
                        sus límites y una pregunta que la parte no tiene.
                     5. Intentar cambiar o borrar una versión en la base.
                     6. Revocar el A3 y leer o registrar.
                     7. En el teléfono, abrir una solicitud nueva con la parte.
EXPECTED             1 → una versión 1, con origen FORMULARIO y atada a esa respuesta; HBT-01 la trae como v1,
                     FORM, cada respuesta SELF_REPORTED, sin historia; la respuesta del formulario guarda la
                     parte como siempre. 2 → v2: las dos preguntas cambian, las otras cuatro quedan y nada del
                     área entra; la v1 queda en la historia. 3 → no se agrega ninguna. 4 → 201, v1, MY_HABITS;
                     el reintento devuelve lo mismo y no agrega otra; sin la vigente, 409 VERSION_CONFLICT; con
                     una sola, queda una sola; 422 FORM_RESPONSE_INVALID con FORM_ANSWER_ABOVE_MAXIMUM y
                     FORM_ANSWER_UNKNOWN_FIELD, cada uno con su fieldCode. 5 → la base lo rechaza: solo se
                     agrega, y cada versión sigue a la última. 6 → 403 ACTION_FORBIDDEN. 7 → «Ya lo respondiste
                     el …: ¿sigue igual?», con lo vigente de lo que pide (parte 4 de la guía).
NEGATIVE_ASSERTIONS  Ninguna versión se cambia ni se borra. Un formulario sin la parte y una rectificación no
                     tocan los hábitos. Lo que la persona le contó a un área (el objetivo de Entrenamiento) no
                     entra en sus hábitos.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («FR-10 · FRI-04 agrega …» y «FR-10 ·
                     API-HBT-01 y 02 …») · packages/domain/src/habitos-de-la-persona.test.ts («D-16 · …», «D-18 ·
                     …» y «"Mis hábitos" valida la parte entera sin obligatorias …») · apps/mobile/src/
                     habitos-en-el-telefono.test.ts («"¿Sigue igual?" al abrir una solicitud (D-18)») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.21.0-candidata.1 cuenta y cambia sus
                     hábitos, y responde la parte en «Antes de entrenar» v3)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y la APK, en `npm test`; el teléfono con
                     la 0.21.0-candidata.1
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, partes 3 y 4
```

---

## TEST-FR2-007 — Compartir, y el 404 para quien no los recibe

```text
TEST_ID              TEST-FR2-007
TITLE                Los hábitos los ve solo el profesional que la persona eligió; para los demás, el 404 de lo
                     inexistente
LEVEL                Integración (API + PostgreSQL real), dominio, APK y website (lógica pura), y contrato
                     congelado de la 0.21.0-candidata.1
PRIORITY             P0 — segregación por dominio, salvo autorización explícita
SOURCES              DL-165 D-9 (DEUDA_LEGAJO:6604: «La ven los profesionales de la persona solo si ella activa
                     en su app "Compartir mis hábitos con mis profesionales", con la lista de quiénes los ven») ·
                     DL-165, la D-17 anterior (WP-FORMULARIOS-RONDA-2.md:270; su mecanismo sigue, D-26:
                     DEUDA_LEGAJO:6804) y D-19 (DEUDA_LEGAJO:6732) · 04 RNF-SEC-006 (04:777, «salvo autorización
                     explícita») · 08 §11 (08:183), C-11 y C-12 (08:47-48) · WP-FORMULARIOS-RONDA-2.md §4.3 y
                     §4.4 (:170, :195)
PRECONDITIONS        Las de TEST-FR2-006, con hábitos registrados; un profesional de Nutrición sin vínculo con la
                     persona.
SYNTHETIC_FIXTURE    HABITOS; el texto del acto `habitos-compartidos-2026-11-propuesta`, una propuesta pendiente
                     de validación jurídica.
STEPS                1. Sin la autorización, la nutricionista, el entrenador y el profesional ajeno piden HBT-05;
                        también con una persona que no existe.
                     2. La persona comparte (HBT-03) con la nutricionista y le dice que no al entrenador.
                     3. La nutricionista y el entrenador piden HBT-05.
                     4. Pedidos que no se pueden cumplir: un profesional ajeno, uno inventado y uno repetido
                        entre las dos listas; un texto que no es el vigente; la lista vacía.
                     5. La persona responde «Antes de entrenar» con una pregunta del área y la parte, y comparte
                        con la nutricionista.
                     6. Revoca el A3: la nutricionista lee y la persona intenta compartir.
EXPECTED             1 → 404 con el cuerpo idéntico al de lo inexistente, para los tres. 2 → 200, ACTIVE, v1, con
                     el texto aceptado; la nutricionista RECEIVES y el entrenador DOES_NOT_RECEIVE. 3 → la
                     nutricionista, 200 con lo vigente y desde cuándo; el entrenador, el mismo 404; cada lectura
                     queda en decision_de_acceso, con la persona como sujeto. 4 → 422
                     HABITS_RECIPIENT_NOT_AVAILABLE con un issue por problema (HABITS_RECIPIENT_NOT_AVAILABLE y
                     HABITS_RECIPIENT_REPEATED); 409 CONSENT_VERSION_STALE; 400; ninguna autorización escrita.
                     5 → la nutricionista no ve la
                     Solicitud del entrenador (404); ve los seis hábitos, con origin FORM, y nada del área.
                     6 → 404; y 403 ACTION_FORBIDDEN.
NEGATIVE_ASSERTIONS  Lo que ve el profesional no trae la historia, ni el número de versión, ni de qué formulario
                     ni de qué área salió: los contratos son estrictos. Sin la autorización, ningún profesional se
                     entera de que hay hábitos. La base no acepta una autorización con el texto de otro tipo.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («sin la autorización, HBT-05 es el 404
                     …», «lo que no se puede nombrar es 422 …» y «sin el A3 no se comparte …») ·
                     packages/domain/src/habitos-de-la-persona.test.ts («comoLosRecibe …»,
                     «problemasDelPedidoDeCompartir …», «los contratos son estrictos …» y «el texto del acto es
                     una propuesta …») · apps/mobile/src/habitos-en-el-telefono.test.ts («el cuerpo de
                     API-HBT-03 sale de lo que la persona vio» y «ampliar pide leer el texto y aceptarlo …») ·
                     apps/web/test/sus-habitos.test.mjs («1 · la tarjeta …» y «3 · sin autorización (el 404) …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.21.0-candidata.1 comparte con una y
                     le dice que no a otro, y lee el 409 de una versión vieja)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, la APK y el website, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 3
```

---

## TEST-FR2-008 — Dejar de compartir corta, sin borrar

```text
TEST_ID              TEST-FR2-008
TITLE                Retirar la autorización corta a futuro y para todos, sin borrar nada; pausar o terminar un
                     vínculo y cerrar la cuenta también cortan
LEVEL                Integración (API + PostgreSQL real), website (lógica pura) y contrato congelado de la
                     0.21.0-candidata.1
PRIORITY             P0 — revocación efectiva y verificable
SOURCES              04 RNF-PRI-002 (04:797) · DL-165 D-19 (DEUDA_LEGAJO:6732: «retirar no pide el A3, porque
                     siempre se puede […] Cerrar la cuenta la retira») · WP-FORMULARIOS-RONDA-2.md §4.5 (:205) ·
                     08 §14.1 (08:410)
PRECONDITIONS        Las de TEST-FR2-006, con la autorización activa para los dos profesionales.
SYNTHETIC_FIXTURE    HABITOS.
STEPS                1. La persona pausa el vínculo de Nutrición; la nutricionista y el entrenador leen; la
                        persona lo reanuda.
                     2. Termina el vínculo del entrenador; él lee; después vuelve con otro vínculo.
                     3. La persona revoca su A3 y retira (HBT-04) con la versión vigente; los dos leen; retira otra
                        vez.
                     4. Otra persona comparte y cierra su cuenta.
                     5. En el teléfono, «Dejar de compartir»; en el escritorio, actualizar.
EXPECTED             1 → en pausa, la nutricionista recibe el 404 (la lista la sigue nombrando: PAUSED,
                     RECEIVES) y el entrenador, 200; al reanudar, 200. 2 → 404; con el vínculo nuevo queda
                     NOT_ASKED y sigue en 404. 3 → 200, WITHDRAWN, sin texto aceptado ni activeSince, y todos
                     DOES_NOT_RECEIVE; los dos, 404; otra vez, 409 VERSION_CONFLICT; los hábitos siguen (una
                     versión) y la autorización queda ACTIVA y después RETIRADA. 4 → una versión RETIRADA, con la
                     persona como actora y su hecho AutorizacionDeHabitosRetirada. 5 → la tarjeta «Sus hábitos»
                     desaparece (parte 3 de la guía).
NEGATIVE_ASSERTIONS  Retirar no borra los hábitos ni lo que cada profesional tiene de su formulario. Retirar no
                     pide el A3. La base no deja borrar a los destinatarios: solo se agrega.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («retirarla corta a futuro …» y «lo que
                     no se puede nombrar es 422 …; cerrar la cuenta la retira») · apps/web/test/
                     sus-habitos.test.mjs («3 · sin autorización (el 404) o con una falla …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.21.0-candidata.1 deja de compartir y
                     lee el 409 de hacerlo otra vez)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el website, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 3
```

---

## TEST-FR2-009 — Quien llega después no se suma solo

```text
TEST_ID              TEST-FR2-009
TITLE                Un profesional que empieza a acompañar a la persona después no recibe sus hábitos hasta que
                     ella lo suma
LEVEL                Integración (API + PostgreSQL real), dominio, APK (lógica pura) y contrato congelado de la
                     0.21.0-candidata.1
PRIORITY             P0 — una ampliación exige una aceptación nueva del titular
SOURCES              08 C-12 (08:48: «una ampliación de categoría o detalle exige nueva versión B2 y nueva
                     aceptación del titular») · la D-17 anterior (WP-FORMULARIOS-RONDA-2.md:272: «Un profesional
                     que vuelve con otro vínculo después de terminar es alguien que llega después, y se le
                     pregunta»; su mecanismo sigue por D-26, DEUDA_LEGAJO:6804) ·
                     WP-FORMULARIOS-RONDA-2.md §4.3 (:176-178)
PRECONDITIONS        Las de TEST-FR2-006, con la autorización activa para los dos; una antropometrista que se
                     vincula después.
SYNTHETIC_FIXTURE    HABITOS.
STEPS                1. La antropometrista se vincula; la persona lee «Mis hábitos»; la antropometrista pide
                        HBT-05.
                     2. La persona la suma con la versión vieja de la autorización, y después con la vigente.
                     3. La antropometrista lee.
                     4. En la APK: a quién se le pregunta, y qué mandan «Sí, que los vea» y «No, por ahora».
EXPECTED             1 → NOT_ASKED, con el vínculo ACTIVE y sin sharedSince; HBT-05, 404. 2 → 409
                     VERSION_CONFLICT; después, 200 con v2. 3 → 200; los que ya los recibían conservan desde
                     cuándo; los hechos son AutorizacionDeHabitosActivada y AutorizacionDeHabitosModificada.
                     4 → se pregunta solo por los NOT_ASKED con el vínculo aceptado; «Sí» manda los de hoy más
                     el nuevo; «No» lo declina, y no se le vuelve a preguntar.
NEGATIVE_ASSERTIONS  Sin respuesta de la persona, el nuevo no los ve. Sumar a alguien pide leer y aceptar el
                     texto otra vez (08 C-12); sacar a alguien, no.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («un profesional que la acompaña después
                     no los recibe solo …», y el final de «retirarla corta a futuro …») ·
                     packages/domain/src/habitos-de-la-persona.test.ts («renglonesDeLaAutorizacion: …» y
                     «comoLosRecibe …») · apps/mobile/src/habitos-en-el-telefono.test.ts («a quién se le
                     pregunta …», «el cuerpo de API-HBT-03 …» y «ampliar pide leer el texto …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.21.0-candidata.1 lee NOT_ASKED y un
                     vínculo en pausa, y suma a la nueva)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y la APK, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR. En el teléfono queda por recorrer con una cuenta que
                     tenga un profesional nuevo: la guía de la prueba de Dirección no lo incluye.
```

---

## TEST-FR2-010 — El borrador, cifrado en el teléfono

```text
TEST_ID              TEST-FR2-010
TITLE                Lo escrito en un formulario se guarda cifrado en el teléfono, por cuenta y por solicitud, y se
                     borra cuando deja de servir
LEVEL                APK (lógica pura, con almacenamientos inyectados); el recorrido, en el teléfono
PRIORITY             P1 — la persona no pierde lo escrito, y lo guardado no queda legible
SOURCES              WP-FORMULARIOS-RONDA-2.md FR-01 (:35: «Lo escrito se guarda cifrado en el teléfono, por
                     cuenta y por solicitud, con el mismo almacén que el entrenamiento en curso
                     (`almacen-cifrado.ts`: AES-256-GCM, la clave en el almacenamiento seguro, fuera del
                     respaldo). Se borra al enviar, al descartar, al cerrar la sesión y cuando la solicitud deja
                     de estar pendiente») · WP-FORMULARIOS-DE-INICIO FI-04 (la falla de la prueba del 2026-11-05,
                     EVIDENCIA/FORMULARIOS-DE-INICIO/LEEME.md) · 04 RNF-PRI-001 (04:788)
PRECONDITIONS        Una persona con solicitudes pendientes; AsyncStorage y el almacenamiento seguro inyectados,
                     con el AES-256-GCM de Node.
SYNTHETIC_FIXTURE    Identidades y solicitudes sintéticas de scripts/borrador-de-formulario.test.mjs.
STEPS                1. Guardar el borrador de dos solicitudes de una cuenta y de una de otra cuenta.
                     2. Leer lo guardado en crudo y en un proceso nuevo; copiar lo de una solicitud a la clave de
                        otra.
                     3. Hacer dos primeras escrituras a la vez; borrar la clave de cifrado.
                     4. Escribir seguido; «guardar ya».
                     5. Abrir la solicitud con lo guardado; con la versión del formulario cambiada; con lo
                        cargado cambiado; ya respondida.
                     6. Enviar, descartar lo cargado, cerrar la sesión, pedir el cierre de la cuenta y leer una
                        bandeja donde la solicitud ya no está pendiente.
                     7. Repetir con el almacén fallando.
                     8. En el teléfono: con algo escrito, cerrar la app desde Recientes y volver a abrirla.
EXPECTED             1 → una clave por cuenta y por solicitud, con los identificadores codificados, y una clave de
                     cifrado por cuenta. 2 → nada legible; se lee en un proceso nuevo; lo copiado no descifra, no
                     se usa y se borra. 3 → una sola clave, y las dos se leen; sin la clave, lo cifrado se borra y
                     se sigue. 4 → no se escribe en cada tecla; la última escritura reemplaza a la anterior;
                     «guardar ya» no espera. 5 → vuelve tal cual, antes que cualquier precarga; con otra versión
                     o con lo cargado cambiado, se descarta; ya respondida, también. 6 → se borra en cada caso,
                     también lo que esperaba su demora, y nada de otra cuenta; que la sesión venza o volver a
                     entrar no borran. 7 → nada lanza: una lectura que no responde es «sin leer», y una escritura
                     fallida se informa. 8 → «Recuperamos lo que habías escrito: todavía no se envió.» (parte 2
                     de la guía).
NEGATIVE_ASSERTIONS  Lo de una cuenta no se lee desde otra, ni lo de una solicitud desde otra. Lo precargado sin
                     tocar no se restaura como algo propio.
AUTOMATION           scripts/borrador-de-formulario.test.mjs (24 casos, en `npm test`)
ENVIRONMENT          `npm test`, sin teléfono; el teléfono con la 0.21.0-candidata.1
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, parte 2. Lo que
                     la prueba no cubre (AsyncStorage, el almacenamiento seguro y el AES de expo-crypto en un
                     teléfono real) se ve solo en el teléfono.
```

---

## Ronda 2.1 · «Tus hábitos» aparte y «Pedir acceso a sus hábitos» (2026-11-06)

Seis oráculos más, de FR-12 a FR-16 (`WP-FORMULARIOS-RONDA-2.md` §8). Salen de D-15 y D-17 nuevas, que decidió Dirección,
y de D-20 a D-28, a ratificar. Lo que ve la persona en el teléfono se prueba con la 0.22.0-candidata.1; lo de la 0.21, con
la que está instalada.

---

## TEST-FR2-011 — «Tus hábitos», un formulario aparte

```text
TEST_ID              TEST-FR2-011
TITLE                «Tus hábitos» es un formulario propio que cualquier profesional pide y vuelve a pedir; las de
                     área ya no traen la parte, y las de la ronda 2 pedidas antes siguen andando
LEVEL                Integración (API + PostgreSQL real), dominio, APK (lógica pura) y contrato congelado de la
                     0.21.0-candidata.1 y la 0.22.0-candidata.1
PRIORITY             P1 — el dato de hábitos se pide una vez para todos, sin perder lo ya pedido
SOURCES              DL-165 D-15 nueva (DEUDA_LEGAJO:6678; :6686: «La pide y la vuelve a pedir cualquier
                     profesional con el vínculo vigente, en su área»; :6690: «cualquier versión que tenga las
                     preguntas de hábitos agrega una versión de los hábitos») · DL-165 D-20 y D-21
                     (DEUDA_LEGAJO:6744, 6751) · D-18 (DEUDA_LEGAJO:6726, «¿Sigue igual?» también en «Tus hábitos»
                     aparte) · D-27 (DEUDA_LEGAJO:6815: «Un formulario de una sola parte («Tus hábitos») no dice
                     «Parte 1 de 1»») · WP-FORMULARIOS-RONDA-2.md FR-12 (:336) y §8.3 (:342) · 06 REG-06-209
                     (06:8485) · 05 UC-P33 (05:15197)
PRECONDITIONS        Persona con A3; una nutricionista y un entrenador con su vínculo aceptado y su B2; el catálogo
                     con la migración 20261106120000_formularios_ronda_2_1_plantillas.
SYNTHETIC_FIXTURE    HABITOS (las seis preguntas de la parte, en su forma canónica); FRM-HABITOS v2, «Cómo comés
                     hoy» v3 y «Antes de entrenar» v4, del catálogo; una Solicitud de «Cómo comés hoy» v2 sembrada
                     como pedida antes de la ronda 2.1.
STEPS                1. Leer las versiones del catálogo: las tres vigentes y sus partes.
                     2. La nutricionista pide «Tus hábitos» desde Nutrición, con todo; el entrenador, desde
                        Entrenamiento, solo dos preguntas. La persona responde las dos.
                     3. La persona responde «Cómo comés hoy» v3 y «Antes de entrenar» v4.
                     4. Pedir «Cómo comés hoy» v2 o FRM-HABITOS v1; responder la Solicitud de la v2 pedida antes.
                     5. En la APK 0.22: abrir «Tus hábitos» con hábitos ya contados; abrir «Antes de entrenar» v4.
EXPECTED             1 → FRM-HABITOS v2 es de formato 3, sin área propia, con la parte `tus_habitos` sola (6
                     preguntas, 5 obligatorias, 4 a la vista); «Cómo comés hoy» v3 y «Antes de entrenar» v4 tienen
                     seis partes y son la v2 y la v3 sin la parte, campo por campo, salvo «¿En qué momento del día
                     solés entrenar?», a la vista, opcional y con «No entreno»; 19 (18 a la vista) y 18
                     obligatorias. 2 → la primera agrega la versión v1 de los hábitos con origin FORM; la segunda,
                     la v2, que cambia solo lo que preguntó (D-16). 3 → no agregan ninguna versión. 4 → 422
                     FORM_TEMPLATE_NOT_SELECTABLE, sin escribir nada; la Solicitud de antes se responde y agrega
                     otra versión. 5 → una sola parte, sin «Parte 1 de 1», con el repaso y «Ya lo respondiste el
                     …: ¿sigue igual?»; «Antes de entrenar», «Parte N de 6», sin la parte «Tus hábitos».
NEGATIVE_ASSERTIONS  Las versiones de la ronda 2 no se tocan (REG-06-209): la migración solo agrega, y las dos
                     anteriores salen iguales byte por byte. FRM-HABITOS v1 (P0) no tiene la parte, y responderla no
                     cambia los hábitos.
AUTOMATION           packages/domain/src/plantillas-de-inicio.test.ts («las siete versiones son las pedidas …»,
                     «ronda 2.1 · «Tus hábitos» es FRM-HABITOS v2 …» y «ronda 2.1 · «Cómo comés hoy» v3 y «Antes de
                     entrenar» v4 …») · packages/domain/src/habitos-de-la-persona.test.ts («D-9 y D-20 · la parte
                     «Tus hábitos» es la misma …») · test/integration/habitos-de-la-persona.int-spec.ts («cualquier
                     profesional pide «Tus hábitos» en su área …») · test/integration/plantillas-de-inicio.int-spec.ts
                     («FRM-01 lista las tres …» y «FRM-03: las anteriores ya no se piden …») ·
                     apps/mobile/src/formulario-v2.test.ts (««Tus hábitos» aparte es una sola parte …») ·
                     apps/mobile/src/habitos-en-el-telefono.test.ts («ronda 2.1: «Tus hábitos» aparte (FRM-HABITOS
                     v2) también abre con lo vigente …») · test/integration/lecturas-de-las-apk.int-spec.ts (la
                     0.21.0-candidata.1 y la 0.22.0-candidata.1 leen «Tus hábitos» aparte, de una parte, y lo
                     responden)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y la APK, en `npm test`; el teléfono con
                     la 0.22.0-candidata.1 contra `test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 2 y parte 4
```

---

## TEST-FR2-012 — «Sumar «Tus hábitos»» al pedir

```text
TEST_ID              TEST-FR2-012
TITLE                Al pedir un formulario de área, el escritorio sugiere sumar «Tus hábitos» solo con lo que ese
                     profesional ya puede ver, y manda las dos solicitudes en un paso
LEVEL                Integración (API + PostgreSQL real), dominio, website (lógica pura) y contrato
PRIORITY             P0 — la sugerencia nunca revela lo que la persona le contó a otro profesional
SOURCES              DL-165 D-15 nueva (DEUDA_LEGAJO:6694: «Nunca puede revelar que la persona contó sus hábitos a
                     otro profesional: se decide solo con lo que este profesional ya puede ver») · DL-165 D-22
                     (DEUDA_LEGAJO:6761; :6765: «"Más de 3 meses" es de calendario») · WP-FORMULARIOS-RONDA-2.md
                     §8.1, 2 (:309) y FR-13 (:337) · 04 RNF-SEC-006 (04:777) · 08 §11 (08:183)
PRECONDITIONS        Persona con A3; una nutricionista y un entrenador con su vínculo aceptado y su B2; un
                     profesional sin vínculo con la persona.
SYNTHETIC_FIXTURE    HABITOS; «Tus hábitos» v2 pedida por el entrenador; instantes fijos para los tres meses.
STEPS                1. Cada profesional lee API-HBT-07 sin nada respondido ni compartido.
                     2. El entrenador pide «Tus hábitos» y la persona la responde; los dos leen API-HBT-07.
                     3. La persona le comparte sus hábitos a la nutricionista; ella lee API-HBT-07.
                     4. El profesional ajeno, una persona que no existe y un vínculo en pausa.
                     5. La sugerencia con: nada visto; visto hace un mes; visto hace más de 3 meses; una
                        Solicitud con la parte esperando respuesta; justo 3 meses y un instante después.
                     6. En el escritorio: pedir «Cómo comés hoy» v3 o «Antes de entrenar» v4 con la casilla
                        marcada; con una falla en la segunda; sin saber si llegó.
EXPECTED             1 → sus áreas, sin hábitos, sin pedido, y que puede pedir acceso. 2 → el entrenador tiene
                     lo más nuevo que ve (el momento de su respuesta) y ninguna pendiente; para la nutricionista
                     no cambió nada. 3 → recibe, desde cuándo, y lo más nuevo que ve es la versión vigente. 4 →
                     el 404 de lo inexistente, con el mismo cuerpo. 5 → marcada (SIN_HABITOS); sin marcar, con
                     su fecha (RECIENTES); marcada, con su fecha (VIEJOS); sin marcar (PENDIENTE); 3 meses justos
                     todavía no son «más». 6 → primero la de área y después «Tus hábitos», en la misma área, con
                     todas sus preguntas, las obligatorias que sugiere y el «para qué»; se dice si salieron las
                     dos, una o ninguna; si falla la de área no se manda la otra, y sin saber si llegó se
                     reintenta con la misma clave.
NEGATIVE_ASSERTIONS  API-HBT-07 no trae ningún hábito ni qué respondió la persona a un pedido. Las Solicitudes de
                     otro profesional nunca cuentan. La casilla no se ofrece con las versiones que ya traen la
                     parte, ni con «Tus hábitos» mismo, ni con el 404. Mientras se lee, o si la lectura falla,
                     aparece sin marcar y sin motivo: no se afirma lo que no se sabe.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («lo más nuevo que ve sale de sus
                     respuestas y de lo compartido …») · packages/domain/src/habitos-de-la-persona.test.ts («D-22 ·
                     «Sumar «Tus hábitos»» …» y «los contratos de la ronda 2.1 son estrictos …») ·
                     apps/web/test/sumar-habitos.test.mjs (los siete casos, de «1 · se ofrece …» a «5 · los textos
                     del cajón …») · test/integration/contrato.int-spec.ts («TEST-CT (DL-165, ronda 2.1): HBT-06 a
                     09 …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y el website, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 2 y parte 5
```

---

## TEST-FR2-013 — Pedir acceso, con su límite de 7 días

```text
TEST_ID              TEST-FR2-013
TITLE                El profesional pide acceso a los hábitos; a la persona le llega como novedad importante, y no
                     se puede insistir: una pendiente por vez y 7 días entre pedidos
LEVEL                Integración (API + PostgreSQL real), dominio, APK y website (lógica pura), contrato y contrato
                     congelado de la 0.22.0-candidata.1
PRIORITY             P0 — la persona decide sin presión; la novedad y el aviso no llevan datos de salud
SOURCES              DL-165 D-17 nueva (DEUDA_LEGAJO:6707; :6713: «el acceso de sus datos a terceros es su
                     decisión... nunca una obligación»; :6722: «Un límite para que no sea insistente») · DL-165
                     D-23 (DEUDA_LEGAJO:6776; :6782: «El push, "Tenés una novedad.", como siempre») · DL-165 D-24
                     (DEUDA_LEGAJO:6788; :6790: «esté pendiente o respondido») · D-27 (DEUDA_LEGAJO:6812:
                     «"Importante" se dice con la palabra y el ícono, y TalkBack lo lee antes del título») ·
                     WP-FORMULARIOS-RONDA-2.md FR-14 (:338) y §8.4 (:365, :370, :374) · 08 Expo Push (08:764:
                     «sin C4 jamás en payloads») · DL-133
PRECONDITIONS        Las de TEST-FR2-012, con hábitos registrados y sin compartir.
SYNTHETIC_FIXTURE    HABITOS; un pedido del entrenador sembrado en la base con fecha de hace 8 días.
STEPS                1. La nutricionista pide acceso desde Nutrición; repite el pedido con la misma clave.
                     2. La persona lee sus novedades.
                     3. La nutricionista vuelve a pedir enseguida; pide desde Entrenamiento, que no es su área, y
                        para una persona que no existe.
                     4. Insertar en la base una segunda pendiente para la misma nutricionista.
                     5. El entrenador, con su pedido de hace 8 días sin responder, pide de nuevo.
                     6. La persona le comparte sus hábitos a otro profesional, que pide acceso.
                     7. Cambiar el estado de un pedido resuelto, o borrarlo, en la base.
                     8. En la APK 0.22: el centro de novedades, la novedad y TalkBack.
EXPECTED             1 → 201, PENDING, en el área pedida; el reintento responde lo mismo y no pide dos veces.
                     2 → «Te piden ver tus hábitos», de la nutricionista, que abre MY_HABITS con el pedido como
                     referencia; dice quién pide, desde qué área, «Le ayuda a armar un plan de comidas que entre
                     en tu semana.» y «Es tu decisión». 3 → 422 HABITS_ACCESS_REQUEST_TOO_SOON con availableFrom
                     a los 7 días exactos; API-HBT-07 dice el pedido pendiente y desde cuándo puede volver a
                     pedir; el 404 de lo inexistente para lo demás. 4 → la base lo rechaza. 5 → 201; el anterior
                     queda REEMPLAZADO y hay una sola pendiente por profesional; los hechos son
                     PedidoDeAccesoAHabitosReemplazado y PedidoDeAccesoAHabitosHecho. 6 → 422
                     HABITS_ALREADY_SHARED. 7 → la base lo rechaza: se resuelve una sola vez y no se borra.
                     8 → la novedad lleva «Importante», con la palabra; TalkBack lee «Sin leer. Importante.»
                     antes del título; las demás novedades no la llevan.
NEGATIVE_ASSERTIONS  La novedad nunca lleva un hábito, y el aviso del teléfono dice solo «Tenés una novedad.».
                     Ningún pedido vence solo. La novedad no tiene un campo nuevo: se destaca por su tipo, para no
                     dejar sin leer el centro a las APK instaladas.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts («le llega a la persona como novedad
                     importante, sin un hábito …») · packages/domain/src/habitos-de-la-persona.test.ts («D-24 · el
                     límite …» y «D-23 · la novedad del pedido …») · apps/mobile/src/novedades-en-el-telefono.test.ts
                     («ronda 2.1: el pedido de un profesional para ver los hábitos abre «Mis hábitos» …», «el
                     pedido para ver los hábitos lleva «Importante» …», «TalkBack lee …» y «el texto del pedido
                     dice quién pide …») · apps/web/test/sus-habitos.test.mjs (los cuatro casos «6 · …») ·
                     test/integration/contrato.int-spec.ts («TEST-CT (DL-165, ronda 2.1): HBT-06 a 09 …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.22.0-candidata.1 lee la novedad y la
                     abre en «Mis hábitos» con el pedido)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, la APK y el website, en `npm test`; el
                     teléfono con la 0.22.0-candidata.1 y TalkBack
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 3 y parte 6
```

---

## TEST-FR2-014 — «Sí, que los vea»

```text
TEST_ID              TEST-FR2-014
TITLE                Responder que sí a un pedido es compartir: con el A3 y el texto vigente, solo para quien pidió
                     si todavía no comparte, y sumándolo si ya comparte
LEVEL                Integración (API + PostgreSQL real), dominio, APK (lógica pura) y contrato congelado de la
                     0.22.0-candidata.1
PRIORITY             P0 — una ampliación exige una aceptación nueva del titular
SOURCES              DL-165 D-25 (DEUDA_LEGAJO:6795; :6797: «Con la autorización activa, suma a quien pidió y
                     nadie más cambia»; :6798: «Sin compartir todavía (nunca o retirada), la activa solo para quien
                     pidió»; :6802: «con el vínculo terminado ya no se responde») · DL-165 D-17 nueva
                     (DEUDA_LEGAJO:6720: «"Sí, que los vea" y "No, por ahora" tienen el mismo peso») · D-27
                     (DEUDA_LEGAJO:6813) · DL-165 D-19 (DEUDA_LEGAJO:6732) · 08 C-12 (08:48: «una ampliación de
                     categoría o detalle exige nueva versión B2 y nueva aceptación del titular») ·
                     WP-FORMULARIOS-RONDA-2.md FR-14 y FR-15 (:338-339) y §8.4 (:367-368)
PRECONDITIONS        Las de TEST-FR2-013, con un pedido de cada profesional; el del entrenador, respondido «No, por
                     ahora» (TEST-FR2-015).
SYNTHETIC_FIXTURE    HABITOS; el texto del acto `habitos-compartidos-2026-11-propuesta`; un pedido nuevo del
                     entrenador sembrado en la base, como si volviera a pedir a los 7 días.
STEPS                1. La persona lee sus pedidos (API-HBT-08).
                     2. Un profesional responde el pedido de la persona; ella responde uno que no existe, y «Sí»
                        sin la autorización que vio.
                     3. «Sí» a la nutricionista con otro texto; después, con el vigente y sin compartir todavía.
                     4. El entrenador vuelve a pedir; la persona dice «Sí» con la autorización de antes y con la
                        vigente.
                     5. Sin el A3: leer los pedidos y decir «Sí».
                     6. Un pedido de un vínculo en pausa; reanudado; con el vínculo terminado, «Sí».
                     7. En la APK 0.22: «Sí, que los vea», con otros profesionales y sin compartir todavía; con
                        un rechazo.
EXPECTED             1 → cada pedido con su versión, quién pide y desde qué área. 2 → 404 para los dos primeros;
                     400 para el tercero. 3 → 409 CONSENT_VERSION_STALE; después, 200 SHARE: la autorización v1,
                     ACTIVE, con el texto aceptado; la nutricionista RECEIVES, el entrenador DOES_NOT_RECEIVE, y no
                     se le pregunta por él; el pedido queda ACEPTADO y ya no se lista. 4 → 409 VERSION_CONFLICT;
                     después, 200, la v2, y todos los reciben; los hechos son Hecho, NoPorAhora y Aceptado.
                     5 → 403 ACTION_FORBIDDEN en los dos. 6 → no se lista en pausa; vuelve al reanudar; terminado,
                     no se lista y «Sí» es 422 HABITS_RECIPIENT_NOT_AVAILABLE. 7 → el «Sí» pide leer el texto
                     antes de «Acepto y comparto», y avisa «Solo ‹Nombre› los va a ver.»; el cuerpo lleva el
                     pedido, la autorización y el texto que se vieron; un 409 dice que algo cambió mientras
                     respondía, y se vuelve a leer.
NEGATIVE_ASSERTIONS  Decir que sí a uno no comparte con nadie más. Sin el texto vigente o sin el A3 no se comparte.
                     «Sí» y «No, por ahora» son el mismo tipo de botón, sin «recomendado».
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts (««No, por ahora» no cambia nada y no pide
                     el A3; «Sí, que los vea» sin compartir todavía …», «sin el A3, los pedidos no se leen y «Sí» no
                     se puede …» y «sumarlo desde «Mis hábitos» (API-HBT-03, también desde la 0.21) …») ·
                     packages/domain/src/habitos-de-la-persona.test.ts («D-25 · «Sí, que los vea» a un pedido …» y
                     «los contratos de la ronda 2.1 son estrictos …») · apps/mobile/src/habitos-en-el-telefono.test.ts
                     (««Sí» lleva el pedido que se vio …», «el «Sí» amplía la lista …», «sin compartir todavía, el
                     «Sí» avisa …» y «los rechazos que piden volver a leer …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.22.0-candidata.1 dice «Sí» sin
                     compartir y con la autorización activa, y lee el 409, el 404 y el 422)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y la APK, en `npm test`; el teléfono con
                     la 0.22.0-candidata.1
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 5
```

---

## TEST-FR2-015 — «No, por ahora», y cambiar de opinión

```text
TEST_ID              TEST-FR2-015
TITLE                «No, por ahora» solo cierra el pedido: no cambia lo compartido ni pide el A3, el profesional no
                     sabe qué respondió, y la persona lo puede sumar cuando quiera
LEVEL                Integración (API + PostgreSQL real), dominio, APK y website (lógica pura) y contrato congelado
                     de la 0.21.0-candidata.1 y la 0.22.0-candidata.1
PRIORITY             P0 — decir que no siempre se puede, y no es definitivo
SOURCES              DL-165 D-25 (DEUDA_LEGAJO:6800: «"No, por ahora" solo resuelve el pedido: no cambia la
                     autorización ni pide el A3»; :6801: «Sumarlo desde "Mis hábitos" (API-HBT-03, también desde la
                     0.21) da por aceptado su pedido») · DL-165 D-23 (DEUDA_LEGAJO:6783: «nunca qué respondió») ·
                     DL-165 D-26 (DEUDA_LEGAJO:6804; :6807: «No hay repregunta automática»; :6810: «el pedido la
                     reemplaza») · DL-165 D-17 nueva (DEUDA_LEGAJO:6707) · 04 RNF-PRI-002 (04:797) ·
                     WP-FORMULARIOS-RONDA-2.md §8.1, 6 (:316, :328)
PRECONDITIONS        Las de TEST-FR2-013, con hábitos registrados.
SYNTHETIC_FIXTURE    HABITOS; profesionales sintéticos de habitos-en-el-telefono.test.ts (Marcos, el nuevo; Paula,
                     la que no los veía).
STEPS                1. «No, por ahora» al pedido del entrenador; otra vez el mismo.
                     2. El entrenador lee API-HBT-07.
                     3. Sin el A3, «No, por ahora» a otro pedido.
                     4. La persona suma al entrenador desde «Mis hábitos» («Cambiar con quiénes», API-HBT-03).
                     5. En la APK: un pedido de un profesional que además es nuevo; actualizar los hábitos sin
                        compartir con todos; «Cambiar con quiénes» con alguien que dijo que no.
                     6. En el escritorio: la tarjeta «Sus hábitos» después del «no».
EXPECTED             1 → 200 NOT_NOW; la autorización no cambia (ninguna escrita); después, 409 VERSION_CONFLICT.
                     2 → el pedido figura respondido (ANSWERED), sin decir qué. 3 → 200; el pedido queda
                     NO_POR_AHORA. 4 → su pedido queda ACEPTADO y ya no se lista; el entrenador los ve.
                     5 → la pregunta «… empezó a acompañarte» no aparece: el pedido la reemplaza; actualizar no
                     hace aparecer ninguna pregunta; marcar a quien no los veía lo suma y pide el texto. 6 → «Le
                     pediste acceso el …» y desde cuándo puede volver a pedirlo, sin lo que respondió la persona.
NEGATIVE_ASSERTIONS  «No, por ahora» no pide el A3 ni el texto. El profesional no recibe una novedad cuando ella
                     responde. Lo que dice la app después del «no» le recuerda que lo puede cambiar, sin culpa.
AUTOMATION           test/integration/habitos-de-la-persona.int-spec.ts (««No, por ahora» no cambia nada …», «sin el
                     A3, … «No, por ahora» sí …» y «sumarlo desde «Mis hábitos» … da por aceptado su pedido …») ·
                     apps/mobile/src/habitos-en-el-telefono.test.ts («lo que se le dice después nombra a quien
                     pidió, y el «No» le recuerda que lo puede cambiar», «quien pidió verlos no recibe además la
                     pregunta por un profesional nuevo» y «cambiar de opinión (D-17 nueva) …») ·
                     apps/web/test/sus-habitos.test.mjs («6 · sin que se los comparta …») ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (la 0.22.0-candidata.1 dice «No, por ahora» y
                     lee el 409 de responderlo otra vez; la 0.21 y la 0.22 suman desde «Cambiar con quiénes» y eso
                     acepta el pedido)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, la APK y el website, en `npm test`; el
                     teléfono con la 0.22.0-candidata.1
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 3 y parte 4
```

---

## TEST-FR2-016 — La 0.21 frente a la novedad nueva

```text
TEST_ID              TEST-FR2-016
TITLE                Las APK instaladas siguen leyendo todo: la 0.21 muestra la novedad sin destacarla, responde
                     «Tus hábitos» aparte y cierra el pedido sumando desde «Mis hábitos»
LEVEL                Integración (API + PostgreSQL real) y contrato congelado de la 0.13.2, la 0.20.0-candidata.1
                     y la 0.21.0-candidata.1; APK (lógica pura de la 0.22, para lo que no conoce)
PRIORITY             P0 — compatibilidad: una APK instalada no se actualiza sola
SOURCES              DL-165 D-28 (DEUDA_LEGAJO:6819: «La 0.21 recibe la novedad y la muestra con su texto, sin
                     destacarla; al abrirla se queda en Novedades») · DL-165 D-23 (DEUDA_LEGAJO:6776: «un campo
                     nuevo en `NovedadSchema` dejaría sin leer el centro a las APK instaladas») · D-27
                     (DEUDA_LEGAJO:6815: «La 0.21 sí lo dice») · DL-152 (lo que lee cada APK, congelado) ·
                     WP-FORMULARIOS-RONDA-2.md §8.1, 7 (:329) y §8.5 (:390) · 09v7 T19 (un cliente instalado no
                     cambia de forma)
PRECONDITIONS        Congeladas en `packages/domain/fixtures/lecturas-de-la-apk/`, la 0.13.2, la 0.20.0-candidata.1,
                     la 0.21.0-candidata.1 y la 0.22.0-candidata.1; una persona con A3, una nutricionista y un
                     entrenador con su vínculo y su B2.
SYNTHETIC_FIXTURE    HABITOS; una nota de coordinación; «Tus hábitos» v2 pedida por el entrenador.
STEPS                1. El entrenador pide acceso; cada APK que lee el centro de novedades lo lee y abre la
                        novedad nueva.
                     2. La 0.21 lee «Tus hábitos» v2 (FRI-01) y la responde (FRI-04).
                     3. Con un pedido esperando, la 0.21 lee y cambia «Mis hábitos» (HBT-01 a 04) y suma al
                        entrenador desde «Cambiar con quiénes».
                     4. La 0.20, que no declara `forms-format-3`, lee la bandeja con una Solicitud de formato 3.
                     5. En la APK 0.22: a qué pantalla lleva una vista que no conoce.
                     6. En un teléfono con la 0.21: la novedad y «Tus hábitos» aparte.
EXPECTED             1 → cada respuesta se lee con el esquema de esa APK, sin rechazos: `kind` y `open.view` son
                     texto (HABITS_ACCESS_REQUESTED, MY_HABITS). 2 → formato 3, una sola parte `tus_habitos`; 201,
                     y agrega una versión de los hábitos. 3 → «Mis hábitos» no cambia de forma; el pedido del
                     entrenador queda ACEPTADO. 4 → no la ve, como a ninguna de la ronda 2.1, que son de formato
                     3: la bandeja no la trae, y la estructura y el detalle son el 404 de lo inexistente.
                     5 → ninguna: queda leída en el centro, con su texto. 6 → la novedad, sin
                     «Importante», se queda en Novedades al tocarla; «Tus hábitos» dice «Parte 1 de 1».
NEGATIVE_ASSERTIONS  Ninguna lectura congelada cambia de forma: lo nuevo va en operaciones nuevas (HBT-06 a 09) y
                     en un tipo de novedad nuevo, sin campos nuevos. El texto del acto no cambia, así que nadie
                     tiene que volver a aceptarlo.
AUTOMATION           test/integration/lecturas-de-las-apk.int-spec.ts («las novedades, los avisos del teléfono …»,
                     «el formato 3: … y la parte «Tus hábitos»», ««Mis hábitos»: leerlos, contarlos, compartirlos
                     …» y el cierre «leyó con su esquema cada respuesta que esta APK lee …», para cada APK
                     congelada) · packages/domain/src/lecturas-de-la-apk.test.ts (las cuatro vigentes y el contrato
                     de hoy) · packages/domain/src/habitos-de-la-persona.test.ts («DL-152 · las APK congeladas hasta
                     la 0.20 no leen API-HBT …») · apps/mobile/src/novedades-en-el-telefono.test.ts («una vista que
                     no conoce (como `MY_HABITS` para la 0.21) …») · test/integration/plantillas-de-inicio.int-spec.ts
                     («FRM-03: … su Solicitud la ve solo la app que lee el formato 3»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio y la APK, en `npm test`; un teléfono con
                     la 0.21.0-candidata.1, opcional
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md, «La prueba de la
                     0.22», parte 7 (opcional)
```

---

**Lo que estos oráculos no cubren y queda a la vista.** El recorrido con TalkBack (en la 0.21 y en la 0.22), la pregunta
por un profesional nuevo en el teléfono, y la revisión legal del texto del acto, de D-9 y de la D-17 nueva (el pedido de
acceso) antes de usarlos con personas reales (y el gate del 08 §42). Los tres están en
`EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md`.
