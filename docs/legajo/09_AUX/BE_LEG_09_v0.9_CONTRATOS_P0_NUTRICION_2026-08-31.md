# BE-LEG-09 v0.9 — Contratos P0 de Nutrición

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09`  
> **Versión:** `v0.9 — CONTRATOS P0 DE NUTRICIÓN`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PENDIENTE DE CONTRARREVISIÓN`  
> **Consume:** v0.7 contrato transversal + v0.8 acceso/gobierno + BE-LEG-05/06/07/08  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Definir el contrato P0 completo del circuito nutricional de BE:

```text
evaluación
→ objetivo profesional versionado
→ borrador de plan
→ validación
→ activación
→ versión vigente + instantánea reproducible
→ consulta diaria
→ ingesta/ejecución registrada
→ contraste descriptivo
→ revisión profesional válida
→ continuidad o cierre
```

El contrato no fija contenido nutricional profesional, fórmulas, valores ni metodología. Fija la estructura necesaria para representar y preservar decisiones profesionales sin inventarlas ni evaluarlas automáticamente.

---

# 1. Autoridades consumidas

## 1.1 Conducta de 05

Nutrición P0 se deriva de:

- `UC-P09` — evaluación + objetivo;
- `UC-P10` — diseño de plan;
- `UC-P11` — validación + activación;
- `UC-P12` — consulta diaria + registro;
- `UC-P13` — revisión + continuidad/cierre;
- `UC-I05` — revisión profesional válida;
- `UC-I06` — aplicar continuidad/cierre;
- `UC-I07/I08` — importación y fallback;
- `UC-I02/I03` — autorización y auditoría.

## 1.2 Dominio de 06

Se consumen, sin redefinir:

- objetivo nutricional versionado;
- máquina de versión de plan `BORRADOR / ACTIVADA`;
- instantánea reproducible;
- proceso operativo nacido por activación;
- ingesta registrada;
- corrección trazable;
- revisión válida;
- `ContinuidadOCierreAplicado`;
- jerarquía Día tipo → Comida → Opción → Ítem;
- modalidades A/B/C;
- estado de preparación;
- atributos nutricionales extendidos;
- evidencia visual opcional de ingesta;
- recurso didáctico versionado.

## 1.3 Arquitectura 07

- activación ACID;
- instantánea antes de vigencia;
- capacidad dentro de la misma transacción;
- una versión efectiva única;
- idempotencia respaldada por constraint;
- versión esperada;
- sin I/O externo dentro de la transacción;
- auditoría bloqueante donde corresponda.

---

# 2. Decisiones contractuales nutricionales

## CAND-09-NUT-A — El sistema registra una decisión profesional, no calcula el objetivo

**DERIVADA DE 06.**

BE puede transportar:

- requerimiento energético estimado;
- distribución de macronutrientes;
- distribución por comida opcional;
- fundamento;
- método/procedencia declarados cuando corresponda.

BE **no calcula el requerimiento energético como autoridad del sistema**.

## CAND-09-NUT-B — A y C operativas en P0; B estructurada y habilitable

**PROPUESTA RECOMENDADA.**

- Modalidad A — opciones de plato armado: operativa P0.
- Modalidad C — registro descriptivo libre: operativa P0.
- Modalidad B — intercambio: schema previsto, operativa cuando exista catálogo versionado de grupos.

## CAND-09-NUT-C — Contraste solo descriptivo

No existe como salida calculada de BE:

```text
adherenceScore
complianceGrade
good/bad
```

Sí puede existir:

```text
prescribed
registered
differences
missingData
```

sobre datos realmente registrados.

## CAND-09-NUT-D — Ausencia de registro = NO_DATA

```text
no registro
→ NO_DATA
```

No:

```text
0 %
NO_CUMPLIDO
```

---

# 3. Schemas conceptuales

## 3.1 `NutritionEvaluation`

```json
{
  "evaluationId": "neval_...",
  "version": "v_...",
  "adviseeId": "adv_...",
  "occurredAt": "...",
  "recordedAt": "...",
  "professionalId": "pro_...",
  "evidence": [],
  "assessment": {},
  "professionalNotes": "..."
}
```

El 09 no inventa una ficha clínica general ni obliga a campos no respaldados por 04/06.

## 3.2 `NutritionObjectiveVersion`

