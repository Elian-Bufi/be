# BE-LEG-09 v0.7 — Contrato transversal API v1

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** BE-LEG-09  
> **Versión:** `v0.7 — CONTRATO TRANSVERSAL V1`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PROPUESTA PARA REVISIÓN`  
> **Consume:** v0.6 superficie P0 reducida + 06/08/07  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Definir las reglas que todas las operaciones API v1 deben compartir antes de redactar schemas específicos de Nutrición, Entrenamiento, Antropometría, vínculos, consentimiento y administración.

La finalidad es evitar que cada vertical invente:

- su propio envelope;
- sus propios errores;
- su propia semántica de retry;
- su propia paginación;
- su propia autorización;
- su propia concurrencia.

---

# 1. Transporte y media type

## CAND-09-T01

API de aplicación:

```text
HTTPS
/api/v1
application/json; charset=utf-8
```

Request:

```http
Accept: application/json
Content-Type: application/json
Authorization: Bearer <token-or-session-credential>
```

El mecanismo concreto de credencial puede variar sin cambiar la semántica pública de autorización.

---

# 2. Success envelope

## CAND-09-T02

Recurso/resultado:

```json
{
  "data": {
    "id": "..."
  }
}
```

Colección:

```json
{
  "data": [],
  "page": {
    "limit": 25,
    "nextCursor": null,
    "hasMore": false
  }
}
```

Sin representación útil:

```text
204 No Content
```

No se agregan:

```text
success
httpStatus
serverTimestamp
message
```

si son redundantes.

---

# 3. ErrorEnvelope

## CAND-09-T03

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The resource changed. Reload and try again.",
    "details": {
      "currentVersion": "opaque"
    }
  }
}
```

Reglas:

1. `code` = contrato machine-readable estable.
2. `message` = seguro para mostrar o transformar; no se usa para lógica.
3. `details` = opcional y schema-specific.
4. nunca contiene:
   - stack;
   - SQL;
   - nombres de tablas;
   - Prisma errors;
   - secretos;
   - infraestructura sensible;
   - razón interna de autorización si revela información.
5. un status HTTP puede tener múltiples `error.code`.

---

# 4. Registro transversal base de errores

## 4.1 Request / schema

| HTTP | `error.code` | Uso |
|---|---|---|
| 400 | `INVALID_REQUEST` | JSON/shape/parámetros inválidos |
| 400 | `UNKNOWN_FIELD` | campo no permitido cuando la validación estricta lo detecta |
| 400 | `INVALID_CURSOR` | cursor inválido/ajeno a la consulta |

## 4.2 Sesión

| HTTP | Código |
|---|---|
| 401 | `AUTHENTICATION_REQUIRED` |
| 401 | `SESSION_INVALID` |
| 401 | `SESSION_EXPIRED` |
| 401 | `SESSION_REVOKED` |

## 4.3 Step-up

| HTTP | Código |
|---|---|
| 403 | `MFA_REQUIRED` |
| 403 | `STEP_UP_REQUIRED` |
| 403 | `ACTION_FORBIDDEN` — solo cuando la prohibición puede revelarse sin filtrar existencia |

## 4.4 Recursos sensibles

| HTTP | Código |
|---|---|
| 404 | `RESOURCE_NOT_FOUND` |

Este código también cubre un recurso existente pero no revelable.

## 4.5 Estado/concurrencia

| HTTP | Código |
|---|---|
| 409 | `VERSION_CONFLICT` |
| 409 | `RESOURCE_CONFLICT` |
| 409 | `IDEMPOTENCY_KEY_REUSED` |
| 422 | `INVALID_STATE_TRANSITION` |
| 422 | `OPERATION_NOT_READY` |
| 422 | `VALIDATION_FAILED` cuando una operación exige validez para continuar |

## 4.6 Capacidad / disponibilidad

| HTTP | Código |
|---|---|
| 429 | `RATE_LIMITED` |
| 503 | `DB_UNAVAILABLE` |
| 503 | `DEPENDENCY_UNAVAILABLE` |
| 500 | `INTERNAL_ERROR` |

Los errores de dominio específicos se registrarán por familia sin redefinir estos códigos base.

---

# 5. HTTP status contract

## CAND-09-T04

| Status | Semántica |
|---|---|
| 200 | lectura/comando exitoso con representación |
| 201 | recurso creado |
| 204 | operación exitosa sin body |
| 400 | request estructural inválido |
| 401 | identidad/sesión inválida |
| 403 | actor autenticado requiere step-up o acción conocida prohibida sin riesgo de enumeración |
| 404 | no existe o no es revelable |
| 409 | conflicto técnico/competitivo/replay incompatible |
| 422 | request estructuralmente válido pero transición/operación de dominio no puede ejecutarse |
| 429 | throttling |
| 500 | falla no clasificada |
| 503 | dependencia indispensable no disponible |

