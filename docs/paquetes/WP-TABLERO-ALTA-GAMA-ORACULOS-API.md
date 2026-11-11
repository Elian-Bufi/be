# WP-TABLERO-ALTA-GAMA — los oráculos TEST-TAG de la rama de la API

> **Qué es esto.** Los oráculos de las partes de la etapa A que tocan la API (`WP-TABLERO-ALTA-GAMA.md` §8.1 y §10.2),
> con los trece campos de la §6 del 11A, como los de `WP-TABLERO-ALTA-GAMA-ORACULOS.md`. Esa colección vive en la rama
> del website (`wp-tablero-etapa-a`, #240) y todavía no está en `main`; para no pisarla, los de esta rama van acá. Cuando
> las dos ramas se unan, estos pasan a esa colección, con su número de siempre.
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`.
>
> **De dónde sale cada oráculo.** De DL-163 (`docs/DEUDA_LEGAJO.md`, D-6, D-13 ampliada y D-21), del paquete (§3, §4 y
> §6) y del 09 (v0.11 §14, la cola de revisiones). Un oráculo dice qué hay que observar para aceptar la prueba. No
> inventa la regla: la lee.
>
> **Estado.** Escritos: TEST-TAG-011 (TB-13), TEST-TAG-012 (TB-14), TEST-TAG-029 (TB-47) y, con D-13 ampliada por
> Dirección el 2026-11-07, TEST-TAG-037 (TB-52 y TB-55), TEST-TAG-038 (TB-53), la parte de la API de TEST-TAG-039 (TB-54,
> que es sobre todo del website) y TEST-TAG-040 (TB-56). Esos cuatro se escribieron antes del código (39f2e46); sus
> mutaciones del dominio se verificaron después. Los demás de la rama se escriben con su parte.

---

## TEST-TAG-011 — La divergencia y el seguimiento finalizado

```text
TEST_ID              TEST-TAG-011
TITLE                La cartera usa la definición de pendiente del dominio de revisión: una revisión aplicada como
                     «Mantener» sin fecha nueva no sigue como vencida, y un seguimiento finalizado no vuelve como
                     «Sin plan activo»
LEVEL                Unidad (las funciones puras del dominio) e integración con PostgreSQL (API-CAR-01 de punta a punta)
PRIORITY             P1 — si la cola de a una arrastra un renglón que ya se resolvió, nadie la vacía nunca (D-4 y D-6)
SOURCES              DL-163 D-6 («con la definición de pendiente del dominio de revisión»; «antes, la prueba de la
                     divergencia») · 09 v0.11 §14 («no crea una regla nueva de pendiente») · REG-06-150
                     (`revisionPendiente`) · REG-06-73 (FINALIZAR cierra el Proceso) · WP-TABLERO-ALTA-GAMA TB-13 ·
                     TA-56
PRECONDITIONS        Un profesional de Nutrición con tres personas con plan activado y revisión acordada el 15 ene;
                     uno de Entrenamiento con un plan activado y revisión acordada a 20 días.
SYNTHETIC_FIXTURE    Personas, vínculos, consentimientos, evaluaciones, objetivos y planes sintéticos de los soportes
                     de integración; revisiones con evidencia de la versión activada.
STEPS                1. Leer la cartera con la revisión vencida.
                     2. Registrar y aplicar «Mantener» sin fecha nueva; leer el contexto de revisión (API-NUT-17) y la
                        cartera.
                     3. En otra persona, aplicar «Mantener» con una fecha a tres días.
                     4. En otra, registrar «Mantener» sin aplicarlo.
                     5. En Entrenamiento, registrar y aplicar «Finalizar»; leer la cartera.
EXPECTED             1 → `REVIEW_OVERDUE`.
                     2 → el contexto dice `pendingReview: { pending: false }`, y la cartera no trae ningún pendiente
                        de revisión para esa persona.
                     3 → `REVIEW_DUE_SOON`: la fecha nueva manda.
                     4 → sigue `REVIEW_OVERDUE`: registrar no resuelve nada.
                     5 → la persona no aparece (ni `NO_ACTIVE_PLAN`), y la respuesta no tiene puntajes.
NEGATIVE_ASSERTIONS  La forma de API-CAR-01 no cambia: cada respuesta se valida con `CarteraResponseSchema`, estricto.
                     Mutaciones verificadas: sin mirar la aplicación posterior en `revisionEnLaCartera`, o sin mirar
                     el cierre por «Finalizar» en `sinPlanActivoEnLaCartera`, fallan las pruebas del dominio. La de
                     integración se corrió primero sola, contra la cartera de `main` (4507193): falló en los pasos 2 y
                     5, que es la divergencia que pedía probar TB-13; con el arreglo, pasa.
AUTOMATION           packages/domain/src/cola-de-revisiones.test.ts («TEST-TAG-011 · …», dos casos), en
                     `npm test -w @be/domain`; test/integration/cola-de-revisiones.int-spec.ts («TEST-TAG-011 · TB-13»,
                     dos casos), en el trabajo de integración de la CI
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers); el dominio, también local
EVIDENCE_EXPECTED    La corrida roja de 4507193 (las pruebas solas) y la verde del PR, con los resultados por ID de
                     prueba del trabajo de integración
