# DESPLIEGUE — ambiente `test`

> Runbook de WP-01, actualizado en WP-02 y WP-03. Arquitectura: 07 §26–§39. Decisiones: `DECISIONES_TECNICAS.md` §3. Desvíos: `DEUDA_LEGAJO.md` DL-006, DL-007, DL-008 y DL-030.
> **Solo datos sintéticos.** Render no recibe datos reales mientras G-Q008-1, G-Q008-2 y el gate 08 §42 estén abiertos.

## Flujo

```text
push / PR ─► GitHub Actions (ci.yml)
               ├─ legajo       sha256sum -c docs/MANIFEST.sha256
               ├─ verificar    typecheck · unit · build api/web · npm audit (altos/críticos = falla)
               ├─ integracion  PostgreSQL 16 real: schema vs 06 · identidad y sesiones (TEST-AUTH-*) · concurrencia ·
               │               contrato · readiness · migración fallida aborta → artefacto resultados-integracion.json
               └─ imagen-api   docker build · migrate deploy · /health/ready 200 con el SHA del commit ·
                               smoke e2e: registro A1+A2 → login → /me → A3 null → logout (JWT_SECRET efímero)
merge a main + checks OK ─► Render (autoDeployTrigger: checksPass)
               ├─ be-api   build imagen ─► arranque: prisma migrate deploy ─► node ─► readiness /health/ready ─► switch
               └─ be-web   npm ci + next build (export) ─► CDN
tag apk-v* o manual ─► apk.yml ─► EAS build perfil test ─► URL del APK   (requiere el secreto EXPO_TOKEN)
local, con sesión de EAS ─► npx eas-cli build --platform android --profile test ─► URL del APK ─► release be-apk-x.y.z
```

## URLs del ambiente `test`

| Servicio | URL |
|---|---|
| API | `https://be-api-hndp.onrender.com` (`/health`, `/health/live`, `/health/ready`) |
| Website | `https://be-web-1ngj.onrender.com` |
| APK | **vigente:** `https://github.com/Elian-Bufi/be/releases/download/be-apk-0.3.0/be-0.3.0-08cdd08.apk` (WP-03, release permanente; EAS `339436c0…` expira 2026-10-03) · anteriores: `be-apk-0.2.0/be-0.2.0-8256951.apk` (WP-02) y `be-apk-0.1.0/be-0.1.0-fd3ed53.apk` (WP-01) |

Los subdominios `onrender.com` son globales: `be-api` y `be-web` ya pertenecían a terceros, así que Render agrega sufijos. Qué depende de cada URL:

| Si cambia la URL de… | Hay que actualizar |
|---|---|
| la **API** (`be-api-hndp`) | en `render.yaml`, `BE_API_BASE_URL` y `connect-src` de la CSP de `be-web` (y el `destination` del rewrite `/api/*` mientras exista, DL-030); `API_BASE_URL` de `apps/mobile/eas.json` (con rebuild del APK) |
| el **website** (`be-web-1ngj`) | solo `CORS_ALLOWED_ORIGINS` de `be-api` en `render.yaml` |

**Historia del Blueprint (2026-09-18).** El Blueprint original quedó conectado al repositorio renombrado `be-archivo-wp01` y se desconectó. Dirección creó uno nuevo sobre `Elian-Bufi/be`, que **adoptó** `be-api` y `be-db-test` sin recrearlos (URL de la API y base intactas) y **creó** un `be-web` nuevo: `be-web-izpg` pasó a `be-web-1ngj`. Desde entonces `render.yaml` vuelve a sincronizarse solo con cada push a `main`.

## Alta inicial (una sola vez)

1. En Render: **New → Blueprint**, conectar el repositorio y elegir la rama `main`. Render lee `render.yaml` y crea `be-db-test` (Postgres 16, Frankfurt), `be-api` (Docker, Frankfurt) y `be-web` (sitio estático).
2. Si el sufijo de algún subdominio cambió, actualizar las URLs de la tabla anterior en `render.yaml` y `eas.json`.
3. En GitHub → Settings → Secrets → Actions: `EXPO_TOKEN` (token de expo.dev) para `apk.yml`.

