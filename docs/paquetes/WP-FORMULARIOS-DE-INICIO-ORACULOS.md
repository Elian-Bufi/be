# WP-FORMULARIOS-DE-INICIO — los seis oráculos TEST-FRI

> **Qué es esto.** El paquete declaró seis oráculos nuevos, TEST-FRI-001 a 006, en una línea cada uno
> (`WP-FORMULARIOS-DE-INICIO.md` §6, :103-120). Acá van escritos con los trece campos que la §6 del 11A declara
> obligatorios (11A:150-169), igual que los TEST-FRM de WP-07 (`WP-07-ORACULOS.md`).
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Los TEST-FRM-001 a 007 siguen
> como están y siguen verdes. Cuando Dirección consolide, toma estos seis y reemite el documento.
>
> **De dónde sale cada oráculo.** De DL-164 (`docs/DEUDA_LEGAJO.md`, ratificada el 2026-11-04 con D-1 a D-9; D-10 a D-15
> son decisiones de la implementación, a ratificar) y de las normas que cita, con referencia `archivo:línea`. Un oráculo
> derivado dice qué hay que observar para aceptar la prueba; no inventa la regla, la lee.
>
> **Estado de la automatización.** Los seis se ejecutan completos en la CI, con PostgreSQL 16 real (Testcontainers).
> Ninguno queda parcial. La CI del commit integrado (`8379900`, main `92db513`) dio 964 de 964 en integración.

---

## TEST-FRI-001 — Las APK instaladas no ven lo nuevo

```text
TEST_ID              TEST-FRI-001
TITLE                Una Solicitud con tipos nuevos no existe para las APK instaladas; FRI sí la sirve
LEVEL                Integración (API + PostgreSQL real) y contrato congelado de cada APK publicada
PRIORITY             P0 — compatibilidad: una APK instalada no se actualiza sola
SOURCES              DL-164 D-5 (DEUDA_LEGAJO:6091: «FRM-06 no lista […] FRM-02, 05, 07 y 08 responden el
                     mismo 404») · DL-137 D-7 («lo nuevo va en operaciones nuevas») · DL-152 (lo que lee cada
                     APK, congelado) · 09v16.1 §22.2, §22.5 a §22.8 (09:1469, 1569, 1602, 1620, 1664)
PRECONDITIONS        Profesional de Nutrición verificado y habilitado; persona con A3, vínculo aceptado y B2;
                     una plantilla con tipos nuevos (formato 2) y una Solicitud sobre ella.
SYNTHETIC_FIXTURE    Plantilla sintética «Cómo comés hoy (prueba)» (soporte-formularios-v2.ts), con CHOICE,
                     MULTI_CHOICE, LIST, FOODS, TIMES y NUMBER y una condicional; cuentas @example.invalid.
STEPS                1. Como la persona, listar sus solicitudes por FRM-06, sin filtro y con PENDING.
                     2. Pedir la Solicitud por FRM-05 y su versión por FRM-02.
                     3. Responderla por FRM-07 (la forma V1).
                     4. Responderla por FRI-04 y rectificar esa respuesta por FRM-08.
                     5. Pedir la definición por FRI-01 y la bandeja por FRI-02.
                     6. Pedir por FRI-01 la versión de P0 de «Antecedentes para entrenamiento».
                     7. Por cada APK congelada, pedir lo que esa APK lee, como lo pide, y leer la respuesta con
                        su esquema (lecturas-de-las-apk.int-spec.ts).
EXPECTED             1 → 200; la Solicitud no figura. 2 y 3 → 404 con el cuerpo idéntico al de una Solicitud
                     que no existe. 4 → FRI-04 201; FRM-08 404 idéntico. 5 → FRI-01 200 con format 2,
                     usesNewTypes true y estimatedMinutes; FRI-02 la lista con usesNewTypes, estimatedMinutes y
                     su estado. 6 → 200 traducida: texto de varias líneas, número con unidad y límites, sí o
                     no; usesNewTypes false y sin minutos. 7 → cada APK (0.13.2, 0.17.0-candidata.3,
                     0.18.0-candidata.1 y 0.20.0-candidata.1) lee todo lo que llama sin una sola respuesta que
                     su esquema rechace.
NEGATIVE_ASSERTIONS  Los pasos 3 y 4 no escriben ninguna respuesta ni rectificación por FRM. El 404 no se
                     distingue del de lo inexistente: no confirma que la Solicitud exista. Lo congelado de una
                     APK no se edita para que la prueba pase.
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-001 · …», dos casos) ·
                     test/integration/lecturas-de-las-apk.int-spec.ts (DL-152: el bloque de FRM para las APK
                     que lo leen y el de FRI para la 0.20.0-candidata.1) · packages/domain/src/
                     lecturas-de-la-apk.test.ts (VIGENTES y el contrato de hoy)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; EVIDENCIA/FORMULARIOS-DE-INICIO/LEEME.md
```

