# ACTA-DIR-034 v1.0 · Gate de Implementación Funcional de BE — FIRMADA

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha de firma:** `2026-09-18`  
> **Estado:** `FIRMADA · AUTORIZA IMPLEMENTACIÓN EN EL ALCANCE DEL §3`  
> **Origen:** completa el `BORRADOR ACTA-DIR-034 v0.1.1` (`actas/BORRADOR_ACTA_DIR_034_v0.1.1_GATE_IMPLEMENTACION_NO_FIRMADA_2026-09-09.md`, SHA-256 `2cbf60700fbfd767390f7e42e769de12f189ed084830796638b803f2cc52ea0f`, verificado byte a byte por ACTA-DIR-033.2). El borrador se conserva sin cambios porque integra `MANIFEST.sha256`; **esta acta lo reemplaza como documento vigente**.  
> **Regla del borrador:** cualquier campo `TO VERIFY / TO DECIDE` bloquea la firma. **Esta versión no deja ninguno abierto**: los que dependían de un hecho futuro quedan resueltos como plan con fecha o condición explícita (§3, §12).

---

# 1. Precondiciones documentales

```text
BE-LEG-01:
APROBADO — ACTA-DIR-033.2 (v1.0-I, SHA-256 3752ae0f…; coincide con docs/legajo)

BE-LEG-11A:
BASELINEADO — ACTA-DIR-033 (v1.0-H, SHA-256 d4486ba2…; coincide con docs/legajo)

BE-LEG-12:
BASELINEADO — ACTA-DIR-033 (v1.0-H, SHA-256 5202c1f1…; coincide con docs/legajo)

Documento 10:
CERRADO — ACTA-DIR-033.2 §5 (BASELINE UX)

11B:
ACTIVO DESDE ESTA FIRMA (§9)
```

---

# 2. Custodia verificada (2026-09-18, 21:45 UTC)

Valores resueltos sobre el repositorio real, no copiados de memoria ni de documentación histórica:

```text
REPOSITORY:
Elian-Bufi/be · https://github.com/Elian-Bufi/be · PÚBLICO

LOCAL/REMOTE IDENTITY:
clon de trabajo del ejecutor técnico → origin https://github.com/Elian-Bufi/be.git
autor de commits: 190213429+Elian-Bufi@users.noreply.github.com

BASE BRANCH:
main (rama por defecto)

BASE COMMIT SHA:
e090253724b8304d3512038b3600b33cbbbb97c7

WORKING TREE:
limpio (0 cambios)

REMOTE STATUS:
main local = origin/main (0 adelante / 0 atrás) · CI de e090253 en verde

SECRETS / CONFIG:
sin secretos en el repositorio: auditoría del historial completo del 2026-09-18,
  repetida antes de publicar (DECISIONES_TECNICAS §7)
GitHub Actions secrets: 0
DATABASE_URL: inyectada por Render desde be-db-test (fromDatabase), nunca versionada
CORS_ALLOWED_ORIGINS: versionada en render.yaml; no es secreto
EXPO_TOKEN: no configurado; el APK se construye con EAS CLI autenticado localmente
Esta acta no registra ningún valor sensible.
```

**Ambientes y URLs vivas del ambiente `test`:**

```text
API:      https://be-api-hndp.onrender.com   (/health · /health/live · /health/ready)
Website:  https://be-web-1ngj.onrender.com
APK:      https://github.com/Elian-Bufi/be/releases/download/be-apk-0.1.0/be-0.1.0-fd3ed53.apk
```

---

# 3. Scope autorizado

```text
FIRST IMPLEMENTATION WORK PACKAGE:
WP-01 — Proyecto nuevo, desplegado (infraestructura; ver Nota 2)

  AUTHORIZED RF:   ninguno (WP-01 no implementa requisitos funcionales)
  AUTHORIZED UC:   ninguno
  AUTHORIZED API:  ninguna operación del 09; solo señales /health de 07 §30 (DL-004)
  AUTHORIZED UX:   ninguna pantalla del 10; solo placeholder «BE — en construcción»
  IDs que sostiene: ASR-09 · RNF-MAN-003 · RNF-PORT-001 · RNF-OBS-002
  Pruebas 11A:     TEST-RUN-001 · TEST-RUN-002 · TEST-RUN-003 · TEST-RUN-004 ·
                   TEST-APK-001 · TEST-APK-002 · TEST-APK-008
  Modelo 06:       T-06-01 (Identidad BE) · T-06-02 · T-06-24, schema mínimo
  OUT OF SCOPE:    endpoints de negocio, pantallas reales, modelos de dominio además
                   de Identidad, autenticación funcional, cualquier dato real

ALCANCE AUTORIZADO:
WP-01 a WP-07

CONDICIÓN POR PAQUETE (regla §3 del borrador: el scope referencia IDs baselineados;
no se autoriza «implementar el MVP» como instrucción genérica):
cada WP-02…WP-07 queda autorizado solo cuando su definición registrada en el repositorio
declare, antes del primer commit del paquete:
  OBJECTIVE · AUTHORIZED RF · AUTHORIZED UC · AUTHORIZED API · AUTHORIZED UX ·
  pruebas 11A · OUT OF SCOPE · evidencia esperada
con IDs de 04/05/09/10/11A. Un WP sin esa lista no está autorizado.
```

