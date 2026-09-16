# BE-LEG-09 v0.11 — Contratos P0 de Antropometría y Proyecciones

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09`  
> **Versión:** `v0.11 — CONTRATOS P0 DE ANTROPOMETRÍA Y PROYECCIONES`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PENDIENTE DE CONTRARREVISIÓN`  
> **Consume:** v0.7 contrato transversal + v0.8 acceso/gobierno + v0.9 Nutrición + v0.10 Entrenamiento + BE-LEG-05/06/07/08  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Completar el último bloque funcional P0 del BE-LEG-09 antes de la trazabilidad integral.

Esta versión cubre:

```text
ANTROPOMETRÍA
evaluación
→ medición directa
→ cálculo derivado reproducible
→ corrección
→ recálculo dependiente
→ comparabilidad
→ evolución longitudinal

PROYECCIONES
fuentes de dominio
→ derivación sin autoridad de escritura
→ vista total o parcial autorizada
→ cartera
→ pendientes
→ dashboard
→ timeline
→ progreso propio
→ ocho proyecciones obligatorias de M-11
```

No define UI, gráficos, assets, fórmulas profesionales no aprobadas ni persistencia física.

---

# 1. Autoridades consumidas

## 1.1 Antropometría

Se consumen:

- `UC-P19` — registrar evaluación antropométrica;
- `UC-P20` — consultar evolución;
- `UC-E03` / `UC-I12` — corrección trazable;
- `UC-I09` — cálculo reproducible;
- `RF-047…RF-050`;
- `B-10 / M-09` — 25 unidades canónicas;
- `REG-06-151…172`;
- `INV-06-166…182`.

Reglas vinculantes:

- medición directa ≠ cálculo derivado;
- protocolo identificado;
- método/fórmula/versionado;
- unidad de origen preservada;
- conversión explícita;
- precisión/redondeo reproducibles;
- dependencias reconstruibles;
- recálculo selectivo al corregir;
- no overwrite;
- comparabilidad demostrable;
- `SIN_DATO ≠ 0`;
- cero interpolación/imputación/arrastre/completado;
- importación controlada externa con procedencia.

## 1.2 Proyecciones / M-11

Se consumen las ocho proyecciones obligatorias:

1. volumen por ejercicio y período;
2. volumen por Zona muscular y período;
3. volumen efectivo frente a total;
4. progresión de carga, repeticiones y RIR;
5. marcas personales;
6. distribución de trabajo por Zona;
7. evolución antropométrica;
8. contraste prescrito frente a consumido.

Todas son:

- derivadas;
- sin autoridad de escritura;
- sin score global;
- sin inferir datos ausentes;
- compatibles con vista parcial;
- visualmente representadas recién por Documento 10.

---

# 2. Candidatas de diseño de esta versión

## CAND-09-ANT-A — Una evaluación antropométrica entra como acto coherente

**PROPUESTA RECOMENDADA.**

La API no obliga a orquestar:

```text
crear evaluation
→ subir measurements
→ ejecutar calculate
```

como tres pasos HTTP públicos.

P0 usa una operación coherente:

```text
POST /advisees/{id}/anthropometry/evaluations
```

que recibe mediciones directas/importación controlada y produce los cálculos derivados que la especificación seleccionada pueda emitir.

---

## CAND-09-ANT-B — Protocolos/métodos se descubren por especificación versionada

**PROPUESTA RECOMENDADA.**

Se agrega:

```text
GET /anthropometry/specifications
```

para que los clientes first-party no hardcodeen protocolos, métodos, unidades esperadas ni versiones.

---

## CAND-09-ANT-C — Corrección apunta al dato fuente y recálculo depende del grafo

**DERIVADA DE 06.**

No se “edita el porcentaje de grasa”.

Si cambia una medición directa:

```text
correction
→ new effective direct measurement
→ identify dependent derived results
→ recalculate applicable results
→ preserve old results
```

---

## CAND-09-PRJ-A — Una ruta tipada cubre las ocho proyecciones profundas

**PROPUESTA RECOMENDADA.**

En lugar de ocho endpoints paralelos:

```text
GET /advisees/{id}/projections/{projectionKey}
```

con `projectionKey` cerrado y response discriminada.

