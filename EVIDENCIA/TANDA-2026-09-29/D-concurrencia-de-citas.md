# Entregable D · Concurrencia real entre citas y rectificación (DL-102)

**Rama:** `test/concurrencia-citas` (base `main` `065689b`). **Solo agrega una prueba. No hizo falta corregir código:** no apareció ningún defecto.

## Qué admite el contrato

La API corre en READ COMMITTED.
- `validarCitas` (`apps/api/src/entrenamiento/citas-de-respuestas.ts`) lee cada respuesta **una sola vez**, en la transacción de la evaluación. Una sola consulta trae la respuesta con sus rectificaciones, y la cita queda en la versión vigente de esa lectura.
- Con `expectedVersion`, si esa lectura ve otra versión, la API responde `409 VERSION_CONFLICT` sin escribir nada.
- La base **no** exige que la versión citada siga siendo la vigente al confirmar (comentario del trigger en la migración `20260928010000`). Si una rectificación se confirma después de la lectura, la cita queda en la versión leída y la lectura avisa con `laterVersionExists`.

Resultados admitidos frente a una rectificación v1 → v2:

| Cuándo lee la evaluación | Con `expectedVersion: v1` | Sin `expectedVersion` |
|---|---|---|
| Antes de que la rectificación se confirme | 201, cita v1 (orden serial «evaluación, después rectificación») | 201, cita v1 |
| Después | 409, sin escrituras | 201, cita v2 |

## Cómo se fijó el orden

No hay pausas por tiempo. Una conexión aparte de la prueba toma y retiene un bloqueo que la transacción real necesita en un punto conocido:
- `LOCK TABLE evaluacion_de_entrenamiento IN SHARE MODE`: la evaluación ya leyó sus citas y espera para insertar (en `evaluaciones.service.ts`, `validarCitas` va antes del INSERT);
- `LOCK TABLE rectificacion_de_respuesta_de_formulario IN SHARE MODE`: la rectificación ya leyó y verificó su versión, y espera su INSERT;
- el advisory lock de la Idempotency-Key (`IdempotenciaService.ejecutar`, lo primero de la transacción): la evaluación está en vuelo pero todavía no leyó nada.

La prueba espera **por condición**, hasta ver en `pg_locks` el pedido no concedido de la otra transacción. Solo entonces hace la operación concurrente, comprueba que la retenida **seguía sin terminar** y recién ahí suelta el bloqueo. SHARE no choca con las lecturas (ACCESS SHARE) ni con las claves foráneas (ROW SHARE): solo frena el INSERT.

## Intercalaciones probadas

`test/integration/concurrencia-citas.int-spec.ts`, 4/4. Se corrió tres veces seguidas sobre la misma base con el mismo resultado.

| | Intercalación | Resultado comprobado |
|---|---|---|
| I1 | La evaluación lee v1 → la rectificación a v2 se confirma → la evaluación inserta y se confirma | 201. **Las dos citas de la misma respuesta quedan en v1** (en la base, las dos sin rectificación). Valor, versión, fecha, rótulo y unidad coherentes con la v1. `laterVersionExists` en verdadero |
| I2 | La rectificación lee v1 → la evaluación lee v1 y se confirma → la rectificación inserta v2 | La evaluación cita v1. **Después de la v2, conserva exactamente lo citado** y solo agrega `laterVersionExists` |
| I3 | La evaluación en vuelo, antes de leer → la rectificación a v2 se confirma → la evaluación lee v2, con `expectedVersion: v1` | 409 `VERSION_CONFLICT` (`FORM_RESPONSE_VERSION_CHANGED` en la primera cita); **ninguna evaluación ni cita en la base** |
| I3′ | La misma, sin `expectedVersion` (cliente anterior) | 201. **Las dos citas en v2** (la misma rectificación), con los valores, la fecha y el rótulo de la v2 |

## Lo que no quedó probado

- **Una rectificación entre dos lecturas de la misma respuesta dentro de una evaluación.** Esa intercalación no existe en el código: `validarCitas` hace una sola consulta por respuesta y guarda el resultado para las demás citas. Por eso la no mezcla se sostiene por el código, más I1 e I3′, y no por una barrera entre dos lecturas, que no se puede colocar.
- **Dos rectificaciones simultáneas de la misma respuesta.** Queda fuera de este entregable (no son citas).
- **Evaluaciones concurrentes con la misma Idempotency-Key.** Ya las cubre la prueba de idempotencia existente.
- **Niveles de aislamiento distintos de READ COMMITTED.** La API no usa otros.

## Pruebas ejecutadas

- Integración `concurrencia-citas`: 4/4, en tres corridas.
- Junto con la regresión de `contexto-entrenamiento` y `formularios-errores`: 32/32.
- Controles del repositorio: `npm test`, typecheck y legajo.
