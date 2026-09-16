# BORRADOR — ACTA-DIR-034 v0.1.1 · Gate de Implementación Funcional de BE

> **Proyecto:** BE — Plataforma integrada de inteligencia en salud  
> **Fecha de preparación:** `2026-09-09`  
> **Estado:** `NO FIRMADA · NO AUTORIZA IMPLEMENTACIÓN`  
> **Uso:** paquete de gate preparado para decisión posterior de Dirección  
> **Regla:** cualquier campo `TO VERIFY / TO DECIDE` bloquea la firma.

---

# 1. Precondiciones documentales

Para firma deben constar:

```text
BE-LEG-01:
APROBADO

BE-LEG-11A:
BASELINEADO

BE-LEG-12:
BASELINEADO

Documento 10:
CERRADO

11B:
AÚN NO REQUERIDO
```

11A baseline y 12 baseline provienen de Entrega H.

---

# 2. Custodia a verificar antes de firma

```text
REPOSITORY:
TO VERIFY

LOCAL/REMOTE IDENTITY:
TO VERIFY

BASE BRANCH:
TO VERIFY

BASE COMMIT SHA:
TO VERIFY

WORKING TREE:
TO VERIFY

REMOTE STATUS:
TO VERIFY

SECRETS / CONFIG:
TO VERIFY
```

No copiar estos valores desde memoria o documentación histórica.

Resolverlos con intake de solo lectura sobre el repo real.

---

# 3. Scope inicial

```text
FIRST IMPLEMENTATION WORK PACKAGE:
TO DECIDE

AUTHORIZED RF:
TO DECIDE

AUTHORIZED UC:
TO DECIDE

AUTHORIZED API:
TO DECIDE

AUTHORIZED UX:
TO DECIDE

OUT OF SCOPE:
TO DECIDE
```

El scope debe referenciar IDs baselineados.

No se autoriza “implementar el MVP” como instrucción genérica.

---

# 4. Datos y ambientes

Propuesta obligatoria de seguridad:

```text
DEVELOPMENT:
AUTHORIZED ONLY AFTER SIGNATURE

TEST:
AUTHORIZED ONLY AFTER SIGNATURE

DEMO/DEFENSE:
SYNTHETIC DATA ONLY

PRODUCTION REAL DATA:
NOT AUTHORIZED

REAL HEALTH DATA:
NOT AUTHORIZED
```

Cualquier cambio de esta política requiere decisión separada de Dirección y revisión de 08.

---

# 5. Git

Antes de firma:

```text
GIT WRITE:
NOT AUTHORIZED
```

Al firmar, Dirección debe especificar:

```text
BRANCH CREATION:
YES/NO

COMMITS:
YES/NO

PUSH:
YES/NO

PR:
YES/NO

MERGE:
YES/NO

TAG:
YES/NO
```

Recomendación de gate:

```text
branch + commits + PR:
permitidos dentro del scope

merge:
solo después de revisión y evidencia

push:
solo al remoto verificado

main:
no modificar directamente
```

La recomendación no es autorización hasta la firma.

---

# 6. Roles

Propuesta:

```text
Dirección:
Elian / decisión final

Productor de código:
Claude Code

Revisor:
ChatGPT + contrarrevisión independiente cuando criticidad lo requiera

Fuente de verdad:
legajo baselineado

Código AS-IS:
evidencia, no canon
```

---

# 7. Reglas de cada PR

Todo PR debe declarar:

```text
OBJECTIVE
RF
UC
REG/INV
08 POLICY
API
UX
11A TESTS
SCOPE
OUT OF SCOPE
RISKS
EVIDENCE
```

No merge por “parece funcionar”.

---

# 8. Hallazgos durante coding

## Código contradice canon

```text
→ corregir código
```

## Contrato ambiguo / upstream claro

```text
→ detener ese punto
→ elevar impacto
→ volver al propietario documental
```

## UX necesita operación inexistente

```text
→ no inventar API
→ elevar a 09
```

## Arquitectura necesita cambio

```text
→ demostrar impacto
→ recién entonces evaluar 07
```