Esto evita endpoint soup sin convertir todas las proyecciones en un blob genérico.

---

## CAND-09-PRJ-B — Umbral de volumen efectivo es configuración versionada del profesional

**DERIVADA DE M-11; materialización propuesta.**

Se agregan:

```text
GET   /me/training/projection-settings
PATCH /me/training/projection-settings
```

para que el profesional configure el umbral sin que BE decida qué serie es efectiva.

---

# 3. Schemas antropométricos comunes

## 3.1 `AnthropometrySpecificationSummary`

```json
{
  "specificationId": "aspec_...",
  "versionId": "aspecv_...",
  "protocol": {
    "code": "...",
    "label": "..."
  },
  "directMeasurements": [
    {
      "metricCode": "BODY_MASS",
      "expectedUnit": "kg",
      "required": true
    }
  ],
  "derivedMethods": [
    {
      "methodCode": "...",
      "methodVersionId": "mthv_...",
      "resultMetricCodes": []
    }
  ]
}
```

La especificación no obliga a un método profesional universal; describe qué contenido versionado está disponible/validado en BE.

---

## 3.2 `DirectAnthropometricMeasurement`

```json
{
  "measurementId": "ameas_...",
  "metricCode": "...",
  "value": 0,
  "unit": "cm",
  "protocolReference": {
    "specificationVersionId": "aspecv_..."
  },
  "occurredAt": "...",
  "recordedAt": "...",
  "source": {
    "type": "DIRECT_ENTRY"
  }
}
```

### Regla

`value: 0` solo se conserva cuando **cero es un valor real permitido para esa métrica**.

Ausencia:

```text
item no presente / dataState NO_DATA
```

Nunca:

```text
missing → 0
```

---

## 3.3 `DerivedAnthropometricResult`

```json
{
  "derivedResultId": "ader_...",
  "metricCode": "...",
  "value": 0,
  "unit": "...",
  "method": {
    "methodCode": "...",
    "methodVersionId": "mthv_..."
  },
  "formulaVersionId": "frmv_...",
  "inputs": [
    {
      "measurementId": "ameas_...",
      "metricCode": "...",
      "value": 0,
      "unit": "..."
    }
  ],
  "precision": {
    "scale": 2,
    "roundingMode": "..."
  },
  "calculatedAt": "...",
  "supersedesDerivedResultId": null
}
```

Debe poder reconstruirse exactamente qué produjo el resultado.

---

# 4. Origen de captura

Enum técnico propuesto:

```text
DIRECT_ENTRY
CONTROLLED_IMPORT
```

## 4.1 Direct entry

Captura first-party realizada dentro de BE.

## 4.2 Controlled import

```json
{
  "source": {
    "type": "CONTROLLED_IMPORT",
    "preparationReference": "prep_...",
    "provenance": {
      "originLabel": "...",
      "importedBy": "id_...",
      "preparedAt": null
    }
  }
}
```

### Reglas

La API:

- no presupone CSV/XLSX/JSON;
- no presupone columnas;
- no presupone herramienta/proveedor;
- exige referencia/procedencia reconstruible;
- clasifica cada entrada antes de incorporarla;
- no inventa protocolo/método/unidad faltante.

---

# 5. API-ANT-01 — Consultar especificaciones disponibles

```http
GET /api/v1/anthropometry/specifications?limit=&cursor=&status=
```

### AuthN

`SESSION`

### Response

Cursor paginado:

```json
{
  "data": [],
  "page": {}
}
```

### Uso

Permite al profesional seleccionar una especificación/protocolo/métodos admitidos sin hardcodear contenido técnico en Web/Mobile.

### Regla

Publicar una nueva versión no modifica evaluaciones anteriores.

### Audit

`BEST_EFFORT_TECHNICAL`

---

# 6. API-ANT-02 — Crear evaluación antropométrica

