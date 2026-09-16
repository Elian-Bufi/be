# INTAKE_01 — Estado real del repositorio BE frente al legajo

> **Tarea:** PROMPT 0 de `BE_PROMPTS_IMPLEMENTACION_CLAUDE_CODE.md` (intake de solo lectura)
> **Ejecutor:** Claude Code · **Fecha y hora de ejecución:** 2026-09-16 10:12 -0300
> **Repositorio:** `C:\Users\bufim\be-health` · rama `docs/canonical-legajo-to-be` · HEAD `59679264522c880723104aaf521967ffb780c9f6`
> **Bytes escritos en el repo:** **cero.** Estos archivos están fuera del repo, en `C:\Users\bufim\Downloads\BE_INTAKE_01_2026-09-16\`.
> **Anexos:** `CONVERGENCIA_SCHEMA_06.csv` (sección 5) · `CONTRASTE_ENDPOINTS_09_vs_CODIGO.csv` (sección 4)

**Cómo leer las etiquetas.** `VERIFICADO` = sale de un archivo abierto o de un comando ejecutado, con la cita. `INFERIDO` = clasificación hecha por el ejecutor sobre evidencia verificada (se explica el criterio). `NO DETERMINABLE` = no se pudo establecer, con el motivo.

---

## 0. Controles previos sobre el propio prompt

El prompt afirma cifras del legajo. Antes de usarlas se contrastaron contra las fuentes. **Ninguna de las cinco cifras coincide exactamente.**

| Afirmación del prompt | Lo que dicen las fuentes | Evidencia |
|---|---|---|
| "doce documentos canónicos" | En el canon Git (HEAD) hay **8**: 00, 02, 03, 04, 05, 06, 07, 08. El 01 no existe; 09, 10, 11A, 11B y 12 no están en el repo. | `git ls-tree -r HEAD -- docs/legajo` |
| "69 requisitos funcionales" | 04 tiene **69 IDs** (`RF-001…RF-069`), de los cuales **67 activos**. | 04 L1160 "67 RF ACTIVOS" |
| "56 casos de uso" | 05 declara **53**; hay **52 IDs** `UC-[PEI]nn` (31 P · 9 E · 12 I). `UC-I13` (citado por WP-04) **no existe** en el 05. | header 05 L10; conteo por grep |
| "79 términos · 221 reglas · 226 invariantes" | 06 canónico: **71 términos** `T-06-01…71` (+19 constructos raíz `N01…N19`), **201 reglas** `REG-06`, **210 invariantes** `INV-06`. | `BE_LEG_06_v0_1_MAESTRO` sha `2200dba6…`; B-13 L376-377 |
| "122 operaciones de API" | El 09 más reciente disponible (**candidato v0.15, no canónico**) declara **98 IDs P0** (L1019) + **9 de soporte P1** = **107**. | sección 4 |

**Fuentes citadas por los prompts WP que no se pudieron abrir** (búsqueda en el repo y en Descargas/Documentos/Escritorio/OneDrive): `BE-LEG-11A` (familias `TEST-AUTH`), `BE-LEG-11B`, `ACTA-DIR-034`, `MESA_01`, `DEUDA_LEGAJO.md`. Tampoco existen `06 §20.6` (el 06 termina en §19) ni `08 §56` (el 08 termina en §55). Sí existen `DV-05` (59 casos, 13 `TEST-AUTH`, sección "Diez casos adversariales" L121) y `DV-08_ADR`, dentro de `MESA_02_ENTREGA_CONTRARREVISION.zip`.

---

## 1. Estado real del repositorio — `VERIFICADO`

| Campo | Valor |
|---|---|
| Rama actual | `docs/canonical-legajo-to-be` |
| HEAD | `59679264522c880723104aaf521967ffb780c9f6` — `docs(legajo): canoniza BE-LEG-07 v0.1.11` (2026-08-29) |
| Working tree | **limpio** (`git status --short` vacío, antes y después) |
| Remoto | `origin` → `https://github.com/Elian-Bufi/Elian-Bufi-be-health.git` |

**Ramas locales** (`git for-each-ref refs/heads`):

