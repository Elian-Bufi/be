# WP-06 — los seis oráculos TEST-TRN que el 11A dejó sin escribir

> **Qué es esto.** El 11A enuncia los seis escenarios de entrenamiento como **títulos de una línea** (11A:565-570), sin ninguno de los trece campos que su propia §6 declara obligatorios (11A:150-169). No es un hueco de entrenamiento: la §6 no se aplicó a ningún TEST de módulo —tampoco a nutrición ni a antropometría—, y el DoD del 11A no lo detecta (DL-075).
>
> **Autorización.** D-D de `docs/paquetes/WP-06.md`, decidida por Dirección el 2026-09-21: se escriben los seis, con la plantilla de 11A §6, como entregable de legajo del paquete. Es el mismo criterio de oráculo derivado de WP-05 (DL-065) y de WP-02/03 (DL-027).
>
> **Qué no es esto.** No modifica el 11A, que está protegido por `docs/MANIFEST.sha256`. Cuando Dirección quiera consolidar, toma estos seis y reemite el documento.
>
> **De dónde sale cada oráculo.** De la norma que el título cita o implica, con referencia `archivo:línea`. Un oráculo derivado dice qué hay que observar para aceptar la prueba; no inventa la regla, la lee.
>
> **Estado de la automatización.** Se completa por tramos, como el paquete. Donde una parte todavía no está escrita, el campo lo dice con la palabra **pendiente** y el tramo que la cubre; al cerrar WP-06 no puede quedar ninguna.

---

## TEST-TRN-001 — Lo planificado y lo ejecutado son dos estructuras distintas

```text
TEST_ID              TEST-TRN-001
TITLE                planned ≠ executed
LEVEL                Integración (API + PostgreSQL real) y base de datos
PRIORITY             P0
SOURCES              06 §11 · REG-06-113 (prescripción ≠ ejecución real: registrar no modifica la prescripción ni
                     la instantánea) · INV-06-120 · REG-06-105 (la ejecución cuelga de la versión activada)
                     B10-10:53 (invariante «prescripto ≠ registrado») · 09v10:1132 («El snapshot del plan no cambia»)
PRECONDITIONS        Profesional con Entrenamiento verificado y habilitado; vínculo aceptado; B2 del alcance y A3
                     vigentes. Un plan activado con dos sesiones.
SYNTHETIC_FIXTURE    Sesión A: press de banca 3 × 8 con RIR 2 y carga sugerida de 60 kg; sentadilla 2 × 6-8 al 75 %
                     de 1RM. El asesorado registra press de banca con 80 kg, 7 repeticiones y RIR 1.
STEPS                1. Leer la versión activada (API-TRN-09) y guardar la respuesta completa.
                     2. Abrir el borrador de la ocurrencia, registrar las series y confirmar (API-TRN-15, 17, 18).
                     3. Releer la versión activada.
                     4. Leer la ejecución registrada (API-TRN-19).
EXPECTED             La versión activada releída es **idéntica** a la del paso 1, incluida la huella de la
                     instantánea. La ejecución trae, por separado, la sesión planificada tal como estaba en la
                     instantánea (`plannedSession`) y lo registrado (`original`), con sus propios valores.
NEGATIVE_ASSERTIONS  Registrar 80 kg no cambia la carga sugerida de 60 kg ni el criterio de la prescripción. La
                     ejecución no es un campo del plan ni el plan un campo de la ejecución. No aparece ningún
                     «cumplimiento», porcentaje ni diferencia calculada entre lo prescripto y lo registrado.
AUTOMATION           test/integration/entrenamiento.int-spec.ts («REG-06-130 · la sustitución…», que compara el
                     plan antes y después) · test/integration/maquinas-wp06.int-spec.ts (INV-06-121: la base no
                     admite ejecución contra un plan en borrador)
ENVIRONMENT          CI, PostgreSQL 16 real; y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md
```

**Por qué el oráculo compara el plan entero.** Una implementación que «anota» el registro dentro del plan puede dejar intactos los campos que la prueba mira y cambiar otro. Comparar la respuesta completa, huella incluida, es lo único que demuestra que registrar no escribió nada del lado de lo planificado.

---

## TEST-TRN-002 — El borrador de ejecución no es un registro definitivo