```http
POST /api/v1/advisees/{adviseeId}/anthropometry/evaluations
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### PDP

Requiere:

```text
professional identity
+ valid session/account
+ anthropometry capacity verified/enabled
+ operational relationship
+ applicable scope
+ B2
+ purpose
+ pertinence
```

Antropometría continúa siendo capacidad transversal, no tercera especialidad.

### Request conceptual

```json
{
  "occurredAt": "...",
  "specificationVersionId": "aspecv_...",
  "source": {
    "type": "DIRECT_ENTRY"
  },
  "directMeasurements": [
    {
      "metricCode": "...",
      "value": 0,
      "unit": "..."
    }
  ],
  "requestedDerivedMethods": [
    {
      "methodVersionId": "mthv_..."
    }
  ],
  "professionalNotes": "..."
}
```

### Importación controlada

La misma operación acepta:

```json
{
  "source": {
    "type": "CONTROLLED_IMPORT",
    "preparationReference": "prep_...",
    "provenance": {}
  },
  "importedItems": [
    {
      "declaredKind": "DIRECT_MEASUREMENT",
      "metricCode": "...",
      "value": 0,
      "unit": "...",
      "availableMethodMetadata": null
    }
  ]
}
```

El backend decide qué puede incorporarse de forma válida bajo la especificación declarada.

### Frontera transaccional

1. PDP/capacidad;
2. validar especificación vigente referenciada;
3. validar clasificación direct/derived;
4. conservar unidad original/procedencia;
5. persistir mediciones directas;
6. construir grafo de dependencias aplicable;
7. calcular derivados solicitados válidos;
8. guardar método/version/input/precision;
9. emitir acontecimiento/auditoría;
10. commit.

### Success

`201`

```json
{
  "data": {
    "evaluationId": "aeval_...",
    "version": "v_...",
    "occurredAt": "...",
    "recordedAt": "...",
    "specificationVersionId": "aspecv_...",
    "directMeasurements": [],
    "derivedResults": [],
    "importSummary": null
  }
}
```

Para importación:

```json
{
  "importSummary": {
    "received": 10,
    "incorporated": 8,
    "rejected": 2,
    "issues": []
  }
}
```

No se declara incorporado un dato que el dominio no pudo clasificar.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 ANTHROPOMETRY_EVALUATION_INVALID
422 ANTHROPOMETRY_SPECIFICATION_NOT_AVAILABLE
422 DIRECT_MEASUREMENT_INVALID
422 UNIT_NOT_COMPATIBLE
422 IMPORT_ITEM_NOT_CLASSIFIABLE
422 DERIVED_METHOD_INPUTS_INSUFFICIENT
422 ANTHROPOMETRY_CAPACITY_NOT_OPERATIONAL
```

### Audit

`REQUIRED_SAME_TX`

---

# 7. API-ANT-03 — Listar evaluaciones

```http
GET /api/v1/advisees/{adviseeId}/anthropometry/evaluations?limit=&cursor=
```

### AuthN

- profesional: `SESSION_MFA`;
- asesorado propio: `SESSION` cuando la proyección corresponda.

### Response item

```json
{
  "evaluationId": "aeval_...",
  "occurredAt": "...",
  "recordedAt": "...",
  "specificationVersionId": "aspecv_...",
  "author": {},
  "sourceType": "DIRECT_ENTRY",
  "summary": {}
}
```

Cursor paginado.

---

# 8. API-ANT-04 — Consultar evaluación

```http
GET /api/v1/anthropometry/evaluations/{evaluationId}
```

### Anti-enumeration

```text
missing / not revealable
→ 404 RESOURCE_NOT_FOUND
```

### Response

```json
{
  "data": {
    "evaluationId": "aeval_...",
    "specification": {},
    "directMeasurements": [],
    "derivedResults": [],
    "correctionChain": [],
    "comparabilityMetadata": {}
  }
}
```

Actor y pertinencia determinan la proyección.

---

# 9. Corrección antropométrica

## API-ANT-05

```http
POST /api/v1/anthropometry/evaluations/{evaluationId}/corrections
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA` para profesional; otros actores solo si 08/06 lo habilitan expresamente.

### Request

```json
{
  "reason": "...",
  "corrections": [
    {
      "targetType": "DIRECT_MEASUREMENT",
      "targetId": "ameas_...",
      "replacement": {
        "value": 0,
        "unit": "..."
      }
    }
  ]
}
```

También puede corregir metadatos reconstruibles cuando el patrón canónico lo permita, sin convertir un cálculo en medición directa.

### Regla de recálculo

El backend:

```text
correction target
→ resolve effective replacement
→ dependency graph
→ identify affected derived results
→ recalculate only affected nodes
→ persist new derived results
→ preserve original values/results
```