## Variables de entorno de `be-api` (desde WP-02)

| Variable | Origen | Nota |
|---|---|---|
| `JWT_SECRET` | `render.yaml` → `generateValue: true` | Firma de sesión (≥ 32 caracteres). **Nunca se versiona.** Rotarlo invalida todas las sesiones. Sin ella, la API no arranca y el readiness gate cancela el deploy |
| `BCRYPT_COST` | opcional (por defecto 10) | 10 a 15. El hash señuelo toma el costo de los hashes guardados (DL-014) |
| `RATE_LIMIT_LOGIN_*`, `RATE_LIMIT_LOGIN_IP_*`, `RATE_LIMIT_LOGIN_ID_*`, `RATE_LIMIT_REGISTRO_*` | opcionales | `_MAX` y `_WINDOW_MS`. Por defecto: 5/15 min por red + identificador, 100/15 min por red, 20/15 min por identificador y 10/h de registro por red (DL-015, DL-030) |
| `TRUST_PROXY_HOPS` | opcional (por defecto 1) | Saltos de proxy confiables (el borde de Render). Website y APK llaman directo, así la IP que llega es la del cliente (DL-030) |

### Desde WP-03

| Variable | Origen | Nota |
|---|---|---|
| `BE_DEMO_PROFESIONALES` | `render.yaml` (no es secreto) | Profesionales demo que el servicio interno verifica y habilita al arrancar (DL-036). Formato `identidadId|ALCANCE|TIPO|Nombre visible`, separados por `;`. Solo con `APP_ENV` test o development, y solo prepara cuentas sintéticas (`@example.invalid`) |
| `SOLICITUD_DE_VINCULO_CADUCIDAD_DIAS` | opcional (por defecto 30) | 1 a 365. Caducidad perezosa de las solicitudes pendientes (DL-037) |
| `RATE_LIMIT_CONSULTA_PROTEGIDA_MAX` / `_WINDOW_MS` | opcionales (por defecto 120 por minuto) | Límite por actor de las lecturas protegidas (DSH-03, REL-06, CON-01). Cada una registra decisiones que no se borran |

### Cuentas profesionales demo (MESA-01 punto 14)

1. Registrar la cuenta por la API pública, como cualquier persona, con un correo `@example.invalid`. La contraseña va solo a `.env.cuentas-demo`, que git ignora.
2. Tomar su identificador BE (`GET /api/v1/me`).
3. Declararla en `BE_DEMO_PROFESIONALES` con un PR **solo de configuración** (DL-008).
4. La siembra corre al arrancar la API (`OnApplicationBootstrap`): después del deploy siguiente, o del próximo arranque en frío. Es idempotente.

Van por identidad y no por correo. Si se publicara un correo antes de registrarlo, alguien podría registrarlo y quedar verificado. Las dos cuentas actuales son DEMO-PN y DEMO-PT (`docs/mesa/MESA_01/ESTADO_PUNTOS_5_14_WP-03.md`).

### APK

`apk.yml` necesita el secreto `EXPO_TOKEN` en GitHub (alta inicial, paso 3). Sin él, el build falla al autenticarse; pasó el 2026-09-19. Mientras tanto, el APK se construye con la CLI de EAS desde la máquina de Dirección, con su sesión:

```bash
cd apps/mobile && npx eas-cli@24.6.0 build --platform android --profile test --non-interactive
```

El artefacto de EAS expira a los 14 días. Por eso el APK de cada paquete se publica como release permanente de GitHub (`be-apk-x.y.z`), con su SHA-256 en la evidencia.

**Pruebas de integración en local sin Docker:** `TEST_DATABASE_URL=postgresql://…@localhost:…/base npm run test:integration`. La base tiene que ser local (el setup lo verifica) y se le aplica `migrate deploy`, igual que en CI.

## Verificación posterior al deploy (07 §37)

