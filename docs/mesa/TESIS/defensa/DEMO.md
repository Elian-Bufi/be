# Demo de la presentación del viernes 6/11: website y APK, con su plan B

**Dónde estamos.** La demo baja de 7 minutos a unos 2:30 y muestra dos cosas: el profesional leyendo a Diego en el
website y la persona registrando en la APK nueva con Prueba Uno. El plan B son capturas que se toman el jueves contra la
misma versión; la lista está abajo, con el nombre de cada archivo.

- **Versión:** la integración de la semana se adelantó al lunes 2/11. La API de test sirve `b62ce90` (#224, la segunda
  integración de la semana) y tiene que responder ese commit en `GET https://be-api-hndp.onrender.com/health/ready`
  (`data.version.commit`; comprobado el 3/11). `main` está en `8883e88` (#231), que solo cambia `EVIDENCIA/` y no
  redespliega la API. Si la prueba del miércoles obliga a integrar un arreglo, el commit cambia y se corrige acá.
- **APK:** `0.19.0-candidata.1`, código de versión 32, publicada el 3/11 como prerelease (no es la estable, que sigue
  siendo la 0.13.2): https://github.com/Elian-Bufi/be/releases/tag/be-apk-0.19.0-candidata.1. Se armó desde `42dd257`
  (`b62ce90` más las herramientas del AAB y la versión), y la bienvenida tiene que decir ese commit. SHA-256 del archivo
  `be-0.19.0-candidata.1-42dd257.apk`: `13549f7323950fb85d5d1c2d73cb9989c33bab6e637d23f50c6618f67261282a`. Va instalada
  encima de la anterior, sin desinstalar, en el teléfono de la demo.
- **Datos de test que usa la demo** (cargados el 2 y el 3/11): 66 recetas en la cuenta de Sofía Paz (16 de ejemplo y 50
  nuevas, sin foto) y las zonas musculares de los 20 ejercicios de la demo (DL-081).
- **Cuentas** (las credenciales están en la versión de evaluación de la tesis, apartado 14, y en `cuentas.env`; nunca en
  pantalla compartida):
  - **Sofía Paz**, nutricionista (`PRO_N`): solo mira a **Diego Sosa**. Sobre Diego no se escribe nada.
  - **Prueba Uno**, asesorado descartable: tiene Entrenamiento con «Sesión de prueba», dos ejercicios de tres series,
    con **Lic. Prueba Dos Áreas** como profesional. Todo lo que se registra en vivo va acá.
  - **Lic. Prueba Dos Áreas** (opcional): para ver en el website cómo quedó lo que registró Prueba Uno.

## Antes de entrar

| Control | Cómo | Si falla |
|---|---|---|
| La API responde con la versión de la demo | `GET /health/ready`: 200 y el commit de arriba | Plan B entero |
| El website abre y la sesión de Sofía ya está iniciada | Entrar antes de empezar, en una pestaña aparte; la sesión sobrevive a la recarga (DL-147) | Plan B del website |
| La APK instalada es la de la demo y Prueba Uno ya entró | Cuenta → versión | Plan B de la APK |
| Prueba Uno tiene la sesión de hoy **sin iniciar** y al menos **una pendiente** de otro día | Entrenamiento · Hoy y las pendientes, el mismo viernes a la mañana | Hacer solo la sesión guiada y mostrar «Ya la hice» con capturas |
| El teléfono se ve en la pantalla | Espejado o cámara, probado el jueves con la misma red | Mostrar el teléfono en la mano y seguir con capturas |
| Un ensayo completo con reloj | El jueves, una vez en vivo y otra con el plan B | — |

## Los dos minutos y medio

| Desde | Quién y dónde | Qué se hace | Qué se dice | Plan B |
|---|---|---|---|---|
| 0:00 | Sofía · website | Espacio profesional → la ficha de Diego, vista Resumen | «El resumen por área dice qué hay y qué falta registrar.» | `web/01-espacio-profesional.png`, `web/02-ficha-resumen.png` |
| 0:20 | Sofía · ficha de Diego | «Analizar» con Nutrición: lo registrado, el objetivo del profesional y lo indicado en el plan; abrir «Ver origen» de un día | «En un mismo gráfico, lo que Diego registró, el objetivo que fijé y lo indicado en el plan. Coincidir en el tiempo no dice causa.» | `web/03-analizar-nutricion.png`, `web/04-analizar-origen.png` |
| 0:55 | Sofía · Nutrición → Revisiones | Abrir la última revisión registrada y su evidencia | «Queda escrito en qué evidencia me apoyé para decidir.» | `web/05-revision-con-evidencia.png` |
| 1:30 | Prueba Uno · APK | En una pendiente, «La hice ese día» (o «Ya la hice»), «Hice todo lo planificado»: el último cuadro con los valores del plan; mostrar la opción rápida para decir que un ejercicio tuvo una serie menos, sin usarla; «Listo» | «Un toque. Si una serie fue distinta, se cambia acá mismo.» | `apk/03` a `apk/06` |
| 2:00 | Prueba Uno · APK | «Iniciar entrenamiento» en la sesión de hoy: la franja de arriba; tildar la casilla de la serie 1 (queda en el azul del tema); escribir otra carga en la serie 2 y tildarla | «Arriba, en qué ejercicio y serie voy. Tildo y queda con lo planificado; si escribo, manda lo escrito.» | `apk/07`, `apk/08` |
| 2:30 | — | Volver al mazo, diapositiva 8 | — | — |

**Si sobran 30 segundos** (la «carga rápida» del escritorio está integrada desde el 2/11, #224 con #230): entrar como Lic. Prueba Dos Áreas a Entrenamiento de Prueba Uno
y mostrar la sesión recién cargada: lo cargado como el plan figura como «carga rápida» y no se compara con lo indicado;
la serie escrita sí. Plan B: `web/06-carga-rapida.png`.

**La sesión guiada no hace falta finalizarla en vivo:** el borrador queda guardado en el servidor y en el teléfono.
Después de la presentación se finaliza o se deja; Prueba Uno es descartable.

## Cuidados

- **No escribir sobre Diego.** Es el ejemplo de los gráficos y de la portada. Todo lo que se registra queda: no se
  borra.
- **Nada que califique a la persona.** Al hablar, «lo registrado» y «lo indicado», nunca «cumplió» ni «bien» o «mal».
- **«Demasiados intentos» al entrar:** esperar; el límite es por red y por cuenta. Por eso se entra antes de empezar.
- **Los pendientes del espacio profesional cambian con el calendario:** «revisión vencida hace N días» depende del día.
- **Si la APK nueva no llegó a instalarse:** la demo de la APK se hace con capturas y se dice en una frase; no se muestra
  como hecho lo que no está instalado.
- **La TVCC-30 no se corre en vivo:** necesita la consola del servidor. Si la preguntan, el resultado del 2026-10-16
  (`EVIDENCIA/TVCC-30/LEEME.md`): 5 de 7 ciclos, 71,4 %, sobre la cohorte sintética local; es una demostración del
  cálculo, no una medición del servicio.

## Si algo falla en vivo

1. Decirlo en una frase: «Render no responde; sigo con las capturas de ayer, tomadas contra la misma versión».
2. Abrir la carpeta del plan B en el visor de imágenes, en el orden de la tabla.
3. Si la red vuelve, ofrecer un solo paso en vivo al terminar.

## Plan B: las capturas que se toman el jueves

Van en `respaldo-demo/2026-11-05/`, en dos carpetas. Las del 20/10 (`respaldo-demo/*.png`) quedan como historia: son de
`0fb1bff` y no muestran lo de DL-153, DL-154 ni DL-158.

**Del website** (`web/`), en test, a 1920 × 1080, con el tema claro:

| Archivo | Cuenta | Pantalla | Qué tiene que verse | Va también en el mazo |
|---|---|---|---|---|
| `01-espacio-profesional.png` | Sofía | `/pro` | Pendientes y cartera | Demo (reemplaza la del 20/10) |
| `02-ficha-resumen.png` | Sofía | Ficha de Diego, Resumen | El resumen por área, con «subtotal · comida del plan sin registro» si aparece | Portada (reemplaza la del 20/10) |
| `03-analizar-nutricion.png` | Sofía | Ficha de Diego, «Analizar», Nutrición, último mes | Las tres capas en el mismo gráfico y su leyenda | — |
| `04-analizar-origen.png` | Sofía | El mismo, con «Ver origen» abierto en un día con comidas | Lo que aporta cada comida y lo indicado | — |
| `05-revision-con-evidencia.png` | Sofía | Nutrición → Revisiones, la última abierta | El resultado y la evidencia en la que se apoyó | — |
| `06-carga-rapida.png` | Lic. Prueba Dos Áreas | Entrenamiento de Prueba Uno, después del ensayo | Una sesión con «carga rápida» y otra con series escritas | — |

Las de Sofía y Diego se pueden sacar con `herramientas/capturar-respaldo-demo.mjs` (solo navega) si se le suman esas
pantallas; si no, a mano, sin capturas de pantalla completa en «Ver origen» (la ventana cambia de tamaño y el panel
recarga). La página de la cuenta no se captura: muestra el identificador completo.

**De la APK nueva** (`apk/`), nativas, en el teléfono de la demo, con Prueba Uno:

| Archivo | Pantalla | Qué tiene que verse | Va también en el mazo |
|---|---|---|---|
| `01-version.png` | Cuenta → versión | La versión instalada | — |
| `02-entrenamiento-hoy.png` | Entrenamiento · Hoy | «Iniciar entrenamiento» y «Ya la hice» uno al lado del otro | — |
| `03-ya-la-hice-como-fue.png` | «Ya la hice» → «¿Cómo fue?» | Las tres opciones y la franja de pasos | — |
| `04-hice-lo-planificado.png` | «Hice todo lo planificado» | El último cuadro con los valores del plan a la vista | Diapositiva 9, «Después» |
| `05-una-serie-menos.png` | La opción rápida | Decir que un ejercicio tuvo una serie menos o cambiar una serie | — |
| `06-listo.png` | «Listo» | El resumen y cómo lo va a ver su profesional | — |
| `07-sesion-guiada.png` | Sesión de hoy, en curso | La franja de arriba, una fila tildada en el azul del tema y la casilla al final | Diapositiva 7, la demo |
| `08-serie-escrita.png` | La misma, serie 2 | Lo escrito en la fila y su casilla tildada | — |
| `09-correccion.png` | Corregir la sesión registrada | Lo planificado en gris para sumar y una serie destildada | — |
| `10-sustituir.png` | Durante la sesión | Sustituir un ejercicio (DL-151) | — |

Las capturas de la APK tienen la barra de estado del teléfono: antes de copiarlas, mirar que no haya notificaciones
personales a la vista.