| Rama | Último commit | Upstream |
|---|---|---|
| `docs/canonical-legajo-to-be` | 2026-08-29 `5967926` | `origin/…` · **ahead 2** |
| `audit/system-coherence-reverse-engineering` | 2026-07-17 `8c2c35c` | sin upstream |
| `main` | 2026-07-17 `ae3cfc0` | `origin/main` · al día |
| `feature/nutrition-sprint-2-today-adherence` | 2026-07-17 `bc3c399` | `origin/…` |
| `architecture/nutrition-pilot` | 2026-07-08 `e50bb20` | `origin/…` |
| `master` | 2026-06-24 `ddc0e66` | `origin/main` · **behind 40** (rama vieja) |

**Ramas remotas** (cache local; **no se hizo `fetch`** para no escribir en `.git`): `origin/docs/canonical-legajo-to-be` 2026-08-16 · `origin/feature/nutrition-sprint-3-review-adjustment` 2026-07-17 · `origin/main` 2026-07-17 · `origin/feature/nutrition-sprint-2-today-adherence` 2026-07-17 · `origin/architecture/nutrition-pilot` 2026-07-08. **El cache remoto es del 2026-07-28** (fecha de `.git/FETCH_HEAD`): el estado real de GitHub es `NO DETERMINABLE` sin fetch.

**¿La rama documental está mergeada a `main`?** **No.** Tampoco divergió: `main` es ancestro de la rama (`git merge-base --is-ancestor main docs/…` → verdadero) y la rama está **0 atrás / 9 adelante**. Los 117 archivos que agrega son todos documentación (100 en `docs/legajo`, 17 en `docs/auditoria-sistema`). **Dos commits no están publicados:** `cd651be` (canonización 08) y `5967926` (canonización 07).

---

## 2. Manifiestos y versiones — `VERIFICADO` (leído de `package.json` y `package-lock.json`)

Dos paquetes independientes, sin workspaces: raíz `be-health-backend@0.0.1` y `web/` `be-health-web@0.1.0`. Ambos lockfiles `lockfileVersion 3`.

| Componente | Declarado | Resuelto en lockfile |
|---|---|---|
| **Node exigido** | **NO DECLARADO** (sin `engines`, sin `.nvmrc`, sin `.node-version`) | CI usa Node **20**; local `v20.15.1` · npm `10.7.0` |
| NestJS (`@nestjs/core`/`common`) | `^10.4.4` | **10.4.22** |
| `@nestjs/jwt` · `@nestjs/config` | `^10.2.0` · `^3.3.0` | 10.2.0 · 3.3.0 |
| Prisma (`prisma` / `@prisma/client`) | `^5.20.0` | **5.22.0** |
| TypeScript (backend / web) | `^5.6.2` / `^5.7.0` | **5.9.3** / 5.9.3 |
| Next.js | `^15.1.0` | **15.5.19** |
| React / React DOM | `^19.0.0` | 19.2.7 |
| TanStack Query | `^5.62.0` | 5.101.0 |
| Jest · Vitest | `^29.7.0` · `^2.1.9` | 29.7.0 · 2.1.9 |
| **Expo / React Native** | **AUSENTE** | no hay `mobile/`, `app.json`, `eas.json` ni dependencia `expo` |

**PostgreSQL.** La versión de la base usada por la app es `NO DETERMINABLE`: exige conectarse a `DATABASE_URL` (en `.env`, que no se leyó). Lo único versionado es la imagen del harness de integración, **`postgres:16-alpine`** (`test/integration/global-setup.ts:108`, ruta Testcontainers marcada "EXPERIMENTAL" en L7). El 07 (L1701) *declara* que esa imagen está "alineada a la versión de prod": es una afirmación documental, no verificada acá.

---

## 3. Estado de migraciones — `VERIFICADO` salvo donde se indica

- **14 migraciones**, del `20260611113451_init_eventosalud` al `20260701010000_add_nutrition_activation_snapshot`. Proveedor `postgresql` (`migration_lock.toml`).
- **5 índices únicos parciales en SQL crudo** (`20260611114430_partial_indexes_eventosalud`): vínculo activo único, un líder activo, un plan nutricional ACTIVO, un plan de entrenamiento ACTIVO, email único entre cuentas no borradas.
- **Sincronía schema ↔ migraciones (evidencia de historial):** el último commit que tocó `schema.prisma` y el último que agregó una migración son **el mismo** (`c55dcd8`, 2026-07-01). Los 8 commits más recientes que cambiaron el schema traen cada uno su migración. No hay commits posteriores que toquen el schema sin migración. `npx prisma validate` → exit 0 (corrida del 2026-08-29 sobre este mismo SHA).
- **Drift contra una base real:** `NO DETERMINABLE`. `prisma migrate diff --from-migrations` exige una shadow database, `prisma migrate status` se conectaría a la base de `.env`, y `TEST_DATABASE_URL` no está definida en esta sesión. Existe `test/integration/migrations.int-spec.ts` ("las tablas esperadas existen y `_prisma_migrations` contiene las migraciones"), **no ejecutado**.
- **Migraciones pendientes:** `NO DETERMINABLE` por el mismo motivo.

