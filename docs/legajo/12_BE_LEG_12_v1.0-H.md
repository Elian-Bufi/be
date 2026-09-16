# BE-LEG-12 v1.0-H — Trazabilidad, Control de Calidad y Especificación Analítica · Candidato a Baseline

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Entrega:** `H`  
> **Fecha:** `2026-09-09`  
> **Estado:** `CANDIDATO A BASELINE · NO APROBADO`  
> **Autorización:** `ACTA-DIR-032`  
> **Implementación:** `NO AUTORIZADA`  
> **Evidencia runtime:** `NO VERIFICADA`

# 0. Propósito

Cerrar la trazabilidad documental de BE antes de implementación y fijar la especificación analítica canónica candidata de `TVCC-30`.

```text
SPECIFIED ≠ IMPLEMENTED ≠ TESTED
```

# 1. Tres ejes de estado

## Trazabilidad documental
`TRACE_COMPLETE`, `TRACE_COMPLETE_P0`, `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION`,
`TRACE_COMPLETE_P2_DEFERRED_IMPLEMENTATION`, `TRACE_NA`, `TRACE_BLOCKED`.

## Runtime
`NOT_VERIFIED_RUNTIME`, `VERIFIED_IMPLEMENTED`, `VERIFIED_NOT_IMPLEMENTED`.

## Ejecución de pruebas
`NOT_EXECUTED`, `PASS`, `FAIL`, `BLOCKED`.

En H:

```text
RUNTIME = NOT_VERIFIED_RUNTIME
TEST EXECUTION = NOT_EXECUTED
```

# 2. Inventario rector

```text
RF activos: 69 = 59 P0 + 8 P1 + 2 P2
RF retirados: RF-016, RF-063
RNF: 38 = 31 P0 + 7 P1
UC: 56 = 33 P + 13 I + 9 E + 1 S
TR: 5
API P0: 122
API P1 ACC explícitas: 4
UX: 36 PROTO + 5 FLOW = 41 aliases → 14 GPROTO
```

# 3. Fuentes y custodia