### Success

`201`

```json
{
  "data": {
    "correctionId": "acor_...",
    "evaluationId": "aeval_...",
    "effectiveVersion": "v_...",
    "recalculatedDerivedResults": []
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 CORRECTION_TARGET_INVALID
422 CORRECTION_CHAIN_NOT_RESOLVABLE
422 RECALCULATION_INPUTS_INSUFFICIENT
422 UNIT_NOT_COMPATIBLE
```

### Regla crítica

Una cadena rota/ambigua:

```text
NO se resuelve por last timestamp
```

### Audit

`REQUIRED_SAME_TX`

---

# 10. Comparabilidad

La API no devuelve simplemente:

```text
comparable: true
```

sin fundamento.

Shape:

```json
{
  "comparability": {
    "state": "COMPARABLE",
    "basis": {
      "protocolCompatibility": "COMPATIBLE",
      "methodCompatibility": "COMPATIBLE",
      "unitCompatibility": "COMPATIBLE"
    }
  }
}
```

Estados técnicos propuestos:

```text
COMPARABLE
PARTIALLY_COMPARABLE
NOT_COMPARABLE
INSUFFICIENT_INFORMATION
```

### Regla

Comparabilidad exige compatibilidad demostrable en:

- protocolo;
- método/versionado cuando corresponde;
- unidad/conversión reproducible.

No comparables permanecen visibles como datos históricos; simplemente no se fusionan en una serie engañosa.

---

# 11. API-ANT-06 — Evolución antropométrica

```http
GET /api/v1/advisees/{adviseeId}/anthropometry/progress?metric=&periodStart=&periodEnd=
```

### AuthN

- profesional autorizado: `SESSION_MFA`;
- asesorado propio: `SESSION`.

### Response

```json
{
  "data": {
    "metricCode": "...",
    "period": {},
    "series": [
      {
        "occurredAt": "...",
        "recordedAt": "...",
        "value": 0,
        "unit": "...",
        "sourceEvaluationId": "aeval_...",
        "comparabilityGroup": "cmp_...",
        "correctionState": "EFFECTIVE"
      }
    ],
    "gaps": [
      {
        "from": "...",
        "to": "...",
        "state": "NO_DATA"
      }
    ],
    "comparability": {
      "groups": []
    },
    "partialView": false
  }
}
```

### Prohibiciones

Nunca:

- interpolar;
- imputar;
- rellenar con cero;
- arrastrar último valor;
- crear mediciones artificiales;
- mezclar grupos no comparables como una sola serie.

### Audit

Lectura sensible según 08.

---

# 12. Read models — regla común

Todo read model P0 declara:

```json
{
  "generatedAt": "...",
  "partialView": false,
  "sourceDomains": [],
  "sourceReferences": []
}
```

Puede omitir referencias masivas del body y ofrecerlas de forma compacta, pero deben ser reconstruibles internamente.

### `partialView`

`true` significa:

> la proyección fue construida correctamente usando únicamente el subconjunto de fuentes que el actor está autorizado a consultar.

No significa:

> error incompleto.

Una proyección parcial nunca usa datos ocultos para calcular un agregado que luego se muestre sin el detalle.

---

# 13. API-DSH-01 — Cartera profesional

```http
GET /api/v1/me/caseload?limit=&cursor=&scope=&processState=&reviewPending=
```

### AuthN

`SESSION_MFA`

### Response item

```json
{
  "advisee": {
    "identityId": "id_...",
    "displayName": "..."
  },
  "relationship": {
    "relationshipId": "rel_...",
    "scope": {},
    "state": "..."
  },
  "process": {
    "processId": "proc_...",
    "state": "..."
  },
  "review": {
    "pending": true,
    "lastValidReviewAt": "...",
    "nextAction": {}
  },
  "availability": {
    "hasNutritionData": true,
    "hasTrainingData": false,
    "hasAnthropometryData": true
  }
}
```

### Orden/filtros permitidos

Por datos reales, por ejemplo:

- nombre;
- dominio/scope;
- existencia de pendiente;
- fecha real;
- estado operativo;
- disponibilidad de información.

### Prohibido

- gravedad clínica;
- riesgo médico inferido;
- “peor asesorado”;
- score global.