---

## 4. Inventario de endpoints y contraste con BE-LEG-09

### 4.1 Lo que existe en el código — `VERIFICADO`

**53 rutas HTTP** en 8 controllers (parser sobre `src/**/*.controller.ts`): prefijo global `/api/v1` salvo `/health`. **4 públicas** (`/health`, `auth/login`, `GET` y `POST auth/activacion/:token`). **6 con `@Roles(PROFESIONAL)`** a nivel de clase (asesorados ×2, asignaciones ×4). Las otras 43 exigen JWT y autorizan dentro del servicio. Por módulo: nutrición 16 · entrenamiento 9 · eventos-salud 9 · objetivos 8 · auth 4 · asignaciones 4 · asesorados 2 · health 1. Detalle ruta por ruta, con archivo y línea: `CONTRASTE_ENDPOINTS_09_vs_CODIGO.csv`, sección `B_RUTA_CODIGO`.

### 4.2 Contra qué se contrastó

El 09 **no está en el repo ni está canonizado**. Se usó la versión más reciente disponible:

| Fuente | Estado | SHA-256 |
|---|---|---|
| `BE_LEG_09_v0.15_CONSOLIDADO_CANDIDATO_CIERRE_2026-08-31.md` (en `BE_LEG_09_v0.15_PAQUETE_CIERRE_2026-08-31.zip`) | `BORRADOR CONSOLIDADO — CANDIDATO A CIERRE` · **"Implementación: NO AUTORIZADA"** | `5cf63f29…c800355` |
| Fragmentos v0.8–v0.12 (contratos por familia) en `BE_LEG_09_CICLO3_CONTRARREVISION_v0.14_2026-08-31.zip` | manifiesto del paquete verificado: 10/10 OK | ver manifiesto |

El v0.15 es un delta: declara que el inventario P0 "es reproducible como **98** IDs API-09 explícitos, incluido `API-NUT-21`" (L1019). Los bloques de contrato están en v0.8–v0.12. Unión extraída: **107 operaciones con método y ruta** = 98 P0 + 9 de soporte P1 (`ACC-P1` ×4, `RGT` ×3, `EXP` ×2). Por familia: TRN 24 · NUT 21 · PRO 13 · REL 9 · ACC 6 · ANT 6 · DSH 5 · CON 4 · PRJ 3 · INT-NUT 3 · INT-TRN 3 · CRD 1 · más las 9 de soporte. `API-CRD-01` solo figura en prosa, sin prefijo `/api/v1`.

### 4.3 Resultado

**Coincidencia literal (método + ruta normalizada): 0 de 107.** `VERIFICADO`. El código nombra los recursos en español (`asesorados`, `nutricion`, `eventos-salud`) y el 09 en inglés (`advisees`, `nutrition`, `relationships`). Los únicos segmentos compartidos son `auth` y `me`.

**Contraste funcional** — `INFERIDO`, con el criterio y la evidencia de cada fila en el CSV:

| Operaciones del 09 (107) | Cantidad | Solo P0 (98) |
|---|---:|---:|
| `EQUIVALENTE_FUNCIONAL` — misma acción, distinto contrato | **5** | 5 |
| `PARCIAL` — existe una parte | **23** | 23 |
| `CONTRADICE` — existe, pero hace lo que el legajo prohíbe | **9** | 9 |
| `NO_EXISTE` | **70** | **61** |

Las 5 equivalentes: `REL-07/08/09` (pausar/reanudar/finalizar vínculo), `NUT-07` (crear borrador), `NUT-10` (editar borrador con lock optimista).

**Sin contraparte, por familia** (materializadas / total):

