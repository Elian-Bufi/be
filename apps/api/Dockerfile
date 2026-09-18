# API BE — imagen OCI multi-stage (07 §34, ASR-09).
# Contexto de build: raíz del repositorio (npm workspaces + /prisma compartido).
# El Dockerfile es la definición ejecutable del runtime: nada depende de configuración externa no versionada.

ARG NODE_IMAGE=node:22.23.2-bookworm-slim

FROM ${NODE_IMAGE} AS base
# openssl: requerido por los motores de Prisma en Debian slim.
RUN apt-get update \
 && apt-get install -y --no-install-recommends openssl ca-certificates \
 && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# --- Dependencias completas para compilar -----------------------------------
FROM base AS build
COPY package.json package-lock.json .npmrc tsconfig.base.json ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci -w @be/api -w @be/domain --include-workspace-root
COPY prisma ./prisma
COPY packages/domain ./packages/domain
COPY apps/api ./apps/api
RUN npx prisma generate \
 && npm run build -w @be/domain \
 && npm run build -w @be/api
ARG RENDER_GIT_COMMIT
RUN node -e "require('fs').writeFileSync('apps/api/dist/build-info.json', JSON.stringify({ commit: process.env.RENDER_GIT_COMMIT || null, construidoEn: new Date().toISOString() }))"

# --- Solo dependencias de producción ----------------------------------------
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY packages/domain/package.json packages/domain/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY apps/mobile/package.json apps/mobile/
RUN npm ci -w @be/api -w @be/domain --include-workspace-root --omit=dev

# --- Runtime ----------------------------------------------------------------
FROM base AS runtime
ENV NODE_ENV=production
COPY --from=deps --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/node_modules/.prisma ./node_modules/.prisma
COPY --chown=node:node package.json ./
COPY --chown=node:node prisma ./prisma
COPY --from=build --chown=node:node /app/packages/domain/package.json ./packages/domain/package.json
COPY --from=build --chown=node:node /app/packages/domain/dist ./packages/domain/dist
# zod 4 del dominio vive anidado (la raíz tiene zod 3 de otra dependencia): sin esto, @be/domain resolvería el equivocado.
COPY --from=deps --chown=node:node /app/packages/domain/node_modules ./packages/domain/node_modules
COPY --from=build --chown=node:node /app/apps/api/package.json ./apps/api/package.json
COPY --from=build --chown=node:node /app/apps/api/dist ./apps/api/dist
COPY --chown=node:node apps/api/scripts/iniciar.sh ./apps/api/scripts/iniciar.sh
USER node
EXPOSE 3000
# Migraciones como fase explícita del deploy, antes de aceptar tráfico (07 §36; DEUDA_LEGAJO DL-006).
CMD ["sh", "apps/api/scripts/iniciar.sh"]