`202 Accepted` se reserva para trabajos realmente asíncronos futuros. No se usa para ocultar latencia normal.

---

# 6. Validación explícita

## CAND-09-T05

`POST .../validate` no produce un error HTTP porque el borrador esté incompleto.

Ejemplo:

```json
{
  "data": {
    "valid": false,
    "issues": [
      {
        "code": "REQUIRED_SECTION_MISSING",
        "path": "meals[2]"
      }
    ]
  }
}
```

Status:

```text
200
```

Porque la operación “validar” funcionó.

En cambio:

```text
POST .../activate
```

sobre el mismo borrador inválido:

```text
422 OPERATION_NOT_READY
```

con issues permitidos.

---

# 7. VersionToken y concurrencia

## CAND-09-T06

Todo recurso mutable sujeto a carrera expone:

```json
{
  "id": "res_...",
  "version": "v_opaque"
}
```

Escritura:

```json
{
  "expectedVersion": "v_opaque"
}
```

No se define públicamente si el token proviene de:

- `version Int`;
- hash;
- UUID;
- timestamp interno.

Si no coincide:

```http
409
```

```json
{
  "error": {
    "code": "VERSION_CONFLICT",
    "message": "The resource changed. Reload and try again."
  }
}
```

El cliente no hace blind retry de un conflicto de versión.

---

# 8. Idempotency-Key

## CAND-09-T07

Header:

```http
Idempotency-Key: <opaque>
```

Aplicación selectiva.

### Obligatoria candidata

- activaciones con efectos múltiples;
- ejecución nutricional única/reintentable;
- confirmación de ejecución de entrenamiento;
- solicitudes de cierre;
- otras creaciones de hecho donde un retry pueda duplicar efectos.

### Semántica

Primera request:

```text
key K + payload hash H
→ ejecutar
→ persistir resultado lógico
```

Replay:

```text
key K + mismo actor/contexto + mismo H
→ devolver mismo resultado lógico
→ no repetir efectos
```

Reuso incompatible:

```text
key K + payload/contexto distinto
→ 409 IDEMPOTENCY_KEY_REUSED
```

La key no sustituye:

- unique constraint;
- transacción;
- `expectedVersion`.

---

# 9. Retry matrix

## CAND-09-T08

| Clase | Retry automático |
|---|---|
| `GET` | sí ante fallo de red/503, con backoff acotado |
| `PUT` de recurso singular idempotente | sí si el body es idéntico y el contrato lo declara |
| `DELETE` idempotente | sí |
| `PATCH` versionado | solo si no hubo respuesta y se conserva `expectedVersion`; conflicto requiere relectura |
| `POST` sin Idempotency-Key | no automáticamente |
| `POST` con Idempotency-Key | sí ante incertidumbre de red |
| `validate` | sí |
| `activate/confirm` | solo con Idempotency-Key cuando se marque |

`4xx` semánticos no se reintentan automáticamente salvo que el cliente cambie precondición/request.

---

# 10. Cursor pagination

## CAND-09-T09

Request:

```text
?limit=25&cursor=<opaque>
```

Response:

```json
{
  "data": [],
  "page": {
    "limit": 25,
    "nextCursor": "opaque-or-null",
    "hasMore": true
  }
}
```

Reglas:

- default y max server-side;
- cursor opaco;
- orden estable;
- ligado a filtros/orden/actor/contexto cuando sea necesario;
- cursor inválido → `400 INVALID_CURSOR`;
- sin `take:100` silencioso;
- no revelar counts de recursos invisibles.

`total` no forma parte del envelope estándar porque:
- puede ser costoso;
- puede filtrar información;
- no siempre aporta valor.

Una operación puede declararlo explícitamente si es seguro/necesario.

---

# 11. Filtros y sort

## CAND-09-T10

Solo allowlist documentada.

Ejemplo:

```text
?status=ACTIVE&sort=-createdAt
```

No se acepta:

```text
?where=...
?orderBy=...
```

ni expresión ORM expuesta.

Unknown filter:

```text
400 INVALID_REQUEST
```

---

# 12. Null, ausencia y defaults

## CAND-09-T11

### Ausente

Campo no aplicable/no solicitado/no parte de esa representación.

### `null`

El concepto existe en el schema pero actualmente no tiene valor.

### Defaults

Los defaults de negocio relevantes:

