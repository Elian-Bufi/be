# DEUDA_LEGAJO — tensiones entre el legajo y la implementación

> Registro del ejecutor técnico. **No resuelve nada**: cada entrada dice qué dice el documento, por qué no se implementó tal cual y dos opciones concretas. Decide Dirección.
> Mientras no haya decisión, la columna «Provisorio en código» indica qué se hizo para no bloquear el paquete, siempre del lado que no viola una garantía.

| ID | Abierta en | Documento | Tema | Estado |
|---|---|---|---|---|
| DL-001 | WP-01 · 2026-09-16 | 07 §0.2 · ACTA-DIR-034 (borrador) | Autorización de implementación no formalizada | **CERRADA** 2026-09-18 · ACTA-DIR-034 v1.0 |
| DL-002 | WP-01 · 2026-09-16 | 07 §13, §15, §34 | Versiones de runtime y frameworks del 07 vs WP-01 | ABIERTA |
| DL-003 | WP-01 · 2026-09-16 | 06 §5.4.2 · INV-06-22 | Estructura mínima de Identidad BE vs schema mínimo de WP-01 | **CERRADA** 2026-09-19 · WP-02, migración `20260918200000_identidad_y_sesiones` |
| DL-004 | WP-01 · 2026-09-16 | 09 §3.1 vs 07 §13.2/§30 | `/health` fuera del prefijo obligatorio `/api/v1` | ABIERTA |
| DL-005 | WP-01 · 2026-09-16 | 09 §3.2 · 09v7 · 09v8 | Código de error para falla interna inesperada | ABIERTA (hallazgo WP-02) |
| DL-006 | WP-01 · 2026-09-16 | 07 §36 | Pre-deploy `prisma migrate deploy` no disponible en plan gratuito de Render | ABIERTA |
| DL-007 | WP-01 · 2026-09-16 | 07 §34 vs CAND-07-J | Runtime del website: imagen Next standalone vs export estático | ABIERTA |
| DL-008 | WP-01 · 2026-09-18 | 07 §36 | La sincronización del Blueprint despliega sin esperar a la CI | ABIERTA |
| DL-009 | WP-02 · 2026-09-18 | 06 §5.5/§5.12 · 05 UC-P25 · 09v8 | Perfil propio sin campos aprobados | ABIERTA |
| DL-010 | WP-02 · 2026-09-18 | 09v8 ACC-01 · 08 §24.5 | El registro distingue identificador nuevo de existente (201/409) | ABIERTA |
| DL-011 | WP-02 · 2026-09-18 | 06 INV-06-24, REG-06-19 · 08 §16 | Unicidad global del identificador, incluye cuentas cerradas | ABIERTA |
| DL-012 | WP-02 · 2026-09-18 | 07 §43-bis · 08 §26 · 09v8 ACC-02 | Sesión: formato, transporte, TTL y renovación | ABIERTA |
| DL-013 | WP-02 · 2026-09-18 | 08 §24.2 | No hay política de contraseñas en el legajo | ABIERTA |
| DL-014 | WP-02 · 2026-09-18 | 09v8 ACC-02 · 09:230 · 04 RF-006 | Neutralidad del login: tolerancia de tiempo y cuentas no operativas | ABIERTA |
| DL-015 | WP-02 · 2026-09-18 | 08 §24.5, §38 · 09v12 | Rate limiting con umbrales provisionales | ABIERTA |
| DL-016 | WP-02 · 2026-09-18 | 09v12 ACC-P1-03/04 · 06 §5.7.4 | Cierre síncrono; ACC-P1-04; forma del contrato de cierre | ABIERTA |
| DL-017 | WP-02 · 2026-09-18 | 09v12 · 09v7 T14 · 08:487 | Step-up del cierre sin MFA | ABIERTA |
| DL-018 | WP-02 · 2026-09-18 | 11A TEST-AUTH-013 | «El cierre finaliza vínculos» no es demostrable sin vínculos | ABIERTA |
| DL-019 | WP-02 · 2026-09-18 | 08 R-01/R-02/R-03, §17-18 · 06 REG-06-24 | Supresión del hash al cierre y retención posterior | ABIERTA |
| DL-020 | WP-02 · 2026-09-18 | 06 §5.7.4 · 05 · 09 | Suspensión y restablecimiento sin UC ni operación | ABIERTA |
| DL-021 | WP-02 · 2026-09-18 | 08 §12.2/§12.4 · 06 §5.4.2 | Actos A1/A2 y datos del alta fuera del modelo del 06 | ABIERTA |
| DL-022 | WP-02 · 2026-09-18 | 08 §12.2 · 05 UC-I11 · 09v7 T12 | Canal o superficie sin campo contractual | ABIERTA |
| DL-023 | WP-02 · 2026-09-18 | 08 §24.3, §24.7 · 04 RF-001 | Alta por invitación y declaración de mayoría de edad | ABIERTA |
| DL-024 | WP-02 · 2026-09-18 | 10-B02 · 10-ADD · 10-B01 | Desvíos de copy y de UI | ABIERTA |
| DL-025 | WP-02 · 2026-09-18 | 05:1021 · 10-B01 | Superficie web del asesorado | ABIERTA |
| DL-026 | WP-02 · 2026-09-18 | 09:253-262 · 09v7 T07 · 09v8 | Idempotencia y códigos no definidos | ABIERTA |
| DL-027 | WP-02 · 2026-09-18 | 11A · 12 · 05:14230 | Oráculos de prueba ausentes en 11A y traza de UC-P26 | ABIERTA |
| DL-028 | WP-02 · 2026-09-18 | 08 R-08-05, §42-1 | Textos A1, A2, A3 y consecuencias del cierre: sintéticos | ABIERTA |
| DL-029 | WP-02 · 2026-09-19 | 09v8 ACC-03 · 09v7 T14 | Logout idempotente frente a AuthN SESSION | ABIERTA |
| DL-030 | WP-02 · 2026-09-19 | 07 CAND-07-J C · 08 §12.2, §38 | Detrás del rewrite del website, la API no ve la IP del cliente | ABIERTA — **para Dirección** |

