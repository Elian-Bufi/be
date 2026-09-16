# BE-LEG-09 v0.16.1 — Corrección contractual A3 post-DoR B10-02

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09 — Interfaces y Contratos API`  
> **Versión:** `v0.16.1 — CORRECCIÓN CONTRACTUAL A3`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR CONTRACTUAL POST-IMPACTO UX · NO APROBADO`  
> **Normativa funcional consumida:** BE-LEG-04 v0.4.2.1 · BE-LEG-05 v0.15 · BE-LEG-06 v0.1.1 · BE-LEG-07 sin cambio · BE-LEG-08 v0.1.5  
> **Legacy:** `NO NORMATIVO — SOLO REFERENCIA`  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Datos reales:** `NO AUTORIZADOS POR ESTE DOCUMENTO`

---

> **Control de cambio v0.16:** la totalidad de §§0–19 conserva la consolidación v0.15 como baseline contractual previa. `§20` es la reconciliación autorizada por `ACTA-DIR-025`. Cuando §20 actualiza conteos, fuentes o contratos afectados, **§20 prevalece para v0.16**. v0.15 SHA-256: `5cf63f29b814dfbe1254f52d3c9f16619ee38794f604ed921052022940fbe9e6`.

> **Control de cambio v0.16.1:** `ACTA-DIR-028` identifica `H-09-10-A3-01` al abrir B10-02. Todo el contenido normativo de v0.16 se preserva; §31 agrega exclusivamente contratos para A3 `DATOS_SALUD_BE`. v0.16 SHA-256: `0b9bc99a6a27e182695be02397a79908a7bc012bcd078472acd8aa8f79ae6ce4`.

# 0. Propósito

Cerrar la corrección documental de BE-LEG-09 después de la contrarrevisión interna adversarial de `v0.14` y dejar un único objeto trazable para la decisión de Dirección y la revisión cruzada exigible por gobierno.

Esta versión **no rediseña la API**. Mantiene la arquitectura contractual ya contrastada y corrige el único MAJOR que sobrevivió al ciclo 3 interno: el registro incompleto de candidatas. Además materializa una decisión expresa de Dirección sobre Nutrición:

> **La modalidad C de registro nutricional libre forma parte del P0 cuando el asesorado consume una comida o ingesta fuera de lo prescripto por el plan.**

Consecuencias controladas:

1. `FREE_DESCRIPTION` se conserva como P0, pero se delimita a `OUTSIDE_PRESCRIPTION`;
2. ese registro no modifica el plan ni convierte una comida prescripta en cumplida;
3. puede coexistir con ejecuciones estructuradas de comidas prescriptas;
4. el original libre permanece inmutable;
5. un profesional autorizado puede estructurarlo después como **estimación trazable** mediante `API-NUT-21`;
6. se corrige la idempotencia para no imponer unicidad de ocurrencia planificada a múltiples ingestas libres del mismo día;
7. el inventario P0 pasa de 97 a **98 API-09 IDs explícitos**, ahora reproducibles por ID.

No se agrega marketplace, score, diagnóstico, implementación, datos reales ni autoridad del legacy.

---

## 0.1 Tratamiento de las contrarrevisiones

### Ciclo 2 con canon disponible

```text
BLOCKER: 0
MAJOR:   3
MINOR:  11
```

`v0.14` cerró correctamente:

- `F-A1` — precedencia PDP/revelabilidad antes de errores semánticos/concurrentes;
- `N-1` — inventario RNF: 38 RNF / 13 familias;
- `11/11 MINOR`.

### Ciclo 3 interno adversarial

La revisión interna de `v0.14` confirmó:

```text
F-A1: CERRADO
N-1:  CERRADO
MINOR CICLO 2: 11/11 CERRADOS
RF:   67/67
UC:   53/53
TR:   5/5
RNF:  38/38
API P0 explícitas v0.14: 97 IDs únicos
```

El único MAJOR abierto fue:

```text
F-A4-C3
→ el registro de decisiones candidatas seguía incompleto
→ 20 CAND-09 históricas no tenían disposición en v0.14
```

`v0.15` corrige ese defecto con un registro exhaustivo de **55 candidatas actuales/históricas** y resuelve la única decisión de producto que modificaba el contador P0: modalidad C nutricional.

### Resolución expresa de Dirección — 2026-08-31

Dirección establece:

```text
Si el asesorado consume una comida/ingesta fuera de las prescriptas por el plan,
BE P0 debe permitir registrarla de forma libre/descriptiva.
```

Esta resolución se materializa en §11.2 y §15.

## 0.2 Naturaleza de la revisión

La contrarrevisión del ciclo 3 fue ejecutada por el mismo agente que participó en la redacción/corrección, por pedido expreso de Dirección. Por ello:

```text
es una pasada adversarial válida
≠ revisión cruzada independiente
```

BE-LEG-00 mantiene la separación de roles y la revisión cruzada según criticidad. Esta versión puede quedar lista para esa verificación final sin reabrir arquitectura.

---

# 1. Custodia de los artefactos consumidos

| Artefacto | SHA-256 local | Rol |
|---|---|---|
| `BE_LEG_09_v0.7_CONTRATO_TRANSVERSAL_V1_2026-08-31.md` | `7a5b6fb04d25667820daa06b8a0246be8ed123e79c3c6d76c83af8a8c7974fbe` | Contrato transversal v1 |
| `BE_LEG_09_v0.8_CONTRATOS_ACCESO_GOBIERNO_P0_2026-08-31.md` | `f775e3cc8cb55a7d3de69dd1262cb535e05b9d9e588d7a46f0fcd2d0c9c89662` | Acceso, profesional, vínculo y consentimiento |
| `BE_LEG_09_v0.9_CONTRATOS_P0_NUTRICION_2026-08-31.md` | `480b0b5b0c6a024fa697e008fdaa97103e184df06f1f252db3e1d417d8ee15e8` | Nutrición P0 |
| `BE_LEG_09_v0.10_CONTRATOS_P0_ENTRENAMIENTO_2026-08-31.md` | `3bded933e19a5c67118f415f1391264f75240f3e814032cfa1837ecd3d84ae8b` | Entrenamiento P0 |
| `BE_LEG_09_v0.11_CONTRATOS_P0_ANTROPOMETRIA_Y_PROYECCIONES_2026-08-31.md` | `0085153a25a3de13c12d229286319bbf33ae3fb9a95fe869ae7817622866e60c` | Antropometría, dashboard y proyecciones |
| `BE_LEG_09_v0.12_INTEGRACIONES_P0_Y_SOPORTE_P1_P2_2026-08-31.md` | `8a3db34e8c4991d427f089c6424da13daa35d883c7f06171e78daac02441f8c5` | Integraciones P0 + soporte P1/P2 |

Estos hashes identifican los archivos locales usados para esta consolidación. **No son hashes canónicos del repositorio** y esta versión no ejecuta ninguna operación Git.

## 1.1 Fuentes canónicas consumidas y fijadas por versión/hash

| Fuente canónica | Versión consumida | SHA-256 verificado | Propiedad que aporta al 09 |
|---|---:|---|---|
| BE-LEG-04 | `v0.4.1` | `c9513b4020ff8cdcb8639f6dbef02e1ee42048091f96f2c93522a20d290623da` | 67 RF + 38 RNF |
| BE-LEG-05 | `v0.14` | `1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d` | 53 UC + 5 TR + prioridades |
| BE-LEG-06 | `v0.1` canónico post-custodia | `2200dba6313a11a8dfcfd3f62fa12d00f27bbf99985e9a61ef62eebf3228b727` | dominio, estados, invariantes, proyecciones |
| BE-LEG-07 | `v0.1.11` | `ef4a4b082275afed8b8de7348f7201019c8dcc92f03875c2b53284c6445ead7d` | arquitectura + frontera contractual §60 |
| BE-LEG-08 | `v0.1.4` | `21d8e639a49b81cf1b679b4146aeaebd3306544c3c4e0c298d47893fbd1f0e6e` | seguridad/privacidad + obligaciones §48 |

La custodia externa del ciclo 2 también verificó BE-LEG-00 v0.2.1 y las actas vigentes. Esta tabla fija específicamente las cinco fuentes normativas cuyo contenido contractual se consume de forma directa en el 09.

---

# 2. Correcciones acumuladas de los borradores

## C-09-13-01 — Open Food Facts y wger son P0 API

v0.9/v0.10 los habían tratado como diferibles. v0.12 lo corrigió porque `RF-028` y `RF-038` son `P0 API`.

Estado: **CORREGIDO**.

## C-09-13-02 — RF-057 Coordinación también es P0

v0.4/v0.12 habían dejado coordinación/notas como P1. El maestro final del 05 fija:

```text
RF-057 → UC-E07 / UC-I02 / UC-I03 → P0
```

Por lo tanto se incorpora al corte P0 una única escritura explícita:

```http
POST /api/v1/advisees/{adviseeId}/coordination-notes
```

No se agrega un GET P0 separado: la lectura autorizada de la nota se consume por `dashboard/timeline`, evitando duplicar una superficie ya existente.

Estado: **CORREGIDO EN v0.13**.

## C-09-13-03 — Prioridades finales consumidas

Sobre los 67 RF activos:

```text
P0 = 57
P1 = 8
P2 = 2
TOTAL = 67

Huecos históricos no reutilizados:
RF-016
RF-063
```

P1 final: `RF-003, RF-005, RF-051, RF-058, RF-061, RF-066, RF-068, RF-069`.

P2 final: `RF-004, RF-062`.

---

# 3. Baseline contractual consolidada

## 3.1 HTTP y representación

- HTTPS.
- prefijo obligatorio `/api/v1`.
- JSON `camelCase`.
- éxito simple: `{ "data": ... }`.
- colección: `{ "data": [], "page": { "limit", "nextCursor", "hasMore" } }`.
- `204` solo cuando no existe representación útil.
- listas con paginación cursor opaca.
- filtros/sorts allowlist; **todo parámetro de query desconocido o no permitido para esa operación se rechaza** con `400 INVALID_REQUEST`; no se ignoran parámetros silenciosamente.

## 3.2 ErrorEnvelope

```json
{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "...", "details": {} } }
```

Reglas consolidadas:

- `code` estable y machine-readable;
- `message` seguro;
- `details` opcional y sin internals/C4/C5;
- `401 AUTHENTICATION_REQUIRED / SESSION_INVALID / SESSION_EXPIRED / SESSION_REVOKED` para identidad/sesión;
- `403 MFA_REQUIRED / STEP_UP_REQUIRED / ACTION_FORBIDDEN` solo cuando la prohibición puede revelarse sin filtrar existencia del recurso;
- `404 RESOURCE_NOT_FOUND` para inexistente **o no revelable**;
- `409` para conflicto concurrente/único/idempotency-key;
- `422` para transición/semántica inválida sobre recurso conocido;
- `429 RATE_LIMITED`;
- `503 DB_UNAVAILABLE` o `DEPENDENCY_UNAVAILABLE` según origen.

### 3.2.1 Precedencia de revelabilidad y errores — regla transversal

En toda operación dirigida a un recurso cuya existencia pueda ser sensible, el orden contractual es:

```text
1. sesión/AuthN mínima y step-up global requerido por la operación, aplicado de forma independiente del recurso objetivo
2. resolución de identidad y evaluación PDP/revelabilidad
3. solo si el recurso es revelable:
   schema/payload → semántica → estado → concurrencia → unicidad → idempotencia
```

Reglas duras:

- recurso inexistente **o no revelable** para ese actor/contexto → `404 RESOURCE_NOT_FOUND`;
- no se responde `409`, `422`, ni detalles de unicidad/idempotencia/concurrencia sobre un recurso no revelable;
- la clase de error, el body y los detalles no pueden actuar como oráculo de existencia;
- `429 RATE_LIMITED` pertenece al borde/canal y se aplica de forma neutral, sin depender de si el recurso objetivo existe;
- la implementación y 11A deberán verificar que no haya diferencias observables útiles de timing/detalle entre inexistente y no revelable más allá de tolerancias operativas inevitables.
- una falla de transporte/sintaxis completamente **independiente de la existencia del recurso** —por ejemplo JSON mal formado antes de poder interpretar un identificador— puede rechazarse antes del PDP; esa validación temprana no puede consultar ni revelar estado/existencia del recurso objetivo.

Esta regla materializa la denegación **uniforme** exigida por 08 §48.

## 3.3 Sesión ≠ autorización

Token/sesión identifica actor y sesión. El acceso sensible se recalcula server-side con estado actual:

