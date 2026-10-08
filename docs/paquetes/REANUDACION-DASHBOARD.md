# Reanudación de WP-DASHBOARD-PROFESIONAL

> Es el archivo de reanudación del encargo de Dirección del 2026-10-08, «BE · Entorno profesional de seguimiento y
> análisis longitudinal». Se actualiza después de cada hito, para poder seguir si la sesión o la memoria se cortan.
> **No es evidencia:** lo probado y su resultado están en `EVIDENCIA/DASHBOARD-PROFESIONAL/LEEME.md`.

## Dónde está el trabajo

| Qué | Dónde |
|---|---|
| Rama | `wp-dashboard-profesional`, desde `main` en `ace91eb`, en el árbol `../BE-Best-entrenamiento` (que tiene su `node_modules`) |
| Definición del paquete | `docs/paquetes/WP-DASHBOARD-PROFESIONAL.md` |
| Evidencia | `EVIDENCIA/DASHBOARD-PROFESIONAL/` |
| Arreglos de la candidata, que **no se tocan** | #151 (`arreglo/foto-comida-diferente`) y #152 (`arreglo/sesion-en-curso-al-iniciar`), contra `main` y sin integrar. Este paquete no depende de ellos y no es requisito para publicarlos |
| Datos de `test` | **No se usan.** DEMO-A01, sus sesiones (la del 6/10 sigue abierta) y sus planes no se tocan. Todo se prueba en local, con datos sintéticos propios |

## Límites del encargo (no se extienden)

- **Sí:** investigar, diseñar, desarrollar en esta rama, migraciones y contratos aditivos estrictamente necesarios,
  pruebas reversibles en local y en CI con datos sintéticos, y un PR en borrador con evidencia.
- **No:** merge, despliegue, publicación de una APK, gastos, servicios externos ni cambios en los permisos del asesorado.
- **Memoria de la máquina:** un proceso pesado por vez (build del website, API con PostgreSQL, Chrome) y como máximo
  dos agentes al mismo tiempo. No se arranca el emulador. Se apagan los procesos al terminar cada recorrido.

## Hitos

| # | Hito | Estado | Commit |
|---|---|---|---|
| 1 | Delta, investigación, especificación y definición del paquete | En curso | — |
| 2 | Dominio: diccionario de métricas, agregaciones, línea de tiempo y comparación de períodos, con pruebas | Pendiente | — |
| 3 | API: API-DSH-04 (línea de tiempo), API-PRJ-01 (proyecciones), vistas guardadas, con migración y pruebas de integración | Pendiente | — |
| 4 | Datos sintéticos reproducibles de 12 semanas y resultados esperados | Pendiente | — |
| 5 | Website: Resumen, Línea de tiempo y Analizar dentro de la ficha | Pendiente | — |
| 6 | Recorridos reales, capturas, accesibilidad, rendimiento y matriz de aceptación | Pendiente | — |
| 7 | PR en borrador con la CI del head final | Pendiente | — |

## Decisiones tomadas (resumen; el detalle está en la definición del paquete)

- Arquitectura A: tres vistas dentro de la ficha del asesorado (B10-08 §4 y §32), sin un `/dashboard` universal.
- Línea de tiempo = **API-DSH-04** con la ruta del 09 (`GET /advisees/{id}/timeline`). Proyecciones = **API-PRJ-01**
  (`GET /advisees/{id}/projections/{key}`). La guardia `scripts/trazabilidad-de-operaciones.test.cjs` exige la ruta del 09.
- Las vistas guardadas son una familia propia de BE, declarada en una DL.

## Próximo paso

Ver la tabla de hitos: el primero «En curso» o «Pendiente».
