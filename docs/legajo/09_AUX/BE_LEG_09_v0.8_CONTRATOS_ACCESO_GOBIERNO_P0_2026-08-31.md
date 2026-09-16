# BE-LEG-09 v0.8 — Contratos P0 de acceso, verificación, vínculo y consentimiento

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09`  
> **Versión:** `v0.8 — CONTRATOS P0 DE ACCESO Y GOBIERNO`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PENDIENTE DE CONTRARREVISIÓN`  
> **Consume:** v0.7 contrato transversal + 04/05/06/08/07  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Aplicar por primera vez el contrato transversal de v0.7 a rutas concretas.

Este bloque cubre las familias que gobiernan el acceso al resto de BE:

1. identidad, sesión y perfil;
2. alta/verificación profesional;
3. vínculo;
4. consentimiento B2.

Estas familias se especifican antes de Nutrición, Entrenamiento y Antropometría porque ninguna vertical puede operar correctamente si la puerta de identidad/autorización está ambigua.

---

# 1. Correcciones y hallazgos respecto de v0.6/v0.7

## C-09-08-01 — cierre de cuenta vuelve a P1

La v0.6 dejó por error `RF-069 / UC-P27` dentro del P0.

El canon de 05 lo clasifica `P1`.

Por tanto salen del P0:

```text
POST /me/account-closure-requests
GET  /me/account-closure-requests/current
```

Siguen siendo obligaciones del BE-LEG-09 final y del 08, pero no del primer corte P0.

**P0: 87 → 85.**

---

## H-09-08-01 — falta una operación técnica para evidencia de verificación

El alta profesional P0 exige evidencia versionada y revisión administrativa.

Una presentación no puede referenciar mágicamente un archivo que nunca ingresó al sistema.

Se agrega una única operación P0 first-party:

```text
POST /api/v1/me/verification-evidence/upload-intents
```

para obtener una carga privada y temporal hacia object storage.

La presentación luego referencia el `uploadId`; no expone `storageKey` público.

**P0: 85 → 86.**

---

# 2. Principios específicos de este bloque

## 2.1 Registro no concede rol profesional

El request expresa:

```text
registrationIntent
```

no:

```text
role
```

Una persona puede registrarse **con intención profesional**, pero la identidad creada no obtiene por eso especialidad, verificación, vínculo, consentimiento ni autorización.

---

## 2.2 A1/A2/A3/B2 permanecen separados

Registro de identidad puede registrar los actos A1/A2 necesarios para usar BE de forma trazable.

No se considera otorgado A3 por registrarse.

B2 nunca se concede desde registro ni desde aceptación del vínculo.

---

## 2.3 Aceptación del vínculo ≠ B2

```text
relationship accepted
```

significa únicamente:

> el asesorado aceptó relacionarse con ese profesional para ese alcance/finalidad.

No significa:

```text
health data access granted
```

---

## 2.4 Consentimiento referencia una versión, no repite su contenido

La request de otorgamiento B2 no vuelve a enviar:

- profesional;
- alcance;
- finalidad;
- categorías.

Envía:

```text
consentVersionId
```

La versión presentada ya está ligada de forma server-owned a:

```text
professional
+ relationship
+ scope
+ purpose
+ pertinent categories
+ text/hash
```

Esto evita aceptar A pero guardar B por manipulación del cliente.

---

# 3. Schemas comunes locales

## 3.1 `RegistrationIntent`

```text
ADVISEE
PROFESSIONAL
```

No es un rol de autorización.

---

## 3.2 `ActorSummary`

```json
{
  "identityId": "id_...",
  "displayName": "..."
}
```

Nunca incluye información sensible de terceros por defecto.

---

## 3.3 `ScopeSummary`

```json
{
  "scopeId": "scope_...",
  "code": "NUTRITION",
  "label": "Nutrition"
}
```

Antropometría puede representar una capacidad transversal y no una tercera especialidad.

---

## 3.4 `ProfessionalVerificationState`

El 09 **importa** los estados canónicos de 06.

Semántica mínima ya vinculante:

```text
PENDING
VERIFIED
REJECTED
SUSPENDED
```

Observación/subsanación:

> hecho trazable; **no quinto estado**.

---

## 3.5 `RelationshipState`

El 09 importa la taxonomía definitiva de 06.

Para contrato observable se preserva, como mínimo:

```text
PENDING_ACCEPTANCE
ACCEPTED / estado operativo derivado según 06
PAUSED
FINALIZED
REJECTED
```

El nombre técnico exacto del estado operativo se toma de 06; no se redefine aquí.

---

# 4. ACC — Identidad, sesión y perfil P0

