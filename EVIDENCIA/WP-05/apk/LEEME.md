# Capturas del APK 0.5.1 en el teléfono de Dirección

El tramo del asesorado del circuito antropométrico (partes 0 y 5 de `../GUIA-DEMO.md`), en un Android real (Samsung Galaxy A55, build `BP4A.251205.006.A556EXXSGDZG2`), el 2026-09-20 entre las 21:36 y las 21:46 (hora de Buenos Aires). Cuenta **DEMO-A01** contra el ambiente `test`, API/website `4e5503f`. Datos sintéticos. Sin metadatos EXIF.

| Captura | Paso | Qué demuestra |
|---|---|---|
| `apk-01-bienvenida-0.5.1` | 0.1 | Identidad del build: `app 0.5.1 · test · commit 0193a3d` (07 §34, TEST-APK-008) |
| `apk-02-cuenta` | 0.2 | Entre los botones de Cuenta está **«Antropometría: Mi evolución»**, con el identificador BE del asesorado a la vista |
| `apk-03-evolucion-con-historial-previo` | 0.6 (con una diferencia — ver abajo) | «Mi evolución» ya con datos: un punto de peso el 14 de septiembre y los tramos «sin dato» alrededor |
| `apk-04-talla-sin-punto-hoy` | 5.3 | La tarjeta de **talla** completa. La medición de hoy se anuló y **no aparece**: el 19-20 de septiembre queda «2 días sin dato», sin ningún valor ni cero en ese tramo |
| `apk-05-peso-corregido-hoy` | 5.1/5.2 | La tarjeta de **peso** completa. El último renglón, «20 sept 2026, 9:41 p. m.», muestra **73.1 kg · Medido · Corregida**: la corrección hecha del lado del profesional llega intacta a la vista del asesorado |

## Por qué `apk-03` no es «evolución vacía»

La guía preveía una pantalla vacía en el paso 0.6, porque asumía que el vínculo se creaba en esa misma corrida. No fue así: esta cuenta ya tenía un vínculo aceptado con capacidad antropométrica y evaluaciones registradas, dejados por las pruebas automáticas (`adversariales-wp05.mjs`) que corrieron contra este mismo ambiente más temprano ese día. **No hay forma de limpiar esos datos sin violar REG-06-215** — una vez registrada, una evaluación es historia, y la historia no se borra, ni siquiera para dejar una demo prolija. Es la misma garantía que el paquete entero demuestra, aplicada primero contra la comodidad de la propia demo.

Por eso el paso 0.6 se documenta con lo que realmente pasó (datos previos visibles) en vez de forzar una captura vacía que no correspondía, y se agregó un ciclo nuevo el mismo día —registrar, corregir el peso, anular la talla— para tener un ejemplo fechado, verificable y sin ambigüedad. `apk-04` y `apk-05` son la prueba de ese ciclo, verificado antes contra la API (`GET /anthropometry/evaluations/{id}`) y coincidente exactamente con lo que se ve en el teléfono.

## Lo que las dos últimas capturas prueban, en una frase cada una

- **`apk-04`** — anular una medición la saca de la vista sin dejar rastro numérico: ni un cero, ni el valor anulado, solo el tramo «sin dato» que ya estaba.
- **`apk-05`** — corregir una medición cambia el valor que ve el asesorado, con la etiqueta «Corregida» a la vista, y el valor original queda conservado en el registro del profesional (no en esta pantalla, que es de solo lectura del vigente).

Todos los datos son sintéticos. No hay contraseñas, tokens ni datos de personas reales en ninguna captura.