---

## DL-001 — Autorización de implementación no formalizada

**Qué dice el legajo.** 07 §0.2: «Autorización de implementación — **NO OTORGADA** por este documento; requiere acto separado». `actas/BORRADOR_ACTA_DIR_034_v0.1.1_GATE_IMPLEMENTACION_NO_FIRMADA_2026-09-09.md`: «Estado: `NO FIRMADA · NO AUTORIZA IMPLEMENTACIÓN`».

**Qué pasó.** WP-01 se ejecutó por orden directa de Dirección del 2026-09-16 (decisión de abandonar `be-health` y arrancar limpio). Además, el paquete WP-01 menciona `ACTA-DIR-001 … 035`, pero la entrega contiene solo `021…033` y el borrador `034`.

**Por qué importa.** Un tribunal puede preguntar con qué acto se autorizó escribir código si el propio 07 dice que no estaba otorgado.

**Opciones.**
- **A.** Firmar ACTA-DIR-034 (o emitir ACTA-DIR-035) que autorice la implementación y deje constancia de WP-01 como primer paquete, con referencia a este registro.
- **B.** Emitir un acta acotada a infraestructura sin datos reales (WP-01) y reservar el gate 034 para el primer paquete con lógica de negocio.

**Provisorio en código.** Ninguno. WP-01 no contiene lógica de negocio ni datos.

**Resolución — CERRADA el 2026-09-18.** Dirección firmó `actas/ACTA_DIR_034_v1.0_GATE_IMPLEMENTACION_FIRMADA_2026-09-18.md`, una variante de la opción A:
- autoriza la implementación en el alcance WP-01 a WP-07, cada paquete con sus IDs fijados antes del primer commit;
- **ratifica** WP-01, que se ejecutó antes de la firma por orden directa de Dirección;
- el borrador v0.1.1 se conserva sin cambios porque integra el manifiesto.

La observación sobre las actas 001–020 no incluidas en la entrega queda como nota de inventario (ACTA-DIR-034 §14, Nota 3) y no bloquea.

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

**Cierre (2026-09-19, WP-02).** La migración aditiva `20260918200000_identidad_y_sesiones` completa la estructura del 06 §5.4.2: Perfil propio (1:1, con INV-06-22 verificado por un constraint trigger diferido), métodos de acceso, autoría de creación y procedencia. La única forma de crear una Identidad es el registro (UC-P25), que crea todo en una transacción. Pruebas: `schema.int-spec.ts` (INV-06-22) y `registro.int-spec.ts` (TEST-UC-P25).

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

**Hallazgo (WP-02, 2026-09-18).** El código sí existe en el legajo, aunque no en el consolidado: el contrato transversal lo lista como «500 | `INTERNAL_ERROR`» (09v7:185), y la semántica «500 | falla no clasificada» está en 09v7:207 y 09v8:1837. Lo que falta es su incorporación al §3.2 consolidado del 09. **Provisorio en WP-02:** `500 INTERNAL_ERROR` con `message` genérico y sin `details`, citando 09v7:185. **Condición de cierre:** el 09 consolida el código en §3.2.

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

---

## Entradas abiertas en WP-02 (2026-09-18)

> Formato ampliado desde WP-02, según el 12:402-405: prioridad, condición de cierre y evidencia. Cada entrada cita `archivo:línea` con abreviaturas (09v7 = 09_AUX v0.7, 09v8 = 09_AUX v0.8, 09v12 = 09_AUX v0.12, 10-B02 / 10-ADD / 10-B10 = documentos de UX). Definición del paquete: `docs/paquetes/WP-02.md`.

