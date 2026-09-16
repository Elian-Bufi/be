# BE-LEG-09 v0.10 — Contratos P0 de Entrenamiento

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09`  
> **Versión:** `v0.10 — CONTRATOS P0 DE ENTRENAMIENTO`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PENDIENTE DE CONTRARREVISIÓN`  
> **Consume:** v0.7 contrato transversal + v0.8 acceso/gobierno + v0.9 patrón vertical aplicado + BE-LEG-05/06/07/08  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Definir el contrato P0 completo del circuito de Entrenamiento:

```text
evaluación
→ objetivo profesional versionado
→ borrador de plan
→ validación
→ activación
→ versión vigente + instantánea reproducible
→ ocurrencias/sesiones planificadas
→ borrador incremental de ejecución
→ confirmación
→ ejecución real inmutable
→ corrección trazable
→ revisión profesional válida
→ continuidad/progresión/cierre
```

Entrenamiento reutiliza el mismo patrón común de Nutrición para:

- evaluación;
- objetivo;
- catálogo;
- plan;
- versión;
- validación;
- activación;
- instantánea;
- proceso;
- revisión;
- continuidad.

Solo se especializan las diferencias reales del dominio.

---

# 1. Fuentes y reglas consumidas

## 1.1 Casos de uso

P0:

- `UC-P14` — evaluación + objetivo;
- `UC-P15` — catálogo + diseño de plan;
- `UC-P16` — validar + activar;
- `UC-P17` — consultar y registrar ejecución;
- `UC-P18` — revisar y decidir continuidad;
- `UC-E02` — corrección trazable;
- `UC-I05` — revisión profesional válida;
- `UC-I06` — continuidad/cierre;
- `UC-I07/I08` — importación/fallback;
- `UC-I12` — corrección;
- `UC-I02/I03` — autorización/auditoría.

RF principales:

```text
RF-036…RF-046
RF-064
```

---

## 1.2 Dominio obligatorio de 06

Se consumen sin redefinir:

```text
Evaluación de entrenamiento
Objetivo de entrenamiento versionado
Catálogo propio
Plan / Versión
BORRADOR → ACTIVADA
Instantánea reproducible
Bloque
Microciclo opcional
Sesión planificada
Prescripción de ejercicio
Criterio de intensidad: PORCENTAJE_RM | RIR
Ejecución real
BORRADOR → REGISTRADA
Sustitución de ejercicio
Condición de sesión
Granularidad de registro
Corrección trazable
Progresión → AJUSTAR/SUSTITUIR
Zona muscular
Relación Ejercicio–Zona
Serie ejecutada estructurada
```

---

# 2. Principios contractuales específicos

## CAND-09-TRN-A — Entrenamiento reutiliza el patrón vertical común

No se crea una API paralela conceptual para:

- versionado;
- activación;
- revisión;
- continuidad;
- concurrencia;
- idempotencia.

La diferencia vive en los schemas del dominio.

**Recomendación:** ratificar.

---

## CAND-09-TRN-B — Criterio técnico de intensidad

El contrato técnico representa exactamente:

```text
PERCENT_RM
RIR
```

Mapeo:

```text
PERCENT_RM ↔ PORCENTAJE_RM
RIR        ↔ RIR
```

No existe un tercer criterio.

`perceivedExertion`:

- solo ejecución;
- opcional;
- nunca prescripción.

**Recomendación:** aprobar naming técnico `PERCENT_RM`.

---

## CAND-09-TRN-C — Granularidad de ejecución explícita

Shape técnico propuesto:

```text
SET
EXERCISE_OR_SESSION
```

No se fuerza una descomposición retrospectiva.

Si se registró a nivel agregado:

```text
no se inventan series
no se inventan cargas
no se inventan RIR
no se inventan repeticiones
```

**Recomendación:** aprobar esta representación binaria porque refleja literalmente la taxonomía de 06: “por serie” o “por ejercicio/sesión”.

---

# 3. `TrainingEvaluation`