| Fuente | SHA-256 |
|---|---|
| 04 | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` |
| 05 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` |
| 06 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |
| 08 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` |
| 09 v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |
| 09 auxiliar P1 | `8a3db34e8c4991d427f089c6424da13daa35d883c7f06171e78daac02441f8c5` |
| B10-11 v0.10.1-G | `205a31709a470156f18952a6d59197ed6ceb757961a70ad1a33e7d9614b6ce6c` |
| 11A candidato H | `d4486ba2d2944b10cc02f1b9724fbb8b98bc98f2d3444b175d36d0e8fbc4055b` |

# 4. IDs retirados

`RF-016` y `RF-063` no participan del universo activo. Sus menciones históricas no reactivan obligación.

# 5. Matriz central RF → UC → contrato → UX → test

| RF | Pri | Capacidad | UC/TR | Contrato 09 | UX | Test 11A | Estado documental | Runtime |
|---|---:|---|---|---|---|---|---|---|
| `RF-001` | P0 | Identidad BE | UC-P25 | `ACC` · POST /registrations · GET /me · PATCH /me/profile | GPROTO-10-01 | `TEST-RF-001` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-002` | P0 | Acceso local | UC-P26 | `ACC` · POST /auth/sessions · DELETE session(s) · GET /me | GPROTO-10-01 | `TEST-RF-002` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-003` | P1 | Identidad federada | UC-E05 | `ACC-P1` · Google federated authorize/complete — P1 | GPROTO-10-01 | `TEST-RF-003` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-004` | P2 | Cuenta híbrida | UC-E06 | `ACC-P2` · GET/POST/DELETE /me/access-methods — P2 | GPROTO-10-01 | `TEST-RF-004` | `TRACE_COMPLETE_P2_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-005` | P1 | Recuperación de cuenta | UC-E09 → UC-P26 | `ACC-P1` · POST /auth/recovery-requests · complete — P1 | GPROTO-10-01 | `TEST-RF-005` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-006` | P0 | Estado operativo | UC-P25 / UC-P26 | `ACC` · GET /me + session/account state | GPROTO-10-01 | `TEST-RF-006` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-007` | P0 | Canales y navegación | UC-I11 | `ACC/SYS` · Contrato first-party común; navegación concreta → 10 | GPROTO-10-01 | `TEST-RF-007` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-069` | P1 | Ciclo de vida de cuenta | UC-P27 | `ACC-P1` · account-closure requests — P1; sessions invalidated | GPROTO-10-01 | `TEST-RF-069` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-008` | P0 | Alta profesional | UC-P01 | `PRO` · GET/PATCH professional-profile | GPROTO-10-02 | `TEST-RF-008` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-009` | P0 | Alta profesional / alcance | UC-P01 / UC-I01 | `PRO` · PUT /me/professional-scopes + evidence | GPROTO-10-02 | `TEST-RF-009` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-010` | P0 | Alta profesional / presentación | UC-P01 | `PRO` · verification submissions + submit | GPROTO-10-02 | `TEST-RF-010` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-011` | P0 | Administración | UC-P02 | `PRO-ADM` · admin verification list/detail | GPROTO-10-02 | `TEST-RF-011` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-012` | P0 | Verificación profesional | UC-P02 / UC-P03 | `PRO-ADM` · resolve + suspend/reinstate | GPROTO-10-02 | `TEST-RF-012` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-013` | P0 | Subsanación | UC-E01 | `PRO` · new evidence/submission version + resubmit | GPROTO-10-02 | `TEST-RF-013` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-014` | P0 | Suspensión / rehabilitación | UC-P03 | `PRO-ADM` · suspend / reinstate professional scope | GPROTO-10-02 | `TEST-RF-014` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-015` | P0 | Gobierno de acceso | TR-01 / UC-P04 / UC-P05 | `REL/CON/SYS` · Separación + PDP; no endpoint autónomo | GPROTO-10-03 | `TEST-RF-015` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-067` | P0 | Alta profesional / capacidad antropométrica | UC-P01 / UC-I01 | `PRO` · same evidence pipeline; scope/capability independent | GPROTO-10-02 | `TEST-RF-067` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-068` | P1 | Incidencias | UC-P28 | `ADM-P1` · incidents minimal — P1 | DEFERRED-P1 — incidencias | `TEST-RF-068` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-070` | P0 | Métodos profesionales reproducibles | UC-I13 / UC-P09 / UC-P14 / UC-I09 | `MTH/CAL` · MTH-01/02 + CAL-01…04 | GPROTO-10-04/06/08 — subflujo transversal | `TEST-RF-070` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-071` | P0 | Información estructurada pertinente | UC-P32 / UC-P33 | `FRM` · FRM-01…08 | GPROTO-10-04/06/08 — subflujo transversal | `TEST-RF-071` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-017` | P0 | Identidad del asesorado | UC-P25 | `ACC` · registration + own profile | GPROTO-10-01 | `TEST-RF-017` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-018` | P0 | Vínculo — solicitud | UC-P04 | `REL` · POST /relationship-requests | GPROTO-10-03 | `TEST-RF-018` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-019` | P0 | Vínculo — decisión | UC-P05 | `REL` · list own requests + accept/reject | GPROTO-10-03 | `TEST-RF-019` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-020` | P0 | Consentimiento | UC-P07 | `CON` · consent-requirements + grant + own list | GPROTO-10-03 | `TEST-RF-020` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-021` | P0 | Autorización contextual | UC-I02 / TR-02 | `SYS/PDP` · server-side PDP en toda operación protegida | GPROTO-10-03 | `TEST-RF-021` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-022` | P0 | Revocación | UC-P08 / TR-05 | `CON` · POST /me/consents/{id}/revoke | GPROTO-10-03 | `TEST-RF-022` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-023` | P0 | Autogobierno | UC-P06 / UC-P07 / UC-P05 | `REL/CON` · own relationships + own consents + own requests | GPROTO-10-03 | `TEST-RF-023` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-024` | P0 | Vínculo — pausa/finalización | UC-P06 | `REL` · pause · resume · finalize | GPROTO-10-03 | `TEST-RF-024` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-025` | P0 | Continuidad longitudinal | UC-I03 / TR-03 | `SYS/DSH` · audit/history + timeline; no overwrite | GPROTO-10-10 | `TEST-RF-025` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-026` | P0 | Nutrición — evaluación | UC-P09 | `NUT` · nutrition evaluations | GPROTO-10-04 | `TEST-RF-026` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-027` | P0 | Catálogo nutricional | UC-P10 | `NUT/INT` · GET/POST catalog-items | GPROTO-10-04 | `TEST-RF-027` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-028` | P0 | Integración nutricional | UC-I07 / UC-P10 | `INT-NUT` · candidate → review/resolve Open Food Facts | GPROTO-10-04 | `TEST-RF-028` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-029` | P0 | Nutrición — objetivo | UC-P09 | `NUT` · nutrition objectives versioned | GPROTO-10-04 | `TEST-RF-029` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-030` | P0 | Plan nutricional | UC-P10 | `NUT` · plan draft list/detail/edit | GPROTO-10-04 | `TEST-RF-030` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-031` | P0 | Activación nutricional | UC-P11 / UC-I04 / UC-I10 | `NUT` · validate + activate, revalidation atomic | GPROTO-10-04 | `TEST-RF-031` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-032` | P0 | APK nutricional — Hoy | UC-P12 | `NUT` · GET /me/nutrition/today | GPROTO-10-05 | `TEST-RF-032` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-033` | P0 | APK nutricional — ejecución | UC-P12 | `NUT` · POST /me/nutrition/executions | GPROTO-10-05 | `TEST-RF-033` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-034` | P0 | Revisión nutricional | UC-P13 | `NUT` · review-context + reviews | GPROTO-10-04 | `TEST-RF-034` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-035` | P0 | Continuidad nutricional | UC-P13 / UC-I06 | `NUT` · POST review/{id}/apply | GPROTO-10-04 | `TEST-RF-035` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-036` | P0 | Entrenamiento — evaluación | UC-P14 | `TRN` · training evaluations | GPROTO-10-06 | `TEST-RF-036` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-064` | P0 | Objetivo entrenamiento | UC-P14 | `TRN` · training objectives versioned | GPROTO-10-06 | `TEST-RF-064` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-037` | P0 | Catálogo de ejercicios | UC-P15 | `TRN/INT` · GET/POST training exercises | GPROTO-10-06 | `TEST-RF-037` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-038` | P0 | Integración entrenamiento | UC-I07 / UC-P15 | `INT-TRN` · candidate → review/resolve wger | GPROTO-10-06 | `TEST-RF-038` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-039` | P0 | Plan de entrenamiento | UC-P15 | `TRN` · training plan draft | GPROTO-10-06 | `TEST-RF-039` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-040` | P0 | Prescripción/estructura | UC-P15 | `TRN` · PATCH plan with blocks/sessions/prescriptions | GPROTO-10-06 | `TEST-RF-040` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-041` | P0 | Activación entrenamiento | UC-P16 / UC-I04 / UC-I10 | `TRN` · validate + activate, atomic | GPROTO-10-06 | `TEST-RF-041` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-042` | P0 | APK entrenamiento — Hoy | UC-P17 | `TRN` · GET /me/training/today | GPROTO-10-07 | `TEST-RF-042` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-043` | P0 | APK entrenamiento — ejecución real | UC-P17 | `TRN` · execution-draft → update → confirm | GPROTO-10-07 | `TEST-RF-043` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-044` | P0 | Corrección entrenamiento | UC-E02 / UC-I12 / UC-I03 | `TRN` · POST execution/{id}/corrections | GPROTO-10-07 | `TEST-RF-044` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-045` | P0 | Revisión entrenamiento | UC-P18 | `TRN` · review-context + reviews | GPROTO-10-06 | `TEST-RF-045` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-046` | P0 | Continuidad entrenamiento | UC-P18 / UC-I06 | `TRN` · POST review/{id}/apply | GPROTO-10-06 | `TEST-RF-046` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-047` | P0 | Antropometría — evaluación | UC-P19 | `ANT` · POST anthropometry evaluation | GPROTO-10-08 | `TEST-RF-047` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-048` | P0 | Cálculos antropométricos | UC-I09 / UC-P19 / UC-E03 | `ANT` · derived results inside evaluation/recalculation | GPROTO-10-08 | `TEST-RF-048` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-049` | P0 | Evolución antropométrica | UC-P20 | `ANT/PRJ` · GET anthropometry/progress | GPROTO-10-08 | `TEST-RF-049` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-050` | P0 | Corrección antropométrica | UC-E03 / UC-I12 / UC-I03 / UC-I09 | `ANT` · POST evaluation/{id}/corrections | GPROTO-10-08 | `TEST-RF-050` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-051` | P1 | Descubrimiento antropométrico | UC-P21 / UC-P22 / UC-E04 / UC-P04 / UC-P05 | `ANT-P1` · publish/search/detail limited — P1; descubrimiento desemboca en solicitud de vínculo | DEFERRED-P1 — descubrimiento antropométrico | `TEST-RF-051` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-052` | P0 | Dashboard profesional | UC-P23 / UC-I02 | `DSH` · GET /me/caseload | GPROTO-10-09 | `TEST-RF-052` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-053` | P0 | Dashboard interdisciplinario | UC-P24 / UC-I02 | `DSH` · GET /advisees/{id}/dashboard | GPROTO-10-09 | `TEST-RF-053` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-054` | P0 | Historial longitudinal | UC-P24 / UC-P31 / UC-I03 | `DSH` · timeline + own progress | GPROTO-10-10 | `TEST-RF-054` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-055` | P0 | Revisión y continuidad / pendientes | UC-P23 / UC-I05 | `DSH` · GET /me/review-queue | GPROTO-10-09 | `TEST-RF-055` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-056` | P0 | Revisión profesional común | UC-I05 → UC-P13 / UC-P18 | `NUT/TRN` · common review semantics in both verticals | GPROTO-10-10 | `TEST-RF-056` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-057` | P0 | Coordinación | UC-E07 / UC-I02 / UC-I03 | `CRD` · API-CRD-01 · POST /advisees/{id}/coordination-notes; lectura autorizada por timeline/dashboard | GPROTO-10-10 | `TEST-RF-057` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-058` | P1 | Analítica de validación TVCC-30 | UC-S01 / UC-P13 / UC-P18 vía UC-I05 / UC-I06 | `ANA-P1` · internal/reproducible; HTTP only when 12 closes spec — P1 | N/A UX — SPEC-TVCC30-v1 / Documento 12 | `TEST-RF-058` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-065` | P0 | APK longitudinal | UC-P31 / UC-I02 | `DSH` · GET /me/progress | GPROTO-10-11 | `TEST-RF-065` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-066` | P1 | Administración académica / capacidad | UC-P29 / UC-I10 / UC-P11 / UC-P16 / UC-P19 / UC-P21 | `ADM-P1 + SYS` · admin settings P1; P0 gate consumed by activation/evaluation | GPROTO-10-02 | `TEST-RF-066` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-059` | P0 | Resiliencia funcional | UC-I08 / TR-04 / UC-P10 / UC-P15 / UC-P22 | `INT/SYS` · local catalog/manual fallback; no false success | GPROTO-10-04/06/08 — subflujo transversal | `TEST-RF-059` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-060` | P0 | Procedencia | UC-I08 / TR-04 / UC-P10 / UC-P15 | `INT/SYS` · provenance in imported/catalog data | GPROTO-10-04/06/08 — subflujo transversal | `TEST-RF-060` | `TRACE_COMPLETE_P0` | `NOT_VERIFIED_RUNTIME` |
| `RF-061` | P1 | Comunicaciones | UC-P30 | `COM-P1` · GET /me/news... — P1 | DEFERRED-P1 — novedades | `TEST-RF-061` | `TRACE_COMPLETE_P1_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |
| `RF-062` | P2 | Push | UC-E08 | `COM-P2` · push subscription/delivery minimal, no C4 — P2 | DEFERRED-P2 — push | `TEST-RF-062` | `TRACE_COMPLETE_P2_DEFERRED_IMPLEMENTATION` | `NOT_VERIFIED_RUNTIME` |

Control: `69/69` RF activos, cero sin test.

# 6. Matriz RNF → propietario → test

| RNF | Pri | Materia | Propietario | Test | Trazabilidad | Runtime |
|---|---:|---|---|---|---|---|
| `RNF-SEC-001` | P0 | Autorización consistente para recursos protegidos | 08/09/11A | `TEST-RNF-SEC-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SEC-002` | P0 | Protección de credenciales, sesiones y secretos | 08/09/11A | `TEST-RNF-SEC-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SEC-003` | P0 | Resistencia a abuso de autenticación y recuperación | 08/09/11A | `TEST-RNF-SEC-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SEC-004` | P0 | Separación de ambientes | 08/09/11A | `TEST-RNF-SEC-004` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SEC-005` | P0 | Auditoría de operaciones sensibles | 08/09/11A | `TEST-RNF-SEC-005` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SEC-006` | P0 | Mínimo privilegio y segregación por dominio | 08/09/11A | `TEST-RNF-SEC-006` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PRI-001` | P0 | Minimización y pertinencia | 08/09/11A | `TEST-RNF-PRI-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PRI-002` | P0 | Revocación efectiva y verificable | 08/09/11A | `TEST-RNF-PRI-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PRI-003` | P0 | Visibilidad adecuada a cada superficie | 08/09/11A | `TEST-RNF-PRI-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PERF-001` | P0 | Rendimiento de operaciones núcleo | 07/11A | `TEST-RNF-PERF-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PERF-002` | P1 | Respuesta percibida de Website y APK | 07/11A | `TEST-RNF-PERF-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PERF-003` | P0 | Tiempo acotado y fallback de integraciones | 07/11A | `TEST-RNF-PERF-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-AVA-001` | P0 | Disponibilidad durante validación y defensa | 07/11A | `TEST-RNF-AVA-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-AVA-002` | P0 | Persistencia después de reinicio | 07/11A | `TEST-RNF-AVA-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-REC-001` | P1 | Copia y restauración verificable | 07/09/11A | `TEST-RNF-REC-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-REC-002` | P0 | Idempotencia de operaciones sensibles | 07/09/11A | `TEST-RNF-REC-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-REL-001` | P0 | Ausencia de éxito falso y recuperación comprensible | 09/10/11A | `TEST-RNF-REL-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-ACC-001` | P0 | Accesibilidad en recorridos núcleo | 10/11A | `TEST-RNF-ACC-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-ACC-002` | P0 | Lenguaje claro, no diagnóstico y no causal | 10/11A | `TEST-RNF-ACC-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-ACC-003` | P0 | Adaptación a las superficies objetivo | 10/11A | `TEST-RNF-ACC-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-PORT-001` | P0 | APK instalable y demostrable en Android físico | 07/11A | `TEST-RNF-PORT-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-MAN-001` | P0 | Separación de responsabilidades y fuente única de reglas | 06/07/09/11A | `TEST-RNF-MAN-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-MAN-002` | P0 | Contratos compatibles y verificables | 06/07/09/11A | `TEST-RNF-MAN-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-MAN-003` | P0 | Evolución reproducible del esquema y los datos | 06/07/09/11A | `TEST-RNF-MAN-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-MAN-004` | P0 | Testabilidad proporcional al riesgo | 06/07/09/11A | `TEST-RNF-MAN-004` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-OBS-001` | P1 | Diagnóstico sin exposición de datos sensibles | 07/08/11A | `TEST-RNF-OBS-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-OBS-002` | P1 | Salud técnica mínima del despliegue | 07/08/11A | `TEST-RNF-OBS-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-OBS-003` | P0 | Trazabilidad bidireccional | 07/08/11A | `TEST-RNF-OBS-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-INT-001` | P1 | Sustituibilidad de proveedores externos | 07/09/11A | `TEST-RNF-INT-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-INT-002` | P0 | Consistencia de fechas, períodos, unidades y zona horaria | 07/09/11A | `TEST-RNF-INT-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-INT-003` | P0 | Validación y normalización de importaciones | 07/09/11A | `TEST-RNF-INT-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SCA-001` | P1 | Escala suficiente para validación y segmento inicial | 06/07/11A | `TEST-RNF-SCA-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-SCA-002` | P1 | Configuración desacoplada de habilitaciones y capacidad | 06/07/11A | `TEST-RNF-SCA-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-DAT-001` | P0 | Integridad de estados críticos | 06/08/09/11A | `TEST-RNF-DAT-001` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-DAT-002` | P0 | Procedencia obligatoria | 06/08/09/11A | `TEST-RNF-DAT-002` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-DAT-003` | P0 | Versionado y ausencia de sobrescritura silenciosa | 06/08/09/11A | `TEST-RNF-DAT-003` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-DAT-004` | P0 | Validación de datos y errores accionables | 06/08/09/11A | `TEST-RNF-DAT-004` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |
| `RNF-DAT-005` | P0 | Reproducibilidad temporal y analítica | 06/08/09/11A | `TEST-RNF-DAT-005` | `TRACE_COMPLETE` | `NOT_VERIFIED_RUNTIME` |

