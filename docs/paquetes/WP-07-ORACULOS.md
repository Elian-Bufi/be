# WP-07 — los siete oráculos TEST-FRM que el 11A dejó sin escribir

> **Qué es esto.** El 11A enuncia los siete escenarios de formularios como **títulos de una línea** (11A:604-610), sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:150-169). Es el mismo hueco estructural que WP-06 encontró en TEST-TRN (DL-075) y WP-05 en TEST-ANT (DL-065): la §6 no se aplicó a ningún TEST de módulo, y el DoD del 11A no lo detecta.
>
> **Autorización.** D-C de `docs/paquetes/WP-07.md`, decidida por Dirección el 2026-09-21, registrada como **DL-094**. Mismo criterio de oráculo derivado que WP-05 (DL-065), WP-06 (DL-075) y WP-02/03 (DL-027).
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Cuando Dirección quiera consolidar, toma estos siete y reemite el documento.
>
> **De dónde sale cada oráculo.** De la norma que el título cita o implica, con referencia `archivo:línea`. Un oráculo derivado dice qué hay que observar para aceptar la prueba; no inventa la regla, la lee.
>
> **Estado de la automatización.** Seis de los siete se ejecutan completos. **TEST-FRM-004 queda parcial y declarado**: la reutilización de un dato del perfil se acepta como referencia opaca, sin verificación cruzada contra el dato de origen. El oráculo lo dice en su propio campo `AUTOMATION`, porque un oráculo que se declara verde sobre algo que no se verifica es peor que uno que se declara parcial.

---

## TEST-FRM-001 — Una plantilla listada no es un permiso

```text
TEST_ID              TEST-FRM-001
TITLE                template ≠ permiso
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              09:1461 («Una plantilla listada no prueba que todos sus campos puedan solicitarse a un
                     asesorado concreto») · 09:1528 («Una plantilla con campos más amplios no amplía B2»)
                     08:1127-1141 («plantilla ≠ autorización») · REG-06-209 (06:8485-8502) · REG-06-213 (06:8568)
PRECONDITIONS        Profesional con un alcance verificado y habilitado. Catálogo sintético sembrado por migración
                     (FRM-SALUD y FRM-HABITOS). **Sin vínculo** con el asesorado del paso 3.
SYNTHETIC_FIXTURE    FRM-SALUD v1, con tres campos de categoría SALUD_Y_SEGURIDAD: condiciones declaradas, dolor o
                     lesiones, medicación con relevancia para la práctica.
STEPS                1. Listar el catálogo como profesional autenticado (API-FRM-01).
                     2. Consultar la versión exacta de FRM-SALUD (API-FRM-02) y leer sus campos.
                     3. Con esa misma versión, crear una Solicitud sobre un asesorado con el que no hay vínculo
                        (API-FRM-03).
EXPECTED             Los pasos 1 y 2 responden **200** con la estructura completa de la plantilla. El paso 3
                     responde **404 RESOURCE_NOT_FOUND**, idéntico al de un asesorado inexistente.
NEGATIVE_ASSERTIONS  Ver el catálogo no creó ninguna Solicitud, ningún vínculo ni ningún consentimiento. La
                     respuesta de FRM-02 **no contiene ningún dato personal** de nadie. El 404 del paso 3 no dice
                     si el asesorado existe, ni si el problema es el vínculo, el B2 o el alcance.
AUTOMATION           test/integration/contrato.int-spec.ts («TEST-CT (WP-07)»): el bloque lista el catálogo, lee la
                     versión y después pide sobre `randomUUID()` esperando 404.
ENVIRONMENT          CI, PostgreSQL 16 real (Testcontainers); y local contra PostgreSQL 16 embebido
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-07/resultados-integracion-*.md
```

**Por qué el oráculo separa leer de pedir.** El catálogo es metadato: cualquier profesional autenticado lo ve, y eso es correcto porque no hay titular de por medio. Lo que la prueba tiene que demostrar es que esa lectura no es un escalón hacia el dato de nadie: el corte está en FRM-03, y ahí el PDP decide antes que cualquier validación de contrato.

---

## TEST-FRM-002 — Crear una Solicitud valida B2, propósito y pertinencia