```json
{
  "evaluationId": "teval_...",
  "version": "v_...",
  "adviseeId": "adv_...",
  "professionalId": "pro_...",
  "occurredAt": "...",
  "recordedAt": "...",
  "context": {},
  "evidence": [],
  "assessment": {},
  "professionalNotes": "..."
}
```

### Reglas

- evidencia ≠ ejecución;
- autoría y procedencia preservadas;
- doble temporalidad;
- contenido profesional no fijado por 09;
- la response se proyecta según pertinencia.

---

# 4. `TrainingObjectiveVersion`

```json
{
  "objectiveId": "tobj_...",
  "versionId": "tobjv_...",
  "adviseeId": "adv_...",
  "evaluationId": "teval_...",
  "effectiveFrom": "...",
  "effectiveUntil": null,
  "objective": {},
  "rationale": "...",
  "authoredBy": "pro_...",
  "createdAt": "..."
}
```

### Reglas

- decisión profesional;
- nueva versión, nunca overwrite;
- el contenido concreto del objetivo no se fija en 09;
- la versión efectiva se determina por relaciones/reglas del 06, no por “última fecha”.

---

# 5. Plan de entrenamiento

## 5.1 `TrainingPlanDraft`

```json
{
  "planId": "tplan_...",
  "version": "v_...",
  "state": "DRAFT",
  "adviseeId": "adv_...",
  "objectiveVersionId": "tobjv_...",
  "blocks": []
}
```

---

## 5.2 Jerarquía contractual

```text
Plan version
→ Block [1..N]
→ Microcycle [0..N / opcional]
→ Planned session [1..N]
→ Exercise prescription [1..N]
```

Un plan simple puede omitir `microcycles`.

No se inventa un microciclo vacío para cumplir shape.

---

## 5.3 `TrainingBlock`

```json
{
  "blockId": "blk_...",
  "label": "...",
  "order": 1,
  "purpose": "texto libre profesional",
  "microcycles": [],
  "sessions": []
}
```

### Regla

Cuando existen microciclos, las sesiones se organizan bajo ellos.

Cuando no existen, las sesiones pueden depender directamente del bloque.

`purpose`:

- texto libre;
- no enum;
- el sistema no impone “acumulación/intensificación/descarga”.

Una descarga declarada:

```text
≠ PAUSED
≠ process closed
```

---

## 5.4 `Microcycle`

```json
{
  "microcycleId": "mc_...",
  "label": "...",
  "order": 1,
  "purpose": "...",
  "sessions": []
}
```

No es obligatorio.

---

# 6. Prescripción

## 6.1 `ExercisePrescription`

```json
{
  "prescriptionId": "rx_...",
  "exerciseVersionId": "exv_...",
  "order": 1,
  "sets": [],
  "intensity": {
    "criterion": "RIR",
    "target": {}
  },
  "professionalParameters": {}
}
```

### Reglas

- referencia catálogo versionado;
- pertenece a sesión planificada;
- parámetros cuantitativos llevan unidad/significado;
- no se fija número de series, reps, descansos, cargas o frecuencia;
- el profesional decide.

---

## 6.2 Intensidad `PERCENT_RM`

```json
{
  "criterion": "PERCENT_RM",
  "target": {
    "value": 0,
    "reference": {}
  }
}
```

No se fija fórmula propia de estimación de RM.

---

## 6.3 Intensidad `RIR`

```json
{
  "criterion": "RIR",
  "target": {
    "value": 0
  }
}
```

No se permiten simultáneamente ambos criterios para una misma prescripción.

---

## 6.4 Carga absoluta prescripta

Puede existir como complemento informativo si el dominio profesional la utiliza:

```json
{
  "suggestedLoad": {
    "value": 0,
    "unit": "kg"
  }
}
```

Pero:

```text
suggestedLoad ≠ intensityCriterion
```

La carga realmente utilizada pertenece a ejecución.

---

# 7. Catálogo de ejercicios

## `ExerciseCatalogItem`

```json
{
  "exerciseId": "ex_...",
  "versionId": "exv_...",
  "name": "...",
  "provenance": {},
  "muscleZones": [
    {
      "zoneId": "zone_...",
      "role": "PRIMARY"
    }
  ],
  "didacticResources": []
}
```

