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
| 1 | Delta, investigación, especificación y definición del paquete | Hecho | `aa24073` |
| 2 | Dominio: diccionario de métricas, agregaciones, línea de tiempo y comparación de períodos, con pruebas | Hecho | (este commit) |
| 3 | API: API-DSH-04 (línea de tiempo), API-PRJ-01 (proyecciones), vistas guardadas, con migración y pruebas de integración | En curso | — |
| 4 | Datos sintéticos reproducibles de 12 semanas y resultados esperados | Pendiente | — |
| 5 | Website: Resumen, Línea de tiempo y Analizar dentro de la ficha | Pendiente | — |
| 6 | Recorridos reales, capturas, accesibilidad, rendimiento y matriz de aceptación | Pendiente | — |
| 7 | PR en borrador con la CI del head final | Pendiente | — |

## Decisiones tomadas (resumen; el detalle está en la definición del paquete)

- Arquitectura A: tres vistas dentro de la ficha del asesorado (B10-08 §4 y §32), sin un `/dashboard` universal.
- Línea de tiempo = **API-DSH-04** con la ruta del 09 (`GET /advisees/{id}/timeline`). Proyecciones = **API-PRJ-01**
  (`GET /advisees/{id}/projections/{key}`). La guardia `scripts/trazabilidad-de-operaciones.test.cjs` exige la ruta del 09.
- Las vistas guardadas son una familia propia de BE (`VAN`, DL-128), declarada en `FAMILIAS_DE_BE` de la guardia de
  trazabilidad.
- **Entrenamiento por número de serie:** carga, repeticiones y RIR se comparan serie 1 con serie 1, sesión por sesión.
  Se descartó «la serie más pesada» porque el 09 prohíbe máximos, sumas y promedios entre series (09v10:1285-1295).
- **Nutrición:** el día es la suma exacta de lo conocido (subtotal si falta algo); la semana es la media de los días con
  valor, con su denominador. La anulación queda fuera y la rectificación cuenta una vez.
- **Antropometría:** cada toma es un punto; los tramos se cortan por grupo de comparabilidad y por
  `incomparableWithPrevious`. ANT-06 conserva su límite de 92 días; la proyección lee hasta 366.
- **Línea de tiempo:** orden por fecha del hecho descendente, con hora primero, `recordedAt` y el id; cursor opaco
  en base64url de esa clave. `q` busca en el período completo.
- **Captura futura:** solo investigada (F-12 y F-13 en el diccionario); recomendación: circunstancias de la medición,
  esfuerzo percibido de la sesión y eventos de enfermedad, en ese orden.

## Pruebas al cierre de cada hito

| Hito | Prueba | Resultado |
|---|---|---|
| 1 | `verificar-legajo` | Íntegro (207 de 208, como en `main`) |
| 2 | `analisis-longitudinal.test.ts` (oráculos a mano, con mutaciones: media semanal por suma y anulados contados, las dos detectadas) | 30/30 |
| 2 | Dominio completo | 546/546 |

## Próximo paso

Ver la tabla de hitos: el primero «En curso» o «Pendiente».