```

---

## TEST-TAG-012 — La cola de revisiones, con sus dos estados

```text
TEST_ID              TEST-TAG-012
TITLE                API-DSH-02 trae «Próxima acción pendiente» primero y «Sin revisión acordada» último, con la
                     definición de pendiente del dominio de revisión; abrirla no resuelve nada; API-CAR-01 no cambia
LEVEL                Unidad (el motivo, el orden y los textos) e integración con PostgreSQL (API-DSH-02 de punta a punta)
PRIORITY             P1 — cierra el ciclo de la North Star: una revisión sin aplicar no cierra nada, y un plan activo
                     sin revisión acordada hoy sale de toda cola (D-6)
SOURCES              DL-163 D-6 · 09 v0.11 §14 (la ruta, `domain` y `status`, «abrir no resuelve») · B10-08 §6.3 (los
                     textos permitidos) · REG-06-150 · WP-TABLERO-ALTA-GAMA TB-14 y §4.1 · TA-57 a TA-60
PRECONDITIONS        Un profesional de Nutrición con seis personas: una revisión registrada sin aplicar; una revisión
                     acordada vencida; un plan activo sin revisión acordada; «Mantener» aplicado sin fecha sobre una
                     vencida; una revisión acordada a 30 días; y solo un borrador. Uno de Entrenamiento con un plan
                     activo sin fecha.
SYNTHETIC_FIXTURE    Los mismos soportes de integración que TEST-TAG-011.
STEPS                1. Leer la cola.
                     2. Contar las revisiones del profesional antes y después, y leerla otra vez.
                     3. Leer la cartera de las mismas personas.
                     4. Filtrar por `status` y por `domain`, y recorrer las páginas.
                     5. En Entrenamiento: leerla con el plan activo, con una revisión registrada y después de
                        «Finalizar».
                     6. Otro profesional, la persona, un consentimiento revocado, sin sesión y una query inválida.
EXPECTED             1 → `NEXT_ACTION_PENDING`, `REVIEW_DUE` y dos `ACTIVE_PLAN_WITHOUT_REVIEW`, en ese orden; la
                        revisión acordada a futuro y el borrador no están; cada ítem con su fecha, la fecha acordada que
                        sigue en pie (o `null`) y sus fuentes (la revisión y la versión del plan).
                     2 → ninguna revisión nueva, y la misma lista.
                     3 → la cartera sigue con `REVIEW_OVERDUE` donde corresponde, con su schema estricto.
                     4 → el filtro deja lo suyo; las páginas suman la misma lista, sin repetir.
                     5 → `ACTIVE_PLAN_WITHOUT_REVIEW`, después `NEXT_ACTION_PENDING` y después nada.
                     6 → listas vacías y sin el identificador de la persona; 401; 400 con `INVALID_REQUEST` o
                        `INVALID_CURSOR`.