---

## TEST-FRI-002 — Lo oculto no se guarda

```text
TEST_ID              TEST-FRI-002
TITLE                Una respuesta a una pregunta condicional cerrada se rechaza; el obligatorio oculto no se exige
LEVEL                Integración (API + PostgreSQL real) y dominio
PRIORITY             P0 — minimización: no se guarda lo que la persona no tenía por qué contestar
SOURCES              DL-164 D-2 (DEUDA_LEGAJO:6082: «Lo que queda oculto no se responde ni se guarda») ·
                     06 REG-06-211 (06:8537, la respuesta atada a la Solicitud y la versión exactas) ·
                     06 T-06-77 (06:8298, SELF_REPORTED)
PRECONDITIONS        Las de TEST-FRI-001. La Solicitud pide como obligatoria la condicional «tipo de diabetes»,
                     que se abre solo si «condiciones» incluye diabetes.
SYNTHETIC_FIXTURE    RESPUESTAS_V2 de soporte-formularios-v2.ts, con «condiciones» = hipertensión.
STEPS                1. Responder por FRI-04 con «condiciones» = hipertensión y con «tipo de diabetes» igual.
                     2. Responder sin «tipo de diabetes».
                     3. Leer la Solicitud por FRI-03 como la persona.
                     4. Sobre una Solicitud de P0: responder por FRI-04 con un tipo nuevo y con un campo no
                        pedido; el profesional carga una propuesta; la APK instalada lista por FRM-06 y responde
                        por FRM-07; la persona confirma por FRI-04; leerla por FRM-05 y por FRI-03.
                     5. Un número que la APK instalada respondió sin unidad por FRM-07, leído por FRI-03.
EXPECTED             1 → 422 FORM_RESPONSE_INVALID con un solo issue: FORM_ANSWER_NOT_VISIBLE en
                     answers[i].answer y su fieldCode. 2 → 201; la fila guarda contenido con format 2 y
                     transcripcion null. 3 → RESPONDED, respondable false, cada respuesta SELF_REPORTED, sin
                     «tipo de diabetes», sin transcripción ni propuesta. 4 → 422 FORM_ANSWER_TYPE_MISMATCH y
                     FORM_ANSWER_NOT_REQUESTED; con la propuesta esperando, FRM-06 la lista PENDING y no
                     respondible, y FRM-07 responde 422 FORM_REQUEST_NOT_RESPONDABLE sin escribir (D-10,
                     DEUDA_LEGAJO:6112); confirmada, se guarda en la forma V1: FRM-05 la lee y FRI-03 la lee
                     en V2 con la transcripción. 5 → lo guardado queda con unit null y FRI-03 lo devuelve con
                     la unidad de su campo.
NEGATIVE_ASSERTIONS  El 422 no repite el valor rechazado («tipo_2») en sus detalles. El paso 1 no escribe nada.
                     Que la Solicitud pida un campo como obligatorio no obliga a responderlo si está oculto.
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-002 · …», tres casos) ·
                     packages/domain/src/formularios-v2.test.ts (la condicional, la minimización, los
                     obligatorios visibles, cada tipo)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-FRI-003 — La propuesta no es del perfil

```text
TEST_ID              TEST-FRI-003
TITLE                Lo que carga el profesional, mientras espera, solo lo ven él y la persona
LEVEL                Integración (API + PostgreSQL real) y esquema de la base
PRIORITY             P0 — un dato que la persona no confirmó no es un dato de su perfil
SOURCES              DL-164 D-3 (DEUDA_LEGAJO:6085: «La propuesta del profesional es una entidad aparte») ·
                     06 REG-06-213 (06:8568, estado de formulario ≠ autorización efectiva) ·
                     WP-FORMULARIOS-DE-INICIO.md §6 (:109-113, con la corrección del 2026-11-05)
PRECONDITIONS        Las de TEST-FRI-001, más otro profesional de Nutrición vinculado y autorizado con la misma
                     persona.
SYNTHETIC_FIXTURE    RESPUESTAS_V2 (con «Milanesa con puré» como texto testigo).
STEPS                1. El profesional de la Solicitud carga la propuesta por FRI-06.
                     2. El otro profesional pide la Solicitud por FRI-03 y carga por FRI-06.
                     3. El otro profesional pide su propia Solicitud a la misma persona y la lee por FRI-03.
                     4. La persona lee su bandeja (FRI-02), su vista (FRI-03) y sus novedades.
                     5. El profesional reemplaza la propuesta con la versión vista, con una vieja y sin versión.
                     6. Dos cargas simultáneas sobre otra Solicitud.