---

# 14. API-DSH-02 — Cola de revisiones

```http
GET /api/v1/me/review-queue?limit=&cursor=&domain=&status=
```

### Semántica

Consume la definición de pendiente del dominio de revisión.

No crea una regla nueva de “pendiente”.

### Response

```json
{
  "data": [
    {
      "advisee": {},
      "domain": "TRAINING",
      "pendingSince": "...",
      "reason": {
        "code": "REVIEW_DUE"
      },
      "sourceReferences": []
    }
  ],
  "page": {}
}
```

Abrir/consultar este endpoint no resuelve el pendiente.

---

# 15. API-DSH-03 — Dashboard interdisciplinario

```http
GET /api/v1/advisees/{adviseeId}/dashboard?periodStart=&periodEnd=
```

### AuthN

`SESSION_MFA`

### PDP

Se evalúa por categoría/pertinencia.

### Response conceptual

```json
{
  "data": {
    "advisee": {},
    "period": {},
    "partialView": true,
    "domains": {
      "nutrition": {
        "available": true,
        "summary": {}
      },
      "training": {
        "available": true,
        "summary": {}
      },
      "anthropometry": {
        "available": false,
        "reason": "NOT_AVAILABLE_TO_VIEW"
      }
    },
    "reviews": {},
    "nextActions": [],
    "projectionAvailability": [
      {
        "key": "TRAINING_VOLUME_BY_EXERCISE",
        "available": true
      }
    ]
  }
}
```

### Regla crítica

Dashboard:

```text
read model
≠ source of truth
≠ review
≠ clinical score
```

No existe:

```text
overallHealthScore
overallCompliance
globalRisk
```

---

# 16. API-DSH-04 — Timeline longitudinal

```http
GET /api/v1/advisees/{adviseeId}/timeline?limit=&cursor=&domain=&type=&periodStart=&periodEnd=
```

### Entry

```json
{
  "timelineEntryId": "projection-only-id",
  "domain": "ANTHROPOMETRY",
  "eventType": "...",
  "source": {
    "type": "EVALUATION",
    "id": "aeval_..."
  },
  "occurredAt": "...",
  "recordedAt": "...",
  "author": {},
  "provenance": {},
  "relations": []
}
```

### Regla

`occurredAt` y `recordedAt` son independientes.

Si uno es desconocido:

```text
null/ausente según schema
```

No se copia el otro.

### Relaciones

Solo se muestran si las fuentes ya contienen relación reconstruible:

- plan→execution;
- evaluation→derived result;
- original→correction;
- review→applied action.

No se infiere causalidad por cercanía temporal.

---

# 17. API-DSH-05 — Progreso longitudinal propio

```http
GET /api/v1/me/progress?domain=&projection=&periodStart=&periodEnd=
```

### AuthN

`SESSION`

### Actor

Asesorado titular.

### Response

Puede incluir proyecciones propias permitidas de:

- Nutrición;
- Entrenamiento;
- Antropometría.

### Regla

No usa un score agregado para mezclar dominios.

Ejemplo:

```json
{
  "data": {
    "period": {},
    "domains": [
      {
        "domain": "ANTHROPOMETRY",
        "dataState": "AVAILABLE",
        "series": []
      },
      {
        "domain": "TRAINING",
        "dataState": "NO_DATA"
      }
    ]
  }
}
```

---

# 18. ProjectionKey — taxonomía cerrada P0

```text
TRAINING_VOLUME_BY_EXERCISE
TRAINING_VOLUME_BY_MUSCLE_ZONE
TRAINING_EFFECTIVE_VS_TOTAL_VOLUME
TRAINING_PROGRESSION_BY_EXERCISE
TRAINING_PERSONAL_RECORDS
TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE
ANTHROPOMETRY_LONGITUDINAL
NUTRITION_PRESCRIBED_VS_RECORDED
```

No se agregan proyecciones nuevas sin reconciliar M-11.

---

# 19. API-PRJ-01 — Consultar proyección profunda

```http
GET /api/v1/advisees/{adviseeId}/projections/{projectionKey}?periodStart=&periodEnd=&exerciseId=&zoneId=&metric=
```

### AuthN

`SESSION_MFA`

### Filtros

