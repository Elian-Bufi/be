# ACTA-DIR-024 — Aprobación documental de BE-LEG-06 v0.1.1 y autorización de redacción de BE-LEG-08 v0.1.5

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — aprobación documental + autorización de parche siguiente  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Antecedentes

La contrarrevisión externa independiente de `BE-LEG-06 v0.1.1` concluyó:

```text
CONFORME — BE-LEG-06 v0.1.1 APTO PARA DECISIÓN DE DIRECCIÓN

CAP-MET: CONFORME
CAP-DAT: CONFORME
ANT-DRAFT: CONFORME
ANT-VOID: CONFORME
NO REVERSIBILIDAD DE ANULACIÓN:
MÍNIMO NECESARIO POR AUSENCIA DE RF/UC DE REVERSIÓN

HALLAZGOS BLOQUEANTES: 0
AJUSTES OBLIGATORIOS: 0
```

Además verificó:

- baseline 06 v0.1 preservada;
- `T-06-N12` como única raíz de cálculo reproducible;
- `SELF_REPORTED` preservado;
- `EN_PREPARACION ≠ REGISTRADA`;
- `ANULADA ≠ BORRADA`;
- `REG-06-16`, inciso 4, correctamente instanciado en M-09;
- `B-06` no reabierto;
- `07 SIN CAMBIO`.

---

## 2. Aprobación de BE-LEG-06 v0.1.1

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_06_v0.1.1_MAESTRO_MODELO_DE_DOMINIO_PARCHE_TRANSVERSAL_2026-09-07.md` | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |

La aprobación no ejecuta Git ni canonización.

---

## 3. Autorización de BE-LEG-08 v0.1.5

Se autoriza redactar:

```text
BE-LEG-08 v0.1.5
BORRADOR DE PARCHE TRANSVERSAL
```

sobre la baseline v0.1.4:

```text
SHA-256 21d8e639a49b81cf1b679b4146aeaebd3306544c3c4e0c298d47893fbd1f0e6e
```

El parche queda limitado a gobierno y seguridad de:

```text
CAP-MET
CAP-DAT
ANT-DRAFT
ANT-VOID
```

No se reabren Q-003/Q-004/Q-005 ni las decisiones de `ACTA-DIR-019`.

---

## 4. Directivas de seguridad/privacidad

### 4.1. CAP-MET

08 debe fijar:

- el catálogo metodológico genérico no concede acceso a datos personales;
- una ejecución personalizada solo consume inputs que el profesional pueda usar para **esa finalidad**;
- `dato disponible ≠ dato autorizado ≠ dato admisible`;
- un cálculo no puede actuar como canal lateral para inferir la existencia o contenido de un input oculto;
- la respuesta ante input faltante/no autorizado debe ser neutral;
- cálculo, sugerencia y referencia personalizada heredan la sensibilidad de su contexto/inputs;
- la auditoría registra metadatos, nunca valores C4;
- CAP-MET no crea un consentimiento nuevo ni amplía B2.

### 4.2. CAP-DAT

08 debe fijar:

- plantilla genérica y request no sustituyen consentimiento;
- crear una solicitud exige vínculo/Alcance/finalidad/autorización vigentes;
- los campos solicitados deben pertenecer a categorías pertinentes/autorizables;
- ampliar categorías/detalle de una plantilla para vínculos existentes exige la misma disciplina de nueva versión B2 + nueva aceptación que §11-bis.4-ter;
- respuesta `SELF_REPORTED`;
- sensibilidad y retención se determinan por las categorías reales respondidas;
- `PAUSADO`, `FINALIZADO` o B2 revocado cortan lectura profesional;
- un response histórico puede permanecer para el titular según política, sin lectura residual del profesional.

### 4.3. ANT-DRAFT

08 debe fijar:

- draft antropométrico = C4;
- solo puede retomarlo un profesional con autorización actual;
- pausa/finalización/revocación cortan acceso inmediato;
- no se presenta como evaluación registrada;
- su falta de exposición normal al asesorado no limita derechos del titular de §19;
- necesita retención operativa propia y no indefinida;
- al registrarse pasa a gobierno de historia R-07; residuos provisionales no incorporados se procesan según la política del draft.

### 4.4. ANT-VOID

08 debe fijar:

- operación protegida y sensible;
- requiere identidad profesional, capacidad antropométrica, vínculo/Alcance/B2/finalidad vigentes y PDP positivo;
- autoría original nunca se reasigna si otro profesional autorizado realiza la acción;
- asesorado no ejecuta directamente UC-E03, sin perjuicio de sus derechos de rectificación §19;
- ADMIN no anula como operación profesional; break-glass no convierte al ADMIN en profesional;
- anulación es auditable y no es delete;
- el motivo sensible no se copia al log C6;
- tras PAUSADO/FINALIZADO/revocación no existe lectura profesional residual de la medición/anulación;
- la condición `ANULADA` no se revierte en esta versión porque no existe RF/UC que autorice la reversión.

---

## 5. Consentimiento y autoridad

No se crea nueva taxonomía de consentimiento.

Se conserva:

```text
A3
→ tratamiento de datos de salud por BE / historia longitudinal

B2
→ profesional × Alcance × finalidad × categorías pertinentes
```

CAP-MET y CAP-DAT consumen esas relaciones.

```text
método
≠ permiso

solicitud
≠ permiso

templateVersion
≠ permiso

resultado
≠ permiso
```

---

## 6. Fronteras

BE-LEG-08 no debe definir:

- entidades/estados de dominio → 06;
- endpoints/DTO/idempotencia → 09;
- pantallas/copy → 10;
- implementación → fuera del legajo;
- arquitectura/topología → 07.

`07` permanece `SIN CAMBIO`.

---

## 7. Estado

```text
BE-LEG-06 v0.1.1:
APROBADO DOCUMENTALMENTE
NO CANONIZADO POR ESTE ACTO

BE-LEG-08 v0.1.4:
BASELINE

BE-LEG-08 v0.1.5:
AUTORIZADO A REDACTAR
NO APROBADO

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE DE 08 v0.1.5

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