EXPECTED             1 → 201, versión v1. 2 → 404 con el cuerpo idéntico al de lo inexistente, en las dos.
                     3 → proposal, lastProposalOutcome y response en null. 4 → la bandeja trae pendingProposal
                     (id, profesional, loadedAt, versión) sin respuestas; la vista, PENDING, respondable true,
                     response null y la propuesta completa; una novedad FORM_PROPOSAL_LOADED que abre esa
                     Solicitud. 5 → 200 con v2; con v1 otra vez o sin versión, 409 VERSION_CONFLICT. 6 → una 201
                     y una 409 VERSION_CONFLICT; una sola propuesta en la base.
NEGATIVE_ASSERTIONS  Ninguna fila de respuesta mientras la propuesta espera. Ni la bandeja ni la novedad llevan
                     el texto de las respuestas. La base no admite dos pendientes por Solicitud (índice parcial),
                     ni una pendiente sin respuestas (CHECK con COALESCE, D-13 y la migración 20261104120200).
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-003 · …», dos casos) ·
                     test/integration/schema.int-spec.ts («DL-164 — la propuesta del profesional: lo que la base
                     garantiza aunque el código se equivoque»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

## TEST-FRI-004 — Confirmar es responder

```text
TEST_ID              TEST-FRI-004
TITLE                La persona confirma lo cargado, con una corrección; la respuesta es suya
LEVEL                Integración (API + PostgreSQL real) y dominio
PRIORITY             P0 — procedencia: lo confirmado sigue siendo autoinformado
SOURCES              DL-164 D-4 (DEUDA_LEGAJO:6088: «Confirmar es responder […] sigue SELF_REPORTED») ·
                     DL-164 D-15 (DEUDA_LEGAJO:6124) · 06 T-06-77 (06:8298) · 06 REG-06-211 (06:8537)
PRECONDITIONS        Las de TEST-FRI-001, con una propuesta v1 cargada.
SYNTHETIC_FIXTURE    RESPUESTAS_V2 con 6 vasos de agua; la persona corrige a 8 (conAgua(8)).
STEPS                1. La persona responde por FRI-04 sin fromProposal, y con fromProposal de versión v9.
                     2. Confirma con fromProposal (id y v1) y el agua corregida a 8.
                     3. Lee su vista y su bandeja; el profesional lee la suya y sus novedades.
                     4. Intenta confirmar otra vez; el profesional intenta cargar otra propuesta.
                     5. Rectifica por FRI-05 con la versión v1, y otra vez con v1; intenta rectificar por FRM-08.
EXPECTED             1 → 409 VERSION_CONFLICT las dos; ninguna respuesta. 2 → 201, versión v1. 3 → RESPONDED,
                     respondable false, propuesta null; transcription con el profesional, loadedAt,
                     confirmedAt y correctedFieldCodes = [«agua»]; cada respuesta SELF_REPORTED; la propuesta
                     queda CONFIRMADA y sin contenido; el profesional ve la misma transcripción y recibe
                     FORM_PROPOSAL_CONFIRMED; los hechos, en orden: cargada, respuesta registrada, confirmada.
                     4 → 422 FORM_REQUEST_NOT_RESPONDABLE las dos. 5 → 201 con v2 (la original no cambia y la
                     vista efectiva es la rectificada); la segunda, 409; FRM-08, 404.
NEGATIVE_ASSERTIONS  Confirmar no pisa en silencio: sin la versión que se vio, no hay respuesta. La propuesta
                     confirmada no conserva sus respuestas. correctedFieldCodes no cuenta como corregido un campo
                     que la base devolvió con las claves en otro orden.
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-004 · …») ·
                     packages/domain/src/formularios-v2.test.ts («la transcripción registra solo lo que la
                     persona cambió, sumó o quitó» y «… no depende del orden de las claves …»)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers); el dominio, en `npm test`
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; el recorrido en el teléfono (EVIDENCIA/
                     FORMULARIOS-DE-INICIO/LEEME.md, parte 3)
```

---

## TEST-FRI-005 — Rechazar y retirar borran

```text
TEST_ID              TEST-FRI-005
TITLE                Lo que la persona no confirmó se borra: al rechazarlo, al retirarlo, al revocar el A3 o al
                     cerrar la cuenta
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0 — minimización: un dato de salud no confirmado no queda guardado
SOURCES              DL-164 D-6 (DEUDA_LEGAJO:6096: «Lo no confirmado se borra») · DL-164 D-11 y D-12
                     (DEUDA_LEGAJO:6115, 6117)
PRECONDITIONS        Las de TEST-FRI-001, con una propuesta v1 cargada en cada caso.
SYNTHETIC_FIXTURE    RESPUESTAS_V2.
STEPS                1. La persona rechaza (FRI-08) con v2, con v1 y otra vez con v1; el profesional carga otra.
                     2. El profesional retira (FRI-07) con v2, con v1 y otra vez con v1; la persona intenta
                        confirmar lo retirado y después responde sola.
                     3. La persona revoca su A3 (API-CON-08); rechaza sin A3.
                     4. Con el vínculo en pausa, la persona rechaza.
                     5. La persona cierra su cuenta (API-ACC-P1-03).
EXPECTED             1 → 409, 200 REJECTED, 409; la Solicitud sigue PENDING y respondable; el profesional ve
                     lastProposalOutcome REJECTED y recibe FORM_PROPOSAL_REJECTED; la propuesta nueva es otra,
                     v1, y el desenlace anterior deja de mostrarse. 2 → 409, 200 WITHDRAWN, 409; nadie recibe
                     novedad por retirar; confirmar lo retirado, 409; responder sola, 201 sin transcripción.
                     3 → en la misma transacción, la propuesta queda RETIRADA, sin contenido, con resueltaEn =
                     revokedAt y el evento a nombre de la persona por API-CON-08; sin A3, el profesional recibe
                     404 en FRI-03 y FRI-06; rechazar sin A3 no es 403. 4 → 200 REJECTED, sin novedad para el
                     profesional. 5 → 201; la propuesta queda RETIRADA y sin contenido, con los eventos
                     cargada (API-FRI-06) y retirada (API-ACC-P1-03).
NEGATIVE_ASSERTIONS  Después de rechazar, retirar, revocar o cerrar, ninguna fila conserva las respuestas
                     propuestas (contenido NULL). La Solicitud nunca pasa a RESPONDED por un rechazo. Sin
                     autorización vigente, el profesional no se entera del rechazo.
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-005 · …», cinco casos)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR; «No es correcto» en el teléfono (EVIDENCIA/
                     FORMULARIOS-DE-INICIO/LEEME.md, parte 4)
```

---

## TEST-FRI-006 — Solo el profesional de la Solicitud carga

```text
TEST_ID              TEST-FRI-006
TITLE                Cargar y retirar exigen ser el profesional de la Solicitud, con acceso vigente
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0 — autorización
SOURCES              DL-164 D-3 y D-13 (DEUDA_LEGAJO:6085, 6120) · 06 REG-06-213 (06:8568) · 09v16.1 §22.3
                     (09:1489, el mismo PDP que FRM-03)
PRECONDITIONS        Dos circuitos de las precondiciones de TEST-FRI-001 y otro profesional de Nutrición.
SYNTHETIC_FIXTURE    RESPUESTAS_V2; una opción inventada («inventada») para el caso de forma.
STEPS                1. Otro profesional carga y retira sobre la Solicitud.
                     2. La persona pone el vínculo en pausa; el profesional de la Solicitud carga.
                     3. En el segundo circuito, la persona revoca el B2; el profesional carga.
                     4. Con una propuesta en v2: cargar y retirar con v1.
                     5. Cargar una respuesta que no tiene la forma del formulario; después, cargar un solo opcional.
EXPECTED             1, 2 y 3 → 404 con el cuerpo idéntico al de una Solicitud que no existe. 4 → 409
                     VERSION_CONFLICT las dos. 5 → 422 FORM_RESPONSE_INVALID con un issue por problema; con un
                     solo opcional, 200 y v3, y la propuesta tiene solo esa respuesta.
NEGATIVE_ASSERTIONS  Los pasos 1 a 3 no escriben ninguna propuesta. El 422 no repite el valor inventado. Los
                     obligatorios no se le exigen al profesional: los completa la persona al confirmar.
AUTOMATION           test/integration/formularios-de-inicio.int-spec.ts («TEST-FRI-006 · …», dos casos)
ENVIRONMENT          CI (PostgreSQL 16 real, Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR
```

---

**Lo que estos oráculos no cubren y queda a la vista.** El recorrido en el teléfono con TalkBack, el website en el
navegador («Cargar con la persona») y la revisión del legajo legal por un abogado (D-8). Los tres están en
`EVIDENCIA/FORMULARIOS-DE-INICIO/LEEME.md`.
