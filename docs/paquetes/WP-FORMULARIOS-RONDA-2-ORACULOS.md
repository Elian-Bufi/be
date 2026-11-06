# WP-FORMULARIOS-RONDA-2 — los diez oráculos TEST-FR2

> **Qué es esto.** Lo que la ronda 2 de los formularios cambió (DL-165), escrito como oráculos con los trece campos que la
> §6 del 11A declara obligatorios (11A:150-169), igual que los TEST-FRI de WP-FORMULARIOS-DE-INICIO
> (`WP-FORMULARIOS-DE-INICIO-ORACULOS.md`). El paquete (`WP-FORMULARIOS-RONDA-2.md`) no los había declarado: salen de sus
> criterios de aceptación (§1 y §3) y del FR-10 (§4).
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Los TEST-FRM de WP-07 y los
> TEST-FRI siguen como están. Cuando Dirección consolide, toma estos diez y reemite el documento.
>
> **De dónde sale cada oráculo.** De DL-165 (`docs/DEUDA_LEGAJO.md`, ratificada el 2026-11-05 con D-1 a D-9; D-10 a D-13
> ratificadas el mismo día; D-14 a D-19, del FR-10, a ratificar), del paquete y de las normas que cita, con referencia
> `archivo:línea`. Un oráculo derivado dice qué hay que observar para aceptar la prueba; no inventa la regla, la lee.
>
> **Estado de la automatización.** Los diez se ejecutan en la CI: lo de la API, con PostgreSQL 16 real
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
SOURCES              DL-165 D-1 (DEUDA_LEGAJO:6216: «"Parte N de 6", "Anterior", "Siguiente" y un repaso antes
                     de enviar. Si falta una obligatoria, se avisa al pasar de parte y se deja seguir y volver») ·
                     DL-165 D-3 (DEUDA_LEGAJO:6225) y D-15 (DEUDA_LEGAJO:6324, siete partes) ·
                     WP-FORMULARIOS-RONDA-2.md FR-03 y FR-04 (:87-88) · 05 UC-P33 (05:15197)
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
SOURCES              DL-165 D-5 (DEUDA_LEGAJO:6233: «`trn_dias_por_semana` no puede pasar de los días marcados:
                     es una regla del dominio y de la API, y la app la avisa antes de enviar») · DL-165 D-11
                     (DEUDA_LEGAJO:6288: «Lo aplican igual la API (FRI-04, 05 y 06), la app y la web, que además
                     dicen junto al número cuánto admite») · WP-FORMULARIOS-RONDA-2.md FR-07 (:90)
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
SOURCES              DL-165 D-6 (DEUDA_LEGAJO:6238) · DL-165 D-10 (DEUDA_LEGAJO:6278: «Se entregan solo a un
                     cliente que declara `forms-format-3` en `X-BE-Capabilities` […]: para los demás, FRI-02 no
                     las lista y FRI-01 y FRI-03 a 08 responden el 404 de lo inexistente») · WP-FORMULARIOS-
                     RONDA-2.md FR-08 (:89) · DL-152 (lo que lee cada APK, congelado) · DL-122 (las capacidades)
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
SOURCES              DL-165 D-4 (DEUDA_LEGAJO:6227: «El embarazo, sin elegir al pedir y no obligatorio, en los dos
                     formularios; cada pregunta dice si viene pedida por defecto»; cita 09:1528) · DL-165 D-12
                     (DEUDA_LEGAJO:6295: «"pedida por defecto" es `requestedByDefault`, que va solo cuando es
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
SOURCES              DL-165 D-8 (DEUDA_LEGAJO:6245) · DL-165 D-13 (DEUDA_LEGAJO:6309: «Los ve solo el profesional
                     que pidió el formulario, en sus Alcances permitidos: la regla de API-FRI-03») · 08 §11
                     (08:183) · 04 RNF-SEC-006 (04:777) · WP-FORMULARIOS-RONDA-2.md FR-09 (:92) · DL-127
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
SOURCES              DL-165 D-9 (DEUDA_LEGAJO:6251) · DL-165 D-16 (DEUDA_LEGAJO:6335: «Lo que el formulario
                     preguntó de la parte […] reemplaza lo vigente […]. Rectificar una respuesta (FRI-05) no
                     cambia los hábitos») · DL-165 D-18 (DEUDA_LEGAJO:6353) · WP-FORMULARIOS-RONDA-2.md §4.2
                     (:149) · 06 T-06-77 (06:8298, SELF_REPORTED) · 06 REG-06-209 (06:8485)
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
SOURCES              DL-165 D-9 (DEUDA_LEGAJO:6251: «La ven los profesionales de la persona solo si ella activa
                     en su app "Compartir mis hábitos con mis profesionales", con la lista de quiénes los ven») ·
                     DL-165 D-17 y D-19 (DEUDA_LEGAJO:6343, 6358) · 04 RNF-SEC-006 (04:777, «salvo autorización
                     explícita») · 08 §11 (08:183), C-11 y C-12 (08:47-48) · WP-FORMULARIOS-RONDA-2.md §4.3 y
                     §4.4 (:167, :192)
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
SOURCES              04 RNF-PRI-002 (04:797) · DL-165 D-19 (DEUDA_LEGAJO:6358: «retirar no pide el A3, porque
                     siempre se puede […] Cerrar la cuenta la retira») · WP-FORMULARIOS-RONDA-2.md §4.5 (:202) ·
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
                     aceptación del titular») · DL-165 D-17 (DEUDA_LEGAJO:6343: «Un profesional que vuelve con
                     otro vínculo después de terminar es alguien que llega después (`NOT_ASKED`)») ·
                     WP-FORMULARIOS-RONDA-2.md §4.3 (:173-175)
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

**Lo que estos oráculos no cubren y queda a la vista.** El recorrido con TalkBack, la pregunta por un profesional nuevo
en el teléfono y la revisión legal del texto del acto y de D-9 antes de usarlo con personas reales (y el gate del 08
§42). Los tres están en `EVIDENCIA/FORMULARIOS-RONDA-2/LEEME.md`.
