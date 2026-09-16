# ACTA-DIR-022 — Aprobación documental de BE-LEG-04 v0.4.2.1 y autorización de redacción de BE-LEG-05 v0.15

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — aprobación documental + autorización de parche siguiente  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Antecedentes

`ACTA-DIR-021` ratificó la Auditoría de Impacto Transversal v0.2.1 y autorizó el parche documental en orden:

```text
04 → 05 → 06 → 08 → 09 → 10 → 11A → 12
```

BE-LEG-04 fue redactado como v0.4.2, contrarrevisado externamente y corregido únicamente por M1/M2 en v0.4.2.1.

El contraste corto independiente sobre v0.4.2.1 concluyó:

```text
CONFORME — BE-LEG-04 v0.4.2.1
APTO PARA DECISIÓN DE DIRECCIÓN

AJUSTE RESIDUAL: NINGUNO
DAÑO COLATERAL: NINGUNO
```

---

## 2. Aprobación de BE-LEG-04 v0.4.2.1

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_04_v0.4.2.1_REQUERIMIENTOS_RF_RNF_PARCHE_TRANSVERSAL_POST_CONTRARREVISION_2026-09-07.md` | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` |

Resultado aprobado:

```text
69 RF
38 RNF

RF:
59 P0 / 8 P1 / 2 P2

RNF:
31 P0 / 7 P1

TOTAL:
90 P0 / 15 P1 / 2 P2
```

Se aprueban específicamente:

- `RF-070 — Utilizar métodos profesionales de cálculo reproducible`;
- `RF-071 — Solicitar y completar información profesional pertinente`.

Se preservan `DEC-046 §4.4/§4.9` e `INV-06-133`:

```text
BE ofrece métodos versionados elegidos por el profesional
≠
BE impone fórmula propia o genera autónomamente requerimiento/objetivo/prescripción
```

La aprobación no autoriza Git ni canonización. Hasta un acto posterior, la baseline Git anterior permanece como antecedente canónico de repositorio.

---

## 3. Autorización de BE-LEG-05 v0.15

Se autoriza redactar:

```text
BE-LEG-05 v0.15
BORRADOR DE PARCHE TRANSVERSAL
```

sobre la baseline aprobada/canonizada `BE-LEG-05 v0.14`, SHA-256:

```text
1cf0c3cf46cd8a83ca57103da58887304be5435d344a40ee0ce3f24babca0e2d
```

Alcance autorizado y únicamente autorizado:

### 3.1. CAP-MET

- crear `UC-I13` como patrón transversal único de cálculo profesional reproducible;
- hacer que `UC-P09` y `UC-P14` puedan invocarlo cuando corresponda;
- convertir `UC-I09` en especialización antropométrica de `UC-I13`, sin duplicar la definición común;
- preservar `DEC-046` / `INV-06-133`;
- no crear casos por fórmula o método.

### 3.2. CAP-DAT

- crear `UC-P32 — Solicitar información estructurada pertinente al asesorado`;
- crear `UC-P33 — Completar información solicitada`;
- declarar relación explícita `UC-P33 ↔ UC-P25`;
- usar plantillas BE versionadas en P0, sin builder libre;
- respuesta `SELF_REPORTED ≠ medición ≠ diagnóstico ≠ consentimiento`.

### 3.3. ANT-DRAFT

- preservar sin cambio normativo `UC-P19 V04 — Evaluación retomada`;
- no crear RF/UC nuevo.

### 3.4. ANT-VOID

- ampliar `UC-E03` para cubrir la alternativa canónica `corregir o anular` de `RF-050`;
- `anulación ≠ borrado`;
- intentar resolverla dentro de `UC-E03`, sin nuevo UC;
- conservar original, actor, fecha, motivo e historia;
- derivar la semántica técnica a `06 / M-09 / REG-06-16.4`;
- no reabrir `B-06`.

---

## 4. Conteo candidato esperado para 05

Si el parche se materializa sin proliferación:

```text
BASELINE v0.14:
53 UC
= 31 P + 12 I + 9 E + 1 S

CANDIDATO v0.15:
56 UC
= 33 P + 13 I + 9 E + 1 S

TR:
5 — SIN CAMBIO
```

La numeración candidata:

```text
UC-P32
UC-P33
UC-I13
```

No se autoriza crear `UC-I14` ni otra extensión salvo hallazgo demostrado posterior.

---

## 5. Restricciones

- ningún caso no afectado se reescribe por estilo;
- no se fijan entidades/estados técnicos;
- no se fijan endpoints/DTO/códigos;
- no se fija UI concreta;
- no se modifica 07;
- no se canoniza 09 v0.15;
- no implementación;
- no Git;
- productor ≠ revisor.

---

## 6. Estado

```text
BE-LEG-04 v0.4.2.1:
APROBADO DOCUMENTALMENTE
NO CANONIZADO POR ESTE ACTO

BE-LEG-05 v0.14:
BASELINE APROBADA/CANONIZADA

BE-LEG-05 v0.15:
AUTORIZADO A REDACTAR
NO APROBADO

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE DE 05 v0.15

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