## DL-009 — Perfil propio sin campos aprobados

**Prioridad:** media · **Documento:** 06 §5.5 y §5.12 · 05 UC-P25 · 09v8 ACC-01/06 · **Estado:** ABIERTA

**Qué dice el legajo.**
- UC-P25 exige que «el perfil propio queda asociado» (05:14047-14053).
- ACC-01 «crea una identidad BE única + perfil propio» (09v8:264).
- INV-06-22 exige exactamente un Perfil propio (06:2435).
- Ningún documento aprueba sus campos: «B-01 no inventa datos personales que 04/05 no aprobaron» (06:2034-2046). 05 dice «sin fijar aquí su estructura» (05:14045), y 09v8 marca los «campos exactos del profile común» como deliberadamente no cerrados (09v8:1955).
- §5.12 fija «Identidad BE — Versión de Perfil propio 1 : 1..N» (06:2397), mientras §5.5.2 dice «exactamente una cuando existe contenido confirmado» (06:2042).

**Por qué no tal cual.** Sin campos no hay contenido que versionar. Crear una versión vacía para cumplir §5.12 sería inventar contenido.

**Opciones.**
- **A.** Perfil propio 1:1 creado en la transacción del alta, sin versión mientras no haya campos aprobados. ACC-06 queda diferida.
- **B.** Aprobar un campo mínimo, por ejemplo el nombre visible (C3), emitir la Versión 1 en el alta y habilitar ACC-06.

**Provisorio en código.** A. `PerfilPropio` existe con `versionEfectivaId = null`; INV-06-22 se cumple y DL-003 se cierra.

**Condición de cierre.** Dirección aprueba los campos del perfil propio, o declara que el perfil no tiene contenido en el MVP y corrige §5.12.

## DL-010 — El registro distingue identificador nuevo de existente (201 frente a 409)

**Prioridad:** alta · **Documento:** 09v8 ACC-01 · 08 §24.5 · 04 RNF-SEC-003 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-01 responde 201 con `identityId` o `409 REGISTRATION_NOT_AVAILABLE`, «deliberadamente neutral» (09v8:271-295).
- También exige que «no se filtra públicamente que una cuenta concreta ya exista» (09v8:269).
- El 08 lo extiende a todos los flujos: «sin revelar existencia de cuentas en ningún flujo» (08:570).

**Por qué no tal cual.** Aunque el mensaje sea neutral, la diferencia 201/409 es un oráculo de existencia. Una salida sin oráculo exige un canal fuera de banda (un correo de confirmación), y el correo no tiene RF activo ni se presupone (08:569).

**Opciones.**
- **A.** Usar el contrato literal: 409 con un mensaje único para cualquier causa, trabajo de hash equivalente en las dos ramas y rate limiting por IP.
- **B.** Responder de forma uniforme sin crear nada y confirmar el alta por un canal fuera de banda. Contradice el 201 de ACC-01 y requiere un RF de canal.

**Provisorio en código.** A.

**Condición de cierre.** Dirección acepta el riesgo residual o aprueba un canal de confirmación.

## DL-011 — Unicidad del identificador: global, incluye cuentas cerradas

**Prioridad:** media · **Documento:** 06 INV-06-24, REG-06-19, §5.7.2 · 08 §16 · **Estado:** ABIERTA

**Qué dice el legajo.**
- CERRADA es terminal y sin reapertura (06:2129; 08:436).
- REG-06-19 manda «conservar la identidad existente» (06:1986-1995).
- Ningún documento decide si el correo de una cuenta cerrada vuelve a estar disponible.

**Opciones.**
- **A.** Índice único global sobre `(tipo, referencia)`. Quien cerró su cuenta no puede volver a registrarse con el mismo correo y recibe el mismo 409 neutral.
- **B.** Índice parcial que excluye las cuentas CERRADAS. Libera el correo, a costa de crear una identidad paralela para la misma persona.

**Provisorio en código.** A: índice `metodo_de_acceso_tipo_referencia_key`.

**Condición de cierre.** El 08 decide la reversibilidad y la liberación del identificador tras el cierre.

## DL-012 — Sesión: formato, transporte, TTL y renovación

**Prioridad:** media · **Documento:** 07 §43-bis, 07:537, 07:786-789 · 08 §26 · 09v7 T01 · 09v8 ACC-02 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Las sesiones son revocables server-side (08:589).
- El 07 aprueba la opción «A+B»: tabla de sesiones más `tokenVersion` (07:1785-1795).
- La revocación «no dependa del TTL del JWT» (07:1799).
- El acceso dura ≤24 h sin renovación (08:590, PROPUESTA BE).
- JWT en memoria en el MVP, «hasta refresh rotativo» (07:789).
- El transporte, cookie o Bearer, queda abierto (09v8:336, 1957).
- ACC-02 devuelve `renewable: true`, pero no existe ninguna operación de renovación.