| Familia | Con contraparte | Qué falta (`NO_EXISTE`) |
|---|---|---|
| `PRO` perfil profesional y verificación | **0 / 13** | todas |
| `INT-NUT` · `INT-TRN` catálogos e importación | **0 / 6** | todas |
| `CRD` coordinación | **0 / 1** | `CRD-01` |
| `ACC-P1` · `RGT` · `EXP` recuperación, cierre, derechos, export | **0 / 9** | todas |
| `ACC` identidad y sesión | 3 / 6 | `ACC-03` cerrar sesión · `ACC-04` revocar sesiones · `ACC-06` editar perfil |
| `REL` vínculo | 5 / 9 | `REL-02/03/04` solicitudes (listar, **aceptar**, rechazar) · `REL-06` consultar vínculo |
| `CON` consentimiento | 1 / 4 | `CON-01` requisitos · `CON-03` listar · **`CON-04` revocar** |
| `NUT` nutrición | 14 / 21 | `NUT-11` validar · `NUT-16` consultar ejecución · `NUT-17…20` revisión y continuidad · `NUT-21` estructurar ingesta libre |
| `TRN` entrenamiento | 8 / 24 | evaluaciones `01-03` · planes `08-11` · Hoy `14` · ejecución `16/17/19/20` · revisión `21-24` |
| `ANT` antropometría | 2 / 6 | `ANT-01` especificaciones · `ANT-03/04` consultar · `ANT-05` corregir |
| `DSH` · `PRJ` vistas | 3 / 5 · 1 / 3 | `DSH-02` cola de revisiones · `DSH-05` progreso propio · `PRJ-02/03` configuración |

Para WP-03 esto significa que **no existe en código ni la aceptación de una solicitud de vínculo ni la revocación de consentimiento**: las dos piezas del "corte prospectivo" que el prompt maestro promete demostrar.

### 4.4 Lo que existe y NO está en el inventario del 09 — deuda no declarada

**19 de las 53 rutas** no tienen operación equivalente en el 09 (sección B del CSV, `NO_EN_INVENTARIO_09`):

| Área | Rutas |
|---|---|
| Datos que el 09 y el 06 no conocen | `POST eventos-salud/biometria` · `/check-in` · `/dolor` · `/foto-progreso` |
| Analítica y cálculos fuera del inventario | `GET entrenamiento/analitica/carga` (ACWR) · `GET entrenamiento/1rm` · `GET nutricion/objetivo-macros` · `GET entrenamiento/planes/:eventoId/volumen` · `POST entrenamiento/pr` |
| Objetivos sin concepto en 06/09 | `POST objetivos/:id/estado` · `POST objetivos/:id/hitos` · `PATCH objetivos/:id/hitos/:hitoId` · `POST objetivos/:id/revisiones` |
| Librería y vistas | `GET` y `POST nutricion/comidas-plantilla` · `GET nutricion/asesorados/:id/workspace` |
| Alta híbrida y otros | `GET auth/activacion/:token` · `POST eventos-salud/:id/correccion` (solo soporta biometría) · `GET /health` |

### 4.5 Las 6 rutas que contradicen el legajo — `VERIFICADO` en código

1. **`POST /api/v1/asesorados`** crea cuenta pre-activada y **vínculo `ACTIVO` sin aceptación del asesorado** (`asesorados.service.ts:126`). En 06 §7.5 (L3086) el alta del alcance la ejecuta el asesorado.
2. **`POST /api/v1/auth/activacion/:token`** otorga **`TERMINOS` + `DATOS_SALUD` en el mismo acto** que fija la contraseña (`auth.service.ts:36`). Choca con `INV-06-53` "Aceptación ≠ Consentimiento ≠ Autorización" y con WP-02 ("registrarse no concede consentimiento de datos de salud").
3. **`POST /api/v1/nutricion/adherencia`** persiste `porcentaje` 0-100. El 09 (`CAND-09-NUT-C`, "derivada del canon", v0.15 L859) prohíbe `adherencePercent` en P0, y `T-06-30` exige un registro "sin fórmulas de puntuación".
4. **`POST /api/v1/entrenamiento/adherencia`** también persiste `porcentaje` (SALTEADA→0, COMPLETADA→100; `eventos-salud.service.ts` `resolverPorcentajeSesion`).
5. **`POST /api/v1/entrenamiento/planes`** deja que **el cliente fije el estado del plan**, incluso `ACTIVO` (`crear-plan-entrenamiento.dto.ts:195-197` → `eventos-salud.service.ts:1081`): no hay borrador → validar → activar ni snapshot. Nutrición, en cambio, fija `BORRADOR` en el servidor (L945).
6. **`PUT /api/v1/nutricion/asesorados/:id/perfil`** hace upsert que sobrescribe; `API-NUT-01` crea una evaluación nueva e inmutable.