```text
TEST_ID              TEST-FRM-002
TITLE                request valida B2/propósito/pertinencia
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              09:1509-1520 (precondiciones: vínculo ACTIVO, alcance, B2 vigente, finalidad, pertinencia,
                     cada categoría/campo autorizado, templateVersion seleccionable)
                     08:1249-1263 · 08:1282-1297 (el PDP se reevalúa al crear, al exponer y al entregar)
                     REG-06-210 (06:8506-8533) · REG-06-212 (06:8557-8564) · 09:1557 (el error no enumera)
PRECONDITIONS        Profesional con Entrenamiento verificado y habilitado; vínculo aceptado; B2 del alcance y A3
                     vigentes.
SYNTHETIC_FIXTURE    FRM-SALUD v1. Solicitud con propósito «Seguridad del entrenamiento», alcance ENTRENAMIENTO,
                     campos pedidos: condiciones declaradas y dolor o lesiones; requerido: condiciones declaradas.
STEPS                1. Crear la Solicitud con el cuerpo válido (API-FRM-03).
                     2. Repetir con la **misma** Idempotency-Key y el mismo cuerpo.
                     3. Repetir con la misma clave y **otro** propósito.
                     4. Crear sin cabecera Idempotency-Key.
                     5. Crear con `requiredFieldCodes` que incluye un campo que no está en `requestedFieldCodes`.
                     6. Crear con un `templateVersionId` inexistente.
EXPECTED             1 → **201** con `status: "PENDING"` y exactamente los campos pedidos. 2 → **201** con el mismo
                     `formRequestId` (replay idempotente). 3 → **409 IDEMPOTENCY_KEY_REUSED**. 4 → **400**.
                     5 → **422 FORM_REQUEST_INVALID**. 6 → **422 FORM_TEMPLATE_NOT_SELECTABLE**.
NEGATIVE_ASSERTIONS  El `201` **no** devuelve `professionalId`, `relationshipId` ni `consentVersionId`: son
                     server-owned y no viajan. Ningún error de 422 enumera categorías ni campos que el profesional
                     no pidió (09:1557). Crear la Solicitud **no** creó ni amplió consentimiento, ni cambió el
                     estado del vínculo, ni dio acceso a ningún dato del asesorado.
AUTOMATION           test/integration/contrato.int-spec.ts («TEST-CT (WP-07)»): los seis casos, en ese orden.
                     packages/domain/src/contratos-wp07.test.ts (REG-06-212 puro, sin base)
ENVIRONMENT          CI, PostgreSQL 16 real (Testcontainers); y local contra PostgreSQL 16 embebido
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-07/resultados-integracion-*.md
```

**Una aclaración honesta sobre «pertinencia».** El 08 define una matriz `alcance × categoría → {permitido, nivel_de_detalle}` (08:296-310) cuyo contenido clínico **nadie con competencia clínica revisó todavía** (VJR-1, VJR-4, VD-1; 08:382). WP-07 implementa la **forma** de esa matriz —existe, se consulta, se puede estrechar sin tocar el modelo— pero en P0 permite las cuatro categorías en los tres alcances. El oráculo verifica que el chequeo corre y que el error es anti-enumeración; **no** verifica una diferenciación clínica que el legajo todavía no tiene. Está declarado en DL-095.

---

## TEST-FRM-003 — Lo que responde el asesorado queda SELF_REPORTED

