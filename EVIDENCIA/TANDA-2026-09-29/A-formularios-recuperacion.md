# Entregable A · Formularios: recuperación ante errores al responder y corregir

**Rama:** `fix/formularios-recuperacion` (base `main` `065689b`). **Sin cambios de contrato, API ni base:** es dominio y APK.

## Qué devolvía la API y qué mostraba la APK (en `main`)

Cada caso se reprodujo contra la API real en `test/integration/formularios-recuperacion.int-spec.ts`.

| Caso | Lo que devuelve la API | Lo que mostraba la APK 0.12.0 |
|---|---|---|
| Responder una solicitud ya respondida desde otro lado, o con el vínculo pausado | `422 FORM_REQUEST_NOT_RESPONDABLE` | «El servicio no está disponible…», sin salida |
| Corregir cuando la historia no admite otra corrección | `422 FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` | «El servicio no está disponible…» |
| Corregir sobre una versión vieja | `409 VERSION_CONFLICT`, sin escribir | «Este contenido cambió… Actualizá la vista», pero la pantalla no ofrece actualizar, y salir pierde lo escrito |
| Editar y reenviar después de un resultado incierto, cuando el primer envío sí se guardó | `409 IDEMPOTENCY_KEY_REUSED`, sin duplicar (la clave se conserva ante un resultado incierto y la API solo guarda éxitos) | «El servicio no está disponible…» |

Hay un caso que no admite duplicados en ningún orden: si el primer envío **no** llegó, el envío editado con la misma clave se procesa una vez, porque la API no guarda los errores.

## Corrección

- **Dominio** (`packages/domain/src/errores-de-formulario.ts`): `desenlaceDeEnvio(r, campos, { esCorreccion })` decide un desenlace por caso, sin juntarlos en una sola categoría:
  - `por-campo` y `dato-no-aceptado`: como DL-104, sin cambios;
  - `ya-no-se-puede` (responder o corregir), `version-vieja` (solo al corregir) y `envio-anterior-guardado`: cada uno con su mensaje y las acciones «Cargar lo guardado» y «Volver a Información»;
  - `null`: red, 404 y servicio siguen en `falloDe`, sin cambios. El resultado incierto conserva «Reintentar» y la misma clave.
- **APK** (`apps/mobile/src/pantallas/formularios.tsx`; `App.tsx` le pasa `volver`):
  - el aviso de esos casos trae los dos botones;
  - **el borrador (lo escrito y el motivo) se conserva** y se dice «Lo que está en los campos es tu borrador: todavía no se envió.»;
  - «Cargar lo guardado» vuelve a leer la solicitud (FRM-05) **sin pisar el borrador y sin reenviar**. Si la solicitud ya tenía respuesta, la pantalla pasa a corregir, con el borrador en los campos;
  - la historia marca como **Vigente** la versión guardada que rige, así se distingue de lo que está en los campos;
  - la clave de idempotencia sigue la política validada: se renueva después de un resultado definitivo y se conserva ante uno incierto.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Unitarias de dominio, 6 nuevas: cada código con su desenlace, pasado por el mismo cliente HTTP de la APK; los casos de DL-104 sin cambios; red, 404, 500 y 503 siguen en `falloDe`; textos sin términos prohibidos | dominio 297/297 |
| Integración `formularios-recuperacion.int-spec.ts`, que pasa la respuesta real por `desenlaceDeEnvio`: ya respondida; vínculo pausado; versión vieja sin escrituras y después la corrección con la versión recargada; edición tras un resultado incierto al responder y al corregir (409, una sola respuesta o corrección, y el reintento sin editar devuelve lo guardado); primer envío no llegado (el editado se procesa una vez) | 6/6 |
| Regresión de formularios, contrato y PF-02 | 46/46 |
| `npm test`, typecheck (incluye la APK), `openapi:verificar`, legajo | verdes |

**Cómo se reprodujo el defecto.** En `main` no había traducción para esos códigos: `rechazoDeFormulario` devuelve `null` para todo lo que no es `FORM_RESPONSE_INVALID`, y `falloDe` (`apps/mobile/src/intento.ts`) cae en `COPY.noDisponible` para `FORM_REQUEST_NOT_RESPONDABLE`, `FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` e `IDEMPOTENCY_KEY_REUSED`. Las pruebas unitarias nuevas fallan contra `main` porque la función no existe; las de integración fijan los códigos reales.

## Revisión enfocada

Una revisión de solo lectura del diff encontró un defecto de severidad media, ya corregido: después de un «ya no se puede» con el vínculo pausado, «Cargar lo guardado» decía «lo guardado está arriba» aunque la solicitud no tuviera respuesta. Ahora la carga devuelve lo que leyó. Si no hay respuesta guardada, lo dice («Esta solicitud no tiene una respuesta guardada y ahora no se puede responder…») y ofrece volver. Si la lectura falla, no muestra ningún aviso. La prueba de integración del vínculo pausado comprueba que FRM-05 devuelve  en ese caso.

La revisión confirmó el resto: el mapeo de códigos contra la API, la clave de idempotencia (los cuatro desenlaces son definitivos y la renuevan; el resultado incierto la conserva), el borrador conservado, el paso de responder a corregir y DL-104 sin cambios.

## Límites y comprobación nativa pendiente

- `FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` no se puede producir por la API sin corromper la historia de la respuesta: su desenlace se probó solo en la unitaria.
- La pantalla se verificó por typecheck y por una revisión enfocada del diff. **No se vio en un teléfono.** Que cargar lo guardado no pise el borrador ni lo reenvíe se sostiene por el código: no hay prueba automatizada de la pantalla.
- **Comprobaciones para una APK futura:**
  1. Responder la misma solicitud desde dos dispositivos: en el segundo, el mensaje específico; «Cargar lo guardado» pasa a corregir con lo escrito intacto.
  2. Corregir desde dos dispositivos: en el segundo, el mensaje de versión vieja; lo escrito y el motivo intactos; después de cargar, la corrección nueva figura como Vigente y el reenvío manual se registra.
  3. Sin conexión: «No pudimos confirmar…» y «Reintentar». Al volver la conexión, editar y reenviar muestra «Tu envío anterior sí se guardó…», sin duplicar.
  4. Volver a Información desde el aviso.
  5. Lo validado en la 0.12.0 sigue igual: errores por campo, valores conservados y reintento.