```json
{
  "objectiveId": "nobj_...",
  "versionId": "nobjv_...",
  "adviseeId": "adv_...",
  "evaluationId": "neval_...",
  "effectiveFrom": "...",
  "effectiveUntil": null,
  "estimatedEnergyRequirement": {
    "value": 0,
    "unit": "..."
  },
  "macronutrientDistribution": {},
  "mealDistribution": null,
  "rationale": "...",
  "methodStatement": "...",
  "authoredBy": "pro_...",
  "createdAt": "..."
}
```

Reglas:

- versión profesional inmutable;
- una nueva no modifica la previa;
- el backend no infiere ni calcula la decisión;
- la efectiva se resuelve según 06, nunca por `updatedAt`.

---

# 4. Plan nutricional

## 4.1 `NutritionPlanDraft`

```json
{
  "planId": "nplan_...",
  "version": "v_...",
  "state": "DRAFT",
  "adviseeId": "adv_...",
  "objectiveVersionId": "nobjv_...",
  "dayTypes": []
}
```

## 4.2 Jerarquía

```text
plan version
→ dayTypes[1..N]
→ meals[1..N]
→ mealOptions[1..N]
→ prescribedItems[1..N]
```

## 4.3 `DayType`

```json
{
  "dayTypeId": "dt_...",
  "label": "...",
  "order": 1,
  "meals": []
}
```

`dayType` no representa una fecha ni se agenda automáticamente.

## 4.4 `Meal`

```json
{
  "mealId": "meal_...",
  "label": "...",
  "order": 1,
  "prescriptionMode": "DISH_OPTIONS",
  "options": []
}
```

`prescriptionMode` candidato:

```text
DISH_OPTIONS
EXCHANGE_PORTIONS
```

La modalidad `FREE_DESCRIPTION` pertenece al registro de ingesta.

## 4.5 Modalidad A — `DishOption`

```json
{
  "optionId": "opt_...",
  "label": "...",
  "items": [
    {
      "catalogItemId": "food_...",
      "quantity": {
        "value": 0,
        "unit": "..."
      },
      "preparationState": "RAW"
    }
  ]
}
```

`preparationState`:

```text
RAW
COOKED
AS_PURCHASED
```

Si hay cantidad, estado de preparación es obligatorio.

## 4.6 Modalidad B — `ExchangePrescription`

```json
{
  "exchangeGroupVersionId": "exg_...",
  "prescribedPortions": 0
}
```

El grupo versionado conserva nutriente crítico, aporte de referencia y membresías; el plan no los duplica.

---

# 5. Catálogo nutricional

`NutritionCatalogItemSummary`:

```json
{
  "catalogItemId": "food_...",
  "versionId": "foodv_...",
  "name": "...",
  "itemType": "FOOD",
  "composition": {},
  "extendedAttributes": [],
  "didacticResources": []
}
```

Reglas:

- catálogo BE funciona sin proveedor externo;
- procedencia reconstruible;
- índice glucémico opcional;
- carga glucémica por comida diferida;
- recurso didáctico opcional y versionado con licencia;
- cambio del catálogo no reescribe snapshots históricos.

---

# 6. API-NUT-01 — Crear evaluación nutricional

