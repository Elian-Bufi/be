# DECISIONES_TECNICAS — BE

> Qué versión se eligió de cada cosa, por qué, y con qué evidencia. Verificado contra el registro npm y la documentación oficial el **2026-09-16**; ninguna versión se tomó de memoria.
> Cuando una decisión se aparta del legajo, la entrada remite a `docs/DEUDA_LEGAJO.md`.

## 1. Versiones

| Componente | Elegida | Vigente al 2026-09-16 | Motivo |
|---|---|---|---|
| Node | **22.23.2** (LTS «Jod») | línea 22: 22.23.2 · existe 24 | WP-01 fija 22 LTS. Declarado en `engines` (`>=22.12.0 <23`), `.nvmrc`, imagen `node:22.23.2-bookworm-slim`, `NODE_VERSION: "22"` del sitio estático (Render resuelve la última 22.x) y `node` de `eas.json`. `engine-strict=true` hace fallar la instalación con otro Node. 07 §34 dice Node 20 → DL-002. |
| npm | 10.9.8 | incluido con Node 22.23.2 | `packageManager` declarado; un solo lockfile (workspaces). |
| NestJS | **11.2.5** | línea 11: 11.2.5 · existe 12.0.3 | Última estable de la línea 11, como pide WP-01. `@nestjs/core`, `common`, `platform-express`, `testing` en la misma versión. |
| Prisma | **6.19.3** | línea 6: 6.19.3 · existe 7.x | Última estable de la línea 6. CLI y cliente en la misma versión exacta; la CLI va como dependencia de producción porque el contenedor ejecuta `migrate deploy`. |
| Next.js | **15.5.25** | etiqueta `backport` de la línea 15.5 · `latest` es 16.3.5 | WP-01 exige ≥ 15.5.24 por `GHSA-p293-qw3h-jr36` y `GHSA-2xp9-vwfh-vxw4`. Se queda en 15.5 (el 07 analizó esa línea y CAND-07-J se escribió sobre ella); pasar a 16 cambia de versión mayor sin necesidad para una pantalla estática. |
| React (web y mobile) | **19.2.3** | la que fija Expo SDK 57 | Un solo React en el monorepo: web usa la misma versión que Expo para evitar copias duplicadas. |
| PostgreSQL | **16** | Render ofrece 13–18 (18 por defecto) | WP-01 fija 16 y coincide con el harness `postgres:16-alpine`. 07 §21 apunta a la mayor soportada → DL-002. |
| Expo SDK | **57** (`expo` 57.0.23) | `latest` 57.0.23 | SDK estable vigente; versiones tomadas de la plantilla oficial `create-expo-app` (react-native 0.86.3, TypeScript 6.0.3). |
| EAS CLI | 24.6.0 | `latest` 24.6.0 | Fijada en `eas.json` (`>= 24.6.0`) y en el workflow `apk.yml`. |
| TypeScript (api, web, domain) | **5.9.3** | `latest` 7.0.2 · línea 5: 5.9.3 | TS 7 es el compilador nativo nuevo; ts-jest y los decoradores de NestJS dependen de la API de TS 5. Mobile usa 6.0.3 porque lo fija Expo SDK 57. |
| Jest / ts-jest | 30.5.1 / 29.4.12 | vigentes | Pruebas unitarias de la API y harness de integración. Domain usa `node:test` (sin dependencias). |
| Testcontainers | 12.1.0 | vigente | Mismo enfoque que el harness de `be-health`, con teardown explícito del contenedor. |
| helmet | 8.3.0 | vigente | Cabeceras de seguridad de la API (07 §29, 08 G-10). |
| GitHub Actions | `checkout@v7`, `setup-node@v7` | v7.0.1 / v7.0.0 | Últimas mayores publicadas. |
| zod (WP-02) | **4.6.5** | `latest` 4.6.5 | Contratos HTTP como schemas compartidos por API, website y APK, y OpenAPI 3.1 generado con `z.toJSONSchema` (09v7 T21). Vive como dependencia de `@be/domain`, anidada: la raíz ya tiene zod 3 por otra dependencia. Por eso el Dockerfile copia `packages/domain/node_modules` y el bundle del APK se verificó con `expo export` + sourcemap. |
| @node-rs/bcrypt (WP-02) | **1.10.9** | `latest` 1.10.9 | 08 §24.2: «bcrypt costo 10, se conserva como mínimo». Binario nativo precompilado (`linux-x64-gnu` en la imagen Debian), sin toolchain en el build. Verificación contra un hash señuelo cuando no hay credencial, para que el tiempo del login no revele si la cuenta existe (TEST-AUTH-001). |
| jsonwebtoken (WP-02) | **9.0.3** | `latest` 9.0.3 | Token corto HS256 con `sid`/`sub`/`tv`, algoritmo fijo en la verificación. El token solo identifica la fila de sesión: la verdad está en la base (08 §26.1; DL-012). |
| expo-crypto (WP-02) | **57.0.3** | la que fija Expo SDK 57 | Hermes no trae `crypto.randomUUID`: las Idempotency-Key del APK salen de un generador criptográfico nativo. |
| Actions: upload-artifact (WP-02) | `v4` | vigente | Publica los resultados de integración por ID de prueba como artefacto de cada run (evidencia de WP-02). |