---

## 7.1 Rol muscular

Técnico:

```text
PRIMARY
SECONDARY
```

Mapeo:

```text
PRIMARY   ↔ PRINCIPAL
SECONDARY ↔ SECUNDARIO
```

### Regla

No hay:

```text
percentage
weight
activationScore
```

en la relación contractual P0.

La asignación concreta Ejercicio–Zona es contenido de catálogo profesional/versionado.

---

# 8. Zonas musculares

## `MuscleZone`

```json
{
  "zoneId": "zone_...",
  "name": "...",
  "anatomicalViews": [
    "ANTERIOR",
    "POSTERIOR"
  ],
  "version": "..."
}
```

### Invariantes consumidos

Catálogo inicial:

```text
17 zonas únicas
9 anterior
10 posterior
2 ambas
```

Las dos declaradas en ambas vistas:

```text
forearm / antebrazo
deltoid / deltoides
```

### Regla crítica

```text
MuscleZone ≠ graphic asset
```

Las máscaras/figuras del Documento 10 referencian `zoneId`.

No existe catálogo de zonas masculino y femenino separado.

---

# 9. Recurso didáctico

```json
{
  "resourceId": "...",
  "resourceVersionId": "...",
  "type": "IMAGE",
  "authorship": {},
  "provenance": {},
  "license": {
    "id": "...",
    "label": "..."
  }
}
```

Licencia obligatoria.

Formato/resolución/storage no se fijan aquí.

---

# 10. API-TRN-01 — Crear evaluación

```http
POST /api/v1/advisees/{adviseeId}/training/evaluations
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### PDP

Profesional:

```text
verified Training scope
+ operational relationship
+ current B2
+ purpose
+ pertinence
+ valid session/account
```

### Request

```json
{
  "occurredAt": "...",
  "assessment": {},
  "evidenceReferences": [],
  "professionalNotes": "..."
}
```

### Success

`201`

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 TRAINING_EVALUATION_INVALID
422 TRAINING_SCOPE_NOT_OPERATIONAL
```

### Audit

`REQUIRED_SAME_TX`

---

# 11. API-TRN-02 — Listar evaluaciones

```http
GET /api/v1/advisees/{adviseeId}/training/evaluations?limit=&cursor=
```

Cursor paginado, proyección pertinente.

---

# 12. API-TRN-03 — Consultar evaluación

```http
GET /api/v1/training/evaluations/{evaluationId}
```

No existe/no revelable:

```text
404 RESOURCE_NOT_FOUND
```

---

# 13. API-TRN-04 — Crear versión de objetivo

```http
POST /api/v1/advisees/{adviseeId}/training/objectives
Idempotency-Key: <required>
```

### Request

```json
{
  "evaluationId": "teval_...",
  "effectiveFrom": "...",
  "effectiveUntil": null,
  "objective": {},
  "rationale": "..."
}
```

### Success

`201`

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 TRAINING_OBJECTIVE_INVALID
422 EVALUATION_NOT_COMPATIBLE
```

---

# 14. API-TRN-05 — Historia de objetivos

```http
GET /api/v1/advisees/{adviseeId}/training/objectives?limit=&cursor=
```

No overwrite histórico.

---

# 15. API-TRN-06 — Objetivo efectivo

```http
GET /api/v1/advisees/{adviseeId}/training/objectives/effective
```

Ausencia legítima:

```json
{
  "data": {
    "objective": null
  }
}
```

No se selecciona automáticamente por timestamp ante una relación ambigua.

---

# 16. API-TRN-07 — Crear borrador de plan

```http
POST /api/v1/advisees/{adviseeId}/training/plans
Idempotency-Key: <required>
```

### Request

```json
{
  "objectiveVersionId": "tobjv_...",
  "initialStructure": {
    "blocks": []
  }
}
```

### Reglas

- estado inicial `DRAFT`;
- no visible como vigente al asesorado;
- no abre proceso;
- no cuenta como nuevo proceso activo hasta activación;
- objetivo compatible obligatorio.

---

# 17. API-TRN-08 — Listar planes

```http
GET /api/v1/advisees/{adviseeId}/training/plans?limit=&cursor=&state=
```

Proyección profesional/asesorado según actor.

---

# 18. API-TRN-09 — Consultar plan

```http
GET /api/v1/training/plans/{planId}
```

Versión activada se reconstruye desde snapshot, no desde catálogo actual.

---

# 19. API-TRN-10 — Editar borrador

```http
PATCH /api/v1/training/plans/{planId}
```

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "blocks": []
  }
}
```