## API-ACC-01 — Registrar identidad

### Contrato

```http
POST /api/v1/registrations
Idempotency-Key: <required>
```

### AuthN

`PUBLIC`

### Request conceptual

```json
{
  "registrationIntent": "PROFESSIONAL",
  "identity": {
    "localIdentifier": "...",
    "localCredential": "..."
  },
  "profile": {
    "...": "campos mínimos definidos por 04/05"
  },
  "termsAcceptance": {
    "versionId": "terms_..."
  },
  "privacyAcknowledgement": {
    "versionId": "privacy_..."
  }
}
```

### Reglas

- `registrationIntent` no concede rol;
- crea una identidad BE única + perfil propio;
- A1 y A2 quedan como actos separados;
- A3 no se presume;
- no crea especialidad/verificación/vínculo/B2/autorización;
- identidad equivalente no se duplica;
- no se filtra públicamente que una cuenta concreta ya exista.

### Success

`201`

```json
{
  "data": {
    "identityId": "id_...",
    "registrationIntent": "PROFESSIONAL",
    "accountOperationalState": "<canonical-06>",
    "createdAt": "..."
  }
}
```

### Errores adicionales

| HTTP | Code |
|---|---|
| 409 | `REGISTRATION_NOT_AVAILABLE` |
| 409 | `IDEMPOTENCY_KEY_REUSED` |
| 422 | `TERMS_VERSION_NOT_ACCEPTABLE` |
| 422 | `PRIVACY_VERSION_NOT_ACCEPTABLE` |

`REGISTRATION_NOT_AVAILABLE` es deliberadamente neutral: la UI puede ofrecer login/recuperación sin confirmar que el identificador ya existe.

### Audit

`REQUIRED_SAME_TX`

### Retry

Sí, exclusivamente con la misma `Idempotency-Key`.

### Trazabilidad

`UC-P25 · RF-001 · RF-006 · RF-017 · UC-I03`.

---

## API-ACC-02 — Iniciar sesión local

```http
POST /api/v1/auth/sessions
```

### AuthN

`PUBLIC`

### Request conceptual

```json
{
  "method": "LOCAL",
  "identifier": "...",
  "credential": "..."
}
```

### Reglas

- cuenta e identificador se tratan de forma anti-enumeración;
- autenticación identifica; no autoriza dominios;
- session state existe server-side y es revocable;
- la portación concreta de la credencial de sesión —bearer/cookie— se materializa en implementación sin cambiar la semántica;
- rate limiting obligatorio.

### Success

`201`

```json
{
  "data": {
    "session": {
      "id": "ses_...",
      "expiresAt": "...",
      "renewable": true
    },
    "actor": {
      "identityId": "id_...",
      "accountOperationalState": "<canonical-06>"
    }
  }
}
```

El mecanismo de entrega de la credencial activa se documentará en el OpenAPI/implementación concreta.

### Error contract anti-enumeración

Para:

- identificador inexistente;
- credencial incorrecta;
- cuenta no utilizable cuando revelarlo sea sensible;

respuesta observable neutral:

```text
401 INVALID_CREDENTIALS
```

Otros:

```text
429 RATE_LIMITED
503 DEPENDENCY_UNAVAILABLE
```

### Audit

- success: `REQUIRED`;
- failed attempts: `REQUIRED` con payload minimizado.

### Retry

No automático.

### Trazabilidad

`UC-P26 · RF-002 · RF-006`.

---

## API-ACC-03 — Finalizar sesión actual

```http
DELETE /api/v1/auth/sessions/current
```

### AuthN

`SESSION`

### Request

Sin body.

### Success

`204`

### Semántica

- sesión actual queda inutilizable;
- no modifica identidad, vínculos ni historia;
- repetir después de una pérdida de respuesta es semánticamente idempotente.

### Audit

`REQUIRED`

### Retry

Sí.

---

## API-ACC-04 — Revocar todas las sesiones propias

```http
DELETE /api/v1/auth/sessions
```

### AuthN

`SESSION_STEP_UP` recomendado para datos reales.

### Success

`204`

### Semántica

Revoca todas las sesiones del titular, incluida la actual según la estrategia de transporte.

No cierra la cuenta.

### Audit

`REQUIRED`

### Retry

Sí.

---

## API-ACC-05 — Consultar identidad/sesión propia

```http
GET /api/v1/me
```

### AuthN

`SESSION`

### Response

```json
{
  "data": {
    "identityId": "id_...",
    "accountOperationalState": "<canonical-06>",
    "registrationIntent": "PROFESSIONAL",
    "profile": {
      "...": "datos propios mínimos"
    },
    "actorCapabilities": [
      "PROFESSIONAL_ONBOARDING"
    ],
    "session": {
      "id": "ses_...",
      "expiresAt": "..."
    }
  }
}
```