# 7. Matriz UC → RF → test

| UC | Nombre | RF relacionados | Test | Trazabilidad | Ejecución |
|---|---|---|---|---|---|
| `UC-P01` | Gestionar alta profesional escalonada | `RF-008`, `RF-009`, `RF-010`, `RF-067` | `TEST-UC-P01` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P02` | Revisar solicitud y resolver la verificación profesional | `RF-011`, `RF-012` | `TEST-UC-P02` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E01` | Subsanar y volver a presentar evidencia | `RF-013` | `TEST-UC-E01` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P03` | Suspender o rehabilitar capacidad profesional | `RF-012`, `RF-014` | `TEST-UC-P03` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P04` | Solicitar o invitar a un vínculo | `RF-015`, `RF-018`, `RF-051` | `TEST-UC-P04` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P05` | Aceptar o rechazar un vínculo | `RF-015`, `RF-019`, `RF-023`, `RF-051` | `TEST-UC-P05` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P06` | Consultar, pausar o finalizar un vínculo | `RF-023`, `RF-024` | `TEST-UC-P06` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P07` | Otorgar y consultar consentimiento específico | `RF-020`, `RF-023` | `TEST-UC-P07` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P08` | Revocar consentimiento | `RF-022` | `TEST-UC-P08` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I02` | Evaluar autorización contextual | `RF-021`, `RF-052`, `RF-053`, `RF-057`, `RF-065` | `TEST-UC-I02` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P09` | Registrar evaluación y objetivo nutricional | `RF-026`, `RF-029`, `RF-070` | `TEST-UC-P09` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P10` | Diseñar plan nutricional | `RF-027`, `RF-028`, `RF-030`, `RF-059`, `RF-060` | `TEST-UC-P10` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P11` | Validar y activar plan nutricional | `RF-031`, `RF-066` | `TEST-UC-P11` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P12` | Consultar y registrar ejecución nutricional en APK | `RF-032`, `RF-033` | `TEST-UC-P12` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P13` | Revisar evidencia y decidir continuidad nutricional | `RF-034`, `RF-035`, `RF-056`, `RF-058` | `TEST-UC-P13` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I05` | Registrar revisión profesional válida | `RF-055`, `RF-056`, `RF-058` | `TEST-UC-I05` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I06` | Aplicar continuidad o cierre | `RF-035`, `RF-046`, `RF-058` | `TEST-UC-I06` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P14` | Registrar evaluación y objetivo de entrenamiento | `RF-036`, `RF-064`, `RF-070` | `TEST-UC-P14` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P15` | Diseñar plan de entrenamiento | `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-059`, `RF-060` | `TEST-UC-P15` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P16` | Validar y activar plan de entrenamiento | `RF-041`, `RF-066` | `TEST-UC-P16` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P17` | Consultar y registrar ejecución de entrenamiento en APK | `RF-042`, `RF-043` | `TEST-UC-P17` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E02` | Corregir ejecución de entrenamiento | `RF-044` | `TEST-UC-E02` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P18` | Revisar evidencia y decidir continuidad de entrenamiento | `RF-045`, `RF-046`, `RF-056`, `RF-058` | `TEST-UC-P18` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P19` | Registrar evaluación antropométrica | `RF-047`, `RF-048`, `RF-066` | `TEST-UC-P19` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I09` | Emitir cálculos antropométricos reproducibles | `RF-048`, `RF-050`, `RF-070` | `TEST-UC-I09` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E03` | Corregir o anular medición antropométrica | `RF-048`, `RF-050` | `TEST-UC-E03` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I12` | Registrar corrección trazable | `RF-044`, `RF-050` | `TEST-UC-I12` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P20` | Consultar evolución antropométrica | `RF-049` | `TEST-UC-P20` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P21` | Publicar servicio antropométrico limitado | `RF-051`, `RF-066` | `TEST-UC-P21` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P22` | Descubrir servicio antropométrico | `RF-051`, `RF-059` | `TEST-UC-P22` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E04` | Solicitar vínculo desde descubrimiento antropométrico | `RF-051` | `TEST-UC-E04` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P23` | Consultar cartera y revisiones pendientes | `RF-052`, `RF-055` | `TEST-UC-P23` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P24` | Consultar dashboard y línea temporal interdisciplinaria | `RF-053`, `RF-054` | `TEST-UC-P24` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E07` | Registrar nota de coordinación autorizada | `RF-057` | `TEST-UC-E07` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P31` | Consultar progreso longitudinal en APK | `RF-054`, `RF-065` | `TEST-UC-P31` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P25` | Registrar identidad BE y perfil propio | `RF-001`, `RF-006`, `RF-017` | `TEST-UC-P25` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P26` | Autenticar y finalizar una sesión local | `RF-002`, `RF-005`, `RF-006` | `TEST-UC-P26` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E05` | Acceder mediante Google | `RF-003` | `TEST-UC-E05` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E06` | Administrar métodos de acceso | `RF-004` | `TEST-UC-E06` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E09` | Recuperar el acceso local | `RF-005` | `TEST-UC-E09` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P27` | Solicitar cierre de cuenta | `RF-069` | `TEST-UC-P27` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P28` | Registrar y gestionar incidencia administrativa | `RF-068` | `TEST-UC-P28` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P29` | Configurar habilitaciones y capacidad académica | `RF-066` | `TEST-UC-P29` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P30` | Consultar novedades internas | `RF-061` | `TEST-UC-P30` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P32` | Solicitar información estructurada pertinente al asesorado | `RF-071` | `TEST-UC-P32` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-P33` | Completar información solicitada | `RF-071` | `TEST-UC-P33` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-E08` | Recibir notificación push no sensible | `RF-062` | `TEST-UC-E08` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I01` | Presentar evidencia versionada | `RF-009`, `RF-067` | `TEST-UC-I01` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I03` | Registrar auditoría y preservar historia | `RF-025`, `RF-044`, `RF-050`, `RF-054`, `RF-057` | `TEST-UC-I03` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I04` | Validar y versionar un plan | `RF-031`, `RF-041` | `TEST-UC-I04` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I07` | Importar elemento externo con revisión controlada | `RF-028`, `RF-038` | `TEST-UC-I07` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I08` | Aplicar fallback manual y conservar procedencia | `RF-059`, `RF-060` | `TEST-UC-I08` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I10` | Verificar habilitación y capacidad antes de iniciar proceso | `RF-031`, `RF-041`, `RF-066` | `TEST-UC-I10` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I11` | Encauzar al actor por la superficie prevista | `RF-007` | `TEST-UC-I11` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-I13` | Ejecutar y adoptar cálculo profesional reproducible | `RF-070` | `TEST-UC-I13` | `TRACE_COMPLETE` | `NOT_EXECUTED` |
| `UC-S01` | Obtener TVCC-30 de manera reproducible | `RF-058` | `TEST-UC-S01` | `TRACE_COMPLETE` | `NOT_EXECUTED` |

