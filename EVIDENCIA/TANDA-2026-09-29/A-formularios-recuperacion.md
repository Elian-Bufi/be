# Entregable A · Formularios: recuperación ante errores al responder y corregir

**Rama:** `fix/formularios-recuperacion` (base `main` `065689b`). **Sin cambios de contrato, API ni base:** es dominio y APK.

## Qué devolvía la API y qué mostraba la APK (en `main`)

Cada caso se reprodujo contra la API real en `test/integration/formularios-recuperacion.int-spec.ts`.

| Caso | Lo que devuelve la API | Lo que mostraba la APK 0.12.0 |
|---|---|---|
| Responder una solicitud ya respondida desde otro lado, o con el vínculo pausado | `422 FORM_REQUEST_NOT_RESPONDABLE` | «El servicio no está disponible…», sin salida |
| Corregir cuando la historia no admite otra corrección | `422 FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` | «El servicio no está disponible…» |
| Corregir sobre una versión vieja | `409 VERSION_CONFLICT`, sin escribir | «Este contenido cambió… Actualizá la vista», pero la pantalla no ofrece actualizar, y salir pierde lo escrito |
| Editar y reenviar después de un resultado incierto, cuando el primer envío sí se guardó | `409 IDEMPOTENCY_KEY_REUSED`, sin duplicar | «El servicio no está disponible…» |

## Corrección

- **Qué mostrar ante cada rechazo** (`packages/domain/src/errores-de-formulario.ts`, `desenlaceDeEnvio`):
  - `por-campo` y `dato-no-aceptado`: como DL-104, sin cambios;
  - `ya-no-se-puede` (con `sobre: respuesta | correccion`), `version-vieja` y `envio-anterior-guardado`: cada uno con su mensaje y sus salidas;
  - red, 404 y servicio siguen en `falloDe`.
- **El estado de la pantalla, en el dominio** (`packages/domain/src/recuperacion-de-formulario.ts`). La pantalla lo usa tal cual con `useReducer`:
  - **Qué se puede hacer sale del contrato** (`habilitacion`):
    - se responde si `status` es `PENDING` **y** `respondable` es verdadero, según FRM-06 (la proyección del PDP, que se lee página por página con `respondibleDe`);
    - se corrige si hay respuesta con historia resoluble;
    - si no, no hay acción.
    - **`response: null` no quiere decir bloqueada:** una pendiente válida también lo tiene.
  - **Un rechazo conocido suspende el envío** (ya no admite respuesta o corrección, versión vieja, envío anterior guardado) hasta volver a leer. Volver a leer **reevalúa**: si la solicitud se puede responder otra vez (por ejemplo, se reanudó el vínculo), el envío se habilita y se dice.
  - **La carga y su reintento son una sola operación con su intención** («abrir» o «recuperar»). Si falla «Cargar lo guardado», el reintento sigue siendo una recuperación y termina con el aviso que corresponde a lo leído.
  - **El borrador (lo escrito y el motivo) solo se limpia cuando un envío se registra.** Ningún rechazo, carga ni error lo toca, y leer nunca reenvía.
- **APK** (`apps/mobile/src/pantallas/formularios.tsx`; `App.tsx` le pasa `volver`):
  - la pantalla lee FRM-05 y, si no hay respuesta, `respondable` de FRM-06;
  - una solicitud que no admite acción lo dice, con «Volver a consultar» y «Volver a Información», y el botón de envío queda deshabilitado;
  - la historia marca como **Vigente** la versión guardada que rige;
  - la clave de idempotencia sigue la política validada en la 0.12.0: se conserva solo ante un resultado incierto, y leer no la toca.

## Resultado incierto: dos escenarios distintos

Un resultado incierto (el cliente devuelve `RED`) puede venir de dos situaciones distintas, y no terminan igual:

| Escenario | Qué pasó | Al reenviar con la misma clave… | Qué ve la persona |
|---|---|---|---|
| **1. El envío nunca llegó al servidor** | Nada se guardó | …se procesa una vez: la API no tiene nada guardado con esa clave. Si la persona editó, se guarda lo editado | «No pudimos confirmar el resultado. Reintentá.», y después «Respuesta enviada.» |
| **2. El servidor guardó, pero la respuesta no llegó al teléfono** | El envío quedó guardado | …sin editar, la API devuelve lo guardado (reintento idempotente). Editado, `409 IDEMPOTENCY_KEY_REUSED`, sin duplicar | Sin editar, «Respuesta enviada.». Editado, «Tu envío anterior sí se guardó…», con «Cargar lo guardado» |

