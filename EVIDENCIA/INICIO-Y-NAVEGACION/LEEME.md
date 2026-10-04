# Evidencia · Inicio y navegación (DL-117): revisión visual de la candidata

**Esto no son capturas de la APK.** Son renders de los componentes reales de la APK en el navegador, con
react-native-web y datos sintéticos. Cada imagen lo dice arriba, en rojo.

**Por qué no hay capturas nativas.**
- Esta tanda no autoriza construir una APK, y el código nuevo solo corre en el teléfono dentro de una APK.
- La máquina tiene un emulador (Pixel 3a, API 34), pero había 0,8 GB de memoria libre de 5,9 GB, y el emulador necesita
  más.

Ninguna imagen de esta carpeta reemplaza una captura del teléfono.

## Qué tienen de real y qué no

**Real:**
- Los componentes son los de `apps/mobile/src`, sin copias: la cabecera, la cápsula, el menú, las tarjetas de Inicio,
  Cuenta, Mi evolución y su figura.
- La composición es la de `App.tsx`: cabecera, contenido con el espacio de la barra y cápsula flotante.
- Los colores salen de los tokens de `tema.ts`.

**Imitado en el navegador** (`herramientas/render-navegador/shims`):
- La fuente es Roboto, la de Android, cargada de Google Fonts.
- La escala de letra del sistema (×1, ×1,3, ×2) se aplica a cada texto hasta su `maxFontSizeMultiplier`. Se aplica en
  forma lineal: es el peor caso, porque Android 14 agranda menos las letras grandes.
- `adjustsFontSizeToFit` va en dos fases, como Android. Primero se reparte el ancho con los textos a tamaño completo,
  que es lo que hace Yoga. Después, cada texto se achica en su caja hasta su mínimo.
- Las áreas seguras: 24 dp abajo con gestos, y 48 dp con tres botones.

**No cubre:**
- la sombra y la elevación de Android;
- el diálogo del sistema que pregunta antes de salir sin guardar;
- el teclado;
- el escalado no lineal de Android 14;
- el `Modal` nativo;
- TalkBack, que queda fuera por decisión de Dirección.

**Cómo se capturó.** Chrome sin pantalla, controlado por su protocolo de depuración (`cdp.mjs`). Saca la imagen recién
cuando cargaron las fuentes y terminó el ajuste de las etiquetas. Las primeras capturas, con `--screenshot`, mostraban
un estado intermedio, y se descartaron.

## Las comparaciones

| Archivo | Qué muestra |
|---|---|
| `capturas/01-inicio-arriba.png` | Inicio arriba en Azul noche y Claro, en 360, 390 y 412 dp, con letra ×1, ×1,3 y ×2 |
| `capturas/02-inicio-al-final.png` | El final de Inicio: la última tarjeta queda libre sobre la cápsula, con gestos y con tres botones |
| `capturas/03-inicio-estados.png` | Sin el A3, sin plan ni datos, sin conexión y mientras se verifica |
| `capturas/04-menu-y-cuenta.png` | El menú auxiliar abierto, y Cuenta desde el avatar, con «Volver» y sin destino resaltado |
| `capturas/05-evolucion.png` | Mi evolución con el selector T1, T2 y T3: la T2 elegida, la última, y Comparar |
| `capturas/06-evolucion-graficos-chicos.png` | El final de la vista Toma: los gráficos chicos de puntos con su lista equivalente |

## Las etiquetas de la barra, medidas

Es la proporción a la que se achica cada etiqueta para entrar: 1,00 es sin achicar. Se midió con el mismo emulador
antes (la barra de la etapa 4, `d851dbf`) y después de los ajustes de esta revisión.

| Ancho | Letra | Antes | Después |
|---|---|---|---|
| 320 dp | ×1 | 0,93 | 0,96 |
| 320 dp | ×1,15 o más | **0,85: las cuatro etiquetas largas se cortaban con «…»** | 0,83, enteras |
| 360 dp | ×1 | 1,00 | 1,00 |
| 360 dp | ×1,15 o más | 0,92 | 0,96 |
| 390 y 412 dp | cualquiera | 1,00 | 1,00 |

Las etiquetas crecen hasta 1,15 veces: desde ahí, la letra del sistema ya no las cambia.

## Lo que encontró la revisión y cómo quedó