```text
TEST_ID              TEST-TRN-002
TITLE                execution draft ≠ registro definitivo
LEVEL                Integración (API + PostgreSQL real), base de datos y dominio
PRIORITY             P0
SOURCES              06:5217-5221 (BORRADOR → REGISTRADA, sin vuelta) · 09v10:975-982 («Borrador ≠ evidence
                     ≠ registered execution») · 09v10:1136-1167 (confirmar crea el original inmutable)
                     B10-06:848-864 (el borrador deja de ser editable como borrador) · DL-088 (solo lo ve el titular)
PRECONDITIONS        Las de TEST-TRN-001, con un borrador abierto y una serie cargada.
SYNTHETIC_FIXTURE    Borrador de la sesión A con una serie de press de banca: 60 kg × 8, RIR 2.
STEPS                1. Consultar el borrador como asesorado (API-TRN-16) y como profesional.
                     2. Confirmarlo (API-TRN-18).
                     3. Intentar editarlo otra vez (API-TRN-17).
                     4. Abrir de nuevo el borrador de la misma ocurrencia (API-TRN-15).
                     5. En la base, intentar un UPDATE directo sobre el borrador confirmado.
EXPECTED             El asesorado ve su borrador; el profesional recibe **404**, idéntico al de un borrador
                     inexistente. Confirmar responde 201 con un `executionId` **distinto** del `draftId`: es un
                     recurso nuevo. Editar después es 422 INVALID_STATE_TRANSITION. Abrir otra vez devuelve el
                     mismo borrador con `state: REGISTERED` y el `executionId`. La base rechaza el UPDATE.
NEGATIVE_ASSERTIONS  No hay transición de REGISTRADA a BORRADOR, ni por la API ni por la base. Un borrador no
                     aparece en el contexto de revisión ni como ejecución registrada. Un segundo «Comenzar» no
                     crea otro borrador: diez simultáneos dejan uno solo.
AUTOMATION           test/integration/entrenamiento.int-spec.ts («06:5221 · confirmado, el borrador no se edita»,
                     «09v10:980 · el borrador no es evidencia», «S10-TRN-01 · diez “Comenzar” simultáneos»)
                     test/integration/maquinas-wp06.int-spec.ts («06:5221 · un borrador confirmado no se edita»)
                     packages/domain/src/dominio-wp06.test.ts («TEST-TRN-002 · la ejecución registrada es terminal»)
                     test/integration/entrenamiento.int-spec.ts («TEST-RF-045 · reúne objetivo, plan y ejecuciones
                     registradas…», que abre un borrador y verifica que el contexto de revisión no lo trae; y
                     «REG-06-141 · … un borrador no son evidencia», que lo rechaza como evidencia de una revisión)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md
```

**Por qué el profesional recibe 404 y no 403.** Un 403 le confirmaría que el borrador existe. El borrador es un trabajo en curso del asesorado, no evidencia: para el profesional no existe hasta que se confirma (09v10:980), y la precedencia de revelabilidad del consolidado exige que la respuesta sea la misma que para lo inexistente (CONS v0.16.1:213-234).

---

## TEST-TRN-003 — La sustitución preserva lo prescripto y lo realizado

```text
TEST_ID              TEST-TRN-003
TITLE                sustitución preserva prescripto + realizado
LEVEL                Integración (API + PostgreSQL real) y dominio
PRIORITY             P0
SOURCES              06 · REG-06-130 (se conservan la prescripción, lo realizado y la referencia; «no se clasifica
                     por sí misma como error ni modifica snapshot/Prescripción») · INV-06-140
                     09v10:1105-1132 · B10-06:752-781 · S10-TRN-04
PRECONDITIONS        Las de TEST-TRN-001.
SYNTHETIC_FIXTURE    Prescripto: press de banca. Realizado: press con mancuernas, 22 kg × 8.
STEPS                1. Registrar la prescripción de press de banca con `performedExerciseVersionId` de press con
                     mancuernas, y confirmar.
                     2. Leer la ejecución (API-TRN-19).
                     3. Releer el plan activado.
EXPECTED             El ejercicio registrado trae **las dos puntas y la referencia**: `prescriptionId`, el ejercicio
                     prescripto con su nombre de la instantánea («Press de banca»), el realizado con el suyo
                     («Press con mancuernas») y `substituted: true`. El plan releído es idéntico al anterior.
NEGATIVE_ASSERTIONS  La sustitución no produce un error, una advertencia ni un «desvío» automático: la condición
                     de la sesión es la que el asesorado declaró. No se pierde el prescripto, y el plan no pasa a
                     prescribir press con mancuernas.
AUTOMATION           test/integration/entrenamiento.int-spec.ts («REG-06-130 · la sustitución conserva…»)
                     packages/domain/src/contratos-wp06.test.ts («REG-06-130 · la sustitución es legítima…»)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md · captura de la APK con
                     «Prescripto / Realizado» (pendiente, tramo de la APK)
```