```text
actor
+ cuenta/sesión
+ verificación/habilitación
+ vínculo
+ Alcance
+ consentimiento B2 exacto
+ finalidad
+ pertinencia
= autorización efectiva
```

No se delega al frontend ocultar campos.

## 3.4 Concurrencia e idempotencia

- `version` opaca en recursos mutables relevantes.
- `expectedVersion` en comandos sujetos a concurrencia optimista.
- `409 VERSION_CONFLICT` para versión stale.
- `Idempotency-Key` selectivo en escrituras reintentables.
- el espacio de nombres de la key es `{actor autenticado × operación lógica}`; keys de actores distintos nunca colisionan de forma observable.
- misma key + **mismo actor/contexto** + mismo request lógico → mismo resultado lógico, sin duplicado.
- misma key dentro de ese mismo alcance + payload/request lógico diferente → `409 IDEMPOTENCY_KEY_REUSED`.
- la idempotencia observable debe tener respaldo de constraint/DB cuando el 07/06 lo exigen.

## 3.5 Compatibilidad

- contratos v1 no se reinterpretan silenciosamente;
- cambios incompatibles → `v2`;
- backend/runtime schema → OpenAPI determinista → cliente/tipos generados → compilación Website + APK → contract tests.

---

# 4. Matriz integral de los 67 RF

| RF | Prioridad | Capacidad | UC/TR canónico | Familia 09 | Superficie contractual consolidada | Estado |
|---|---|---|---|---|---|---|
| `RF-001` | **P0** | Identidad BE | UC-P25 | `ACC` | POST /registrations · GET /me · PATCH /me/profile | CUBIERTO |
| `RF-002` | **P0** | Acceso local | UC-P26 | `ACC` | POST /auth/sessions · DELETE session(s) · GET /me | CUBIERTO |
| `RF-003` | **P1** | Identidad federada | UC-E05 | `ACC-P1` | Google federated authorize/complete — P1 | CUBIERTO |
| `RF-004` | **P2** | Cuenta híbrida | UC-E06 | `ACC-P2` | GET/POST/DELETE /me/access-methods — P2 | CUBIERTO |
| `RF-005` | **P1** | Recuperación de cuenta | UC-E09 → UC-P26 | `ACC-P1` | POST /auth/recovery-requests · complete — P1 | CUBIERTO |
| `RF-006` | **P0** | Estado operativo | UC-P25 / UC-P26 | `ACC` | GET /me + session/account state | CUBIERTO |
| `RF-007` | **P0** | Canales y navegación | UC-I11 | `ACC/SYS` | Contrato first-party común; navegación concreta → 10 | CUBIERTO |
| `RF-008` | **P0** | Alta profesional | UC-P01 | `PRO` | GET/PATCH professional-profile | CUBIERTO |
| `RF-009` | **P0** | Alta profesional / alcance | UC-P01 / UC-I01 | `PRO` | PUT /me/professional-scopes + evidence | CUBIERTO |
| `RF-010` | **P0** | Alta profesional / presentación | UC-P01 | `PRO` | verification submissions + submit | CUBIERTO |
| `RF-011` | **P0** | Administración | UC-P02 | `PRO-ADM` | admin verification list/detail | CUBIERTO |
| `RF-012` | **P0** | Verificación profesional | UC-P02 / UC-P03 | `PRO-ADM` | resolve + suspend/reinstate | CUBIERTO |
| `RF-013` | **P0** | Subsanación | UC-E01 | `PRO` | new evidence/submission version + resubmit | CUBIERTO |
| `RF-014` | **P0** | Suspensión / rehabilitación | UC-P03 | `PRO-ADM` | suspend / reinstate professional scope | CUBIERTO |
| `RF-015` | **P0** | Gobierno de acceso | TR-01 / UC-P04 / UC-P05 | `REL/CON/SYS` | Separación + PDP; no endpoint autónomo | CUBIERTO |
| `RF-017` | **P0** | Identidad del asesorado | UC-P25 | `ACC` | registration + own profile | CUBIERTO |
| `RF-018` | **P0** | Vínculo — solicitud | UC-P04 | `REL` | POST /relationship-requests | CUBIERTO |
| `RF-019` | **P0** | Vínculo — decisión | UC-P05 | `REL` | list own requests + accept/reject | CUBIERTO |
| `RF-020` | **P0** | Consentimiento | UC-P07 | `CON` | consent-requirements + grant + own list | CUBIERTO |
| `RF-021` | **P0** | Autorización contextual | UC-I02 / TR-02 | `SYS/PDP` | server-side PDP en toda operación protegida | CUBIERTO |
| `RF-022` | **P0** | Revocación | UC-P08 / TR-05 | `CON` | POST /me/consents/{id}/revoke | CUBIERTO |
| `RF-023` | **P0** | Autogobierno | UC-P06 / UC-P07 / UC-P05 | `REL/CON` | own relationships + own consents + own requests | CUBIERTO |
| `RF-024` | **P0** | Vínculo — pausa/finalización | UC-P06 | `REL` | pause · resume · finalize | CUBIERTO |
| `RF-025` | **P0** | Continuidad longitudinal | UC-I03 / TR-03 | `SYS/DSH` | audit/history + timeline; no overwrite | CUBIERTO |
| `RF-026` | **P0** | Nutrición — evaluación | UC-P09 | `NUT` | nutrition evaluations | CUBIERTO |
| `RF-027` | **P0** | Catálogo nutricional | UC-P10 | `NUT/INT` | GET/POST catalog-items | CUBIERTO |
| `RF-028` | **P0** | Integración nutricional | UC-I07 / UC-P10 | `INT-NUT` | candidate → review/resolve Open Food Facts | CUBIERTO |
| `RF-029` | **P0** | Nutrición — objetivo | UC-P09 | `NUT` | nutrition objectives versioned | CUBIERTO |
| `RF-030` | **P0** | Plan nutricional | UC-P10 | `NUT` | plan draft list/detail/edit | CUBIERTO |
| `RF-031` | **P0** | Activación nutricional | UC-P11 / UC-I04 / UC-I10 | `NUT` | validate + activate, revalidation atomic | CUBIERTO |
| `RF-032` | **P0** | APK nutricional — Hoy | UC-P12 | `NUT` | GET /me/nutrition/today | CUBIERTO |
| `RF-033` | **P0** | APK nutricional — ejecución | UC-P12 | `NUT` | POST /me/nutrition/executions | CUBIERTO |
| `RF-034` | **P0** | Revisión nutricional | UC-P13 | `NUT` | review-context + reviews | CUBIERTO |
| `RF-035` | **P0** | Continuidad nutricional | UC-P13 / UC-I06 | `NUT` | POST review/{id}/apply | CUBIERTO |
| `RF-036` | **P0** | Entrenamiento — evaluación | UC-P14 | `TRN` | training evaluations | CUBIERTO |
| `RF-037` | **P0** | Catálogo de ejercicios | UC-P15 | `TRN/INT` | GET/POST training exercises | CUBIERTO |
| `RF-038` | **P0** | Integración entrenamiento | UC-I07 / UC-P15 | `INT-TRN` | candidate → review/resolve wger | CUBIERTO |
| `RF-039` | **P0** | Plan de entrenamiento | UC-P15 | `TRN` | training plan draft | CUBIERTO |
| `RF-040` | **P0** | Prescripción/estructura | UC-P15 | `TRN` | PATCH plan with blocks/sessions/prescriptions | CUBIERTO |
| `RF-041` | **P0** | Activación entrenamiento | UC-P16 / UC-I04 / UC-I10 | `TRN` | validate + activate, atomic | CUBIERTO |
| `RF-042` | **P0** | APK entrenamiento — Hoy | UC-P17 | `TRN` | GET /me/training/today | CUBIERTO |
| `RF-043` | **P0** | APK entrenamiento — ejecución real | UC-P17 | `TRN` | execution-draft → update → confirm | CUBIERTO |
| `RF-044` | **P0** | Corrección entrenamiento | UC-E02 / UC-I12 / UC-I03 | `TRN` | POST execution/{id}/corrections | CUBIERTO |
| `RF-045` | **P0** | Revisión entrenamiento | UC-P18 | `TRN` | review-context + reviews | CUBIERTO |
| `RF-046` | **P0** | Continuidad entrenamiento | UC-P18 / UC-I06 | `TRN` | POST review/{id}/apply | CUBIERTO |
| `RF-047` | **P0** | Antropometría — evaluación | UC-P19 | `ANT` | POST anthropometry evaluation | CUBIERTO |
| `RF-048` | **P0** | Cálculos antropométricos | UC-I09 / UC-P19 / UC-E03 | `ANT` | derived results inside evaluation/recalculation | CUBIERTO |
| `RF-049` | **P0** | Evolución antropométrica | UC-P20 | `ANT/PRJ` | GET anthropometry/progress | CUBIERTO |
| `RF-050` | **P0** | Corrección antropométrica | UC-E03 / UC-I12 / UC-I03 / UC-I09 | `ANT` | POST evaluation/{id}/corrections | CUBIERTO |
| `RF-051` | **P1** | Descubrimiento antropométrico | UC-P21 / UC-P22 / UC-E04 / UC-P04 / UC-P05 | `ANT-P1` | publish/search/detail limited — P1; descubrimiento desemboca en solicitud de vínculo | CUBIERTO |
| `RF-052` | **P0** | Dashboard profesional | UC-P23 / UC-I02 | `DSH` | GET /me/caseload | CUBIERTO |
| `RF-053` | **P0** | Dashboard interdisciplinario | UC-P24 / UC-I02 | `DSH` | GET /advisees/{id}/dashboard | CUBIERTO |
| `RF-054` | **P0** | Historial longitudinal | UC-P24 / UC-P31 / UC-I03 | `DSH` | timeline + own progress | CUBIERTO |
| `RF-055` | **P0** | Revisión y continuidad / pendientes | UC-P23 / UC-I05 | `DSH` | GET /me/review-queue | CUBIERTO |
| `RF-056` | **P0** | Revisión profesional común | UC-I05 → UC-P13 / UC-P18 | `NUT/TRN` | common review semantics in both verticals | CUBIERTO |
| `RF-057` | **P0** | Coordinación | UC-E07 / UC-I02 / UC-I03 | `CRD` | API-CRD-01 · POST /advisees/{id}/coordination-notes; lectura autorizada por timeline/dashboard | CUBIERTO |
| `RF-058` | **P1** | Analítica de validación TVCC-30 | UC-S01 / UC-P13 / UC-P18 vía UC-I05 / UC-I06 | `ANA-P1` | internal/reproducible; HTTP only when 12 closes spec — P1 | CUBIERTO |
| `RF-059` | **P0** | Resiliencia funcional | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 | `INT/SYS` | local catalog/manual fallback; no false success | CUBIERTO |
| `RF-060` | **P0** | Procedencia | UC-I08 / TR-04 / UC-P10 / UC-P15 | `INT/SYS` | provenance in imported/catalog data | CUBIERTO |
| `RF-061` | **P1** | Comunicaciones | UC-P30 | `COM-P1` | GET /me/news... — P1 | CUBIERTO |
| `RF-062` | **P2** | Push | UC-E08 | `COM-P2` | push subscription/delivery minimal, no C4 — P2 | CUBIERTO |
| `RF-064` | **P0** | Objetivo entrenamiento | UC-P14 | `TRN` | training objectives versioned | CUBIERTO |
| `RF-065` | **P0** | APK longitudinal | UC-P31 / UC-I02 | `DSH` | GET /me/progress | CUBIERTO |
| `RF-066` | **P1** | Administración académica / capacidad | UC-P29 / UC-I10 / UC-P11 / UC-P16 / UC-P19 / UC-P21 | `ADM-P1 + SYS` | admin settings P1; P0 gate consumed by activation/evaluation | CUBIERTO |
| `RF-067` | **P0** | Alta profesional / capacidad antropométrica | UC-P01 / UC-I01 | `PRO` | same evidence pipeline; scope/capability independent | CUBIERTO |
| `RF-068` | **P1** | Incidencias | UC-P28 | `ADM-P1` | incidents minimal — P1 | CUBIERTO |
| `RF-069` | **P1** | Ciclo de vida de cuenta | UC-P27 | `ACC-P1` | account-closure requests — P1; sessions invalidated | CUBIERTO |

**Resultado:** `67/67 RF` poseen hogar contractual o una derivación explícita a una regla transversal/propietario externo. No se reutilizan `RF-016` ni `RF-063`.

---

# 5. Matriz integral de los 53 UC

## 5.1 Casos principales — 31/31

