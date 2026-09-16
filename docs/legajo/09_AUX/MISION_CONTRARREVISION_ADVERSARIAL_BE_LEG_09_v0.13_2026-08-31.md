# Misión de contrarrevisión adversarial independiente — BE-LEG-09 v0.13

> **Objeto a revisar:** `BE_LEG_09_v0.13_CONSOLIDACION_Y_TRAZABILIDAD_INTEGRAL_2026-08-31.md`
> **SHA-256 esperado:** `849daa309b9bce4c99fc3d29a309318d9be07045de4af7d9ae1cb5decc5b8db5`
> **Rol del revisor:** revisor independiente / adversarial
> **Prohibido:** editar el documento, implementar código, operar Git, declarar aprobación de Dirección
> **Resultado esperado:** informe de contrarrevisión con evidencia y veredicto documental

---

# 1. Misión

Realizá una **contrarrevisión adversarial independiente** del BE-LEG-09 v0.13.

No debés intentar mejorarlo por intuición ni asumir que el productor tuvo razón. Tu trabajo es intentar demostrar que el documento:

- omitió un requisito;
- inventó una conducta;
- contradice 04/05/06/07/08;
- clasificó mal P0/P1/P2;
- dividió o fusionó mal contratos;
- tiene una vulnerabilidad semántica;
- deja una ruta sin AuthN/AuthZ/audit/idempotency/concurrency donde corresponde;
- rompe compatibilidad;
- o invade la propiedad de 10/11A/12.

Solo si no podés probar defectos relevantes después de revisar las fuentes, emití `CONFORME`.

---

# 2. Fuentes mínimas

Usá las versiones canónicas/locales vigentes del proyecto, en este orden:

1. BE-LEG-00 y actas vigentes.
2. BE-LEG-04 v0.4.1.
3. BE-LEG-05 v0.14.
4. BE-LEG-06 canónico.
5. BE-LEG-08 canónico.
6. BE-LEG-07 canónico local.
7. BE-LEG-09 v0.13 y, solo como auxiliares, v0.7–v0.12.
8. AS-IS/código únicamente como referencia de convergencia; **nunca como autoridad normativa**.

Si una fuente canónica no está disponible, marcá `NO VERIFICADO` y degradá el veredicto; no la reconstruyas desde memoria.

---

# 3. Regla de independencia

No aceptes como prueba:

- la autodeclaración `67/67`;
- el conteo `98`;
- los estados `CUBIERTO`;
- la frase “derivada del canon”;
- la explicación de por qué una operación fue fusionada.

Recalculá esos resultados.

---

# 4. Pruebas obligatorias

## A. RF

Recalculá los 67 RF activos del 04/05.

Verificá:

- 67 únicos;
- huecos históricos RF-016/RF-063 no reutilizados;
- prioridad final de cada uno;
- `57 P0 / 8 P1 / 2 P2`;
- RF-028 = P0 API;
- RF-038 = P0 API;
- **RF-057 = P0**;
- cada RF con hogar contractual suficiente;
- ningún RF cubierto solo por una frase no ejecutable.

Producí tabla de discrepancias, incluso si queda vacía.

## B. UC/TR

Recalculá:

```text
31 UC-P
12 UC-I
9 UC-E
1 UC-S
= 53 UC

5 TR
```

Para cada UC/TR, verificá que el contrato 09 permita cumplir sus garantías, excepciones y postcondiciones relevantes.

## C. BE-LEG-06

Buscá contradicciones de:

- estados;
- transiciones;
- unicidades;
- versionado;
- corrección;
- snapshot;
- capacidad;
- relación vínculo/consentimiento;
- direct measurement vs derived result;
- training planned vs executed;
- review semantics;
- eight M-11 projections;
- no-data honesty.

Un endpoint cómodo que contradiga 06 es un defecto del 09.

## D. BE-LEG-07 §60

Verificá independientemente:

- `/api/v1`;
- HTTPS/REST;
- ErrorEnvelope;
- `DB_UNAVAILABLE`;
- paginación;
- idempotencia observable;
- optimistic concurrency;
- breaking→v2;
- retry semantics;
- reactivation semantics;
- OpenAPI anti-drift.

## E. BE-LEG-08 §48

Verificá uno por uno:

- hot revocation;
- exact consent version shown/accepted;
- same authorization Website/APK;
- anti-enumeration;
- account closure session invalidation;
- subject-scoped exports;
- data-subject rights;
- MFA/step-up admin;
- break-glass;
- neutral rate limit;
- recovery non-enumeration;
- no third-party data in responses;
- no C4 in push.

