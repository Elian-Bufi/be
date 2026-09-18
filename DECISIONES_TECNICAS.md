# DECISIONES_TECNICAS — BE

> Qué versión se eligió de cada cosa, por qué, y con qué evidencia. Verificado contra el registro npm y la documentación oficial el **2026-09-16**; ninguna versión se tomó de memoria.
> Cuando una decisión se aparta del legajo, la entrada remite a `docs/DEUDA_LEGAJO.md`.

## 1. Versiones

| Componente | Elegida | Vigente al 2026-09-16 | Motivo |
|---|---|---|---|
| Node | **22.23.2** (LTS «Jod») | línea 22: 22.23.2 · existe 24 | WP-01 fija 22 LTS. Declarado en `engines` (`>=22.12.0 <23`), `.nvmrc`, imagen `node:22.23.2-bookworm-slim`, `NODE_VERSION` del sitio estático y `node` de `eas.json`. `engine-strict=true` hace fallar la instalación con otro Node. 07 §34 dice Node 20 → DL-002. |
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
| Website | Render Static Site con export estático de Next y rewrite `/api/*` → API | 07 CAND-07-J opción C (same-origin, sin segundo runtime Node) → DL-007. Cabeceras HSTS, CSP, X-Frame-Options y nosniff en `render.yaml`. La CSP incluye `'unsafe-inline'` para scripts porque el export estático de Next usa scripts inline; se endurece con hashes cuando haya funcionalidad. |
| APK | EAS Build, perfil `test`, `buildType: apk`, distribución directa | 07 §34/§35. Build por tag `apk-v*` o manual (`apk.yml`), no en cada push. Versión, ambiente y commit visibles en la pantalla (TEST-APK-008). |
| Permanencia del APK | Copia durable en un release de GitHub, además del artefacto de EAS | Los artefactos de EAS del plan gratuito expiran a los 14 días. El primer build (`d2159ebc`, commit `1651720`) expiraba el 2026-10-01, día de la entrega, y embebía un `API_BASE_URL` de un servicio ajeno: se reemplazó. El vigente (`f87fc552`, commit `4c4c9c7`) **expira el 2026-10-02 04:39 UTC**. El release `be-apk-0.1.0` conserva `be-0.1.0-4c4c9c7.apk` (SHA-256 `bac929a3…`). Si el repositorio sigue privado, esa URL exige sesión: hay que hacerlo público antes de la entrega o volver a construir el APK cerca de la defensa. |
| URLs de Render | `be-api-hndp.onrender.com`, `be-web-izpg.onrender.com` | Los subdominios `onrender.com` son globales y `be-api`/`be-web` ya eran de terceros. Las URLs reales quedan versionadas en `render.yaml` (rewrite, CORS) y en `eas.json`. |
| HSTS del website | La cabecera la fija Render para `*.onrender.com` (`max-age=315360000; includeSubdomains; preload`) | Prevalece sobre la de `render.yaml` y es más estricta. Las demás cabeceras (CSP, XFO, nosniff, Referrer-Policy) son las de `render.yaml`. |
| Secretos | Ninguno en el repositorio. `DATABASE_URL` la inyecta Render; `EXPO_TOKEN` va en GitHub Actions Secrets | 08 §32, 07 §28. |
| Logs | JSON por request: `requestId`, método, ruta parametrizada, status y duración; sin IP, user-agent ni cuerpos | 07 §41, 08 §30. `X-Request-Id` en toda respuesta (09 CAND-09-T17). |

## 4. Schema inicial

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

- **Docker Desktop no arranca en la máquina de desarrollo** («Docker Desktop is unable to start»). Por eso las pruebas de integración (Testcontainers) y el smoke de la imagen corren en GitHub Actions, que es donde tienen que pasar para que Render despliegue.
- El plan gratuito de Render apaga la API después de 15 minutos sin tráfico: la primera respuesta puede tardar alrededor de un minuto. Antes de una demo, hay que abrir `/health/ready` unos minutos antes.
