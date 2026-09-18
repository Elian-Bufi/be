# DEUDA_LEGAJO — tensiones entre el legajo y la implementación

> Registro del ejecutor técnico. **No resuelve nada**: cada entrada dice qué dice el documento, por qué no se implementó tal cual y dos opciones concretas. Decide Dirección.
> Mientras no haya decisión, la columna «Provisorio en código» indica qué se hizo para no bloquear el paquete, siempre del lado que no viola una garantía.

| ID | Abierta en | Documento | Tema | Estado |
|---|---|---|---|---|
| DL-001 | WP-01 · 2026-09-16 | 07 §0.2 · ACTA-DIR-034 (borrador) | Autorización de implementación no formalizada | ABIERTA |
| DL-002 | WP-01 · 2026-09-16 | 07 §13, §15, §34 | Versiones de runtime y frameworks del 07 vs WP-01 | ABIERTA |
| DL-003 | WP-01 · 2026-09-16 | 06 §5.4.2 · INV-06-22 | Estructura mínima de Identidad BE vs schema mínimo de WP-01 | ABIERTA |
| DL-004 | WP-01 · 2026-09-16 | 09 §3.1 vs 07 §13.2/§30 | `/health` fuera del prefijo obligatorio `/api/v1` | ABIERTA |
| DL-005 | WP-01 · 2026-09-16 | 09 §3.2 | No existe código de error para falla interna inesperada | ABIERTA |
| DL-006 | WP-01 · 2026-09-16 | 07 §36 | Pre-deploy `prisma migrate deploy` no disponible en plan gratuito de Render | ABIERTA |
| DL-007 | WP-01 · 2026-09-16 | 07 §34 vs CAND-07-J | Runtime del website: imagen Next standalone vs export estático | ABIERTA |
| DL-008 | WP-01 · 2026-09-18 | 07 §36 | La sincronización del Blueprint despliega sin esperar a la CI | ABIERTA |

---

## DL-001 — Autorización de implementación no formalizada

**Qué dice el legajo.** 07 §0.2: «Autorización de implementación — **NO OTORGADA** por este documento; requiere acto separado». `actas/BORRADOR_ACTA_DIR_034_v0.1.1_GATE_IMPLEMENTACION_NO_FIRMADA_2026-09-09.md`: «Estado: `NO FIRMADA · NO AUTORIZA IMPLEMENTACIÓN`».

**Qué pasó.** WP-01 se ejecutó por orden directa de Dirección del 2026-09-16 (decisión de abandonar `be-health` y arrancar limpio). Además, el paquete WP-01 menciona `ACTA-DIR-001 … 035`, pero la entrega contiene solo `021…033` y el borrador `034`.

**Por qué importa.** Un tribunal puede preguntar con qué acto se autorizó escribir código si el propio 07 dice que no estaba otorgado.

**Opciones.**
- **A.** Firmar ACTA-DIR-034 (o emitir ACTA-DIR-035) que autorice la implementación y deje constancia de WP-01 como primer paquete, con referencia a este registro.
- **B.** Emitir un acta acotada a infraestructura sin datos reales (WP-01) y reservar el gate 034 para el primer paquete con lógica de negocio.

**Provisorio en código.** Ninguno. WP-01 no contiene lógica de negocio ni datos.

---

## DL-002 — Versiones del 07 vs versiones decididas en WP-01

**Qué dice el legajo.** 07 §13.1 y §15 describen Node 20, NestJS 10.4.22, Prisma 5.22.0, Next 15.5.19, TS 5.9.3. 07 §34: «runtime Node 20 slim». 07 §21: PostgreSQL «versión objetivo: la mayor estable soportada por la plataforma» (Render: 18).

**Qué decidió WP-01.** Node 22 LTS, NestJS 11, Prisma 6, Next ≥ 15.5.24 (Next 15.5.19 tiene dos RCE críticas: `GHSA-p293-qw3h-jr36`, `GHSA-2xp9-vwfh-vxw4`), PostgreSQL 16 alineado con el harness.

**Opciones.**
- **A.** Refinar 07 §15/§21/§34 con las versiones de `DECISIONES_TECNICAS.md` (el 07 pasa a reflejar lo desplegado).
- **B.** Declarar 07 §13/§15 como AS-IS histórico de `be-health` y `DECISIONES_TECNICAS.md` como fuente de versiones vigentes, con referencia cruzada.

**Provisorio en código.** Versiones de WP-01 (ver `DECISIONES_TECNICAS.md`).

---

## DL-003 — Estructura mínima de `Identidad BE` vs schema mínimo de WP-01

**Qué dice el legajo.** 06 §5.4.2, estructura conceptual mínima de Identidad BE: identificador de dominio · **referencia a Perfil propio (exactamente una después de un registro exitoso)** · referencias a métodos de acceso · estado operativo de cuenta · **autoría de creación** · momento de ocurrencia · momento de registro · **procedencia**. `INV-06-22`: «Una Identidad BE registrada exitosamente posee un único Perfil propio» — se viola cuando existen cero.

**Qué pidió WP-01.** Solo `Identidad` con estado (`T-06-02`) y par temporal (`T-06-24`); ningún modelo más.

**Por qué no se puede tal cual.** Con solo `Identidad`, cualquier fila creada (incluido un seed) sería una identidad sin Perfil propio, autoría ni procedencia: viola `INV-06-22` y deja incompleto 06 §5.4.2.