Control: `56/56 UC`.

# 8. Matriz API P0 → RF/familia → contract test

| API | Familia | RF reverse-trace | Test | Estado contractual | Runtime |
|---|---|---|---|---|---|
| `API-ACC-01` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-02` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-03` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-04` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-05` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-06` | `ACC` | `RF-001`, `RF-002`, `RF-003`, `RF-004`, `RF-005`, `RF-006`, `RF-007`, `RF-017`, `RF-069` | `TEST-CT-ACC-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-01` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-02` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-03` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-04` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-05` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-06` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-07` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-08` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-09` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-09` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-10` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-10` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-11` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-11` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-12` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-12` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRO-13` | `PRO` | `RF-008`, `RF-009`, `RF-010`, `RF-011`, `RF-012`, `RF-013`, `RF-014`, `RF-067` | `TEST-CT-PRO-13` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-01` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-02` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-03` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-04` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-05` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-06` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-07` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-08` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-REL-09` | `REL` | `RF-015`, `RF-018`, `RF-019`, `RF-023`, `RF-024` | `TEST-CT-REL-09` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-01` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-02` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-03` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-04` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-05` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-06` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-07` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CON-08` | `CON` | `RF-015`, `RF-020`, `RF-022`, `RF-023` | `TEST-CT-CON-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-01` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-02` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-03` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-04` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-05` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-06` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-07` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-08` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-09` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-09` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-10` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-10` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-11` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-11` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-12` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-12` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-13` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-13` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-14` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-14` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-15` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-15` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-16` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-16` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-17` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-17` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-18` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-18` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-19` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-19` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-20` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-20` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-NUT-21` | `NUT` | `RF-026`, `RF-027`, `RF-028`, `RF-029`, `RF-030`, `RF-031`, `RF-032`, `RF-033`, `RF-034`, `RF-035`, `RF-056` | `TEST-CT-NUT-21` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-01` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-02` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-03` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-04` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-05` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-06` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-07` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-08` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-09` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-09` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-10` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-10` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-11` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-11` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-12` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-12` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-13` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-13` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-14` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-14` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-15` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-15` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-16` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-16` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-17` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-17` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-18` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-18` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-19` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-19` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-20` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-20` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-21` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-21` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-22` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-22` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-23` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-23` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-TRN-24` | `TRN` | `RF-036`, `RF-037`, `RF-038`, `RF-039`, `RF-040`, `RF-041`, `RF-042`, `RF-043`, `RF-044`, `RF-045`, `RF-046`, `RF-056`, `RF-064` | `TEST-CT-TRN-24` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-01` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-02` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-03` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-04` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-05` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-06` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-07` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-08` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-09` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-09` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-10` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-10` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-11` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-11` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-ANT-12` | `ANT` | `RF-047`, `RF-048`, `RF-049`, `RF-050`, `RF-051` | `TEST-CT-ANT-12` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-DSH-01` | `DSH` | `RF-025`, `RF-052`, `RF-053`, `RF-054`, `RF-055`, `RF-065` | `TEST-CT-DSH-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-DSH-02` | `DSH` | `RF-025`, `RF-052`, `RF-053`, `RF-054`, `RF-055`, `RF-065` | `TEST-CT-DSH-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-DSH-03` | `DSH` | `RF-025`, `RF-052`, `RF-053`, `RF-054`, `RF-055`, `RF-065` | `TEST-CT-DSH-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-DSH-04` | `DSH` | `RF-025`, `RF-052`, `RF-053`, `RF-054`, `RF-055`, `RF-065` | `TEST-CT-DSH-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-DSH-05` | `DSH` | `RF-025`, `RF-052`, `RF-053`, `RF-054`, `RF-055`, `RF-065` | `TEST-CT-DSH-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRJ-01` | `PRJ` | `RF-049` | `TEST-CT-PRJ-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRJ-02` | `PRJ` | `RF-049` | `TEST-CT-PRJ-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-PRJ-03` | `PRJ` | `RF-049` | `TEST-CT-PRJ-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-NUT-01` | `INT-NUT` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-NUT-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-NUT-02` | `INT-NUT` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-NUT-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-NUT-03` | `INT-NUT` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-NUT-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-TRN-01` | `INT-TRN` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-TRN-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-TRN-02` | `INT-TRN` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-TRN-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-INT-TRN-03` | `INT-TRN` | `RF-027`, `RF-028`, `RF-037`, `RF-038`, `RF-059`, `RF-060` | `TEST-CT-INT-TRN-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CRD-01` | `CRD` | `RF-057` | `TEST-CT-CRD-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-MTH-01` | `MTH` | `RF-070` | `TEST-CT-MTH-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-MTH-02` | `MTH` | `RF-070` | `TEST-CT-MTH-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CAL-01` | `CAL` | `RF-070` | `TEST-CT-CAL-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CAL-02` | `CAL` | `RF-070` | `TEST-CT-CAL-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CAL-03` | `CAL` | `RF-070` | `TEST-CT-CAL-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-CAL-04` | `CAL` | `RF-070` | `TEST-CT-CAL-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-01` | `FRM` | `RF-071` | `TEST-CT-FRM-01` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-02` | `FRM` | `RF-071` | `TEST-CT-FRM-02` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-03` | `FRM` | `RF-071` | `TEST-CT-FRM-03` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-04` | `FRM` | `RF-071` | `TEST-CT-FRM-04` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-05` | `FRM` | `RF-071` | `TEST-CT-FRM-05` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-06` | `FRM` | `RF-071` | `TEST-CT-FRM-06` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-07` | `FRM` | `RF-071` | `TEST-CT-FRM-07` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |
| `API-FRM-08` | `FRM` | `RF-071` | `TEST-CT-FRM-08` | `CONTRACT_SPECIFIED` | `NOT_VERIFIED_RUNTIME` |

