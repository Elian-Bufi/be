# Evidencia · Inicio y navegación (DL-117): revisión visual de la candidata

**Esto no son capturas de la APK.** Son renders de los componentes reales de la APK en el navegador, con
react-native-web y datos sintéticos. Cada imagen lo dice arriba, en rojo.

**Por qué no hay capturas nativas.**
- Esta tanda no autoriza construir una APK, y el código nuevo solo corre en el teléfono dentro de una APK.
- La máquina tiene un emulador (Pixel 3a, API 34), pero quedaba entre 0,5 y 0,8 GB de memoria libre de 5,9 GB, y el
  emulador necesita más.

Ninguna imagen de esta carpeta reemplaza una captura del teléfono.

## Qué tienen de real y qué no

**Real:**
- Los componentes son los de `apps/mobile/src`, sin copias: la cabecera, la cápsula, el menú, las tarjetas de Inicio,
  Cuenta, Mi evolución, el mapa corporal, los indicadores y sus gráficos chicos.
- La composición es la de `App.tsx`: cabecera, contenido con el espacio de la barra y cápsula flotante.
- Los colores salen de los tokens de `tema.ts`.

**Imitado en el navegador** (`herramientas/render-navegador/shims`):
- La fuente es Roboto, la de Android, cargada de Google Fonts.
- La escala de letra del sistema (×1 a ×2) se aplica a cada texto hasta su `maxFontSizeMultiplier`, si lo tiene. Se
  aplica en forma lineal: es el peor caso, porque Android 14 agranda menos las letras grandes.
- `adjustsFontSizeToFit` va en dos fases, como Android. Primero se reparte el ancho con los textos a tamaño completo,
  que es lo que hace Yoga. Después, cada texto se achica en su caja hasta su mínimo.
- Las áreas seguras: 24 dp abajo con gestos, y 48 dp con tres botones.

**No cubre:**
- la sombra y la elevación de Android;
- el diálogo del sistema que pregunta antes de salir sin guardar;
- el teclado;
- el escalado no lineal de Android 14;
- la letra propia de algunos fabricantes, como Samsung, que puede ser más ancha que Roboto;
- el `Modal` nativo;
- TalkBack, que queda fuera por decisión de Dirección.

**Cómo se capturó.** Chrome sin pantalla, controlado por su protocolo de depuración (`cdp.mjs`). Saca la imagen recién
cuando cargaron las fuentes y terminó el ajuste de las etiquetas.

## Las comparaciones

Todas se rehicieron con la candidata del pulido del mapa (2026-10-04, a la tarde), y de la 12 a la 18 son nuevas. Las
cuatro individuales (12 a 15) tienen una pantalla cada una, al doble de píxeles, para verlas en el teléfono sin ampliar.

| Archivo | Qué muestra |
|---|---|
| `capturas/12-perimetros-letra-normal.png` | **Individual.** Perímetros, Azul noche, 360 dp, letra normal |
| `capturas/13-pliegues-letra-normal.png` | **Individual.** Pliegues, Claro, 360 dp, letra normal, con el tríceps elegido: su fila, su guía, su sitio y el detalle |
| `capturas/14-indicadores-letra-normal.png` | **Individual.** Indicadores, Azul noche, 360 dp, letra normal |
| `capturas/15-letra-grande.png` | **Individual.** La adaptación con letra ×1,3: pestañas en dos filas, la figura con números y los valores en la lista |
| `capturas/16-antes-despues-perimetros.png` | Perímetros antes (6acc4c0) y después, con el mismo simulador y los mismos datos |
| `capturas/17-antes-despues-pliegues.png` | Pliegues con el subescapular elegido, antes y después |
| `capturas/18-encuadres.png` | El encuadre actual (A) y las dos propuestas: B, la elegida, y C, más recortada |
| `capturas/01-inicio-arriba.png` | Inicio arriba en Azul noche y Claro, en 360, 390 y 412 dp, con letra ×1, ×1,3 y ×2. Con ×1,3 en 360 dp y con ×2, la barra en dos filas |
| `capturas/02-inicio-al-final.png` | El final de Inicio: la última tarjeta queda libre sobre la cápsula, con gestos y con tres botones |
| `capturas/03-inicio-estados.png` | Sin el A3, sin plan ni datos, sin conexión y mientras se verifica |
| `capturas/04-menu-y-cuenta.png` | El menú auxiliar abierto, y Cuenta desde el avatar, con «Volver» y sin destino resaltado |
| `capturas/05-evolucion.png` | Las cuatro vistas de Mi evolución: el mapa corporal con la T2 elegida y con la última, y Comparar |
| `capturas/06-graficos-chicos.png` | Un tríceps tomado con otro protocolo (raya sobre la base, «no comparable» en la lista), y doce tomas sin desborde |
| `capturas/07-mapa-corporal.png` | El mapa corporal: cada sitio con su valor, su diferencia y su gráfico chico; una medida elegida, con su fila, su guía y su sitio resaltados |
| `capturas/08-mapa-detalle-y-letra-grande.png` | El detalle de la medida elegida, y la figura con números y gráficos en la lista con letra ×1,3 y ×2 |
| `capturas/09-indicadores.png` | Los indicadores en dos columnas, en una con letra ×1,3 en 360 dp, y una tarjeta elegida abierta a todo el ancho |
| `capturas/10-barra-letra-grande.png` | La barra en 320 y 360 dp, de ×1 a ×2: una fila mientras entra, y dos filas cuando no |
| `capturas/11-sin-datos-y-toma-incompleta.png` | Mi evolución sin mediciones, y una toma con otra evaluación el mismo día (D-3), con su aviso |

