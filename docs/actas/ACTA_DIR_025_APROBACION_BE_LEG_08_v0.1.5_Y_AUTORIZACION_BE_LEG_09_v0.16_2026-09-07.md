# ACTA-DIR-025 — Aprobación documental de BE-LEG-08 v0.1.5 y autorización de redacción de BE-LEG-09 v0.16

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Tipo:** acta de dirección — aprobación documental + autorización de parche contractual  
> **Fecha:** `2026-09-07`  
> **Responsable de dirección:** Elian Gastón Bufi  
> **Implementación:** `NO AUTORIZADA`  
> **Git:** `SIN OPERACIONES`  
> **Canonización:** `NO AUTORIZADA`

---

## 1. Antecedente

La contrarrevisión externa independiente de `BE-LEG-08 v0.1.5` concluyó:

```text
CONFORME — BE-LEG-08 v0.1.5 APTO PARA DECISIÓN DE DIRECCIÓN

CAP-MET:
ANTI-INFERENCIA CORRECTA

CAP-DAT:
SOLICITUD ≠ PERMISO
PDP REEVALUADO EN TRES MOMENTOS

ANT-DRAFT:
DERECHOS DEL TITULAR PRESERVADOS
R-18 NECESARIA

ANT-VOID:
ACTOR DISTINTO DEL AUTOR COMPATIBLE CON UC-E03 Y LEAST PRIVILEGE

HALLAZGOS BLOQUEANTES: 0
AJUSTES OBLIGATORIOS: 0
```

La revisión verificó asimismo:

- Q-003/Q-004/Q-005 intactas;
- CAND-08-A…J intactas;
- VJR/VD intactas;
- ninguna clase C nueva;
- `R-18` como única retención nueva;
- `R-08-14…18`;
- Ready-for-Real-Data 25…28 condicional;
- `07 SIN CAMBIO`.

---

## 2. Aprobación de BE-LEG-08 v0.1.5

Dirección **APRUEBA DOCUMENTALMENTE**:

| Artefacto | SHA-256 |
|---|---|
| `BE_LEG_08_v0.1.5_SEGURIDAD_PRIVACIDAD_GOBERNANZA_PARCHE_TRANSVERSAL_2026-09-07.md` | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` |

La aprobación no ejecuta Git ni canonización.

---

## 3. Estado de BE-LEG-09 antes del parche

El objeto contractual previo exacto es:

| Artefacto | SHA-256 | Estado |
|---|---|---|
| `BE_LEG_09_v0.15_CONSOLIDADO_CANDIDATO_CIERRE_2026-08-31.md` | `5cf63f29b814dfbe1254f52d3c9f16619ee38794f604ed921052022940fbe9e6` | candidato de cierre · NO canónico |

Su inventario P0 reproducible permanece:

```text
98 API-09 IDs explícitos
```

`v0.15` no se canoniza: queda **SUPERADO COMO CANDIDATO DE TRABAJO** por la nueva v0.16 una vez redactada.

---

## 4. Autorización de BE-LEG-09 v0.16

Dirección autoriza redactar:

```text
BE-LEG-09 v0.16
BORRADOR DE RECONCILIACIÓN CONTRACTUAL TRANSVERSAL
```

sin reabrir contratos no afectados.

### 4.1. CAP-MET

Materializar contratos para:

- discovery de métodos profesionales;
- detalle de método/versión/requisitos;
- ejecución reproducible bajo PDP actual;
- listado/detalle de ejecuciones;
- adopción de referencia profesional;
- neutralidad observable ante input inexistente/no autorizado/no pertinente;
- ninguna escritura autónoma sobre objetivo/prescripción/plan.

### 4.2. CAP-DAT

Materializar:

- discovery/detalle de plantillas BE versionadas;
- profesional crea/lista/consulta solicitudes;
- asesorado lista/consulta solicitudes propias;
- asesorado envía respuesta `SELF_REPORTED`;
- rectificación como sucesora, sin overwrite;
- proyección por actor y PDP actual;
- request/response no generan acceso residual.

### 4.3. ANT-DRAFT

Materializar:

- crear;
- listar;
- consultar;
- guardar con concurrencia;
- registrar/finalizar;

sin mezclar `EN_PREPARACION` con los listados de evaluaciones `REGISTRADA`.

`API-ANT-02` se preserva como creación directa/atómica de una evaluación registrada cuando no se requiere reanudación.

### 4.4. ANT-VOID

Materializar una operación explícita de anulación de medición:

- separada de `API-ANT-05` corrección;
- actual PDP;
- `Idempotency-Key`;
- concurrencia;
- original preservado;
- sin delete;
- sin reversión;
- auditoría requerida;
- dependencia/recalculo conforme 06.

---

## 5. Estrategia de IDs autorizada

Familias nuevas:

```text
MTH — catálogo/versiones de métodos
CAL — ejecuciones/referencia profesional
FRM — plantillas/solicitudes/respuestas
```

Extensión existente:

```text
ANT — API-ANT-07…12
```

Objetivo de mínimo contractual:

```text
MTH: 2 operaciones
CAL: 4 operaciones
FRM: 8 operaciones
ANT nuevas: 6 operaciones

TOTAL NUEVO P0:
20

BASELINE:
98

CANDIDATO v0.16:
118 API-09 P0
```

No agregar endpoints por pantalla ni por método/fórmula.

---

## 6. Restricciones

- 09 no redefine dominio de 06;
- 09 no redefine política de 08;
- 09 no fija UI de 10;
- `professionalId` enviado por cliente nunca es autoridad;
- `404 RESOURCE_NOT_FOUND` preserva anti-enumeración para recurso inexistente/no revelable;
- errores de input insuficiente no distinguen dato ausente de dato existente pero oculto;
- no modificar `API-ANT-05` para hacer delete/anulación;
- no abrir un endpoint de “desanulación”;
- no implementar;
- no Git;
- productor ≠ revisor.

---

## 7. Estado

```text
BE-LEG-08 v0.1.5:
APROBADO DOCUMENTALMENTE
NO CANONIZADO POR ESTE ACTO

BE-LEG-09 v0.15:
CANDIDATO PREVIO
NO CANÓNICO
SUPERADO COMO OBJETO DE TRABAJO AL REDACTAR v0.16

BE-LEG-09 v0.16:
AUTORIZADO A REDACTAR
NO APROBADO

07:
SIN CAMBIO

SIGUIENTE:
CONTRARREVISIÓN INDEPENDIENTE DE 09 v0.16

IMPLEMENTACIÓN:
NO

GIT:
NINGUNO
```