---

# 9. 11B

Desde el primer work package firmado:

```text
11B:
ACTIVO
```

Cada evidencia deberá registrar cuando exista:

- test ID;
- PASS/FAIL/BLOCKED;
- commit;
- build;
- ambiente;
- CI run;
- HTTP/DB assertion;
- captura/video cuando aplique;
- APK hash cuando aplique;
- incidencia/retest.

---

# 10. RF-058 / TVCC-30

```text
RF-058:
P1

SPEC-TVCC30-v1:
BASELINEADA EN 12

HTTP:
DIFERIDO
```

Si RF-058 se incorpora a un work package de implementación:

```text
ANTES DE CÓDIGO
→ reconciliar 09
→ materializar contrato P1
```

`TRACE-DEBT-12-001` es vinculante.

---

# 11. Intake técnico

Antes del primer write se recomienda ejecutar un intake de solo lectura y producir:

```text
CODEBASE_BASELINE.md
IMPLEMENTATION_GAP_MATRIX.md
```

Debe resolver:

- repo/branch/SHA;
- stack y versiones;
- estructura;
- migrations;
- tests;
- CI;
- deploy;
- variables;
- módulos existentes;
- divergencias AS-IS ↔ TO-BE.

El intake no puede usar el código como autoridad para cambiar producto.

---


# 12. Rollback / Recovery — condición obligatoria antes de firma

Antes de habilitar writes, Dirección debe resolver y dejar documentado:

```text
ROLLBACK STRATEGY:
TO DECIDE / VERIFY

DEPLOY RECOVERY:
TO DECIDE / VERIFY

MIGRATION FAILURE PROCEDURE:
TO DECIDE / VERIFY

ROLLBACK REHEARSAL:
TO PLAN
```

Reglas mínimas:

1. **No reescribir historia compartida.**
2. Prohibido como mecanismo ordinario de recuperación:
   - `git push --force`;
   - `git reset --hard` sobre historia compartida;
   - `git commit --amend` sobre commits ya publicados.
3. Un merge defectuoso debe revertirse con una operación trazable que preserve historia.
4. Un deploy fallido debe poder volver al último artefacto conocido como estable sin perder evidencia del fallo.
5. Una migración fallida en test/demo debe:
   - detener la promoción;
   - preservar logs;
   - impedir continuar con un esquema parcialmente válido;
   - ejecutar el procedimiento de recuperación definido por la herramienta/estrategia aprobada;
   - volver a ejecutar la verificación antes de promover.
6. Antes de declarar operativo el pipeline, debe existir al menos un ensayo documentado de rollback/recovery en ambiente no productivo.

Ninguna de estas reglas autoriza por sí sola operaciones Git o deploy.

# 13. Condiciones de firma

Este borrador solo puede convertirse en autorización si:

1. Entrega I fue aprobada;
2. `BE-LEG-01` fue aprobado;
3. repo exacto fue verificado;
4. base SHA fue verificado;
5. primer scope fue aprobado por IDs;
6. política de Git fue completada;
7. ambientes fueron definidos;
8. datos sintéticos fueron confirmados;
9. productor/revisor fueron confirmados;
10. 11B fue preparado como receptor de evidencia;
11. estrategia de rollback/recovery fue definida;
12. procedimiento ante migración fallida fue definido;
13. secrets/config fueron verificados sin registrar valores sensibles.

---

# 14. Firma

Mientras esta sección diga:

```text
DIRECCIÓN:
NO FIRMADA
```

el efecto es:

```text
IMPLEMENTACIÓN:
NO AUTORIZADA

GIT WRITE:
NO AUTORIZADO
```

Estado actual:

```text
DIRECCIÓN:
NO FIRMADA

REPOSITORY:
TO VERIFY

BASE SHA:
TO VERIFY

FIRST WP:
TO DECIDE

ROLLBACK STRATEGY:
TO DECIDE / VERIFY

SECRETS / CONFIG:
TO VERIFY
```

---

**FIN DEL BORRADOR — NO EJECUTAR**