## Pulido del mapa (2026-10-04, a la tarde)

Dirección pidió priorizar la excelencia visual con la letra de siempre, y que con letra grande se lea bien aunque la
composición cambie, sin desactivar el escalado. **Las referencias visuales que mencionaba el pedido no llegaron con el
mensaje:** el pulido sigue la descripción escrita.

**El encuadre** (`ENCUADRE` en `composicion-de-la-figura.ts`; 16 a 18):
- Antes, el cuerpo se achicaba y se centraba en el alto de la lista: en 360 dp medía unos 512 dp de alto y, con muchas
  medidas, quedaba un hueco encima.
- Ahora la imagen mide 1,44 veces el ancho de la lámina, el eje del cuerpo queda a un 13 % del ancho de la imagen del
  borde derecho y el cuerpo empieza a 10 dp del borde de arriba. En 360 dp mide unos 600 dp de alto y las tarjetas,
  132 dp de ancho como mínimo.
- El tamaño sale del ancho de la lámina y de todos los sitios posibles de la familia, no de cuántas medidas tiene la
  toma. Sumar medidas alarga la lista hacia abajo, pero no achica el cuerpo ni deja un hueco encima. Con muchas medidas,
  la lista termina más abajo que los pies y las guías de abajo suben hasta su sitio.
- El borde derecho recorta el cuerpo donde no hay sitios. ISAK mide del lado derecho de la persona, que en la figura de
  frente queda a la izquierda, y los anillos del tronco tienen su centro en el eje, que queda a la vista. La alternativa
  de mostrar solo la parte de arriba o la de abajo no hizo falta.
- Se compararon tres encuadres (18). C, con 1,55 veces y 9 %, corta los anillos del tronco casi por el centro. Se eligió
  B.
- Figura, anillos, puntos, guías y zonas de toque salen del mismo rectángulo de la imagen, con la misma escala y el mismo
  desplazamiento. Ningún punto anatómico se movió.

**La cabecera:**
- Las vistas son pestañas subrayadas de borde a borde, y la familia es un control compacto dentro de la lámina: ya no
  son dos filas de píldoras iguales.
- Una fecha principal y un contexto breve («Última toma · se compara con el 25 jul 2026»).
- Las tomas, en una fila de chips que se desplaza de costado.
- El período y la explicación de los puntos, en «Cómo se lee».
- El aviso de una toma que puede estar incompleta sigue a la vista, en una línea, y «Por qué» abre el detalle.

**Las tarjetas:**
- El nombre del sitio pasa de 12 a 13 sp.
- Todas las filas tienen la misma forma. El nombre va a la izquierda y el valor a la derecha, en la misma línea si
  entran o, si el nombre es largo, en la de abajo. Al final van la diferencia y los puntos. Los valores forman una
  columna.
- En una tarjeta, los gráficos tienen el mismo ancho: los puntos de cada toma quedan en columna.
- Una primera versión ponía el valor a la derecha o debajo del nombre según el largo del nombre, y los valores saltaban
  de un lado al otro. Se corrigió antes de entregar.
- Los indicadores muestran nombre, valor, diferencia neutra, la marca (corregida, si corresponde) y los puntos. El
  método se reconoce en el nombre, por ejemplo «Grasa corporal (Durnin y Womersley, Siri)». «Antes» y la descripción
  completa del método quedan en el detalle.