| UC | Nombre | Materialización en 09 |
|---|---|---|
| `UC-P01` | Gestionar alta profesional escalonada | PRO profile/scopes/evidence/submissions |
| `UC-P02` | Revisar solicitud y resolver verificación profesional | PRO admin list/detail/resolve |
| `UC-P03` | Suspender o rehabilitar capacidad profesional | PRO admin suspend/reinstate |
| `UC-P04` | Solicitar o invitar a un vínculo | REL create request |
| `UC-P05` | Aceptar o rechazar un vínculo | REL own requests + accept/reject |
| `UC-P06` | Consultar, pausar o finalizar un vínculo | REL list/detail/pause/resume/finalize |
| `UC-P07` | Otorgar y consultar consentimiento específico | CON requirements/grant/list |
| `UC-P08` | Revocar consentimiento | CON revoke |
| `UC-P09` | Registrar evaluación y objetivo nutricional | NUT evaluations + objectives |
| `UC-P10` | Diseñar plan nutricional | NUT plans + local catalog + OFF controlled import |
| `UC-P11` | Validar y activar plan nutricional | NUT validate + activate |
| `UC-P12` | Consultar y registrar ejecución nutricional en APK | NUT today + executions |
| `UC-P13` | Revisar evidencia y decidir continuidad nutricional | NUT review-context + review + apply |
| `UC-P14` | Registrar evaluación y objetivo de entrenamiento | TRN evaluations + objectives |
| `UC-P15` | Diseñar plan de entrenamiento | TRN plans + exercise catalog + wger controlled import |
| `UC-P16` | Validar y activar plan de entrenamiento | TRN validate + activate |
| `UC-P17` | Consultar y registrar ejecución entrenamiento en APK | TRN today + draft/update/confirm |
| `UC-P18` | Revisar evidencia y decidir continuidad entrenamiento | TRN review-context + review + apply |
| `UC-P19` | Registrar evaluación antropométrica | ANT specification + create evaluation + derived results |
| `UC-P20` | Consultar evolución antropométrica | ANT progress / projection |
| `UC-P21` | Publicar servicio antropométrico limitado | ANT discovery publishing — P1 |
| `UC-P22` | Descubrir servicio antropométrico | ANT discovery search/detail + REL request — P1 |
| `UC-P23` | Consultar cartera y revisiones pendientes | DSH caseload + review-queue |
| `UC-P24` | Consultar dashboard y línea temporal interdisciplinaria | DSH dashboard + timeline |
| `UC-P25` | Registrar identidad BE y perfil propio | ACC registration + me/profile |
| `UC-P26` | Autenticar y finalizar sesión local | ACC sessions |
| `UC-P27` | Solicitar cierre de cuenta | ACC account closure — P1 |
| `UC-P28` | Registrar y gestionar incidencia administrativa | ADM incidents — P1 |
| `UC-P29` | Configurar habilitaciones y capacidad académica | ADM capacity settings — P1; SYS gate P0 |
| `UC-P30` | Consultar novedades internas | COM news — P1 |
| `UC-P31` | Consultar progreso longitudinal en APK | DSH me/progress |

## 5.2 Casos incluidos — 12/12

| UC | Nombre | Materialización en 09 |
|---|---|---|
| `UC-I01` | Presentar evidencia versionada | PRO evidence/submission; private upload intent when media evidence applies |
| `UC-I02` | Evaluar autorización contextual | PDP interno en toda operación protegida |
| `UC-I03` | Registrar auditoría y preservar historia | audit/history transversal |
| `UC-I04` | Validar y versionar un plan | inside NUT/TRN validate+activate |
| `UC-I05` | Registrar revisión profesional válida | shared semantics in NUT/TRN reviews |
| `UC-I06` | Aplicar continuidad o cierre | shared semantics in review apply |
| `UC-I07` | Importar elemento externo con revisión controlada | OFF/wger candidate→resolve |
| `UC-I08` | Aplicar fallback manual y conservar procedencia | catalog/adapters transversal |
| `UC-I09` | Emitir cálculos antropométricos reproducibles | ANT derived results |
| `UC-I10` | Verificar habilitación y capacidad antes de iniciar proceso | internal gate |
| `UC-I11` | Encauzar actor por superficie prevista | same first-party API semantics; UI navigation → 10 |
| `UC-I12` | Registrar corrección trazable | TRN/ANT correction pattern + NUT `API-NUT-21` para estructuración trazable de `FREE_DESCRIPTION` fuera de prescripción |

## 5.3 Extensiones — 9/9

| UC | Nombre | Materialización en 09 |
|---|---|---|
| `UC-E01` | Subsanar y volver a presentar evidencia | PRO new evidence/submission version + submit |
| `UC-E02` | Corregir ejecución de entrenamiento | TRN corrections |
| `UC-E03` | Corregir evaluación antropométrica | ANT corrections + dependent recalculation |
| `UC-E04` | Solicitar vínculo desde descubrimiento antropométrico | reuse REL request |
| `UC-E05` | Acceder mediante Google | ACC federated — P1 |
| `UC-E06` | Administrar métodos de acceso | ACC access methods — P2 |
| `UC-E07` | Registrar nota de coordinación autorizada | POST coordination-notes P0 + timeline/dashboard |
| `UC-E08` | Recibir notificación push no sensible | COM push — P2 |
| `UC-E09` | Recuperar el acceso local | ACC recovery — P1 |

## 5.4 Soporte — 1/1

| UC | Nombre | Materialización en 09 |
|---|---|---|
| `UC-S01` | Obtener TVCC-30 de manera reproducible | ANA internal/P1; final analytical spec → 12 |

**Resultado cuantitativo:** `31 + 12 + 9 + 1 = 53/53`.

---

# 6. Las 5 reglas TR y su materialización

| TR | Regla | Contrato 09 | Control negativo mínimo |
|---|---|---|---|
| `TR-01` | Separación identidad–especialidad–habilitación–vínculo–consentimiento–autorización | Schemas, estados y errores no fusionan conceptos; registrationIntent no concede rol profesional ni acceso | crear identidad no habilita terceros |
| `TR-02` | Autorización contextual | PDP server-side en toda operación protegida + proyección mínima | IDOR/cross-tenant/scope/purpose/pertinence |
| `TR-03` | Auditoría, autoría, versionado e historia | append-only/correction/version; request correlation; audit blocking where 08 requires | no overwrite silencioso; audit failure bloquea cuando aplica |
| `TR-04` | Procedencia y resiliencia | OFF/wger candidate→review→resolve; manual/local fallback; provider provenance | provider down no false success ni contamina catálogo |
| `TR-05` | Revocación efectiva | consent revoke + immediate recalculation/no cache + neutral denials | primera operación posterior ya no accede |

---

# 7. Consumo de BE-LEG-06

El 09 no redefine dominio. Expone el comportamiento del 06.

| Área 06 | Contrato 09 | Restricción preservada |
|---|---|---|
| M-01 Identidad | ACC | Identidad, perfil, método de acceso y sesión separados |
| M-02 Verificación | PRO | verificación por Alcance; observación/subsanación no es quinto estado |
| M-03 Vínculo/consentimiento | REL/CON | aceptar vínculo ≠ consentir; pause/finalize no borran historia |
| M-04 Procesos | NUT/TRN/ANT + DSH | activación/continuidad respetan lifecycle; no editar status genérico |
| M-05 Capacidad | SYS gate + ADM P1 | gate P0 consume capacidad; config administrativa puede ser P1 |
| M-06 Patrón común | todas | version/instantánea/corrección/procedencia |
| M-07 Nutrición | NUT | draft ≠ active; snapshot; objetivo versionado; no score |
| M-08 Entrenamiento | TRN | planificado ≠ ejecutado; draft→registered; sustitución/corrección trazables |
| M-09 Antropometría | ANT | directo ≠ derivado; cálculo reproducible; correction→selective recalc |
| M-10 Revisión | NUT/TRN review | única semántica de revisión válida y continuidad |
| M-11 Proyecciones | DSH/PRJ | solo lectura; ocho proyecciones; sin write authority/global score |
| M-12 Analítica | ANA | TVCC-30 reproducible; definición final coordinada con 12 |

Reglas longitudinales preservadas:

- `NO_DATA ≠ 0`;
- no interpolación;
- no imputación;
- no carry-forward;
- `occurredAt ≠ recordedAt`;
- no inferir causalidad por proximidad temporal;
- no mezclar mediciones/cálculos o series no comparables.

---

# 8. Consumo vinculante de BE-LEG-07 §60

| Obligación 07 | Materialización 09 | Estado |
|---|---|---|
| REST sobre HTTPS + `/api/v1` | baseline v0.7 y todas las rutas | CUMPLE |
| Error envelope `{error:{code,message,details?}}` | registry transversal + códigos por vertical | CUMPLE |
| 503 `DB_UNAVAILABLE` | registry transversal | CUMPLE |
| Paginación obligatoria en listados | cursor envelope | CUMPLE COMO TO-BE |
| Idempotencia observable con soporte DB | Idempotency-Key selectiva + natural/unique constraints | CUMPLE COMO CONTRATO |
| Concurrencia optimista expuesta | `version` + `expectedVersion` + 409 | CUMPLE |
| Breaking change ⇒ v2 | compatibility policy | CUMPLE |
| 09 elige retry/idempotency semantics | matriz retry + replay/conflict rules | CUMPLE |
| 09 decide re-activation semantics | `CAND-09-TRV-REACT`: replay de misma key ≠ nuevo comando; mismo recurso ya activo → 422; activo incompatible → 409 | CANDIDATO REGISTRADO — PENDIENTE DE RATIFICACIÓN |
| OpenAPI/anti-drift | backend schema→OpenAPI→generated clients→CI | CUMPLE COMO DISEÑO |

### CAND-09-TRV-REACT — semántica de reactivación

La decisión diferida expresamente por 07 §60 se registra de forma separada:

1. replay con la **misma** `Idempotency-Key` dentro del mismo actor/contexto/operación → devuelve el resultado lógico original;
2. nuevo comando equivalente sobre **ese mismo recurso ya ACTIVE** → `422 INVALID_STATE_TRANSITION`;
3. existe **otro recurso activo incompatible** con la operación → `409 ACTIVE_PLAN_CONFLICT`;
4. `expectedVersion` stale sigue siendo `409 VERSION_CONFLICT`.

La alternativa es compatible con la conducta del 05 §7.7 V02/E04, pero permanece como **decisión candidata** hasta ratificación; no se la presenta como canon ya aprobado.

---

# 9. Consumo vinculante de BE-LEG-08 §48

| Obligación 08→09 | Materialización | Estado |
|---|---|---|
| Revocación corta acceso inmediatamente; sin caché permisiva | CON revoke + PDP recalc por operación | CUBIERTA |
| Grant/query/revoke con versión mostrada=aceptada | consent-requirements + grant by consentVersionId + own list/revoke | CUBIERTA |
| Misma autorización Website/APK | único PDP API first-party | CUBIERTA |
| Anti-enumeración inexistente ≡ no autorizado | 404 RESOURCE_NOT_FOUND + listas omiten | CUBIERTA |
| Cierre de cuenta invalida sesiones | account closure P1 + session revocation | CUBIERTA CONTRACTUAL |
| Export scope por sujeto + auditoría | /me/exports job scoped | CUBIERTA CONTRACTUAL |
| Derechos acceso/rectificación/supresión | /me/data-rights-requests + deadline operacional derivado | CUBIERTA CONTRACTUAL |
| MFA/step-up admin | SESSION_MFA / SESSION_STEP_UP | CUBIERTA |
| Break-glass MFA/step-up y auditado | temporal break-glass session; no permanent role | CUBIERTA CONTRACTUAL |
| Rate limiting neutro | 429 RATE_LIMITED + neutral responses | CUBIERTA |
| Recuperación sin enumeración | 202 neutral recovery request | CUBIERTA CONTRACTUAL |
| Ninguna respuesta incluye datos de terceros | subject/PDP projection + export restriction | CUBIERTA; PRUEBA 11A |
| Push jamás C4 | minimal reference payload + authenticated fetch | CUBIERTA CONTRACTUAL |

Además, si media/fotos se activa: storage privado, acceso mediado, URL firmada temporal, EXIF depurado cuando corresponda y PDP/auditoría aplicables. La activación real sigue condicionada por 08.

---

# 10. RNF — superficie que toca al Documento 09

El 04 contiene **38 RNF activos en 13 familias**. El 09 no es propietario de los 38, pero materializa contractualmente los que afectan interfaces y deja trazada la derivación de los demás.