### Validación estructural

- DRAFT;
- jerarquía válida;
- microcycle opcional;
- sesiones/prescripciones identificables;
- exercise refs válidas;
- intensidad exactamente `PERCENT_RM` o `RIR`;
- unidades presentes donde aplica;
- sin campos server-owned.

### No valida

- que el programa sea profesionalmente “bueno”;
- volumen ideal;
- frecuencia ideal;
- selección correcta de ejercicios;
- progresión óptima.

### Errors

```text
409 VERSION_CONFLICT
422 PLAN_NOT_EDITABLE
422 TRAINING_PLAN_STRUCTURE_INVALID
422 EXERCISE_REFERENCE_INVALID
422 INTENSITY_CRITERION_INVALID
```

---

# 20. API-TRN-11 — Validar borrador

```http
POST /api/v1/training/plans/{planId}/validate
```

Request:

```json
{
  "expectedVersion": "v_..."
}
```

Response:

```json
{
  "data": {
    "valid": false,
    "version": "v_...",
    "issues": []
  }
}
```

`200` aunque `valid=false`, si la validación se ejecutó correctamente.

---

# 21. API-TRN-12 — Activar plan

```http
POST /api/v1/training/plans/{planId}/activate
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Transacción obligatoria

```text
1. claim/revalidate expectedVersion
2. PDP actual
3. Training verification/scope/B2
4. capacity admission
5. validate draft
6. preserve immutable snapshot
7. switch unique active version
8. open process if this is a new process
9. emit domain event
10. blocking audit
11. commit
```

Sin I/O externo dentro de tx.

### Errors

```text
409 VERSION_CONFLICT
409 ACTIVE_PLAN_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 OPERATION_NOT_READY
422 CAPACITY_NOT_AVAILABLE
422 TRAINING_SCOPE_NOT_OPERATIONAL
```

---

# 22. API-TRN-13 — Consultar catálogo

```http
GET /api/v1/training/exercises?limit=&cursor=&q=
```

### Response item

Incluye:

- exercise/version;
- nombre;
- procedencia;
- relaciones zone+role;
- material didáctico disponible.

No expone cálculos de volumen o “músculo trabajado en %”.

---

# 23. `Today` de Entrenamiento

## API-TRN-14

```http
GET /api/v1/me/training/today
```

### AuthN

`SESSION`

### Temporalidad

Servidor determina fecha/zona.

### Response conceptual

```json
{
  "data": {
    "date": "YYYY-MM-DD",
    "timeZone": "America/Argentina/Buenos_Aires",
    "activePlan": {
      "planId": "tplan_...",
      "snapshotVersion": "..."
    },
    "occurrences": [
      {
        "occurrenceId": "occ_...",
        "plannedSession": {},
        "execution": {
          "state": "NOT_STARTED",
          "draftId": null
        }
      }
    ]
  }
}
```

### Regla

`Today` puede presentar una o más ocurrencias que el modelo temporal considere pertinentes.

No convierte automáticamente:

```text
no execution
```

en:

```text
NOT_COMPLETED
```

La ausencia de registro sigue siendo ausencia de registro.

---

# 24. Borrador de ejecución

## API-TRN-15 — Crear/obtener borrador singular de ocurrencia

```http
PUT /api/v1/training/occurrences/{occurrenceId}/execution-draft
```

### Por qué `PUT`

La ocurrencia posee conceptualmente a lo sumo un borrador editable vigente para el actor.

Repetir la misma intención:

```text
→ devuelve el mismo draft lógico
```

No crea borradores ilimitados.

### AuthN

`SESSION`

### Success

`200` existente / `201` creado.

```json
{
  "data": {
    "draftId": "tdraft_...",
    "version": "v_...",
    "state": "DRAFT",
    "occurrenceId": "occ_...",
    "granularity": null
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
422 ACTIVE_PLAN_REQUIRED
422 OCCURRENCE_NOT_EXECUTABLE
```

---

# 25. API-TRN-16 — Consultar borrador

```http
GET /api/v1/training/execution-drafts/{draftId}
```

Solo titular/actor autorizado según política.

Borrador:

```text
≠ evidence
≠ registered execution
```

---

# 26. API-TRN-17 — Editar borrador de ejecución

```http
PATCH /api/v1/training/execution-drafts/{draftId}
```

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "granularity": "SET",
    "sessionCondition": "COMPLETED_WITH_DEVIATION",
    "reason": null,
    "exercises": []
  }
}
```

---

# 27. Condición de sesión

Enum técnico propuesto:

```text
COMPLETED
COMPLETED_WITH_DEVIATION
NOT_COMPLETED
```

Mapeo:

```text
COMPLETED                ↔ REALIZADA
COMPLETED_WITH_DEVIATION ↔ REALIZADA_CON_DESVIO
NOT_COMPLETED            ↔ NO_REALIZADA
```

### Regla

`NOT_COMPLETED` registrado:

```text
≠ ausencia de registro
```

Puede incluir:

```json
{
  "reason": "..."
}
```

El motivo es opcional.

---

# 28. Granularidad SET

```json
{
  "granularity": "SET",
  "exercises": [
    {
      "prescriptionId": "rx_...",
      "performedExerciseVersionId": "exv_...",
      "sets": [
        {
          "setIndex": 1,
          "load": {
            "value": 0,
            "unit": "kg"
          },
          "completedRepetitions": 0,
          "rir": 2,
          "perceivedExertion": null
        }
      ]
    }
  ]
}
```

### Reglas

- `load.value` requiere unidad;
- reps completadas son ejecución real;
- RIR opcional;
- esfuerzo percibido opcional;
- no se infiere el faltante;
- no se calcula aquí volumen, volumen efectivo o PR.

---

# 29. Granularidad EXERCISE_OR_SESSION

```json
{
  "granularity": "EXERCISE_OR_SESSION",
  "exercises": [
    {
      "prescriptionId": "rx_...",
      "performedExerciseVersionId": "exv_...",
      "executionSummary": {}
    }
  ],
  "sessionSummary": {}
}
```

El schema específico del resumen admite solo datos realmente capturados.

BE no transforma ese resumen en series ficticias.

---

# 30. Sustitución de ejercicio

El registro siempre conserva la referencia prescrita:

```text
prescriptionId
```

y puede declarar:

```text
performedExerciseVersionId != prescribed exercise
```

Eso es legítimo.

No error.

Ejemplo:

```json
{
  "prescriptionId": "rx_bench",
  "performedExerciseVersionId": "exv_dumbbell_press"
}
```

El snapshot del plan no cambia.

---

# 31. API-TRN-18 — Confirmar ejecución

```http
POST /api/v1/training/execution-drafts/{draftId}/confirm
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Transacción

```text
1. reload draft
2. PDP/current relationship/B2
3. validate occurrence↔advisee↔active plan
4. validate content minimum according to granularity/condition
5. enforce one registered execution per occurrence
6. create immutable original
7. state DRAFT → REGISTERED
8. audit
9. commit
```

### Success

`201` o mismo resultado lógico en replay.

```json
{
  "data": {
    "executionId": "texec_...",
    "state": "REGISTERED",
    "occurredAt": "...",
    "recordedAt": "..."
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 EXECUTION_ALREADY_REGISTERED
409 IDEMPOTENCY_KEY_REUSED
422 EXECUTION_DRAFT_NOT_READY
422 INVALID_STATE_TRANSITION
```

---

# 32. API-TRN-19 — Consultar ejecución real

```http
GET /api/v1/training/executions/{executionId}
```

### Response

Incluye:

- active plan snapshot reference;
- planned occurrence/session;
- original execution;
- granularity;
- session condition;
- substitution facts;
- captured sets/summaries;
- correction chain visible;
- effective view by correction relation.

No reinterpreta un registro agregado como series.

---

# 33. API-TRN-20 — Corregir ejecución registrada

```http
POST /api/v1/training/executions/{executionId}/corrections
Idempotency-Key: <required>
```

### Actor

Según política 08:

- asesorado;
- profesional autorizado;
- administrador solo si la política excepcional lo permitiera y con trazabilidad.

El endpoint no concede esa facultad por existir; PDP decide.

### Request

```json
{
  "reason": "...",
  "correction": {}
}
```

### Reglas

- original immutable;
- corrección referencia original/cadena;
- no modifica prescripción;
- vista efectiva por relaciones;
- cadena rota/ambigua no se resuelve por fecha.

### Audit

`REQUIRED_SAME_TX`

---

# 34. API-TRN-21 — Contexto de revisión

```http
GET /api/v1/advisees/{adviseeId}/training/review-context?periodStart=&periodEnd=
```

### Response

Read model:

```json
{
  "data": {
    "period": {},
    "objective": {},
    "activePlanVersions": [],
    "registeredExecutions": [],
    "corrections": [],
    "missingData": [],
    "previousReviews": []
  }
}
```

Puede incluir fuentes para futuras proyecciones, pero este endpoint no define ni calcula:

```text
volume
effective volume
PR
muscle map
score
```

Eso corresponde a M-11.

---

# 35. API-TRN-22 — Registrar revisión profesional válida

```http
POST /api/v1/advisees/{adviseeId}/training/reviews
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request

```json
{
  "period": {
    "start": "...",
    "end": "...",
    "timeZone": "America/Argentina/Buenos_Aires"
  },
  "evidenceReferences": [],
  "interpretation": "...",
  "result": "ADJUST",
  "rationale": "...",
  "nextAction": {}
}
```

### Resultados permitidos

```text
MAINTAIN
ADJUST
REPLACE
RESCHEDULE_REVIEW
CHANGE_OBJECTIVE
FINALIZE
```

No existe:

```text
PROGRESS
```

como séptimo resultado.

---

# 36. Progresión

Interpretación contractual:

```text
progresar conservando estructura
→ ADJUST
```

```text
progresar mediante planificación sucesora/reemplazo
→ REPLACE
```

```text
nuevo bloque
→ ADJUST o REPLACE
```

según su efecto sobre versión/planificación.

BE no decide automáticamente cuál corresponde.

La revisión profesional declara la decisión.

---

# 37. API-TRN-23 — Consultar revisión

```http
GET /api/v1/training/reviews/{reviewId}
```

Incluye evidencia, interpretación, resultado, fundamento, next action y estado de aplicación.

---

# 38. API-TRN-24 — Aplicar continuidad/cierre

```http
POST /api/v1/training/reviews/{reviewId}/apply
Idempotency-Key: <required>
```

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Semántica

La revisión ya declaró la decisión.

`apply` ejecuta la consecuencia.

Si requiere cambiar planificación:

```text
no edita active snapshot
→ crea/actualiza draft sucesor
→ valida/activa cuando corresponda
```

Si `FINALIZE`:

```text
cierra proceso según M-04
```

Solo después del éxito completo:

```text
emit ContinuidadOCierreAplicado
```

### Anti-éxito parcial

Si no puede aplicar todo:

```text
rollback / no completion event
```

### Errors

```text
409 VERSION_CONFLICT
409 REVIEW_ALREADY_APPLIED
409 IDEMPOTENCY_KEY_REUSED
422 CONTINUITY_ACTION_NOT_APPLICABLE
422 REVIEW_NOT_VALID_FOR_APPLICATION
```

---

# 39. Importación wger

wger:

```text
fuente externa posible
≠ catálogo operativo único
```

No P0 passthrough.

Patrón:

```text
provider result
→ professional/authorized review
→ controlled import
→ BE catalog version
```

Con:

- proveedor;
- external ID;
- received data;
- provenance;
- fecha;
- actor;
- decisión;
- licencia cuando corresponda.

Caída:

```text
BE local catalog/manual fallback
```

No éxito falso.

---

# 40. Qué el 09 deliberadamente NO calcula

Aunque DEC-047 habilite captura suficiente, esta vertical no produce autoridad para:

```text
volumen por ejercicio
volumen por zona
volumen efectivo
progresión estadística
PR
mapa muscular
umbral de serie efectiva
score de entrenamiento
```

Esos productos son read models/proyecciones de M-11.

El 09 solo garantiza que la captura necesaria pueda viajar correctamente por API.

---

# 41. Error registry de Entrenamiento

## Evaluación/objetivo

```text
TRAINING_EVALUATION_INVALID
TRAINING_OBJECTIVE_INVALID
EVALUATION_NOT_COMPATIBLE
TRAINING_SCOPE_NOT_OPERATIONAL
```

## Plan

```text
TRAINING_PLAN_STRUCTURE_INVALID
EXERCISE_REFERENCE_INVALID
INTENSITY_CRITERION_INVALID
PLAN_NOT_EDITABLE
ACTIVE_PLAN_CONFLICT
CAPACITY_NOT_AVAILABLE
```

## Ocurrencia/ejecución

```text
ACTIVE_PLAN_REQUIRED
OCCURRENCE_NOT_EXECUTABLE
EXECUTION_DRAFT_NOT_READY
EXECUTION_ALREADY_REGISTERED
EXECUTION_GRANULARITY_INVALID
SESSION_CONDITION_INVALID
EXECUTION_VALUE_INVALID
```

## Revisión

Reutiliza el registro común:

```text
REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE
REVIEW_COMPONENT_REQUIRED
REVIEW_RESULT_INVALID
REVIEW_NOT_ALLOWED
REVIEW_ALREADY_APPLIED
CONTINUITY_ACTION_NOT_APPLICABLE
REVIEW_NOT_VALID_FOR_APPLICATION
```

---

# 42. AuthN / audit / idempotencia

| Operación | AuthN | Audit | Idempotencia |
|---|---|---|---|
| crear evaluación | SESSION_MFA | REQUIRED_SAME_TX | key |
| crear objetivo | SESSION_MFA | REQUIRED_SAME_TX | key |
| crear borrador plan | SESSION_MFA | REQUIRED_SAME_TX | key |
| editar plan | SESSION_MFA | REQUIRED_SAME_TX | VersionToken |
| validate | SESSION_MFA | según 08 | no |
| activate | SESSION_MFA | REQUIRED_SAME_TX | key |
| catálogo | SESSION | técnico/según lectura | n/a |
| Today | SESSION | según 08 | n/a |
| crear/obtener execution draft | SESSION | técnico/sensible según 08 | PUT semántico |
| editar execution draft | SESSION | según 08 | VersionToken |
| confirm execution | SESSION | REQUIRED_SAME_TX | key |
| correction | SESSION / SESSION_MFA según actor/política | REQUIRED_SAME_TX | key |
| review-context | SESSION_MFA | según 08 | n/a |
| create review | SESSION_MFA | REQUIRED_SAME_TX | key |
| apply | SESSION_MFA | REQUIRED_SAME_TX | key |

---

# 43. Pruebas obligatorias hacia 11A

## Plan

- microcycle opcional;
- snapshot preserva microcycle si existe;
- purpose libre, no enum;
- “deload” no pausa proceso;
- solo `PERCENT_RM` o `RIR`;
- ambos simultáneos → rechazo;
- perceived exertion no aceptado como prescription criterion;
- carga absoluta no se interpreta como criterio;
- cambio de catálogo no altera snapshot;
- activation ACID/capacity/version/unique active.

## Catálogo

- 17 zone IDs estables;
- 9/10/2 consistente;
- forearm/deltoid en ambas vistas;
- figura femenina no crea zones;
- zone no es asset;
- relation zone exige role;
- role solo PRIMARY/SECONDARY;
- didactic resource sin licencia → rechazo.

## Ejecución

- draft no es evidencia;
- un occurrence → máximo un registered original;
- retry no duplica;
- REGISTERED no vuelve a DRAFT;
- substitution preserva prescribed + performed;
- NOT_COMPLETED registrado ≠ no data;
- reason opcional;
- SET captura load+unit+reps;
- RIR/perceived effort opcionales;
- aggregated granularity no produce synthetic sets;
- correction no modifica original ni prescription;
- cadena ambigua no se resuelve por timestamp.

## Revisión

- dashboard/opening no crea revisión;
- exactamente seis resultados;
- progress no es séptimo enum;
- ADJUST/REPLACE según decisión profesional;
- apply separado;
- event solo tras aplicación completa.

---

# 44. Hallazgos nuevos

## H-09-TRN-01 — El `Today` no debe confundir ausencia con NO_REALIZADA

La condición `NO_REALIZADA` es un hecho registrado.

Por tanto:

```text
no execution
→ NO_DATA / NOT_STARTED / absence
```

y:

```text
explicit registered NOT_COMPLETED
→ evidence
```

No son equivalentes.

---

## H-09-TRN-02 — No conviene introducir `RPE` como tercer criterio

El contrato puede transportar `perceivedExertion` en ejecución.

No debe existir:

```text
intensity.criterion = RPE
```

---

## H-09-TRN-03 — Zonas musculares deben viajar por ID, no por asset

La API de catálogo devuelve `zoneId`.

Documento 10 decide qué imagen/máscara representa esa zona.

Esto evita acoplar dominio a assets.

---

## H-09-TRN-04 — “volumen efectivo” no pertenece a estos endpoints de escritura

La serie captura RIR/esfuerzo.

El umbral que decide qué serie es efectiva sigue siendo profesional/configurable y M-11 deriva la proyección.

---

# 45. Candidatas nuevas

| ID | Propuesta | Estado |
|---|---|---|
| `CAND-09-TRN-A` | reutilizar patrón común vertical | DERIVADA / ratificación |
| `CAND-09-TRN-B` | enum técnico `PERCENT_RM / RIR` | PROPUESTA |
| `CAND-09-TRN-C` | granularidad `SET / EXERCISE_OR_SESSION` | PROPUESTA |
| `CAND-09-TRN-D` | condición técnica `COMPLETED / COMPLETED_WITH_DEVIATION / NOT_COMPLETED` | PROPUESTA |
| `CAND-09-TRN-E` | `PUT occurrence/execution-draft` como recurso singular | PROPUESTA |
| `CAND-09-TRN-F` | `PRIMARY / SECONDARY` para rol de zona | PROPUESTA DE NAMING, semántica derivada |
| `CAND-09-TRN-G` | Today preserva diferencia ausencia vs NO_REALIZADA | DERIVADA |

---

# 46. Conteo

Superficie v0.6:

```text
24 rutas P0 de Entrenamiento
```

v0.10 mantiene:

```text
24
```

No fue necesario agregar rutas nuevas.

La profundidad adicional se resuelve mediante schemas, no endpoint soup.

---

# 47. Estado de salida

```text
BE-LEG-09:
EN DESARROLLO

ACC/PRO/REL/CON:
DETALLADOS v0.8

NUTRICIÓN:
DETALLADA v0.9

ENTRENAMIENTO:
DETALLADO v0.10

RUTAS TRAINING P0:
24

PRESCRIPCIÓN:
PERCENT_RM | RIR

EJECUCIÓN:
DRAFT → REGISTERED
+ CORRECTION CHAIN

GRANULARIDAD:
SET
o
EXERCISE_OR_SESSION

SESSION CONDITION:
COMPLETED
COMPLETED_WITH_DEVIATION
NOT_COMPLETED

MUSCLE ZONES:
17 DOMAIN IDS
NO ASSETS

PROJECTIONS:
NO CALCULADAS AQUÍ

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
ANTROPOMETRÍA + READ MODELS / PROYECCIONES P0
```

---

*Fin de BE-LEG-09 v0.10 — Contratos P0 de Entrenamiento.*
