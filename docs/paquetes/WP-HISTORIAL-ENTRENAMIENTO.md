# Tu historial de entrenamiento — definición del paquete (DL-096, opción A)

> **Estado:** EN CURSO. Opción A de DL-096 autorizada por Dirección el 2026-09-25. Implementada; **no cerrada como verificada** hasta la comprobación visual de la pantalla en el teléfono (entra en la próxima APK; la 0.10.0 no la incluye).
> **Origen.** DL-096: el titular tiene acceso pleno a «Plan entrenamiento + ejecución» (08:199) y el fin del vínculo no destruye su historia (08:58); DL-089 lo llevó a la API. Hasta acá ninguna pantalla de la APK lo usaba: «Hoy» y el registro en diferido operan sobre el plan vigente y —correctamente— pasan a «no disponible» con el B2 revocado.

## Decisión (2026-09-25)

Dirección autoriza la **opción A**: acceso del asesorado a sus planes históricos y ejecuciones propias desde la APK, incluyendo la lectura propia por período que faltaba. Esta autorización habilita implementar el paquete.

## OBJETIVO

Que el asesorado encuentre y consulte su historia de entrenamiento desde una sección «Tu historial», aun sin plan vigente o con el vínculo finalizado, conforme a las reglas de acceso del titular.

## Alcance

- **Reutiliza** las operaciones que ya existen y ya soportan al titular con solo A3: listar sus planes (**API-TRN-08**, rama `listarComoTitular`) y consultar cada versión histórica tal como se aceptó (**API-TRN-09**).
- **Suma** la lectura que faltaba: **API-TRN-19-LISTA** (`GET /me/training/executions`), la lista de sus sesiones registradas por período. El 09 no la declara: es un desvío documentado, igual que API-NUT-16-LISTA (DL-055). Su detalle es la pantalla de ejecución existente (**API-TRN-19**), que muestra el original y las correcciones sin ocultar ninguno.
- Es un incremento **de consulta**: sin edición histórica, sin analítica de rendimiento, sin cambios de planes.

## Reglas de acceso

- Las tres lecturas exigen **solo el A3 vigente** del titular (08:199, 08:58, 08:406; DL-089): no dependen de un plan activo ni de que el profesional conserve el acceso. Revocar B2 o finalizar el vínculo no bloquea la historia propia; **revocar A3 sí** la suspende (403 `ACTION_FORBIDDEN`).
- No amplía el acceso de los profesionales: TRN-19-LISTA es `/me`, del propio titular.
- La versión histórica se muestra tal como se aceptó, con los nombres de su instantánea, no los del catálogo actual (REG-06-112).
- El listado tiene orden estable (fecha descendente, luego ocurrencia e id) y un tope de filas; la ventana es de hasta un año.

## Contrato

| Operación | Método y ruta | Fuente |
|---|---|---|
| API-TRN-08 (reuso) | `GET /advisees/{adviseeId}/training/plans` | 09v10 §… (titular: DL-089) |
| API-TRN-09 (reuso) | `GET /training/plans/{planId}` | 09v10 §… (titular: DL-089) |
| API-TRN-19 (reuso) | `GET /training/executions/{executionId}` | 09v10:1203-1217 |
| **API-TRN-19-LISTA** (nueva) | `GET /me/training/executions?periodStart&periodEnd` | DL-096 (desvío del 09, como DL-055) · 08:199, 08:58, 08:406 · DL-089 |

## APK

Una sección **«Tu historial»**, accesible desde Cuenta (siempre alcanzable, aun con «Hoy» no disponible). Muestra las **sesiones registradas** por período —cada una abre su detalle— y **tus planes** —cada uno abre su versión histórica—. Estados de carga, vacío comprensible, error y «necesitás A3» resueltos. De solo lectura.

## Verificación

- **Integración (API):** seis casos en `test/integration/entrenamiento.int-spec.ts` (describe DL-096): 1) el titular lista lo propio; 2) otro usuario no ve la historia ajena; 3) con B2 revocado el titular conserva la lista y «Hoy» pasa a no disponible; 4) con A3 revocado la lista da 403; 5) la corrección no oculta el original; 6) funciona sin plan y devuelve vacío comprensible. Más el rechazo de períodos inválidos.
- **Comprobación visual (APK):** pendiente en el teléfono, con la próxima APK. Se deja el recorrido manual en el PR.

## Fuera de alcance

- Edición o corrección desde esta sección (es lectura; corregir es TRN-20, en el detalle).
- Analítica de rendimiento, puntajes o adherencia (TEST-PRJ-009: cero juicio).
- Búsqueda por texto o filtros avanzados del historial.