- El vidrio tiene un borde fino y translúcido, un brillo arriba que se apaga a la mitad y una sombra suave, sin bordes
  fuertes. El brillo no baja el contraste del texto (`scripts/contraste.test.cjs`).

**Lo comprobado:**
- **Recortes.** `herramientas/render-navegador/cortes.js` compara el ancho de cada texto de una línea con el de su caja.
  Se corrió en 19 configuraciones: 360, 390 y 412 dp; los dos temas; pocas y muchas medidas; doce tomas; letra ×1,15,
  ×1,3 y ×2; y filas elegidas, con el nombre en negrita. Ningún texto se corta.
- **La negrita.** En Roboto, el nombre en negrita mide como mucho 1,9 dp más que en peso normal a 13 sp. La holgura de
  la estimación lo cubre: elegir una fila no corta su nombre.
- **Selección y guías.** El tríceps elegido (13), el subescapular (17) y la cintura (07): la fila, la guía y el sitio
  se resaltan, y la guía llega al sitio correcto.
- **Pruebas.** `scripts/composicion-de-la-figura.test.mjs` controla que el cuerpo empiece arriba y no cambie con la
  cantidad de medidas, y que ningún sitio quede afuera ni debajo de las tarjetas. También controla que tocar cada sitio
  responda, y que los gráficos de una tarjeta tengan el mismo ancho y entren junto a la diferencia.
- **Letra grande.** Con ×1,15 siguen las tarjetas. Desde ×1,3 la figura va con números, y los valores y sus puntos en
  la lista (15 y 08). Las pestañas pasan a dos filas, y los chips de las tomas se desplazan de costado.

**Límites del simulador.** Valen los de arriba. Además:
- la sombra del vidrio es la del navegador, y en Android la da `elevation`;
- el brillo es un degradado de `react-native-svg`, que no se miró en el teléfono;
- los anchos de texto son los de Roboto de Google Fonts, no los de la fuente del teléfono.

No se reconstruyó el simulador: se le sumaron la escala de pantalla para las individuales y tres variables de
`construir.mjs` para compilar el «antes» y la variante C.

## Las etiquetas de la barra, medidas (cierre del 2026-10-04)

Las etiquetas crecen con la letra, sin tope. Si en una fila no entran con al menos el 90 % de su tamaño, la cápsula
pasa a dos filas: es una adaptación excepcional y una decisión visual explícita, a ratificar por Dirección. Medido con
`herramientas/render-navegador/medir-barra.sh` (salida en `salida/barra-medida.txt`): filas, tamaño efectivo de las
etiquetas en sp y alto de la cápsula en dp.

| Ancho | ×1 | ×1,15 | ×1,3 | ×1,5 | ×1,8 | ×2 |
|---|---|---|---|---|---|---|
| 320 dp | 1 fila · 11,5 sp | 2 filas · 13,8 | 2 · 15,6 | 2 · 18 | 2 · 21,6 | 2 · 21,8 arriba y 24 abajo |
| 360 dp | 1 · 12 | 1 · 13,2 | 2 · 15,6 | 2 · 18 | 2 · 21,6 | 2 · 24 |
| 390 dp | 1 · 12 | 1 · 13,8 | 1 · 14,7 | 2 · 18 | 2 · 21,6 | 2 · 24 |
| 412 dp | 1 · 12 | 1 · 13,8 | 1 · 15,4 | 2 · 18 | 2 · 21,6 | 2 · 24 |

- Alto de la cápsula: 66 a 68 dp en una fila; de 128 a 154 dp en dos.
- **Antes de este cierre** las etiquetas crecían hasta 1,15 veces y después se achicaban: con letra ×2 quedaban en
  13,2 sp en 360 dp y en 11,5 sp en 320 dp. Ahora, 24 y 21,8 sp.
- Una fila se conserva mientras la letra baje un 6 % como mucho (320 dp ×1, 360 dp ×1,15, 390 y 412 dp ×1,3). El único
  caso que achica en dos filas es 320 dp con ×2: la fila de arriba queda a 21,8 sp. Ninguna etiqueta se corta.
- La decisión usa el ancho de cada etiqueta medido con Roboto (`salida/medir-etiquetas.html`), con un 4 % de holgura.
  Con una letra de fabricante más ancha, la etiqueta igual se achica lo justo y no se corta.

## Los gráficos chicos