| Hallazgo | ¿Real? | Corrección |
|---|---|---|
| En 320 dp, con letra agrandada, cuatro etiquetas de la barra se cortaban | Sí, en el render; falta verlo en el teléfono | Más ancho útil: márgenes de 8 dp por debajo de 400 dp, y 6 por debajo de 340; relleno de la cápsula de 3 dp. Etiquetas en 500 y 700, más angostas que 600 y 800, con un mínimo de 80 % en vez de 85 % |
| Con letra ×2, el título de una tarjeta partía «Entrenamient / o» | Sí, en el peor caso lineal | El título crece hasta 1,5 veces, y con letra de 1,5 o más el ícono va arriba |
| Con letra grande, dos acciones lado a lado partían su texto en dos renglones | Sí | Cada acción pide un ancho que crece con la letra; con letra grande, baja a su línea entera |
| El contenido que pasa detrás del vidrio se leía demasiado | Sí, en Claro | Vidrio al 94 % en Azul noche y al 95 % en Claro; contraste mínimo de las etiquetas 6,86:1 y 6,13:1 |
| La tarjeta de Nutrición sin datos decía «no registraste comidas hoy» y «no registraste ninguna comida» | Sí | Si nunca hubo un registro, se dice eso solo |
| En una solicitud abierta desde Inicio, «Volver a Información» llevaba a Inicio, sin preguntar por lo escrito | Sí, en el código | Va a Información y pregunta si hay respuestas sin enviar |
| Etiquetas de la barra cortadas en 360 dp con letra ×2 | **No**: era un error del primer emulador, que ajustaba cada etiqueta por separado y medía en píxeles enteros | El emulador se rehízo en dos fases y con medidas con decimales |

## Revisión independiente del código

Una revisión aparte del diff completo encontró tres defectos confirmados y tres plausibles. Están corregidos, con
pruebas en `scripts/historial-navegacion.test.mjs` y `scripts/inicio.test.mjs`.

| Hallazgo | Corrección |
|---|---|
| Tocar «Nutrición» estando en Nutrición con una comida a medio escribir preguntaba sin motivo. Si se elegía salir, lo escrito quedaba sin declarar, y la salida siguiente lo perdía sin preguntar | Ir a la misma pantalla no pregunta. Lo declarado lo borra cada pantalla al desmontarse, no la pregunta. Nutrición no se vuelve a montar al perder el pedido de una sola vez |
| Con el selector de tomas, pasar a una toma que solo tiene la otra familia dejaba la silueta vacía | La figura dibuja la familia que la toma tiene |
| «Ver la toma» desde Inicio podía abrir otra toma elegida antes | Abre la última, la que nombra la tarjeta |
| Una respuesta tardía de «Comenzar sesión» movía a la persona aunque ya se hubiera ido de la pantalla o de la sesión | Se descarta si la tarjeta ya no está |
| A la medianoche, con el reloj del teléfono adelantado, «hoy» se pedía cuando para la API todavía era ayer, y la actividad recibía «período en el futuro» | 5 s de margen después de la medianoche, y la actividad pide una vez más, un día antes |
| Una sesión con correcciones que no se pueden ordenar se contaba como «corregida» | Se cuenta aparte, como se registró |

Sin hallazgos en el resto de lo revisado:
- `navegar` y `anterior`: 12 000 recorridos al azar, sin ciclos y con el tope respetado;
- las reglas de los hooks;
- las carreras de las lecturas;
- `ultimaToma`: comparada con la versión anterior en 20 000 casos, da lo mismo salvo un empate exacto de instantes;
- la accesibilidad.

## Lo que hay que mirar en el teléfono

1. La barra en un teléfono angosto con la letra al máximo: las cinco etiquetas enteras.
2. El vidrio de la cápsula al desplazar Inicio, en los dos temas.
3. El final de Inicio con navegación por gestos y con tres botones: la última tarjeta, libre sobre la cápsula.
4. El diálogo «¿Salir sin guardar?»: con una comida a medio escribir, tocar otro destino de la barra.
5. Mi evolución: elegir T1 y ver que cambian la figura, las medidas y los gráficos chicos.

## Cómo se rehacen

En una copia de `herramientas/render-navegador` fuera del repo, para no dejar `node_modules` dentro:
```
npm i
BE_REPO=<raíz del repo> node construir.mjs
./capturar-todo.sh <carpeta de salida>
```
Hace falta Node 22, Chrome y conexión para cargar Roboto. Los datos son los de `shims/api.ts`, todos sintéticos.