---

## 5. Matriz de convergencia schema ↔ dominio del 06

Archivo: **`CONVERGENCIA_SCHEMA_06.csv`** (76 filas: 45 modelos + 31 términos sin modelo). Fuentes: `schema.prisma` en HEAD y `BE_LEG_06_v0_1_MAESTRO_MODELO_DE_DOMINIO.md` (sha `2200dba6…`). Cada fila cita línea del schema y línea del 06.

**Criterio** (del prompt): `EXACTA` = mismo concepto y mismo nombre · `PARCIAL` = mismo concepto con distinto nombre o atributos · `AUSENTE_EN_06` · `AUSENTE_EN_CODIGO`. Se agregó una columna **`conflicto`**: `SI` cuando el modelo contradice una regla o definición explícita del 06; `TENSION` cuando la diferencia es la decisión misma de `H-07-DOM-01`.

| Resultado | Cantidad |
|---|---:|
| Modelos Prisma | **45** |
| `EXACTA` | **0** |
| `PARCIAL` | **34** |
| `AUSENTE_EN_06` | **11** — Admin, EventoSalud, MedicionBiometrica, RegistroDolor, RegistroCheckin, FotoProgreso, ComidaPlantilla, ComidaPlantillaAlimento, HitoObjetivo, TokenActivacion, AuditoriaAcceso |
| Términos `T-06` con alguna materialización | **40 de 71** |
| Términos `T-06` `AUSENTE_EN_CODIGO` | **31** |
| Modelos con `conflicto = SI` | **21** |
| Modelos con `conflicto = TENSION` | **1** (EventoSalud) |

**Por qué 0 exactas.** Los pocos nombres que coinciden no designan el mismo concepto. `Especialidad` es un catálogo en el código y una relación con máquina de verificación en el 06. `Perfil` no conserva historia. `Comida` está en otro nivel de la jerarquía.

### Hallazgos que condicionan `H-07-DOM-01`

1. **`EventoSalud` no existe para el 06** (0 coincidencias de EventoSalud o índice longitudinal). El 07 ya lo registra (L251): *"BE-LEG-06 no conoce `EventoSalud`, `health_coach` ni el schema Prisma actual"*. En el 06 la línea temporal es una **proyección** sin autoridad de escritura (`T-06-42`, L235). En el código es el **padre estructural** de todo detalle y el invariante 1 del `CLAUDE.md`.
2. **Colisiones de nombre y jerarquías que no calzan:**
   - Nutrición. 06: `Versión → Día tipo → Comida → Opción de comida → Ítem` (`REG-06-118`, L4551). Código: `PlanNutricion → SlotPlanComida → Comida → ComidaAlimento`. El `Comida` del código es la *Opción* del 06, falta el nivel obligatorio **Día tipo** y los ítems no tienen **Estado de preparación**, que es obligatorio (`T-06-53`).
   - Entrenamiento: **jerarquía invertida**. 06: `Plan → Bloque → Microciclo [0..N] → Sesión → Prescripción` (L5384-5390). Código: `Plan → Sesión → BloqueRutina → Serie → Set`. El "bloque" del código es una sección dentro de la sesión.
3. **Vínculo y consentimiento con estructura incompatible.** El 06 modela el vínculo por Alcance, la solicitud con 5 estados y el consentimiento atado a asesorado + profesional + alcance + finalidad + versión (§7.7.1, L3126). El código usa una fila por especialidad y un consentimiento por cuenta y tipo; `revocadoEn` existe pero nada lo usa. `Invitacion` crea vínculo al canjearse, contra `REG-06-46` (L3084), aunque hoy no se usa en `src/`.
4. **Criterio de intensidad.** `INV-06-138` (L5495) exige exactamente uno entre `PORCENTAJE_RM` o `RIR` por prescripción. `SetPrescrito` guarda %1RM, RIR y RPE simultáneos sin discriminador.
5. **Verificación y habilitación como booleanos** (`Profesional.certificado`, `ProfesionalEspecialidad.habilitado`). El 06 exige máquina por alcance y separación verificación ≠ habilitación (`T-06-11`, `T-06-13`, `INV-06-01`).
6. **`HEALTH_COACH`** existe en el seed como especialidad; el 06 no lo menciona (0 coincidencias de "coach").
7. **Lo que sí converge en intención:** snapshot de activación nutricional (`T-06-21`), lock optimista del borrador, corrección por anulación (`T-06-22` parcial), zona muscular y su relación con ejercicios (`T-06-67/69/70`), serie ejecutada con sustitución (`T-06-60/71`).

