# DV-02 · Tecnologías declaradas frente a las usadas — reconciliación con el repositorio

> **Autor:** Claude (Opus 5.5), agente ejecutor, por pedido de Dirección · **Fecha:** 2026-10-02
> **Qué pide:** el informe de MESA-01 (`docs/mesa/MESA_01/BE_MESA_01_INFORME_COBERTURA_Y_PLAN_CIERRE_2026-09-10.md`, clasificación C) pide verificar las «tecnologías **utilizadas**» de DV-02 contra el repositorio real. DV-02 §6 las rotula «OBJETIVO SEGÚN BE-LEG-07 — A RECONCILIAR CON REPOSITORIO EN INTAKE».
> **Qué no hace:** no modifica `DV-02_ACTA.md`, que está en `docs/MANIFEST.sha256`. Esta nota va al lado.
> **Contenido analizado:** el de `c61b8f5` (rama `fix/auditoria-errores`), que tiene el mismo árbol que `33784f1`, el commit con el que `main` integró #130 en GitHub. Los archivos que se citan acá no cambian respecto de `d1ddd69`.

## 1. Resumen

DV-02 §6 declara **15 tecnologías o propiedades** en seis capas. Contra el repositorio:

| Resultado | Cantidad | Cuáles |
|---|---|---|
| **Coincide** | 10 | NestJS · monolito modular · REST `/api/v1` · PostgreSQL · Prisma · Expo / React Native · Render Frankfurt · Open Food Facts · wger · fallback observable |
| **Difiere** | 2 | Next.js (misma tecnología, otra topología: export estático y llamada directa con CORS) · build de la APK (declarado por EAS; se construye localmente con Gradle desde la 0.11.1) |
| **Falta** | 2 | Identidad federada · notificaciones push |
| **No verificable con el repositorio** | 1 | «Arquitectura AWS-ready»: es una propiedad de diseño y no hay ningún despliegue en AWS que la pruebe |

Además, el repositorio usa **16 tecnologías o herramientas que DV-02 no menciona** (§4). Las de más peso para la mesa son el **build local de la APK con Gradle**, **react-native-svg**, **zod con el OpenAPI generado**, **Docker** y **GitHub Actions**.

Lo más importante para la mesa:
1. **Las capas de §6 usan las tecnologías que analizó el 07, pero no sus versiones.** Hoy son Node 22, NestJS 11, Prisma 6, Next 15.5.25 y PostgreSQL 16; el 07 describe Node 20, NestJS 10.4.22, Prisma 5.22.0, Next 15.5.19 y «la mayor estable soportada» de PostgreSQL. El desvío está declarado en **DL-002**.
2. **Las dos integraciones del compromiso académico** (Open Food Facts y wger, Q-API-001) **están implementadas**, con su fallback. Las otras dos que nombra DV-02 (identidad federada y push) no están, y su exclusión figura en las definiciones de paquete, no en `docs/DEUDA_LEGAJO.md`.
3. Tres afirmaciones de DV-02 **quedaron desactualizadas** por la implementación (§5). La más visible: el acta dice que BE «permanece especificado y en preparación de implementación», sin despliegue ni APK operativa.

## 2. Cómo se hizo

Se compararon una por una las afirmaciones de la tabla de DV-02 §6 con estas fuentes del repositorio:
- `package.json` de la raíz, de `apps/api`, `apps/web`, `apps/mobile` y `packages/domain`;
- `apps/mobile/app.config.ts` y `apps/mobile/eas.json`;
- `render.yaml` y `apps/api/Dockerfile`;
- `.github/workflows/ci.yml` y `.github/workflows/apk.yml`;
- `prisma/schema.prisma` y `prisma/migrations/`;
- `docs/DESPLIEGUE.md`, `DECISIONES_TECNICAS.md` y `docs/DEUDA_LEGAJO.md`;
- el código, solo donde los manifiestos no alcanzan: prefijo de rutas, módulos, integraciones y fallback.

Cada celda de DV-02 que junta varias afirmaciones se separó. Por ejemplo, «NestJS · monolito modular · REST `/api/v1`» son tres filas. Así salen las 15.

