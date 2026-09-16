# BE-LEG-09 v0.12 — Integraciones P0 y contratos de soporte P1/P2

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09`  
> **Versión:** `v0.12 — INTEGRACIONES P0 + SOPORTE P1/P2`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR TÉCNICO — PENDIENTE DE CONTRARREVISIÓN`  
> **Consume:** v0.7…v0.11 + BE-LEG-04/05/06/07/08  
> **Legacy:** `NO NORMATIVO`  
> **Implementación/Git:** `NO AUTORIZADOS`

---

# 0. Propósito

Cerrar dos huecos antes de la trazabilidad integral del BE-LEG-09:

1. corregir una clasificación errónea de borrador en v0.9/v0.10: las integraciones controladas de Open Food Facts y wger son **P0 API**, no P1;
2. especificar a nivel suficiente las superficies P1/P2 y las obligaciones de seguridad/gobierno que pertenecen al 09 aunque no sean parte del primer recorrido funcional P0.

Esta versión no reabre 04/05/06. Corrige únicamente el 09 en desarrollo.

---

# 1. Corrección documental obligatoria

## C-09-12-01 — RF-028 y RF-038 son P0 API

Las versiones v0.9 y v0.10 trataron la importación externa como diferible/P1.

Eso contradice el maestro 05:

```text
RF-028 — Integración nutricional — P0 API
RF-038 — Integración de entrenamiento — P0 API
```

y los casos:

```text
UC-P10 + UC-I07 → Open Food Facts
UC-P15 + UC-I07 → wger
```

### Resultado

Se corrige:

```text
Open Food Facts controlled import → P0 API
wger controlled import             → P0 API
```

La corrección es posible sin control de cambio sobre el canon porque v0.9/v0.10 son borradores no aprobados.

---

# 2. Conducta P0 de integración heredada

Toda importación controlada cumple:

```text
proveedor externo
→ resultado candidato
→ profesional revisa
→ corregir/completar/rechazar/incorporar
→ decisión trazable
→ catálogo BE versionado
```

Garantías:

- no existe importación ciega;
- proveedor y fecha identificables;
- proveedor no es fuente única;
- catálogo BE permanece operativo;
- carga manual permanece disponible;
- un dato incompleto puede rechazarse;
- corrección no oculta fuente original;
- indisponibilidad del tercero es observable;
- el fallback no se declara como éxito del proveedor;
- recuperación del proveedor no pisa datos manuales;
- ningún I/O externo ocurre dentro de las transacciones de activación.

---

# 3. Patrón de integración P0

Para evitar que Web/Mobile deban retener el payload de un proveedor y reenviarlo como si fuera confiable, la integración usa un **candidato de importación temporal y trazable**.

```text
search/fetch provider
→ ImportCandidate
→ review
→ resolve
→ BE Catalog Item
```

El candidato:

- no es aún un elemento del catálogo BE;
- conserva proveedor, identificador externo y fecha;
- conserva el contenido relevante recibido o referencia/hash suficiente para auditoría;
- posee expiración/retención técnica definida posteriormente;
- solo puede resolverse por actor autorizado.

---

# 4. Nutrición — catálogo propio P0

## API-INT-NUT-01 — Crear elemento manual del catálogo BE

```http
POST /api/v1/nutrition/catalog-items
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Actor

Profesional de Nutrición o administrador autorizado según la política del catálogo.

### Request conceptual

```json
{
  "name": "...",
  "itemType": "FOOD",
  "composition": {},
  "extendedAttributes": [],
  "provenance": {
    "type": "MANUAL_ENTRY"
  }
}
```

### Reglas

- crea fuente BE propia/versionada;
- manual ≠ dato externo;
- no inventa procedencia de proveedor;
- campos profesionales concretos pertenecen al schema nutricional aprobado;
- no modifica snapshots históricos.

### Success

`201`

### Errors

```text
409 IDEMPOTENCY_KEY_REUSED
409 CATALOG_ITEM_CONFLICT
422 CATALOG_ITEM_INVALID
```

### Audit

`REQUIRED_SAME_TX`

---

# 5. Nutrición — Open Food Facts P0

## API-INT-NUT-02 — Crear candidato desde proveedor

```http
POST /api/v1/nutrition/catalog-import-candidates
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request

