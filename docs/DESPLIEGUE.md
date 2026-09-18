# DESPLIEGUE — ambiente `test`

> Runbook de WP-01. Arquitectura: 07 §26–§39. Decisiones: `DECISIONES_TECNICAS.md` §3. Desvíos: `DEUDA_LEGAJO.md` DL-006, DL-007.
> **Solo datos sintéticos.** Render no recibe datos reales mientras G-Q008-1, G-Q008-2 y el gate 08 §42 estén abiertos.

## Flujo

```text
push / PR ─► GitHub Actions (ci.yml)
               ├─ legajo       sha256sum -c docs/MANIFEST.sha256
               ├─ verificar    typecheck · unit · build api/web · npm audit (altos/críticos = falla)
               ├─ integracion  PostgreSQL 16 real: schema vs 06 · readiness · migración fallida aborta
               └─ imagen-api   docker build · migrate deploy · /health/ready 200 con el SHA del commit
merge a main + checks OK ─► Render (autoDeployTrigger: checksPass)
               ├─ be-api   build imagen ─► arranque: prisma migrate deploy ─► node ─► readiness /health/ready ─► switch
               └─ be-web   npm ci + next build (export) ─► CDN
tag apk-v* o manual ─► apk.yml ─► EAS build perfil test ─► URL del APK
```

## URLs del ambiente `test`

| Servicio | URL |
|---|---|
| API | `https://be-api-hndp.onrender.com` (`/health`, `/health/live`, `/health/ready`) |
| Website | `https://be-web-izpg.onrender.com` |
| APK | release `be-apk-0.1.0` del repositorio (ver `DEFENSA/WP-01.md`) |

Los subdominios `onrender.com` son globales: `be-api` y `be-web` ya pertenecían a terceros, y Render agregó los sufijos `-hndp` e `-izpg`. Esas URLs están fijadas en `render.yaml` (rewrite y CORS) y en `apps/mobile/eas.json` (`API_BASE_URL`). Si se recrea un servicio y cambia el sufijo, hay que actualizar los tres lugares.

## Alta inicial (una sola vez)

1. En Render: **New → Blueprint**, conectar el repositorio y elegir la rama `main`. Render lee `render.yaml` y crea `be-db-test` (Postgres 16, Frankfurt), `be-api` (Docker, Frankfurt) y `be-web` (sitio estático).
2. Si el sufijo de algún subdominio cambió, actualizar las URLs de la tabla anterior en `render.yaml` y `eas.json`.
3. En GitHub → Settings → Secrets → Actions: `EXPO_TOKEN` (token de expo.dev) para `apk.yml`.

## Verificación posterior al deploy (07 §37)

```bash
curl -s https://be-api-hndp.onrender.com/health/ready   # 200, data.version.commit == SHA del merge
curl -s https://be-api-hndp.onrender.com/health/live    # 200
curl -sI https://be-web-izpg.onrender.com/              # 200 + cabeceras HSTS/CSP
curl -s https://be-web-izpg.onrender.com/api/v1/x       # 404 RESOURCE_NOT_FOUND desde la API (rewrite same-origin)
```

La primera respuesta puede tardar alrededor de 30 segundos: el plan gratuito apaga la API después de 15 minutos sin tráfico. En el primer despliegue se midieron 23 s en frío y 0,5 s en caliente.

## Rollback (07 §39)

- **Aplicación:** Render → `be-api` → Events → deploy anterior → **Rollback**. No se revierte el schema: las migraciones son aditivas (expand→contract), y `/health/ready` acepta una base con migraciones más nuevas que el artefacto.
- **Migración fallida:** el contenedor nuevo termina antes de escuchar, no pasa `/health/ready` y Render cancela el deploy. La versión anterior sigue sirviendo, y la migración queda registrada como fallida en `_prisma_migrations`. Se corrige con una migración nueva; nunca `migrate reset` ni `db push` fuera de development (07 §38).
- **Website:** Render → `be-web` → Events → Rollback.

## Límites del plan gratuito

- La API se apaga después de 15 minutos sin tráfico. Antes de una demo, abrir `/health/ready` unos minutos antes.
- `be-db-test` expira a los 30 días de creada, con 14 días de gracia.
- No hay pre-deploy command (DL-006).