```http
POST /api/v1/advisees/{adviseeId}/nutrition/evaluations
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### PDP

Requiere profesional verificado en Nutrición + vínculo operativo + scope Nutrición + B2 vigente + finalidad/pertinencia + cuenta/sesión vigentes.

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

```json
{
  "data": {
    "evaluationId": "neval_...",
    "version": "v_...",
    "occurredAt": "...",
    "recordedAt": "..."
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 NUTRITION_EVALUATION_INVALID
422 NUTRITION_SCOPE_NOT_OPERATIONAL
```

### Audit

`REQUIRED_SAME_TX`

---

# 7. API-NUT-02 — Listar evaluaciones

```http
GET /api/v1/advisees/{adviseeId}/nutrition/evaluations?limit=&cursor=
```

Cursor paginado, PDP + pertinencia. La proyección depende del actor autorizado.

---

# 8. API-NUT-03 — Consultar evaluación

```http
GET /api/v1/nutrition/evaluations/{evaluationId}
```

No existe / no visible:

```text
404 RESOURCE_NOT_FOUND
```

---

# 9. API-NUT-04 — Crear nueva versión de objetivo

```http
POST /api/v1/advisees/{adviseeId}/nutrition/objectives
Idempotency-Key: <required>
```

### Request

```json
{
  "evaluationId": "neval_...",
  "effectiveFrom": "...",
  "effectiveUntil": null,
  "estimatedEnergyRequirement": {
    "value": 0,
    "unit": "..."
  },
  "macronutrientDistribution": {},
  "mealDistribution": null,
  "rationale": "...",
  "methodStatement": "..."
}
```

### Reglas

- decisión profesional;
- `rationale` obligatorio;
- no endpoint de “calcular objetivo” P0;
- nueva versión preserva anteriores.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 NUTRITION_OBJECTIVE_INVALID
422 EVALUATION_NOT_COMPATIBLE
```

---

# 10. API-NUT-05 — Historia de objetivos

```http
GET /api/v1/advisees/{adviseeId}/nutrition/objectives?limit=&cursor=
```

---

# 11. API-NUT-06 — Objetivo efectivo

```http
GET /api/v1/advisees/{adviseeId}/nutrition/objectives/effective
```

Si no existe versión efectiva legítima:

```json
{
  "data": {
    "objective": null
  }
}
```

No se selecciona “la última” por fecha.

---

# 12. API-NUT-07 — Crear borrador de plan

```http
POST /api/v1/advisees/{adviseeId}/nutrition/plans
Idempotency-Key: <required>
```

### Request

```json
{
  "objectiveVersionId": "nobjv_...",
  "initialStructure": {
    "dayTypes": []
  }
}
```

### Reglas

- crea `DRAFT`;
- no es plan vigente;
- no abre proceso;
- no ocupa capacidad como proceso activo hasta activación.

---

# 13. API-NUT-08 — Listar planes

```http
GET /api/v1/advisees/{adviseeId}/nutrition/plans?limit=&cursor=&state=
```

La proyección del asesorado no expone borradores por defecto.

---

# 14. API-NUT-09 — Consultar plan

```http
GET /api/v1/nutrition/plans/{planId}
```

Una versión activada se reconstruye desde instantánea, no desde catálogo vivo.

---

# 15. API-NUT-10 — Editar borrador

```http
PATCH /api/v1/nutrition/plans/{planId}
```

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "dayTypes": []
  }
}
```

### Valida

- estado `DRAFT`;
- jerarquía;
- modalidad;
- referencias;
- cantidad + unidad + estado de preparación;
- disponibilidad de modalidad B.

### No valida

- si la dieta “es buena”;
- si calorías/macros son profesionalmente correctos.

### Errors

```text
409 VERSION_CONFLICT
422 PLAN_NOT_EDITABLE
422 NUTRITION_PLAN_STRUCTURE_INVALID
422 CATALOG_REFERENCE_INVALID
422 EXCHANGE_MODE_NOT_AVAILABLE
```

---

# 16. API-NUT-11 — Validar borrador

```http
POST /api/v1/nutrition/plans/{planId}/validate
```

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Response

```json
{
  "data": {
    "valid": false,
    "version": "v_...",
    "issues": [
      {
        "code": "MEAL_OPTION_REQUIRED",
        "path": "dayTypes[0].meals[1]"
      }
    ]
  }
}
```

`200` aunque `valid=false`: la operación de validar funcionó.

---

# 17. API-NUT-12 — Activar plan

```http
POST /api/v1/nutrition/plans/{planId}/activate
Idempotency-Key: <required>
```

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Transacción obligatoria

```text
1. reclamar/revalidar versión
2. PDP actual
3. verificar profesional/scope/B2
4. verificar admisión/capacidad
5. validar estructura
6. preservar instantánea
7. conmutar vigencia única
8. abrir proceso operativo
9. emitir acontecimiento
10. registrar auditoría
11. commit
```

Instantánea **antes** de vigencia. Sin I/O externo dentro de la tx. Si falla cualquier paso: rollback total.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 ACTIVE_PLAN_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 OPERATION_NOT_READY
422 CAPACITY_NOT_AVAILABLE
422 NUTRITION_SCOPE_NOT_OPERATIONAL
```

---

# 18. API-NUT-13 — Catálogo

```http
GET /api/v1/nutrition/catalog-items?limit=&cursor=&q=&type=
```

Paginado, catálogo BE, sin passthrough del proveedor.

---

# 19. API-NUT-14 — “Hoy” nutricional

