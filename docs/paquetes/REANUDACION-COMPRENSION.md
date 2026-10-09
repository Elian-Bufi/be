# Reanudación de WP-DASHBOARD-COMPRENSION

> Nota viva del encargo del 2026-10-09 (evolución del dashboard profesional). Se actualiza en cada hito para poder seguir
> si la sesión se corta. **No es evidencia:** la evidencia está en `EVIDENCIA/DASHBOARD-COMPRENSION/`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-comprension`, desde `wp-dashboard-profesional` en `6c8e0b4`, en el árbol `../BE-Best-entrenamiento` |
| Definición y decisiones | `docs/paquetes/WP-DASHBOARD-COMPRENSION.md` (§1 mapa de integración, §2 decisiones D-01 a D-26, §3 hitos); DL-129 y DL-130 en `docs/DEUDA_LEGAJO.md` |
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

## Estado

| Hito | Estado |
|---|---|
| 0 · Base y mapa | Hecho. Capturas «antes» (compilación `6c8e0b4`, datos del 9/10) en `EVIDENCIA/DASHBOARD-COMPRENSION/antes/` |
| 2 · Dominio y lecturas | Hecho (commit `c1a23aa`) y corregido después: versión = orden de activación (D-20), borrador sin número, parámetros UUID (D-21), cobertura con el primer plan (D-15) |
| 3 · Resumen y preguntas | Hecho en la web: cabecera compacta, tabla de objetivo y planificación, síntesis, acciones y preguntas, indicadores |
| 4 · Análisis, etapas y acciones | Hecho: preguntas con parámetros, etapas con tabla y gráficos, contraste, información, retorno y preparación de la revisión |
| 5 · Acabado y accesibilidad | Revisado en pantalla a 1440 (`mirar`, compilación final): 18/18 pantallas sin desborde, sin axe y sin doble desplazamiento |
| 6 · Recorridos finales | En curso: `capturas`, `funcional`, `revocacion` y la regresión `recorrido.mjs funcional` |

## Próximo paso exacto

Correr `funcional` y corregir lo que falle; después `capturas` («después»), la regresión `recorrido.mjs funcional` y, con
las cuentas descartables, `revocacion`. Luego: evidencia (LEEME, ACEPTACION con CP-01 a CP-30, guía de demostración,
crítica), commits, push y PR en borrador contra `wp-dashboard-profesional`, CI del head final.
