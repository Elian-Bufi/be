# Evidencia · PR #101 — citas de respuestas en la evaluación de entrenamiento (DL-102)

Evidencia para la auditoría del PR #101, organizada por las cinco dimensiones que pidió Dirección: autorización, conservación de la versión citada, rectificaciones, lectura tras revocar permisos, y migración y restricciones de integridad. Ficha: `docs/propuestas/PF-01-02_contexto-de-entrenamiento.md`.

## Cómo se preparó

1. Una **revisión adversarial**, antes de entregar. Un revisor por dimensión cruzó código y pruebas. Cada hueco que encontró pasó por **dos verificadores independientes** que intentaron refutarlo: participaron 77 agentes, que solo leyeron el código. Se confirmaron 32 huecos, con solapamientos entre dimensiones: 6 marcados como defecto (dos son el mismo: el trigger sin el profesional ni el alcance), 19 pruebas faltantes (varias repetidas) y 7 de documentación. Todos se resolvieron en este PR.
2. **Defectos corregidos** en el código y la migración (la migración todavía no está en `main`, así que se corrigió la del PR, no una nueva):
   - la repetición de una cita se detectaba con el texto del id: el mismo UUID en mayúsculas la esquivaba. Ahora se compara el **id canónico**, después de comprobar la pertenencia, y además hay un **índice único** (evaluación, respuesta, campo);
   - cada cita volvía a leer la respuesta, y con una rectificación concurrente dos citas de la misma respuesta podían quedar en versiones distintas. Ahora **cada respuesta se lee una sola vez** por evaluación;
   - el trigger no exigía, a nivel de base, el profesional ni el alcance de la Solicitud, y permitía agregar citas a una evaluación ya registrada. Ahora **exige las dos cosas y la misma transacción** (`xmin`, el patrón de `be_transicion_con_hecho`);
   - la unidad de la cita ignoraba la que había declarado la persona. Ahora es **la declarada o, si no hay, la de la plantilla**.
3. **Documentación corregida:**
   - DL-102 y la ficha prometían un «aviso neutral» por cita, que no existe: la evaluación entera da 404;
   - un JSDoc había quedado huérfano;
   - faltaba la definición de `answeredAt`;
   - no se explicaba por qué la base no exige «versión vigente» (carrera con una rectificación concurrente).

## Resultado de las pruebas (local, antes de la CI)

| Suite | Resultado |
|---|---|
| Integración (PostgreSQL 16 local, sin deriva de esquema) | **477/477** (464 antes de este PR) |
| Unitarias de la API | **47/47** (3 nuevas, de `validarCitas`) |
| Dominio | 274/274 |
| Scripts | 24/24 |
| Typecheck, `openapi:verificar`, legajo, build del website | sin errores |

La CI del PR corre las mismas suites sobre el commit entregado.

## Evidencia por dimensión

Las pruebas de integración están en `test/integration/contexto-entrenamiento.int-spec.ts`, agrupadas en un `describe` por dimensión.

### 1. Autorización de las citas

| Regla | Código | Prueba |
|---|---|---|
| Solo respuestas del mismo asesorado, a una Solicitud del mismo profesional, de alcance ENTRENAMIENTO, con el campo respondido en la versión vigente | `apps/api/src/entrenamiento/citas-de-respuestas.ts` (`leerCitable`) | «V-01 · CA-FOR-07 …» (l. 120): otra persona, otro profesional, **otro alcance (NUTRICION)**, id inexistente, **id malformado**, campo pedido y no respondido, campo inexistente |
| El 422 es **idéntico** exista o no la respuesta | `invalida()`: mismo código, mensaje e issue | Misma prueba: se compara el **cuerpo completo** de cada caso con el del id inexistente |
| Una cita no se repite, tampoco con otras mayúsculas | comparación con el id canónico, después de la pertenencia | Misma prueba (índice 1) y unitaria «repetición con otras mayúsculas» (`citas-de-respuestas.spec.ts` l. 49) |
| Un intento rechazado no escribe nada | `validarCitas` corre antes de `create`, en la misma transacción | Misma prueba: la lista queda vacía |
| **El PDP decide antes que las citas**: sin vínculo, B2 o rol profesional, da 404 aunque las citas sean válidas (nunca un 422 que sirva de oráculo) | `evaluaciones.service.ts`: `decidir` antes de `validarCitas` | «el PDP decide antes que las citas …» (l. 169): el titular con sus propios ids y el profesional con B2 revocado (404 idéntico al de un asesorado inexistente); cero evaluaciones en la base |
| La cita es una referencia sin valor, con `fieldCode` acotado, hasta 20, y opcional | `CitaDeRespuestaDeFormularioSchema` | `packages/domain/src/contratos-wp06.test.ts` l. 445 |
| Compatibilidad: sin citas, igual que antes | `formResponseReferences` opcional | «compatibilidad …» (l. 114) |