NEGATIVE_ASSERTIONS  Ningún puntaje, porcentaje ni término que califique (PUNTAJE_PROHIBIDO; la prueba de términos de la
                     cartera sobre `TEXTO_DEL_MOTIVO`). Mutaciones verificadas en el dominio: sin el caso de la revisión
                     sin aplicar, o sin el de un plan sin ninguna revisión acordada, fallan sus casos.
AUTOMATION           packages/domain/src/cola-de-revisiones.test.ts («TEST-TAG-012 · …», cuatro casos, y TEST-TAG-031
                     sobre los textos); test/integration/cola-de-revisiones.int-spec.ts («TEST-TAG-012 · TB-14», tres
                     casos); test/integration/contrato.int-spec.ts (TEST-CT-DSH-02)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers); el dominio, también local
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR, con TEST-CT-DSH-02 entre las operaciones observadas
```

---

## TEST-TAG-029 — Una versión activada no se descarta nunca

```text
TEST_ID              TEST-TAG-029
TITLE                Descartar un borrador que nunca se activó deja evento y auditoría, lo deja fuera de toda lectura
                     y escritura, y libera «Empezar desde una plantilla» y la aplicación de una revisión; una versión
                     activada no se descarta nunca
LEVEL                Unidad (qué se descarta, la cadena sin lo descartado, la lectura que falla cerrado) e integración
                     con PostgreSQL (API-PLN-07 y API-PLE-05 de punta a punta, y las guardas de la base)
PRIORITY             P1 — un borrador viejo traba la aplicación de «Ajustar» o «Sustituir», y quien empezó desde cero no
                     puede pasar a una plantilla; descartar una activada le quitaría a la persona su plan (D-21)
SOURCES              DL-163 D-21 («solo un borrador que nunca se activó: una versión activada no se descarta nunca») ·
                     05 glosario («Borrador de plan»: no se presenta al asesorado como plan vigente) · 06 §10.7 y
                     06:4307 (INV-06-109) · 06 §4.4 (historia por adición) · REG-06-12 · UC-I06 E02 · WP-TABLERO-ALTA-GAMA
                     TB-47, §4.4, §4.5 y §5 · TA-63 a TA-69
PRECONDITIONS        Un profesional de Nutrición con una persona sin plan activado y un borrador; otra persona con un
                     plan activado, un borrador sucesor y una revisión «Ajustar» registrada; un profesional de
                     Entrenamiento con una persona y un borrador; un profesional sin vínculo con esas personas.
SYNTHETIC_FIXTURE    Personas, vínculos, consentimientos, evaluaciones, objetivos, planes y revisiones sintéticos de
                     los soportes de integración (soporte-nutricion.ts y soporte-entrenamiento.ts).
STEPS                1. Descartar el borrador del plan nunca activado; repetir con la misma clave, y con la misma clave
                        y otra versión esperada.
                     2. Leer la fila, el evento y la auditoría con Prisma.
                     3. Leer, listar (con y sin filtro), editar, validar, activar y volver a descartar la versión; usarla
                        como origen de «Guardar como plantilla».
                     4. Crear un borrador nuevo y activarlo.
                     5. En el plan activado: aplicar «Ajustar» con el borrador; descartarlo con una versión vieja, como
                        otro profesional y con un id inexistente; descartar la versión activada con su versión y con una
                        vieja.
                     6. Descartar el borrador y aplicar la misma revisión; leer la sucesora y la lectura de hoy de la
                        persona.
                     7. En Entrenamiento: descartar, leer (también API-SER-01), listar, activar y descartar otra vez;
                        crear un borrador nuevo, activarlo y descartarlo.
                     8. Por fuera de la API, con SQL: descartar una activada, descartar cambiando el contenido,
                        descartar sin el hecho, reabrir o activar una descartada, borrarla, y dos sucesoras vivas.
