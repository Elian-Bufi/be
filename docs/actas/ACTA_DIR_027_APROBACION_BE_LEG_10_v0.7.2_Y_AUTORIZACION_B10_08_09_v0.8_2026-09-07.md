# ACTA-DIR-027 — Aprobación de BE-LEG-10 v0.7.2 y autorización de B10-08/B10-09 v0.8

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — cierre de reconciliación UX + autorización de siguiente bloque  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Contrarrevisión de v0.7.2

La contrarrevisión externa independiente concluyó:

```text
CONFORME — BE-LEG-10 v0.7.2 APTO PARA DECISIÓN DE DIRECCIÓN

CAP-MET: CONFORME
CAP-DAT: CONFORME
ANT-DRAFT: CONFORME
ANT-VOID: CONFORME
IMPORTACIÓN: CORRECTAMENTE DIFERIDA
FRONTERAS: SIN INVASIÓN
07: SIN CAMBIO
AJUSTES OBLIGATORIOS: 0
```

Precisión de Dirección sobre el informe:

```text
el informe menciona ADV-10-TX-01…08
pero v0.7.2 contiene ADV-10-TX-01…09
```

`ADV-10-TX-09 — Import preparation persistente inventada` existe y fue cubierto sustantivamente por la revisión de importación. Se clasifica como **error de recuento del informe**, no defecto de v0.7.2.

---

## 2. Aprobación de BE-LEG-10 v0.7.2

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_10_v0.7.2_RECONCILIACION_TRANSVERSAL_UX_POST_PROPAGACION_2026-09-07.md` | `69023cd009a4b80f815253ca092b31f69d2b19e8c19cc7e8f1092760b82badb7` |

Queda cerrado el tramo transversal:

```text
04 ✅
05 ✅
06 ✅
08 ✅
09 ✅
10 v0.7.2 ✅
07 = SIN CAMBIO
```

La aprobación es documental y no ejecuta Git ni canonización.

---

## 3. Secuencia posterior

La conclusión del revisor sobre 11A/12 se interpreta como referencia al cierre futuro del parche transversal, **no como alteración de la secuencia UX**.

Dirección preserva:

```text
B10-07 + reconciliación
→ B10-08 — Cartera, dashboard, timeline y coordinación
→ B10-09 — Proyecciones y visualización
→ B10-02/B10-03
→ B10-10
→ B10-11
→ 11A / 12 según gate documental
```

11A puede definir estrategia/criterios antes de implementación y completar evidencia contra sistema ejecutable posteriormente. 12 puede consolidar trazabilidad documental antes de ejecución, manteniendo evidencia de runtime como pendiente cuando corresponda.

---

## 4. Autorización de BE-LEG-10 v0.8

Se autoriza redactar:

```text
BE-LEG-10 v0.8
B10-08 + B10-09
CARTERA · DASHBOARD · TIMELINE · COORDINACIÓN · PROYECCIONES
UX P0 TO-BE
```

Debe consumir exclusivamente:

- RF-052…058 y RF-065;
- UC-P23 / UC-P24 / UC-P31 / UC-E07;
- M-11 / REG-06-173…185 / INV-06-183…195;
- gobierno de 08;
- `API-DSH-01…05`;
- `API-PRJ-01…03`;
- `API-CRD-01`.

No se autoriza:

- score global;
- ranking clínico;
- nueva proyección fuera de las 8 de M-11;
- nuevo endpoint;
- nuevo modelo de dominio;
- nuevo estado;
- B10-02/B10-03;
- implementación;
- Git.

---

## 5. Decisiones de diseño a resolver en v0.8

### B10-08
- arquitectura operativa de Cartera;
- revisión pendiente;
- dashboard full/partial;
- timeline;
- coordinación;
- progreso propio en APK.

### B10-09
- visualización de las 8 proyecciones;
- estados `AVAILABLE / NO_DATA / NOT_COMPARABLE / INSUFFICIENT_INFORMATION`;
- `partialView`;
- configuración profesional del umbral de volumen efectivo;
- separación resumen vs proyección profunda;
- accesibilidad visual sin score ni inferencia.

Q10-03 se resolverá como decisión UX de **jerarquía de información**, no como cambio de dominio/contrato.

---

## 6. Estado

```text
BE-LEG-10 v0.7.2:
APROBADO DOCUMENTALMENTE

BE-LEG-10 v0.8:
AUTORIZADO A REDACTAR
NO APROBADO
NO CANÓNICO

B10-08/B10-09:
EN REDACCIÓN

07:
SIN CAMBIO

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