Solo los aplicables al `projectionKey`; filtro desconocido/no aplicable:

```text
400 INVALID_REQUEST
```

### Response base

```json
{
  "data": {
    "projectionKey": "TRAINING_VOLUME_BY_EXERCISE",
    "period": {},
    "partialView": false,
    "derivation": {
      "specificationId": "...",
      "version": "..."
    },
    "result": {}
  }
}
```

`result` es una unión discriminada por `projectionKey`, no un JSON arbitrario.

---

# 20. Ocho proyecciones — contrato de resultado

## 20.1 Volumen por ejercicio

```json
{
  "exerciseId": "ex_...",
  "observedVolume": {
    "value": 0,
    "unit": "..."
  },
  "sourceSetIds": [],
  "dataState": "AVAILABLE"
}
```

Solo se produce si existe especificación de derivación trazable.

No rellena carga/repeticiones faltantes.

---

## 20.2 Volumen por Zona

```json
{
  "zoneId": "zone_...",
  "contributions": [
    {
      "role": "PRIMARY",
      "value": 0
    },
    {
      "role": "SECONDARY",
      "value": 0
    }
  ],
  "weightingApplied": false
}
```

`PRIMARY/SECONDARY` no implica coeficiente.

Si una especificación profesional futura define ponderaciones, se versiona y declara.

---

## 20.3 Volumen efectivo vs total

```json
{
  "thresholdSpecification": {
    "id": "thr_...",
    "version": "v_...",
    "criterion": "RIR",
    "configuredBy": "pro_..."
  },
  "observedTotal": {},
  "evaluable": {},
  "effective": {},
  "notClassifiable": {}
}
```

Una serie sin dato requerido:

```text
notClassifiable
```

No efectiva/infectiva por inferencia.

---

## 20.4 Progresión de carga/reps/RIR

```json
{
  "exerciseId": "ex_...",
  "series": {
    "load": [],
    "repetitions": [],
    "rir": []
  },
  "gaps": []
}
```

Cero interpolación.

---

## 20.5 Marcas personales

```json
{
  "exerciseId": "ex_...",
  "records": [
    {
      "recordType": "...",
      "value": {},
      "sourceExecutionId": "texec_...",
      "occurredAt": "..."
    }
  ]
}
```

La definición del `recordType` debe provenir de una especificación aprobada; el 09 no inventa qué constituye PR.

---

## 20.6 Distribución de trabajo por Zona

```json
{
  "zones": [
    {
      "zoneId": "zone_...",
      "observedContribution": {},
      "roles": {}
    }
  ]
}
```

La representación visual del “mapa de intensidad” pertenece al 10.

API devuelve datos, no colores/máscaras.

---

## 20.7 Evolución antropométrica

Reutiliza el mismo contrato de honestidad de `API-ANT-06`.

Puede retornar múltiples métricas siempre manteniendo:

- unidad;
- comparability group;
- occurredAt;
- correction state;
- gaps.

No fusiona series no comparables.

---

## 20.8 Prescrito vs consumido

```json
{
  "prescribed": {},
  "recorded": {},
  "differences": [],
  "missing": []
}
```

Sin:

```text
score
grade
compliancePercent
```

---

# 21. Configuración del umbral de efectividad

## API-PRJ-02 — Consultar configuración propia

```http
GET /api/v1/me/training/projection-settings
```

### AuthN

`SESSION_MFA`

### Response

```json
{
  "data": {
    "version": "v_...",
    "effectiveVolume": {
      "thresholdSpecificationId": "thr_...",
      "criterion": "RIR",
      "condition": {}
    }
  }
}
```

---

## API-PRJ-03 — Actualizar configuración

