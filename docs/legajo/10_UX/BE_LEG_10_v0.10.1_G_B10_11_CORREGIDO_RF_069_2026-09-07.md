# BE-LEG-10 v0.10.1-G — B10-11 · Convergencia de prototipos P0/P1 y trazabilidad UX final

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Documento:** BE-LEG-10  
> **Entrega:** `G`  
> **Fecha:** `2026-09-07`  
> **Estado:** `BORRADOR DE ENTREGA G — NO APROBADO · NO CANÓNICO`  
> **Autorización:** `ACTA-DIR-030`  
> **Implementación:** `NO AUTORIZADA`
> **Corrección RF-069:** addendum B10-02 `aa57339c1f7b658c3897a8d94415ef80a70616b19f7d78ded1a34a3929865e79`

# 0. Objetivo

Converger los prototipos/flows definidos por B10-04…B10-10 en una suite P0 trazable, evitando duplicación visual sin perder escenarios.

```text
36 PROTO-10-*
+ 5 FLOW-10-*
= 41 escenarios históricos

→ 14 GPROTO de convergencia
```

Agrupar no significa eliminar ni renumerar.

# 1. Fuentes

| Fuente | SHA-256 |
|---|---|
| B10-04 | `caa46c8be577995ca60440c3bd983e066defb9406b8f74dc77c6f74d5b1e94d1` |
| B10-05 | `f6c4822567245b0ab9f400cb1faf3315aa449f2ae718cb896d2c4cc845557e08` |
| Adenda v0.5 | `0f440d91621658d868d008e99af3f27a6ab68b3602547e69b67ea6773e2bea96` |
| B10-06 | `87562aed5851f6142a5f79c7ba3ef7cb9246cb0e2081ac483701152347b0f096` |
| B10-07 v0.7.1 | `88e6382f045b4d7bcd8fd07fdac5a578eebccd8611ded88d695cb850569d589d` |
| v0.7.2 | `69023cd009a4b80f815253ca092b31f69d2b19e8c19cc7e8f1092760b82badb7` |
| B10-08/09 | `e4271c7f912fa932a728ad5daccb087ed1d4b855dfd6dbd8f540a7d679426a1c` |
| B10-02 | `8ee0d7ce2358916ebd061a8f0fc5faca4b2a0b3f1f4ab667caf8670c4a751091` |
| B10-03 | `b98be72a01b62da077a127ef1865b8890972b23fcfaaba21cdf3caf146bd8a55` |
| B10-10 | `b3ead94307dc7bd424fc48d08d2a5f122a4e6bef554ec014bd2725a9ebf16a84` |
| 04 | `47f0400c1a2843e4e1e0c9bcca8971fb17b17a5217947dad1d234550b685257b` |
| 05 | `d6a787bf0485aad00b412da51717bd12a3e6ba029078412aedf686bc599f2fbf` |
| 06 | `7c1950adafbdd3f3c27a04d225ff2844c4fe170a965104407a92e09ecdd4fea1` |
| 08 | `8aa54a4572bda07a40b897abf0179e05f4539f238bd8c57c508b2b92a61f4691` |
| 09 v0.16.1 | `fe49c24ade553cbd385a1d8380d40f6c51bbdc1609d3d59ae2187053e1ebb3b4` |

# 2. Reglas de convergencia

1. Un GPROTO prueba una decisión o conjunto coherente de decisiones.
2. Los IDs históricos se conservan como aliases trazables.
3. Happy path + estados alternativos + errores viven en el mismo prototipo cuando pertenecen al mismo flujo.
4. Desktop/mobile se separan solo cuando cambia interacción, no por comodidad.
5. B10-10 se verifica en todos los GPROTO.
6. Ningún GPROTO crea contrato.

# 3. Inventario histórico

```text
PROTO-10-*:
36

FLOW-10-*:
5

TOTAL:
41
```

# 4. Suite convergente