```bash
curl -s https://be-api-hndp.onrender.com/health/ready   # 200, data.version.commit == SHA del merge
curl -s https://be-api-hndp.onrender.com/health/live    # 200
curl -sI https://be-web-1ngj.onrender.com/              # 200 + cabeceras HSTS/CSP
# DL-030: el build del website apunta a la API. La URL está en el JS de /login, no en el HTML.
c=$(curl -s https://be-web-1ngj.onrender.com/login | grep -o '/_next/static/chunks/app/login/page-[^"]*\.js' | head -1)
curl -s "https://be-web-1ngj.onrender.com$c" | grep -c 'be-api-hndp.onrender.com'   # ≥ 1
# DL-030, después de retirar el rewrite: /api/* en el website ya NO llega a la API (sin ErrorEnvelope ni X-Request-Id)
curl -si https://be-web-1ngj.onrender.com/api/v1/x | grep -ci 'x-request-id\|RESOURCE_NOT_FOUND'   # 0
curl -si -X OPTIONS -H "Origin: https://be-web-1ngj.onrender.com" -H "Access-Control-Request-Method: GET" \
  https://be-api-hndp.onrender.com/health/ready         # Access-Control-Allow-Origin: el website; con otro origen, ausente
```

Recorrido funcional de WP-02 contra el ambiente desplegado, con cuenta sintética: `scratchpad/capturas/capturas-wp02.mjs` (puppeteer-core con Edge). Captura cada paso (registro con A1/A2, login neutral, Cuenta con A3 no otorgado y cierre) y registra requests y status. Salida en `EVIDENCIA/WP-02/`.

La primera respuesta puede tardar alrededor de 30 segundos: el plan gratuito apaga la API después de 15 minutos sin tráfico. En el primer despliegue se midieron 23 s en frío y 0,5 s en caliente.

## Rollback (07 §39)

- **Aplicación:** Render → `be-api` → Events → deploy anterior → **Rollback**. No se revierte el schema: las migraciones son aditivas (expand→contract), y `/health/ready` acepta una base con migraciones más nuevas que el artefacto.
- **Migración fallida:** el contenedor nuevo termina antes de escuchar, no pasa `/health/ready` y Render cancela el deploy. La versión anterior sigue sirviendo, y la migración queda registrada como fallida en `_prisma_migrations`. Se corrige con una migración nueva; nunca `migrate reset` ni `db push` fuera de development (07 §38).
- **Website:** Render → `be-web` → Events → Rollback. **Desde DL-030**, un build anterior al PR #13 llama a `/api/v1` relativo y depende del rewrite. Las rutas del sitio estático son configuración del servicio, no del deploy, así que volver a un build así exige recrear primero el rewrite. Si no, conviene volver solo a builds posteriores al PR #13.
- **Integración a `main`** (desde 2026-09-19): `main` está protegida (ACTA-DIR-034 §5). Solo se integra por PR desde GitHub, con los cuatro checks en verde y la rama al día con `main` (`gh pr update-branch`). No hay excepción para administradores ni push directo.
- **Merge defectuoso** (ACTA-DIR-034 §12): `git revert -m 1 <sha-del-merge>` en una rama nueva → PR → CI verde → merge. El revert se despliega como cualquier cambio. Nunca `push --force`, `reset --hard` ni `commit --amend` sobre historia publicada.
- **Ensayo de rollback** (ACTA-DIR-034 §12): la parte 1, `git revert -m 1` de un merge publicado, se ejecutó el 2026-09-19 (PR #9 y #10). La parte 2, el rollback de la aplicación en el dashboard de Render (Dirección), también se ejecutó: `be-api` volvió a `4776fc5` sin reconstruir la imagen, y después Manual Deploy la llevó a `c94a320` (el último commit de `main`, mismo código que `23c9997`). Evidencia en `EVIDENCIA/ENSAYO-ROLLBACK/`.

## Límites del plan gratuito

- La API se apaga después de 15 minutos sin tráfico. Antes de una demo, abrir `/health/ready` unos minutos antes.
- `be-db-test` expira a los 30 días de creada, con 14 días de gracia.
- No hay pre-deploy command (DL-006).
