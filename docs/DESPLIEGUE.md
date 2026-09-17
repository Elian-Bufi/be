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

## Alta inicial (una sola vez)

1. En Render: **New → Blueprint**, conectar el repositorio y elegir la rama `main`. Render lee `render.yaml` y crea `be-db-test` (Postgres 16, Frankfurt), `be-api` (Docker, Frankfurt) y `be-web` (sitio estático).
2. En `be-api` → Environment, cargar `CORS_ALLOWED_ORIGINS` con la URL de `be-web`.
3. Si Render asignó a la API un subdominio distinto de `be-api.onrender.com`, actualizar el `destination` del rewrite en `render.yaml` y el `API_BASE_URL` del perfil `test` en `apps/mobile/eas.json`.
4. En GitHub → Settings → Secrets → Actions: `EXPO_TOKEN` (token de expo.dev) para `apk.yml`.

## Verificación posterior al deploy (07 §37)

```bash
curl -s https://<be-api>/health/ready   # 200, data.version.commit == SHA del merge
curl -s https://<be-api>/health/live    # 200
curl -sI https://<be-web>/              # 200 + cabeceras HSTS/CSP
```

## Rollback (07 §39)

- **Aplicación:** Render → `be-api` → Events → deploy anterior → **Rollback**. No se revierte el schema: las migraciones son aditivas (expand→contract), y `/health/ready` acepta una base con migraciones más nuevas que el artefacto.
- **Migración fallida:** el contenedor nuevo termina antes de escuchar, no pasa `/health/ready` y Render cancela el deploy. La versión anterior sigue sirviendo, y la migración queda registrada como fallida en `_prisma_migrations`. Se corrige con una migración nueva; nunca `migrate reset` ni `db push` fuera de development (07 §38).
- **Website:** Render → `be-web` → Events → Rollback.

## Límites del plan gratuito

- La API se apaga después de 15 minutos sin tráfico. Antes de una demo, abrir `/health/ready` unos minutos antes.
- `be-db-test` expira a los 30 días de creada, con 14 días de gracia.
- No hay pre-deploy command (DL-006).