`actorCapabilities` sirve para encauzar superficies first-party, pero:

- no es PDP;
- no es permiso de lectura sensible;
- no debe incluir información oculta de terceros.

### Audit

`BEST_EFFORT_TECHNICAL`

### Retry

Sí.

---

## API-ACC-06 — Editar perfil propio

```http
PATCH /api/v1/me/profile
```

### AuthN

`SESSION`

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "...": "allowlist del perfil propio"
  }
}
```

### Reglas

- solo campos owner-editable;
- campos server-owned → `400 UNKNOWN_FIELD`;
- no modifica rol, verificación, vínculo, consentimiento ni autorización;
- modificación relevante queda trazable.

### Success

`200` con perfil actualizado + nueva `version`.

### Errors

```text
409 VERSION_CONFLICT
422 INVALID_PROFILE_DATA
```

### Audit

`REQUIRED_SAME_TX`

### Retry

No blind retry; releer ante `VERSION_CONFLICT`.

---

# 5. PRO — Perfil profesional y verificación P0

## API-PRO-01 — Consultar perfil profesional propio

```http
GET /api/v1/me/professional-profile
```

### AuthN

`SESSION`

### Preconditions

Identidad con intención/perfil profesional disponible.

### Response

```json
{
  "data": {
    "professionalProfileId": "pro_...",
    "version": "v_...",
    "profile": {
      "...": "campos canónicos 04/06"
    },
    "scopes": [
      {
        "scopeId": "scope_...",
        "code": "NUTRITION",
        "verificationState": "PENDING"
      }
    ]
  }
}
```

Un perfil profesional no equivale a verificación.

---

## API-PRO-02 — Editar perfil profesional

```http
PATCH /api/v1/me/professional-profile
```

### AuthN

`SESSION`

### Request

```json
{
  "expectedVersion": "v_...",
  "changes": {
    "...": "allowlist"
  }
}
```

### Reglas

No altera automáticamente:

- evidencia presentada;
- resolución previa;
- scopes ya verificados;
- habilitación;
- vínculo;
- autorización.

### Errors

```text
409 VERSION_CONFLICT
422 PROFESSIONAL_PROFILE_INVALID
```

### Audit

`REQUIRED_SAME_TX`

---

## API-PRO-03 — Declarar/actualizar scopes profesionales

```http
PUT /api/v1/me/professional-scopes
```

### AuthN

`SESSION`

### Request conceptual

```json
{
  "expectedVersion": "v_...",
  "declaredScopes": [
    {
      "code": "NUTRITION"
    },
    {
      "code": "ANTHROPOMETRY"
    }
  ]
}
```

### Regla crítica

Declarar un scope:

```text
≠ verificarlo
≠ habilitarlo
≠ crear vínculo
≠ autorizar datos
```

Modificar la declaración no reescribe resoluciones administrativas históricas.

### Errors

```text
409 VERSION_CONFLICT
422 SCOPE_DECLARATION_INVALID
```

### Audit

`REQUIRED_SAME_TX`

---

## API-PRO-04 — Crear intención segura de upload de evidencia

### Hallazgo nuevo P0

```http
POST /api/v1/me/verification-evidence/upload-intents
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Request

```json
{
  "scopeId": "scope_...",
  "contentType": "application/pdf",
  "sizeBytes": 123456,
  "sha256": "..."
}
```

### Response

`201`

```json
{
  "data": {
    "uploadId": "upl_...",
    "uploadUrl": "<temporary-signed-url>",
    "requiredHeaders": {},
    "expiresAt": "..."
  }
}
```

### Reglas

- URL temporal;
- bucket/object key no se vuelve identificador público estable;
- tamaño/tipos permitidos vienen de 07/08/config;
- crear intención no significa evidencia presentada;
- un upload se valida nuevamente al referenciarse desde una submission;
- sin acceso público.

### Errors

```text
409 IDEMPOTENCY_KEY_REUSED
422 FILE_TYPE_NOT_ALLOWED
422 FILE_SIZE_NOT_ALLOWED
```

### Audit

`REQUIRED`

### Retry

Con misma `Idempotency-Key`.

---

## API-PRO-05 — Crear nueva presentación versionada