| Familia RNF | Cantidad canónica | Incidencia en 09 | Tratamiento / frontera |
|---|---:|---|---|
| SEC | 6 | AuthN/AuthZ, no exposición, auditoría, manejo seguro de errores | PDP, MFA/step-up según 08, anti-enumeration, safe envelope |
| PRI | 3 | revocación, minimización, visibilidad | proyección server-side, hot revocation, no third-party leakage |
| PERF | 3 | comportamiento observable y externos | pagination/bounded queries; budgets/timeouts exactos → 07/11A |
| AVA | 2 | disponibilidad/degradación | 503 + semántica de dependencia/fallback |
| REC | 2 | idempotencia/recuperación | contrato de Idempotency-Key; RPO/RTO/backups → 07/11A |
| REL | 1 | **ausencia de éxito falso** | `RNF-REL-001`: si persistencia/auditoría/dependencia obligatoria falla, no se devuelve éxito; codificación exacta pertenece al 09 |
| ACC | 3 | canales/accesibilidad | misma semántica API Web/APK; UI/accesibilidad aplicada → 10/11A |
| PORT | 1 | build/instalación/operación de APK | `RNF-PORT-001`: no es conducta HTTP; trazabilidad hacia 07/10/11A |
| MAN | 4 | mantenibilidad, compatibilidad, anti-drift, migraciones/contratos | OpenAPI/client generation/CI/versionado; mecanismos de despliegue → 07 |
| OBS | 3 | correlación/health/trazabilidad | `X-Request-Id`, contratos health/error; infraestructura logs → 07 |
| INT | 3 | terceros/procedencia/fallback | OFF/wger candidate→review→resolve + procedencia/fallback |
| SCA | 2 | capacidad/escalabilidad | gate semantics; sizing/config/umbrales → 06/07/11A |
| DAT | 5 | consistencia/historia/proyección | versioning, corrections, no overwrite, no-data honesty |

Control aritmético:

```text
6 + 3 + 3 + 2 + 2 + 1 + 3 + 1 + 4 + 3 + 3 + 2 + 5 = 38
13 familias
```

**Frontera:** performance budgets, RPO/RTO, deployment, logging infrastructure, DB mechanics, build físico APK y exact load thresholds permanecen en 07/10/11A según propiedad. El 09 fija únicamente la conducta contractual observable que le corresponde.

---

# 11. P0 consolidado por vertical

## 11.1 Access / professional / relationship / consent

Cubierto por v0.8: registration, sessions, own profile, professional onboarding, evidence, administrative verification, relationship lifecycle, consent lifecycle.

## 11.2 Nutrition

Cubierto por v0.9 + v0.12 + resolución de Dirección 2026-08-31:

- evaluation;
- immutable/versioned objective;
- plan draft;
- validate;
- activate;
- catalog;
- Today;
- execution;
- review;
- continuity;
- local catalog creation;
- controlled Open Food Facts import;
- registro libre de ingestas **fuera de prescripción**;
- estructuración profesional posterior trazable de ese registro libre.

### 11.2.1 Modalidad C P0 — `FREE_DESCRIPTION` fuera de prescripción

La modalidad C queda **RESUELTA POR DIRECCIÓN** como P0, con una frontera estricta:

```text
PRESCRIBED
→ usar el modo estructurado que corresponda al plan

OUTSIDE_PRESCRIPTION
→ puede usar FREE_DESCRIPTION
```

Request conceptual:

```json
{
  "activePlanId": "nplan_...",
  "occurredAt": "...",
  "recording": {
    "origin": "OUTSIDE_PRESCRIPTION",
    "mode": "FREE_DESCRIPTION",
    "description": "Comí milanesa con puré y una gaseosa.",
    "portionDescription": "..."
  },
  "visualEvidenceUploadIds": []
}
```

Reglas:

- requiere un contexto de plan activo, pero **no** una `plannedMealOccurrence`;
- no modifica el plan ni su snapshot;
- no marca una comida prescripta como realizada;
- no sustituye silenciosamente una ocurrencia planificada;
- puede haber más de una ingesta `OUTSIDE_PRESCRIPTION` en un mismo día;
- conserva `occurredAt`, `recordedAt`, autoría y procedencia;
- sin estructura posterior, el texto sigue siendo texto: BE no infiere alimento, cantidad, calorías ni macros;
- entra al contexto de revisión y al contraste prescripto/registrado como dato observado fuera de prescripción;
- no genera score, porcentaje de adherencia ni juicio bueno/malo.

### 11.2.2 Idempotencia de ingestas nutricionales

La regla natural queda discriminada:

```text
PRESCRIBED
→ unicidad por actor/asesorado + versión activa + ocurrencia planificada canónica

OUTSIDE_PRESCRIPTION / FREE_DESCRIPTION
→ NO usa unicidad por ocurrencia planificada
→ admite múltiples eventos reales
→ Idempotency-Key evita duplicar el mismo submit/retry lógico
```

Por tanto, dos ingestas libres diferentes del mismo día **no colisionan** solo por compartir fecha o plan.

### 11.2.3 `API-NUT-21` — Estructurar una ingesta libre como estimación trazable

```http
POST /api/v1/nutrition/executions/{executionId}/corrections
Idempotency-Key: <required>
```

**Actor:** profesional de Nutrición actualmente autorizado.

**Precondición específica:**

```text
original.recording.origin = OUTSIDE_PRESCRIPTION
original.recording.mode   = FREE_DESCRIPTION
```

Request conceptual:

```json
{
  "reason": "STRUCTURE_FREE_DESCRIPTION",
  "structuredEstimate": {
    "items": []
  },
  "estimationStatement": "Estimación profesional a partir del registro descriptivo."
}
```

Reglas:

- el original permanece inmutable;
- la estructura posterior se marca como `ESTIMATE`, nunca como medición;
- conserva actor, fecha, motivo, referencia al original y procedencia;
- no transforma retroactivamente la ingesta en comida prescripta;
- no modifica snapshot/plan;
- una cadena posterior se resuelve por relaciones de corrección, no por último timestamp;
- la operación vuelve a pasar por PDP actual y anti-enumeración;
- `Idempotency-Key` sigue el namespace `{actor × operación lógica}`.

Errores específicos candidatos:

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 NUTRITION_FREE_DESCRIPTION_REQUIRED
422 STRUCTURED_ESTIMATE_INVALID
422 CORRECTION_NOT_ALLOWED
```

Auditoría:

```text
REQUIRED_SAME_TX
```

`CAND-09-NUT-F` queda **SUPERADA/RENOMBRADA** por `CAND-09-NUT-COR`; `CAND-09-NUT-COR` queda **RESUELTA POR DIRECCIÓN** y materializada por `API-NUT-21`.

## 11.3 Training

Cubierto por v0.10 + v0.12: evaluation, objective, plan, validate/activate, catalog, Today, incremental execution draft, confirm, correction, review, continuity, local exercise creation and controlled wger import.

## 11.4 Anthropometry

Cubierto por v0.11: specification discovery, coherent evaluation, direct/derived separation, reproducible calculations, correction with dependency graph and longitudinal comparability.

## 11.5 Read models / projections

Cubierto por v0.11: caseload, review queue, dashboard, timeline, own progress, eight deep projection keys and versioned professional threshold settings.

## 11.6 CRD — Coordinación P0

La corrección de RF-057 queda normalizada con identificador propio:

```text
API-CRD-01
```

```http
POST /api/v1/advisees/{adviseeId}/coordination-notes
```

Semántica mínima:

- sesión profesional con `SESSION_MFA` cuando se opere con datos reales sensibles, por 08 §25; esto es **nivel de sesión**, no un step-up especial inventado para esta ruta;
- autor y visibilidad efectiva evaluados por el PDP vigente;
- propósito, dominio y referencias sujetos a allowlist;
- la nota no prescribe, no modifica un plan ajeno, no decide otro dominio, no cierra ciclos ni transfiere responsabilidad profesional;
- mencionar una referencia protegida no concede visibilidad sobre el recurso referenciado;
- se preservan autor, fecha, dominio, finalidad, visibilidad, referencias y auditoría;
- fallo de persistencia o auditoría obligatoria → **sin éxito falso** (`RNF-REL-001`).

### Lectura y ausencia deliberada de GET propio

No se crea un GET P0 específico para `coordination-notes` porque el canon ya define la lectura autorizada mediante el read model temporal:

- 04 RF-057: solo consultan actores autorizados;
- 05 UC-E07, postcondición 9: la nota aparece en la línea temporal según política;
- 08 Q-005/§14: `PAUSED` y `FINALIZED` no conservan lectura profesional histórica.

Por tanto, que el autor pierda lectura profesional después de pausa/finalización **es política canónica**, no una brecha a reparar con un endpoint residual.

Condición abierta: si la política derivada 08/10 activa la variante UC-E07 V05 de borrador/visibilidad solo-autor, el contrato deberá demostrar su lectura autorizada sin violar Q-005; si timeline no alcanza, se evaluará una superficie propia en una versión posterior.

---

# 12. P1/P2 and security-support surfaces

| Surface | Priority / origin | Contract status |
|---|---|---|
| Google Identity | RF-003 P1 | outlined |
| Recovery | RF-005 P1 + 08 | outlined, neutral |
| Anthropometry publishing/discovery | RF-051 P1 | outlined |
| TVCC-30 HTTP/report | RF-058 P1 | deferred until 12 spec/consumer |
| Internal news | RF-061 P1 | outlined |
| Capacity admin | RF-066 P1 | outlined; P0 gate still enforced |
| Incidents | RF-068 P1 | outlined |
| Account closure | RF-069 P1 + 08 | outlined |
| Access methods | RF-004 P2 | outlined |
| Push | RF-062 P2 + 08 | outlined, no C4 |
| Data rights | 08 §42 Ready-for-Real-Data + §19 | outlined; obligatorio al habilitar datos reales |
| Own export | 08 §42 Ready-for-Real-Data | outlined; sujeto-scoped y auditado antes de datos reales |
| Break-glass | 08 §42 + §48 exceptional security requirement | outlined; no se habilita sin gate |
| Private media | conditioned on feature activation | outlined |


**Gate explícito:** las superficies de derechos, export y break-glass pasan de contrato documental a obligación operacional antes de cualquier dato real únicamente cuando se satisfaga el **Ready-for-Real-Data de 08 §42**. Los workflows de derechos deben respetar además los plazos de 08 §19 — `10 días corridos / 5 días hábiles` según el supuesto aplicable. Esta sección no autoriza datos reales ni adelanta el gate.

---

# 13. Ocho proyecciones M-11

`GET /api/v1/advisees/{adviseeId}/projections/{projectionKey}` uses a closed discriminator:

- `TRAINING_VOLUME_BY_EXERCISE`
- `TRAINING_VOLUME_BY_MUSCLE_ZONE`
- `TRAINING_EFFECTIVE_VS_TOTAL_VOLUME`
- `TRAINING_PROGRESSION_BY_EXERCISE`
- `TRAINING_PERSONAL_RECORDS`
- `TRAINING_WORK_DISTRIBUTION_BY_MUSCLE_ZONE`
- `ANTHROPOMETRY_LONGITUDINAL`
- `NUTRITION_PRESCRIBED_VS_RECORDED`

The response is a typed discriminated union, not arbitrary JSON. All projections are read-only, provenance-aware, authorization-aware and honest about missing data.


## 13.1 CAND-09-PRJ-D — `partialView` explícita

Regla ya resuelta en v0.11 y ahora portada al consolidado:

- una proyección/timeline/agregado se construye **solo con el subconjunto de fuentes que el actor está autorizado a consultar**;
- una fuente oculta no puede influir en un agregado visible;
- si la autorización es parcial, la representación declara explícitamente `partialView: true` y un motivo seguro como `partialReason: AUTHORIZATION_SCOPE`;
- `NO_DATA` no se transforma en cero, no se interpola, no se imputa y no se arrastra;
- el carácter parcial describe el alcance efectivo de lectura; nunca eleva permisos.

Esta materialización consume la regla canónica de vista parcial autorizada y evita fugas indirectas por números agregados.

---

# 15. Registro exhaustivo de decisiones candidatas y disposición

## 15.1 Regla de disposición

El barrido mecánico de v0.7…v0.12 encontró **53 candidatas históricas únicas**. v0.14 había creado/reformulado además:

```text
CAND-09-TRV-REACT
CAND-09-NUT-COR
```

Por tanto, el universo que esta versión debe explicar es:

```text
55 CAND-09
```

Ningún ID puede desaparecer sin una de estas disposiciones:

```text
INTEGRADA EN BASELINE PROPUESTA
DERIVADA DEL CANON — INTEGRADA
RESUELTA POR DIRECCIÓN
PENDIENTE DE RATIFICACIÓN
SUPERADA/RENOMBRADA POR <ID>
CONDICIONADA
```

`INTEGRADA EN BASELINE PROPUESTA` **no equivale a APROBADO/canónico**; significa que su semántica ya forma parte del cuerpo candidato y será aceptada/rechazada con el Documento 09.

## 15.2 Baseline transversal — CAND-09-T01…T21

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-T01` | HTTPS + `/api/v1` + JSON | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T02` | success envelope `{data}` / page | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T03` | `ErrorEnvelope` estable | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T04` | clases/status HTTP | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T05` | semántica de `validate` | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T06` | `version` / `expectedVersion` | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T07` | `Idempotency-Key` selectiva | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T08` | retry por clase | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T09` | cursor pagination | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T10` | filtros/sorts allowlist | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T11` | ausencia / `null` / defaults | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T12` | campos server-owned | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T13` | tiempo/fecha/zona | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T14` | niveles AuthN | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T15` | PDP/AuthZ contextual | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-T16` | anti-enumeración | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-T17` | correlation/request ID | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T18` | clase de auditoría por operación | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-T19` | compatibilidad v1 | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T20` | compatibilidad de enums | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-T21` | OpenAPI + anti-drift | INTEGRADA EN BASELINE PROPUESTA |

