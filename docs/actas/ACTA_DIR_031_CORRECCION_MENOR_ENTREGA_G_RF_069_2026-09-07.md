# ACTA-DIR-031 — Corrección menor de Entrega G por trazabilidad RF-069

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha:** `2026-09-07`  
> **Tipo:** devolución técnica mínima antes de aprobar Entrega G  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

## 1. Hallazgo posterior a la contrarrevisión

Durante la preparación de Entrega H se verificó contra las fuentes contractuales P1 que:

```text
RF-069 — Solicitar el cierre de la propia cuenta
→ P1
→ UC-P27
→ API-ACC-P1-03
→ API-ACC-P1-04
```

Fuente contractual auxiliar:

`BE_LEG_09_v0.12_INTEGRACIONES_P0_Y_SOPORTE_P1_P2_2026-08-31.md`  
SHA-256 `8a3db34e8c4991d427f089c6424da13daa35d883c7f06171e78daac02441f8c5`

Operaciones:

```text
API-ACC-P1-03 — Solicitar cierre
POST /api/v1/me/account-closure-requests

API-ACC-P1-04 — Estado del cierre
GET /api/v1/me/account-closure-requests/current
```

El consolidado 09 v0.16.1 ya clasifica RF-069 como P1 cubierto contractualmente.

## 2. Clasificación

```text
H-10-G-RF069-01

TIPO:
ERROR DE TRAZABILIDAD DOWNSTREAM

SEVERIDAD:
MENOR ANTES DE BASELINE H

UPSTREAM:
SIN DEFECTO

04/05/06/08/09:
SIN CAMBIO

07:
SIN CAMBIO
```

No es falta contractual.

## 3. Efecto

Se corrigen únicamente:

1. la cobertura UX de cuenta;
2. el inventario de escenarios/prototipos de B10-11;
3. los casos semilla 11A relacionados con cierre de cuenta.

No se modifica:

```text
122 API P0
```

porque `ACC-P1-03/04` son P1.

## 4. Decisión

Entrega G **no se aprueba todavía**.

Se autoriza un contraste corto sobre la corrección:

```text
B10-02 addendum RF-069
B10-11 v0.10.1-G
11A v0.1.1-G
```

Si el contraste vuelve `CONFORME`, Dirección podrá aprobar G sin repetir una contrarrevisión completa.

## 5. Estado

```text
ENTREGA G:
CONFORME SUSTANTIVAMENTE
PENDIENTE DE CORRECCIÓN MENOR RF-069

ENTREGA H:
NO INICIADA

IMPLEMENTACIÓN:
NO
```