EXPECTED             1 → 200 con `{ data: { planId, discardedAt } }` (schema estricto); la repetición, la misma
                        respuesta; la otra versión esperada, 409 `IDEMPOTENCY_KEY_REUSED`.
                     2 → la fila sigue, DESCARTADA, con el mismo contenido, `version` + 1 y sin activación; un evento
                        `BorradorDePlanDescartado` (BORRADOR → DESCARTADA, con el profesional y el momento de
                        `discardedAt`); una auditoría EXITO de API-PLN-07.
                     3 → 404 `RESOURCE_NOT_FOUND` en cada lectura y escritura; la lista no la trae; como origen, el
                        mismo 422 que un origen inexistente (`TEMPLATE_ORIGIN_NOT_OWN`).
                     4 → 201 con `predecessorPlanId: null` (la raíz otra vez), la lista trae solo ese, y se activa.
                     5 → 422 `CONTINUITY_ACTION_NOT_APPLICABLE`; 409 `VERSION_CONFLICT`; 404 y 404; la activada,
                        422 `PLAN_NOT_EDITABLE` con «Esta versión ya se activó: no se descarta nunca.» las dos veces,
                        sigue ACTIVADA, y la persona la sigue viendo en API-NUT-14.
                     6 → la revisión se aplica (200) y crea la sucesora de la vigente; la persona sigue con el mismo
                        plan, y el borrador descartado tampoco existe para ella.
                     7 → lo mismo que 1 a 4, con `BorradorDePlanDeEntrenamientoDescartado`; la activada, 422.
                     8 → la base rechaza cada una («ACTIVADA es inmutable», «descartar no cambia el borrador», «no
                        registró su hecho», «DESCARTADA es terminal», «no se elimina», la clave única); una sola
                        sucesora viva entra.
NEGATIVE_ASSERTIONS  Ninguna respuesta trae puntajes ni términos que califiquen (PUNTAJE_PROHIBIDO). La máquina literal
                     del 06 no suma DESCARTADA. `lecturas-de-las-apk.int-spec.ts` sigue verde sin tocarlo (TEST-TAG-030).
                     Mutaciones verificadas en el dominio: dejar descartar una activada, sacar el filtro de lo
                     descartado de la cadena o leer una descartada como borrador hacen fallar sus casos.
AUTOMATION           packages/domain/src/descarte-de-borrador.test.ts («TEST-TAG-029 · …», cinco casos, y el de la
                     máquina literal), en `npm test -w @be/domain`; test/integration/descartar-borrador.int-spec.ts
                     (Nutrición, Entrenamiento y la base, cuatro casos); test/integration/contrato.int-spec.ts
                     (TEST-CT-PLN-07 y TEST-CT-PLE-05)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers); el dominio, también local
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR #243, con PLN-07 y PLE-05 entre las operaciones observadas de
                     TEST-CT
```

---

## TEST-TAG-037 — El plan del otro, solo con el permiso de la persona

```text
TEST_ID              TEST-TAG-037
TITLE                API-RES-06 devuelve el plan vigente de otra área solo si la persona se lo comparte a ese
                     profesional con el nivel «resumen y plan», la matriz tiene la fila y el PDP permite el par; si
                     falta cualquiera, el 404 de lo inexistente. Retirar o bajar corta en el momento sin pedir ningún
                     texto; dar un permiso nuevo o subir de nivel pide el texto vigente de ese nivel (uno por nivel,
                     decisión de Dirección del 2026-11-07); y cada lectura queda a la vista de la persona y de quien
                     lleva el área
LEVEL                Unidad (la matriz, los renglones de la autorización, lo avanzado por semana y los schemas) e
                     integración con PostgreSQL (API-RES-01 a 04, 06 y 07 de punta a punta, y las guardas de la base)
PRIORITY             P1 — muestra el plan completo de un área a otro profesional: un renglón de más es un dato de
                     salud que viaja sin permiso (08 §11-bis; D-13, ampliada)
SOURCES              DL-163 D-13, ampliada por Dirección el 2026-11-07 («el nutricionista debería poder ver el resumen
                     y hasta la planificación»; «Sí, plan completo de solo lectura»; «todos con todos, con permiso»;
                     y, el mismo día, «un texto distinto por nivel», que reemplaza TA-99 y ratifica TA-85) ·
                     WP-TABLERO-ALTA-GAMA TB-52 y TB-55, §3.1, §3.4, §4.3 (API-RES-01 a 04, 06 y 07), §9 · TA-85 a
                     TA-88, TA-92 y TA-93 · 08 C-11, C-12 (ampliar es una aceptación nueva), §11-bis, §12.2, §19.7 ·
                     RNF-PRI-002 · UC-I04 (la instantánea) · el mecanismo de DL-165 D-9 (API-HBT-03 a 05)