## 15.3 Acceso y gobierno — S01…S05

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-S01` | registro usa `registrationIntent`, no rol confiable | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-S02` | B2 se otorga por `consentVersionId` exacto | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-S03` | solicitud equivalente pendiente retorna mismo resultado lógico | PENDIENTE DE RATIFICACIÓN INTEGRAL |
| `CAND-09-S04` | evidencia profesional usa private upload-intent | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-S05` | admin siempre `SESSION_MFA` | DERIVADA DE 08 §25 — INTEGRADA |

## 15.4 Nutrición — NUT-A…G + NUT-COR

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-NUT-A` | BE registra la decisión profesional; no calcula el objetivo | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-NUT-B` | A + C P0; B estructurada/capability-gated | **RESUELTA POR DIRECCIÓN**: A P0; C P0 solo `OUTSIDE_PRESCRIPTION`; B queda contemplada pero habilitación operacional condicionada |
| `CAND-09-NUT-C` | contraste solo descriptivo | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-NUT-D` | ausencia de registro = `NO_DATA` | DERIVADA DEL CANON — INTEGRADA |
| `CAND-09-NUT-E` | recurso principal = execution/intake, no adherence score | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-NUT-F` | corrección acotada para modalidad C | **SUPERADA/RENOMBRADA POR `CAND-09-NUT-COR`** |
| `CAND-09-NUT-G` | Today no selecciona Día tipo sin regla canónica | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-NUT-COR` | estructuración profesional de `FREE_DESCRIPTION` fuera de prescripción | **RESUELTA POR DIRECCIÓN — P0 · `API-NUT-21`** |

## 15.5 Entrenamiento — TRN-A…G

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-TRN-A` | reutilizar patrón vertical común | DERIVADA / INTEGRADA |
| `CAND-09-TRN-B` | `PERCENT_RM / RIR` | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-TRN-C` | granularidad `SET / EXERCISE_OR_SESSION` | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-TRN-D` | `COMPLETED / COMPLETED_WITH_DEVIATION / NOT_COMPLETED` | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-TRN-E` | `PUT occurrence/execution-draft` singular | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-TRN-F` | `PRIMARY / SECONDARY` para rol de zona | INTEGRADA EN BASELINE PROPUESTA — naming técnico |
| `CAND-09-TRN-G` | ausencia ≠ `NOT_COMPLETED` | DERIVADA DEL CANON — INTEGRADA |

## 15.6 Antropometría — ANT-A…C

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-ANT-A` | creación antropométrica coherente en una operación | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-ANT-B` | discovery de specifications versionadas | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-ANT-C` | correction→dependency graph→selective recalc | DERIVADA DEL CANON — INTEGRADA |

## 15.7 Proyecciones — PRJ-A…D

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-PRJ-A` | una ruta tipada para ocho deep projections | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-PRJ-B` | threshold de volumen efectivo profesional/versionado | DERIVADA / INTEGRADA |
| `CAND-09-PRJ-C` | estados longitudinales `AVAILABLE/NO_DATA/...` | INTEGRADA EN BASELINE PROPUESTA — naming técnico |
| `CAND-09-PRJ-D` | `partialView` explícita y solo fuentes autorizadas | DERIVADA DEL CANON — INTEGRADA |

## 15.8 Integraciones — INT-A…C

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-INT-A` | provider candidate→review→resolve | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-INT-B` | endpoints separados por dominio; patrón interno común | INTEGRADA EN BASELINE PROPUESTA |
| `CAND-09-INT-C` | carga manual explícita P0 | DERIVADA DEL CANON — INTEGRADA |

## 15.9 Derechos, exportación y break-glass

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-RGT-A` | familia `/me/data-rights-requests` | INTEGRADA EN BASELINE PROPUESTA · operación real condicionada por 08 §42 |
| `CAND-09-EXP-A` | export propio scoped/auditado como job | DERIVADA DE 08 — INTEGRADA · operación real condicionada por §42 |
| `CAND-09-BG-A` | break-glass como sesión temporal, no rol permanente | DERIVADA DE 08 — INTEGRADA |

## 15.10 Semántica transversal diferida por 07

| Candidato | Tema | Disposición v0.15 |
|---|---|---|
| `CAND-09-TRV-REACT` | replay misma key ≠ comando nuevo; mismo activo vs activo incompatible | **PENDIENTE DE RATIFICACIÓN INTEGRAL**; no se presenta como aprobada |

## 15.11 Control mecánico

```text
T01…T21 ........ 21
S01…S05 ........  5
NUT-A…G ........  7
TRN-A…G ........  7
ANT-A…C ........  3
PRJ-A…D ........  4
INT-A…C ........  3
RGT-A ..........  1
EXP-A ..........  1
BG-A ...........  1
TRV-REACT ......  1
NUT-COR ........  1
                 --
TOTAL .......... 55
```

Resultado:

```text
55/55 CANDIDATAS CON DISPOSICIÓN EXPLÍCITA
0 CANDIDATAS HISTÓRICAS DESAPARECIDAS SIN RELACIÓN
```

Ninguna disposición autoriza implementación, Git o datos reales.

---

# 16. Details deliberately deferred to implementation/11A

The following are **not blockers for documentary approval** unless external review proves they alter semantics:

- exact OpenAPI generator/library;
- exact runtime schema library;
- idempotency retention TTL;
- cursor encoding;
- numeric rate limits;
- provider-specific timeout numbers;
- physical DB tables/columns/index names;
- concrete storage vendor/bucket naming;
- exact log platform;
- code layout/controller class names;
- exact synthetic fixtures;
- performance/load thresholds owned by 04/07/11A.

---

# 17. Resolución de la contrarrevisión interna ciclo 3

| Hallazgo | Estado v0.15 | Tratamiento |
|---|---|---|
| `F-A1` | **CERRADO** | precedencia revelabilidad→errores preservada; aclaración de parseo neutro agregada |
| `N-1` | **CERRADO** | 38 RNF / 13 familias |
| `F-A4-C3` | **CERRADO** | 55/55 candidatas registradas con disposición; 20 omisiones de v0.14 recuperadas |
| `F-M1…F-M12` aplicables | **CERRADOS** | no se detecta regresión |
| modalidad C Nutrición | **RESUELTA POR DIRECCIÓN** | `OUTSIDE_PRESCRIPTION + FREE_DESCRIPTION` P0 |
| corrección modalidad C | **RESUELTA POR DIRECCIÓN** | `API-NUT-21` P0 |

No queda un hallazgo interno que requiera rediseño.

## 17.1 Controles mecánicos de cierre

La verificación de v0.15 debe reproducir:

```text
67 RF
53 UC
5 TR
38 RNF / 13 familias
55 CAND-09 con disposición
98 API-09 P0 IDs explícitos
0 duplicados P0
```

## 17.2 Focos que permanecen para revisión cruzada / Dirección

No son defectos abiertos; son decisiones/validaciones finales:

1. `CAND-09-TRV-REACT` — ratificación de semántica de reactivación/replay.
2. `CAND-09-S03` — equivalencia de solicitud pendiente.
3. aprobación integral de la baseline propuesta del 09.
4. revisión cruzada final exigible por gobierno antes de canonización.
5. 11A deberá demostrar anti-enumeración, concurrencia, idempotencia y no-leakage en implementación.

---

# 18. DoD for contrarrevisión

The external review must not declare CONFORME unless it verifies at minimum:

- `67/67 RF` mapped;
- `53/53 UC` mapped;
- `5/5 TR` mapped;
- `38/38 RNF` inventoried in exactly 13 canonical families;
- `55/55 CAND-09` have explicit disposition with no historical candidate silently dropped;
- no active RF uses historical IDs 016/063;
- P0/P1/P2 priorities match final 05;
- RF-028 and RF-038 are P0 API;
- RF-057 is P0 and has `API-CRD-01`;
- Nutrition modality C is limited to `OUTSIDE_PRESCRIPTION + FREE_DESCRIPTION` and has `API-NUT-21` for professional traceable structuring;
- P0 inventory is reproducible as `98` explicit API-09 IDs, including `API-NUT-21`;
- 07 §60 restrictions all satisfied;
- 08 §48 obligations all owned or explicitly conditioned;
- 06 state/invariant semantics not redefined;
- no API route creates forbidden marketplace/clinical scoring/global write model;
- no operation depends on legacy code for normative justification;
- no hidden implementation authorization;
- unresolved decisions clearly separated from implementation details.

---

# 19. Estado de salida

```text
BE-LEG-09 v0.15

STATUS:
BORRADOR CONSOLIDADO
CANDIDATO A CIERRE DOCUMENTAL Y REVISIÓN CRUZADA

RF:
67/67 MAPEADOS
57 P0 · 8 P1 · 2 P2

UC:
53/53 MAPEADOS
31 P · 12 I · 9 E · 1 S

TR:
5/5 MAPEADAS

RNF:
38/38 INVENTARIADOS
13 FAMILIAS CANÓNICAS

CANDIDATAS:
55/55 CON DISPOSICIÓN EXPLÍCITA
F-A4-C3 CERRADO

CORRECCIONES P0:
RF-028 OFF → P0 API
RF-038 wger → P0 API
RF-057 coordinación → P0 · API-CRD-01
MODALIDAD C NUTRICIÓN → P0 OUTSIDE_PRESCRIPTION
API-NUT-21 → P0 STRUCTURE_FREE_DESCRIPTION

P0 API-09 IDs EXPLÍCITOS:
98
0 DUPLICADOS

07 §60:
MATERIALIZADO CON CALIFICADORES
CAND-09-TRV-REACT PENDIENTE DE RATIFICACIÓN

08 §48:
MATERIALIZADO / CONDICIONADO SEGÚN 08 §42

ANTI-ENUMERATION:
PRECEDENCIA PDP/REVELABILIDAD EXPLÍCITA
PARSEO TEMPRANO SOLO SI ES RESOURCE-INDEPENDENT

PROYECCIONES:
partialView EXPLÍCITA
FUENTES OCULTAS NO INFLUYEN

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

DATOS REALES:
NO AUTORIZADOS

GIT:
SIN OPERACIONES

SIGUIENTE:
VERIFICACIÓN MECÁNICA DE CIERRE v0.15
→ revisión cruzada final
→ Dirección
→ acta
→ canonización
```

---

*Fin de BE-LEG-09 v0.15 — Consolidación corregida post-contrarrevisión interna, candidata a cierre documental.*

---

# 20. Parche contractual transversal v0.16

> **Autorización:** `ACTA-DIR-025`  
> **Baseline contractual:** v0.15 SHA-256 `5cf63f29b814dfbe1254f52d3c9f16619ee38794f604ed921052022940fbe9e6`  
> **04 aprobado:** `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b`  
> **05 aprobado:** `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf`  
> **06 aprobado:** `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1`  
> **08 aprobado:** `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691`  
> **Naturaleza:** extensión aditiva y reconciliación de contratos; no implementación.

## 20.1. Delta de cobertura

La baseline v0.15 tenía:

```text
67 RF
53 UC
5 TR
98 API P0
```

La normativa propietaria vigente para este parche exige:

```text
69 RF
56 UC
5 TR
```

El contrato candidato v0.16 incorpora 20 operaciones P0:

```text
MTH:
2

CAL:
4

FRM:
8

ANT-DRAFT + ANT-VOID:
6

TOTAL NUEVO:
20

TOTAL P0 v0.16:
118
```

No se agregan operaciones por fórmula, pantalla o widget.

---

## 20.2. Reglas transversales aplicables a las 20 operaciones nuevas

### 20.2.1. Precedencia de revelabilidad

Permanece §3.2.1:

```text
AuthN/step-up global
→ PDP/revelabilidad
→ schema/semántica/estado/concurrencia/idempotencia
```

Para todo recurso dirigido:

```text
inexistente
o
no revelable
→ 404 RESOURCE_NOT_FOUND
```

Ningún `409/422` puede funcionar como oráculo sobre un recurso no revelable.

### 20.2.2. Contexto server-owned

En operaciones profesionales:

- actor profesional deriva de sesión;
- `professionalId` cliente, si apareciera, no es autoridad y se rechaza/ignora según schema;
- vínculo, Alcance, B2, finalidad y pertinencia se resuelven server-side;
- el cliente no puede elevar permisos mediante `purpose`, `scope` o IDs relacionados.

### 20.2.3. Anti-inferencia CAP-MET

Si una ejecución no puede completarse por falta de inputs **autorizados/admisibles suficientes**, la respuesta no distingue:

```text
dato inexistente
dato existente pero no autorizado
dato existente pero no pertinente
```

Si el request contiene explícitamente un `sourceRef` inexistente o no revelable:

```text
404 RESOURCE_NOT_FOUND
```

Si los requisitos genéricos del método no pueden satisfacerse con fuentes autorizadas/admisibles:

```text
422 CALCULATION_INPUTS_INSUFFICIENT
```

`details` puede listar `inputCode` requeridos por el método, porque esos códigos ya son metadatos C2 del método, pero **no** puede revelar que una fuente oculta existe.

### 20.2.4. Idempotencia y concurrencia

Escrituras reintentables nuevas usan `Idempotency-Key` cuando se indica.

Recursos mutables usan `version/expectedVersion` cuando el dominio exige concurrencia.

Se conserva namespace:

```text
actor autenticado × operación lógica
```

---

# 21. CAP-MET — métodos y cálculos profesionales

## 21.1. API-MTH-01 — Listar métodos/versiones seleccionables

```http
GET /api/v1/professional-methods?domain=&purpose=&status=&limit=&cursor=
```

**Actor:** profesional autenticado.  
**AuthN:** `SESSION`; `SESSION_MFA` no es necesaria por consultar únicamente metadatos C2.

Reglas:

- `domain` y `purpose` son filtros allowlist;
- no acepta `adviseeId`;
- no usa datos personales para decidir qué métodos listar;
- una versión histórica puede consultarse cuando exista referencia explícita, pero no se presenta como seleccionable;
- no implica compatibilidad con datos de una persona.

Response item conceptual:

```json
{
  "methodId": "mth_...",
  "methodVersionId": "mthv_...",
  "domain": "NUTRITION",
  "purpose": "OBJECTIVE_SUPPORT",
  "status": "SELECTABLE",
  "requiredInputCodes": [],
  "output": { "type": "...", "unit": "..." },
  "precisionPolicy": {}
}
```

Audit: `BEST_EFFORT_TECHNICAL`.

## 21.2. API-MTH-02 — Consultar versión exacta de método

```http
GET /api/v1/professional-methods/{methodId}/versions/{versionId}
```

Devuelve la especificación C2 necesaria para comprender:

- finalidad;
- inputs requeridos;
- tipos/procedencias admisibles;
- salida/unidad;
- precisión;
- referencia técnica;
- estado de seleccionabilidad.

No devuelve datos de asesorado.

---

## 21.3. API-CAL-01 — Ejecutar cálculo profesional reproducible

```http
POST /api/v1/advisees/{adviseeId}/calculations
Idempotency-Key: <required>
```

**AuthN:** `SESSION_MFA`.

Request conceptual:

```json
{
  "purpose": "NUTRITION_OBJECTIVE_SUPPORT",
  "methodVersionId": "mthv_...",
  "inputBindings": [
    {
      "inputCode": "BODY_WEIGHT",
      "sourceRef": "..."
    }
  ]
}
```

`sourceRef` refiere a una fuente que el profesional puede seleccionar/consultar. El backend:

1. resuelve asesorado/recurso;
2. ejecuta PDP actual;
3. resuelve cada sourceRef bajo revelabilidad;
4. valida pertinencia;
5. valida admisibilidad de 06;
6. obtiene snapshot efectivo;
7. ejecuta la versión exacta;
8. persiste `CalculationRun`;
9. audita sin copiar valores C4;
10. commit.

Success `201`:

```json
{
  "data": {
    "calculationRunId": "crun_...",
    "purpose": "NUTRITION_OBJECTIVE_SUPPORT",
    "methodVersionId": "mthv_...",
    "result": {
      "value": 0,
      "unit": "..."
    },
    "inputProvenance": [
      {
        "inputCode": "BODY_WEIGHT",
        "provenanceType": "DIRECT_MEASUREMENT",
        "sourceOccurredAt": "..."
      }
    ],
    "recordedAt": "...",
    "referenceForPurpose": false
  }
}
```

La response nunca afirma:

```text
objectiveCreated = true
prescriptionUpdated = true
planChanged = true
```

Errores específicos seguros:

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 METHOD_VERSION_NOT_SELECTABLE
422 CALCULATION_INPUTS_INSUFFICIENT
422 CALCULATION_NOT_REPRODUCIBLE
```

Audit: `REQUIRED_SAME_TX`.

## 21.4. API-CAL-02 — Listar ejecuciones revelables

```http
GET /api/v1/advisees/{adviseeId}/calculations?purpose=&methodId=&limit=&cursor=
```

**AuthN:** `SESSION_MFA`.

Reglas:

- solo devuelve ejecuciones actualmente revelables bajo PDP;
- no devuelve total de ejecuciones ocultas;
- una ejecución creada cuando existía autorización puede desaparecer de la vista profesional después de pausa/finalización/revocación;
- el asesorado propio podrá consumir sus resultados únicamente mediante una superficie que 08/10/09 autoricen expresamente; esta operación es profesional.

## 21.5. API-CAL-03 — Consultar ejecución

```http
GET /api/v1/calculations/{calculationRunId}
```

Missing/not revealable:

```text
404 RESOURCE_NOT_FOUND
```

Response incluye:

- método/version;
- finalidad;
- resultado;
- procedencia de inputs actualmente revelable;
- fecha;
- autor;
- `referenceForPurpose`.

No reintroduce valores de fuentes que el actor ya no puede consultar.

## 21.6. API-CAL-04 — Adoptar/reemplazar referencia profesional

```http
PUT /api/v1/advisees/{adviseeId}/calculation-references/{purpose}
```

Request:

```json
{
  "calculationRunId": "crun_...",
  "expectedVersion": "v_..."
}
```

Reglas:

- la Ejecución debe ser actualmente revelable y corresponder al mismo asesorado/finalidad compatible;
- reemplazar referencia crea historia; no muta la Ejecución;
- no existe referencia automática;
- no modifica objetivo/requerimiento/prescripción/plan;
- misma referencia actual + mismo request lógico → mismo resultado;
- versión stale → `409 VERSION_CONFLICT`.

Success:

```json
{
  "data": {
    "purpose": "...",
    "calculationRunId": "crun_...",
    "version": "v_...",
    "adoptedAt": "..."
  }
}
```

Audit: `REQUIRED_SAME_TX`.

---

# 22. CAP-DAT — plantillas, solicitudes y respuestas

## 22.1. API-FRM-01 — Listar plantillas BE

```http
GET /api/v1/form-templates?domain=&purpose=&status=&limit=&cursor=
```

Metadatos C2. Profesional autenticado.

Una plantilla listada **no** prueba que todos sus campos puedan solicitarse a un asesorado concreto.

## 22.2. API-FRM-02 — Consultar versión exacta de plantilla

```http
GET /api/v1/form-templates/{templateId}/versions/{versionId}
```

Devuelve:

- purpose/domain;
- secciones/campos;
- tipos/unidades;
- categorías;
- reglas estructurales;
- opciones de requerido/opcional;
- estado.

No devuelve datos personales.

---

## 22.3. API-FRM-03 — Crear solicitud profesional

```http
POST /api/v1/advisees/{adviseeId}/form-requests
Idempotency-Key: <required>
```

**AuthN:** `SESSION_MFA`.

Request conceptual:

```json
{
  "templateVersionId": "ftv_...",
  "purpose": "NUTRITION_EVALUATION",
  "scope": "NUTRITION",
  "requestedFieldCodes": [],
  "requiredFieldCodes": []
}
```

Server-owned:

```text
professionalId
relationshipId
consentVersionId efectivo
```

Precondiciones:

- Vínculo ACTIVO;
- Alcance;
- B2 vigente;
- finalidad;
- pertinencia;
- cada categoría/campo solicitado autorizado para ese contexto;
- templateVersion seleccionable.

Una plantilla con campos más amplios no amplía B2.

Success `201`:

```json
{
  "data": {
    "formRequestId": "freq_...",
    "templateVersionId": "ftv_...",
    "purpose": "...",
    "scope": "...",
    "requestedFieldCodes": [],
    "requiredFieldCodes": [],
    "status": "PENDING",
    "createdAt": "..."
  }
}
```

Errores:

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
422 FORM_TEMPLATE_NOT_SELECTABLE
422 FORM_REQUEST_NOT_ALLOWED
422 FORM_REQUEST_INVALID
```

`FORM_REQUEST_NOT_ALLOWED` no incluye categorías/datos ocultos fuera de lo que el propio profesional solicitó.

Audit: `REQUIRED_SAME_TX`.

## 22.4. API-FRM-04 — Listar solicitudes profesionales del asesorado

```http
GET /api/v1/advisees/{adviseeId}/form-requests?status=&limit=&cursor=
```

Solo devuelve requests actualmente revelables. No existe lectura residual por autoría.

## 22.5. API-FRM-05 — Consultar solicitud con proyección por actor

```http
GET /api/v1/form-requests/{formRequestId}
```

Actores permitidos:

- profesional actualmente autorizado;
- asesorado titular.

La misma ruta produce una **proyección actor-scoped**:

### Profesional

Si PDP actual lo permite:

- request metadata;
- estado;
- respuesta/rectificación actualmente consultable.

Si perdió autorización:

```text
404 RESOURCE_NOT_FOUND
```

### Asesorado

Puede consultar su propia solicitud y respuesta histórica conforme a 08, aunque el profesional ya no conserve lectura.

Response no expone autorizaciones internas ajenas.

## 22.6. API-FRM-06 — Listar solicitudes propias

```http
GET /api/v1/me/form-requests?status=&limit=&cursor=
```

AuthN `SESSION`.

La representación puede incluir:

```json
{
  "respondable": true
}
```

`respondable` es una proyección calculada con política actual; **no crea un estado de dominio nuevo**.

## 22.7. API-FRM-07 — Enviar respuesta propia

```http
POST /api/v1/me/form-requests/{formRequestId}/responses
Idempotency-Key: <required>
```

Request:

```json
{
  "answers": [
    {
      "fieldCode": "...",
      "value": null,
      "unit": null,
      "profileSourceRef": null
    }
  ]
}
```

Reglas:

- request pertenece al actor;
- sigue siendo respondable bajo contexto/política actual;
- `profileSourceRef`, si se usa, refiere a un dato propio compatible;
- cada answer queda `SELF_REPORTED`;
- reutilizar perfil preserva origen;
- opcional omitido queda sin respuesta, nunca cero/default;
- no crea consentimiento ni reabre vínculo.

Si el request propio existe pero ya no es respondable:

```text
422 FORM_REQUEST_NOT_RESPONDABLE
```

Esto no es un oráculo de terceros porque el request es propio/revelable al titular.

Success `201` devuelve `formResponseId`, versión y `submittedAt`.

Audit: `REQUIRED_SAME_TX`.

## 22.8. API-FRM-08 — Rectificar respuesta propia

```http
POST /api/v1/me/form-responses/{formResponseId}/rectifications
Idempotency-Key: <required>
```

Request:

```json
{
  "reason": "...",
  "answers": []
}
```

Reglas:

- original propio/revelable;
- crea respuesta sucesora;
- no overwrite;
- mantiene `SELF_REPORTED`;
- no restaura lectura profesional si el PDP ya no la permite.

