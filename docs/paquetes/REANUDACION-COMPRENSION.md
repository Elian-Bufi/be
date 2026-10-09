# Reanudación de WP-DASHBOARD-COMPRENSION

> Nota viva del encargo del 2026-10-09 (evolución del dashboard profesional). Se actualiza en cada hito para poder seguir
> si la sesión se corta. **No es evidencia:** la evidencia está en `EVIDENCIA/DASHBOARD-COMPRENSION/`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-comprension`, desde `wp-dashboard-profesional` en `6c8e0b4`, en el árbol `../BE-Best-entrenamiento` |
| Definición y decisiones | `docs/paquetes/WP-DASHBOARD-COMPRENSION.md` (§1 mapa de integración, §2 decisiones D-01 a D-27, §3 hitos); DL-129 y DL-130 en `docs/DEUDA_LEGAJO.md` |
| Guía de UX | `docs/ux/GUIA-UX-UI.md`, reorganizada en este encargo (Parte V: qué cambió) |
| Base local | `be_test_comprension` en PostgreSQL 16 :55442 (embebido de la sesión, `scratchpad/pg/iniciar.mjs`); la de #153 (`be_test_dashboard`) no se toca. Integración: `be_test_integ_comprension` |
| Trabajo local | `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-comprension/` (ignorado): estado, secreto, registros, capturas, resultados de los recorridos |
| Variables | `BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension` y `BE_TRABAJO=<herramientas>/trabajo-comprension` para `entorno.sh`, `datos/` y los recorridos; `TEST_DATABASE_URL=…/be_test_integ_comprension` para la integración |
| Recorridos | `herramientas/recorrido-comprension.mjs mirar | capturas | funcional | revocacion` y `recorrido.mjs funcional` (regresión del paquete anterior, adaptada a la interfaz nueva) |

## Servicios propios

- PostgreSQL :55442 (embebido de esta sesión). **No tocar** el de :55432: es de otra sesión.
- API :3001 y web :3000 con `entorno.sh` (con las variables de arriba). La API se arranca con
  `entorno.sh api "$(sed -n 's/^BE_DEMO_PROFESIONALES=//p' trabajo-comprension/demo-profesionales.txt)"`. Compilar el
  website con la API apagada (poca memoria). Se apagan al terminar.
- Para apagar PostgreSQL sin dejar procesos: `pg_ctl -D datos stop -m fast` en `scratchpad/pg` y después detener la tarea.
- Al cerrar el encargo (2026-10-09) quedaron los tres apagados, sin procesos sueltos. La base `be_test_comprension`
  quedó en `scratchpad/pg/datos` (se vuelve a levantar con `node iniciar.mjs` en esa carpeta); si ya no está, se
  regenera entera con `datos/regenerar-comprension.sh`.
- **Desde cero** (otra sesión, o Elián para la demostración), sin el `scratchpad`: el lanzador versionado
  `herramientas/postgres-local` (`npm ci` una vez; `node iniciar.mjs be_test_comprension be_test_integ_comprension`;
  `node parar.mjs` lo apaga en orden). Los datos quedan en su carpeta `datos/`, ignorada por git.

## Estado

Encargo terminado y entregado en borrador: **PR #154** contra `wp-dashboard-profesional`, sin merge ni despliegue. Los
hitos 0 a 7 están en `WP-DASHBOARD-COMPRENSION.md` §3; los resultados, en `EVIDENCIA/DASHBOARD-COMPRENSION/LEEME.md`.

| Commit | Qué |
|---|---|
| `c1a23aa` | Dominio y lecturas (hito 2) |
| `cc17ba2`, `96cbb49` | Web: Resumen, preguntas, análisis, etapas y acciones (hitos 3 y 4) |
| `1661c69` | Código final, el verificado: `capturas` 73/73, `funcional` 59/59, `revocacion` 6/6, regresión de #153 70/70, `mirar` 18/18; dominio 585, scripts 297, API 80, integración 49 |
| `ea50bb2` y siguientes | Solo documentos: guía de UX, evidencia, crítica, esta nota |

## Próximo paso exacto

Ninguno de código: esperar la revisión de Dirección (D-01 a D-27, DL-129 y DL-130, la guía de UX y las ocho
oportunidades de `CRITICA.md`) y la prueba con lector de pantalla (`LECTOR-DE-PANTALLA.md`). No se arranca otra tanda
sin su pedido.

- **Si Dirección pide cambios:** levantar la base y los servicios (arriba), cambiar, y repetir solo los recorridos que
  toca el cambio; el recorrido `funcional` registra una revisión sintética, así que las capturas van antes.
- **Cuando #153 se integre:** cambiar la base de #154 a `main` (`gh pr edit 154 --base main`). Si #153 entró con
  squash, traer `main` a la rama con un merge y resolver los conflictos en la rama: no se rebasa ni se reescribe lo
  publicado.