**Opciones.**
- **A.** Mantener el schema mínimo de WP-01 y **no crear filas de Identidad** hasta el paquete de M-01 (UC-P25), que incorpora Perfil propio, Método de acceso, autoría y Procedencia (`T-06-23`) en una sola migración aditiva.
- **B.** Ampliar WP-01 con `PerfilPropio` y una estructura mínima de `Procedencia`, para que el seed sintético pueda crear identidades completas.

**Provisorio en código.** Opción A: schema mínimo, **sin seed de Identidad**. La base no está vacía: contiene `_prisma_migrations`.

---

## DL-004 — `/health` fuera del prefijo obligatorio `/api/v1`

**Qué dice el legajo.** 09 §3.1: «prefijo obligatorio `/api/v1`». 09 no contrata ninguna operación de salud. 07 §13.2 documenta `api/v1` con `exclude health`, y 07 §30 define `/health`, `/health/live`, `/health/ready`.

**Opciones.**
- **A.** Agregar al 09 una excepción explícita para señales de infraestructura (`/health*`), con su forma de respuesta (la implementada: `{ data: { estado, ambiente, version, dependencias } }` y 503 `DB_UNAVAILABLE` con ErrorEnvelope).
- **B.** Mover las señales a `/api/v1/health*` y ajustar `healthCheckPath` en `render.yaml`.

**Provisorio en código.** Según 07: fuera del prefijo. Cubierto por prueba (`health no queda bajo /api/v1`).

---

## DL-005 — Sin código de error para falla interna inesperada

**Qué dice el legajo.** 09 §3.2 enumera 401, 403, 404, 409, 422, 429 y 503. No hay código para un error interno no previsto (500).

**Opciones.**
- **A.** Agregar `500 INTERNAL_ERROR` al catálogo del 09, con `message` genérico y sin `details`.
- **B.** Declarar que toda falla no prevista se expone como `503 DEPENDENCY_UNAVAILABLE`.

**Provisorio en código.** WP-01 no tiene operaciones que puedan producirlo; se implementó solo el ErrorEnvelope para `404 RESOURCE_NOT_FOUND` y `503 DB_UNAVAILABLE`. No se inventó un código.

---

## DL-006 — Pre-deploy de migraciones en Render plan gratuito

**Qué dice el legajo.** 07 §36: fases «build → **pre-deploy: `prisma migrate deploy`** (si falla, el deploy aborta y la versión anterior sigue) → readiness gate → switch».

**Por qué no se puede tal cual.** Documentación de Render (consultada 2026-09-16): «The pre-deploy command is available for paid web services». El ambiente `test` usa plan gratuito.

**Qué se implementó.** El contenedor ejecuta `prisma migrate deploy` como primer paso del arranque y solo después levanta la API. Si la migración falla, el proceso termina, `/health/ready` nunca responde 200 y Render cancela el deploy conservando la versión anterior («If any new instance fails to become healthy during this process, Render cancels the entire deploy»). Además `/health/ready` verifica que las migraciones embebidas estén aplicadas.

**Opciones.**
- **A.** Aceptar en 07 §36 la equivalencia «migración en arranque + readiness gate» para planes sin pre-deploy.
- **B.** Pasar la API a instancia paga (Starter) y usar `preDeployCommand`.

---

## DL-007 — Runtime del website

**Qué dice el legajo.** 07 §34: «imagen OCI del Web (Dockerfile multi-stage con `next build` `output: 'standalone'`)». 07 CAND-07-J (aprobada condicionada): preferencia **C → A → B**, C = export estático + ruteo por path de la plataforma.

**Qué se verificó.** Render Static Site admite rewrite de path a URL externa y cabeceras propias (docs Render, 2026-09-16). La app compila con `output: 'export'`.

**Opciones.**
- **A.** Actualizar 07 §34 para reflejar la opción C (sin imagen del web).
- **B.** Volver a la opción A (runtime Next en contenedor) cuando aparezca una necesidad de SSR.

**Provisorio en código.** Opción C: Render Static Site con rewrite `/api/*` hacia la API.

---

## DL-008 — La sincronización del Blueprint despliega sin esperar a la CI

**Qué dice el legajo.** 07 §36: «`test` ← auto-deploy "After CI Checks Pass" sobre main». La CI tiene que pasar antes de que un artefacto llegue a `test`.

**Qué se observó (2026-09-18).** Con el push de `eaf785c` (solo cambiaba `CORS_ALLOWED_ORIGINS` en `render.yaml`), el Blueprint sincronizó la variable y Render reconstruyó `be-api`: `/health` informa `construidoEn: 17:25:44Z`, mientras la CI de ese commit corrió de 17:25:22Z a 17:27:04Z. El deploy que dispara el Blueprint no respeta `autoDeployTrigger: checksPass`, que solo gobierna los deploys por código. Esta vez la CI terminó en verde, así que no hubo daño.

**Por qué importa.** Un cambio en `render.yaml` junto con código roto puede llegar a `test` antes de que la CI lo rechace. La API igual tiene red: si la migración o el arranque fallan, el readiness gate cancela el deploy. Pero una regresión funcional pasaría.

**Opciones.**
- **A.** Aceptar la excepción en 07 §36: los cambios de configuración de plataforma se aplican al integrarse, y el readiness gate es la única barrera. Todo cambio a `render.yaml` va en un PR propio, sin código.
- **B.** Desactivar la sincronización automática del Blueprint y aplicarla a mano («Manual Sync») solo después de que la CI de ese commit esté en verde.

**Provisorio.** Ninguno en código. Hasta la decisión, los cambios de `render.yaml` se integran en commits sin cambios de código.