PRECONDITIONS        Una persona con A3; su nutricionista con un plan activado, su objetivo, una revisión registrada y
                     un borrador sucesor; su entrenador y su antropometrista, cada uno con el vínculo aceptado y el B2;
                     un profesional sin vínculo con ella.
SYNTHETIC_FIXTURE    Personas, vínculos, consentimientos, evaluaciones, objetivos, planes, registros de comida y
                     revisiones sintéticos de los soportes de integración (soporte-nutricion.ts, soporte-vinculo.ts).
STEPS                1. Sin autorización: el entrenador lee API-RES-04 y API-RES-06 de Nutrición; lo mismo con una
                        persona inexistente y como el profesional ajeno.
                     2. La persona comparte Nutrición con el entrenador en «resumen» (API-RES-02); él lee API-RES-06.
                     3. La persona sube a «resumen y plan» con un texto de «resumen y plan» que no es el vigente; sin
                        el texto de «resumen y plan» (solo con el de «resumen»); y con el vigente de «resumen y plan».
                        Antes, dar el permiso de «resumen» sin su texto.
                     4. El entrenador lee API-RES-04 y API-RES-06; la nutricionista, API-RES-07; la persona, API-RES-01.
                     5. La persona baja a «resumen» sin mandar ningún texto; el entrenador lee. Vuelve a subir, con el
                        texto de «resumen y plan»; retira todo (API-RES-03); el entrenador lee.
                     6. Con «resumen y plan» vigente: el vínculo del entrenador en pausa; reanudado; terminado.
                     7. Antropometría con «resumen y plan» en el PUT; API-RES-06 de ANTROPOMETRIA y de un área que no
                        existe.
                     8. Con SQL: modificar, borrar o truncar las tablas de la autorización (también la de los textos
                        aceptados); un renglón de Antropometría con el plan; un renglón de un área que el receptor ya
                        lleva; el texto de un nivel aceptado con el de otro; un renglón de «resumen y plan» sin su
                        texto aceptado en esa versión.
EXPECTED             1 → API-RES-04 trae la otra área con quién la lleva y `shared: null`; API-RES-06, 404
                        `RESOURCE_NOT_FOUND` con el mismo cuerpo que la persona inexistente y que el ajeno.
                     2 → 404, el mismo cuerpo: el nivel «resumen» no abre el plan.
                     3 → dar «resumen» sin su texto, 422 `SHARING_TEXT_REQUIRED` (`acceptedTexts.summary`); subir
                        con un texto viejo, 409 `CONSENT_VERSION_STALE`; sin el texto de «resumen y plan», 422
                        `SHARING_TEXT_REQUIRED` (`acceptedTexts.summaryAndPlan`), y nada cambia; con el vigente, 200,
                        con la versión siguiente y los dos textos aceptados en `acceptedTexts`. API-RES-01 trae los dos
                        textos, cada uno `PENDING_APPROVAL`: el de «resumen» es
                        `resumenes-compartidos-2026-11-propuesta-3`, que sucede a la 2 y no promete lo que no existe
                        («… que incluye también este resumen»).
                     4 → API-RES-06 trae la versión ACTIVADA vigente (su instantánea, `state: ACTIVATED`), el
                        objetivo vigente, el autor, `level: SUMMARY_AND_PLAN`, desde cuándo y lo avanzado (las semanas
                        de lunes a domingo desde la activación, con los registros sin anular); ningún id del borrador ni
                        de la revisión. API-RES-07 dice con quién, en qué nivel y desde cuándo. API-RES-01 trae la
                        lectura, con el entrenador, el área y la hora.
                     5 → bajar, 200 sin ningún texto ni el A3, y el entrenador recibe el 404 en la lectura siguiente;
                        retirar, lo mismo.
                     6 → en pausa y terminado, 404; reanudado, 200.
                     7 → 400 `INVALID_REQUEST` (Antropometría no tiene plan) y 404 en las dos lecturas.
                     8 → la base rechaza cada una («solo se agrega», «Antropometría no tiene plan», «el receptor no
                        lleva esa área», «el texto de su nivel», «sin el texto aceptado de su nivel»).
