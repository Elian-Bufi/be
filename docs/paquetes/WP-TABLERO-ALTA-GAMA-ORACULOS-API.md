# WP-TABLERO-ALTA-GAMA — los oráculos TEST-TAG de la rama de la API

> **Qué es esto.** Los oráculos de las partes de la etapa A que tocan la API (`WP-TABLERO-ALTA-GAMA.md` §8.1 y §10.2),
> con los trece campos de la §6 del 11A, como los de `WP-TABLERO-ALTA-GAMA-ORACULOS.md`. Esa colección vive en la rama
> del website (`wp-tablero-etapa-a`, #240) y todavía no está en `main`; para no pisarla, los de esta rama van acá. Cuando
> las dos ramas se unan, estos pasan a esa colección, con su número de siempre.
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`.
>
> **De dónde sale cada oráculo.** De DL-163 (`docs/DEUDA_LEGAJO.md`, D-6 y D-21), del paquete (§3, §4 y §6) y del 09
> (v0.11 §14, la cola de revisiones). Un oráculo dice qué hay que observar para aceptar la prueba. No inventa la regla:
> la lee.
>
> **Estado.** Escritos: TEST-TAG-011 (TB-13), TEST-TAG-012 (TB-14) y TEST-TAG-029 (TB-47). Los demás de la rama se
> escriben con su parte.

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