```text
TEST_ID              TEST-FRM-003
TITLE                respuesta SELF_REPORTED
LEVEL                Integración (API + PostgreSQL real), base de datos y dominio
PRIORITY             P0
SOURCES              09:1581 («cada answer queda SELF_REPORTED») · 09 §22.7 · REG-06-211 (06:8537-8553: procedencia
                     SELF_REPORTED como atributo de la Respuesta) · 04:1090 (medido ≠ informado ≠ calculado)
                     08 §56.4 (autoinformado ≠ diagnóstico)
PRECONDITIONS        Las de TEST-FRM-002, con una Solicitud PENDIENTE.
SYNTHETIC_FIXTURE    Respuesta a «condiciones declaradas» con el texto «Sin condiciones».
STEPS                1. Responder la Solicitud como asesorado (API-FRM-07).
                     2. Leer la Solicitud con su respuesta, como profesional y como asesorado (API-FRM-05).
                     3. En el dominio, intentar construir una respuesta con otra procedencia.
EXPECTED             1 → **201** con `formResponseId`, `version: "v1"` y `submittedAt`. 2 → cada respuesta viaja
                     con `provenance: "SELF_REPORTED"`. 3 → el schema **rechaza** cualquier otro valor: el campo es
                     un literal, no un enum variable.
NEGATIVE_ASSERTIONS  En ninguna superficie la respuesta se presenta como medición, como valor tomado por el
                     profesional ni como diagnóstico. El copy de las dos pantallas lo dice explícitamente y una
                     prueba lo verifica sobre el texto. La respuesta **no** entra en la evolución antropométrica ni
                     en ningún cálculo.
AUTOMATION           packages/domain/src/contratos-wp07.test.ts («TEST-FRM-003 · cada respuesta persistida es
                     SELF_REPORTED por invariante del schema») y la prueba de copy («el copy no presenta … lo
                     declarado como medición») · test/integration/contrato.int-spec.ts (el 201 y su relectura)
ENVIRONMENT          CI, PostgreSQL 16 real; dominio sin base (node:test)
EVIDENCE_EXPECTED    Captura de la pantalla del profesional donde la respuesta aparece rotulada «Declarado por la
                     persona», en EVIDENCIA/WP-07/
```

**Por qué el literal y no un enum.** Un enum con un solo valor admitido hoy es un enum con dos mañana. El contrato declara `z.literal('SELF_REPORTED')`: para que una respuesta de formulario pudiera tener otra procedencia habría que **cambiar el contrato**, que es exactamente la barrera que el 09 pide.

---

## TEST-FRM-004 — Reutilizar un dato del perfil conserva su origen

```text
TEST_ID              TEST-FRM-004
TITLE                reutilización de perfil conserva procedencia
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              09:1583-1585 («reutilizar perfil preserva origen»; `profileSourceRef` refiere a un dato propio
                     compatible) · REG-06-212 (06:8557-8564: reutilizar un dato de perfil **no fusiona** las dos
                     estructuras) · 05:15130-15134 (UC-P32 V02: sin alterar el dato de origen en silencio)
PRECONDITIONS        Las de TEST-FRM-003.
SYNTHETIC_FIXTURE    Respuesta que declara `profileSourceRef` apuntando a un dato propio del asesorado.
STEPS                1. Responder declarando `profileSourceRef` en una de las respuestas (API-FRM-07).
                     2. Leer la respuesta (API-FRM-05) y observar la referencia.
                     3. Leer el dato de perfil de origen y compararlo con el de antes del paso 1.
EXPECTED             La respuesta conserva `profileSourceRef` tal como se declaró, y su `provenance` sigue siendo
                     `SELF_REPORTED`. El dato de perfil de origen queda **sin modificar**.
NEGATIVE_ASSERTIONS  Responder **no** escribió en el perfil, no fusionó las dos estructuras y no convirtió la
                     respuesta en el dato de perfil ni al revés (REG-06-212). La referencia no da acceso al dato de
                     origen: quien lee la respuesta lee la respuesta.
AUTOMATION           **PARCIAL Y DECLARADO.** El circuito acepta y conserva `profileSourceRef` como referencia
                     opaca, y eso sí se ejecuta. Lo que **no** está automatizado —ni implementado— es la
                     verificación de que la referencia apunte a un dato propio del actor y de tipo compatible: hoy
                     se acepta cualquier referencia bien formada. Es una simplificación de P0 declarada en DL-095;
                     el resto del oráculo (no fusiona, no escribe el perfil, conserva SELF_REPORTED) sí se sostiene
                     estructuralmente, porque no existe ninguna ruta que escriba el perfil desde FRM-07.
ENVIRONMENT          CI, PostgreSQL 16 real
EVIDENCE_EXPECTED    Nota de alcance parcial en EVIDENCIA/WP-07/, con la referencia a DL-095
```

**Por qué se declara parcial en vez de recortar el oráculo.** El título del 11A dice lo que la prueba tiene que demostrar. Reescribirlo para que coincida con lo implementado sería acomodar la norma al código. Se deja el oráculo completo y se declara qué parte no se verifica todavía.

---

## TEST-FRM-005 — Un campo opcional sin responder no es un cero