**Opciones.**
- **A.** JWT corto con la fila de sesión verificada en cada request, Bearer en memoria en website y APK, sin renovación. Recargar el website o reiniciar el APK obliga a volver a iniciar sesión (07:537). No hay superficie de CSRF.
- **B.** Cookie httpOnly en el website y SecureStore en el APK, con refresh rotativo (T-10 del 07).

**Provisorio en código.** A, con TTL de 12 h y `renewable: false`.

**Condición de cierre.** Se implementa el refresh rotativo (T-10) o Dirección ratifica A para el MVP.

## DL-013 — No hay política de contraseñas en el legajo

**Prioridad:** media · **Documento:** 08 §24.2 · 09v8:1953-1964 · **Estado:** ABIERTA

**Qué dice el legajo.** Solo fija el hash: «bcrypt costo 10 — se conserva como mínimo» (08:567). No fija longitud, composición ni listas de contraseñas prohibidas.

**Opciones.**
- **A.** Mínimo técnico provisional: 12 caracteres (OWASP ASVS 2.1.1) y máximo 72 bytes (límite de bcrypt), sin reglas de composición.
- **B.** Que el 08 fije la política y se la adopte.

**Provisorio en código.** A, validado igual en `@be/domain` para la API y los dos clientes. Si no cumple, `400 INVALID_REQUEST` con `issues`.

**Condición de cierre.** El 08 fija la política.

## DL-014 — Neutralidad del login: sin tolerancia de tiempo normada; cuentas no operativas

**Prioridad:** alta · **Documento:** 09v8:361-373, 1849 · 09:230 · 04 RF-006 · 11A:522 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Identificador inexistente y contraseña incorrecta deben ser «observacionalmente neutral» (09v8:1849).
- Las diferencias de timing se admiten «más allá de tolerancias operativas inevitables», sin un umbral (09:230).
- Para una «cuenta no utilizable cuando revelarlo sea sensible», 401 neutral, sin decir cuándo lo es.
- RF-006 pide informar el estado de la cuenta (04:139).

**Opciones.**
- **A.** Todas las ramas ejecutan exactamente una comparación bcrypt (con un hash señuelo si no hay credencial) y una escritura de auditoría, y responden `401 INVALID_CREDENTIALS` con el mismo cuerpo. Esto incluye las cuentas SUSPENDIDA y CERRADA. La prueba compara medianas con una tolerancia declarada: el máximo entre 50 ms y un 35 % de la mediana.
- **B.** Aserción bloqueante solo sobre código y cuerpo, y el tiempo como medición informativa.

**Provisorio en código.** A. La causa real queda solo en la auditoría interna (09v7 T16). El hash señuelo toma el costo **más frecuente entre los hashes guardados**, no el configurado: si `BCRYPT_COST` sube (el 08 lo declara «parámetro revisable»), los hashes existentes conservan su costo, y un señuelo más caro haría que el tiempo delatara qué cuentas existen (hallazgo de la revisión adversarial, 2026-09-19; prueba en `sesiones.int-spec.ts`).

**Condición de cierre.** 11A fija la tolerancia y el 09 decide si una cuenta no operativa tiene código propio.

## DL-015 — Rate limiting con umbrales provisionales

**Prioridad:** media · **Documento:** 08 §24.5 y §38 · 09v12:1000-1018 · 07 R-07-08 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El rate limiting es obligatorio en ACC-02 (09v8:337).
- Umbrales PROPUESTA BE: 5 intentos cada 15 min por cuenta+IP, con lockout progresivo (08:786). Los valores numéricos «pertenecen a configuración/11A» (09v12:1018).
- Un lockout «por cuenta» revelaría existencia si solo se aplicara a cuentas reales.

**Opciones.**
- **A.** Throttler con la clave IP + identificador normalizado, independiente de la existencia de la cuenta, y 429 idéntico. Contadores en la memoria de la instancia única, sin lockout progresivo.
- **B.** Contadores persistentes en PostgreSQL con lockout progresivo.

**Provisorio en código.** A, configurable por entorno:
- login: 5 cada 15 min por red + identificador;
- login: además, **100 cada 15 min por red**, sin importar el identificador (08:786, «global por IP: generoso»). Frena el *password spraying* desde una sola red;
- registro: 10 por hora por red.

«Red» es la dirección IPv4, o el prefijo /64 si es IPv6: quien controla un /64 no obtiene un cupo por dirección. Estos dos puntos (el cupo global y la agregación IPv6) surgieron de la revisión adversarial del 2026-09-19.

**Medido (2026-09-19):** detrás del rewrite `/api/*` del website, la API no ve la IP del cliente. Ver DL-030.

**Condición de cierre.** 11A calibra los umbrales, o se escala a más de una instancia (lo que obliga a B).

