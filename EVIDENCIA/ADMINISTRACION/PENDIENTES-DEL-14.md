# Administración · los tres pendientes del §14 (encargo nocturno del 2026-10-27)

Los tres pendientes que dejó la pasada de cierre del 2026-10-25 (WP-ADMINISTRACION §14). Dirección los dejó sin
implementar al autorizar la integración. Este trabajo va en un PR en borrador, sin integrar ni desplegar; test no cambia.
Base: `main` en `e4512cb`.

## En criollo

- **Las pruebas de carrera ya no adivinan con el reloj.** Antes, tres pruebas esperaban 400, 500 u 800 milisegundos «para
  que el otro pedido llegue». Si la máquina andaba lenta, la prueba podía pasar sin haber probado nada. Ahora la prueba le
  pregunta a la base si el otro pedido está esperando la fila, y recién ahí sigue. Si nunca llega a esperar, la prueba lo
  dice y falla.
- **Dos cambios del autenticador al mismo tiempo tenían un error.** Si la misma persona empezaba a cambiar su autenticador
  desde dos sesiones a la vez (el teléfono y la computadora), una de las dos recibía un error 500. La causa: las dos
  pasaban juntas y la base, que admite una sola configuración pendiente por persona, rechazaba la segunda. Ahora la
  segunda espera a la primera, descarta la configuración anterior y sigue. Es lo que dice el contrato: «empezar otra
  descarta la anterior».
- **Un rechazo que aparecía a mitad de camino no dejaba rastro.** Un pedido puede pasar el control de la entrada con la
  sesión activa y, mientras espera su turno, otro pedido o el operador le cierran la sesión. Respondía 401, pero como su
  transacción se deshacía entera, no quedaba nada en la auditoría. Ahora ese rechazo se anota aparte, después, con el
  mismo motivo que usaría el control de la entrada.

## A · Sin pausas

| Prueba | Antes | Ahora |
|---|---|---|
| F2 · un código que esperaba detrás del quinto fallido | `pausa(500)` antes de revocar la sesión | Revoca recién cuando la base dice que el código bueno espera la fila del segundo factor de su sesión |
| F3 · el operador y una confirmación al mismo tiempo | `pausa(400)` antes de activar el autenticador | Lo activa recién cuando la base dice que el comando espera ese autenticador |
| El cruce de la decisión con una operación profesional en curso | La decisión no terminó en 800 ms | La base dice que la decisión espera lo que tomó la operación en curso |

- **La barrera es la de la renovación.** Pasó de `administracion-renovacion-de-codigos.int-spec.ts` a
  `test/integration/soporte-concurrencia.ts`, compartida. Las pruebas de la renovación no cambiaron.
- **Ahora puede contar solo a quien espera a la transacción de la prueba** (`pg_blocking_pids`), no cualquier espera de
  la base.
- **Cada prueba comprueba que llegó al punto de concurrencia.** Si el pedido termina sin esperar, falla con «la carrera
  no se reprodujo».
- **El tope (20 s) no ordena nada.** Si se agota, el mensaje lista qué hacía cada conexión: su estado, qué espera, quién
  la bloquea y su consulta con los parámetros como `$1`. No aparece ningún valor.

## B · Dos reemplazos del autenticador al mismo tiempo

**Lo que fija el contrato** (§6.3, API-ADM-07 y 08, y la base):
- el autenticador anterior vale hasta que se confirma el nuevo;
- empezar una configuración descarta la pendiente anterior, y hay una sola pendiente y un solo activo por identidad
  (índices únicos);
- confirmar cierra las otras sesiones administrativas.

El contrato no dice cuál de dos pedidos simultáneos gana. La prueba exige lo que sí garantiza:
- uno solo termina con éxito;
- el otro no recibe éxito ni códigos;
- queda un activo, sin pendiente que se pueda confirmar;
- queda un solo lote de códigos vigente;
- la sesión que perdió queda cerrada con su motivo;
- el rechazo queda auditado, sin secretos.