Control: `122/122 P0`, cero duplicados.

# 9. Contratos P1 explícitos de acceso/cuenta

| API P1 | RF | Test | Trazabilidad | Runtime |
|---|---|---|---|---|
| `API-ACC-P1-01` | RF-005 | `TEST-CT-P1-ACC-P1-01` | `TRACE_COMPLETE_P1` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-P1-02` | RF-005 | `TEST-CT-P1-ACC-P1-02` | `TRACE_COMPLETE_P1` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-P1-03` | RF-069 | `TEST-CT-P1-ACC-P1-03` | `TRACE_COMPLETE_P1` | `NOT_VERIFIED_RUNTIME` |
| `API-ACC-P1-04` | RF-069 | `TEST-CT-P1-ACC-P1-04` | `TRACE_COMPLETE_P1` | `NOT_VERIFIED_RUNTIME` |

No se suman a 122 P0.

# 10. UX

```text
41/41 aliases históricos
→ 14 GPROTO

UX SPECIFIED = YES
PROTOTYPE RUNTIME EVIDENCE = NOT VERIFIED
```

# 11. Deuda de implementación

Una capacidad puede estar documentalmente trazada y no tener runtime verificado.

Toda deuda futura debe registrar:
ID, prioridad, fuente, impacto, condición de cierre y evidencia.