```http
PATCH /api/v1/me/training/projection-settings
```

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "effectiveVolume": {
      "criterion": "RIR",
      "condition": {}
    }
  }
}
```

### Reglas

- decisión profesional;
- versionada;
- autoría;
- no reescribe proyecciones históricas ya materializadas/reproducibles;
- no fija universalmente qué es serie efectiva.

### Errors

```text
409 VERSION_CONFLICT
422 PROJECTION_THRESHOLD_INVALID
```

### Audit

`REQUIRED_SAME_TX`

---

# 22. Estado de datos longitudinales

Taxonomía técnica propuesta:

```text
AVAILABLE
NO_DATA
NOT_COMPARABLE
INSUFFICIENT_INFORMATION
NOT_AVAILABLE_TO_VIEW
```

### Regla

No usar:

```text
0
```

como estado.

`NOT_AVAILABLE_TO_VIEW` se utiliza solo en superficies donde revelar la existencia del dominio/recurso ya es legítimo. En recursos sensibles dirigidos por ID rige anti-enumeración 404.

---

# 23. Proyección parcial

Toda response de proyección puede incluir:

```json
{
  "partialView": true,
  "partialReason": "AUTHORIZATION_SCOPE"
}
```

Pero el detalle de la dimensión de seguridad no se expone si pudiera filtrar datos.

La implementación puede reducirlo externamente a:

```text
partialView: true
```

y conservar la razón en auditoría.

---

# 24. Error registry de Antropometría

```text
ANTHROPOMETRY_EVALUATION_INVALID
ANTHROPOMETRY_SPECIFICATION_NOT_AVAILABLE
DIRECT_MEASUREMENT_INVALID
UNIT_NOT_COMPATIBLE
IMPORT_ITEM_NOT_CLASSIFIABLE
DERIVED_METHOD_INPUTS_INSUFFICIENT
ANTHROPOMETRY_CAPACITY_NOT_OPERATIONAL
CORRECTION_TARGET_INVALID
CORRECTION_CHAIN_NOT_RESOLVABLE
RECALCULATION_INPUTS_INSUFFICIENT
```

---

# 25. Error registry de proyecciones

```text
PROJECTION_NOT_AVAILABLE
PROJECTION_INPUTS_INSUFFICIENT
PROJECTION_SPECIFICATION_NOT_AVAILABLE
PROJECTION_THRESHOLD_REQUIRED
PROJECTION_THRESHOLD_INVALID
PROJECTION_NOT_COMPARABLE
```

### Anti-enumeration

Si conocer que la proyección/recurso existe es sensible:

```text
404 RESOURCE_NOT_FOUND
```

tiene precedencia externa.

---

# 26. AuthN / auditoría

| Operación | AuthN | Audit |
|---|---|---|
| leer specification | SESSION | técnico |
| crear anthropometry evaluation | SESSION_MFA | REQUIRED_SAME_TX |
| leer evaluation/progress | SESSION/SESSION_MFA | según 08 |
| correction | SESSION_MFA | REQUIRED_SAME_TX |
| caseload/review queue/dashboard/timeline | SESSION_MFA | REQUIRED/según 08 |
| own progress | SESSION | según 08 |
| deep projection | SESSION_MFA | REQUIRED/según 08 |
| get projection settings | SESSION_MFA | REQUIRED |
| patch projection settings | SESSION_MFA | REQUIRED_SAME_TX |

---

# 27. Idempotencia / concurrencia

## Antropometría

```text
create evaluation
→ Idempotency-Key

correction
→ Idempotency-Key