```json
{
  "provider": "OPEN_FOOD_FACTS",
  "lookup": {
    "externalId": "..."
  }
}
```

También podrá existir búsqueda first-party mediante parámetros allowlist sin convertir la API BE en passthrough del proveedor.

### Flujo

1. BE llama al adaptador;
2. aplica timeout/budget;
3. normaliza únicamente lo necesario para revisión;
4. conserva procedencia;
5. crea `ImportCandidate`;
6. todavía no contamina el catálogo.

### Success

`201`

```json
{
  "data": {
    "candidateId": "nic_...",
    "provider": "OPEN_FOOD_FACTS",
    "externalId": "...",
    "receivedAt": "...",
    "candidate": {},
    "provenance": {}
  }
}
```

### Proveedor indisponible

```text
503 DEPENDENCY_UNAVAILABLE
```

La response puede indicar de forma segura que el catálogo/carga manual siguen disponibles.

Nunca:

```text
200 con datos inventados
```

### Audit

`REQUIRED`

---

## API-INT-NUT-03 — Resolver candidato

```http
POST /api/v1/nutrition/catalog-import-candidates/{candidateId}/resolve
Idempotency-Key: <required>
```

### Request

```json
{
  "decision": "IMPORT",
  "reviewedContent": {
    "...": "contenido corregido/completado por el profesional"
  },
  "rationale": null
}
```

`decision`:

```text
IMPORT
REJECT
```

### IMPORT

- conserva fuente externa original;
- conserva correcciones profesionales;
- crea versión de catálogo BE;
- registra quién revisó y cuándo.

### REJECT

- no crea elemento de catálogo;
- registra decisión;
- candidato no vuelve a aparecer como incorporado.

### Success

`200`

```json
{
  "data": {
    "decision": "IMPORT",
    "catalogItem": {
      "catalogItemId": "food_...",
      "versionId": "foodv_..."
    }
  }
}
```