NEGATIVE_ASSERTIONS  El 404 de cada corte es idéntico al de lo inexistente. Ninguna respuesta trae puntajes, «%» ni
                     términos que califiquen (PUNTAJE_PROHIBIDO). Lo que leen las APK instaladas no cambia
                     (TEST-TAG-030). Mutaciones verificadas en el dominio (sobre `dist`, el 2026-11-07): sacar de la
                     matriz la exclusión del área que el receptor ya lleva (fallan dos casos), dejar que un renglón de
                     «resumen» cuente como «resumen y plan», no ver como ampliación una subida de nivel y contar lo
                     registrado antes de la activación hacen fallar sus casos; y, con los textos por nivel, dejar
                     subir a «resumen y plan» sin su texto, o pedir un texto para bajar. En integración, la mutación es no
                     exigir el nivel en API-RES-06 (el paso 2 daría 200): está escrita, no se corrió (la CI corre la
                     prueba sin mutar).
AUTOMATION           packages/domain/src/resumenes-compartidos.test.ts («TEST-TAG-037 · …»), en
                     `npm test -w @be/domain`; test/integration/resumenes-compartidos.int-spec.ts («TEST-TAG-037 · …»);
                     test/integration/contrato.int-spec.ts (TEST-CT de la familia RES)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers); el dominio, también local
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR #243, con los resultados por ID de prueba del trabajo de
                     integración y RES-01 a 04 y 06 a 10 entre las operaciones observadas de TEST-CT
```

---

## TEST-TAG-038 — Comentar no da escritura

```text
TEST_ID              TEST-TAG-038
TITLE                Una nota de coordinación puede citar la versión activada vigente del plan de otra área solo si el
                     autor la ve por API-RES-06 al escribirla; la cita no se lo abre a nadie, la nota no cambia el plan,
                     y la persona la lee con la forma de siempre
LEVEL                Integración con PostgreSQL (API-CRD-01 y API-CRD-01-PROPIA de punta a punta, y la guarda de la base)
PRIORITY             P1 — una cita que abriera el plan sería una autorización por la puerta de atrás (UC-E07); y lo que
                     lee la APK instalada no puede cambiar (DL-152)
SOURCES              DL-163 D-13, ampliada · DL-140 (CRD-D2, CRD-D5 ampliada, CRD-D6) · WP-TABLERO-ALTA-GAMA TB-53 y
                     §3.4 («Los comentarios») · TA-89 y TA-90 · UC-E07 («no existe chat general»; nombrar no da
                     acceso) · DL-152
PRECONDITIONS        La persona, la nutricionista con su plan activado, el entrenador y el antropometrista de
                     TEST-TAG-037; la persona le comparte Nutrición al entrenador con «resumen y plan» y nada al
                     antropometrista.
SYNTHETIC_FIXTURE    Los mismos soportes que TEST-TAG-037.
STEPS                1. El entrenador escribe, desde Entrenamiento, una nota a la nutricionista que cita la versión
                        vigente del plan de Nutrición.
                     2. Cita una versión que no es la vigente (un borrador) y otra que no existe.
                     3. El antropometrista escribe una nota que cita esa misma versión.
                     4. El antropometrista, destinatario de una nota con la cita, lee API-RES-06 de Nutrición.
                     5. Se leen la versión citada, el plan y su versión efectiva antes y después.
                     6. La persona lee sus notas con API-CRD-01-PROPIA y con el esquema de la APK instalada.
                     7. La persona baja a «resumen»; el entrenador vuelve a citar el plan.
                     8. Con SQL: una referencia al plan de otra área sin la autorización de la persona.
