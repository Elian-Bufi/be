# Reanudación de WP-DASHBOARD-COMPRENSION

> Nota viva del encargo del 2026-10-09 (evolución del dashboard profesional). Se actualiza en cada hito para poder seguir
> si la sesión se corta. **No es evidencia:** la evidencia está en `EVIDENCIA/DASHBOARD-COMPRENSION/`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-comprension`, desde `wp-dashboard-profesional` en `6c8e0b4`, en el árbol `../BE-Best-entrenamiento` |
| Definición y decisiones | `docs/paquetes/WP-DASHBOARD-COMPRENSION.md` (§1 mapa de integración, §2 decisiones D-01 a D-33, §3 hitos); DL-129 y DL-130 en `docs/DEUDA_LEGAJO.md` |
| Guía de UX | `docs/ux/GUIA-UX-UI.md`, reorganizada en este encargo (Parte V: qué cambió) |
| Base local | `be_test_comprension` en PostgreSQL 16 :55442 (embebido de la sesión, `scratchpad/pg/iniciar.mjs`); la de #153 (`be_test_dashboard`) no se toca. Integración: `be_test_integ_comprension` |
| Trabajo local | `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-comprension/` (ignorado): estado, secreto, registros, capturas, resultados de los recorridos |
| Variables | `BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension` y `BE_TRABAJO=<herramientas>/trabajo-comprension` para `entorno.sh`, `datos/` y los recorridos; `TEST_DATABASE_URL=…/be_test_integ_comprension` para la integración |
| Recorridos | `herramientas/recorrido-comprension.mjs mirar | capturas | funcional | revocacion` y `recorrido.mjs funcional` (regresión del paquete anterior, adaptada a la interfaz nueva) |

## Servicios propios

- PostgreSQL :55442, **con el lanzador versionado** `herramientas/postgres-local` y `BE_PG_DATOS` apuntando al clúster
  existente (`scratchpad/pg/datos` de la sesión 3346bb7e). Ya no se usa el `iniciar.mjs` del `scratchpad`. **No tocar**
  el de :55432: es de otra sesión. Sin `--crear`, el lanzador no crea ni clúster ni bases (D-33).
- **Para la demostración, PostgreSQL corre en una terminal propia de Elián,** no como tarea de Claude Code: el
  2026-10-09 a las 12:43 Claude Code cortó esa tarea por falta de memoria (la base se recuperó sola al volver a
  arrancar). Los comandos exactos, en PowerShell, están en `EVIDENCIA/DASHBOARD-COMPRENSION/demostracion/LEEME.md`. Eso
  no resuelve la falta de RAM del equipo (5,9 GB; entre 300 y 550 MB disponibles ese día).
- API :3001 y web :3000 con `entorno.sh` (exportar **siempre** `BE_TRABAJO` y `BE_E2E_DATABASE_URL`). La API se arranca
  con `entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo-comprension/demo-profesionales.txt)"` y se
  reconecta sola cuando vuelve PostgreSQL. Compilar el website con la API apagada (poca memoria).
- Para apagar PostgreSQL sin dejar procesos: `node parar.mjs` del lanzador, con el mismo `BE_PG_DATOS`.
- Si el clúster ya no está (una limpieza de temporales), se regenera el escenario con `datos/regenerar-comprension.sh`
  sobre un clúster nuevo (`node iniciar.mjs --crear`).

## Estado

Encargo terminado y entregado en borrador: **PR #154** contra `wp-dashboard-profesional`, sin merge ni despliegue. Los
hitos 0 a 7 están en `WP-DASHBOARD-COMPRENSION.md` §3; los resultados, en `EVIDENCIA/DASHBOARD-COMPRENSION/LEEME.md`.

| Commit | Qué |
|---|---|
| `c1a23aa` | Dominio y lecturas (hito 2) |
| `cc17ba2`, `96cbb49` | Web: Resumen, preguntas, análisis, etapas y acciones (hitos 3 y 4) |
| `1661c69` | Código del encargo, verificado entonces: `capturas` 73/73, `funcional` 59/59, `revocacion` 6/6, regresión de #153 70/70, `mirar` 18/18; dominio 585, scripts 297, API 80, integración 49 |
| `ea50bb2`, `6afa526`, `643c603` | Documentos, la nota de reanudación y el lanzador de PostgreSQL (D-27) |
| `269d930` | La pasada de corrección y usabilidad (D-28 a D-32), el código verificado ahora: `capturas` 79/79, `funcional` 75/75, regresión de #153 70/70, `mirar` 20/20; dominio 590, scripts 301, API 80, integración 50 |
| el siguiente | La evidencia y la matriz de la pasada |

## Pasada de corrección y usabilidad (pedido de Dirección del 2026-10-09): hecha

Sobre el PR #154, sin merge, despliegue ni APK, y nada más de `CRITICA.md`. Los cinco puntos están hechos (D-28 a
D-32, en `WP-DASHBOARD-COMPRENSION.md`; la verificación, en `ACEPTACION.md`, tabla P-1 a P-5):

| # | Qué | Estado |
|---|---|---|
| 1 | Cobertura de los resúmenes de nutrición en días del rango (defecto) | Corregido (D-28) |
| 2 | Evidencia de la revisión agrupada por día y por tipo | Hecho (D-29) |
| 3 | Filtro de Nutrición: modo de registro y diferencia comprobada | Hecho (D-30) |
| 4 | Analizar con la pregunta de etapas | Hecho (D-31) |
| 5 | Guía: el alcance de «no calificar» | Hecho (D-32) |

Durante la pasada, un error mío: la API reiniciada sin `BE_E2E_DATABASE_URL` apuntó a `be_test_dashboard` (la base de
#153) y dejó dos rechazos de inicio de sesión en su auditoría, que no se borran (ver la evidencia). `entorno.sh` ya no
lo permite. **Al reiniciar la API de este paquete, exportar siempre `BE_TRABAJO` y `BE_E2E_DATABASE_URL`.**

## Próximo paso exacto

Ninguno de código: esperar la revisión de Dirección (D-01 a D-33, DL-129 y DL-130, la guía de UX) y la prueba con lector
de pantalla (`LECTOR-DE-PANTALLA.md`).

- **Si Dirección pide cambios:** levantar la base y los servicios (arriba), cambiar, y repetir solo los recorridos que
  toca el cambio; el recorrido `funcional` registra una revisión sintética, así que las capturas van antes.
- **Cuando #153 se integre:** cambiar la base de #154 a `main` (`gh pr edit 154 --base main`). Si #153 entró con
  squash, traer `main` a la rama con un merge y resolver los conflictos en la rama: no se rebasa ni se reescribe lo
  publicado.