### 2. Conservación de la versión citada

| Regla | Código | Prueba |
|---|---|---|
| La cita fija la versión vigente al citar, y la base guarda la rectificación terminal de ese momento | `leerCitable` + `resolverVistaEfectiva` | «V-07 · con tres versiones (v1 → v2 → v3) …» (l. 187): tres evaluaciones citan v1, v2 y v3. Por **detalle y por lista**, cada una conserva su **valor, `citedVersion` y `answeredAt`**, y `laterVersionExists` es verdadero en las dos primeras. En la base, `rectificacion_id` es `null`, la de v2 y la de v3 |
| `answeredAt` es el envío original (v1) o la rectificación citada | `citasResueltas` | Misma prueba: se compara con `submittedAt` y con cada `recordedAt` |
| Unidad: la declarada o, si no hay, la de la plantilla | `citasResueltas` | «la unidad es la que declaró la persona …» (l. 214) |
| Una versión nueva de la plantilla no cambia el rótulo ni la unidad de lo citado | se lee la versión de plantilla de la Solicitud | «una versión nueva de la plantilla …» (l. 226): se inserta una sucesora con otro rótulo y otra unidad, y lo citado se mantiene |
| Lo citado es siempre `SELF_REPORTED` | `RespuestaCitadaSchema` | `contratos-wp06.test.ts` l. 461 |

### 3. Comportamiento ante rectificaciones

| Regla | Prueba |
|---|---|
| Si una rectificación **quita** el campo citado, lo citado se sigue leyendo con su valor, v1 y el aviso, por detalle y por lista; citarlo de nuevo da 422 | l. 257 |
| Si la rectificación **agrega** un campo, se cita la rectificación (v2) | l. 268 |
| Dos citas de la misma respuesta quedan en la **misma versión** | l. 276 (integración) y la unitaria «lee cada respuesta una sola vez» (`citas-de-respuestas.spec.ts` l. 38): con una transacción que cambia la cadena entre lecturas, hay una sola lectura y la misma rectificación para las dos citas |
| Carrera con una rectificación concurrente: la cita nace con la versión leída y la lectura avisa `laterVersionExists` | Documentado en `citas-de-respuestas.ts` y en la migración. No se prueba de forma determinista con dos transacciones reales |

### 4. Lectura tras revocar permisos

| Regla | Código | Prueba |
|---|---|---|
| Otro profesional (con su propio vínculo) y otro asesorado no leen una evaluación con citas: 404 idéntico al inexistente y lista vacía, sin contenido | `consultarEvaluacion`: PDP y autor antes de `citasResueltas`; `listarEvaluaciones` filtra por profesional | «V-01 · otro profesional y otro asesorado …» (l. 292) |
| Revocado el **B2**, revocado el **A3** del titular, **pausado** o **finalizado** el vínculo: el detalle da 404 idéntico al inexistente, sin contenido, y la lista da 404 idéntico al de un asesorado inexistente | `decidir` antes de resolver las citas | «V-02 · %s …» (l. 315), parametrizada en los cuatro cortes |
| No hay aviso por cita: una cita se lee exactamente cuando se lee su evaluación | Condiciones de la cita = FRM-05; nota de implementación en DL-102 | Las dos filas anteriores |

### 5. Migración y restricciones de integridad

Migración: `prisma/migrations/20260928010000_citas_de_respuestas_en_evaluacion/migration.sql`. Son pruebas a nivel SQL, en transacciones que se revierten.

| Restricción | Prueba |
|---|---|
| El trigger exige el **mismo asesorado**, una **Solicitud del mismo profesional** y el **alcance ENTRENAMIENTO**: rechaza la respuesta de otra persona, de otro profesional y de NUTRICION | l. 352 |
| El trigger exige que la **rectificación sea de la misma respuesta** | l. 352 |
| El trigger exige que las citas **nazcan en la misma transacción que su evaluación**: no se agregan después | l. 352 |
| Control: una cita coherente, insertada junto con su evaluación, pasa | l. 352 |
| **Solo agregado**: UPDATE y DELETE se rechazan | l. 388 |
| **TRUNCATE** se rechaza | `test/integration/schema.int-spec.ts` (lista de tablas, l. 225) |
| **CHECK**: campo no vacío; orden no negativo | l. 388 |
| **UNIQUE** (evaluación, orden) y (evaluación, respuesta, campo) | l. 388 |
| Sin **deriva** entre `schema.prisma` y las migraciones | `schema.int-spec.ts` (deriva), en verde |

## Lo que no está comprobado

- El recorrido en el **ambiente desplegado**: este PR no se integra hasta la aprobación.
- La **carrera** con una rectificación concurrente: el comportamiento está razonado y documentado, sin una prueba con dos transacciones reales.
- El **website** (PR #102) sigue esperando su propia auditoría.

Solo datos sintéticos. Sin credenciales.