EXPECTED             1 → 201, con la referencia `NUTRITION_PLAN_VERSION` y su rótulo, como las de siempre.
                     2 → 422 `COORDINATION_REFERENCE_INVALID` con `REFERENCE_NOT_AVAILABLE`; no se registra nada.
                     3 → 422 con `REFERENCE_OUTSIDE_ORIGIN_SCOPE`: lo mismo que antes de TB-53 para quien no lo ve.
                     4 → 404: la cita no le abre el plan.
                     5 → la misma versión, el mismo estado y la misma versión efectiva: la nota no escribe en el plan.
                     6 → la nota está, con la misma forma de siempre (`ListaDeNotasPropiasResponseSchema` y el esquema
                        congelado de la APK).
                     7 → 422 con `REFERENCE_OUTSIDE_ORIGIN_SCOPE`: la regla se decide al escribir.
                     8 → la base la rechaza.
NEGATIVE_ASSERTIONS  API-CRD-01 no cambia de forma: el cuerpo que se acepta y la respuesta son los del 09. El texto de
                     la nota no llega a la novedad ni al aviso (CRD-D6). Mutación en integración: aceptar la cita sin
                     mirar la autorización (el paso 3 daría 201); escrita, no se corrió (la CI corre la prueba sin
                     mutar). El paso 8 prueba la guarda de la base por su cuenta.
AUTOMATION           test/integration/notas-de-coordinacion.int-spec.ts («TEST-TAG-038 · …»);
                     test/integration/lecturas-de-las-apk.int-spec.ts (la nota con la cita, leída por la APK)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR #243, con los dos casos por ID de prueba
```

---

## TEST-TAG-039 — El panel «Otras áreas» aparece solo con algo compartido (la parte de la API)

```text
TEST_ID              TEST-TAG-039
TITLE                Lo que el panel lee de la API no revela nada sin algo compartido: API-RES-04 dice quién lleva cada
                     otra área (lo que ya dice API-CRD-01-LISTA) y si se puede pedir, sin decir si hay un plan
LEVEL                Integración con PostgreSQL (API-RES-04). El resto del oráculo es del website (#240): el panel, su
                     lectura al abrirlo y lo avanzado en cifras
PRIORITY             P2 — la API ya corta con el 404; lo que queda es no insinuar lo que no se comparte
SOURCES              DL-163 D-13, ampliada · WP-TABLERO-ALTA-GAMA TB-54 y §3.4 · TA-91 y TA-95 · 08 §11-bis.7 (sin
                     candado ni aviso de lo que no se comparte)
PRECONDITIONS        Las de TEST-TAG-037, y una persona sin nutricionista con su entrenador.
SYNTHETIC_FIXTURE    Los mismos soportes que TEST-TAG-037.
STEPS                1. El entrenador lee API-RES-04 de la persona con nutricionista y sin nada compartido, antes y
                        después de que la nutricionista active un plan.
                     2. Lee API-RES-04 de la persona sin nutricionista.
EXPECTED             1 → la misma respuesta las dos veces: `shared: null` y `canRequestPlan: true`. Que haya o no un
                        plan no cambia nada.
                     2 → Nutrición con `professional: null` y `canRequestPlan: false`.
NEGATIVE_ASSERTIONS  Ningún campo de API-RES-04 depende de que exista un plan. Lo del website (no hay panel, candado
                     ni aviso sin nada compartido; abrir el editor no suma peticiones) lo prueba #240.
AUTOMATION           test/integration/resumenes-compartidos.int-spec.ts («TEST-TAG-039 · …»)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers)
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR #243
```

---

## TEST-TAG-040 — Pedir no concede nada

```text
TEST_ID              TEST-TAG-040
TITLE                Pedir ver el plan de otra área (API-RES-08) no abre nada hasta que la persona dice que sí: uno por
                     vez, otro recién a los 7 días, «No, por ahora» no comparte, compartir desde «Quién ve qué» acepta
                     el que esperaba, y la novedad no lleva nada del plan
LEVEL                Unidad (el límite, el texto de la novedad, su importancia y el aviso genérico) e integración con
                     PostgreSQL (API-RES-08 a 10 de punta a punta, la novedad y las guardas de la base)
PRIORITY             P1 — un pedido que concediera algo, o que se repitiera sin límite, deja de ser una decisión de la
                     persona (TA-95)