**El defecto.** Empezar la configuración (API-ADM-07) tomaba la identidad en modo compartido. Pasaba así:
1. dos configuraciones empezadas a la vez entraban juntas;
2. cada una descartaba las pendientes que veía, pero no la de la otra, que todavía no estaba confirmada;
3. la segunda en insertar chocaba con el índice único `factor_totp_pendiente_por_identidad` (P2002);
4. ese error no es un conflicto transitorio, así que salía como **500 INTERNAL_ERROR**.

**La corrección mínima.** API-ADM-07 toma la identidad en modo exclusivo (`tomarLaIdentidadEnExclusiva`), como la
renovación y el comando. La segunda espera a la primera, ve su pendiente confirmada y la descarta. Confirmar sigue en modo
compartido. El orden de bloqueos no cambia: la identidad, primero.

**Las pruebas** (`administracion-reemplazo-del-autenticador.int-spec.ts`):
1. **Dos configuraciones empezadas a la vez, y después dos confirmaciones cruzadas.**
   - La prueba crea una pendiente previa P0, la retiene y suelta las dos configuraciones cuando las dos esperan.
   - Sin la corrección, las dos esperan P0 con la identidad compartida. Ninguna ve lo que la otra crea después, y la
     segunda responde 500, siempre.
   - Con la corrección, las dos responden 200 y queda una sola pendiente, la de la segunda.
   - Después las dos sesiones confirman a la vez. Gana la que tiene la pendiente. La otra recibe 422 (ya no tiene qué
     confirmar) o 401 (su sesión se cerró), según quién lea primero; las dos respuestas son del contrato.
   - Se comprueba el estado final de autenticadores, sesiones, códigos y auditoría, y que el autenticador nuevo sirve
     para entrar.
2. **Una confirmación y otra configuración desde otra sesión, al mismo tiempo, en los dos órdenes.** Es el «peor cruce»
   que estaba revisado solo leyendo el código.
   - **La confirmación primero:** confirma, cierra la otra sesión, y la configuración que esperaba encuentra su sesión
     cerrada (401, auditado).
   - **La configuración primero:** descarta la pendiente de la primera, y la confirmación ya no tiene qué confirmar
     (422). El autenticador y el lote anteriores siguen valiendo.

## C · Los rechazos dentro de la transacción

- `estadoBloqueado` (la lectura de la sesión con sus filas tomadas) lanza `SesionQueDejoDeValer`: el mismo 401
  `SESSION_REVOKED` del guard, con el motivo del guard (`SESION_<estado>`) en `motivoDeAuditoria`, que nunca se serializa.
- `enTransaccion` envuelve las transacciones de API-ADM-05 a 09 (y la lectura del estado después de confirmar). Si atrapa
  ese rechazo, la transacción ya se revirtió: lo registra aparte, con la operación que se intentó, y lo vuelve a lanzar.
  Es el mismo patrón del PDP (`DenegacionDelPdp` y `registrarDenegacion`).
- **Ningún éxito incorrecto:** lo que se iba a escribir se revirtió.
- **Ningún secreto:** la auditoría lleva la operación, el resultado, el motivo, la identidad y la sesión. No lleva nada
  del cuerpo, así que tampoco los códigos ni la contraseña.
- **No hizo falta una decisión de contrato:** `motivo` es texto interno, y el guard ya usa `SESION_<estado>` para el
  mismo hecho.

Las pruebas: las de la renovación suman la auditoría de sus rechazos:
- la segunda de dos renovaciones: `SESION_REVOCADA`;
- detrás del comando del operador: `SESION_REVOCADA`;
- detrás del cierre de su sesión: `SESION_FINALIZADA`;
- dos renovaciones de la misma sesión: sin rechazos.

F2 suma la de su código bueno. Las de B, la de la configuración que encontró su sesión cerrada.

## Comprobación

_Se completa con la CI del PR y la corrida de las mutaciones._