Criterios:
- **Coincide:** la tecnología declarada está en uso y cumple la función que DV-02 le asigna. Una versión distinta de la del 07 no cambia el resultado, pero se anota con su DL.
- **Difiere:** la tecnología está, pero se usa de otra forma que la declarada (topología, proceso o proveedor).
- **Falta:** no hay dependencia, configuración ni código que la implemente.
- **No verificable:** el repositorio no tiene con qué probarla en ningún sentido.

No se levantó ningún servidor ni se ejecutó ningún build: las versiones salen de los manifiestos y de la evidencia de publicación.

## 3. Tecnologías declaradas en DV-02 §6 frente al repositorio

| Capa | Declarado en DV-02 §6 | Usado de verdad (versión) | Fuente en el repositorio | Resultado | Nota |
|---|---|---|---|---|---|
| API | NestJS | NestJS **11.2.5** (`@nestjs/common`, `core`, `platform-express`; `@nestjs/testing` en pruebas), sobre Express | `apps/api/package.json` · `apps/api/src/app.module.ts` | **Coincide** | El 07 §13 y §15 describen NestJS 10.4.22. WP-01 eligió la línea 11: DL-002 y `DECISIONES_TECNICAS.md` §1 |
| API | Monolito modular | Un solo `AppModule` con 16 módulos de dominio y de plataforma, más la configuración. Las integraciones van como módulo dentro de nutrición y entrenamiento. Una sola imagen desplegable | `apps/api/src/app.module.ts` («Monolito modular (07 CAND-07-A)») · `apps/api/Dockerfile` | **Coincide** | ASR-01: las operaciones que mutan agregados y emiten hechos van en una sola transacción de Prisma (`DECISIONES_TECNICAS.md` §8) |
| API | REST `/api/v1` | `setGlobalPrefix('api/v1')`, con `/health`, `/health/live` y `/health/ready` fuera del prefijo. Contrato publicado como OpenAPI 3.1.0 en `docs/api/openapi.json` | `apps/api/src/bootstrap.ts` · `scripts/generar-openapi.cjs` · `.github/workflows/ci.yml` (paso «OpenAPI … sin drift») | **Coincide** | Las señales de salud fuera del prefijo son una tensión declarada: DL-004 |
| Persistencia | PostgreSQL | PostgreSQL **16**: base `be-db-test` en Render (`postgresMajorVersion: "16"`) e imagen `postgres:16-alpine` en la CI | `render.yaml` · `.github/workflows/ci.yml` (job `imagen-api`) | **Coincide** | El 07 §21 apunta a «la mayor estable soportada»; WP-01 fijó 16 para alinear con el harness de pruebas (DL-002) |
| Persistencia | vía Prisma | Prisma **6.19.3** (`prisma` y `@prisma/client`). `prisma/schema.prisma` tiene 83 modelos y 54 enums; hay 23 migraciones, con 27 índices únicos parciales y 208 disparadores en su SQL | `apps/api/package.json` · `package.json` raíz (clave `prisma`) · `prisma/` | **Coincide** | ASR-02 (unicidades condicionales e índices parciales) se cumple en las migraciones. El 07 describe Prisma 5.22.0 (DL-002) |
| Website | Next.js | Next.js **15.5.25** con React 19.2.3. Se compila como export estático (`output: 'export'`) que Render sirve como sitio estático, y llama a la API directo, con CORS | `apps/web/package.json` · `apps/web/next.config.mjs` · `render.yaml` (`be-web`, `runtime: static`) | **Difiere** | La tecnología es la declarada; la topología no. El 07 §34 prevé una imagen Node `standalone`, y el 07 §17, que el website haga de proxy de `/api/*`. El export estático es DL-007 (abierta) y la llamada directa con CORS es DL-030 (decidida por Dirección el 2026-09-19) |
| APK | Expo / React Native | Expo SDK **57** (`expo` 57.0.23), React Native **0.86.3**, React 19.2.3 y TypeScript 6.0.3. El bundle es bytecode de Hermes | `apps/mobile/package.json` · `apps/mobile/app.config.ts` · `EVIDENCIA/WP-06/apk.txt` (Hermes) | **Coincide** | — |
| APK | Build reproducible, distribución directa (RNF-PORT-001) | **Distribución:** directa, por releases permanentes `be-apk-x.y.z` de GitHub con su SHA-256. **Build:** el repositorio declara EAS (`eas.json`, perfiles `test` y `production`; workflow `apk.yml`), pero `apk.yml` no construye porque falta el secreto `EXPO_TOKEN`. **Desde la 0.11.1 la APK se construye localmente con Gradle**, con la firma administrada por EAS, y la vigente, 0.13.0, también. El commit construido queda dentro de la APK (`assets/app.config`) | `apps/mobile/eas.json` · `.github/workflows/apk.yml` · `docs/DESPLIEGUE.md` (fila APK y § APK) · `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md` · `EVIDENCIA/PUBLICACION-0.13.0/LEEME.md` | **Difiere** | La distribución coincide. El build no es el declarado: lo hace la máquina de Dirección con Gradle, porque el 2026-09-26 se agotó la cuota gratuita de EAS. Es reproducible por un procedimiento escrito, con herramientas y versiones fijadas, no por un servicio. `apps/mobile/package.json` todavía describe «APK por EAS» |
| Despliegue | Render Frankfurt | Render, región Frankfurt para la base y la API (`region: frankfurt`), plan gratuito. La API corre como imagen Docker; el website, como sitio estático | `render.yaml` · `apps/api/Dockerfile` · `docs/DESPLIEGUE.md` | **Coincide** | Sin pre-deploy en el plan gratuito: las migraciones corren al arrancar el contenedor (DL-006). El Blueprint despliega sin esperar la CI (DL-008). La base gratuita vence cerca del 2026-10-18 (`docs/DESPLIEGUE.md`) |
| Despliegue | Arquitectura AWS-ready | No hay ningún artefacto de AWS en el repositorio. Sí hay indicios de portabilidad: la API es una imagen OCI definida por su Dockerfile, la base es PostgreSQL estándar accedido por Prisma y el código no depende de un SDK de Render (el commit se lee de `RENDER_GIT_COMMIT` o de `GIT_COMMIT`) | `apps/api/Dockerfile` · `apps/api/src/config/version.ts` | **No verificable** | Es una propiedad de diseño del 07 §53-bis. Probarla exige un despliegue en AWS, que el repositorio no tiene |
| Integraciones | Open Food Facts | **Implementada** (WP-08, integrada en #72): consulta por código de barras a `world.openfoodfacts.org/api/v2/product`. Guarda un candidato con la huella SHA-256 de lo recibido y la licencia ODbL; el profesional lo revisa, y lo importado conserva su procedencia | `apps/api/src/integraciones/open-food-facts.ts` · `apps/api/src/config/entorno.ts` · `prisma/schema.prisma` (`CandidatoDeImportacion`, `ResolucionDeCandidato`) | **Coincide** | Decisión previa: DL-086. Abiertas: DL-097 (formas que el 09 no fija), DL-098 (búsqueda por texto) y DL-099 (la procedencia no llega al ítem del plan) |
| Integraciones | wger | **Implementada** (WP-08): consulta por número de ejercicio a `wger.de/api/v2/exerciseinfo`, con las licencias que publica wger | `apps/api/src/integraciones/wger.ts` | **Coincide** | Sin zonas musculares ni material didáctico (DL-081) |
| Integraciones | Identidad federada | **No implementada.** El único método de acceso es `LOCAL` (enum `TipoDeMetodoDeAcceso`) y no hay cliente de ningún proveedor de identidad | `prisma/schema.prisma` · `apps/api/package.json` | **Falta** | Fuera de alcance declarado (RF-003 y RF-004): `docs/paquetes/WP-02.md` §8, `docs/paquetes/WP-CONSOLIDACION.md` y `docs/QUE-FALTA.md` §7. No tiene DL |
| Integraciones | Push | **No implementado.** Ni la APK ni la API tienen una dependencia de notificaciones | `apps/mobile/package.json` · `apps/api/package.json` | **Falta** | RF-062 es P2. Fuera de alcance: `docs/paquetes/WP-06.md` §8, `WP-CONSOLIDACION.md` y `QUE-FALTA.md` §7. No tiene DL |
| Integraciones | Fallback observable (RF-059) | **Implementado para Open Food Facts y wger:** sin reintentos y con un tiempo máximo. Ante una caída, timeout, 5xx, 429, redirección o respuesta desmedida, la API responde 503 con el catálogo propio y la carga manual disponibles, y deja el motivo en el log técnico | `apps/api/src/integraciones/proveedor-http.ts` · `apps/api/src/nutricion/importacion.service.ts` · `apps/api/src/entrenamiento/importacion.service.ts` | **Coincide** | Para identidad federada y push no hay fallback que probar, porque no hay integración |

## 4. Lo que el repositorio usa y DV-02 no menciona

| Qué | Versión | Para qué | Fuente en el repositorio |
|---|---|---|---|
| Node.js | **22.23.2** (`engines` `>=22.12.0 <23`) | Runtime de la API, del build del website y de las herramientas. El 07 §34 dice Node 20 (DL-002) | `package.json` · `.nvmrc` · `apps/api/Dockerfile` (`node:22.23.2-bookworm-slim`) · `render.yaml` (`NODE_VERSION: "22"`) · `apps/mobile/eas.json` |
| TypeScript | 5.9.3 en api, web y domain · 6.0.3 en mobile (lo fija Expo 57) | Lenguaje de todo el monorepo | `apps/*/package.json` · `packages/domain/package.json` |
| npm workspaces | npm 10.9.8 (`packageManager`), `engine-strict=true` | Monorepo con un solo lockfile y el paquete compartido `@be/domain` | `package.json` · `.npmrc` |
| zod y OpenAPI generado | zod 4.6.5 · OpenAPI 3.1.0 | Contratos HTTP compartidos por API, website y APK. De ellos se genera el OpenAPI, y la CI falla si hay deriva | `packages/domain/package.json` · `scripts/generar-openapi.cjs` · `docs/api/openapi.json` |
| Seguridad de la API | helmet 8.3.0 · @node-rs/bcrypt 1.10.9 · jsonwebtoken 9.0.3 | Cabeceras de seguridad; hash adaptativo de la contraseña; token HS256 que solo identifica una sesión verificada contra la base | `apps/api/package.json` · `DECISIONES_TECNICAS.md` §1 |
| Docker | Imagen multi-stage sobre `node:22.23.2-bookworm-slim` | Runtime de la API en Render y en la CI; corre `prisma migrate deploy` antes de aceptar tráfico | `apps/api/Dockerfile` · `apps/api/scripts/iniciar.sh` |
| GitHub Actions | `checkout@v7`, `setup-node@v7`, `upload-artifact@v4` | CI con cuatro jobs (legajo, verificar, integración, imagen de la API) y el workflow manual de la APK. Render despliega `test` solo con los checks en verde (`checksPass`) | `.github/workflows/ci.yml` · `.github/workflows/apk.yml` · `render.yaml` |
| Pruebas de la API | Jest 30.5.1 · ts-jest 29.4.12 · supertest 7.2.2 · Testcontainers 12.1.0 (`@testcontainers/postgresql`) | Unitarias e integración contra un PostgreSQL 16 real | `apps/api/package.json` · `.github/workflows/ci.yml` |
| Pruebas del dominio y de los scripts | `node:test`, sin dependencias | Reglas del dominio, contraste, copy y auditoría de dependencias | `packages/domain/package.json` · `package.json` raíz (script `test`) |
| Accesibilidad y recorridos | puppeteer-core 25.12.0 · axe-core 4.13.0 | Auditoría de accesibilidad del website y capturas de recorridos | `package.json` raíz (devDependencies) · `scripts/auditoria-accesibilidad.mjs` |
| Gráficos del website | recharts 3.10.1 | Evolución antropométrica y comparación de lo planificado con lo ejecutado en entrenamiento | `apps/web/package.json` · `apps/web/src/app/pro/advisees/anthropometry/grafico-de-evolucion.tsx` · `apps/web/src/app/pro/advisees/training/comparacion.tsx` |
| **react-native-svg** | **15.15.4** (la que fija Expo 57) | La figura antropométrica en SVG de la APK desde la 0.13.0. Es la primera dependencia nativa nueva desde la 0.9.0: exigió una APK nueva | `apps/mobile/package.json` · `docs/DESPLIEGUE.md` · `EVIDENCIA/PUBLICACION-0.13.0/LEEME.md` |
| Otras dependencias de la APK | @react-native-async-storage/async-storage 2.2.0 · react-native-safe-area-context ~5.7.0 · expo-crypto 57.0.3 · expo-constants 57.0.18 · expo-status-bar 57.0.1 | Preferencias locales, áreas seguras de la pantalla, claves de idempotencia (Hermes no trae `crypto.randomUUID`) y la identidad del build visible | `apps/mobile/package.json` · `DECISIONES_TECNICAS.md` §1 |
| **Build local de la APK con Gradle** | Gradle 9.3.1 · Android Gradle Plugin 8.12.0 · OpenJDK 17.0.10 · Android SDK Platform 36 · Build-Tools 36.0.0 · NDK 27.1.12297006 · CMake 3.22.1 | Reemplaza al build de EAS desde la 0.11.1: `expo prebuild` y `gradlew assembleRelease`, con un solo worker de Gradle, firmado con la keystore administrada por EAS (bajada con eas-cli 24.6.0) | `EVIDENCIA/HISTORIAL-ENTRENAMIENTO/build-local-0.11.1.md` · `docs/DESPLIEGUE.md` |
| Distribución de la APK | GitHub Releases `be-apk-x.y.z` | Copia permanente y verificable por SHA-256: el artefacto de EAS vencía a los 14 días | `docs/DESPLIEGUE.md` · `DECISIONES_TECNICAS.md` §3 |
| Auditoría de dependencias | `scripts/auditoria-de-dependencias.cjs` sobre `npm audit --omit=dev` · `overrides` de seguridad (multer 2.4.0, deepmerge-ts 8.0.2, postcss 8.5.28) | La CI falla con avisos altos o críticos, salvo excepciones declaradas con vencimiento | `package.json` · `scripts/auditoria-de-dependencias.cjs` · DL-114 |

## 5. Otras afirmaciones de DV-02 que el repositorio dejó desactualizadas

No son tecnologías, pero están en el mismo documento y un tribunal las va a leer junto con §6:

| Dónde | Qué dice DV-02 | Qué muestra el repositorio |
|---|---|---|
| §6, párrafo final | «El repositorio actual tiene un esquema anterior al modelo de dominio canónico, y esa brecha se reconcilia en el intake técnico (B-11, decisión H-07-DOM-01)» | El código arrancó de cero el 2026-09-16, por decisión de Dirección de abandonar `be-health` (DL-001). El schema actual declara que deriva del 06 (`prisma/schema.prisma`, líneas 1 a 10). La reconciliación del DER con la base está en `docs/mesa/MESA_02/DV-06/RECONCILIACION_DER_IMPLEMENTACION_2026-10.md` |
| §8.2 | «BE permanece especificado y en preparación de implementación. No se atribuyen a la plataforma usuarios, despliegue, métricas de éxito, APK operativa ni controles ya ensayados» | Hay un ambiente `test` desplegado en Render, una APK publicada (0.13.0, release `be-apk-0.13.0`) y controles ensayados: la CI con integración contra PostgreSQL y el ensayo de rollback (`EVIDENCIA/ENSAYO-ROLLBACK/`). La frase era cierta el 2026-09-13 |
| §9 | «Ejecución técnica prevista: Codex con Astra, según la solicitud de Dirección; pendiente de gate, ambiente y paquete autorizado» | El gate se firmó: ACTA-DIR-034 v1.0, del 2026-09-18 (DL-001). En la historia de git hasta `c61b8f5`, 313 de los 440 commits llevan co-autoría de Claude; Codex aparece como revisor externo en DL-114 (texto de `c61b8f5`) |

## 6. Qué conviene hacer

`DV-02_ACTA.md` está protegido por el manifiesto, así que desde el repositorio no se puede corregir. Hay dos caminos:
- **A.** Dirección reemite DV-02 con §6 actualizado: tabla «usado (versión)» y rótulo «RECONCILIADO CON EL REPOSITORIO EL 2026-10-02», más las tres frases de §5. Después actualiza el manifiesto.
- **B.** DV-02 queda como está y la mesa recibe esta nota como anexo, citada desde la presentación (DV-01).

Recomendación del ejecutor: **A**. Un acta que dice «sin despliegue ni APK operativa» frente a un sistema funcionando es la primera contradicción que un tribunal va a señalar.

## 7. Límites

- Las versiones salen de los manifiestos, del Dockerfile y de la evidencia de publicación. No se ejecutó ningún build ni se consultó Render.
- La versión de PostgreSQL de producción no se pudo comprobar: no hay producción.
- El build local de la APK se verificó por su registro en `EVIDENCIA/`, no repitiéndolo.
