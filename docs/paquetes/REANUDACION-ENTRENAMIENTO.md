# Reanudación de WP-ENTRENAMIENTO-SERIES

> Es el archivo de reanudación del encargo de Dirección del 2026-10-06, «BE · Cierre de Nutrición y Entrenamiento por
> serie». Se actualiza después de cada hito para poder seguir si la sesión o la memoria se cortan. **No es evidencia:**
> lo probado y su resultado están en `EVIDENCIA/ENTRENAMIENTO-SERIES/LEEME.md`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama de Entrenamiento | `wp-entrenamiento-series`, en el árbol aislado `../BE-Best-entrenamiento`, con su propio `npm ci` |
| Base | `wp-nutricion-recetas` en `9bf832b` (#147, borrador). El PR de Entrenamiento va **apilado** sobre esa rama |
| Nutrición | `wp-nutricion-recetas` en el árbol principal `BE-Best`, con el cierre en `9bf832b` |
| Seguridad | PR #148 (borrador) contra `main`: `source-map-js` 1.2.2. #146 tiene el mismo cambio en `6004c32` |
| Paquete de Dirección | `docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/` |

**Cambio de base futuro:** cuando #147 se integre (o #146 y después #147), el PR de Entrenamiento (#149) cambia su base
a la rama que corresponda. Mientras tanto muestra solo su delta sobre Nutrición.

## Hitos

| # | Hito | Estado | Commit |
|---|---|---|---|
| 1 | Cierre de Nutrición: contraste de la comida diferente, DL-119/120/121 precisas, almacenamiento y pendientes aislados | Hecho | `9bf832b` (wp-nutricion-recetas) |
| 2 | Seguridad `source-map-js`: #146 (`6004c32`) y PR #148 contra `main` | Hecho | `6004c32` y `a9b8406` |
| 3 | Relevamiento de Entrenamiento y definición del paquete (`WP-ENTRENAMIENTO-SERIES.md`, DL-122 a 124) | Hecho | ver el log de la rama |
| 4 | Dominio: objetivos por serie, contratos SER/TIE/EJE, eventos y cálculo de tiempos, textos y formas congeladas de la APK 0.13.2 | Hecho: 499 pruebas del dominio y la guardia de trazabilidad | ver el log de la rama |
| 5 | API: migración, medios de ejercicios y eventos de tiempo | Hecho | `033bfa1` |
| 6 | Website: editor por serie con vista previa, «Mis ejercicios» con imagen, plan activo y ejecuciones con tiempos | Hecho | `65a7d6a` |
| 7 | APK: Hoy, Plan e Historial, sesión enfocada, series, descanso y recuperación | Hecho | `e6bd769` |
| 8 | Recorrido, evidencia y PR | Hecho: 101/101 controles; PR #149 en borrador, apilado sobre #147 | `4badaaa` |

## Cómo levantar los servicios locales

- **PostgreSQL 16 embebido:** se levanta desde la carpeta de la sesión, `scratchpad/pg`, con `node iniciar.mjs`. Usa el
  puerto 55442, y sus datos quedan en `scratchpad/pg/datos`. No se recrea: si se detuvo por memoria, se vuelve a
  levantar.
- **Bases:**
  - `be_test_nutricion_rev`: integración de Nutrición;
  - `be_test_entrenamiento`: integración de Entrenamiento (creada el 2026-10-06 con scratchpad/pg/crear-bases.cjs);
  - `be_test_entrenamiento_web`: el recorrido.
- **API y website del recorrido:** los mismos scripts de `EVIDENCIA/NUTRICION-RECETAS/herramientas/recorrido/`, con
  `BE_E2E_DATABASE_URL`. Usan la API en el puerto 3001, la web en el 3000 y el arnés en el 3002, y **se apagan al
  terminar**.
- **Una sola tarea pesada a la vez:** Jest de integración, renders con Chrome o `next build`. No se arranca Gradle ni se
  construye una APK en este encargo.

## Pruebas, tal como se corren

- **Unitarias:** `npm test` (dominio, scripts y API unitaria).
- **Integración de un archivo:** `TEST_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/<base> npx jest --config apps/api/jest.integration.config.js --runInBand test/integration/<archivo>.int-spec.ts`.
- **El paquete:** `python verificar_paquete.py`, desde su carpeta. Dio OK el 2026-10-06: integridad, 3 PNG, 3 ejercicios
  y 9 series, 20 de 20 casos de series y 16 de 16 de tiempos. **No prueba BE.**

## Lo que falta

Ver «Hitos». Lo bloqueado afuera del código:
- la base de `test` vence cerca del 2026-10-18 (DL-120);
- el acto `EVIDENCIA_VISUAL` no tiene texto versionado (DL-120);
- todo lo de Android.