| ID | Nombre | Actores | Escenarios cubiertos | Binding principal |
|---|---|---|---|---|
| `GPROTO-10-01` | Identidad, acceso y A3 | Asesorado / Profesional | `PROTO-10-ACC-01`, `PROTO-10-ACC-02`, `PROTO-10-ACC-03`, `PROTO-10-ACC-04`, `PROTO-10-ACC-05`, `PROTO-10-ACC-06` | ACC-01…06 + CON-05…08 + recovery P1 |
| `GPROTO-10-02` | Alta profesional y verificación | Profesional / Administrador | `PROTO-10-PRO-01`, `PROTO-10-PRO-02`, `PROTO-10-PRO-03`, `PROTO-10-ADM-01`, `PROTO-10-ADM-02` | PRO-01…13 |
| `GPROTO-10-03` | Vínculo y consentimiento B2 | Profesional / Asesorado | `FLOW-10-CON-01`, `FLOW-10-CON-02`, `FLOW-10-REL-01`, `FLOW-10-REL-02`, `FLOW-10-REL-03` | REL-01…09 + CON-01…04 |
| `GPROTO-10-04` | Nutrición profesional | Profesional | `PROTO-10-NUT-01`, `PROTO-10-NUT-03`, `PROTO-10-NUT-04`, `PROTO-10-NUT-05` | NUT-* + MTH/CAL + FRM |
| `GPROTO-10-05` | Nutrición asesorado / Hoy | Asesorado | `PROTO-10-NUT-02` | NUT-* propios |
| `GPROTO-10-06` | Entrenamiento profesional | Profesional | `PROTO-10-TRN-01`, `PROTO-10-TRN-04`, `PROTO-10-TRN-05` | TRN-* + MTH/CAL + FRM |
| `GPROTO-10-07` | Entrenamiento asesorado / ejecución | Asesorado | `PROTO-10-TRN-02`, `PROTO-10-TRN-03` | TRN-* ejecución |
| `GPROTO-10-08` | Antropometría profesional integral | Profesional | `PROTO-10-ANT-01`, `PROTO-10-ANT-02`, `PROTO-10-ANT-03`, `PROTO-10-ANT-04`, `PROTO-10-ANT-05`, `PROTO-10-ANT-06` | ANT-01…12 + MTH/CAL + FRM |
| `GPROTO-10-09` | Cartera y Dashboard | Profesional | `PROTO-10-DSH-01`, `PROTO-10-DSH-02` | DSH-01…03 |
| `GPROTO-10-10` | Timeline y coordinación | Profesional | `PROTO-10-DSH-03` | DSH-04 + CRD-01 |
| `GPROTO-10-11` | Progreso propio APK | Asesorado | `PROTO-10-ADV-01` | DSH-05 |
| `GPROTO-10-12` | Análisis entrenamiento | Profesional | `PROTO-10-PRJ-01`, `PROTO-10-PRJ-02`, `PROTO-10-PRJ-03` | PRJ-01…03 |
| `GPROTO-10-13` | Análisis antropométrico | Profesional | `PROTO-10-PRJ-04` | PRJ-01 |
| `GPROTO-10-14` | Análisis nutricional | Profesional | `PROTO-10-PRJ-05` | PRJ-01 |

Control:

```text
GPROTO:
14

ALIASES:
41/41

HUÉRFANOS:
0

DUPLICADOS:
0
```

# 5. GPROTO-10-01 — Identidad, acceso y A3

Debe cubrir:

```text
registro A1/A2
→ cuenta creada
→ login
→ A3 requirement
→ aceptar / ahora no
→ cuenta sin A3
→ historial/revocación/regrant
→ recovery neutral
```

RF:

```text
RF-001
RF-002
RF-005
RF-006
RF-007
RF-069 — P1
```

RF-069 cierre de cuenta queda `VERIFIED` en UX P1 mediante `UC-P27 + API-ACC-P1-03/04`.

Bindings:

```text
ACC-01…06
CON-05…08
ACC-P1-01/02 — recovery P1
ACC-P1-03/04 — account closure P1
```

# 6. GPROTO-10-02 — Profesional/Admin

RF:

```text
RF-008
RF-009
RF-010
RF-011
RF-012
RF-013
RF-014
RF-015
RF-067
```

Binding:

```text
PRO-01…13
```

Prueba:

```text
perfil → alcance/capacidad → evidencia → presentación → submit
→ admin observe/verify/reject
→ subsanación
→ suspend/reinstate
```

No:
- verificación global;
- quinto estado OBSERVADO;
- antropometría como especialidad;
- admin como profesional.

# 7. GPROTO-10-03 — Vínculo/B2

RF:

```text
RF-018…025
```

Bindings:

```text
REL-01…09
CON-01…04
```

Invariante:

```text
solicitud ≠ vínculo ≠ B2 ≠ acceso
```

Debe incluir revocación, pausa, reanudación y finalización.

# 8. GPROTO-10-04/05 — Nutrición

Profesional:

```text
RF-026
RF-027
RF-029
RF-030
RF-031
RF-034
RF-035
RF-070
RF-071
```

Asesorado:

```text
RF-032
RF-033
```

Bindings:

```text
NUT-*
MTH/CAL
FRM
```

Métodos/forms son subflujos, no prototipos por fórmula/template.

# 9. GPROTO-10-06/07 — Entrenamiento

Profesional:

```text
RF-036
RF-039
RF-041
RF-045
RF-046
RF-064
RF-070
RF-071
```

Asesorado:

```text
RF-042
RF-043
```

Invariantes:

```text
planned ≠ executed
draft ≠ record
substitution preserves prescribed/performed
no record ≠ not performed
```

# 10. GPROTO-10-08 — Antropometría

RF:

```text
RF-047
RF-048
RF-049
RF-050
RF-070
RF-071
```

UC explícitos:

```text
UC-P19
UC-P20
UC-E03
UC-I09
UC-I12
UC-P32
UC-P33
```

Bindings:

```text
ANT-01…12
MTH-01…02
CAL-01…04
FRM-01…08
```

Escenarios:

- captura;
- controlled import;
- En preparación;
- register;
- método/run/reference;
- corrección;
- anulación;
- evolución;
- comparabilidad;
- forms.

No persistir import-preparation por suposición.