## DL-016 — Cierre síncrono; ACC-P1-04 inalcanzable; forma del contrato de cierre

**Prioridad:** media · **Documento:** 09v12:582-617 · 06 §5.7.4 · 08:591 · 10-ADD:57-96 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-P1-03 produce efectos «cuando el cierre se hace efectivo según 06/08» (09v12:597).
- CerrarCuenta ocurre al confirmar (06:2147) y la revocación de sesiones es «inmediata» (08:591).
- El body, la respuesta y los estados de la solicitud no están definidos. El 10 prohíbe «inventar enum/etapas» (10-ADD:88-96).

**Por qué no tal cual.** Si el cierre es inmediato, la sesión que lo ejecuta queda revocada, y ACC-P1-04 («estado actual») solo sería alcanzable antes de cerrar, cuando todavía no hay solicitud.

**Opciones.**
- **A.** Cierre síncrono en una sola transacción. Request `{consequencesAcknowledgement:{versionId}, confirmed:true}` y respuesta `201` con `{id, identityId, accountOperationalState:"CERRADA", requestedAt}`. ACC-P1-04 no se implementa en WP-02.
- **B.** Cierre en dos fases, con un estado pendiente que ni el 06 ni el 09 definen.

**Provisorio en código.** A. El `versionId` de las consecuencias hace verificable la guarda «consecuencias presentadas».

**Condición de cierre.** El 09 cierra el contrato P1 del cierre.

## DL-017 — Step-up del cierre sin MFA

**Prioridad:** media · **Documento:** 09v12:589-593 · 09v7 T14 · 08:487 · 07:1799 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-P1-03 exige `SESSION_STEP_UP` (09v12:589).
- `SESSION_STEP_UP` es una «reautenticación/step-up reciente» (09v7:546-547).
- El 08 considera suficiente la sesión propia (08:487).
- MFA está fuera de alcance, y crear una operación de reautenticación contradice 10-B02:580.

**Opciones.**
- **A.** Step-up por sesión reciente: la sesión se autenticó hace ≤10 minutos; si no, `403 STEP_UP_REQUIRED` y la UI pide volver a iniciar sesión.
- **B.** Enviar la credencial en el body del cierre, un campo no contratado que exige rate limiting propio.

**Provisorio en código.** A.

**Condición de cierre.** Implementación de MFA o de step-up según el 09.

## DL-018 — TEST-AUTH-013 (a): «el cierre finaliza vínculos por eventos» no es demostrable sin vínculos

**Prioridad:** alta · **Documento:** 11A:534 · 06:2191 · 05:14513 · **Estado:** ABIERTA

**Qué dice el legajo.**
- TEST-AUTH-013 afirma «cierre finaliza vínculos por eventos, no delete silencioso» (11A:534).
- 11A admite solo PASS, FAIL, BLOCKED y NOT_RUN (11A:105-114).
- WP-02 excluye los vínculos.

**Por qué no tal cual.** Sin modelo de vínculos, la parte (a) sería verdadera solo en vacío, y reportar PASS sería falso.

**Opciones.**
- **A.** Reportar TEST-AUTH-013 como **BLOCKED**, con la parte (b) («no delete silencioso») como evidencia parcial ejecutada, y volver a ejecutarla completa en el paquete de vínculos. `CuentaCerrada` queda como hecho consumible.
- **B.** Que 11A la divida en TEST-AUTH-013a y TEST-AUTH-013b.

**Provisorio.** A. La parte (b) tiene su propia prueba automatizada en CI.

**Condición de cierre.** El paquete de vínculos ejecuta la parte (a) completa.

## DL-019 — Supresión del hash al cierre y retención posterior

**Prioridad:** alta · **Documento:** 08 R-01, R-02, R-03, §17, §18 · 06 REG-06-24, INV-06-29, 06:1578 · **Estado:** ABIERTA

**Qué dice el legajo.**
- R-02 exige «Supresión inmediata (tokens al expirar; hash de password al cierre)» (08:445).
- Toda supresión se asienta en el registro de supresiones y se audita (08:453, 468, 642).
- R-01 y R-03 mandan «Suprimir/anonimizar salvo defensa de reclamos: conservar mínimo [PARÁMETRO — VJR] bloqueado» (08:444-446).
- El 06 exige preservar Identidad, Perfil propio e historia (06:2192-2193, 2442) y pide coordinarlo con el 08 (06:1578).

**Opciones.**
- **A.** En la transacción del cierre: suprimir el hash, asentarlo en un registro de supresiones mínimo (categoría, sujeto, fundamento R-02, ejecutor, momento) y auditarlo. Todo lo demás se preserva y queda fuera de toda superficie. La anonimización de R-01/R-03 se difiere hasta que la VJR fije los plazos.
- **B.** Anonimizar además el identificador local en el mismo acto.

