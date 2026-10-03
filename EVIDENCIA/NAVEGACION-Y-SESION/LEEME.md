# Evidencia · Sesión y navegación de la APK (2026-10-03)

**Qué es.** La reconstrucción del circuito de sesión de la APK, la medición local de lo que cuesta entrar a cada zona y
lo que cambió en la rama `apk/sesion-y-navegacion`, que todavía **no está integrada**: va con la candidata 0.13.2.

**De dónde sale.** La prueba manual de Dirección con la 0.13.1 (`EVIDENCIA/PRUEBA-MANUAL-0.13.1`) informó dos cosas:
- «Mi evolución» tarda unos 3 s, y la espera vuelve al cambiar de sección;
- la APK vuelve a la bienvenida al cerrarla y también después de un tiempo que no se midió.

Son estimaciones manuales. Esta evidencia no afirma cuánto tarda en el teléfono ni cuánto dura la sesión en la práctica.

## El circuito de sesión

Que la APK vuelva a la **bienvenida**, y no a Iniciar sesión con un aviso, quiere decir que se perdió la memoria de la
app. La API no rechazó la sesión. Cuando la API la rechaza, la APK va a Iniciar sesión y dice por qué.

| Situación | 0.13.1 | Con la rama |
|---|---|---|
| Cerrar la app desde Recientes, o que Android cierre el proceso en segundo plano | Se pierde el token, que vive solo en memoria: bienvenida | Igual. Es la política de DL-012 (opción A), que decide Dirección |
| Cambiar el tamaño de letra o de visualización, el idioma o la negrita | Android recrea la actividad y React vuelve a montar la raíz: bienvenida | Siguen la sesión y la pantalla |
| Pasar a segundo plano y volver, con el proceso vivo | Sigue todo | Sigue todo. Si la sesión venció, lo dice. Si pasaron más de 30 s, la pantalla se actualiza en silencio |
| Inactividad | No hay vencimiento por inactividad | Igual |
| Vencimiento: 12 h desde el inicio de sesión | Iniciar sesión, con «La sesión ya no es válida» | Iniciar sesión, con «Tu sesión venció: dura 12 horas» |
| Sin red | Error con «Reintentar»; la sesión sigue | Igual. Si había algo leído en la sesión, queda a la vista con un aviso |
| 401: sesión requerida, inválida, vencida o revocada | Iniciar sesión, con aviso | Igual |
| 403: A3 u otro permiso | Aviso en la pantalla (DL-115); la sesión sigue | Igual, y lo recordado de esa pantalla se borra |
| 429 o 503 | Error con «Reintentar»; la sesión sigue | Igual, con lo leído a la vista si lo había |

Verificado en el código:
- la API exige el secreto de firma y no lo genera al arrancar, así que reiniciarla no invalida las sesiones;
- el guard no transforma un error de la base en un rechazo de sesión;
- en la APK, solo los cuatro códigos de sesión cierran la sesión. Lo fija `clasificarFalla` con su prueba, en
  `packages/domain/src/lecturas-de-la-sesion.test.ts`.

La propuesta para que cerrar la app no obligue a volver a entrar está en DL-012, «Nota del 2026-10-03», y la decide
Dirección. **No se implementó.**

## Lo que cuesta entrar a cada zona (medición local)

**Condiciones.**
- API local con PostgreSQL 16 embebido, en la misma PC y sin latencia agregada.
- Asesorado sintético con dos tomas completas.
- Herramienta: `herramientas/medir-zonas.mjs`, con una pausa de 150 ms entre pedidos.

| Zona | Primera vez | Las tres siguientes | Respuesta |
|---|---|---|---|
| Nutrición · hoy | 69 ms | 29 / 35 / 35 ms | 0,2 KB |
| Entrenamiento · hoy | 39 ms | 34 / 26 / 14 ms | 0,1 KB |
| **Evolución · mi evolución** | **169 ms** | **129 / 135 / 143 ms** | **67,5 KB** |
| Información · solicitudes | 32 ms | 26 / 25 / 24 ms | 0,1 KB |
| Cuenta | 42 ms | 27 / 27 / 26 ms | 0,3 KB |

