# ACTA-DIR-029 — Aprobación de BE-LEG-09 v0.16.1 y autorización de Entrega F de BE-LEG-10

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — aprobación contractual + habilitación de entrega agrupada UX  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Régimen:** entregas agrupadas con aprobación condicionada, por extensión de `ACTA-DIR-011 §5` ordenada por Dirección  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Antecedentes

La contrarrevisión independiente de `BE-LEG-09 v0.16.1` concluyó:

```text
CONFORME — BE-LEG-09 v0.16.1 APTO PARA DECISIÓN DE DIRECCIÓN

GAP A3:
CONFIRMADO

CON-05…08:
CONFORMES

API P0:
122

CAND-09:
63

HALLAZGOS BLOQUEANTES:
0

AJUSTES OBLIGATORIOS:
0
```

Objeto contractual:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_09_v0.16.1_CORRECCION_CONTRACTUAL_A3_2026-09-07.md` | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |

Dirección **APRUEBA DOCUMENTALMENTE** BE-LEG-09 v0.16.1.

La aprobación no ejecuta Git ni canonización.

---

## 2. Plan refinado Fable

Dirección declara vigentes §§1–26 de:

```text
BE_PLAN_MAESTRO_REFINADO_FABLE_PARA_CLAUDE_CODE_v1.md
SHA-256 informado por Dirección:
81ffe84ffa06ae11ae30c1fc387c432529c30014c7e79a0ab30706de41cd446e
```

Precisión:

```text
WP-000
→ intake solo lectura
→ podrá autorizarse por separado

WP-001…WP-006
→ NO reciben autorización anticipada
→ esperan acta de implementación funcional
```

**Custodia:** el archivo refinado no está materializado en el runtime de esta redacción. Su SHA es `INFORMADO POR DIRECCIÓN — NO RECALCULADO`. Las instrucciones operativas aplicadas en esta acta son las transcritas directamente por Dirección en la sesión actual.

---

## 3. Régimen final de cierre

Se adopta:

```text
ENTREGA F
B10-02 + B10-03 + B10-10

ENTREGA G
B10-11 + 11A esqueleto

ENTREGA H
11A baseline + 12 baseline

ENTREGA I
01 definitivo + paquete de gate
```

Una contrarrevisión por entrega y un acta por entrega.

Los siete supuestos bloqueantes de `ACTA-DIR-011 §5.2` continúan vigentes por orden de Dirección. Esta acta no los sustituye ni los reinterpreta.

---

## 4. Habilitación de Entrega F

Se autoriza redactar conjuntamente:

```text
B10-02 — Acceso, onboarding y cuenta
B10-03 — Profesional, verificación y administración
B10-10 — Accesibilidad, copy, responsive y coherencia transversal
```

Versión de trabajo:

```text
BE-LEG-10 v0.9 — ENTREGA F
```

### 4.1. Condiciones comunes

Cada bloque debe contener:

1. objetivo y alcance;
2. invariantes UX propios;
3. flujos;
4. matriz de estados/proyecciones UX;
5. binding explícito contra inventario 09 v0.16.1;
6. copy crítico;
7. empty/error/partialView cuando corresponda;
8. escenarios adversariales con ID;
9. candidatas y estado;
10. prototipos requeridos;
11. deudas downstream;
12. autoverificación falsable.

Regla dura:

```text
CERO endpoint nuevo
CERO entidad nueva
CERO estado de dominio nuevo
CERO política nueva
CERO fórmula nueva
```

Si una necesidad carece de contrato:

```text
impacto demostrado
→ elevar
→ no inventar desde 10
```

---

## 5. Condición especial B10-02 — A1/A2/A3

Se preserva `08 §12.2`:

```text
un solo flujo visual puede recolectar A1 + A2 + A3
pero:
A1 ≠ A2 ≠ A3
y cada acto conserva evidencia propia
```

La implementación contractual impone una frontera UX adicional:

```text
ACC-01
→ registra identidad + A1 + A2
→ NO crea sesión

ACC-02
→ autentica

CON-05/06
→ requirement + grant A3
→ exige SESSION
```

Por tanto la experiencia será una única **jornada de onboarding**, pero no una única transacción.

Prohibido:

```text
auto-login inventado
A3 preaceptado
A3 implícito al registrarse
checkbox global único
```

---

## 6. Condición especial B10-03

Debe preservar:

```text
PENDIENTE
VERIFICADO
RECHAZADO
SUSPENDIDO
```

por Alcance/capacidad según 06.

Observación/subsanación:

```text
≠ quinto estado
```

Antropometría:

```text
capacidad transversal
≠ tercera especialidad
```

ADMIN/break-glass:

```text
≠ actor profesional
```

---

## 7. Condición especial B10-10

B10-10 consolida reglas, no inventa nuevos recorridos de negocio.

Debe unificar:

- accesibilidad;
- copy;
- responsive;
- estados visuales transversales;
- protección anti-inferencia;
- no dark patterns;
- equivalentes textuales/tabulares de visualizaciones.

---

## 8. Paralelización documental

Se permite iniciar estructuras de `11A` y `12` en paralelo a Entrega F, pero:

```text
fila dependiente de UX no cerrada
→ NOT VERIFIED
```

No baselinear 11A/12 antes de su entrega propia.

---

## 9. Estado resultante

```text
09 v0.16.1:
APROBADO DOCUMENTALMENTE

10 v0.8:
APROBADO DOCUMENTALMENTE

ENTREGA F:
AUTORIZADA
EN PRODUCCIÓN DOCUMENTAL

ENTREGA G/H/I:
PLANIFICADAS
NO AUTORIZADAS A CIERRE ANTICIPADO

IMPLEMENTACIÓN:
NO AUTORIZADA

GIT:
NINGUNO

CANONIZACIÓN:
NO
```