```http
GET /api/v1/me/nutrition/today
```

El servidor determina fecha/zona.

```json
{
  "data": {
    "date": "YYYY-MM-DD",
    "timeZone": "America/Argentina/Buenos_Aires",
    "activePlan": {},
    "registeredIntake": null,
    "dataState": "NO_DATA"
  }
}
```

### Regla crítica

`Día tipo` no es fecha. El API no selecciona silenciosamente un Día tipo por timestamp u orden si no existe una regla canónica de selección.

---

# 20. API-NUT-15 — Registrar ingesta/ejecución

```http
POST /api/v1/me/nutrition/executions
Idempotency-Key: <required>
```

### Request discriminada

```json
{
  "activePlanId": "nplan_...",
  "dayTypeId": "dt_...",
  "occurrence": {
    "occurredAt": "..."
  },
  "recording": {
    "mode": "DISH_OPTIONS"
  },
  "visualEvidenceUploadIds": []
}
```

`mode`:

```text
DISH_OPTIONS
EXCHANGE_PORTIONS
FREE_DESCRIPTION
```

### Modalidad C

```json
{
  "mode": "FREE_DESCRIPTION",
  "description": "Comí...",
  "portionDescription": "..."
}
```

### Evidencia visual

Opcional. No infiere cantidades ni convierte estimación en medición.

### Idempotencia natural

```text
advisee + active plan version + occurrence/planned period
```

calculado/validado server-side, más `Idempotency-Key`.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
409 EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY
422 ACTIVE_PLAN_REQUIRED
422 RECORDING_MODE_NOT_AVAILABLE
422 NUTRITION_EXECUTION_INVALID
```

---

# 21. API-NUT-16 — Consultar ejecución

```http
GET /api/v1/nutrition/executions/{executionId}
```

Incluye original, modalidad, evidencia visual autorizada y cadena de correcciones. La vista efectiva se resuelve por relación de corrección, nunca por último timestamp.

---

# 22. Corrección acotada de modalidad C

No se crea una “edición de ingesta”.

Para estructuración profesional posterior:

```http
POST /api/v1/nutrition/executions/{executionId}/corrections
```

### Request

```json
{
  "reason": "STRUCTURE_FREE_DESCRIPTION",
  "structuredEstimate": {
    "items": []
  },
  "estimationStatement": "Professional estimate from descriptive record."
}
```

Reglas:

- original intacto;
- texto original conservado;
- estructura posterior marcada como estimación;
- no se presenta como medición.

**Hallazgo:** esta ruta debe incorporarse a P0 si la modalidad C se activa desde el primer release.

---

# 23. API-NUT-17 — Contexto de revisión

```http
GET /api/v1/advisees/{adviseeId}/nutrition/review-context?periodStart=&periodEnd=
```

### Response

```json
{
  "data": {
    "period": {},
    "objective": {},
    "activePlanVersions": [],
    "registeredIntakes": [],
    "descriptiveContrast": {},
    "missingData": [],
    "previousReviews": []
  }
}
```

No score, no inferencia de huecos, no “visualización = revisión”.

---

# 24. Contraste descriptivo

```json
{
  "prescribed": {},
  "registered": {},
  "differences": [],
  "missing": []
}
```

Prohibido en P0:

```json
{
  "score": 82,
  "grade": "good",
  "adherencePercent": 82
}
```

---

# 25. API-NUT-18 — Registrar revisión profesional válida

```http
POST /api/v1/advisees/{adviseeId}/nutrition/reviews
Idempotency-Key: <required>
```

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
  "result": "MAINTAIN",
  "rationale": "...",
  "nextAction": {}
}
```

### Resultados exactos

```text
MAINTAIN
ADJUST
REPLACE
RESCHEDULE_REVIEW
CHANGE_OBJECTIVE
FINALIZE
```

No existen `GOOD`, `BAD`, `PROGRESS` como resultado paralelo.

### Componentes obligatorios