## 2. Seguridad de dependencias — `npm audit --omit=dev`

Primera instalación: **api 6 altos**, **web 1 alto**, mobile 10 moderados, domain 0. Ningún crítico. Los altos se resolvieron **antes de desplegar** con `overrides` en el `package.json` raíz, sin saltar de versión mayor en NestJS, Prisma ni Next:

| Paquete vulnerable | Llega por | Advisory | Override | Por qué es seguro |
|---|---|---|---|---|
| `multer` 2.2.0 | `@nestjs/platform-express` 11.2.5 | GHSA-wc9g-mqfw-jrwm, GHSA-qfvm-cv95-jqjf, GHSA-qvfw-j98x-7q72, GHSA-535w-7cp7-47q4 | **2.4.0** | Misma mayor. npm reportaba también `@nestjs/core` y `platform-express` como altos solo por esta cadena. La API no expone subida de archivos. |
| `deepmerge-ts` 7.1.5 | `prisma` → `@prisma/config` 6.19.3 | GHSA-ggr8-5vv4-36mx (agotamiento de pila con grafos recursivos) | **8.0.2** | Solo lo usa la CLI de Prisma para leer configuración. Verificado después del override: `prisma validate`, `generate`, `migrate diff` y `migrate deploy` (CI) funcionan. |
| `postcss` 8.4.31 | `next` 15.5.25 | GHSA-qx2v-qp2m-jg93, GHSA-6g55-p6wh-862q, GHSA-fxqj-rqcc-2cmp, GHSA-r28c-9q8g-f849 | **8.5.28** | Misma mayor; es la versión que ya usa Expo en el mismo árbol. `next build` verificado. |

Resultado final (`EVIDENCIA/WP-01/npm-audit-omit-dev.txt`): **api 0 · web 0 · domain 0 · mobile 10 moderados, 0 altos, 0 críticos.** Los 10 moderados son una sola cadena: `uuid < 11.1.1` (GHSA-w5hq-g745-h8pq) usado por `xcode`, la herramienta de generación de proyectos iOS de `@expo/config-plugins`. Corre en tiempo de build y no llega al APK. La única corrección disponible es `--force` hacia versiones incompatibles del SDK, así que se acepta y se revisa en cada actualización del SDK.

CI falla si aparece un alto o crítico (`npm run audit:prod`, `--audit-level=high`).

## 3. Arquitectura de despliegue (ambiente `test`)