**Provisorio en código.** A, completa: el registro de supresiones y la auditoría (`SUPRESION`, recurso `CredencialLocal`, fundamento R-02) se escriben en la misma transacción del cierre. La auditoría se agregó por un hallazgo de la revisión adversarial del 2026-09-19. Las filas de sesión revocadas se conservan sin el token (el token nunca se persiste), y su purga por R-02 se difiere.

**Condición de cierre.** Los plazos VJR de R-01, R-03 y R-06 y la coordinación 06↔08.

## DL-020 — Suspensión y restablecimiento sin caso de uso ni operación

**Prioridad:** media · **Documento:** 06 §5.7.4 · 05 · 09 · 08 §25 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El actor de SuspenderCuenta y RestablecerCuenta es el «habilitado por la política de 08» (06:2145-2146).
- No hay UC en el 05 ni operación en el 09.
- Una operación administrativa exige MFA (08:580).

**Opciones.**
- **A.** Transiciones solo en el dominio y en un servicio interno, sin endpoint, ejercitadas por pruebas.
- **B.** Endpoint administrativo, que requiere rol, MFA y acta.

**Provisorio en código.** A.

**Condición de cierre.** Exista un UC administrativo aprobado.

## DL-021 — Actos A1/A2 y datos del alta fuera del modelo del 06

**Prioridad:** media · **Documento:** 08 §12.2, §12.4 · 06 §5.4.2, REG-06-24 · **Estado:** ABIERTA

**Qué dice el legajo.**
- El 06 no modela A1, A2 ni A3; su único consentimiento es el B2 por vínculo (06:3127-3137).
- El 08 exige evidencia por acto, con estado VIGENTE/REVOCADO, y declara TERMINOS «Revocable: Cierre de cuenta» (08:374, 390).
- REG-06-24 no incluye esa revocación entre los efectos del cierre.
- `registrationIntent` está en el contrato (09v8:152-157), pero no en la estructura de Identidad (06:1969-1984).

**Opciones.**
- **A.** Tabla `ActoRegistrable` según la taxonomía del 08, inmutable salvo la transición `VIGENTE → REVOCADO`. El cierre revoca A1 con un evento `ActoRevocado`. `registrationIntent` vive en el evento `IdentidadCreada`.
- **B.** Que el 06 incorpore A1/A2 a la estructura de Identidad y liste la revocación de A1 en REG-06-24.

**Provisorio en código.** A.

**Condición de cierre.** El 06 reconcilia su modelo con el 08 §12.4.

## DL-022 — Canal o superficie sin campo contractual

**Prioridad:** baja · **Documento:** 08 §12.2 · 05:14247 · 05:15920 · 09v7 T12 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La evidencia de A1 y A2 y la auditoría de sesión exigen el «canal/superficie» (08:374; 05:14247).
- ACC-01 y ACC-02 no tienen ese campo, y el schema estricto rechaza campos desconocidos.

**Opciones.**
- **A.** Header opcional `X-BE-Surface: WEB|APK`. Es un cambio «normalmente compatible» (09v7 T19). Se registra como procedencia declarada y nunca autoriza.
- **B.** Inferir la superficie en el servidor a partir del proxy.

**Provisorio en código.** A. Si el header falta, la superficie se registra como no declarada (`null`), no como un valor inventado.

**Condición de cierre.** El 09 incorpora el header o un campo equivalente.

## DL-023 — Alta por invitación y declaración de mayoría de edad

**Prioridad:** media · **Documento:** 08 §24.3 y §24.7 · 04 RF-001 · 09v8 ACC-01 · **Estado:** ABIERTA

**Qué dice el legajo.**
- «Alta del asesorado por invitación con token de un solo uso» (08:568), frente a RF-001: «crear una cuenta propia» (04:94).
- «el alta requiere declaración de fecha de nacimiento/mayoría de edad» (08:572), que es condición del gate §42-22 (08:852). ACC-01 no tiene ese campo, y el gate «no necesita cumplirlo para la demo sintética» (08:864).

**Opciones.**
- **A.** Autorregistro abierto, sin declaración de edad, mientras los datos sean sintéticos.
- **B.** Implementar ahora la invitación y la declaración de edad, con campos no contratados.

**Provisorio en código.** A.

**Condición de cierre.** Antes de cualquier dato real (gate 08 §42), el 09 incorpora los campos y el 10 las pantallas.

## DL-024 — Desvíos de copy y de UI

**Prioridad:** baja · **Documento:** 10-B02 · 10-ADD · 10-B01 · **Estado:** ABIERTA