### Errors

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 IMPORT_CANDIDATE_NOT_RESOLVABLE
422 REVIEWED_CONTENT_INVALID
```

### Audit

`REQUIRED_SAME_TX`

---

# 6. Entrenamiento — catálogo propio P0

## API-INT-TRN-01 — Crear ejercicio manual

```http
POST /api/v1/training/exercises
Idempotency-Key: <required>
```

### AuthN

`SESSION_MFA`

### Request conceptual

```json
{
  "name": "...",
  "muscleZones": [
    {
      "zoneId": "zone_...",
      "role": "PRIMARY"
    }
  ],
  "didacticResources": [],
  "provenance": {
    "type": "MANUAL_ENTRY"
  }
}
```

### Reglas

- catálogo BE propio;
- zone IDs provienen del dominio;
- `PRIMARY/SECONDARY` no crean porcentajes;
- recurso visual exige procedencia/licencia cuando corresponda;
- no altera snapshots activos.

---

# 7. Entrenamiento — wger P0

## API-INT-TRN-02 — Crear candidato desde wger

```http
POST /api/v1/training/catalog-import-candidates
Idempotency-Key: <required>
```

### Request

```json
{
  "provider": "WGER",
  "lookup": {
    "externalId": "..."
  }
}
```

### Success

Mismo patrón de `ImportCandidate`.

### Falla

```text
503 DEPENDENCY_UNAVAILABLE
```

con fallback a catálogo BE/carga manual.

---

## API-INT-TRN-03 — Resolver candidato

```http
POST /api/v1/training/catalog-import-candidates/{candidateId}/resolve
Idempotency-Key: <required>
```

### Decision

```text
IMPORT
REJECT
```

### Regla específica

Una relación músculo/zona recibida de wger:

```text
no se acepta automáticamente como relación canónica BE
```

Debe ser revisada y transformada al catálogo BE versionado.

### Audit

`REQUIRED_SAME_TX`

---

# 8. Por qué no usamos un único endpoint genérico de importación

Se evaluó:

```text
/catalog-imports?domain=NUTRITION
/catalog-imports?domain=TRAINING
```

Se descarta como candidato principal porque:

- los schemas son distintos;
- los permisos son distintos;
- la revisión profesional es distinta;
- dificulta clientes generados y documentación;
- ahorra URLs pero no complejidad real.

Se conserva un **patrón interno común**, no un payload público artificialmente genérico.

---

# 9. Estado P0 después de corregir las integraciones

v0.11 calculaba un máximo candidato de:

```text
91
```

si se ratificaban todas las adiciones anteriores.

Esta versión agrega seis operaciones P0 explícitas:

```text
+ 3 Nutrición
+ 3 Entrenamiento
```

Total máximo candidato:

```text
97 operaciones P0
```

### Lectura correcta

Se agregan porque el canon ya exigía:

- catálogo propio operativo;
- carga manual;
- importación controlada OFF/wger;
- fallback;
- procedencia.

No es expansión de producto.

---

# 10. Recuperación de acceso — P1

## Objetivo

Cumplir RF-005 y 08 sin enumerar cuentas.

### API-ACC-P1-01 — Iniciar recuperación

```http
POST /api/v1/auth/recovery-requests
```

Request:

```json
{
  "identifier": "..."
}
```

Response externa neutral:

```text
202
```

mismo shape exista o no exista la cuenta.

### Reglas

- canal/proveedor no se fija en 09;
- rate limiting;
- token/prueba temporal;
- no revela identidad;
- auditoría minimizada.

---

## API-ACC-P1-02 — Completar recuperación

```http
POST /api/v1/auth/recovery-requests/{recoveryId}/complete
```

Request:

```json
{
  "proof": "...",
  "newCredential": "..."
}
```

### Efectos

- cambia credencial si la prueba es válida;
- revoca sesiones conforme 08;
- no crea identidad paralela.

---

# 11. Identidad federada Google — P1

La autenticación local sigue disponible como fallback.

Contrato lógico:

```text
POST /auth/federated/google/authorize
POST /auth/federated/google/complete
```

o equivalente callback seguro según la materialización final.

Reglas:

- Google identifica un método de acceso;
- BE conserva identidad canónica;
- no crea segunda Identidad BE;
- no degrada auth local;
- `state`/PKCE/anti-CSRF según implementación;
- fallas de proveedor no bloquean login local.

Los paths finales pueden ajustarse al mecanismo OAuth sin cambiar la semántica.

---

# 12. Métodos de acceso híbridos — P2/recortable

Operaciones candidatas:

```text
GET    /me/access-methods
POST   /me/access-methods
DELETE /me/access-methods/{methodId}
```

Regla crítica:

```text
no permitir eliminar el último método de acceso utilizable
```

La remoción puede exigir step-up.

---

# 13. Cierre de cuenta — P1, pero obligación de 08

RF-069 permanece P1.

## API-ACC-P1-03 — Solicitar cierre

```http
POST /api/v1/me/account-closure-requests
Idempotency-Key: <required>
```

Auth:

```text
SESSION_STEP_UP
```

### Efectos estructurales

Cuando el cierre se hace efectivo según 06/08:

- impide nuevas sesiones;
- invalida sesiones actuales;
- finaliza vínculos/procesos según máquina canónica;
- no borra historia silenciosamente;
- retención/supresión aplican política 08.

## API-ACC-P1-04 — Estado del cierre

```http
GET /api/v1/me/account-closure-requests/current
```

No se usa:

```text
DELETE /me
```

como falsa equivalencia de “borrar todo”.

---

# 14. Derechos del titular — obligación 08→09

Estas superficies no se justifican por comodidad de UI sino por obligación explícita de 08.

## `DataSubjectRequestType`

```text
ACCESS
RECTIFICATION
SUPPRESSION
```

## API-RGT-01 — Crear solicitud

```http
POST /api/v1/me/data-rights-requests
Idempotency-Key: <required>
```

Request:

```json
{
  "type": "ACCESS",
  "scope": {}
}
```

### Reglas

- sujeto = actor autenticado;
- nunca permite pedir datos de un tercero;
- conserva plazo aplicable como deadline operacional derivado de 08;
- no promete supresión de datos sujetos a excepción/retención.

## API-RGT-02 — Consultar solicitud

```http
GET /api/v1/me/data-rights-requests/{requestId}
```

## API-RGT-03 — Listar propias solicitudes

```http
GET /api/v1/me/data-rights-requests?limit=&cursor=
```

---

# 15. Exportación propia — obligación 08→09

## API-EXP-01

```http
POST /api/v1/me/exports
Idempotency-Key: <required>
```

Request:

```json
{
  "scope": {
    "domains": [
      "NUTRITION",
      "TRAINING",
      "ANTHROPOMETRY"
    ],
    "period": null
  }
}
```

### Reglas

- exporta únicamente datos del titular;
- no arrastra datos de terceros salvo referencia mínima jurídicamente/funcionalmente permitida;
- audita solicitud y entrega;
- respeta supresión/retención y acceso efectivo;
- la generación puede ser asíncrona.

## API-EXP-02 — Estado/descarga

```http
GET /api/v1/me/exports/{exportId}
```

Una URL de descarga, si existe, es temporal y autenticada/firmada.

---

# 16. Incidencias administrativas — P1

RF-068 exige soporte mínimo, no un sistema completo de tickets.

Superficie candidata:

```text
POST /incidents
GET  /me/incidents
GET  /incidents/{incidentId}
POST /admin/incidents/{incidentId}/updates
POST /admin/incidents/{incidentId}/resolve
```

Propiedades:

- reportante;
- categoría;
- estado;
- responsable cuando corresponda;
- historia no sobrescribible;
- acceso restringido;
- autoría/fecha;
- resolución trazable.

No se convierten en:

- chat;
- mesa de ayuda empresarial;
- diagnóstico;
- revisión profesional.

---

# 17. Capacidad académica — P1 de administración, gate consumido por P0

RF-066 es P1 como superficie administrativa.

Operaciones candidatas:

```text
GET   /admin/capacity-settings
PATCH /admin/capacity-settings/{settingId}
```

Auth:

```text
SESSION_MFA
```

Con `expectedVersion` y auditoría bloqueante.

### Regla crítica

El hecho de que la UI/API administrativa sea P1 **no elimina el gate P0** dentro de `activate`.

Si no existe banda configurada, 06 define el comportamiento efectivo:

```text
SIN_LIMITE
```

No se inventa un límite.

No hay cobro real.

---

# 18. Publicación y descubrimiento antropométrico — P1

RF-051 permanece P1.

## Profesional

```text
GET  /me/anthropometry-service
PUT  /me/anthropometry-service
POST /me/anthropometry-service/publish
POST /me/anthropometry-service/pause
```

Publicar requiere condiciones canónicas de elegibilidad.

Perder elegibilidad corta visibilidad.

## Asesorado

```text
GET /anthropometry-services
GET /anthropometry-services/{serviceId}
```

Puede incluir:

- perfil mínimo;
- capacidad verificada;
- ubicación utilizable;
- información permitida.

No incluye:

- reservas;
- turnos;
- pagos;
- ranking;
- reputación;
- reseñas;
- popularidad;
- contratación.

La única continuidad funcional es la solicitud de vínculo.

Google Maps puede ser representación opcional del cliente; fallback: lista + ubicación textual.

---

# 19. Notas de coordinación — P1

RF-057.

```text
POST /advisees/{adviseeId}/coordination-notes
GET  /advisees/{adviseeId}/coordination-notes
```

Reglas:

- solo datos autorizados/pertinentes;
- autoría y fecha;
- no sustituye revisión profesional;
- no transfiere responsabilidad;
- no crea “notas secretas” profesionales invisibles al régimen 08;
- no abre acceso global interdisciplinario.

---

# 20. Novedades internas — P1

RF-061.

```text
GET /me/news
GET /me/news/{newsId}
```

Centro interno:

- no clínico;
- no fuente de autorización;
- una novedad no reemplaza estado real de dominio.

Puede servir como fallback de Push.

---

# 21. Push — P2

RF-062.

Registro técnico candidato:

```text
PUT    /me/push-subscriptions/{deviceId}
DELETE /me/push-subscriptions/{deviceId}
```

### Regla obligatoria

Payload push:

```text
NUNCA C4
```

Debe limitarse a señal mínima, por ejemplo:

```json
{
  "type": "NEW_INTERNAL_UPDATE",
  "referenceId": "news_..."
}
```

Luego el cliente autenticado consulta BE.

Falla de Expo Push:

```text
no elimina la novedad interna
```

---

# 22. Break-glass — excepcional

08 exige MFA/step-up y ciclo auditado.

No se diseña como:

```text
GET /admin/all-health-data
```

Superficie candidata mínima:

```text
POST /admin/break-glass-sessions
DELETE /admin/break-glass-sessions/{id}
```

Request:

```json
{
  "targetSubjectId": "id_...",
  "reason": "...",
  "scope": {}
}
```

Reglas:

- `SESSION_STEP_UP`;
- motivo obligatorio;
- alcance acotado;
- expiración;
- auditoría reforzada;
- no se convierte en permiso persistente;
- visible/revisable conforme 08;
- si operación unipersonal exige mecanismo complementario, pertenece a procedimiento/gobierno, no se oculta en la API.

---

# 23. TVCC-30 — P1 / frontera con 12

RF-058 es P1.

BE-LEG-09 **no fija fórmula**.

Hasta que 12 cierre la especificación analítica y exista consumidor real:

```text
cálculo reproducible interno
```

No se congela un endpoint P0.

Superficie futura candidata:

```text
GET /validation/tvcc-30
```

solo si:

- 12 define especificación/versionado;
- se preservan numerador y denominador;
- incluidos/excluidos y motivos son reconstruibles;
- se evita presentar TVCC-30 como salud/adherencia/retención.

---

# 24. Media privada — contrato condicionado a activación

Cuando fotos/evidencia visual se activen:

```text
POST /me/media/upload-intents
GET  /media/{mediaId}/access
```

o superficies específicas del recurso.

Reglas de 08/07:

- storage privado;
- URLs firmadas temporales;
- EXIF depurado cuando corresponda;
- acceso por PDP;
- no storage key pública;
- eliminación/supresión coordinada con derivados/política;
- no datos identificables enviados a IA externa MVP.

No se fuerza media en flujos donde es opcional.

---

# 25. Rate limiting — no crea endpoints

El 09 mantiene:

```text
429 RATE_LIMITED
```

con respuestas neutras.

Aplicación crítica:

- login;
- recuperación;
- registro;
- endpoints públicos/semipúblicos;
- operaciones de alta sensibilidad.

Los valores numéricos pertenecen a configuración/11A, no a este catálogo.

---

# 26. Corrección de prioridades consolidada

| Capacidad | Prioridad |
|---|---|
| Open Food Facts controlled import | **P0 API** |
| wger controlled import | **P0 API** |
| catálogo BE + carga manual | **P0** |
| recovery | P1 |
| Google Identity | P1 |
| access methods híbridos | P2/recortable |
| anthropometry discovery | P1 |
| coordination notes | P1 |
| TVCC-30 | P1 |
| internal news | P1 |
| push | P2 |
| capacity admin UI/API | P1 |
| incidents | P1 |
| account closure | P1 |
| rights/export | **obligación 08 para datos reales**, independiente de clasificación académica |
| break-glass | obligación de seguridad excepcional |

---

# 27. Nuevos códigos de error

## Integración/catálogo

```text
CATALOG_ITEM_INVALID
CATALOG_ITEM_CONFLICT
IMPORT_CANDIDATE_NOT_RESOLVABLE
REVIEWED_CONTENT_INVALID
PROVIDER_RESPONSE_INVALID
```

Más:

```text
DEPENDENCY_UNAVAILABLE
IDEMPOTENCY_KEY_REUSED
RESOURCE_NOT_FOUND
```

## Rights/export

```text
DATA_RIGHTS_REQUEST_INVALID
DATA_RIGHTS_REQUEST_NOT_ACTIONABLE
EXPORT_SCOPE_INVALID
EXPORT_NOT_READY
```

## Break-glass

```text
BREAK_GLASS_REASON_REQUIRED
BREAK_GLASS_SCOPE_INVALID
BREAK_GLASS_NOT_ALLOWED
```

No se usan códigos que revelen existencia protegida.

---

# 28. Pruebas obligatorias hacia 11A

## Integraciones P0

- OFF/wger caída → fallback sigue disponible;
- nunca success falso;
- candidate no contamina catálogo;
- IMPORT crea elemento BE con provenance;
- REJECT no incorpora;
- profesional puede corregir antes de importar;
- corrección preserva fuente original;
- provider recovery no pisa manual;
- provider response incompleta puede rechazarse;
- activación nunca realiza I/O externo;
- retries no duplican candidate/import.

## P1/P2 / 08

- recovery existente vs inexistente neutral;
- cambio de credencial revoca sesiones;
- Google no crea segunda identidad;
- no se elimina último método de acceso;
- cierre invalida sesiones y no borra silenciosamente;
- export no arrastra datos de terceros;
- rights requests solo del titular;
- incident history append-only;
- capacity sin banda = SIN_LIMITE;
- discovery sin marketplace;
- coordination note no crea review;
- push no contiene C4;
- break-glass expira y audita;
- media signed URL expira.

---

# 29. Hallazgos nuevos

## H-09-12-01 — prioridad de integraciones mal clasificada en borradores previos

**CORREGIDO en esta versión.**

No requiere cambio del canon.

## H-09-12-02 — P0 no funciona de verdad si solo existe `GET catalog`

El canon exige catálogo propio + carga manual.

Por eso se incorpora una operación de creación manual en Nutrición y Entrenamiento.

## H-09-12-03 — rights/export no deben perderse por ser “P1 funcional”

08 los exige antes/durante operación real conforme a su gate y políticas.

Se especifican ahora para que 09 no quede funcionalmente completo pero jurídicamente hueco.

---

# 30. Candidatas nuevas

| ID | Propuesta | Estado |
|---|---|---|
| `CAND-09-INT-A` | candidate→review→resolve para importación P0 | PROPUESTA RECOMENDADA |
| `CAND-09-INT-B` | endpoints separados por dominio, patrón interno común | PROPUESTA RECOMENDADA |
| `CAND-09-INT-C` | carga manual explícita P0 | DERIVADA / materialización propuesta |
| `CAND-09-RGT-A` | `/me/data-rights-requests` unifica ACCESS/RECTIFICATION/SUPPRESSION | PROPUESTA RECOMENDADA |
| `CAND-09-EXP-A` | export propio como job scoped/auditado | DERIVADA / materialización propuesta |
| `CAND-09-BG-A` | break-glass como sesión temporal, no rol permanente | DERIVADA / materialización propuesta |

---

# 31. Estado de salida

```text
BE-LEG-09:
EN DESARROLLO

P0 VERTICALES:
ACC/PRO/REL/CON — v0.8
NUT — v0.9
TRN — v0.10
ANT/PROJECTIONS — v0.11

CORRECCIÓN:
RF-028 + RF-038 → P0 API

INTEGRACIONES P0:
OFF + WGER CONTRACTUALMENTE MATERIALIZADAS

P0 MÁXIMO CANDIDATO:
97 OPERACIONES
(SUJETO A RATIFICACIÓN/REDUCCIÓN FINAL)

P1/P2:
CONTRATOS DE SOPORTE DELIMITADOS

08→09:
RIGHTS / EXPORT / BREAK-GLASS / RECOVERY / PUSH
CUBIERTOS A NIVEL CONTRACTUAL DE BORRADOR

TVCC-30:
NO P0 HTTP
FRONTERA 12 PRESERVADA

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
v0.13 — CONSOLIDACIÓN + TRAZABILIDAD INTEGRAL
→ CONTRARREVISIÓN EXTERNA
```

---

*Fin de BE-LEG-09 v0.12 — Integraciones P0 y contratos de soporte P1/P2.*