```text
TEST_ID              TEST-FRM-005
TITLE                optional missing ≠ zero/default
LEVEL                Integración (API + PostgreSQL real) y dominio
PRIORITY             P0
SOURCES              09:1586-1587 («opcional omitido queda sin respuesta, nunca cero/default»)
                     REG-06-211 · INV-06-141 y REG-06-131 por homología (una ausencia no se convierte en un acto)
                     B10-10:36 (el faltante se muestra como faltante)
PRECONDITIONS        Las de TEST-FRM-003, con una Solicitud que pide dos campos y requiere uno solo.
SYNTHETIC_FIXTURE    Solicitud sobre FRM-SALUD que pide «condiciones declaradas» (requerido) y «dolor o lesiones»
                     (opcional). El asesorado responde solo el primero.
STEPS                1. Responder incluyendo **solo** el campo requerido (API-FRM-07).
                     2. Leer la respuesta (API-FRM-05).
                     3. En el contrato, intentar enviar el campo opcional con `value: null`.
                     4. Responder otra Solicitud enviando un texto donde la plantilla declara NUMBER.
EXPECTED             1 → **201**. 2 → el arreglo `answers` tiene **una** entrada: la del campo respondido. El
                     opcional **no aparece**, ni con `null`, ni con `0`, ni con cadena vacía. 3 → el schema
                     **rechaza** `value: null`: omitir es la única forma de no responder. 4 → **422
                     FORM_RESPONSE_INVALID**.
NEGATIVE_ASSERTIONS  Ninguna superficie muestra el campo omitido como «0», «—» interpretable como valor, ni como
                     incumplimiento. No hay porcentaje de completitud en ninguna pantalla ni en el copy, y una
                     prueba lo verifica sobre el texto.
AUTOMATION           packages/domain/src/contratos-wp07.test.ts («un campo opcional que no se responde se omite …:
                     el contrato no admite un value nulo como respuesta») · test/integration/contrato.int-spec.ts
                     (el 422 por tipo incorrecto sobre FRM-HABITOS, campo `horas_de_sueno`)
ENVIRONMENT          CI, PostgreSQL 16 real; dominio sin base (node:test)
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-07/resultados-integracion-*.md
```

**El detalle que hace la diferencia.** El contrato podría haber aceptado `value: null` y tratarlo como ausencia. No lo hace: `value` no es nullable. Así, un cliente que quiera «mandar vacío» no tiene cómo, y la ausencia solo puede expresarse omitiendo la entrada — que es exactamente lo que el 09 pide.

---

## TEST-FRM-006 — Rectificar crea una sucesora, no reemplaza

```text
TEST_ID              TEST-FRM-006
TITLE                rectification crea sucesora
LEVEL                Integración (API + PostgreSQL real), base de datos y dominio
PRIORITY             P0
SOURCES              09:1618 («crea respuesta sucesora; no overwrite; mantiene SELF_REPORTED»)
                     REG-06-14, REG-06-15, REG-06-16 (06 §4.7: el original queda intacto; cadena lineal; vista
                     efectiva por relación, nunca por fecha) · REG-06-211 (referencia a la versión anterior)
PRECONDITIONS        Las de TEST-FRM-003, con una Respuesta ya registrada en `v1`.
SYNTHETIC_FIXTURE    Respuesta original: «Sin condiciones». Rectificación: «Asma leve», con motivo «Corrijo un dato
                     mal tipeado».
STEPS                1. Rectificar con `expectedVersion: "v1"` (API-FRM-08).
                     2. Leer la respuesta completa (API-FRM-05).
                     3. Rectificar otra vez con `expectedVersion: "v1"` (desactualizada).
                     4. En la base, intentar un UPDATE sobre `respuesta_de_formulario`.
                     5. En la base, insertar dos rectificaciones con la misma predecesora.
EXPECTED             1 → **201** con `version: "v2"`. 2 → la lectura trae `original` **intacto**, el arreglo
                     `rectifications` con la nueva, y `effectiveView: {kind: "RECTIFIED", rectificationId}`. 3 →
                     **409 VERSION_CONFLICT**. 4 → la base rechaza el UPDATE (trigger `solo_agregar`). 5 → la base
                     rechaza la segunda (índice único parcial: una sola raíz, una sola sucesora).
NEGATIVE_ASSERTIONS  La respuesta original **sigue consultable** con su contenido y su fecha: rectificar no la
                     borra ni la edita. La vista efectiva se resuelve **por relación**, no por `momentoDeRegistro`:
                     una fila insertada con fecha posterior pero fuera de la cadena no se vuelve vigente.
                     Rectificar **no** restaura la lectura del profesional si el PDP ya no la permite.
AUTOMATION           test/integration/contrato.int-spec.ts (201 + 409 por versión vieja + 404 por actor ajeno) ·
                     packages/domain/src/contratos-wp07.test.ts (la cadena, con evaluarNuevaCorreccion y
                     resolverVistaEfectiva) · el smoke de base documentado en EVIDENCIA/WP-07/
ENVIRONMENT          CI, PostgreSQL 16 real; dominio sin base (node:test)
EVIDENCE_EXPECTED    Captura de la APK mostrando la respuesta original y su corrección, ambas visibles, en
                     EVIDENCIA/WP-07/
```