**Por qué `substituted` no es un error.** El 06 lo dice dos veces: la sustitución es legítima (09v10:1119) y no se clasifica por sí misma como error (REG-06-130). El campo existe para que la pantalla pueda mostrar las dos puntas; no para que alguien cuente sustituciones como falla.

---

## TEST-TRN-004 — Sin registro no es «no realizado»

```text
TEST_ID              TEST-TRN-004
TITLE                sin registro ≠ no realizado
LEVEL                Dominio, integración (API + PostgreSQL real) y prueba estructural de pantallas
PRIORITY             P0
SOURCES              06 · REG-06-131 («NO_REALIZADA con motivo es evidencia registrada distinta de sesión sin
                     registro; B-08 no infiere condición cuando no existe registro») · INV-06-141
                     09v10:903-915 y H-09-TRN-01 · B10-06:626-640, 794-796 · B10-10:461 · S10-TRN-03
PRECONDITIONS        Un plan activado con dos sesiones; ninguna registrada.
SYNTHETIC_FIXTURE    Sesión A sin ningún registro. Sesión B registrada por el asesorado como «No pude realizarla»,
                     sin motivo.
STEPS                1. Leer «Hoy» sin haber registrado nada (API-TRN-14).
                     2. Registrar la sesión B como NOT_COMPLETED y confirmar.
                     3. Releer «Hoy».
                     4. Revisar las pantallas del website y la APK que muestran una sesión sin registro.
EXPECTED             En el paso 1 las dos ocurrencias están en NOT_STARTED, sin condición. En el paso 3, la A
                     sigue NOT_STARTED y la B está REGISTERED con `sessionCondition: NOT_COMPLETED`. La sesión
                     sin registro se muestra como «Sin registro» (o «No iniciada» si es de hoy).
NEGATIVE_ASSERTIONS  Ninguna respuesta contiene NOT_COMPLETED para una sesión que nadie registró. El paso del
                     tiempo no convierte la A en no realizada. La B no exige motivo ni granularidad. Ninguna
                     pantalla deriva «No realizada» de la ausencia de registro, ni muestra un porcentaje.
AUTOMATION           packages/domain/src/dominio-wp06.test.ts (`vistaDeSesion`: SIN_REGISTRO es un valor distinto)
                     test/integration/entrenamiento.int-spec.ts («H-09-TRN-01 · sin registro no es “no realizada”»,
                     «REG-06-131/132 · “No pude realizarla” se confirma sin granularidad»)
                     test/integration/maquinas-wp06.int-spec.ts (el CHECK de granularidad según condición)
                     Guardia estructural de pantallas (§9.2 de WP-06.md): **pendiente**, tramos del website y la APK
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md · capturas del website y la
                     APK con una sesión «Sin registro» (pendiente)
```

**Por qué hace falta una guardia estructural y no alcanza la lista de términos prohibidos.** «No realizada» es copy **legítimo** cuando viene de un acto del asesorado y prohibido cuando se deriva de la ausencia. La misma cadena, las dos cosas. Una lista negra no puede distinguirlas: la guardia verifica en el código de la pantalla que el estado sin registro renderiza el texto de «sin registro», y nunca el de «no realizada».

---

## TEST-TRN-005 — Corrección trazable

```text
TEST_ID              TEST-TRN-005
TITLE                corrección trazable
LEVEL                Integración (API + PostgreSQL real) y base de datos
PRIORITY             P0
SOURCES              06 · REG-06-116 (una ejecución registrada no se edita; se corrige por B-06) · REG-06-14, 15,
                     16 · INV-06-124, 125 · 09v10:1221-1257 · UC-E02 (05:9174-9224, V02: autoría real)
                     B10-06:868-898 · S10-TRN-05 · DL-076 (el asesorado y su profesional corrigen)
PRECONDITIONS        Una ejecución registrada por el asesorado: press de banca, 80 kg × 8.
SYNTHETIC_FIXTURE    Corrección del asesorado a 60 kg con motivo «Cargué mal la carga.»; después, corrección del
                     profesional a 65 kg.
STEPS                1. El asesorado corrige (API-TRN-20).
                     2. El profesional corrige sobre la anterior.
                     3. Leer la ejecución (API-TRN-19).
                     4. En la base, intentar un UPDATE sobre la ejecución y una segunda corrección raíz.
EXPECTED             El original sigue diciendo 80 kg. Hay dos correcciones en cadena lineal: la segunda apunta a
                     la primera. La vista efectiva es la segunda. Cada corrección conserva su motivo y su autor
                     real: la primera ADVISEE, la segunda PROFESSIONAL. La base rechaza los dos intentos del
                     paso 4.
NEGATIVE_ASSERTIONS  El original no se sobrescribe. La corrección del profesional no se atribuye al asesorado.
                     La vista efectiva no se resuelve por la fecha más reciente sino por la relación. Una
                     corrección sin motivo no se acepta. Otro profesional del mismo asesorado recibe 404.
AUTOMATION           test/integration/entrenamiento.int-spec.ts («S10-TRN-05 · corregir no sobrescribe», «DL-076 ·
                     el profesional también corrige», «otro profesional no ve ni corrige»)
                     test/integration/maquinas-wp06.int-spec.ts («INV-06-124», «REG-06-116 · la cadena no se bifurca»)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md · captura de «Registro original /
                     Corrección vigente / Historial de correcciones» (pendiente, tramo de la APK)
```