```http
POST /api/v1/me/verification-submissions
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Request

```json
{
  "scopeId": "scope_...",
  "evidenceUploads": [
    {
      "uploadId": "upl_..."
    }
  ]
}
```

### Semántica

- crea una **nueva versión** de evidencia/presentación;
- no modifica versiones previas;
- puede responder como borrador/preparada para submit según la máquina de 06;
- evidencia debe estar cargada, íntegra y pertenecer al actor;
- no aprueba automáticamente.

### Success

`201`

```json
{
  "data": {
    "submissionId": "sub_...",
    "version": "v_...",
    "scope": {},
    "verificationState": "PENDING",
    "submittedAt": null
  }
}
```

El `verificationState` se importa de 06; el estado propio de presentación se detallará en OpenAPI sin crear estados de verificación nuevos.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 EVIDENCE_NOT_READY
422 SCOPE_NOT_DECLARED
```

### Audit

`REQUIRED_SAME_TX`

---

## API-PRO-06 — Listar propias presentaciones

```http
GET /api/v1/me/verification-submissions?limit=&cursor=&scope=
```

### AuthN

`SESSION`

### Response

Cursor paginado.

Cada item:

```json
{
  "submissionId": "sub_...",
  "scope": {},
  "version": "v_...",
  "verificationState": "PENDING",
  "submittedAt": "...",
  "lastResolution": null
}
```

### Retry

Sí.

---

## API-PRO-07 — Consultar presentación propia

```http
GET /api/v1/me/verification-submissions/{submissionId}
```

### AuthN

`SESSION`

### Response

Incluye:

- scope;
- versión;
- evidencia referenciada;
- estado de verificación;
- observaciones/resoluciones que el profesional puede conocer;
- historia de subsanación autorizada.

No devuelve notas administrativas internas no destinadas al profesional.

---

## API-PRO-08 — Presentar versión a revisión

```http
POST /api/v1/me/verification-submissions/{submissionId}/submit
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

### Reglas

- verifica completitud;
- la evidencia presentada se vuelve inmutable;
- repetir el mismo submit por incertidumbre de red no crea otra versión;
- no otorga verificación.

### Success

`200`

### Errors

```text
409 VERSION_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 SUBMISSION_NOT_READY
422 INVALID_STATE_TRANSITION
```

### Audit

`REQUIRED_SAME_TX`

---

## API-PRO-09 — Listar presentaciones a revisar

```http
GET /api/v1/admin/verification-submissions?limit=&cursor=&scope=&state=
```

### AuthN

`SESSION_MFA`

### AuthZ

Administrador autorizado; admin no recibe salud por defecto.

### Response

Paginada, mínima para cola de revisión.

### Audit

`REQUIRED`

---

## API-PRO-10 — Consultar detalle administrativo de presentación

```http
GET /api/v1/admin/verification-submissions/{submissionId}
```

### AuthN

`SESSION_MFA`

### Response

Incluye evidencia necesaria para resolver.

Los archivos se exponen mediante URL temporal/autorizada; no bucket público.

### Anti-enumeration

Recurso inexistente/no visible → `404 RESOURCE_NOT_FOUND`.

### Audit

`REQUIRED`

---

## API-PRO-11 — Resolver revisión

```http
POST /api/v1/admin/verification-submissions/{submissionId}/resolve
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request

```json
{
  "expectedVersion": "v_...",
  "decision": "OBSERVE",
  "rationale": "..."
}
```

`decision`:

```text
OBSERVE
VERIFY
REJECT
```

### Regla de dominio

`OBSERVE`:

- crea hecho/resultado trazable;
- **no crea un quinto estado de verificación**;
- permite que el profesional subsane mediante nueva versión.

`VERIFY`:

- resuelve ese scope;
- no modifica otros scopes;
- no crea vínculo, consentimiento ni autorización.

`REJECT`:

- conserva historia/evidencia;
- no afecta otros scopes.

### Errors

```text
409 VERSION_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 INVALID_STATE_TRANSITION
422 RATIONALE_REQUIRED
```

### Audit

`REQUIRED_SAME_TX`

### Retry

Solo con la misma `Idempotency-Key`.

---

## API-PRO-12 — Suspender scope profesional

```http
POST /api/v1/admin/professional-scopes/{professionalScopeId}/suspend
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request

```json
{
  "expectedVersion": "v_...",
  "rationale": "..."
}
```

### Efectos obligatorios

- transición permitida según 06;
- no borra historia;
- ese scope deja de autorizar nuevas operaciones;
- la suspensión participa del PDP en la operación siguiente;
- sesiones vigentes del profesional se revocan conforme a 08;
- no altera otros scopes salvo regla canónica explícita.

### Audit

`REQUIRED_SAME_TX`

---

## API-PRO-13 — Rehabilitar scope profesional

```http
POST /api/v1/admin/professional-scopes/{professionalScopeId}/reinstate
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Reglas