- actor;
- período;
- evidencia reconstruible;
- interpretación no diagnóstica;
- resultado;
- fundamento;
- próxima acción/cierre;
- autoría;
- fecha.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE
422 REVIEW_COMPONENT_REQUIRED
422 REVIEW_RESULT_INVALID
422 REVIEW_NOT_ALLOWED
```

---

# 26. API-NUT-19 — Consultar revisión

```http
GET /api/v1/nutrition/reviews/{reviewId}
```

Incluye revisión y, cuando exista, referencia al evento de aplicación de continuidad/cierre.

---

# 27. API-NUT-20 — Aplicar continuidad o cierre

```http
POST /api/v1/nutrition/reviews/{reviewId}/apply
Idempotency-Key: <required>
```

### Request

```json
{
  "expectedVersion": "v_..."
}
```

La próxima acción ya está declarada en la revisión; el cliente no elige silenciosamente otro resultado al aplicar.

### Transacción

```text
1. releer revisión
2. comprobar aplicabilidad
3. PDP
4. aplicar consecuencia
5. crear versiones necesarias
6. cerrar proceso si FINALIZE
7. emitir ContinuidadOCierreAplicado
8. auditar
9. commit
```

Si no puede aplicarse completo:

```text
no event
no cycle closed
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 REVIEW_ALREADY_APPLIED
409 IDEMPOTENCY_KEY_REUSED
422 CONTINUITY_ACTION_NOT_APPLICABLE
422 REVIEW_NOT_VALID_FOR_APPLICATION
```

---

# 28. Evidencia visual de ingesta

Los executions pueden adjuntar uploads privados autorizados:

```json
{
  "visualEvidenceUploadIds": ["upl_..."]
}
```

Reglas:

- opcional;
- privada;
- URL de lectura temporal;
- autoría/momento/procedencia;
- no IA externa identificable en MVP;
- no inferencia automática de cantidad.

---

# 29. Recursos didácticos

El catálogo puede exponer recursos versionados:

```json
{
  "resourceId": "...",
  "resourceVersionId": "...",
  "type": "IMAGE",
  "authorship": {},
  "provenance": {},
  "license": {}
}
```

Licencia obligatoria. No se promete recurso para cada elemento.

---

# 30. Importación externa — P1

No hay passthrough directo de Open Food Facts.

Futuro:

```text
buscar proveedor
→ revisar candidato
→ importar al catálogo BE
```

Con proveedor, identificador, fecha, contenido relevante, actor y decisión de incorporación. Si falla el tercero: fallback local/manual, nunca éxito falso.

---

# 31. Error registry nutricional

```text
NUTRITION_EVALUATION_INVALID
NUTRITION_SCOPE_NOT_OPERATIONAL
NUTRITION_OBJECTIVE_INVALID
EVALUATION_NOT_COMPATIBLE
OBJECTIVE_NOT_EFFECTIVE_OR_COMPATIBLE
PLAN_NOT_EDITABLE
NUTRITION_PLAN_STRUCTURE_INVALID
CATALOG_REFERENCE_INVALID
EXCHANGE_MODE_NOT_AVAILABLE
ACTIVE_PLAN_CONFLICT
ACTIVE_PLAN_REQUIRED
RECORDING_MODE_NOT_AVAILABLE
NUTRITION_EXECUTION_INVALID
EXECUTION_ALREADY_REGISTERED_INCOMPATIBLY
REVIEW_EVIDENCE_NOT_RECONSTRUCTIBLE
REVIEW_COMPONENT_REQUIRED
REVIEW_RESULT_INVALID
REVIEW_NOT_ALLOWED
REVIEW_ALREADY_APPLIED
CONTINUITY_ACTION_NOT_APPLICABLE
REVIEW_NOT_VALID_FOR_APPLICATION
```

Más errores transversales de v0.7.

---

# 32. Matriz AuthN/Audit/Idempotencia

| Operación | AuthN | Audit | Idempotencia |
|---|---|---|---|
| crear evaluación | SESSION_MFA | REQUIRED_SAME_TX | key |
| leer evaluación | SESSION/SESSION_MFA | según 08 | — |
| crear objetivo | SESSION_MFA | REQUIRED_SAME_TX | key |
| crear borrador | SESSION_MFA | REQUIRED_SAME_TX | key |
| editar borrador | SESSION_MFA | REQUIRED_SAME_TX | VersionToken |
| validate | SESSION_MFA | según política | — |
| activate | SESSION_MFA | REQUIRED_SAME_TX | key + VersionToken |
| catálogo | SESSION | técnico | — |
| Hoy | SESSION | según 08 | — |
| registrar ingesta | SESSION | REQUIRED_SAME_TX | key + constraint |
| estructurar modalidad C | SESSION_MFA | REQUIRED_SAME_TX | key |
| review-context | SESSION_MFA | según 08 | — |
| revisión | SESSION_MFA | REQUIRED_SAME_TX | key |
| apply | SESSION_MFA | REQUIRED_SAME_TX | key + VersionToken |

---

# 33. Pruebas obligatorias hacia 11A

## Evaluación/objetivo

- sin scope/verificación/B2 → deny;
- BE no calcula objetivo;
- nueva versión no pisa anterior;
- effective no usa timestamp.

## Plan

- DRAFT no visible como vigente;
- varios Día tipo;
- Día tipo no se convierte en fecha;
- cantidad exige unidad + estado de preparación;
- B deshabilitada si no está operativa;
- validate no activa;
- activate revalida;
- snapshot antes de vigencia;
- cambio de catálogo no altera snapshot;
- plan activo único;
- carrera de capacidad no excede límite;
- rollback preserva vigente previo.

## Ejecución

- retry no duplica;
- ventana temporal server-side;
- plan pertenece al asesorado;
- no data ≠ zero;
- modalidad C conserva texto;
- evidencia visual no infiere cantidad;
- estructuración conserva original y marca estimación.

## Revisión

- ver dashboard no crea revisión;
- solo seis resultados;
- evidencia reconstruible;
- interpretación no diagnóstica;
- próxima acción/cierre obligatoria;
- apply separado;
- `ContinuidadOCierreAplicado` solo tras aplicación completa;
- cierre no borra historia.

---

# 34. Hallazgos nuevos

## H-09-NUT-01 — Corrección necesaria para modalidad C

La v0.6 evitó correctamente una corrección nutricional genérica. Pero `REG-06-121` exige estructuración profesional posterior mediante Corrección trazable.

**Recomendación:** incorporar `POST /nutrition/executions/{id}/corrections` a P0 si modalidad C se habilita en el primer release.

## H-09-NUT-02 — No usar `adherence` como recurso contractual principal

Para evitar arrastrar el sentido legacy de score:

**Recomendación:** recurso público principal = `nutrition execution/intake`, no `adherence`.

## H-09-NUT-03 — Today no selecciona Día tipo silenciosamente

Si no existe regla canónica de selección, API no elige por orden/timestamp. Debe exponer la decisión pendiente al cliente/UX según 10.

---

# 35. Candidatas nuevas

| ID | Propuesta | Estado |
|---|---|---|
| `CAND-09-NUT-A` | objetivo = decisión profesional; BE no calcula requerimiento | DERIVADA |
| `CAND-09-NUT-B` | A+C P0; B estructurada/habilitable después | PROPUESTA RECOMENDADA |
| `CAND-09-NUT-C` | contraste exclusivamente descriptivo | DERIVADA |
| `CAND-09-NUT-D` | ausencia de registro = `NO_DATA` | DERIVADA |
| `CAND-09-NUT-E` | recurso = execution/intake, no adherence score | PROPUESTA RECOMENDADA |
| `CAND-09-NUT-F` | corrección acotada para modalidad C | PROPUESTA RECOMENDADA |
| `CAND-09-NUT-G` | Today no elige Día tipo sin regla canónica | PROPUESTA RECOMENDADA |

---

# 36. Conteo P0

Base actual:

```text
86 operaciones P0 candidatas
```

Si la corrección de modalidad C queda P0:

```text
87
```

El incremento materializa una conducta explícita de dominio, no una ampliación arbitraria.

---

# 37. Estado de salida

```text
BE-LEG-09:
EN DESARROLLO

ACC/PRO/REL/CON:
DETALLADOS EN v0.8

NUTRICIÓN:
DETALLADA EN v0.9

RUTAS NUTRICIÓN P0:
20 BASE
+ 1 CORRECCIÓN CONDICIONADA A MODALIDAD C

OBJETIVO:
VERSIONADO / PROFESIONAL / NO CALCULADO POR BE

PLAN:
DRAFT → VALIDATE → ACTIVATE
CON SNAPSHOT REPRODUCIBLE

EJECUCIÓN:
A / B / C
SIN SCORE

REVISIÓN:
DEC-043 + APPLY SEPARADO

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRATOS P0 DE ENTRENAMIENTO
```

---

*Fin de BE-LEG-09 v0.9 — Contratos P0 de Nutrición.*