- **El eje es el orden de las tomas, no el tiempo.** Las tomas van a la misma distancia; la pantalla lo dice, y los
  gráficos de las tarjetas y del detalle rotulan sus extremos (T1 … T12). El gráfico de Evolución usa las fechas.
- **Probados con 1, 3, 6 y 12 tomas**, en anchos de 97 a 296 dp y altos de 18 a 40 dp: ningún punto se sale ni toca al
  vecino (`scripts/selector-de-tomas.test.mjs` y `scripts/composicion-de-la-figura.test.mjs`). Con una sola toma no hay
  gráfico: su valor ya está escrito.
- Valores iguales, a media altura. Un hueco, sin punto. Otro protocolo, método o unidad: una raya sobre la base, y «no
  comparable» en la lista.

## Medición local de Inicio

`herramientas/medir-inicio`: el cliente real de @be/domain y las lecturas reales de las tarjetas, contra un servidor
local con datos sintéticos válidos contra los contratos y una red simulada. **No es una medición en el teléfono ni
contra la API de test.** Los resultados completos, por escenario y por red, están en `resultados.md`.

| Caso, en frío | Solicitudes | Bytes | Toda la visita, 4G lento | Toda la visita, 3G lento | La tarjeta más lenta |
|---|---|---|---|---|---|
| Típico | 6 | 176 KB | 1,50 s | 4,99 s | Tu actividad (105 KB) |
| Sin registros de comida hoy | 7 | 176 KB | 1,48 s | 4,96 s | Tu actividad; Nutrición se puede usar a los 0,82 s |
| Sin mediciones recientes | 9 | 165 KB | 1,52 s | 4,75 s | Mediciones: 4 pedidos seguidos |
| Historial con muchas correcciones | 6 | 610 KB | 3,75 s | 13,9 s | Tu actividad (539 KB) |

- **La mejora con gzip es una simulación local**, no una medición: en la simulación, la visita típica bajaría a 8,5 KB
  y 0,62 s en 4G lento. La API hoy no comprime; no se verificó si Render lo hace en su borde.
- Un resumen agregado de la actividad (D-4) bajaría esa tarjeta a 0,58 s en la misma simulación. **D-4 queda diferida**:
  no se crea el endpoint, y la compresión se decide antes.

## Cierre del 2026-10-04

| Pedido de Dirección | Cómo quedó |
|---|---|
| Mapa corporal e Indicadores | Reemplazan a la vista «Toma», sin otro nivel de navegación. Gráficos chicos en cada sitio de la figura, unidos por su guía; indicadores en tarjetas de una o dos columnas; una sola elección de toma y de medida |
| Una evaluación que la API no deja reconstruir entera | Si otra evaluación cayó el mismo día, la toma lo avisa y cuenta «medidas a la vista». «Cómo se lee» dice qué puede no verse de cualquier toma |
| El período de la tarjeta de actividad | Dice el período que respondió la API. Mientras no hay respuesta, no dice fechas |
| El margen fijo de 5 s a la medianoche | Reemplazado por la hora del servidor, de la cabecera `Date` de cada respuesta, contada con un reloj monótono: la hora del teléfono no la mueve y el día no vuelve atrás. Con el margen, un teléfono adelantado 40 s volvía a leer 34,5 s antes de la medianoche del servidor y guardaba el día anterior con la clave del nuevo |
| El renglón del último registro de comida | Es una lectura aparte: la tarjeta ya no lo espera, y el documento dice lo que pasa. Va debajo de las acciones, para no correrlas cuando llega |
| La barra con letra grande | Sin tope de crecimiento; dos filas cuando una no alcanza |

## Revisión independiente del cierre

Una revisión aparte del diff del cierre no encontró defectos altos. Encontró uno medio y varios bajos, todos corregidos:

| Hallazgo | Corrección |
|---|---|
| Media · El renglón del último registro llegaba después y corría «Registrar» unos 80 dp bajo el dedo | Va debajo de las acciones |
| La estimación de la hora podía quedar hasta casi 1 s adelantada si el reloj del teléfono se movía un poco después de una respuesta, y una respuesta lenta la atrasaba | La hora se cuenta con un reloj monótono desde la mejor cabecera: la hora del teléfono no la mueve y una respuesta lenta se descarta. El día que se muestra no vuelve atrás |
| Cerrar el detalle en el mapa o en los indicadores cambiaba la medida de Evolución | Cerrar el detalle no toca la medida compartida |
| «Ver su evolución» podía abrir con «sin mediciones en estos días» si la persona había elegido 30 o 60 días | Abre con los días que incluyen esa toma |
| Una toma sin perímetros ni pliegues hacía saltar la vista sola, si la persona nunca había elegido una | La vista inicial se resuelve una vez |
| Textos para la persona que decían «la API», y «T2 y T3 y T4» | «BE muestra…» y «T2, T3 y T4» |
| Pruebas que afirmaban menos de lo que decían | La visita usa la regla de la tarjeta (`pideElUltimoRegistro`); el gráfico chico se controla con sus dos líneas; la revisión de textos suma los módulos `.ts` con frases |
| «Hoy» creaba un formateador de fechas en cada dibujo | Un formateador por zona, creado una vez |