- los aplica el servidor;
- se reflejan en la response;
- no dependen de defaults invisibles de UI.

---

# 13. Server-owned fields

## CAND-09-T12

El cliente nunca controla directamente:

- IDs server-owned;
- `createdAt`;
- `createdBy`;
- `activatedAt`;
- `activatedBy`;
- estados que solo resultan de comandos;
- auditoría;
- cálculo derivado;
- verificación administrativa;
- versión de concurrencia.

Enviar un campo prohibido:

```text
400 UNKNOWN_FIELD
```

o se rechaza por schema estricto equivalente.

No se ignora silenciosamente un campo security-sensitive.

---

# 14. Time contract

## CAND-09-T13

Instante:

```text
RFC 3339 / ISO 8601 con offset inequívoco
```

Preferencia de transporte:

```text
UTC
```

Fecha civil:

```text
YYYY-MM-DD
```

Reglas dependientes del “día”:

- las calcula el servidor;
- usan zona canónica/configurada del contexto;
- no confían en la hora del dispositivo como fuente de verdad.

---

# 15. AuthN levels

## CAND-09-T14

Cada endpoint registra exactamente uno:

### `PUBLIC`
Sin sesión. Aun así puede tener rate limiting y anti-enumeración.

### `SESSION`
Sesión activa y cuenta operativa.

### `SESSION_MFA`
Sesión + MFA válido según política.

### `SESSION_STEP_UP`
Reautenticación/step-up reciente para operación de alto riesgo.

No se interpreta:

```text
JWT válido = actor autorizado
```

---

# 16. PDP/AuthZ

## CAND-09-T15

Para operaciones protegidas sobre datos/acciones de asesorado:

```text
identity
+ session state
+ account state
+ role
+ professional verification
+ relationship
+ scope
+ B2 consent
+ purpose
+ pertinence
+ resource state/ownership
= decision
```

Reglas:

- se evalúa server-side;
- no se confía en claims históricos para permisos revocables;
- revocación/finalización/suspensión afectan la siguiente request;
- `PAUSED`/`FINALIZED` no conservan lectura profesional;
- ausencia de regla = deny;
- la proyección se hace después del PDP.

---

# 17. Anti-enumeración

## CAND-09-T16

Cuando la existencia sea sensible:

```text
resource absent
resource hidden by AuthZ
→ same external contract
```

Normalmente:

```http
404
```

```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Resource not found."
  }
}
```

No incluir:

- `relationshipMissing`;
- `consentMissing`;
- `wrongProfessional`;
- `hiddenByScope`;
- `existsButForbidden`.

Esas razones pueden existir en auditoría interna autorizada.

---

# 18. Request ID / correlation

## CAND-09-T17

Toda request recibe ID server-side.

Response header candidato:

```http
X-Request-Id: req_opaque
```

Propósito:

```text
HTTP
↔ PDP
↔ operación
↔ auditoría
↔ log técnico
```

El request ID:

- no contiene PII;
- no sustituye IDs de negocio;
- puede informarse a soporte.

---

# 19. Auditoría contractual

## CAND-09-T18

BE-LEG-08 decide qué eventos son obligatorios.

BE-LEG-09 exige que cada operación indique:

```text
AUDIT:
NONE
BEST_EFFORT_TECHNICAL
REQUIRED
REQUIRED_SAME_TX
```

Cuando 08 exige auditoría bloqueante:

```text
no audit
→ no success
```

Una respuesta 2xx nunca se emite si la operación obligatoria no pudo dejar la evidencia exigida.

---

# 20. Compatibility

## CAND-09-T19

Dentro de `/api/v1`:

### normalmente compatible

- endpoint nuevo;
- filtro opcional nuevo;
- campo response opcional/tolerable;
- campo request opcional con default server-side compatible.

### requiere análisis

- enum nuevo;
- nuevo error code;
- nueva validación;
- nuevo requisito de auth/MFA.

### breaking

- eliminar/renombrar;
- cambiar tipo/meaning;
- volver requerido;
- cambiar idempotencia;
- cambiar 404→403 revelando existencia;
- cambiar machine code utilizado por el cliente;
- cambiar semántica de transición.

Breaking no migrable:

```text
/api/v2
```

---

# 21. Enums

## CAND-09-T20

Los enums que representan dominio aprobado son contractuales.

Clientes generados deben:

- conocer valores vigentes;
- tener handling defensivo si el generador/cliente lo admite;
- no mapear unknown → valor existente.

Agregar un valor se trata como cambio de compatibilidad que debe verificarse contra consumidores.

---

# 22. Headers contractuales base