SOURCES              DL-163 D-13, ampliada · TA-95, decidida por Dirección el 2026-11-07 («sí, como en los hábitos») ·
                     WP-TABLERO-ALTA-GAMA TB-56 y §4.3 (API-RES-08 a 10) · el mecanismo de DL-165 D-17, D-23 a D-25
                     (API-HBT-06, 08 y 09) · DL-133 (el aviso sin contenido) · 08 C-12
PRECONDITIONS        La persona, la nutricionista con su plan activado y el entrenador de TEST-TAG-037, sin nada
                     compartido; un antropometrista; una persona sin A3.
SYNTHETIC_FIXTURE    Los mismos soportes que TEST-TAG-037; un pedido viejo escrito directo en la base para los 7 días.
STEPS                1. El entrenador pide ver el plan de Nutrición desde Entrenamiento; repite con la misma clave; pide
                        de nuevo; pide desde un área que no lleva y para una persona inexistente.
                     2. Lee API-RES-06 de Nutrición y API-RES-04.
                     3. La persona lee sus novedades y API-RES-09.
                     4. La persona responde «No, por ahora»; el entrenador lee API-RES-06 y API-RES-04.
                     5. Un pedido de hace 8 días, escrito en la base: el entrenador vuelve a pedir; la persona responde
                        «Sí, que lo vea» con un texto viejo y con el vigente.
                     6. El antropometrista pide; la persona le comparte con API-RES-02 («Quién ve qué»).
                     7. Con el vínculo del que pide en pausa: pedir, y lo que lista API-RES-09; terminado: lo que lista
                        y «Sí».
                     8. Con SQL: dos pendientes del mismo profesional, persona y área; reabrir uno resuelto; borrarlo.
EXPECTED             1 → 201 con `status: PENDING`; la repetición, la misma respuesta; de nuevo, 422
                        `PLAN_ACCESS_REQUEST_TOO_SOON` con `availableFrom` a los 7 días; el área ajena y la persona
                        inexistente, 404.
                     2 → 404 en API-RES-06; API-RES-04 con el pedido `PENDING` y `canRequestPlan: false`.
                     3 → una novedad `PLAN_ACCESS_REQUESTED`, importante (`esNovedadImportante`), que dice quién pide,
                        desde qué área y qué plan, y que es su decisión, sin nada del plan; vista `NEWS`. API-RES-09 la
                        trae con su versión.
                     4 → 200 `NOT_NOW`; la autorización no cambia (sigue sin darla) y API-RES-06 sigue en 404; el
                        pedido queda `ANSWERED`.
                     5 → el pedido viejo queda REEMPLAZADO por el nuevo; el texto viejo, 409 `CONSENT_VERSION_STALE`;
                        el vigente, 200 `SHARE`, y API-RES-06 da 200.
                     6 → compartir con «resumen y plan» deja su pedido ACEPTADO, y deja de listarse.
                     7 → en pausa, pedir es 404 y el pedido que esperaba no se lista; terminado, no se lista y «Sí» es
                        422 `SUMMARY_RECIPIENT_NOT_AVAILABLE`.
                     8 → la base rechaza cada una.
NEGATIVE_ASSERTIONS  La novedad no trae nada del plan (ni ids de versión ni contenido) y el aviso push es el genérico de
                     siempre (`textoDelAvisoPush`). Mutaciones verificadas en el dominio (sobre `dist`, el 2026-11-07):
                     contar los 7 días desde ahora y no desde el último pedido, dejar pedir a quien ya lo ve y sacar
                     el tipo de `TIPOS_DE_NOVEDAD_IMPORTANTES` hacen fallar sus casos.
AUTOMATION           packages/domain/src/resumenes-compartidos.test.ts («TEST-TAG-040 · …»);
                     test/integration/resumenes-compartidos.int-spec.ts («TEST-TAG-040 · …»);
                     test/integration/contrato.int-spec.ts (TEST-CT de la familia RES)
ENVIRONMENT          CI (PostgreSQL 16 en Testcontainers); el dominio, también local
EVIDENCE_EXPECTED    La corrida verde de la CI en el PR #243, con los resultados por ID de prueba
```