**Lectura de los datos para cada opción de `H-07-DOM-01`** (la decisión es de Dirección):

- **Migrar todo al vocabulario del 06:** es lo que exigen los hallazgos 2 a 5, que son estructurales y no de nombre; también es lo más caro.
- **Mantener el schema y declarar el mapeo:** alcanza para las filas `PARCIAL` sin conflicto (23), pero no resuelve las 21 con conflicto.
- **Híbrido por área:** separa limpio. **(Recomendado)** Identidad, vínculo, consentimiento y entrenamiento contradicen el 06 y WP-02/03/05 los reescriben igual; nutrición y antropometría convergen en intención y pueden conservar nombres con mapeo más correcciones puntuales (Día tipo, Estado de preparación, adherencia sin porcentaje).

---

## 6. Artefactos de despliegue — `VERIFICADO`

| Artefacto | Estado |
|---|---|
| Dockerfile / `.dockerignore` / docker-compose | **AUSENTE** |
| `render.yaml` o equivalente (fly, vercel, netlify, Procfile) | **AUSENTE** |
| Configuración Expo (`app.json`, `eas.json`) | **AUSENTE** |
| Pipeline de CI | **`.github/workflows/ci.yml`**: job backend (Node 20: `npm ci`, `prisma generate`, `prisma validate`, `npm test`, `typecheck:integration`, `build`, `git diff --check`) y job web (`npm ci`, `npm test`, `typecheck`, `build`). **Sin despliegue.** No corre la integración PostgreSQL (lo declara el propio archivo). |
| `.env.example` | Solo en la raíz, con **3 nombres**: `DATABASE_URL`, `JWT_SECRET`, `JWT_EXPIRES_IN` |

**Variables que el código lee y ningún `.env.example` documenta** (solo nombres): `PORT` (`src/main.ts:25`), `API_PROXY_TARGET` (`web/next.config.mjs:13`), `TEST_DATABASE_URL`, `ALLOW_DEDICATED_TEST_DATABASE`, `ALLOW_DEDICATED_TEST_BRANCH` (`test/integration/guard.ts`). `.gitignore` excluye `.env` y `.env.*`.

---

## 7. Riesgos para el arranque

**Lo que NO es riesgo** — `VERIFICADO` hoy:

| Comando | Exit | Resultado |
|---|---|---|
| backend `npx tsc --noEmit --incremental false -p tsconfig.json` | 0 | compila |
| web `npx tsc --noEmit --incremental false` | 0 | compila |
| backend `npm test` | 0 | **23 suites · 208 tests · 0 fallos** |
| web `npm test` | 0 | **10 archivos · 60 tests · 0 fallos** |

