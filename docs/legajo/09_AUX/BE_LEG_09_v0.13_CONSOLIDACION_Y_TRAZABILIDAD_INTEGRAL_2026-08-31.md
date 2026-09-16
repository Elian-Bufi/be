# BE-LEG-09 v0.13 — Consolidación y trazabilidad integral pre-contrarrevisión

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** `BE-LEG-09 — Interfaces y Contratos API`  
> **Versión:** `v0.13 — CONSOLIDACIÓN + TRAZABILIDAD INTEGRAL`  
> **Fecha:** `2026-08-31`  
> **Estado:** `BORRADOR CONSOLIDADO — PRE-CONTRARREVISIÓN EXTERNA`  
> **Normativa funcional consumida:** BE-LEG-04 v0.4.1 · BE-LEG-05 v0.14 · BE-LEG-06 · BE-LEG-07 · BE-LEG-08  
> **Legacy:** `NO NORMATIVO — SOLO REFERENCIA`  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Datos reales:** `NO AUTORIZADOS POR ESTE DOCUMENTO`

---

# 0. Propósito

Cerrar la fase de **diseño contractual** del Documento 09 y convertir las versiones de trabajo v0.7–v0.12 en un objeto auditable de punta a punta antes de la contrarrevisión independiente.

Esta versión no intenta agregar arquitectura nueva. Hace cinco cosas:

1. consolida las reglas transversales y los contratos funcionales ya redactados;
2. corrige desvíos detectados en los propios borradores del 09;
3. demuestra cobertura `RF → UC/TR → contrato API`;
4. demuestra consumo de las fronteras vinculantes de 06/07/08;
5. separa lo que requiere decisión de Dirección de lo que es mera materialización técnica o detalle de implementación.

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
- filtros/sorts allowlist; parámetro desconocido relevante → `400 INVALID_REQUEST`.

## 3.2 ErrorEnvelope

```json
{ "error": { "code": "RESOURCE_NOT_FOUND", "message": "...", "details": {} } }
```

Reglas consolidadas:

- `code` estable y machine-readable;
- `message` seguro;
- `details` opcional y sin internals/C4/C5;
- `404 RESOURCE_NOT_FOUND` para inexistente **o no revelable**;
- `409` para conflicto concurrente/único/idempotency-key;
- `422` para transición/semántica inválida sobre recurso conocido;
- `429 RATE_LIMITED`;
- `503 DB_UNAVAILABLE` o `DEPENDENCY_UNAVAILABLE` según origen.

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
- misma key + mismo request lógico → mismo resultado lógico, sin duplicado.
- misma key + payload diferente → `409 IDEMPOTENCY_KEY_REUSED`.
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
| `RF-051` | **P1** | Descubrimiento antropométrico | UC-P21 / UC-P22 / UC-E04 | `ANT-P1` | publish/search/detail limited — P1 | CUBIERTO |
| `RF-052` | **P0** | Dashboard profesional | UC-P23 / UC-I02 | `DSH` | GET /me/caseload | CUBIERTO |
| `RF-053` | **P0** | Dashboard interdisciplinario | UC-P24 / UC-I02 | `DSH` | GET /advisees/{id}/dashboard | CUBIERTO |
| `RF-054` | **P0** | Historial longitudinal | UC-P24 / UC-P31 / UC-I03 | `DSH` | timeline + own progress | CUBIERTO |
| `RF-055` | **P0** | Revisión y continuidad / pendientes | UC-P23 / UC-I05 | `DSH` | GET /me/review-queue | CUBIERTO |
| `RF-056` | **P0** | Revisión profesional común | UC-I05 → UC-P13/18 | `NUT/TRN` | common review semantics in both verticals | CUBIERTO |
| `RF-057` | **P0** | Coordinación | UC-E07 / UC-I02 / UC-I03 | `DSH` | POST /advisees/{id}/coordination-notes; lectura por timeline/dashboard | CUBIERTO |
| `RF-058` | **P1** | Analítica de validación TVCC-30 | UC-S01 | `ANA-P1` | internal/reproducible; HTTP only when 12 closes spec — P1 | CUBIERTO |
| `RF-059` | **P0** | Resiliencia funcional | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 | `INT/SYS` | local catalog/manual fallback; no false success | CUBIERTO |
| `RF-060` | **P0** | Procedencia | UC-I08 / TR-04 / UC-P10 / UC-P15 | `INT/SYS` | provenance in imported/catalog data | CUBIERTO |
| `RF-061` | **P1** | Comunicaciones | UC-P30 | `COM-P1` | GET /me/news... — P1 | CUBIERTO |
| `RF-062` | **P2** | Push | UC-E08 | `COM-P2` | push subscription/delivery minimal, no C4 — P2 | CUBIERTO |
| `RF-064` | **P0** | Objetivo entrenamiento | UC-P14 | `TRN` | training objectives versioned | CUBIERTO |
| `RF-065` | **P0** | APK longitudinal | UC-P31 / UC-I02 | `DSH` | GET /me/progress | CUBIERTO |
| `RF-066` | **P1** | Administración académica / capacidad | UC-P29 / UC-I10 / P11/P16/P19/P21 | `ADM-P1 + SYS` | admin settings P1; P0 gate consumed by activation/evaluation | CUBIERTO |
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
| `UC-I12` | Registrar corrección trazable | TRN/ANT correction pattern |

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
| 09 decide re-activation semantics | replay≠state conflict; same active new command → 422; conflicting active → 409 | CUMPLE CANDIDATO |
| OpenAPI/anti-drift | backend schema→OpenAPI→generated clients→CI | CUMPLE COMO DISEÑO |

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