# 12. TVCC-30 — propiedad

Consume:

```text
RF-058
UC-S01
UC-P13 / UC-P18
UC-I05 / UC-I06
REG-06-75
REG-06-186…201
INV-06-196…210
```

12 posee fórmula, elegibilidad fina, ventana, versionado y reproducibilidad.
No redefine la máquina de revisión/cierre.

# 13. SPEC-TVCC30-v1

```text
ID: SPEC-TVCC30-v1
NOMBRE: TVCC-30 — Tasa de ciclos cerrados trazables en ventana de 30 días
TIPO: métrica académica de validación
PRIORIDAD: P1
ZONA: America/Argentina/Buenos_Aires
```

Interpretación prohibida:
retención, adherencia, resultado corporal, resultado de salud, score clínico, ranking.

**Esta es una decisión analítica candidata de Documento 12; no se presenta como texto preexistente de 04/05/06.**

# 14. Ventana v1

Para fecha local de corte `C`:

```text
inicio = 00:00 de C-29 días
fin exclusivo = 00:00 de C+1 día
zona = America/Argentina/Buenos_Aires
```

Son exactamente 30 fechas calendario locales, incluida `C`.

# 15. Universo candidato U

`U` contiene una referencia única por ciclo potencialmente evaluable cuyo **fin de período/ciclo canónico** cae dentro de la ventana y pertenece a una vertical que produce revisión profesional válida para TVCC-30.

