# Reanudación de WP-DASHBOARD-COMPRENSION

> Nota viva del encargo del 2026-10-09 (evolución del dashboard profesional). Se actualiza en cada hito para poder seguir
> si la sesión se corta. **No es evidencia:** la evidencia está en `EVIDENCIA/DASHBOARD-COMPRENSION/`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-comprension`, desde `wp-dashboard-profesional` en `6c8e0b4`, en el árbol `../BE-Best-entrenamiento` |
| Definición y decisiones | `docs/paquetes/WP-DASHBOARD-COMPRENSION.md` (§1 mapa de integración, §2 decisiones, §3 hitos); DL-129 y DL-130 en `docs/DEUDA_LEGAJO.md` |
| Base local | `be_test_comprension` en PostgreSQL 16 :55442 (embebido de la sesión, `scratchpad/pg/iniciar.mjs`); la de #153 (`be_test_dashboard`) no se toca. Integración: `be_test_integ_comprension` |
| Trabajo local | `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/trabajo-comprension/` (ignorado): estado, secreto, registros, capturas |
| Variables | `BE_E2E_DATABASE_URL=postgresql://be_test:be_test@localhost:55442/be_test_comprension` y `BE_TRABAJO=<herramientas>/trabajo-comprension` para `entorno.sh`, `datos/` y `recorrido.mjs`; `TEST_DATABASE_URL=…/be_test_integ_comprension` para la integración |

## Servicios propios

- PostgreSQL :55442 (embebido de esta sesión). **No tocar** el de :55432: es de otra sesión.
- API :3001 y web :3000 con `entorno.sh` (con las variables de arriba). Se apagan al terminar cada recorrido.
- Para apagar PostgreSQL sin dejar procesos: `pg_ctl -D datos stop -m fast` en `scratchpad/pg` y después detener la tarea.

## Estado

| Hito | Estado |
|---|---|
| 0 · Base y mapa | Hecho. Capturas «antes» (compilación `6c8e0b4`, datos del 9/10) en `EVIDENCIA/DASHBOARD-COMPRENSION/antes/` |
| 2 · Dominio y lecturas | Hecho en dominio y API: `etapas-de-planificacion.ts`, `preguntas-profesionales.ts`, `sintesis-del-resumen.ts`, novedades desde un corte en `linea-de-tiempo.ts`; DSH-03, DSH-04 (`since`) y PRJ-01 aditivos; búsquedas de catálogo por POST. Dominio 583/583, scripts 291/291, integración (contrato, análisis, dashboard, comprensión) 49/49 |
| 3 · Resumen y preguntas | En curso (web): estado en la URL (pregunta, corte, retorno), contexto (lecturas de a cuatro, aviso de acceso perdido), detalle de comida (§3.B) |

## Próximo paso exacto

Terminar la web: cabecera «Ficha del asesorado» con el acceso actual y su actualización (§3.A); Resumen en el orden del
encargo (objetivo y plan por área, «Para tu próxima revisión» con la síntesis del dominio, acciones, indicadores,
cobertura); Analizar con las preguntas primero, «Agrupar por», etapas, contraste e información; retorno validado en las
pestañas de área. Después, generador de escenarios D y E, recorridos y capturas «después».