| Tema | Decisión | Fuente / motivo |
|---|---|---|
| Plataforma | Render, región **Frankfurt**, plan gratuito | 07 §31 Q-008 «Render-first». Tier gratuito admisible con datos sintéticos (07 §26-bis). |
| Ambiente | `APP_ENV=test`; sin staging | 07 §26. Ningún dato real (08 §33). |
| API | Imagen OCI multi-stage (`apps/api/Dockerfile`) | 07 §34: el Dockerfile es la definición ejecutable del runtime. |
| Migraciones | `prisma migrate deploy` como **primera fase del arranque del contenedor**; si falla, el proceso termina y el deploy se cancela | 07 §36 pide pre-deploy, pero el plan gratuito de Render no lo ofrece → DL-006. |
| Readiness gate | `healthCheckPath: /health/ready`: base (SELECT 1, 2 s) + migraciones embebidas aplicadas | 07 §30. Render cancela el deploy si la instancia nueva no pasa el health check. |
| Health | `/health/live`, `/health/ready`, `/health` (alias), fuera de `/api/v1` | 07 §30 y §13.2 → DL-004. Exponen `ambiente`, `version.aplicacion`, `version.commit` (`RENDER_GIT_COMMIT`) y `version.construidoEn`. Un dato desconocido se declara `null`. |
| Disparo | `autoDeployTrigger: checksPass` sobre `main` (API y web) | 07 §36: `test` se despliega automáticamente después de que pasa la CI. `production` no existe todavía; su promoción será manual. |
| Base de datos | Render Postgres 16 gratuito, `ipAllowList: []` (sin acceso externo) | 07 §29: allowlist cerrada. **Expira a los 30 días** (creada ~2026-09-16 → ~2026-10-16, con 14 días de gracia): alcanza para la entrega del 2026-10-01; recrearla o pasar a plan pago antes de la defensa si es posterior. |
| Website | Render Static Site con export estático de Next. Desde WP-02 llama a la API **directo, con CORS** (`BE_API_BASE_URL` en el build); ya no hay rewrite `/api/*` | 07 CAND-07-J: se pasó de la opción C a la **B** («export estático + CORS»), invocando su cláusula «salvo necesidad». La necesidad es 08 §12.2: detrás del rewrite de la opción C, la API no veía la IP real que la evidencia de A1/A2 necesita. Decisión de Dirección (DL-030); sin segundo runtime Node (DL-007). Cabeceras HSTS, CSP, X-Frame-Options y nosniff en `render.yaml`. La CSP incluye `'unsafe-inline'` para scripts porque el export estático de Next usa scripts inline; se endurece con hashes cuando haya funcionalidad. |
| APK | EAS Build, perfil `test`, `buildType: apk`, distribución directa | 07 §34/§35. Build por tag `apk-v*` o manual (`apk.yml`), no en cada push. Versión, ambiente y commit visibles en la pantalla (TEST-APK-008). |
| Permanencia del APK | Copia durable en un release de GitHub, además del artefacto de EAS | Los artefactos de EAS del plan gratuito expiran a los 14 días. El primer build (`d2159ebc`, commit `1651720`) expiraba el 2026-10-01, día de la entrega, y embebía un `API_BASE_URL` de un servicio ajeno: se reemplazó. El segundo (`f87fc552`, commit `4c4c9c7`) quedó con su release en el repositorio archivado. El **vigente** (`70c97eed`, commit `fd3ed53`, SHA-256 `a0d5daa4…`) se construyó desde el historial final, así que su commit existe en el repositorio público. Está publicado como release `be-apk-0.1.0` del repositorio público, que no expira; el artefacto de EAS vence el 2026-10-02 17:43 UTC. |
| URLs de Render | `be-api-hndp.onrender.com`, `be-web-1ngj.onrender.com` | Los subdominios `onrender.com` son globales y `be-api`/`be-web` ya eran de terceros. La URL de la API queda en `render.yaml` (`BE_API_BASE_URL` y `connect-src` de la CSP de be-web) y en `API_BASE_URL` de `eas.json`. La del website, solo en `CORS_ALLOWED_ORIGINS`. El 2026-09-18 el Blueprint se recreó sobre el repositorio nuevo: adoptó `be-api` y `be-db-test` (URL intacta) y creó un `be-web` nuevo (`izpg` → `1ngj`). Detalle en `docs/DESPLIEGUE.md`. |
| HSTS del website | La cabecera la fija Render para `*.onrender.com` (`max-age=315360000; includeSubdomains; preload`) | Prevalece sobre la de `render.yaml` y es más estricta. Las demás cabeceras (CSP, XFO, nosniff, Referrer-Policy) son las de `render.yaml`. |
| Secretos | Ninguno en el repositorio. `DATABASE_URL` la inyecta Render; `EXPO_TOKEN` va en GitHub Actions Secrets | 08 §32, 07 §28. |
| Logs | JSON por request: `requestId`, método, ruta parametrizada, status y duración; sin IP, user-agent ni cuerpos | 07 §41, 08 §30. `X-Request-Id` en toda respuesta (09 CAND-09-T17). |

