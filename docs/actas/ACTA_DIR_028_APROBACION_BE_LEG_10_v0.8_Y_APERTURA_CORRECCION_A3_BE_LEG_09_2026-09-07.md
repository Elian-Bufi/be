# ACTA-DIR-028 — Aprobación de BE-LEG-10 v0.8 y apertura de corrección contractual A3 en BE-LEG-09

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — cierre UX + impacto contractual demostrado  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Aprobación de BE-LEG-10 v0.8

La contrarrevisión externa independiente concluyó:

```text
CONFORME — BE-LEG-10 v0.8 APTO PARA DECISIÓN DE DIRECCIÓN

8/8 PROYECCIONES
0 EXTRA
17 CANDIDATAS
8 ADV-DSH
11 ADV-PRJ
Q10-03:
CONFORME COMO DECISIÓN UX

HALLAZGOS BLOQUEANTES:
0

AJUSTES OBLIGATORIOS:
0
```

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_10_v0.8_B10_08_09_CARTERA_DASHBOARD_TIMELINE_COORDINACION_PROYECCIONES_UX_P0_TOBE_2026-09-07.md` | `e4271c7f912fa932a728ad5daccb087ed1d4b855dfd6dbd8f540a7d679426a1c` |

Quedan aprobados B10-08/B10-09 como diseño UX P0 de trabajo.

---

## 2. Hallazgo demostrado al abrir B10-02

La DoR de `B10-02 — Acceso, onboarding y cuenta` exige reconciliar:

```text
08 §12 / §13 / §49
+
09
+
10 v0.2 / v0.3
```

Se verificó:

### 08 aprobado

El onboarding debe mantener actos separados:

```text
A1 — Términos
A2 — Información de privacidad
A3 — DATOS_SALUD_BE
```

A3 es consentimiento expreso para tratamiento de datos de salud por BE y para la historia longitudinal del titular. Es revocable y su revocación corta prospectivamente operaciones sensibles.

### 09 v0.16 aprobado

Materializa:

```text
ACC-01
→ A1 + A2 en registro

CON-01…04
→ B2 profesional × Alcance × finalidad × categorías pertinentes
```

Pero **no contiene ninguna operación contractual para**:

```text
consultar requisito/version A3
otorgar A3
consultar A3 propio
revocar A3
```

Tampoco existe otro contrato en v0.16 o sus auxiliares que materialice `DATOS_SALUD_BE`.

---

## 3. Clasificación

```text
H-09-10-A3-01

TIPO:
FALTA CONTRACTUAL DEMOSTRADA

CRITICIDAD:
MAYOR PARA CIERRE DE B10-02

REDISEÑO:
NO

UPSTREAM AFECTADO:
08 → 09 → 10

04/05/06:
SIN CAMBIO DEMOSTRADO

07:
SIN CAMBIO
```

Fundamento:

- 08 es propietario de la política A3;
- 09 debe materializar operaciones observables necesarias para esa política;
- 10 no puede inventar otorgamiento/revocación A3 sin contrato.

---

## 4. Autorización de corrección BE-LEG-09 v0.16.1

Se autoriza una corrección **exclusivamente aditiva y acotada**:

```text
BE-LEG-09 v0.16.1
CORRECCIÓN CONTRACTUAL A3
```

Familia existente:

```text
CON
```

Operaciones nuevas mínimas:

```text
API-CON-05 — consultar requisito/version A3 actual
API-CON-06 — otorgar/reotorgar A3
API-CON-07 — consultar historial A3 propio
API-CON-08 — revocar A3
```

Conteo:

```text
v0.16:
118 API P0

+ A3:
4

v0.16.1:
122 API P0
```

No se crea:

- nueva familia;
- nuevo consentimiento;
- nuevo estado de dominio;
- nuevo RF/UC;
- endpoint por pantalla;
- transferencia internacional automática;
- mecanismo de retención nuevo.

---

## 5. Frontera UX

Hasta que v0.16.1 sea contrarrevisada y aprobada:

```text
B10-02/B10-03
→ PUEDE ANALIZARSE
→ NO DEBE CERRARSE COMO v0.9
```

El próximo gate inmediato es la contrarrevisión de 09 v0.16.1.

---

## 6. Estado

```text
BE-LEG-10 v0.8:
APROBADO DOCUMENTALMENTE

BE-LEG-09 v0.16:
BASELINE CONTRACTUAL APROBADA

BE-LEG-09 v0.16.1:
AUTORIZADO A REDACTAR
NO APROBADO
NO CANÓNICO

B10-02/B10-03:
APERTURA INICIADA
CIERRE BLOQUEADO POR H-09-10-A3-01

07:
SIN CAMBIO

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