| Desvío | Copy del 10 | Qué se implementa | Motivo |
|---|---|---|---|
| Registro no disponible | «…Podés intentar iniciar sesión o recuperar el acceso.» (10-B02:159-162) | «…Podés intentar iniciar sesión.» | La recuperación está fuera de alcance; «ningún flujo declara éxito sin confirmación» (05:843) |
| Cuenta sin A3 | «…revisá y autorizá el tratamiento correspondiente.» (10-B02:341-343) | Copy literal, **sin CTA** | Otorgar A3 está fuera de alcance |
| Cierre | Copy literal de 10-ADD:75-86 | Se agrega: «El cierre no se puede deshacer.» | 08:436: «la reapertura queda no ofrecida en MVP», y el titular debe estar informado |
| Intención de registro | El 10 la pide «cuando corresponda» (10-B02:117) | La UI registra solo ADVISEE; la API acepta ambos valores por contrato | El onboarding profesional está fuera de alcance (10-B01:935-958) |

**Opciones.**
- **A.** Mantener estos desvíos hasta que existan las capacidades.
- **B.** Corregir el 10 para reflejarlos.

**Condición de cierre.** Existen las capacidades (recuperación y A3) o se corrige el 10.

## DL-025 — Superficie web del asesorado

**Prioridad:** baja · **Documento:** 05:1021 · 10-B01:82-96, 722-771 · 04:148-149 · **Estado:** ABIERTA

**Qué dice el legajo.**
- La superficie del asesorado es el APK; el website es «profesional/administrativo» (05:1021).
- El 10 no define una ruta de Cuenta web para el asesorado.
- WP-02 exige el recorrido completo en los dos canales.

**Opciones.**
- **A.** Identidad y sesión como recorridos transversales, con la ruta web neutral `/account` (no `/dashboard`, `/pro` ni `/admin`). Después del login se aterriza en Cuenta, que funciona como configuración segura (10-B02:525).
- **B.** Cuenta y cierre solo en el APK.

**Provisorio en código.** A.

**Condición de cierre.** El 10 define la jerarquía web de identidad.

## DL-026 — Idempotencia y códigos no definidos

**Prioridad:** media · **Documento:** 09:253-262 · 09v7 T07 · 09v8 ACC-01 · **Estado:** ABIERTA

**Qué dice el legajo.**
- ACC-01 y ACC-P1-03 marcan `Idempotency-Key` como «required», pero no se define el error cuando falta.
- El namespace es «{actor autenticado × operación}» (09:259-261), y ACC-01 es PUBLIC.
- No se define la respuesta para una key en vuelo concurrente.
- No se define el código para un identificador o una credencial inválidos.

**Opciones.**
- **A.** Cinco reglas:
  1. Key ausente → `400 INVALID_REQUEST` con `details.header`.
  2. Namespace de las operaciones PUBLIC: `operación × key`.
  3. La huella excluye la credencial: nunca se guarda nada derivado de la contraseña salvo su hash bcrypt.
  4. Una key en vuelo se serializa en la base: el índice único bloquea hasta que la primera termina, y después se hace replay.
  5. Datos inválidos → `400 INVALID_REQUEST` con `issues`.
- **B.** Códigos nuevos (`IDEMPOTENCY_KEY_REQUIRED`, `VALIDATION_FAILED`).

**Provisorio en código.** A. Los registros de idempotencia no se purgan en WP-02.

**Condición de cierre.** El 09 fija esos códigos y el TTL de retención.

## DL-027 — Oráculos de prueba ausentes en 11A y traza de UC-P26

**Prioridad:** baja · **Documento:** 11A:257-294, 519-535 · 12:227 · 05:14230 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Los TEST-AUTH son títulos de una línea sin oráculo.
- Los oráculos de TEST-RNF figuran como «NOT VERIFIED — texto no extraído».
- UC-P26 se traza a RF-002/005/006 en 11A y el 12, y a RF-002/006/007 en el 05.

**Opciones.**
- **A.** Los oráculos de WP-02 se derivan del texto normativo citado en cada prueba y se declaran en `DEFENSA/WP-02.md`.
- **B.** Dejar esas pruebas como BLOCKED_BY_SOURCE.

**Provisorio.** A.

**Condición de cierre.** 11A incorpora los oráculos.

## DL-028 — Textos A1, A2, A3 y consecuencias del cierre: sintéticos

**Prioridad:** alta (antes de datos reales) · **Documento:** 08 R-08-05, §42-1, §12.1 · **Estado:** ABIERTA

**Qué dice el legajo.**
- Los textos legales no existen: «Alta (hoy no existen)» (08:931).
- El gate §42-1 los exige antes de datos reales.
- La evidencia exige el id y el hash de la versión mostrada (08:374).

**Opciones.**
- **A.** Textos sintéticos versionados, con id y hash, marcados «texto de demostración, no es texto legal». Viven en `@be/domain` y se siembran por migración.
- **B.** Esperar los textos definitivos.

**Provisorio en código.** A. La API rechaza cualquier versión distinta de la vigente con `422 TERMS_VERSION_NOT_ACCEPTABLE` o `422 PRIVACY_VERSION_NOT_ACCEPTABLE`.