| # | Severidad | Riesgo | Evidencia |
|---|---|---|---|
| R-1 | **CRÍTICO** | **Next.js 15.5.19 con dos avisos críticos de ejecución remota de código sin autenticación**: GHSA-p293-qw3h-jr36 (servidores en Windows) y GHSA-2xp9-vwfh-vxw4 (Image Optimization con AVIF). Afectan `<15.5.24`. WP-01 publica justamente el website. | `npm audit --omit=dev` en `web/`: 1 crítico · 3 altos (next, sharp, postcss, nanoid) |
| R-2 | **ALTO** | Backend en producción: 3 altos (`@nestjs/platform-express` vía `multer`/`body-parser`; `lodash` vía `@nestjs/config`). Según npm, el arreglo exige **cambio de major** (`@nestjs/platform-express 12.0.3`, `@nestjs/config 12.0.0`): toca la versión del stack. | `npm audit --omit=dev` raíz: 0 crít · 3 altos · 5 moderados · 1 bajo |
| R-3 | **ALTO** | **Las fuentes que el prompt maestro exige abrir no están disponibles o no están autorizadas para implementar.** El 09 es candidato no canónico y declara "Implementación: NO AUTORIZADA". 11A no está localmente, y los criterios de cierre de WP-02/03 citan sus `TEST-AUTH`. `ACTA-DIR-034` no existe. | sección 0 · header v0.15 |
| R-4 | **ALTO** | **Divergencia estructural schema ↔ 06** (21 conflictos, 0 exactas). Sin decidir `H-07-DOM-01`, WP-03 a WP-06 no tienen vocabulario de destino. | sección 5 |
| R-5 | **ALTO** | **Mobile no existe.** WP-01 promete APK y WP-04 que el asesorado registre desde el móvil: es un proyecto nuevo, no una extensión. | sección 2 |
| R-6 | **MEDIO** | Seguridad de login, ya relevada por la auditoría BE-LEG-09-A **sobre este mismo SHA**: sin rate limiting; la anti-enumeración que WP-02 pide demostrar ("inexistente vs contraseña incorrecta responde idéntico") falla por **tiempo de respuesta** (`bcrypt.compare` solo corre si la cuenta existe, `auth.service.ts:66-68`); la idempotencia diaria es check-then-act sin índice único. | informe BE-LEG-09-A, HEAD `5967926` |
| R-7 | **MEDIO** | Despliegue desde cero: no hay Dockerfile, ni configuración de plataforma, ni migraciones como fase de deploy, ni build de APK. | sección 6 |
| R-8 | **MEDIO** | La integración PostgreSQL no corre en CI y no pudo correr acá (sin `TEST_DATABASE_URL`; la ruta Testcontainers es experimental). El cliente Docker 29.5.3 está en PATH; el motor no se verificó. | `global-setup.ts` L7, L65, L97 |
| R-9 | **BAJO** | Dependencias de desarrollo: `vitest` crítico (GHSA-5xrq-8626-4rwp, solo con la UI de Vitest escuchando) y `vite` alto. No llegan a producción. | `npm audit` web completo: 2 crít · 7 altos · 6 moderados |
| R-10 | **BAJO** | Dos commits de canonización sin publicar y cache remoto de 49 días: un clon nuevo no vería el 07 ni el 08 canónicos. | sección 1 |

---

## 8. Qué no se hizo, y por qué

| No hecho | Motivo |
|---|---|
| `git fetch` | escribe en `.git`; el prompt prohíbe escribir en el repo |
| `npm run test:integration` | regla del repo: no se ejecuta sin `TEST_DATABASE_URL`; no está definida |
| `npm run build` (backend y web) | genera `dist/` y `.next/` dentro del repo; se usó `tsc --noEmit --incremental false`, que no escribe |
| `prisma migrate status` / `migrate diff` | se conectan a una base (la de `.env` o una shadow); ninguna segura disponible |
| Leer `.env` | contiene secretos |
| WP-01 a WP-07 | el propio documento exige cuatro decisiones de Dirección antes del primer commit (ver cierre) |

**Control de no-alteración.** Se tomó una foto antes y después de los mtimes de `web/tsconfig.tsbuildinfo`, `dist/`, `web/.next/`, `node_modules/.vite*` y `web/node_modules/.vite*`, y de `git status --porcelain --ignored`: **sin cambios**. HEAD, rama y working tree **idénticos** al inicio. `npm audit` consulta el registro de npm, no modifica archivos.

---

## Cierre

**Distancia al legajo:** el código funciona (compila, 268 tests verdes) pero habla otro idioma que el legajo: 0 de 107 operaciones del 09 existen con su contrato, 5 existen funcionalmente, 0 de 45 modelos coinciden exactamente con el 06 y 21 lo contradicen en estructura.
**Mayor riesgo para el plazo:** WP-01 a WP-05 dependen de fuentes que no están disponibles o autorizadas (09 no canónico e "Implementación: NO AUTORIZADA", 11A no encontrado, ACTA-DIR-034 inexistente), y a eso se suman un móvil que no existe y un Next.js con dos RCE críticos a publicar.
**Decisión previa de Dirección:** resolver `H-07-DOM-01` (los datos favorecen el híbrido por área) y, en la misma acta, autorizar formalmente la implementación sobre un 09 y un 11A identificados por versión y hash.