## 4. Schema inicial

> **WP-02 (2026-09-18)** completó la estructura de Identidad BE (DL-003) con la migración aditiva `20260918200000_identidad_y_sesiones`: Perfil propio 1:1, método de acceso con índice único `(tipo, referencia)`, credencial, sesión, control de sesión, actos A1/A2/A3, eventos, solicitud de cierre, supresiones, auditoría e idempotencia. Los triggers de la base rechazan toda transición no declarada y todo UPDATE/DELETE/TRUNCATE sobre la historia. Detalle en `docs/paquetes/WP-02.md` y `DEFENSA/WP-02.md`. Lo que sigue describe WP-01.

- **Modelos:** solo `Identidad` (T-06-01), con `estadoOperativoDeCuenta` (enum `EstadoOperativoDeCuenta` = `OPERATIVA | SUSPENDIDA | CERRADA`, T-06-02) y el par `momentoDeOcurrencia` (anulable) / `momentoDeRegistro` (obligatorio), T-06-24.
- **Nombres del 06:** el modelo en Prisma usa camelCase y la base snake_case (`@map`), con el término del 06 completo en ambos lados.
- **Identificador:** UUID generado por la base (`gen_random_uuid()`). Estable y no autonumérico (T-06-N04).
- **Transiciones:** la lista blanca de 06 §5.7.4 está declarada en `@be/domain` y probada. La aplicación de transiciones con sus eventos (§5.7.5) llega con el módulo M-01.
- **Sin seed de Identidad:** crear una fila violaría `INV-06-22` sin Perfil propio → DL-003.
- **Índices parciales de `be-health`:** los cinco de `20260611114430_partial_indexes_eventosalud` quedan como referencia para los módulos de plan, proceso y solicitud. Ninguno aplica a `Identidad`.

## 5. Estructura y herramientas

- **Monorepo con npm workspaces:** `packages/domain`, `apps/api`, `apps/web`, `apps/mobile`. Un único lockfile es la fuente de versiones reales.
- **`.gitattributes`:** `docs/**` se guarda con `-text` para que ningún clon (ni con `core.autocrlf=true` en Windows) altere los bytes del legajo. Verificado con un clon limpio: 208/208 hashes OK.
- **Identidad visual:** no hay logo oficial en la entrega de Dirección. Se usa el wordmark tipográfico «BE» de la portada DV-01, en azul `#1F5BC4`, hasta que se provea el logo oficial.
- **Paquete Android:** `com.elianbufi.be`, provisorio; cambiarlo después de la primera instalación obliga a desinstalar la app.

## 6. Limitaciones conocidas del entorno local

- **Docker Desktop no arranca en la máquina de desarrollo** («Docker Desktop is unable to start»). Por eso el smoke de la imagen corre en GitHub Actions, que es donde tiene que pasar para que Render despliegue. Desde WP-02, las pruebas de integración también corren en local contra un PostgreSQL 16 real sin Docker: `TEST_DATABASE_URL` apunta a una instancia local (el setup la rechaza si no es `localhost`) y se le aplica `migrate deploy`, igual que en CI. En CI siguen con Testcontainers.
- El plan gratuito de Render apaga la API después de 15 minutos sin tráfico: la primera respuesta puede tardar alrededor de un minuto. Antes de una demo, hay que abrir `/health/ready` unos minutos antes.