**Condición de cierre.** Textos legales aprobados (VJR).

## DL-029 — Logout idempotente frente a AuthN SESSION

**Prioridad:** baja · **Documento:** 09v8:397-427 (ACC-03) · 09v7 T14 · **Estado:** ABIERTA

**Qué dice el legajo.**
- API-ACC-03 declara AuthN `SESSION` (09v8:397-427). 09v7 T14 define `SESSION` como «Sesión activa y cuenta operativa».
- La misma ficha dice que «repetir después de una pérdida de respuesta es semánticamente idempotente».

**Por qué no se puede tal cual.** Si ACC-03 exigiera una sesión activa, el reintento de un logout que ya se aplicó (se perdió la respuesta) respondería 401. El cliente no sabría si su sesión quedó cerrada, y la idempotencia que pide la misma ficha no se cumpliría.

**Opciones.**
- **A.** ACC-03 reconoce el token (firma válida, sesión existente del mismo titular, aunque esté vencido) y responde 204 aunque la sesión ya no esté activa. Sin token o con uno irreconocible, 401. El no-op no se audita como éxito.
- **B.** AuthN `SESSION` estricta: 401 si la sesión no está activa, y el cliente trata ese 401 como «sesión ya cerrada».

**Provisorio en código.** A (`SesionService.finalizarActual`). El 204 de una sesión que ya no estaba activa queda en la auditoría como `RECHAZO` con motivo `SESION_YA_NO_ACTIVA`, nunca como éxito (hallazgo de la revisión adversarial, 2026-09-19). El OpenAPI declara los 401 reales de la operación.

**Condición de cierre.** El 09 define el AuthN del logout idempotente.

## DL-030 — Detrás del rewrite del website, la API no ve la IP del cliente

**Prioridad:** media · **Documento:** 07 CAND-07-J opción C (07:704-705) · 08 §12.2 (evidencia del acto: IP y user-agent) · 08 §38 (límites por IP) · **Estado:** ABIERTA — decisión de Dirección

**Qué dice el legajo.**
- El website entra a la API «por el proxy del Web BE (same-origin, sin CORS)». En WP-01, con el export estático (DL-007), ese proxy es el rewrite `/api/*` del sitio estático de Render.
- La evidencia de cada acto registra IP y user-agent (08 §12.2).
- Los límites de intentos son por IP, y por cuenta + IP (08 §38).

**Qué se midió (2026-09-19, ambiente `test`, IPv4 forzado).** Evidencia en `EVIDENCIA/WP-02/medicion-ip-proxy.txt`.
- **A. Directo:** 5 logins fallidos contra un identificador inexistente dan 401 y el 6.º, 429. Un 7.º intento por el rewrite, con el mismo identificador, da **401**: la API lo ve desde otra red.
- **B. Por el rewrite:** 6 logins fallidos contra otro identificador dan **seis 401** y ningún 429. Las requests llegan desde **varias** direcciones del proxy (un pool), no desde una sola.
- **Registro:** después de agotar el cupo directo (429), un registro por el rewrite dio 201.

**Por qué no se puede tal cual.** Con el rewrite, lo que la API ve como IP del cliente es la del proxy:
- la IP que queda como evidencia de A1/A2 en los registros web es del proxy, no de la persona;
- los cupos «por IP» y «por cuenta + IP» se diluyen en el tamaño del pool.

Confiar en más saltos de `X-Forwarded-For` no sirve: la API también recibe tráfico directo (el APK), y ahí el cliente podría falsificar esa cabecera.

**Opciones.**
- **A.** Mantener el rewrite (07 CAND-07-J C) y compensar:
  - un cupo por identificador que no depende de la red (20 cada 15 min, neutral: también para identificadores inexistentes). Acota el ataque a una cuenta desde el pool;
  - declarar que la IP de la evidencia de los actos web es la del proxy.
  - Costo: el *password spraying* contra muchas cuentas por el website queda limitado solo por el pool, y la evidencia web no identifica la red de la persona.
- **B.** El website llama a la API directo (CORS). La API ya admite ese origen (`CORS_ALLOWED_ORIGINS`, WP-01), así que la API vuelve a ver la IP real y los cupos quedan iguales para las dos superficies.
  - Cambios necesarios: `connect-src` de la CSP y la URL de la API en el build del website.
  - Se aparta de «same-origin, sin CORS» de CAND-07-J C.

**Provisorio en código.** A: `loginPorIdentificador` en `SesionService.iniciar`, con prueba en `sesiones.int-spec.ts` que simula un pool con `X-Forwarded-For`. No cambia la arquitectura del 07; B queda como recomendación para Dirección.

**Condición de cierre.** Dirección elige A o B. Si elige B, el 07 registra el desvío de CAND-07-J C.