Debe poder reconstruirse:
ciclo/proceso, dominio, titular, contexto profesional, vínculo/Alcance histórico pertinente,
fin del período/ciclo y procedencia suficiente.

Un ciclo aparece una vez.

# 16. Elegibilidad v1

Candidato elegible para D si:

1. no es demo;
2. vínculo/Alcance histórico era elegible;
3. es proceso real de seguimiento contemplado;
4. su ancla cae en la ventana;
5. la evidencia permite clasificar sin inferencia.

No elegible conocido → `EXCLUDED` con motivo.

Potencialmente elegible pero no resoluble → `UNRESOLVED` con motivo.

`UNRESOLVED` no se convierte en cero ni exclusión conveniente.

# 17. Denominador D

```text
D = cantidad de ciclos de U clasificados ELEGIBLE
```

Cada ciclo máximo una vez. Exclusiones quedan fuera con motivo.

# 18. Numerador N

```text
N = ciclos de D que, antes del corte, poseen:
revisión profesional válida
AND próxima acción o cierre semánticamente admitidos
AND continuidad/cierre efectivamente materializado
```

`N ⊆ D`, `N <= D`.

No cuentan: dashboard, visualización, nota libre, edición silenciosa, decisión no aplicada o registro incompleto.

# 19. Fórmula v1