## 7. Publicación del repositorio (2026-09-18)

**Exposición previa.** El repositorio estuvo público entre las **05:09 y las 05:29 UTC del 2026-09-18** (unos 20 minutos) antes de la auditoría. Se volvió a privado apenas se detectaron los hallazgos.

**Auditoría del historial completo** (9 commits, 297 versiones de archivo, todas las ramas, tags y refs de PR, metadatos de binarios, APK publicado, PRs, release y logs de Actions):

| Categoría | Resultado |
|---|---|
| Credenciales y secretos | **Ninguno real.** Solo `be_test_sintetico`, la clave del PostgreSQL efímero de la CI (existe solo dentro del runner). En los logs, GitHub enmascara las credenciales de URL (`***`). |
| Email personal del autor | En los 9 commits (autor y committer) → **reemplazado** |
| Datos de terceros | Solo en `docs/fuente_escolar/Entregables.pdf`: nombre del redactor en los metadatos y un email institucional en el texto → **retirado** |
| Resto de `docs/` (legajo, actas, mesa) | Revisado buscando nombres, emails, teléfonos, DNI/CUIL, IPs, perfiles, firmas y testimonios: solo datos sintéticos (`*.demo@be.test`, «Juan Pérez» como ejemplo de copy, alias `DEMO-*`), roles («aprobado por Dirección») y el autor del proyecto |
| Menores, que se mantienen | El usuario de Windows del autor en dos rutas de `docs/intake/INTAKE_01.md` (archivo del manifiesto; dato propio). `i@izs.me` en los logs de CI: dirección pública del mantenedor de `glob`, que aparece dentro del aviso de deprecación que imprime npm. |

**Qué se hizo:**