| Header | Dirección | Uso |
|---|---|---|
| `Authorization` | request | sesión/credencial |
| `Idempotency-Key` | request selectivo | retry seguro |
| `X-Request-Id` | response | correlación |
| `Content-Type` | ambos | JSON |
| `Accept` | request | JSON |

Headers de rate-limit/cache pueden añadirse después sin convertir infraestructura en lógica de negocio.

---

# 23. OpenAPI anti-drift

## CAND-09-T21

El contrato transversal debe aparecer en el OpenAPI generado:

- envelopes;
- headers;
- auth;
- error schemas;
- cursor;
- version;
- idempotency;
- enums.

Pipeline esperado:

```text
backend contracts
→ generate OpenAPI
→ diff against baseline
→ generate client/types
→ typecheck Web
→ typecheck Mobile
→ contract tests
```

No se permite mantener manualmente otra definición equivalente en los clientes.

---

# 24. Common schemas candidatos

## `VersionedResource`

```json
{
  "id": "opaque",
  "version": "opaque"
}
```

## `PageCursor`

```json
{
  "limit": 25,
  "nextCursor": null,
  "hasMore": false
}
```

## `ValidationIssue`

```json
{
  "code": "REQUIRED_SECTION_MISSING",
  "path": "..."
}
```

## `ValidationResult`

```json
{
  "valid": false,
  "issues": []
}
```

## `ErrorEnvelope`

```json
{
  "error": {
    "code": "STABLE_CODE",
    "message": "Safe message",
    "details": {}
  }
}
```

Estos son shapes conceptuales. OpenAPI final definirá required/nullability/format.

---

# 25. Casos que requieren registro específico por familia

El transversal no puede inventar todos los códigos.

Cada familia deberá agregar:

### Profesional
- presentación no editable;
- evidencia inválida;
- estado de revisión incompatible.

### Vínculo
- transición inválida;
- solicitud expirada si 08/06 la define;
- vínculo incompatible/duplicado.

### Consentimiento
- versión obsoleta;
- alcance/finalidad incompatible.

### Nutrición/Entrenamiento
- borrador no listo;
- plan activo incompatible;
- versión esperada;
- ocurrencia ya ejecutada;
- revisión inválida.

### Antropometría
- medición inválida;
- método no habilitado;
- capacidad ausente;
- corrección incompatible.

Externamente, esos códigos siguen sujetos a anti-enumeración.

---

# 26. Hallazgos

## H-09-T01 — `403` debe ser excepcional en recursos sensibles

No usar `403` como diagnóstico de PDP. Para recursos no revelables, 404.

## H-09-T02 — error code no puede derivarse solo de status

Necesitamos múltiples códigos estables por mismo status.

## H-09-T03 — OpenAPI debe modelar headers

No alcanza con schemas JSON; idempotencia, request ID y auth son parte del contrato.

## H-09-T04 — `expectedVersion` permanece en payload

Aunque HTTP ofrece `ETag/If-Match`, el 07 ya exige versión esperada expuesta en payload. No se introduce un segundo mecanismo competitivo en MVP.

---

# 27. Próximo paso

Aplicar este contrato transversal a las 87 rutas P0.

Orden recomendado:

1. Auth + cuenta;
2. profesional/verificación;
3. vínculo + consentimiento;
4. Nutrición;
5. Entrenamiento;
6. Antropometría;
7. dashboard.

Para cada ruta:

```text
API-09-ID
method/path
AuthN
AuthZ
request
response
errors
version
idempotency
audit
retry
RF/UC
```

Después:

- matriz completa de trazabilidad;
- revisión independiente;
- corrección;
- decisión de Dirección.

---

# 28. Estado

```text
SUPERFICIE P0:
87 RUTAS CANDIDATAS

CONTRATO TRANSVERSAL:
DEFINIDO COMO PROPUESTA

COMMON SCHEMAS:
5 SHAPES CONCEPTUALES

ERROR REGISTRY:
BASE TRANSVERSAL DEFINIDA
+ CÓDIGOS DE FAMILIA PENDIENTES

AUTHN:
4 NIVELES

AUTHZ:
PDP CANÓNICO CONSUMIDO

ANTI-ENUMERATION:
DEFINIDA

IDEMPOTENCY:
DEFINIDA

CONCURRENCY:
DEFINIDA

PAGINATION:
DEFINIDA

COMPATIBILITY:
DEFINIDA

OPENAPI:
ESTRATEGIA DEFINIDA; ARTEFACTO NO MATERIALIZADO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRATOS POR RUTA/FAMILIA
```

---

*Fin de BE-LEG-09 v0.7 — Contrato transversal API v1.*