Errors:

```text
404 RESOURCE_NOT_FOUND
409 IDEMPOTENCY_KEY_REUSED
409 VERSION_CONFLICT
422 FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED
422 FORM_RESPONSE_INVALID
```

Audit: `REQUIRED_SAME_TX`.

---

# 23. ANT-DRAFT — evaluación antropométrica en preparación

## 23.1. Compatibilidad con API-ANT-02

`API-ANT-02` permanece como operación P0 para crear **directamente una evaluación REGISTRADA** de forma atómica cuando no se requiere trabajo reanudable.

Las operaciones 07…11 agregan la variante `UC-P19 V04`.

```text
API-ANT-02
≠ draft

API-ANT-07…11
→ EN_PREPARACION → REGISTRADA
```

`API-ANT-03` lista únicamente evaluaciones `REGISTRADA`.

`API-ANT-04` consulta una evaluación registrada; no es una vía residual para leer un draft.

## 23.2. API-ANT-07 — Crear evaluación en preparación

```http
POST /api/v1/advisees/{adviseeId}/anthropometry/evaluation-drafts
Idempotency-Key: <required>
```

**AuthN:** `SESSION_MFA`.

Request puede ser parcial:

```json
{
  "occurredAt": null,
  "specificationVersionId": null,
  "source": { "type": "DIRECT_ENTRY" },
  "directMeasurements": [],
  "requestedDerivedMethods": [],
  "professionalNotes": null
}
```

Success `201`:

```json
{
  "data": {
    "evaluationId": "aeval_...",
    "state": "IN_PREPARATION",
    "version": "v_...",
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

Mapping técnico:

```text
IN_PREPARATION ↔ EN_PREPARACION
```

Audit: `REQUIRED_SAME_TX`.

## 23.3. API-ANT-08 — Listar borradores retomables

```http
GET /api/v1/advisees/{adviseeId}/anthropometry/evaluation-drafts?limit=&cursor=
```

Solo profesional con PDP actual.

- no devuelve drafts no revelables;
- no devuelve total oculto;
- no mezcla `REGISTRADA`;
- un borrador bloqueado por pérdida de autorización no es visible al profesional.

## 23.4. API-ANT-09 — Consultar borrador

```http
GET /api/v1/anthropometry/evaluation-drafts/{evaluationId}
```

Missing/not revealable:

```text
404 RESOURCE_NOT_FOUND
```

Devuelve estado `IN_PREPARATION`, `version` y contenido parcial actualmente revelable.

## 23.5. API-ANT-10 — Guardar borrador

```http
PUT /api/v1/anthropometry/evaluation-drafts/{evaluationId}
```

Request conceptual:

```json
{
  "expectedVersion": "v_...",
  "occurredAt": "...",
  "specificationVersionId": "aspecv_...",
  "source": {},
  "directMeasurements": [],
  "requestedDerivedMethods": [],
  "professionalNotes": "..."
}
```

Reglas:

- reevalúa PDP;
- reemplaza la versión de trabajo, no historia registrada;
- `expectedVersion` stale → `409 VERSION_CONFLICT`;
- conserva procedencia/unidades;
- cálculos de preparación se identifican como tales;
- no altera timeline/evolución registrada.

Audit: `REQUIRED_SAME_TX`.

## 23.6. API-ANT-11 — Registrar/finalizar borrador

```http
POST /api/v1/anthropometry/evaluation-drafts/{evaluationId}/register
Idempotency-Key: <required>
```

Request:

```json
{
  "expectedVersion": "v_..."
}
```

Frontera transaccional:

1. PDP actual;
2. expectedVersion;
3. validación completa de evaluación;
4. especificación/protocolo;
5. directos/importación;
6. cálculos válidos;
7. dependencias;
8. transición `IN_PREPARATION → REGISTERED`;
9. auditoría;
10. commit.

Success:

```json
{
  "data": {
    "evaluationId": "aeval_...",
    "state": "REGISTERED",
    "version": "v_...",
    "recordedAt": "..."
  }
}
```

Mapping:

```text
REGISTERED ↔ REGISTRADA
```

Luego la evaluación se consume por `API-ANT-03/04/06`.

Errores:

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 ANTHROPOMETRY_EVALUATION_INVALID
422 ANTHROPOMETRY_SPECIFICATION_NOT_AVAILABLE
422 CALCULATION_INPUTS_INSUFFICIENT
```

No existe éxito parcial.

---

# 24. ANT-VOID — anulación contractual

## 24.1. API-ANT-12 — Anular medición antropométrica

Se mantiene `API-ANT-05` exclusivamente para corrección trazable.

La anulación usa una operación separada:

```http
POST /api/v1/anthropometry/measurements/{measurementId}/annulments
Idempotency-Key: <required>
```

**AuthN:** `SESSION_MFA`.

Request conceptual:

```json
{
  "expectedVersion": "v_...",
  "reason": "..."
}
```

PDP:

```text
professional identity
+ anthropometry capacity enabled
+ Vínculo ACTIVO
+ B2 vigente
+ finalidad integridad/corrección
+ recurso revelable
```

No exige que actor = autor original.

Frontera transaccional:

1. revelabilidad/PDP;
2. expectedVersion;
3. verificar condición efectiva;
4. registrar evento de anulación;
5. preservar original/correcciones;
6. marcar `ANNULLED ↔ ANULADA`;
7. resolver dependencias;
8. generar nuevas corridas solo si inputs suficientes;
9. dejar ausencia efectiva como `NO_DATA/SIN_DATO`, nunca cero;
10. auditoría C6 sin copiar `reason`;
11. commit.

Success `201`:

```json
{
  "data": {
    "annulmentId": "aann_...",
    "measurementId": "ameas_...",
    "effectiveCondition": "ANNULLED",
    "version": "v_...",
    "annulledAt": "...",
    "dependencyImpact": {
      "recalculationPerformed": true,
      "newDerivedResultIds": []
    }
  }
}
```

El success nunca elimina el original.

Errores:

```text
404 RESOURCE_NOT_FOUND
409 VERSION_CONFLICT
409 IDEMPOTENCY_KEY_REUSED
422 ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED
422 RECALCULATION_INPUTS_INSUFFICIENT
```

`ANTHROPOMETRY_ANNULMENT_NOT_ALLOWED` se emite únicamente después de revelabilidad; no expone si el motivo es “ya anulada” u otra condición incompatible cuando esa precisión no sea necesaria.

Reglas:

- `ANNULLED → EFFECTIVE` no existe en v0.16;
- no hay endpoint `restore/reactivate/unannul`;
- nueva medición válida = nueva medición;
- ADMIN/break-glass no ejecutan esta operación como actor profesional.

Audit: `REQUIRED_SAME_TX`.

---

# 25. Clarificación de importación antropométrica

`API-ANT-02` conserva `CONTROLLED_IMPORT + preparationReference`.

Este parche **no crea una entidad/API de import-preparation** porque 04/05/06 no obligan todavía a persistir una preparación como recurso independiente.

Contrato mínimo:

- `preparationReference` puede ser una referencia opaca a un flujo temporal/artefacto controlado;
- su materialización física pertenece a implementación/09 futuro si 10/11A demuestra que necesita ciclo de vida propio;
- `API-ANT-02` sigue validando y clasificando antes del commit;
- importado ≠ medido;
- provider/formato siguen neutrales.

Si el prototipo demuestra que la revisión previa necesita persistencia reanudable:

```text
nuevo impacto
→ volver a 06/09
→ no inventarlo desde 10
```

---

# 26. Registro de nuevas candidatas v0.16

Las 55 candidatas de §15 permanecen con su disposición histórica.

Se agregan seis decisiones contractuales de v0.16:

| ID | Tema | Disposición |
|---|---|---|
| `CAND-09-MTH-A` | catálogo transversal de métodos/versiones C2 | INTEGRADA EN BASELINE v0.16 PROPUESTA |
| `CAND-09-CAL-A` | ejecuciones transversales + referencia profesional | INTEGRADA EN BASELINE v0.16 PROPUESTA |
| `CAND-09-FRM-A` | plantillas/request/response en familia transversal FRM | INTEGRADA EN BASELINE v0.16 PROPUESTA |
| `CAND-09-FRM-B` | detalle de request actor-scoped y `respondable` como proyección, no estado | INTEGRADA EN BASELINE v0.16 PROPUESTA |
| `CAND-09-ANT-DRAFT` | familia 07…11 separa draft de evaluaciones registradas | DERIVADA DE 05/06/08 — INTEGRADA |
| `CAND-09-ANT-VOID` | API-ANT-12 separa anulación de corrección API-ANT-05 | DERIVADA DE RF-050/05/06/08 — INTEGRADA |

Conteo candidato:

```text
55 históricas
+ 6 v0.16
= 61 CAND-09 con disposición
```

Continúan pendientes, sin cambio:

```text
CAND-09-S03
CAND-09-TRV-REACT
```

---

# 27. Inventario P0 explícito v0.16

El inventario contractual P0 completo es:

```text
API-ACC-01
API-ACC-02
API-ACC-03
API-ACC-04
API-ACC-05
API-ACC-06
API-PRO-01
API-PRO-02
API-PRO-03
API-PRO-04
API-PRO-05
API-PRO-06
API-PRO-07
API-PRO-08
API-PRO-09
API-PRO-10
API-PRO-11
API-PRO-12
API-PRO-13
API-REL-01
API-REL-02
API-REL-03
API-REL-04
API-REL-05
API-REL-06
API-REL-07
API-REL-08
API-REL-09
API-CON-01
API-CON-02
API-CON-03
API-CON-04
API-NUT-01
API-NUT-02
API-NUT-03
API-NUT-04
API-NUT-05
API-NUT-06
API-NUT-07
API-NUT-08
API-NUT-09
API-NUT-10
API-NUT-11
API-NUT-12
API-NUT-13
API-NUT-14
API-NUT-15
API-NUT-16
API-NUT-17
API-NUT-18
API-NUT-19
API-NUT-20
API-NUT-21
API-TRN-01
API-TRN-02
API-TRN-03
API-TRN-04
API-TRN-05
API-TRN-06
API-TRN-07
API-TRN-08
API-TRN-09
API-TRN-10
API-TRN-11
API-TRN-12
API-TRN-13
API-TRN-14
API-TRN-15
API-TRN-16
API-TRN-17
API-TRN-18
API-TRN-19
API-TRN-20
API-TRN-21
API-TRN-22
API-TRN-23
API-TRN-24
API-ANT-01
API-ANT-02
API-ANT-03
API-ANT-04
API-ANT-05
API-ANT-06
API-DSH-01
API-DSH-02
API-DSH-03
API-DSH-04
API-DSH-05
API-PRJ-01
API-PRJ-02
API-PRJ-03
API-INT-NUT-01
API-INT-NUT-02
API-INT-NUT-03
API-INT-TRN-01
API-INT-TRN-02
API-INT-TRN-03
API-CRD-01
API-MTH-01
API-MTH-02
API-CAL-01
API-CAL-02
API-CAL-03
API-CAL-04
API-FRM-01
API-FRM-02
API-FRM-03
API-FRM-04
API-FRM-05
API-FRM-06
API-FRM-07
API-FRM-08
API-ANT-07
API-ANT-08
API-ANT-09
API-ANT-10
API-ANT-11
API-ANT-12
```

Control:

```text
BASELINE v0.15:
98

NUEVAS v0.16:
20

TOTAL:
118

DUPLICADOS:
0
```

Distribución:

| Familia | Cantidad P0 |
|---|---:|
| ACC | 6 |
| PRO | 13 |
| REL | 9 |
| CON | 4 |
| NUT | 21 |
| TRN | 24 |
| ANT | 12 |
| DSH | 5 |
| PRJ | 3 |
| INT-NUT | 3 |
| INT-TRN | 3 |
| CRD | 1 |
| MTH | 2 |
| CAL | 4 |
| FRM | 8 |
| **TOTAL** | **118** |

---

# 28. Matriz de propagación actualizada

| RF | UC | Dominio 06 | Gobierno 08 | Contrato 09 |
|---|---|---|---|---|
| `RF-070` | `UC-I13`, P09/P14/I09 | REG-06-202…208 | §56.3/56.7 | MTH-01/02 + CAL-01…04 |
| `RF-071` | `UC-P32/P33` | REG-06-209…213 | §56.4/56.7 | FRM-01…08 |
| `RF-047` | `UC-P19 V04` | REG-06-214…216 | §56.5/R-18 | ANT-07…11 |
| `RF-050` | `UC-E03` | REG-06-217…221 | §56.6 | ANT-05 corrección + ANT-12 anulación |

