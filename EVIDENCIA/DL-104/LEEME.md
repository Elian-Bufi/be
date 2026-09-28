# Evidencia · DL-104 — qué campo corregir cuando un número queda fuera de rango

Decisión: opción A, autorizada por Dirección el 2026-09-28. Detalle en `docs/DEUDA_LEGAJO.md`, entrada DL-104.
**Estado: EN CURSO.** La API, el contrato y la lógica de la APK están implementados y probados. Falta la comprobación en una APK construida con el cambio, y en esta tanda no se construye ni se publica ninguna.

## Qué cambia para la persona

Responde o corrige «Antecedentes para entrenamiento» con «9» en días por semana. Hoy la APK 0.11.3 le dice «El servicio no está disponible en este momento». Con este cambio:

| Dónde | Qué ve |
|---|---|
| Junto al campo «Cuántos días por semana podrías reservar de manera realista» | «⚠ Es más de lo que se admite. Ingresá un número entero entre 1 y 7 días por semana.» El lector de pantalla lo lee junto al nombre del campo |
| Junto al botón (resumen, que se anuncia) | «Revisá los campos marcados. Hay 1 dato que necesita corrección.», y una línea por campo, con su rótulo |
| Lo que escribió | Sigue en pantalla. Al corregir el campo, su mensaje se va |
| Si el rechazo no trae un detalle reconocible | «No pudimos guardar: hay un dato que no se puede aceptar. Revisá lo que completaste y volvé a enviarlo.» |
| Sin conexión | «No pudimos confirmar el resultado. Reintentá.», con el botón «Reintentar» y la misma clave |

## Qué quedó comprobado, y cómo

| Qué | Cómo | Resultado |
|---|---|---|
| Rechazo al responder y al rectificar, con un issue por campo (todos a la vez), su código, `fieldCode` y límites, sin el valor enviado | Integración contra PostgreSQL y la API real: `test/integration/formularios-errores.int-spec.ts` | 7/7 |
| Cada límite con su código: 0 y -1 por debajo del mínimo, 2,5 con decimales, 601 por encima del máximo | Misma prueba | ✅ |
| El rechazo no escribe nada; corregido, se registra, también reusando la clave del rechazo, y el éxito repetido no duplica | Misma prueba | ✅ |
| Con una versión vieja, el 409 llega antes que los límites | Misma prueba | ✅ |
| Respaldo: otro tipo de valor, o un requerido que falta, dan el mismo 422 sin detalle | Misma prueba | ✅ |
| Las respuestas exitosas de FRM-02, 05, 06, 07 y 08 validan contra los esquemas estrictos de la APK: DL-104 no les agrega nada | Misma prueba | ✅ |
| El cuerpo nuevo pasa por **el mismo cliente HTTP que compila la APK 0.11.3** (`cliente-http.ts`, `contratos.ts` e `intento.ts`, idénticos al tag `be-apk-0.11.3`): se reconoce el `FORM_RESPONSE_INVALID` y nunca queda como resultado incierto | Unitarias del dominio: `packages/domain/src/errores-de-formulario.test.ts` | 8/8 |
| Mensajes por campo con rótulo, rango (con coma) y unidad; respaldo ante issues no reconocidos; la red, el servicio o un conflicto no se confunden con un rechazo de datos; textos sin términos prohibidos | Mismas unitarias | ✅ |
| Contrato y OpenAPI: el 422 de API-FRM-07 y API-FRM-08 declara la forma de `details` | `npm run openapi:verificar` | Al día |
| Pantalla de la APK (`apps/mobile/src/pantallas/formularios.tsx`) | Typecheck y revisión del código | ✅. **Sin prueba en dispositivo** |

**Revisión acotada.** Dos revisores de solo lectura trabajaron con lentes distintas.
- **Compatibilidad y contrato:** sin defectos.
- **Comportamiento de la pantalla de la APK:** dos hallazgos de severidad baja, corregidos antes del commit:
  1. si `details.issues` llegaba y no era un arreglo, el respaldo tiraba una excepción y la persona no veía ningún mensaje;
  2. la prueba de integración comparaba los issues después de que el esquema quitara las claves desconocidas, así que no habría detectado una clave de más, como el valor enviado.

**Lo que no se comprobó.**
- La pantalla no se vio funcionando: este repositorio no corre la APK en el navegador (no tiene react-native-web) y en esta tanda no se construye otra APK.
- Tampoco se probó en un dispositivo cómo lo anuncia el lector de pantalla ni cómo queda la pantalla con el teclado abierto.

## Comprobación pendiente en una APK construida con el cambio

Con «Antecedentes para entrenamiento», al responder y al corregir:
1. Con «9» en días por semana, el mensaje aparece junto a ese campo, con el rango, y el resumen se anuncia.
2. Con «9» en días y «45,5» en minutos, se marcan los dos a la vez.
3. Lo escrito sigue en pantalla. Al corregir, el mensaje del campo se va y el envío se registra.
4. Sin conexión, aparece el mensaje de conexión y el botón «Reintentar», no el de dato no aceptado.

## Hallazgos fuera del alcance (no incorporados)

| Hallazgo | Impacto | Prioridad |
|---|---|---|
| En la misma pantalla, `FORM_REQUEST_NOT_RESPONDABLE` y `FORM_RESPONSE_RECTIFICATION_NOT_ALLOWED` siguen mostrando «El servicio no está disponible». Ya existe el texto «Esta solicitud ya no se puede responder.» | Confunde un cambio de estado con una falla del servicio | Media |
| Al corregir con una versión vieja (409), la pantalla no recarga ni ofrece actualizar: reenviar vuelve a chocar, y salir pierde lo escrito | La persona queda trabada hasta salir y volver | Media |
| Después de un resultado incierto, si la persona edita y reenvía, se reusa la misma clave. Si el primer envío había llegado, la API responde 409 `IDEMPOTENCY_KEY_REUSED` y la pantalla lo muestra como «servicio no disponible» | Caso raro, con un mensaje engañoso | Baja |
| Un 404 al escribir muestra un aviso en lugar de retirar el contenido (`useAccesoRetirado`, como otras pantallas) | Inconsistencia con el resto de la APK | Baja |

Solo datos sintéticos. Sin credenciales.