**Activar el modo avión reproduce el escenario 1, no el 2.** Con el teléfono sin red, el pedido no sale y el servidor no guarda nada: al volver la conexión, lo que se reenvía se procesa normalmente y **no** aparece «Tu envío anterior sí se guardó…». El mensaje del escenario 2 solo corresponde cuando el primer envío llegó al servidor.

**Reproducción controlada de los dos, ejecutada.** `formularios-recuperacion.int-spec.ts`, bloque «resultado incierto, reproducción controlada». Usa **el mismo cliente HTTP que la APK** (`crearClienteBe` de @be/domain) contra la API real, con un `fetch` envuelto que hace de red:
- **escenario 1:** el `fetch` falla antes de enviar. El cliente devuelve `RED` y no hay ninguna respuesta en la base. Editado y reenviado con la misma clave, se guarda una sola, y `desenlaceDeEnvio` no da «envío anterior guardado»;
- **escenario 2:** el `fetch` envía de verdad, el servidor guarda, y el `fetch` descarta la respuesta. El cliente devuelve `RED` y **ya hay una respuesta** en la base. Editado, `desenlaceDeEnvio` da `envio-anterior-guardado`. Sin editar, el reintento devuelve lo guardado. Queda una sola respuesta.

**Cómo reproducir el escenario 2 en un teléfono (pendiente, no se hizo).** Hace falta un intermediario que deje pasar el pedido y corte la respuesta: por ejemplo, un proxy entre el teléfono y la API que, para `POST …/form-requests/{id}/responses`, reenvíe el pedido y cierre la conexión sin devolver la respuesta. Sin eso, en un teléfono solo se puede comprobar el escenario 1.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Unitarias del estado de la pantalla (`recuperacion-de-formulario.test.ts`, 12): pendiente válida frente a una que no admite respuesta (las dos con `response: null`); defecto A (después de «ya no se puede», cargar con `response: null` y sin `respondable` deja el envío suspendido y lo dice; con el defecto anterior, el envío quedaba habilitado); reevaluación que vuelve a habilitar; paso a corregir; defecto B (si falla la recuperación, el reintento sigue siendo recuperación y da el mismo resultado); versión vieja y envío anterior guardado; el borrador se conserva ante todo, salvo un envío registrado; los errores por campo y el resultado incierto no suspenden el envío; `respondable` recorriendo páginas de FRM-06 | dominio 309/309 |
| Unitarias de `desenlaceDeEnvio` (6, de la entrega anterior, con el campo `sobre`) | incluidas |
| Integración `formularios-recuperacion.int-spec.ts`: los códigos reales pasados por `desenlaceDeEnvio`, más la reproducción controlada de los dos escenarios de resultado incierto con el cliente de la APK | 8/8 |
| `npm test`, typecheck (incluye la APK), `openapi:verificar` y legajo | ver el PR |

## Revisión enfocada (entrega anterior)

Encontró que «Cargar lo guardado» decía «lo guardado está arriba» sin respuesta guardada. La auditoría agregó dos hallazgos más. Los tres quedan resueltos por el estado explícito y probado:
- el envío seguía habilitado con `response: null`;
- el reintento de una carga fallida perdía la recuperación.

## Límites y comprobación nativa pendiente

- `FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` no se puede producir por la API sin corromper la historia de la respuesta: su desenlace se probó solo en las unitarias.
- **La pantalla no se vio en un teléfono.** Su lógica de estado se prueba en las unitarias, y la pantalla la usa sin copiarla. El dibujo y la navegación se verificaron por typecheck y revisión.
- **Comprobaciones para una APK futura:**
  1. Responder la misma solicitud desde dos dispositivos: en el segundo, el mensaje específico; «Cargar lo guardado» pasa a corregir con lo escrito intacto.
  2. Pausar el vínculo y responder: mensaje específico. «Cargar lo guardado» dice que no hay respuesta guardada, con el botón de envío deshabilitado. Reanudar el vínculo y «Volver a consultar»: el envío se habilita.
  3. Corregir desde dos dispositivos: en el segundo, el mensaje de versión vieja y el envío deshabilitado hasta cargar. Después, la corrección nueva figura como Vigente y el reenvío manual se registra.
  4. **Escenario 1 (modo avión):** «No pudimos confirmar…» y «Reintentar». Al volver la conexión se envía normalmente. **No** debe aparecer «Tu envío anterior sí se guardó…».
  5. **Escenario 2:** solo con un proxy que corte la respuesta (ver arriba).
  6. «Cargar lo guardado» sin conexión: la pantalla de error y «Reintentar». Con conexión, el reintento termina con el aviso de recuperación.
  7. Volver a Información desde el aviso.
  8. Lo validado en la 0.12.0 sigue igual: errores por campo, valores conservados y reintento.