---

# 4. Datos y ambientes

```text
DEVELOPMENT:
AUTORIZADO — máquina local de desarrollo · solo datos sintéticos

TEST:
AUTORIZADO — Render Frankfurt (be-api, be-web, be-db-test Postgres 16) · solo datos sintéticos

DEMO/DEFENSE:
SYNTHETIC DATA ONLY

PRODUCTION:
NO CREADO (07 §36: promoción manual cuando exista)

PRODUCTION REAL DATA:
NOT AUTHORIZED

REAL HEALTH DATA:
NOT AUTHORIZED — requiere G-Q008-1, G-Q008-2 y el gate 08 §42
```

Cualquier cambio de esta política requiere decisión separada de Dirección y revisión de 08.

---

# 5. Git

Política según lo que Dirección instruyó el 2026-09-16 («Vos hacés todo, incluido Git») y lo que decidió el 2026-09-18:

```text
BRANCH CREATION:
SÍ — una rama por paquete (wp-XX)

COMMITS:
SÍ — con bloque TRACE, autor noreply

PUSH:
SÍ — solo al remoto verificado Elian-Bufi/be

PR:
SÍ — uno por cambio integrable

MERGE:
SÍ — solo PR con CI verde. Merge --no-ff local firmado con el email noreply y push a main
(DECISIONES_TECNICAS §7: el merge web firma con el email de la cuenta)

TAG:
SÍ — releases de artefactos (p. ej. be-apk-0.1.0); nunca con el patrón apk-v* salvo
para disparar apk.yml

MAIN:
sin commits directos ni force-push; solo merges de PR

PROTECCIÓN TÉCNICA DE MAIN:
PENDIENTE — Dirección activa «Keep my email addresses private» en la cuenta; después se
configura PR obligatorio + checks requeridos y se vuelve a los merges por GitHub
```

---

# 6. Roles

```text
Dirección:
Elián Bufi / decisión final

Productor de código:
Claude Code

Revisor:
ChatGPT + contrarrevisión independiente cuando la criticidad lo requiera
(WP-01 no tuvo contrarrevisión independiente; el rol rige desde WP-02)

Fuente de verdad:
legajo baselineado (docs/legajo), verificado por scripts/verificar-legajo.sh en cada push

Código AS-IS:
evidencia, no canon
```

---

# 7. Reglas de cada PR

Sin cambios respecto del borrador. Todo PR declara: `OBJECTIVE · RF · UC · REG/INV · 08 POLICY · API · UX · 11A TESTS · SCOPE · OUT OF SCOPE · RISKS · EVIDENCE`, en el bloque TRACE del commit y en la descripción del PR. No se integra por «parece funcionar».

# 8. Hallazgos durante coding

Sin cambios respecto del borrador. Las tensiones con el legajo se registran en `docs/DEUDA_LEGAJO.md` y no se resuelven en código.

---

# 9. 11B

```text
11B:
ACTIVO

RECEPTOR DE EVIDENCIA:
EVIDENCIA/<WP>/ (primer contenido: EVIDENCIA/WP-01/)

NAMING DE ARTEFACTOS:
be-<versión>-<sha>.apk · ci-run-<rama>-<sha>-<run>.log · verificacion-*.txt · captura-*.png
```

Cada evidencia registra, cuando exista: test ID, PASS/FAIL/BLOCKED, commit, build, ambiente, CI run, aserción HTTP/DB, captura, hash del APK e incidencia/retest.

---

# 10. RF-058 / TVCC-30

Sin cambios respecto del borrador: RF-058 P1 · SPEC-TVCC30-v1 baselineada en 12 · HTTP diferido. `TRACE-DEBT-12-001` es vinculante. Si RF-058 entra en un WP: antes de escribir código se reconcilia el 09 y se materializa el contrato P1.

---

# 11. Intake técnico

```text
INTAKE DE SOLO LECTURA:
EJECUTADO 2026-09-16 sobre el repositorio anterior be-health
docs/intake/INTAKE_01.md · CONVERGENCIA_SCHEMA_06.csv · CONTRASTE_ENDPOINTS_09_vs_CODIGO.csv

RESOLVIÓ:
repo/branch/SHA, stack y versiones, estructura, migrations, tests, CI, deploy, variables,
módulos y divergencias AS-IS ↔ TO-BE (0 coincidencias exactas de schema, 21 conflictos
estructurales) → decisión de Dirección: be-health no se usa como base

CUSTODIA DEL REPOSITORIO NUEVO:
verificada el 2026-09-18 (§2); el intake no la cubre porque se hizo sobre be-health
```

---

# 12. Rollback / Recovery