- transición solo si 06 la permite;
- no recrea sesiones antiguas;
- no revive vínculos/consentimientos por sí sola;
- futuras operaciones vuelven a pasar por PDP completo.

### Audit

`REQUIRED_SAME_TX`

---

# 6. REL — Vínculo P0

## API-REL-01 — Crear solicitud/invitación

```http
POST /api/v1/relationship-requests
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Actor

Profesional o asesorado.

### Request

```json
{
  "target": {
    "type": "PROFESSIONAL",
    "identityId": "id_..."
  },
  "scope": {
    "code": "ANTHROPOMETRY"
  },
  "purpose": "..."
}
```

`target.type` será la contraparte del actor autenticado.

Origen opcional, server-controlled o allowlisted:

```json
{
  "origin": {
    "type": "ANTHROPOMETRY_DISCOVERY",
    "referenceId": "..."
  }
}
```

### Reglas

- profesional, asesorado, scope y finalidad quedan identificados;
- solicitud pendiente no concede acceso;
- aceptación posterior corresponde al asesorado;
- B2 sigue separado;
- solicitud pendiente no ocupa capacidad por sí sola;
- si existe una solicitud equivalente pendiente, se devuelve la existente;
- no se crean reserva, turno, pago ni contratación.

### Success nuevo

`201`

### Equivalent pending request

`200` con el recurso existente:

```json
{
  "data": {
    "relationshipRequestId": "rr_...",
    "deduplicated": true
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 PURPOSE_REQUIRED
422 SCOPE_NOT_AVAILABLE
422 COUNTERPART_NOT_ELIGIBLE
```

`COUNTERPART_NOT_ELIGIBLE` solo se usa cuando revelar la contraparte ya es legítimo en el flujo; de lo contrario 404.

### Audit

`REQUIRED_SAME_TX`

---

## API-REL-02 — Listar solicitudes propias

```http
GET /api/v1/me/relationship-requests?limit=&cursor=&state=
```

### AuthN

`SESSION`

### Response item

```json
{
  "relationshipRequestId": "rr_...",
  "version": "v_...",
  "professional": {},
  "advisee": {},
  "scope": {},
  "purpose": "...",
  "state": "<canonical-06>",
  "createdAt": "...",
  "expiresAt": null
}
```

La caducidad, si existe, se toma de 06/08.

No incluye información sanitaria.

---

## API-REL-03 — Aceptar solicitud

```http
POST /api/v1/relationship-requests/{requestId}/accept
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Actor

**Solo asesorado titular de la solicitud.**

### Request

```json
{
  "expectedVersion": "v_..."
}
```

### Reglas

- aceptación expresa;
- incluso si la solicitud se originó desde el asesorado, no existe auto-aceptación silenciosa;
- aceptación no crea B2;
- no habilita datos si faltan gates;
- contenido aceptado debe quedar identificable;
- profesional puede conocer el resultado dentro de la visibilidad legítima.

### Success

`200`

```json
{
  "data": {
    "relationshipId": "rel_...",
    "relationshipState": "<canonical-06>",
    "scope": {},
    "purpose": "...",
    "consentRequired": true,
    "accessMode": "BLOCKED_PENDING_AUTHORIZATION"
  }
}
```

`accessMode` es diagnóstico first-party, no permiso reusable por el cliente.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 INVALID_STATE_TRANSITION
```

### Audit

`REQUIRED_SAME_TX`

---

## API-REL-04 — Rechazar solicitud

```http
POST /api/v1/relationship-requests/{requestId}/reject
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Actor

Solo asesorado.

### Request

`expectedVersion`.

### Semántica

- rechazo expreso;
- no hay vínculo operativo ni B2 ni acceso;
- solicitud/historia no se borra.

### Audit

`REQUIRED_SAME_TX`

---

## API-REL-05 — Listar vínculos propios

```http
GET /api/v1/me/relationships?limit=&cursor=&state=&scope=
```

### AuthN

`SESSION`

### Response item conceptual

```json
{
  "relationshipId": "rel_...",
  "version": "v_...",
  "professional": {},
  "advisee": {},
  "scope": {},
  "purpose": "...",
  "relationshipState": "<canonical-06>",
  "consentState": "ACTIVE",
  "accessMode": "CONTEXTUAL"
}
```

`accessMode`:

```text
BLOCKED
CONTEXTUAL
```

Nunca significa “el cliente ya está autorizado para todos los recursos”.

### Regla

Para el profesional:

```text
PAUSED / FINALIZED
→ accessMode = BLOCKED
```

Para el asesorado, la relación sigue siendo visible como propia/histórica.

---

## API-REL-06 — Consultar vínculo propio

```http
GET /api/v1/relationships/{relationshipId}
```

### AuthN

`SESSION`

### Anti-enumeration

No participante/no visible → 404.

### Response

Incluye estado relacional, alcance, finalidad, contraparte y resumen de B2/efectividad.

No contiene expediente sanitario.

---

## API-REL-07 — Pausar vínculo

```http
POST /api/v1/relationships/{relationshipId}/pause
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

### Efecto

- transición allowlist de 06;
- **acceso profesional pasa a cero**, incluida lectura;
- no borra historia;
- no revoca B2 automáticamente salvo regla posterior;
- próxima operación protegida ya debe observar la pausa.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
422 INVALID_STATE_TRANSITION
```

### Audit

`REQUIRED_SAME_TX`

---

## API-REL-08 — Reanudar vínculo

```http
POST /api/v1/relationships/{relationshipId}/resume
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Efecto

Reanudar el estado relacional:

```text
≠ restaurar permiso histórico
```

Tras la transición, toda operación vuelve a evaluar:

- cuenta/sesión;
- verificación;
- habilitación/capacidad;
- scope;
- B2 vigente;
- finalidad;
- pertinencia;
- recurso.

### Audit

`REQUIRED_SAME_TX`

---

## API-REL-09 — Finalizar vínculo

```http
POST /api/v1/relationships/{relationshipId}/finalize
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Efectos

- transición terminal según 06;
- acceso profesional posterior = cero;
- no existe ventana residual de lectura;
- historia del asesorado se conserva conforme 06/08;
- consentimientos/revocaciones se conservan como evidencia;
- aviso UX previo pertenece a 10.

### Audit

`REQUIRED_SAME_TX`

---

# 7. CON — Consentimiento B2 P0

## API-CON-01 — Consultar requisitos/texto B2 aplicable

```http
GET /api/v1/relationships/{relationshipId}/consent-requirements
```

### AuthN

`SESSION`

### Actor

Asesorado titular.

El profesional puede conocer el estado general del consentimiento a través del vínculo, pero **no necesita esta superficie de aceptación**.

### Response

```json
{
  "data": {
    "relationshipId": "rel_...",
    "professional": {
      "identityId": "id_...",
      "displayName": "..."
    },
    "scope": {
      "code": "TRAINING"
    },
    "purpose": "...",
    "consentVersion": {
      "id": "cv_...",
      "text": "...",
      "textHash": "...",
      "effectiveFrom": "..."
    },
    "pertinentCategories": [
      {
        "code": "TRAINING_DATA",
        "label": "...",
        "detailLevel": "..."
      },
      {
        "code": "EXERCISE_RELEVANT_HEALTH_INFO",
        "label": "...",
        "detailLevel": "MINIMUM_SUFFICIENT"
      }
    ],
    "professionalProfileDisclosure": {
      "profileType": "NON_HEALTH_PROFESSIONAL",
      "notice": "..."
    }
  }
}
```

### Reglas

- categorías derivan de matriz de pertinencia vigente;
- ausencia de regla = deny;
- ampliación que requiera nuevo B2 produce nueva `consentVersion`;
- texto diferenciado según perfil profesional;
- no se expone “todo dato de salud”.

### Audit

`BEST_EFFORT_TECHNICAL`

---

## API-CON-02 — Otorgar B2

```http
POST /api/v1/relationships/{relationshipId}/consents
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Actor

Solo asesorado titular.

### Request

```json
{
  "consentVersionId": "cv_..."
}
```

### Por qué el request es deliberadamente pequeño

El cliente **no vuelve a enviar**:

```text
professionalId
scope
purpose
categories
textHash
```

Todos son server-owned por la versión exacta presentada.

### Validaciones atómicas

El servidor verifica que:

- la versión existe;
- pertenece a ese `relationshipId`;
- corresponde al profesional/scope/purpose;
- las categorías son las presentadas;
- no fue reemplazada por un requisito incompatible antes del acto;
- el asesorado es el titular;
- el vínculo está en estado que admite B2.

### Success

`201` o `200` en replay idempotente.

```json
{
  "data": {
    "consentId": "con_...",
    "relationshipId": "rel_...",
    "consentVersionId": "cv_...",
    "state": "ACTIVE",
    "acceptedAt": "...",
    "scope": {},
    "purpose": "...",
    "pertinentCategories": []
  }
}
```

La evidencia interna agrega:

- titular;
- ocurrencia/registro;
- hash de texto;
- canal/superficie;
- evidencia técnica IP/UA según 08;
- cadena de versión.

### Errors

```text
404 RESOURCE_NOT_FOUND
409 CONSENT_VERSION_STALE
409 IDEMPOTENCY_KEY_REUSED
422 RELATIONSHIP_NOT_READY_FOR_CONSENT
```

### Audit

`REQUIRED_SAME_TX`

La auditoría referencia la versión B2 exacta.

---

## API-CON-03 — Listar consentimientos propios

```http
GET /api/v1/me/consents?limit=&cursor=&state=&scope=
```

### AuthN

`SESSION`

### Response item

```json
{
  "consentId": "con_...",
  "professional": {},
  "scope": {},
  "purpose": "...",
  "consentVersionId": "cv_...",
  "state": "ACTIVE",
  "acceptedAt": "...",
  "revokedAt": null,
  "relationshipState": "<canonical-06>",
  "accessMode": "CONTEXTUAL"
}
```

La pantalla propia puede mostrar por qué su autorización ya no es efectiva —p. ej. vínculo pausado— sin que eso convierta el resumen en un permiso reusable.

### Audit

`BEST_EFFORT_TECHNICAL`

---

## API-CON-04 — Revocar B2

```http
POST /api/v1/me/consents/{consentId}/revoke
```

### AuthN

`SESSION`

### Request

Vacío.

### Semántica idempotente

Primera revocación:

```text
ACTIVE → REVOKED
```

Replay:

```text
REVOKED → REVOKED
```

No se crea una segunda revocación.

### Efectos

- acceso profesional futuro bajo ese B2 queda bloqueado;
- corte no espera expiración de sesión;
- primera operación posterior ya debe observar el cambio;
- no finaliza automáticamente el vínculo;
- no borra historia;
- conserva evidencia del consentimiento y de la revocación.

### Success

`200`

```json
{
  "data": {
    "consentId": "con_...",
    "state": "REVOKED",
    "revokedAt": "..."
  }
}
```

### Audit

`REQUIRED_SAME_TX`

### Retry

Sí, semánticamente idempotente; no necesita `Idempotency-Key`.

---

# 8. Matriz compacta AuthN / Audit / Idempotencia

| Grupo | AuthN | Audit | Idempotency-Key |
|---|---|---|---|
| Registro | PUBLIC | REQUIRED_SAME_TX | Sí |
| Login | PUBLIC | REQUIRED | No |
| Logout actual/todas | SESSION / STEP_UP | REQUIRED | No, semántico |
| Perfil propio/profesional write | SESSION | REQUIRED_SAME_TX | No; VersionToken |
| Upload evidencia | SESSION | REQUIRED | Sí |
| Crear/submit evidencia | SESSION | REQUIRED_SAME_TX | Sí |
| Admin verificación reads | SESSION_MFA | REQUIRED | N/A |
| Admin resolve/suspend/reinstate | SESSION_MFA | REQUIRED_SAME_TX | Sí |
| Solicitud vínculo | SESSION | REQUIRED_SAME_TX | Sí |
| Accept/reject/pause/resume/finalize | SESSION | REQUIRED_SAME_TX | Sí |
| Consent requirements/list own | SESSION | BEST_EFFORT_TECHNICAL | N/A |
| Otorgar B2 | SESSION | REQUIRED_SAME_TX | Sí |
| Revocar B2 | SESSION | REQUIRED_SAME_TX | No; semántico |

---

# 9. Error registry agregado por este bloque

## ACC

```text
INVALID_CREDENTIALS
REGISTRATION_NOT_AVAILABLE
TERMS_VERSION_NOT_ACCEPTABLE
PRIVACY_VERSION_NOT_ACCEPTABLE
INVALID_PROFILE_DATA
```

## PRO

```text
PROFESSIONAL_PROFILE_INVALID
SCOPE_DECLARATION_INVALID
FILE_TYPE_NOT_ALLOWED
FILE_SIZE_NOT_ALLOWED
EVIDENCE_NOT_READY
SCOPE_NOT_DECLARED
SUBMISSION_NOT_READY
RATIONALE_REQUIRED
```

## REL

```text
PURPOSE_REQUIRED
SCOPE_NOT_AVAILABLE
COUNTERPART_NOT_ELIGIBLE
```

Los estados inválidos siguen usando:

```text
INVALID_STATE_TRANSITION
```

## CON

```text
CONSENT_VERSION_STALE
RELATIONSHIP_NOT_READY_FOR_CONSENT
```

Más los transversales:

```text
RESOURCE_NOT_FOUND
VERSION_CONFLICT
IDEMPOTENCY_KEY_REUSED
MFA_REQUIRED
STEP_UP_REQUIRED
RATE_LIMITED
INTERNAL_ERROR
...
```

---

# 10. Pruebas que este contrato obliga a 11A

## Identidad/sesión

- registro no concede permisos;
- identidad duplicada no crea segunda;
- login inexistente vs password incorrecta observacionalmente neutral;
- rate limit;
- logout invalida sesión;
- revocación de todas las sesiones;
- cuenta no operativa no crea sesión;
- cambio/suspensión que exige revocación invalida sesión.

## Verificación

- scopes independientes;
- evidence version no overwrite;
- OBSERVE no crea quinto estado;
- VERIFY de Nutrición no verifica Entrenamiento;
- suspensión corta operaciones;
- reinstatement no revive sesiones;
- admin sin MFA denegado;
- evidencia privada + signed URL expira.

## Vínculo

- solicitud no concede acceso;
- duplicate pending → mismo recurso;
- solo asesorado acepta/rechaza;
- aceptación no crea B2;
- PAUSED = cero lectura/escritura profesional;
- RESUME reevalúa gates;
- FINALIZED = cero acceso residual;
- no reserva/turno/pago/contratación.

## Consentimiento

- versión mostrada = versión aceptada;
- stale version falla;
- solo asesorado otorga;
- B2 por professional × scope × purpose × pertinent categories;
- revocación en caliente;
- revocación idempotente;
- revocación no finaliza vínculo;
- nuevas categorías no aparecen sin nueva versión/aceptación.

---

# 11. Estado cuantitativo actualizado

```text
v0.6 P0:
87

corrección RF-069 P1:
-2

upload intent de evidencia P0:
+1

P0 actual candidato:
86
```

Este ajuste no altera 53 UC ni 67 RF: corrige prioridad y completa una necesidad técnica imprescindible para un P0 ya existente.

---

# 12. Decisiones/candidatas nuevas surgidas

## CAND-09-S01 — Registro usa `registrationIntent`, no `role`

**Recomendación: APROBAR.**

Evita que registrarse como “profesional” sea interpretado como concesión de permisos.

---

## CAND-09-S02 — B2 se otorga por referencia a `consentVersionId`

**Recomendación: APROBAR.**

La versión server-owned vincula profesional, scope, finalidad, categorías y hash; el cliente no repite atributos críticos.

---

## CAND-09-S03 — Solicitud equivalente pendiente retorna recurso existente

**Recomendación: APROBAR.**

Cumple 05: evita duplicados sin convertir un retry/flujo repetido en error artificial.

---

## CAND-09-S04 — Evidencia profesional usa upload intent privado

**Recomendación: APROBAR.**

Permite storage externo seguro sin exponer storage keys ni hacer del API Node un proxy permanente de archivos.

---

## CAND-09-S05 — Admin siempre `SESSION_MFA`

**DERIVADA DIRECTAMENTE DE 08.**

No es decisión nueva de producto.

---

# 13. Puntos deliberadamente no cerrados todavía

1. campos exactos del `profile` común;
2. algoritmo de credencial local;
3. bearer token vs cookie para Web;
4. TTL de sesión/renovación;
5. tipos MIME/tamaños de evidencia;
6. caducidad exacta de solicitudes;
7. catálogo exacto de `purpose`;
8. códigos/taxonomía exacta de scopes importada de 06;
9. copy legal/textos B2 — 10/asesoramiento correspondiente;
10. P1 de cierre de cuenta, recuperación, Google y métodos híbridos.

Ninguno bloquea continuar hacia contratos verticales.

---

# 14. Próximo paso

Con la puerta de acceso especificada, el siguiente bloque será:

```text
BE-LEG-09 v0.9
CONTRATOS P0 — NUTRICIÓN
```

Para cada ruta:

- request;
- response;
- AuthN;
- PDP;
- estado;
- VersionToken;
- Idempotency-Key;
- errors;
- audit;
- retry;
- RF/UC.

Después:

```text
v0.10 Entrenamiento
v0.11 Antropometría + read models
v0.12 trazabilidad + revisión integral
```

---

# 15. Estado

```text
BE-LEG-09:
EN DESARROLLO

CONTRATO TRANSVERSAL:
v0.7

CONTRATOS DETALLADOS:
ACC — COMPLETADO EN BORRADOR
PRO — COMPLETADO EN BORRADOR
REL — COMPLETADO EN BORRADOR
CON — COMPLETADO EN BORRADOR

P0 CANDIDATO:
86 RUTAS/OPERACIONES HTTP

CANDIDATAS NUEVAS:
S01..S05

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
NUTRICIÓN P0
```

---

*Fin de BE-LEG-09 v0.8 — Contratos P0 de acceso y gobierno.*
