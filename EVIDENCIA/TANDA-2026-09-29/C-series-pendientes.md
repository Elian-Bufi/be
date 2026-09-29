# Entregable C · Series pendientes por número real

**Rama:** `fix/series-pendientes` (base `main` `065689b`). **Sin cambios de contrato, API ni base.**

## Problema reproducido

En la APK (`apps/mobile/src/pantallas/entrenamiento.tsx`, en `main`):
- las pendientes eran `p.sets.slice(registradas.length)`, es decir, por **cantidad** de registros;
- la próxima serie se guardaba con `setIndex: registradas.length + 1`.

La API admite cualquier `setIndex` de 1 a 50 sin repetir, y guarda el borrador tal cual. Por eso, con series salteadas:

| Registradas | Pendientes que mostraba | Próximo número que guardaba | Correcto |
|---|---|---|---|
| solo la 3 | «Serie 2», «Serie 3» (la 3 ya estaba) | 2 | pendientes 1 y 2; próxima 1 |
| 1 y 3 | «Serie 3» | **3, repetido: la API lo rechaza** (`422`, `DUPLICATE_SET_INDEX`) | pendiente 2; próxima 2 |

La integración reproduce el rechazo con el número que calculaba la APK. Lo prueba `series-pendientes.int-spec.ts`, en el segundo caso.

## Corrección

- **Dominio** (`presentacion-de-prescripcion.ts`):
  - `seriesPendientes(prescripción, registradas)` devuelve las series planificadas sin registro, **por `setIndex`**, tal cual: con su repetición y su nota, sin campos de lo realizado;
  - `proximoNumeroDeSerie` devuelve la primera pendiente. Si no queda ninguna, devuelve la siguiente al número más alto (una serie de más es legítima), o `null` si se pasaría de 50.
- **APK:**
  - las pendientes muestran su número real con lo planificado para esa serie;
  - la serie nueva se guarda con `proximoNumeroDeSerie` y las series van ordenadas por número;
  - las registradas se listan en orden.
- **No cambia:** la corrección de una ejecución (conserva el `setIndex` de cada serie), el website (ya cruzaba por `setIndex`), las ejecuciones guardadas ni el contrato.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| Unitarias de dominio, 4 nuevas: registro secuencial, numeración salteada con notas, planificado no convertido en realizado, límites | dominio 295/295 |
| Integración `series-pendientes.int-spec.ts`: borrador salteado conservado; número repetido rechazado y número del dominio aceptado; ejecución confirmada con los números y lo realizado | 3/3 |
| Regresión de entrenamiento, PF-02 y PF-03 | 118/118 |
| `npm test`, typecheck (incluye la APK), `openapi:verificar`, legajo | verdes |

## Límites

- La pantalla de la APK se verificó por typecheck y revisión; **no en un teléfono**.
- **Comprobación nativa pendiente, para una APK futura:** con un borrador que tenga solo la serie 3, ver pendientes la 1 y la 2 con sus notas; registrar y comprobar que se guarda como serie 1; que el campo de repeticiones siga vacío.
- En la APK no hay forma de producir un borrador salteado sin otra superficie (otra sesión o la API). El caso aparece si el borrador se completó desde otro lado o si una serie guardada se reemplaza.