```text
ROLLBACK STRATEGY:
DEFINIDA — docs/DESPLIEGUE.md §Rollback: rollback de aplicación al deploy anterior en Render,
sin rollback de schema (migraciones aditivas, expand→contract); /health/ready acepta una base
con migraciones más nuevas que el artefacto (probado)

DEPLOY RECOVERY:
DEFINIDA — el readiness gate (/health/ready) cancela todo deploy cuya instancia no queda lista;
la versión anterior sigue sirviendo

MIGRATION FAILURE PROCEDURE:
DEFINIDO Y PROBADO — prisma migrate deploy corre antes de aceptar tráfico; si falla, la
instancia no arranca y el deploy se cancela; la migración queda registrada como fallida y se
corrige con una migración nueva (prueba de integración «migración fallida aborta», CI)

MERGE DEFECTUOSO:
git revert -m 1 <merge> en una rama nueva → PR → CI verde → merge; nunca force-push

ROLLBACK REHEARSAL:
PLANIFICADO — en test, después del primer merge de WP-02 y antes de cerrarlo:
  (1) rollback de be-api en Render al deploy anterior y retorno, con /health/ready antes y después;
  (2) git revert -m 1 de un merge de ensayo, con deploy automático y verificación del SHA;
  evidencia en EVIDENCIA/ENSAYO-ROLLBACK/.
Hasta ese ensayo, el flujo operativo no se considera maduro (MENOR-01 §6; §12.6 del borrador).
```

Reglas mínimas (vinculantes desde esta firma):

1. **No reescribir historia compartida.**
2. Prohibido como mecanismo ordinario de recuperación: `git push --force`; `git reset --hard` sobre historia compartida; `git commit --amend` sobre commits publicados.
3. Un merge defectuoso se revierte con una operación trazable que preserve historia.
4. Un deploy fallido vuelve al último artefacto estable sin perder evidencia del fallo.
5. Una migración fallida en test o demo detiene la promoción, preserva logs, impide continuar con un esquema parcialmente válido y se vuelve a verificar antes de promover.
6. Antes de declarar operativo el pipeline existe al menos un ensayo documentado de rollback o recovery en ambiente no productivo.

**Antecedente declarado.** El 2026-09-18, antes de esta firma, el historial se reescribió (`git filter-branch`) para retirar datos personales, y el resultado se publicó en un repositorio nuevo, sin force-push sobre historia compartida (`DECISIONES_TECNICAS.md` §7). Fue una remediación de privacidad decidida por Dirección, no un mecanismo de recuperación. Desde esta firma rige la regla 1.

---

# 13. Condiciones de firma

| # | Condición | Estado | Fuente |
|---|---|---|---|
| 1 | Entrega I aprobada | ✅ | ACTA-DIR-033.2 §3 |
| 2 | BE-LEG-01 aprobado | ✅ | ACTA-DIR-033.2 §3 |
| 3 | repo exacto verificado | ✅ | §2 |
| 4 | base SHA verificado | ✅ `e090253` | §2 |
| 5 | primer scope aprobado por IDs | ✅ WP-01; WP-02…07 con condición por paquete | §3 |
| 6 | política de Git completada | ✅ (protección técnica de `main` pendiente, con plan) | §5 |
| 7 | ambientes definidos | ✅ | §4 |
| 8 | datos sintéticos confirmados | ✅ | §4 |
| 9 | productor y revisor confirmados | ✅ | §6 |
| 10 | 11B preparado como receptor de evidencia | ✅ | §9 |
| 11 | estrategia de rollback/recovery definida | ✅ (ensayo planificado) | §12 |
| 12 | procedimiento ante migración fallida definido | ✅ y probado | §12 |
| 13 | secrets/config verificados sin registrar valores | ✅ | §2 |

---

# 14. Notas de firma

**Nota 1 — Evidencia que completa el gate.** El gate se completa con la evidencia del intake técnico del **2026-09-16** (§11) y con la verificación de custodia del repositorio nuevo del **2026-09-18** (§2).

**Nota 2 — WP-01.** WP-01 («Proyecto nuevo, desplegado») se ejecutó del 2026-09-16 al 2026-09-18 por orden directa de Dirección del 2026-09-16, **antes de esta firma** (`DEUDA_LEGAJO` DL-001). **Esta acta ratifica esa ejecución y la incorpora a la autorización**: WP-01 queda cubierto por esta acta como primer paquete del alcance. Evidencia y defensa: `EVIDENCIA/WP-01/`, `DEFENSA/WP-01.md`.

**Nota 3 — Inventario de actas.** La entrega documental contiene ACTA-DIR-021 a 033 (con 033.1 y 033.2) y el borrador 034. Las actas 001–020 no están en el repositorio. Es una observación de inventario; no afecta esta autorización.

---

# 15. Firma

```text
DIRECCIÓN:
FIRMADA

FIRMANTE:
Elián Bufi — Dirección

FECHA:
2026-09-18

EFECTO:
IMPLEMENTACIÓN: AUTORIZADA en el alcance del §3
GIT WRITE: AUTORIZADO según §5
DATOS REALES: NO AUTORIZADOS
```

Firma registrada por el ejecutor técnico a instrucción expresa de Dirección, en la sesión del 2026-09-18.

**FIN DEL ACTA**