**El cálculo del cliente de «Mi evolución».** Es `ultimaToma`, lo mismo que hace la pantalla, con la misma respuesta.
Herramienta: `herramientas/medir-calculo.cjs`, cinco procesos de 30 repeticiones cada uno.

| | Primera llamada | Mediana por llamada |
|---|---|---|
| Antes | 115,9 / 70,1 / 68,9 / 69,7 / 67,4 ms | 35,8 / 35,9 / 34,4 / 36,0 / 35,8 ms |
| Después | 35,9 / 42,9 / 36,0 / 37,7 / 37,4 ms | 1,98 / 2,34 / 2,05 / 2,16 / 2,04 ms |

**La causa.** Cada fecha civil creaba un formateador de fechas nuevo (`Intl.DateTimeFormat` con zona horaria), dos veces
por medición: unas 270 veces por carga con estos datos. Ahora hay un formateador por zona, y el resultado es el mismo:
lo comprueba una prueba nueva en `fechas-civiles.test.ts`.

**Los límites.**
- Es Node en una PC. En Hermes, el motor de la APK, crear un formateador cuesta más, pero **en el teléfono no se
  midió**. No se afirma que esto elimine los 3 s informados.
- Tampoco se midieron en el teléfono el montaje de la pantalla ni el dibujo de la figura.
- **El hosting.** En `test`, cada pedido suma la ida y vuelta hasta Render y, si la API estaba dormida, su arranque. Eso
  es del alojamiento, no de la app, y esta medición local no lo incluye.

## Lo que cambió en la navegación

Antes, cada zona se montaba de nuevo en cada visita: mostraba «Cargando…», volvía a pedir y volvía a calcular. Después:

| Momento | Antes | Después |
|---|---|---|
| Primera visita | «Cargando…», un pedido y el cálculo | Igual, con el cálculo más rápido |
| Segunda visita, en la misma sesión | Lo mismo que la primera | Lo último leído a la vista al instante, más un pedido en silencio. El resumen de la toma no se recalcula, y si la respuesta dice lo mismo, no se redibuja nada |
| Volver del segundo plano | Sin cambios en la pantalla | Igual. Si pasaron más de 30 s, un pedido en silencio |
| Después de registrar una comida | La pantalla se vaciaba en «Cargando…» | Queda a la vista mientras se actualiza |

Las reglas de las lecturas recordadas están en `packages/domain/src/lecturas-de-la-sesion.ts`, con sus pruebas, y la APK
las usa en `apps/mobile/src/lecturas.ts`:
- solo en memoria, nunca en disco;
- son de una sesión: otra sesión no ve nada y, al cerrar, vencer o perder la sesión, se olvida todo;
- cada visita vuelve a preguntar a la API, una vez, como antes. No se precarga nada;
- la respuesta nueva manda: si la API niega el acceso, lo recordado se borra;
- cualquier escritura, aunque falle, olvida todo lo leído;
- una respuesta pedida antes de olvidar no se guarda ni se muestra;
- con una falla pasajera queda lo leído en la sesión, con «No pudimos actualizar» y «Reintentar».

**Una propiedad que hay que conocer.** Si alguien revoca el A3 o cierra todas las sesiones desde otro dispositivo, la
APK puede mostrar lo que ya había leído en esta sesión hasta que llega la respuesta del pedido en curso. Al llegar, lo
recordado se borra. Nunca muestra datos que esta sesión no haya leído antes.

El refresco se ve como una línea fina que corre sobre el borde del encabezado. No mueve la pantalla, y queda quieta si
se pidió reducir el movimiento. Cada zona vuelve a la altura en que se la dejó, y Nutrición recuerda el día del plan
elegido.

## Pendiente

- Probar en el teléfono, con una APK nueva:
  - el cambio de tamaño de letra sin perder la sesión;
  - el regreso del segundo plano;
  - la línea de actualización;
  - el tiempo de «Mi evolución».
- La decisión de Dirección sobre DL-012.
