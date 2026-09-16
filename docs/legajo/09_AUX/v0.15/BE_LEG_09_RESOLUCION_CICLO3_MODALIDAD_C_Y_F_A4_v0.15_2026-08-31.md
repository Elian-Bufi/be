# BE-LEG-09 — Resolución de ciclo 3 y decisión de Dirección sobre modalidad C

> **Fecha:** 2026-08-31  
> **Versión resultante:** `BE-LEG-09 v0.15`  
> **Estado:** resolución de trabajo; no canoniza ni autoriza implementación  
> **Git:** sin operaciones

## 1. Decisión de Dirección

Dirección resolvió expresamente:

> El asesorado debe poder registrar una comida/ingesta de forma libre cuando sea **fuera de las prescriptas por el plan**.

Materialización contractual:

```text
OUTSIDE_PRESCRIPTION
+ FREE_DESCRIPTION
= P0
```

No se habilita `FREE_DESCRIPTION` como sustituto genérico de una comida prescripta.

## 2. Consecuencias

- `CAND-09-NUT-B` queda resuelta: modalidad A P0; modalidad C P0 para fuera de prescripción; modalidad B contemplada pero capability-gated.
- `CAND-09-NUT-F` queda superada/renombrada por `CAND-09-NUT-COR`.
- `CAND-09-NUT-COR` queda resuelta por Dirección.
- se crea `API-NUT-21`:

```http
POST /api/v1/nutrition/executions/{executionId}/corrections
```

- el profesional puede estructurar el texto libre como **estimación trazable**;
- el original no se sobrescribe;
- la estimación no se presenta como medición;
- la corrección no altera plan/snapshot ni convierte retroactivamente la ingesta en prescripta.

## 3. Corrección de idempotencia

Para ejecuciones prescriptas:

```text
unicidad natural
= asesorado + versión activa + ocurrencia planificada
```

Para ingestas libres fuera de prescripción:

```text
múltiples eventos reales por día permitidos
+ Idempotency-Key por submit lógico
```

No se usa una única ocurrencia diaria que impida registrar dos comidas libres diferentes.

## 4. F-A4-C3

La contrarrevisión interna detectó 20 candidatas históricas omitidas en v0.14.

v0.15 incorpora un registro exhaustivo:

```text
55 CAND-09 totales
55 con disposición explícita
0 candidatas históricas desaparecidas sin relación
```

## 5. Conteo P0

Recuento por IDs:

```text
ACC/PRO/REL/CON ............ 32
NUT base ................... 20
API-NUT-21 .................  1
TRN ........................ 24
ANT/DSH/PRJ ................ 14
INT-NUT/INT-TRN ............  6
API-CRD-01 .................  1
                             --
TOTAL ...................... 98
```

Este `98` es reproducible desde IDs y no reutiliza el contador lógico antiguo de v0.13.

## 6. Resultado

```text
F-A1       CERRADO
N-1        CERRADO
F-A4-C3    CERRADO
MINOR C2   11/11 CERRADOS
MODALIDAD C RESUELTA POR DIRECCIÓN
P0 IDs     98
REDISEÑO   NO
IMPLEMENTACIÓN NO AUTORIZADA
```