**Por qué la prueba mira la base y no solo la API.** El servicio podría resolver bien la cadena y, aun así, dejar la puerta abierta a que otro camino escriba una bifurcación. Los dos triggers y el índice único parcial son los que hacen que la garantía no dependa de que el servicio esté bien escrito.

---

## TEST-FRM-007 — Un profesional sin autorización actual no conserva lectura

```text
TEST_ID              TEST-FRM-007
TITLE                profesional sin autorización actual no conserva lectura
LEVEL                Integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              09:1543-1565 (proyección actor-scoped: si el profesional perdió autorización, 404; el
                     asesorado consulta lo propio «aunque el profesional ya no conserve lectura»)
                     09:1538 («No existe lectura residual por autoría») · REG-06-213 (06:8568-8580)
                     08 §14.1 (sin acceso posterior tras finalizar) · UC-I02 E03 (sin caché de decisiones)
PRECONDITIONS        Profesional con vínculo y B2 vigentes; una Solicitud creada y **respondida**.
SYNTHETIC_FIXTURE    La Solicitud de TEST-FRM-002 con la Respuesta de TEST-FRM-003.
STEPS                1. Leer la Solicitud y su respuesta como profesional (API-FRM-05): funciona.
                     2. El asesorado revoca el B2 del alcance (o se pausa el vínculo).
                     3. Releer como profesional (API-FRM-05) y listar (API-FRM-04).
                     4. Leer como asesorado (API-FRM-05) y listar las propias (API-FRM-06).
                     5. Leer como un tercer profesional, sin relación con el recurso.
EXPECTED             1 → **200** con la respuesta. 3 → **404 RESOURCE_NOT_FOUND** en el detalle, y la Solicitud
                     **deja de aparecer** en la lista, sin hueco ni marca. 4 → el asesorado **sigue viendo** su
                     Solicitud y su respuesta completas; en su lista, `respondable` es `false`. 5 → **404**.
NEGATIVE_ASSERTIONS  El 404 del paso 3 es **idéntico** al del paso 5 y al de un identificador inexistente: no dice
                     que el recurso existió, ni que la causa fue una revocación. La lista del paso 3 no muestra un
                     conteo, un «1 oculto» ni ninguna señal de que falte algo. Que el profesional haya **creado**
                     la Solicitud no le conserva ninguna lectura: no hay lectura residual por autoría.
AUTOMATION           test/integration/contrato.int-spec.ts (el 404 del actor ajeno sobre FRM-05 y FRM-07/08) ·
                     el corte por revocación se apoya en el PDP, ya cubierto por las pruebas de WP-03
                     (revocación → siguiente operación denegada) y por el `decidirEnTransaccion` que FRM-04/05
                     ejecutan en cada lectura, sin caché
ENVIRONMENT          CI, PostgreSQL 16 real
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-07/resultados-integracion-*.md
```

**La asimetría es el punto.** El mismo recurso responde 200 para una parte y 404 para la otra, y eso no es un bug: el titular conserva su historia (REG-06-213) y el profesional no conserva nada que la autorización de hoy no sostenga. Las dos mitades son la misma regla vista desde los dos lados, y por eso el oráculo las mira juntas.
