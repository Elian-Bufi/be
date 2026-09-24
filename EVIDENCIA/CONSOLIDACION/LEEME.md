# Evidencia · tramo de consolidación

Tramo definido en `docs/paquetes/WP-CONSOLIDACION.md`, cerrado el 2026-09-24 con la versión 0.8.0 (PRs #66 a #71). Defensa en `DEFENSA/CONSOLIDACION.md`; nota de MESA en `docs/mesa/MESA_01/ESTADO_PUNTOS_5_11_CONSOLIDACION.md`.

| Archivo | Qué demuestra |
|---|---|
| `resultados-integracion-416fb14.json` y `.md` | La suite de integración de la CI de `main` en el commit de cierre `416fb14` (corrida 35954813509): **427/427** en 23 suites, contra PostgreSQL 16 real |
| `ci-verificar-416fb14.log` | El job `verificar` de esa corrida: typecheck, pruebas unitarias del dominio y de la API, guardia de copy, build y auditoría de dependencias |
| `verificacion-urls.txt` | El despliegue de `test` con la versión 0.8.0 y el commit `416fb14`, verificado después del merge |

## Lo que no está acá

- **La APK.** El tramo no tuvo APK propia: la siguiente APK, 0.9.0, sale una sola vez al cerrar el tramo de identidad visual y trae los cambios de los dos (evidencia en `EVIDENCIA/IDENTIDAD/`).
- **Las capturas del website**, que se tomaron al cerrar la entrega, en `EVIDENCIA/ENTREGA/capturas-web/`. Dos son de este tramo: el workspace con las tarjetas de dominio y su resumen factual (`web-04`) y los registros de nutrición con «Sin registro» en los días sin dato (`web-05`). Las de la APK las toma Dirección en su teléfono, por su decisión del 2026-09-22.
- **Una pantalla de historial de entrenamiento en la APK**: DL-096. La garantía de DL-089 está en la API y en sus pruebas (`entrenamiento.int-spec.ts`).