1. **Historial reescrito** (`git filter-branch`): el email personal pasó a `190213429+Elian-Bufi@users.noreply.github.com` y `Entregables.pdf` salió de todos los commits. Contenido, fechas y mensajes quedaron idénticos. Cambiaron todos los SHA:

   | Antes | Después | Commit |
   |---|---|---|
   | `67dfac3` | `747fe11` | docs: publica el legajo BE verificado por SHA-256 |
   | `c495c27` | `7155542` | feat(wp-01): monorepo desplegable |
   | `51f981c` | `4661dee` | fix(ci): YAML del paso del legajo |
   | `1651720` | `1658271` | merge WP-01 (#1) |
   | `dd26062` | `3ecc8e0` | chore(mobile): projectId de EAS |
   | `4c4c9c7` | `84e86cd` | fix(deploy): URLs reales de Render |
   | `6de82e1` | `5d29a4e` | merge URLs reales (#2) |
   | `2c0db67` | `cd29e52` | docs(wp-01): cierre |
   | `6feaa1e` | `50ce789` | merge cierre (#3) |

2. **Repositorio nuevo.** Un force-push no alcanzaba: GitHub conserva los commits originales en los PR #1–#3, que no se pueden reescribir. El repositorio original se **renombró a `be-archivo-wp01`, quedó privado y archivado**, y conserva los PR, los logs de Actions y el primer release. **No se publica nunca.** `Elian-Bufi/be` se recreó con el historial limpio.
3. **Manifiesto.** `docs/MANIFEST.sha256` no se modifica, porque es la entrega de Dirección. `scripts/verificar-legajo.sh` verifica las 207 entradas publicadas y excluye solo las rutas de `docs/MANIFEST_NO_PUBLICADOS.txt`. Falla si alguna de ellas vuelve a aparecer versionada.
4. **Commits futuros.** El repositorio local usa `user.email` noreply. `docs/fuente_escolar/*.pdf` está en `.gitignore`.

**Riesgo residual.** Durante los 20 minutos de exposición, cualquiera pudo clonar el repositorio o leer el email desde la API. Eso no se puede deshacer. La probabilidad es baja (el repositorio era nuevo y sin tráfico) y el dato expuesto es el email del propio autor.

**Regresión y decisión final (2026-09-18).** En el repositorio recreado, el merge del PR #1 (`960d1d2`) se hizo con `gh pr merge`. GitHub firma los merges web con el email de la cuenta, así que ese commit volvió a tener el email personal del autor, y el PR lo referencia de forma permanente. Se evaluaron tres salidas: repositorio espejo privado para Render, repositorio y Blueprint nuevos, o publicar tal cual. **Dirección decidió publicar tal cual**: el email del autor queda visible solo en ese merge commit. Antes de publicar se repitió la auditoría sobre los 16 commits y los 323 blobs del repositorio: sin credenciales, sin el PDF y sin datos de terceros. Medida para que no se repita: todos los merges se hicieron en local con el email noreply (`eaf785c`, `fd3ed53`). **Cierre (2026-09-19):**
- Dirección activó «Keep my email addresses private» y la protección de `main` (ACTA-DIR-034 §5): PR obligatorio sin aprobaciones requeridas, los cuatro checks de CI, rama al día y sin excepción para administradores.
- Desde entonces los PR se integran desde GitHub, con autor noreply (verificado en el merge #15).

## 8. Autorización y concurrencia (WP-03, 2026-09-19)

Detalle y ubicación de cada garantía en `DEFENSA/WP-03.md`.

- **Un solo PDP, sin caché:** `PdpService.decidirPorAlcance`, invocado por `PdpGuard` en toda operación protegida. Las siete dimensiones de RF-021 se evalúan con una función pura de `@be/domain` sobre hechos leídos en una sola sentencia, y cada decisión se registra en la misma transacción. Denegar es un 404 idéntico al de un recurso inexistente.
- **Orden único de bloqueos** (`apps/api/src/prisma/concurrencia.ts`): identidad → verificación y habilitación → solicitud → componente → consentimiento → A3.
  - Las escrituras usan `FOR NO KEY UPDATE`, que no choca con el `FOR KEY SHARE` de las claves foráneas.
  - El PDP toma las mismas filas en modo compartido, así que cada decisión queda antes o después de cada corte.
  - El corte y la decisión llevan la hora de la base (`clock_timestamp` o `statement_timestamp`), no la de llegada del request.
  - Un deadlock o una falla de serialización se reintentan hasta tres veces; si persisten, responden 409 de conflicto concurrente.
- **Máquinas en tres capas:** dominio, servicio con bloqueo y triggers. Además, un constraint trigger diferido exige que toda transición confirme con su hecho en la misma transacción. Identifica esas filas con `xmin = pg_current_xact_id()::xid`, porque el código no usa savepoints.
- **Sin deriva de Prisma:** las garantías que Prisma no modela (índices parciales, CHECK y triggers) viven en la migración, y las claves foráneas, también en `schema.prisma`. Una prueba de integración corre `migrate diff --exit-code` contra una base sombra propia. Una sombra acotada a un schema da diferencias falsas.
- **Siembra demo por identidad** (DL-036): `BE_DEMO_PROFESIONALES` lista identidades ya registradas, no correos, y la siembra solo prepara cuentas `@example.invalid`.
- **Límite de lecturas protegidas:** 120 por minuto por actor. Cada lectura registra decisiones que no se borran, y sin límite una cuenta podría llenar la base gratuita.
- **`Cache-Control: no-store`** en todas las respuestas de la API.
- **Build del APK:** `apk.yml` necesita `EXPO_TOKEN`; sin él, avisa y no construye. Un fallo ahí quedaría como check fallido en `main` y bloquearía el auto-deploy de Render, como pasó con `08cdd08` (PR #20). Mientras falte el secreto, el APK se construye con la CLI de EAS desde la máquina de Dirección.