# 11. GPROTO-10-09/10 — Cartera/Dashboard/Timeline/Coordinación

RF:

```text
RF-052
RF-053
RF-054
RF-055
RF-056
RF-057
```

Bindings:

```text
DSH-01…04
CRD-01
```

Debe falsar:

```text
pendiente ≠ gravedad
dashboard ≠ review
partialView ≠ fuga
occurredAt ≠ recordedAt
timeline ≠ causalidad
coordinar ≠ prescribir
```

# 12. GPROTO-10-11 — Progreso propio

RF:

```text
RF-065
```

Binding:

```text
DSH-05
```

No:

```text
NO_DATA = 0
NOT_COMPARABLE = tendencia
comparación con terceros
```

# 13. GPROTO-10-12/13/14 — Análisis

Taxonomía:

```text
8/8 proyecciones M-11
0 extra
```

Binding:

```text
PRJ-01…03
```

Reglas:

```text
no score
no interpolación
no weighting implícito
threshold profesional
PR observada ≠ estimada
```

# 14. Matriz UX ↔ RF/UC/API

| GPROTO | RF principales | UC principales | API | Estado |
|---|---|---|---|---|
| 01 | RF-001/002/005/006/007 + RF-069 P1 | UC-P25, UC-E09, UC-P27 | ACC-01…06, CON-05…08, ACC-P1-01…04 | VERIFIED |
| 02 | RF-008…015, RF-067 | 05 profesional/admin | PRO-01…13 | VERIFIED |
| 03 | RF-018…025 | 05 relación/B2 | REL-01…09, CON-01…04 | VERIFIED |
| 04 | RF-026/027/029/030/031/034/035/070/071 | nutrición + UC-I13/P32 | NUT + MTH/CAL/FRM | VERIFIED |
| 05 | RF-032/033 | nutrición asesorado | NUT propios | VERIFIED |
| 06 | RF-036/039/041/045/046/064/070/071 | training + UC-I13/P32 | TRN + MTH/CAL/FRM | VERIFIED |
| 07 | RF-042/043 | training asesorado | TRN ejecución | VERIFIED |
| 08 | RF-047…050/070/071 | UC-P19/P20/E03/I09/I12/P32/P33 | ANT + MTH/CAL/FRM | VERIFIED |
| 09 | RF-052/053/055 | dashboard/cartera | DSH-01…03 | VERIFIED |
| 10 | RF-054/056/057 | timeline/coordinación | DSH-04 + CRD-01 | VERIFIED |
| 11 | RF-065 | progreso | DSH-05 | VERIFIED |
| 12 | M-11 training | proyecciones training | PRJ-01…03 | RF fino a cerrar en 12 |
| 13 | RF-049 + M-11 | antro longitudinal | PRJ-01 | VERIFIED |
| 14 | RF-032/033 + M-11 | nutrición comparativa | PRJ-01 | RF fino a cerrar en 12 |

Notas:

- esta matriz no sustituye la matriz exhaustiva de Documento 12;
- `RF-058 TVCC-30` no se fuerza a una pantalla;
- toda atribución RF fina pendiente se cierra en 12, no inventando RF desde 10.

# 15. Estados a probar por GPROTO

Cuando apliquen:

```text
happy
loading
empty
error
no revelable
partialView
version conflict
retry/idempotency uncertainty
responsive
accessibility
```

No aplicable:

```text
N/A — JUSTIFICADO
```

# 16. Checklist B10-10

Cada GPROTO registra:

```text
keyboard/focus
labels
announced error
no color-only
responsive semantics
sensitive copy
privacy/partialView
chart/table equivalent
```

# 17. Evidencia de prototipo esperada

```text
wireflow/prototipo navegable o especificación equivalente
capturas clave
state matrix
API binding
RF/UC coverage
adversarial coverage
B10-10 checklist
open visual decisions
```

No código productivo.

# 18. Escenarios adversariales

`ADV-10-G-01` — alias huérfano.  
`ADV-10-G-02` — agrupación borra decisión.  
`ADV-10-G-03` — prototipo crea contrato.  
`ADV-10-G-04` — estado de dominio inventado.  
`ADV-10-G-05` — accesibilidad postergada.  
`ADV-10-G-06` — responsive cambia semántica.  
`ADV-10-G-07` — RF visual P0 huérfano.  
`ADV-10-G-08` — TVCC-30 forzado a pantalla.  
`ADV-10-G-09` — método/formulario aislado artificialmente.  
`ADV-10-G-10` — se agrega 9.ª proyección.

# 19. DoD

No cerrar si:

- 41/41 no están mapeados;
- hay alias duplicado;
- falta contrato;
- falta checklist B10-10;
- se colapsa A1/A2/A3;
- ADMIN se vuelve profesional;
- vínculo/B2/acceso se mezclan;
- planned/executed se mezclan;
- correction/annulment se mezclan;
- Dashboard exige las 8 PRJ;
- se inventa UI para TVCC-30;
- se declara runtime.

# 20. Estado

```text
B10-11:
BORRADOR

41/41:
MAPEADOS

GPROTO:
14

IMPLEMENTACIÓN:
NO
```