## Revisión de la candidata anterior (e884432)

| Hallazgo | Corrección |
|---|---|
| Tocar «Nutrición» estando en Nutrición con una comida a medio escribir preguntaba sin motivo. Si se elegía salir, lo escrito quedaba sin declarar, y la salida siguiente lo perdía sin preguntar | Ir a la misma pantalla no pregunta. Lo declarado lo borra cada pantalla al desmontarse, no la pregunta. Nutrición no se vuelve a montar al perder el pedido de una sola vez |
| Con el selector de tomas, pasar a una toma que solo tiene la otra familia dejaba la silueta vacía | La figura dibuja la familia que la toma tiene |
| «Ver la toma» desde Inicio podía abrir otra toma elegida antes | Abre la última, la que nombra la tarjeta |
| Una respuesta tardía de «Comenzar sesión» movía a la persona aunque ya se hubiera ido de la pantalla o de la sesión | Se descarta si la tarjeta ya no está |
| A la medianoche, con el reloj del teléfono adelantado, «hoy» se pedía cuando para la API todavía era ayer | Primero, 5 s de margen; desde el cierre del 2026-10-04, la hora del servidor |
| Una sesión con correcciones que no se pueden ordenar se contaba como «corregida» | Se cuenta aparte, como se registró |

## Lo que hay que mirar en el teléfono

1. La barra con la letra del sistema en ×1,3 y en el máximo: dos filas, las cinco etiquetas enteras y legibles.
2. La barra con la letra de siempre en un teléfono angosto: una fila, sin cortes.
3. Mi evolución → Mapa corporal: elegir T1 y ver que cambian los valores y el punto resaltado de cada gráfico chico.
4. Tocar un sitio en la figura: su fila, su guía y su sitio se resaltan, y abajo aparece el detalle con su gráfico.
5. «Ver su evolución» desde ese detalle: abre Evolución con la misma medida.
6. Indicadores con la letra de siempre (dos columnas) y con letra grande (una).
7. Inicio sin comidas registradas hoy: la tarjeta de Nutrición se ve antes que el renglón del último registro.
8. El vidrio de la cápsula al desplazar Inicio, en los dos temas, con una y con dos filas.
9. El diálogo «¿Salir sin guardar?»: con una comida a medio escribir, tocar otro destino de la barra.
10. El mapa con la letra de siempre: el cuerpo grande, arriba y recortado a la derecha, sin hueco encima; los valores
    en columna a la derecha; ningún nombre cortado, tampoco al elegir su fila.
11. El vidrio de las tarjetas en los dos temas: el brillo arriba y la sombra con `elevation`, sin bordes fuertes.
12. Con letra grande, los chips de las tomas: se desplazan de costado y la toma elegida queda a la vista.

## Cómo se rehacen

En una copia de `herramientas/render-navegador` fuera del repo, para no dejar `node_modules` dentro:
```
npm i
BE_REPO=<raíz del repo> node construir.mjs
./capturar-todo.sh <carpeta de salida>
./medir-barra.sh <carpeta de salida>
```
Hace falta Node 22, Chrome y conexión para cargar Roboto. Los datos son los de `shims/api.ts`, todos sintéticos.

`./capturar-pulido.sh <carpeta de salida>` hace de la 12 a la 18. Las comparaciones (16 a 18) necesitan además el
«antes» y la variante C, y los comandos para compilarlos están en la cabecera del script. Para el control de cortes, `EXPRESION="$(cat cortes.js)" node cdp.mjs <png> <ancho> <alto> <url>`
devuelve los textos mirados y los cortados.

La medición de Inicio corre desde el repo, después de construir @be/domain:
```
node EVIDENCIA/INICIO-Y-NAVEGACION/herramientas/medir-inicio/medir-inicio.mjs
```
