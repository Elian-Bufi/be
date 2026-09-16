# ACTA-DIR-032 — Aprobación de Entrega G corregida y autorización de Entrega H

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha de emisión:** `2026-09-09`  
> **Revisión externa consumida:** `2026-09-07`  
> **Tipo:** acta de Dirección — cierre de convergencia UX/11A-esqueleto + apertura de baseline documental  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

## 1. Objeto

Dirección consume:

1. contrarrevisión completa de Entrega G;
2. `ACTA-DIR-031`;
3. contraste corto de la corrección `RF-069`.

Veredicto final recibido:

```text
CONFORME — CORRECCIÓN RF-069 APTA
ENTREGA G PUEDE PASAR A DIRECCIÓN

36 PROTO
5 FLOW
41 aliases
14 GPROTO
0 huérfanos
0 duplicados

11A:
5 tests RF-069 agregados
0 PASS reales

Fronteras:
cero cambio upstream
```

## 2. Artefactos finales de G

| Artefacto | SHA-256 |
|---|---|
| Addendum B10-02 RF-069 | `aa57339c1f7b658c3897a8d94415ef80a70616b19f7d78ded1a34a3929865e79` |
| B10-11 v0.10.1-G | `205a31709a470156f18952a6d59197ed6ceb757961a70ad1a33e7d9614b6ce6c` |
| 11A v0.1.1-G esqueleto | `e872895f00e707457b8996a9cc336c1e19c226e337875117e57233fb312bcda9` |

Dirección **APRUEBA DOCUMENTALMENTE ENTREGA G**.

B10-11 queda cerrado como convergencia UX de Documento 10.

El esqueleto 11A queda aprobado **solo como insumo de producción de H**, no como baseline de pruebas.

## 3. Regla operativa incorporada

Cuando un RF parezca carecer de contrato:

```text
barrido P0
+
auxiliares P1/P2
+
matrices de diferimiento
```

antes de declarar deuda contractual.

El falso negativo RF-069 queda registrado como precedente de control.

## 4. Entrega H autorizada

Se autoriza producir conjuntamente:

```text
BE-LEG-11A
→ CANDIDATO A BASELINE
→ plan y estrategia de pruebas completos

BE-LEG-12
→ CANDIDATO A BASELINE
→ trazabilidad y control de calidad completos
→ especificación analítica canónica candidata TVCC-30
```

Una sola contrarrevisión y un solo acto posterior de Dirección.

## 5. Cobertura mínima exigida en H

### 11A

Debe cubrir:

```text
69 RF activos
38 RNF
56 UC
122 API P0
P1/P2 relevantes por separado
invariantes críticos 06
política crítica 08
41 escenarios UX / 14 GPROTO
runtime y APK como plan, no evidencia
```

### 12

Debe distinguir:

```text
SPECIFIED
≠ IMPLEMENTED
≠ TESTED
```

y mantener estados separados de:

- trazabilidad documental;
- evidencia runtime;
- ejecución de pruebas.

## 6. IDs retirados

No se reintroducen:

```text
RF-016
RF-063
```

Pueden aparecer únicamente como historia documental.

## 7. TVCC-30

Documento 12 está autorizado a cerrar como **decisión analítica candidata**:

- fórmula;
- elegibilidad fina;
- universo/denominador/numerador;
- ventana;
- zona;
- versionado;
- exclusiones;
- comportamiento ante evidencia insuficiente;
- reproducibilidad.

Debe consumir 04/05/06 y no presentarse como retención, adherencia, resultado corporal, resultado de salud ni score clínico.

## 8. Estado

```text
ENTREGA G:
APROBADA DOCUMENTALMENTE

DOCUMENTO 10:
CIERRE FUNCIONAL/UX COMPLETO PARA EL GATE H

ENTREGA H:
AUTORIZADA
NO APROBADA

11B:
NO PRODUCIDO

IMPLEMENTACIÓN:
NO

GIT:
NO
```