Además buscá rutas indirectas de fuga por:

- dashboard;
- timeline;
- coordination note;
- export;
- projection/aggregate;
- provider import;
- error details.

## F. Superficie P0

Recalculá desde cero la superficie necesaria.

El `98` del documento es **hipótesis de conteo**, no dato.

Clasificá cada candidato:

```text
KEEP
MERGE
SPLIT
MOVE_TO_P1
MOVE_TO_P2
INTERNAL_ONLY
REMOVE
MISSING
```

Si el total final difiere, explicá exactamente por qué.

## G. Contratos verticales

### Nutrición
- evaluation/objective/plan lifecycle;
- validate vs activate;
- snapshot;
- Today;
- execution;
- correction only where canon permits;
- review/apply;
- OFF controlled import + manual fallback;
- no adherence/health score invented.

### Entrenamiento
- plan hierarchy;
- PERCENT_RM/RIR;
- draft→confirm execution;
- no-record ≠ NOT_COMPLETED;
- correction chain;
- substitution;
- 17 muscle zones;
- PRIMARY/SECONDARY without invented weights;
- wger controlled import;
- projection writes forbidden.

### Antropometría
- direct ≠ derived;
- method/formula/version/input/precision;
- unit provenance;
- correction→dependent recalc;
- comparability;
- no interpolation/imputation/carry-forward.

### Proyecciones
- exactly eight mandatory keys;
- read-only;
- partial authorization does not use hidden data;
- threshold remains professional/versioned;
- no global score.

### Coordinación
Verificá específicamente la corrección v0.13:
- RF-057 P0;
- POST note sufficient;
- no required separate GET if timeline/dashboard can fulfill reading;
- no cross-domain prescription;
- no responsibility transfer;
- protected reference cannot become visible through text.

---

# 5. Severidad

Usá exactamente:

```text
BLOCKER
MAJOR
MINOR
OBSERVATION
```

## BLOCKER

Contradiction with canonical source, missing P0 behavior, security flaw allowing unauthorized sensitive access, or unresolvable traceability preventing approval.

## MAJOR

Substantial contract defect, wrong lifecycle/status/error/idempotency semantics, important duplication or missing cross-cutting obligation.

## MINOR

Naming, documentation, registry inconsistency, low-risk ambiguity with obvious correction.

## OBSERVATION

Useful note that does not need correction before approval.

---

# 6. Evidence standard

For every substantive finding:

```text
Claim
→ canonical source + section/ID
→ BE-LEG-09 section/route
→ why they conflict
→ minimum correction
```

Use labels:

```text
VERIFIED
INFERRED
ASSUMED
NOT VERIFIED
```

Do not call something wrong only because it differs from legacy code.

---

# 7. Required output

Return one report with these sections:

1. Executive verdict.
2. Sources actually read + hashes/versions when available.
3. Independent quantitative check:
   - RF,
   - UC,
   - TR,
   - P0/P1/P2.
4. RF discrepancy matrix.
5. UC/TR discrepancy matrix.
6. 06-domain contradiction audit.
7. 07 §60 compliance audit.
8. 08 §48 compliance audit.
9. P0 surface reduction/recount.
10. Security-negative analysis.
11. Vertical audits:
    - access/governance;
    - nutrition;
    - training;
    - anthropometry;
    - projections;
    - integrations;
    - coordination.
12. Candidate decisions assessment.
13. Findings ranked BLOCKER/MAJOR/MINOR/OBSERVATION.
14. Exact corrections required for next BE-LEG-09 version.
15. Final verdict:
    - `CONFORME`;
    - `CONFORME CON CORRECCIONES MENORES`;
    - `NO CONFORME`.

---

# 8. Explicit prohibitions

Do not:

- edit BE-LEG-09;
- create a replacement master;
- implement code;
- change Prisma;
- run migrations;
- commit/push;
- mark document approved/canonical;
- treat the current code as normative;
- invent legal conclusions beyond BE-LEG-08;
- add marketplace/payments/chat/clinical scoring.

Your job ends at the **review report**.

---

# 9. Special challenge

Try especially hard to falsify these producer claims:

```text
67/67 RF covered
53/53 UC covered
5/5 TR covered
57 P0 / 8 P1 / 2 P2
RF-028 P0 API
RF-038 P0 API
RF-057 P0
98 logical P0 candidate operations maximum
all 07 §60 obligations materialized
all 08 §48 obligations owned
no canonical contradiction
```

A useful review is not one that agrees. It is one that leaves those claims standing **after trying to break them**.