El 04 contiene 38 RNF en 11 familias. El 09 **no es propietario de los 38**, pero debe materializar contractualmente los que afectan interfaces.

| Familia RNF | Incidencia en 09 | Tratamiento |
|---|---|---|
| SEC ×6 | AuthN/AuthZ, errores, no exposición, auditoría | PDP, MFA/step-up, anti-enumeration, safe envelope |
| PRI ×4 | revocación/minimización/visibilidad | projection server-side, no third-party leakage |
| PERF ×3 | contrato observable y externos | pagination; bounded queries; provider timeouts are adapter/07+11A |
| AVA ×2 | false success / degradación | 503 dependency + fallback semantics |
| REC ×2 | idempotencia / recuperación | Idempotency-Key contract; backup RPO/RTO remains 07/11A |
| ACC ×3 | canales/accesibilidad | same API semantics; concrete UI/accessibility →10/11A |
| MAN ×5 | compatibilidad, anti-drift, testabilidad | OpenAPI/client generation/CI; versioning rules |
| OBS ×3 | correlation/health/trazabilidad | X-Request-Id; error/health contracts; logs implementation →07 |
| INT ×3 | terceros/procedencia/fallback | OFF/wger adapters and controlled imports |
| SCA ×2 | capacidad | gate semantics; numeric sizing/config →06/07/11A |
| DAT ×5 | consistencia/historia/proyección | versioning, corrections, no overwrite, no-data honesty |

**Frontera:** performance budgets, RPO/RTO, deployment, logging infrastructure, DB mechanics and exact load thresholds remain in 07/11A. The 09 only fixes observable contract behavior.

---

# 11. P0 consolidado por vertical

## 11.1 Access / professional / relationship / consent

Cubierto por v0.8: registration, sessions, own profile, professional onboarding, evidence, administrative verification, relationship lifecycle, consent lifecycle.

## 11.2 Nutrition

Cubierto por v0.9 + v0.12: evaluation, immutable/versioned objective, plan draft, validate, activate, catalog, Today, execution, review, continuity, local catalog creation and controlled Open Food Facts import.

## 11.3 Training

Cubierto por v0.10 + v0.12: evaluation, objective, plan, validate/activate, catalog, Today, incremental execution draft, confirm, correction, review, continuity, local exercise creation and controlled wger import.

## 11.4 Anthropometry

Cubierto por v0.11: specification discovery, coherent evaluation, direct/derived separation, reproducible calculations, correction with dependency graph and longitudinal comparability.

## 11.5 Read models / projections

Cubierto por v0.11: caseload, review queue, dashboard, timeline, own progress, eight deep projection keys and versioned professional threshold settings.

## 11.6 Coordination — correction v0.13

P0 adds:

```http
POST /api/v1/advisees/{adviseeId}/coordination-notes
```

Minimum semantics:

- `SESSION_MFA`;
- author and intended visibility evaluated through PDP;
- purpose/domain/reference allowlist;
- note cannot prescribe, alter another plan, decide another domain, close cycles or transfer responsibility;
- protected reference is not made visible by mentioning it;
- author/date/domain/purpose/visibility/references/audit preserved;
- timeline/dashboard consume the note only where authorized.

Failure of required audit/persistence → no false success.

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
| Data rights | 08 mandatory for real-data operation | outlined |
| Own export | 08 mandatory for real-data operation | outlined |
| Break-glass | 08 exceptional security requirement | outlined |
| Private media | conditioned on feature activation | outlined |

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

---

# 14. Conteo de superficie — interpretación correcta

The historical `97` in v0.12 was a **logical candidate operation count**, not a verified count of distinct final HTTP routes.

With correction `RF-057 → P0`, this working counter becomes:

```text
97
+ 1 coordinación P0
= 98 operaciones/intenciones P0 candidatas máximas
```

This number is deliberately labeled **MAXIMUM CANDIDATE** because:

- some operations are transversal/internal;
- some P0 behaviors share an HTTP surface;
- the final master should count **actual API-09 IDs**, not prose intentions;
- the external review must challenge duplicate/split/merge decisions.

Therefore:

```text
98 ≠ promise of 98 public endpoints
98 ≠ implementation scope automatically authorized
98 ≠ immutable final count
```

---

# 15. Candidate decisions still requiring explicit ratification or adversarial challenge

| Candidate | Decision | Nature | Recommendation |
|---|---|---|---|
| CAND-09-S01 | registration uses `registrationIntent`, never a trusted role | materialization/security | RATIFY |
| CAND-09-S02 | grant B2 references exact `consentVersionId` | materialization of 08 | RATIFY |
| CAND-09-S03 | equivalent pending relationship request may replay/return existing logical request | idempotency product/API semantics | REVIEW |
| CAND-09-S04 | verification evidence uses private upload-intent | media/security materialization | RATIFY |
| CAND-09-NUT-COR | structured correction route only for an actually active modality C | scope/materialization | REVIEW AGAINST PRODUCT MODE |
| CAND-09-ANT-B | versioned anthropometry specification discovery | client anti-hardcode | RATIFY |
| CAND-09-PRJ-A | one typed deep-projection route for eight projection keys | surface consolidation | RATIFY |
| CAND-09-PRJ-B | effective-volume threshold is professional/versioned setting | derived domain requirement | RATIFY |
| CAND-09-INT-A | external imports use candidate→review→resolve | integration safety | RATIFY |
| CAND-09-RGT-A | single `/me/data-rights-requests` family for access/rectification/suppression | API materialization | REVIEW |
| CAND-09-EXP-A | own export is scoped/audited job | 08 materialization | RATIFY |
| CAND-09-PRJ-C | longitudinal data-state naming | naming | REVIEW; low decision cost |

No candidate above authorizes implementation by itself.

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

# 17. Findings to send into external review

## BLOCKER candidates

None self-declared. The reviewer must independently prove or refute this.

## MAJOR candidates

1. Verify that the `98` candidate counter does not conceal duplicated or missing P0 behavior.
2. Verify complete separation `session ≠ authorization` and no endpoint bypasses current PDP.
3. Verify consent grant cannot bind stale/different B2 content.
4. Verify every sensitive ID-directed resource applies anti-enumeration.
5. Verify all write lifecycles match 06 states/transitions and no generic PATCH can mutate server-owned status.
6. Verify the eight M-11 projections are complete without creating write authority.
7. Verify no third-party data can leak via dashboard, export, coordination note or aggregate.
8. Verify OFF/wger P0 integration has local/manual fallback and no blind import.
9. Verify `RF-057` is now P0 everywhere in 09.

## MINOR / editorial candidates

- normalize API-09 IDs in the final master;
- normalize English technical naming while preserving canonical Spanish domain terms where externally meaningful;
- remove superseded priority statements from v0.9/v0.10/v0.12 during final master assembly;
- create a final error registry without duplicate synonyms.

---

# 18. DoD for contrarrevisión

The external review must not declare CONFORME unless it verifies at minimum:

- `67/67 RF` mapped;
- `53/53 UC` mapped;
- `5/5 TR` mapped;
- no active RF uses historical IDs 016/063;
- P0/P1/P2 priorities match final 05;
- RF-028 and RF-038 are P0 API;
- RF-057 is P0;
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
BE-LEG-09 v0.13
STATUS:
BORRADOR CONSOLIDADO PRE-CONTRARREVISIÓN

RF:
67/67 MAPEADOS
57 P0 · 8 P1 · 2 P2

UC:
53/53 MAPEADOS
31 P · 12 I · 9 E · 1 S

TR:
5/5 MAPEADAS

CORRECCIONES:
RF-028 OFF → P0 API
RF-038 wger → P0 API
RF-057 coordinación → P0

P0 LOGICAL MAX CANDIDATE:
98
(NO EQUIVALE AUTOMÁTICAMENTE A ENDPOINTS FINALES)

07 §60:
MATERIALIZADO

08 §48:
MATERIALIZADO / CONDICIONADO SEGÚN FASE

LEGACY:
NO NORMATIVO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

SIGUIENTE:
CONTRARREVISIÓN ADVERSARIAL INDEPENDIENTE
→ resolución de hallazgos
→ maestro BE-LEG-09 candidato final
→ Dirección
```

---

*Fin de BE-LEG-09 v0.13 — Consolidación y trazabilidad integral pre-contrarrevisión.*