**Por qué dos autores distintos en la misma prueba.** El 05 deja abierto quién corrige (05:9318-9319) y el 08 no lo resuelve (DL-076). Si solo corrige el asesorado, nunca se prueba lo que la variante V02 exige: que el dato corregido por el profesional no quede atribuido a quien no lo escribió.

---

## TEST-TRN-006 — RIR y %RM conservan la semántica declarada

```text
TEST_ID              TEST-TRN-006
TITLE                RIR/%RM conserva semántica declarada
LEVEL                Dominio e integración (API + PostgreSQL real)
PRIORITY             P0
SOURCES              06 · REG-06-128 (exactamente uno de PORCENTAJE_RM o RIR, **cuando se declara**) · REG-06-129
                     (esfuerzo percibido y carga absoluta no son criterio; sin fórmula de RM ni conversión)
                     INV-06-138, 139 · 09v10:344-394, 1588-1591 · H-09-TRN-02 · B10-06:398-477 · DL-088 (rangos)
PRECONDITIONS        Un borrador de plan del profesional.
SYNTHETIC_FIXTURE    Press de banca con RIR 2 y carga sugerida 60 kg; sentadilla al 75 % con referencia «1RM
                     estimado por el profesional»; dominadas sin criterio. Intentos inválidos: RPE 8, «PERCENT_RM+RIR»,
                     %RM 180, RIR −1.
STEPS                1. Guardar la estructura válida, validar y activar.
                     2. Leer la versión activada.
                     3. Intentar guardar cada criterio inválido en un borrador.
EXPECTED             La versión activada conserva, para cada prescripción, el criterio exacto, el valor y la
                     referencia tal como se declararon, y la carga sugerida **aparte**. Las dominadas quedan sin
                     criterio y el plan valida igual. RPE es 422 INTENSITY_CRITERION_INVALID con motivo
                     PERCEIVED_EXERTION_AS_CRITERION; los dos criterios juntos, INTENSITY_CRITERIA_COMBINED; los
                     valores sin significado, INTENSITY_TARGET_OUT_OF_RANGE.
NEGATIVE_ASSERTIONS  No aparece un tercer criterio. La carga sugerida no se convierte en criterio ni se muestra
                     como «intensidad». No se calcula un %RM a partir de un RIR ni al revés, ni se estima una
                     repetición máxima. La falta de criterio no es un problema de validación.
AUTOMATION           packages/domain/src/contratos-wp06.test.ts (intensidad: «REG-06-128», «REG-06-129», «09v10:371»,
                     «09v10:391», «DL-088 · el objetivo de intensidad tiene rango de significado»)
                     test/integration/entrenamiento.int-spec.ts («REG-06-129 · RPE no es criterio…», «REG-06-128 ·
                     validar no exige criterio…») · test/integration/contrato.int-spec.ts (tramo 2)
ENVIRONMENT          CI y en vivo contra `test`
EVIDENCE_EXPECTED    Fila del caso en EVIDENCIA/WP-06/resultados-integracion-*.md · captura del editor con el
                     criterio y la carga sugerida separados (pendiente, tramo del website)
```

**Por qué el rango no es un valor prescripto.** El 06 no fija el valor concreto (06:5418) y el oráculo tampoco. Pero un «180 % de la repetición máxima» o «−1 repeticiones en reserva» no son una decisión profesional distinta: no significan nada. El rango descarta lo que no tiene significado y deja todo lo demás al profesional (DL-088).