effective view
→ correction chain, no latest timestamp
```

## Projection settings

```text
PATCH
→ expectedVersion
```

Read models no requieren Idempotency-Key.

---

# 28. Pruebas obligatorias hacia 11A

## Antropometría

- direct ≠ derived;
- import no cambia semántica por ser import;
- import sin método/unidad no inventa metadata;
- unidad original siempre recuperable;
- conversión reproducible;
- derived conserva method/version/formula/input/precision;
- corrección no borra original;
- recálculo solo en dependientes;
- cadena ambigua no usa último timestamp;
- comparabilidad exige protocolo/método/unidad compatibles;
- no comparable no desaparece;
- NO_DATA ≠ 0;
- no interpolation;
- no carry-forward;
- no synthetic control points.

## Read models

- read model no escribe fuente;
- partial view usa solo fuentes autorizadas;
- hidden source no influye en agregado visible;
- caseload sin clinical severity;
- queue no se resuelve al abrir;
- dashboard sin global score;
- occurredAt ≠ recordedAt;
- timeline no inventa causalidad;
- own progress no mezcla dominios en score;
- ocho ProjectionKey soportadas;
- volume-by-zone no inventa weight;
- effective volume usa threshold profesional;
- missing RIR/RPE → notClassifiable;
- no interpolation en progression;
- muscle map API no contiene asset/color;
- prescribed vs recorded no produce score.

---

# 29. Hallazgos

## H-09-ANT-01 — La v0.6 había reducido demasiado Antropometría

Crear la evaluación como operación única sigue siendo correcto, pero el cliente necesita descubrir protocolos/métodos versionados.

Se incorpora:

```text
GET /anthropometry/specifications
```

sin reabrir el lifecycle artificial `create→measure→calculate`.

---

## H-09-PRJ-01 — Las ocho proyecciones necesitan una superficie profunda

Dashboard y `/me/progress` no deben absorber todos los resultados analíticos.

Se incorpora:

```text
GET /advisees/{id}/projections/{projectionKey}
```

como única puerta tipada.

---

## H-09-PRJ-02 — Volumen efectivo necesita escribir una configuración profesional

La proyección exige un umbral profesional reproducible.

Por eso se incorporan dos operaciones de settings.

No hacerlo obligaría al servidor a:

- inventar el umbral;
- hardcodearlo;
- o recibirlo como query efímera no versionada.

Las tres alternativas contradicen M-11.

---

# 30. Conteo actualizado P0

Base posterior a v0.8:

```text
86
```

Nutrición modalidad C — correction propuesta P0:

```text
+1
```

Antropometría specification discovery:

```text
+1
```

Deep projections:

```text
+1
```

Projection settings:

```text
+2
```

Total candidato si se ratifican todas:

```text
91 operaciones P0
```

### Interpretación

El aumento no revierte la reducción adversarial:

- 1 materializa contenido antropométrico versionado necesario;
- 1 agrupa ocho read models obligatorios;
- 2 evitan que BE invente el umbral profesional;
- 1 materializa una conducta explícita de modalidad C.

No se agregaron ocho endpoints de proyección.

---

# 31. Candidatas nuevas

| ID | Propuesta | Estado |
|---|---|---|
| `CAND-09-ANT-A` | creación antropométrica coherente en una operación | PROPUESTA RECOMENDADA |
| `CAND-09-ANT-B` | discovery de specifications versionadas | PROPUESTA RECOMENDADA |
| `CAND-09-ANT-C` | correction→dependency graph→selective recalc | DERIVADA |
| `CAND-09-PRJ-A` | una ruta tipada para ocho proyecciones | PROPUESTA RECOMENDADA |
| `CAND-09-PRJ-B` | threshold profesional versionado | DERIVADA / materialización propuesta |
| `CAND-09-PRJ-C` | estado longitudinal `AVAILABLE/NO_DATA/...` | PROPUESTA DE NAMING |
| `CAND-09-PRJ-D` | partialView explícita | DERIVADA / materialización propuesta |

---

# 32. Qué queda fuera

P1:

- publicación limitada de servicio antropométrico;
- descubrimiento geográfico;
- Google Maps;
- marketplace inexistente;
- reservas/turnos/pagos/ranking/reseñas/contratación;
- TVCC-30 HTTP.

Documento 10:

- mapas musculares;
- gráficos;
- escalas visuales;
- colores;
- cards;
- orden UI;
- elección de visualización.

Documento 12:

- definición analítica final de TVCC-30.

---

# 33. Estado de salida

```text
BE-LEG-09:
EN DESARROLLO

ACC/PRO/REL/CON:
DETALLADOS v0.8

NUTRICIÓN:
DETALLADA v0.9

ENTRENAMIENTO:
DETALLADO v0.10

ANTROPOMETRÍA:
DETALLADA v0.11

READ MODELS:
DETALLADOS v0.11

OCHO PROYECCIONES M-11:
CONTRATO API DEFINIDO

P0 CANDIDATO:
91 SI SE RATIFICAN TODAS LAS ADICIONES

LONGITUDINAL:
NO_DATA ≠ 0
SIN INTERPOLACIÓN
COMPARABILIDAD EXPLÍCITA

PROJECTIONS:
SIN WRITE AUTHORITY
SIN GLOBAL SCORE
SIN DATOS INVENTADOS

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
TRAZABILIDAD INTEGRAL + CONSOLIDACIÓN + CONTRARREVISIÓN
```

---

*Fin de BE-LEG-09 v0.11 — Contratos P0 de Antropometría y Proyecciones.*