Si `D > 0` y `UNRESOLVED = 0`:

```text
resultado canónico = (N,D)
TVCC30 = N / D
TVCC30_percent = 100 × N / D
```

La semántica auditable conserva `N` y `D`; redondeo de presentación no redefine el resultado.

# 20. D = 0

Si `D=0`, no hay porcentaje TVCC-30.

Se conserva `N=0`, `D=0`, universo y exclusiones, pero **no se publica `0%`** como desempeño medido.

# 21. Evidencia insuficiente

Si existe candidato `UNRESOLVED` que podría alterar D:

```text
NO SE PRODUCE VALOR TVCC30
```

Solo reporte trazable de universo, resolubles/no resolubles, motivos, versión y ventana.

# 22. Reproducción histórica

Conservar como mínimo:
spec/version, corte, inicio/fin, zona, U, elegibles, excluidos+motivo,
unresolved+motivo, N, D, tasa si existe, fuentes/eventos, ejecutor y timestamp.

```text
mismas fuentes + misma spec + mismo corte → mismo U/N/D
```

# 23. Versionado

Cambiar ventana, ancla, elegibilidad, tratamiento de unresolved, N, D o fórmula exige nueva versión.

Nueva spec aplicada a período histórico → nuevo resultado; nunca overwrite.

# 24. Anti-gaming

No aumenta N por abrir UI, guardar nota, editar silenciosamente, duplicar ciclo/revisión,
reaplicar continuidad, excluir silenciosamente o alterar timestamps sin corrección trazable.

# 25. Contrato P1 TVCC

09 declara RF-058 como `ANA-P1`, interno/reproducible y HTTP solo cuando 12 cierre spec.

12 no inventa endpoint.

```text
TRACE-DEBT-12-001
propietario: 09
prioridad: P1
bloquea P0: NO
condición: si RF-058 entra al scope de implementación, reconciliar 09 antes de código.
```

# 26. Pruebas

11A define `TEST-TVCC-001…012`. No ejecutadas.

# 27. Traza RF-058

```text
RF-058
→ UC-S01
→ UC-I05/UC-I06
→ REG-06-186…201
→ SPEC-TVCC30-v1
→ TEST-TVCC-001…012
→ 11B futuro
```

# 28. Traza transversal crítica

```text
RF-070 → UC-I13 → REG-06-202…208 → 08 → MTH/CAL → UX → tests
RF-071 → UC-P32/P33 → REG-06-209…213 → 08 → FRM → UX → tests
RF-047/V04 → ANT-07…11 → GPROTO-10-08 → TEST-ANT-002/003
RF-050 → UC-E03 → ANT-12 → GPROTO-10-08 → TEST-ANT-005…008
```

# 29. Gate hacia implementación

Baseline H **no autoriza automáticamente implementación**.

La autorización posterior debe declarar repo, branch, Git, ambientes, datos sintéticos,
scope implementable, merge policy y roles.

# 30. DoD

No aprobar si:
- RF activos != 69;
- RF-016/RF-063 aparecen activos;
- RNF != 38;
- UC != 56;
- API P0 != 122;
- P1 se suma a P0;
- RF sin test;
- se mezcla documental/runtime/test;
- TVCC carece de U/D/N/fórmula/ventana/versionado;
- D=0 se convierte en 0%;
- evidencia incompleta se inventa;
- TVCC se vuelve score/adherencia/retención;
- 12 inventa API;
- 12 afirma implementación.

# 31. Estado

```text
BE-LEG-12 v1.0-H
CANDIDATO A BASELINE

RF 69/69
RNF 38/38
UC 56/56
API P0 122/122
UX 41 aliases / 14 GPROTO

SPEC-TVCC30-v1:
DEFINIDA COMO CANDIDATA

RUNTIME:
NOT VERIFIED

TEST EXECUTION:
NOT EXECUTED

IMPLEMENTACIÓN:
NO
```
