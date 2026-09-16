# ACTA-DIR-021 — Ratificación de la Auditoría de Impacto Transversal y autorización del parche documental

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — ratificación de impacto y autorización documental acotada  
> **Fecha:** `2026-09-06`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Objeto de decisión:** `AUDITORIA_IMPACTO_TRANSVERSAL_BE_v0.2.1_2026-09-06_POST_CONTRARREVISION.md`  
> **SHA-256 del objeto ratificado:** `454eae54dd595cef67ff96665713c357648bbbfbcdeffb26afbc045f35e7b35c`  
> **Operaciones Git autorizadas:** `NINGUNA`  
> **Implementación autorizada:** `NO`  
> **Canonización autorizada:** `NO`

---

## 1. Antecedente

B10-07 Antropometría UX P0 cerró su ciclo de contrarrevisión y contraste corto como:

```text
CONFORME — B10-07 ESTABLE COMO CANDIDATO DE TRABAJO
```

La Auditoría de Impacto Transversal posterior identificó cuatro frentes:

```text
CAP-MET   — métodos/cálculos profesionales versionados y reproducibles
CAP-DAT   — formularios estructurados solicitados por profesionales
ANT-DRAFT — UC-P19 V04, evaluación antropométrica guardable/retomable
ANT-VOID  — RF-050, rama de anulación antropométrica no materializada downstream
```

La contrarrevisión independiente de la auditoría concluyó:

```text
CONFORME — READY_FOR_TRANSVERSE_PATCH
```

sin hallazgos residuales ni impacto material sobre BE-LEG-07.

---

## 2. Decisión de Dirección

Dirección **RATIFICA** el mapa de impacto transversal v0.2.1 como base de trabajo para un parche documental controlado.

La ratificación:

- habilita la redacción de nuevas versiones de trabajo de los documentos afectados;
- no aprueba por anticipado el texto de esas nuevas versiones;
- no canoniza ningún artefacto;
- no autoriza implementación;
- no autoriza Git;
- no reabre materias declaradas `SIN CAMBIO`.

---

## 3. Directivas de propagación ratificadas

Se ratifican como directivas internas del parche —no como DEC canónicas autónomas—:

### `TX-01 — CAP-MET`

CAP-MET se formaliza como obligación funcional transversal propia, preservando `DEC-046` / `INV-06-133`:

```text
BE ofrece métodos versionados que el profesional decide ejecutar
≠
BE fija fórmula propia o genera autónomamente requerimiento/objetivo
```

### `TX-02 — CAP-DAT`

CAP-DAT se formaliza como obligación funcional transversal propia.

### `TX-03 — patrón transversal de cálculo`

BE-LEG-05 utilizará un único patrón transversal de cálculo reproducible; `UC-I09` lo especializará para Antropometría. No se crearán casos por fórmula/método.

### `TX-04 — formularios P0`

P0 utilizará plantillas BE versionadas y no un builder libre tipo Google Forms.

### `TX-05 — procedencia admisible`

La procedencia admisible de un input formará parte de la especificación metodológica aplicable.

### `TX-06 — evaluación antropométrica en preparación`

`UC-P19 V04` deberá materializarse técnicamente como:

```text
DRAFT ≠ REGISTERED
```

sin contaminar historia/evolución confirmada.

### `TX-07 — anulación antropométrica`

RF-050 deberá quedar materializado completamente:

```text
anulación ≠ borrado
```

con trazabilidad. BE-LEG-06 lo resolverá dentro de `M-09` mediante el mecanismo permitido por `REG-06-16.4`, sin reabrir `B-06`.

### `TX-08 — arquitectura`

BE-LEG-07 no se reabre: no existe impacto arquitectónico material demostrado.

### `TX-09 — BE-LEG-09`

`BE-LEG-09 v0.15` permanece candidato de cierre **NO CANÓNICO** y no debe canonizarse antes de reconciliar el parche transversal.

---

## 4. Orden autorizado del parche

Dirección autoriza desarrollar, en este orden:

```text
04
→ 05
→ 06
→ 08
→ 09
→ 10
→ 11A
→ 12
```

Condiciones:

1. cada documento se modifica únicamente por impacto demostrado;
2. no se reabre contenido no afectado;
3. cada versión permanece borrador hasta su propia contrarrevisión/aprobación;
4. el paso a un propietario posterior exige estabilidad suficiente del anterior;
5. no se ejecutan operaciones Git;
6. no se implementa código;
7. productor ≠ revisor.

---

## 5. Primera actuación autorizada

Se autoriza producir:

```text
BE-LEG-04 v0.4.2
BORRADOR DE PARCHE TRANSVERSAL
```

limitado a:

- formalizar CAP-MET;
- formalizar CAP-DAT;
- preservar `DEC-046 §4.4/§4.9` e `INV-06-133`;
- actualizar contadores/estado/trazabilidad necesarios;
- no alterar RNF ni RF no afectados.

IDs candidatos ratificados para redacción:

```text
RF-070
RF-071
```

La numeración no implica aprobación del contenido hasta la revisión correspondiente.

---

## 6. Estado resultante

```text
AUDITORÍA TRANSVERSAL v0.2.1:
RATIFICADA COMO MAPA DE CAMBIO

READY_FOR_TRANSVERSE_PATCH:
SÍ

B10-07 v0.7.1:
CANDIDATO DE TRABAJO ESTABLE · NO CANÓNICO

BE-LEG-09 v0.15:
CANDIDATO DE CIERRE · NO CANÓNICO

PRIMER DOCUMENTO:
BE-LEG-04 v0.4.2 — AUTORIZADO A REDACTAR

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
SIN OPERACIONES

CANONIZACIÓN:
NO AUTORIZADA
```

---

## 7. Registro

```text
ACTA-DIR-021
APROBADA POR DIRECCIÓN
FECHA: 2026-09-06

NATURALEZA:
RATIFICACIÓN DE IMPACTO
+ AUTORIZACIÓN DE PARCHE DOCUMENTAL ACOTADO

CAMBIO AUTORIZADO:
04 → 05 → 06 → 08 → 09 → 10 → 11A → 12

07:
SIN REAPERTURA

GIT:
NINGUNO
```