`RF-050` conserva dos conductas contractuales diferenciadas:

```text
CORREGIR
→ API-ANT-05

ANULAR
→ API-ANT-12
```

---

# 29. DoD adicional de contrarrevisión v0.16

Además de §18, la revisión no puede declarar CONFORME sin verificar:

1. `69/69 RF` consumidos por el maestro contractual actualizado;
2. `56/56 UC` compatibles;
3. `118` API P0 explícitas, únicas;
4. MTH/CAL no duplican verticales;
5. `API-ANT-01` queda para specification/protocolo antropométrico y MTH para métodos de cálculo;
6. `API-CAL-01` no usa input oculto como canal lateral;
7. `API-CAL-04` referencia ≠ decisión;
8. FRM request/template ≠ autorización;
9. FRM actor projection corta acceso profesional residual;
10. `SELF_REPORTED` preservado en response/rectificación;
11. ANT draft no aparece en `API-ANT-03/04` hasta REGISTERED;
12. `API-ANT-02` directo sigue válido y no compite semánticamente con drafts;
13. ANT-12 anula sin delete y sin endpoint de reversión;
14. auditoría no copia valores C4 ni reason sensible;
15. no se creó import-preparation sin autoridad upstream;
16. 61 candidatas con disposición;
17. `CAND-09-S03` y `CAND-09-TRV-REACT` siguen explícitamente pendientes;
18. 07 continúa sin cambio;
19. no existe autorización de implementación/Git/datos reales.

---

# 30. Estado de salida v0.16

```text
BE-LEG-09 v0.16

STATUS:
BORRADOR CONTRACTUAL
RECONCILIACIÓN TRANSVERSAL
NO APROBADO
NO CANÓNICO

FUENTES:
04 v0.4.2.1 APROBADO DOCUMENTALMENTE
05 v0.15 APROBADO DOCUMENTALMENTE
06 v0.1.1 APROBADO DOCUMENTALMENTE
08 v0.1.5 APROBADO DOCUMENTALMENTE
07 SIN CAMBIO

RF:
69

UC:
56

TR:
5

RNF:
38 / 13 FAMILIAS

CANDIDATAS:
61 CON DISPOSICIÓN
2 PENDIENTES HISTÓRICAS:
CAND-09-S03
CAND-09-TRV-REACT

P0 API:
118
0 DUPLICADOS

CAP-MET:
MTH-01…02
CAL-01…04

CAP-DAT:
FRM-01…08

ANT-DRAFT:
ANT-07…11

ANT-VOID:
ANT-12
ANT-05 PERMANECE CORRECCIÓN

ANTI-ENUMERATION:
PRESERVADA
ANTI-INFERENCIA CAP-MET:
EXPLÍCITA

IMPLEMENTACIÓN:
NO AUTORIZADA

DATOS REALES:
NO AUTORIZADOS

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE v0.16
→ Dirección
→ reconciliación BE-LEG-10
```

---

*Fin de BE-LEG-09 v0.16 — Reconciliación contractual transversal.*

---

# 31. Corrección contractual A3 — `DATOS_SALUD_BE`

> **Hallazgo:** `H-09-10-A3-01`  
> **Autorización:** `ACTA-DIR-028`  
> **Fuente propietaria:** BE-LEG-08 v0.1.5 §12, §13, §48, §49 · SHA-256 `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691`  
> **Origen de detección:** DoR B10-02 sobre 10 v0.2/v0.3  
> **Naturaleza:** adición contractual; sin cambio de dominio, política o UX.

## 31.1. Objeto

Materializar en 09 el consentimiento A3 aprobado por 08:

```text
DATOS_SALUD_BE
```

A3 gobierna el tratamiento de datos de salud por BE y la historia longitudinal del titular.

No es:

```text
A1 — términos
A2 — información de privacidad
B2 — consentimiento profesional
TRANSFERENCIA_INT — cuando aplique escenario C
```

Separación obligatoria:

```text
A1 ≠ A2 ≠ A3 ≠ B2
```

---

## 31.2. Reglas transversales A3

1. Solo el titular decide sobre A3.
2. A3 no crea rol profesional, scope, vínculo ni B2.
3. Otorgar A3 no autoriza a ningún profesional.
4. Revocar A3 no borra historia instantáneamente; activa la política prospectiva de 08 §13.
5. La versión mostrada debe ser la versión aceptada.
6. Una nueva versión no hereda aceptación silenciosa.
7. Reotorgar después de revocación crea un nuevo acto trazable; no borra la revocación anterior.
8. Las operaciones sensibles deben observar el estado A3 vigente mediante PDP.
9. La inexistencia de A3 vigente no impide conservar una identidad/cuenta no sensible.
10. El contrato no fija el texto legal definitivo ni el plazo parametrizable de 08.

---

# 32. API-CON-05 — Consultar requisito A3 aplicable

```http
GET /api/v1/me/health-data-consent-requirement
```

### AuthN

`SESSION`

### Actor

Titular de la identidad autenticada.

### Response

```json
{
  "data": {
    "type": "HEALTH_DATA_BE",
    "consentVersion": {
      "id": "cv_...",
      "text": "...",
      "textHash": "...",
      "effectiveFrom": "..."
    },
    "purpose": "HEALTH_DATA_PROCESSING_AND_LONGITUDINAL_HISTORY",
    "currentConsent": null
  }
}
```

Si existe A3 actual:

```json
{
  "currentConsent": {
    "consentId": "con_...",
    "state": "ACTIVE",
    "consentVersionId": "cv_...",
    "acceptedAt": "...",
    "revokedAt": null
  }
}
```

### Reglas

- no requiere profesional ni relationship;
- no devuelve B2;
- no mezcla `TRANSFERENCIA_INT`;
- si la versión aplicable cambió, la respuesta muestra la nueva versión sin presumir aceptación;
- `text` y `textHash` son server-owned.

Audit: `BEST_EFFORT_TECHNICAL`.

---

# 33. API-CON-06 — Otorgar o reotorgar A3

```http
POST /api/v1/me/health-data-consents
Idempotency-Key: <required>
```

### AuthN

`SESSION`

### Request

```json
{
  "consentVersionId": "cv_..."
}
```

El cliente no envía:

```text
type
purpose
textHash
identityId
professionalId
scope
categories
```

Todo lo anterior es server-owned o no aplica.

### Validaciones

El servidor verifica:

- versión existente y aplicable a `HEALTH_DATA_BE`;
- texto/version exactos;
- titular autenticado;
- versión no reemplazada antes del acto;
- estado operativo de cuenta compatible;
- ausencia de replay contradictorio.

### Success

Primera aceptación o reotorgamiento válido:

```text
201
```

```json
{
  "data": {
    "consentId": "con_...",
    "type": "HEALTH_DATA_BE",
    "consentVersionId": "cv_...",
    "state": "ACTIVE",
    "acceptedAt": "..."
  }
}
```

### Reglas

- no crea sesión;
- no crea B2;
- no habilita profesional;
- no modifica vínculo;
- habilita únicamente que el PDP considere satisfecha la relación A3 cuando las demás condiciones también correspondan;
- un consentimiento revocado previo queda preservado.

### Errors

```text
409 CONSENT_VERSION_STALE
409 CONSENT_ALREADY_ACTIVE
409 IDEMPOTENCY_KEY_REUSED
422 HEALTH_DATA_CONSENT_NOT_AVAILABLE
```

Audit: `REQUIRED_SAME_TX`.

---

# 34. API-CON-07 — Consultar historial A3 propio

```http
GET /api/v1/me/health-data-consents?limit=&cursor=
```

### AuthN

`SESSION`

### Response item

```json
{
  "consentId": "con_...",
  "type": "HEALTH_DATA_BE",
  "consentVersionId": "cv_...",
  "state": "REVOKED",
  "acceptedAt": "...",
  "revokedAt": "..."
}
```

### Reglas

- solo del titular;
- preserva cada acto/version;
- no mezcla consentimientos B2 profesionales;
- no expone evidencia técnica IP/UA en UI normal;
- la evidencia completa permanece en auditoría/retención de 08.

Audit: `BEST_EFFORT_TECHNICAL`.

---

# 35. API-CON-08 — Revocar A3

```http
POST /api/v1/me/health-data-consents/{consentId}/revoke
```

### AuthN

`SESSION_STEP_UP` recomendado para datos reales; `SESSION` puede utilizarse en demo sintética conforme al gate 08.

### Precedencia

El consentimiento debe pertenecer al titular.

Recurso inexistente/no revelable:

```text
404 RESOURCE_NOT_FOUND
```

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

### Efectos contractuales

Tras commit:

1. el A3 deja de estar vigente;
2. el PDP debe bloquear operaciones sensibles prospectivas del titular;
3. el corte no depende de expiración de sesión;
4. no se revocan B2 por mutación del registro — quedan sin capacidad efectiva mientras A3 no satisfaga el PDP;
5. no se finalizan vínculos automáticamente;
6. no se borra historia dentro de esta transacción;
7. el procesamiento posterior de datos/retención sigue 08 §13/§16/§17;
8. reotorgar requiere un nuevo acto mediante `API-CON-06`.

### Success

```json
{
  "data": {
    "consentId": "con_...",
    "state": "REVOKED",
    "revokedAt": "..."
  }
}
```

Audit: `REQUIRED_SAME_TX`.

---

# 36. Precedencia A3 sobre operaciones sensibles

Para toda operación P0 que trate datos de salud del titular:

```text
SESSION/AuthN
→ estado operativo
→ A3 vigente cuando aplique TR-A/TR-C
→ demás gates/PDP
→ semántica de recurso
```

A3 por sí solo nunca concede acceso profesional.

La denegación por A3 ausente/revocado no debe revelar recursos de terceros ni datos ocultos.

---

# 37. Inventario contractual actualizado

Se agregan:

```text
API-CON-05
API-CON-06
API-CON-07
API-CON-08
```

Nuevo total:

```text
v0.16:
118 API P0

v0.16.1:
122 API P0

DELTA:
+4

DUPLICADOS:
0
```

Distribución afectada:

```text
CON:
4 → 8
```

Todas las demás familias permanecen sin cambios.

---

# 38. Candidatas agregadas

| ID | Tema | Disposición |
|---|---|---|
| `CAND-09-A3-A` | A3 como subfamilia propia dentro de CON, separada de B2 | DERIVADA DE 08 — INTEGRADA EN v0.16.1 PROPUESTA |
| `CAND-09-A3-B` | revocación A3 corta operaciones sensibles sin borrar dentro de la transacción | DERIVADA DE 08 §13 — INTEGRADA EN v0.16.1 PROPUESTA |

Conteo de candidatas:

```text
v0.16:
61

+2:
63

PENDIENTES HISTÓRICAS SIN CAMBIO:
CAND-09-S03
CAND-09-TRV-REACT
```

---

# 39. DoD de la corrección A3

No declarar conforme si:

1. A3 se mezcla con B2;
2. A3 se exige para crear identidad;
3. A3 concede acceso profesional;
4. `API-CON-06` acepta type/purpose/client-owned;
5. versión mostrada y aceptada pueden diferir;
6. revocar A3 borra historia dentro del request;
7. revocar A3 finaliza vínculos;
8. revocar A3 depende de expiración de sesión;
9. reotorgar sobrescribe revocación previa;
10. no existe consulta de estado/historia propia;
11. el total no es 122;
12. aparece una nueva familia contractual;
13. se modifica 04/05/06;
14. se modifica 07;
15. 10 cierra B10-02 antes de esta corrección.

---

# 40. Estado de salida v0.16.1

```text
BE-LEG-09 v0.16.1

ESTADO:
BORRADOR CONTRACTUAL
NO APROBADO
NO CANÓNICO

BASELINE:
v0.16 APROBADA DOCUMENTALMENTE

HALLAZGO:
H-09-10-A3-01
CORREGIDO EN CONTRATO

A3:
CON-05…08

A1/A2:
ACC-01
SIN CAMBIO

B2:
CON-01…04
SIN CAMBIO

API P0:
122

CAND-09:
63
2 PENDIENTES HISTÓRICAS

04/05/06:
SIN CAMBIO

07:
SIN CAMBIO

08:
POLÍTICA PRESERVADA

10:
B10-02/B10-03 PENDIENTES DE RETOMAR

IMPLEMENTACIÓN:
NO

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE v0.16.1
```

---

*Fin de corrección contractual A3.*

