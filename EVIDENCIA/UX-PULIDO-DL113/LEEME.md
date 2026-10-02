# Evidencia · Pulido de UX/UI (DL-113): dos pantallas representativas y componentes compartidos

**Pedido de Dirección (2026-10-02):** elevar la calidad visual y de uso del website y la APK con implementación
concreta, empezando por dos recorridos reales, y pasar lo aprendido a componentes compartidos. La imagen de referencia
orienta la estética: azul profundo, cian selectivo, jerarquía, orden. No autoriza funciones, indicadores ni datos
inventados, ni cambiar el logo.

## Cómo leer los estados

| Estado | Qué significa acá |
|---|---|
| **Implementado** | El código está en la rama y compila |
| **Verificado automáticamente** | Lo comprueba una prueba o un control del recorrido. No es la prueba manual de Dirección |
| **Observado en una captura real** | Una captura del website de verdad: el código de la rama, en Chrome sin ventana, con datos sintéticos en un entorno local aislado |
| **Solo en maqueta** | Un HTML con la misma geometría y los mismos textos. **No es una captura de Android** |
| **Pendiente de prueba manual** | Lo tiene que mirar Dirección en el teléfono o con un lector de pantalla |

Los datos de las capturas:
- un profesional sintético habilitado en Nutrición, Entrenamiento y Antropometría;
- un asesorado con tres tomas del perfil completo y 15 cálculos por toma;
- otro asesorado sin datos.

**Los pares de antropometría tienen exactamente los mismos datos.** En nutrición y entrenamiento, el después tiene una
evaluación más, la que registró el recorrido de verificación: ahí no se comparan alturas.

## Los diez hallazgos

| # | Pantalla | Problema observable | Consecuencia | Corrección | Estado |
|---|---|---|---|---|---|
| 1 | Website, todas, en el teléfono | El encabezado ocupaba cinco renglones (unos 220 px): la navegación partida, la apariencia y el aviso | La tarea arrancaba a unos 445 px | Tres renglones: marca y apariencia, navegación en una línea, aviso de ambiente | Implementado · verificado (≤ 130 px a 390 y 360) · observado |
| 2 | Website, pestañas de cada sección | Se partían en dos renglones («Lámina» abajo) | Empujaban la tarea y la pestaña elegida podía quedar en otro renglón | `Pestanas`: una línea; si no entra, se desplaza de costado con una sombra que lo indica, y la elegida queda a la vista, también al rotar | Implementado · verificado · observado |
| 3 | Website, toma antropométrica | Tarjetas dentro de tarjetas: medición, cálculo y ficha, con cuatro o cinco bordes en el teléfono | El texto quedaba en unos 200 px de ancho | Subsecciones con separador, filas en lugar de tarjetas y un solo panel para el cálculo nuevo; lo plegado, sin caja | Implementado · observado |
| 4 | Website, formularios de escritorio | El protocolo de la preparación se cortaba («Perfil antropométrico complet…») y las acciones quedaban al final de 30 mediciones | No se sabía qué protocolo era sin abrirlo; para guardar había que bajar hasta el fondo | El protocolo ocupa dos columnas; las acciones quedan fijas al pie, con el estado del guardado | Implementado · verificado (barra a la vista a mitad del formulario) · observado. **Los formularios de nutrición y entrenamiento no se revalidaron como defecto** |
| 5 | Website, ficha del método | En el teléfono, el desplegable cortaba el nombre y la ficha no lo repetía | El método elegido no se podía leer entero | El nombre completo es el título de la ficha | Implementado · observado |
| 6 | Website, toma antropométrica | Las tres tomas decían «2 oct 2026, 3:50 p. m.» (la fecha de registro); los resultados quedaban después de 30 tarjetas | Las tomas no se distinguían, y los cálculos estaban a unos 9.000 px | Cada toma se nombra por su fecha de ocurrencia, con la elegida marcada. Los metadatos van una vez, los cálculos antes que las mediciones, y el valor del resultado se destaca de su nombre | Implementado · verificado (tres fechas distintas; cálculos en la primera pantalla a 1440 px) · observado |
| 7 | APK, barra inferior | A 320 dp las etiquetas quedan pegadas | Se leen, pero apretadas | Revalidado: el componente las achica para que entren (hasta el 70 % con letra grande) y no las corta. Sin cambio de código | Solo en maqueta · **pendiente en un teléfono chico** |
| 8 | APK, «Mi evolución» | Período, fecha de la toma y fecha comparada seguidos arriba, y «el 28 de agosto de 2026» en cada fila | Mucho contexto antes de los datos | La fecha de la toma en el título; una línea con la comparada y las cantidades reales; el período en la evolución por medida; la fecha en la fila solo si difiere | Implementado (tsc y pruebas) · solo en maqueta · **pendiente en el teléfono** |
| 9 | Composición entre pantallas | Cada vista armaba sus bloques, avisos y plegados a su manera | Pantallas del mismo producto que no se parecían | Piezas compartidas: `.subseccion`, `.encabezado-de-bloque`, `.panel`, `.metadatos`, `.boton--compacto`, `Ayuda` sin caja. **La lámina y los gráficos no se tocaron**, para conservar sus contratos | Implementado (parcial) · observado |
| 10 | Estados | «Cargando…» suelto; vacíos sin paso siguiente | No se sabía si algo estaba cargando ni qué hacer con una lista vacía | `Cargando` como región de estado, con una marca que respeta «reducir movimiento». `EstadoVacio` con su acción real, por ejemplo «Preparar una toma». `ErrorConReintento` y el acceso retirado no cambiaron | Implementado (parcial) · verificado (vacío con acción) · observado |

**Hallazgo fuera del paquete:** un **503 intermitente** de la API local, en lecturas concurrentes (nutrición, lista de
tomas).
- Es `P2028` de Prisma: la transacción no pudo empezar a tiempo. Las lecturas tardaron entre 5 y 7 s, con 0,6 GB libres.
- La interfaz lo mostró con su reintento.
- Es la falla que `DEFENSA/WP-06.md` §5.5 dejó sin explicar; ahora tiene una causa probable.
- **Severidad:** media. Un profesional ve un error transitorio. No se tocó en este paquete.

## Website: antes y después

| | |
|---|---|
| **Toma, teléfono (390 px):** tomas por fecha, cálculos arriba | ![](web-10-evaluacion-390-antes-despues.png) |
| **Toma, teléfono estrecho (360 px)** | ![](web-13-evaluacion-360-antes-despues.png) |
| **Toma, Claro (390 px)** | ![](web-10-evaluacion-390-claro-antes-despues.png) |
| **Toma, escritorio (1440 px):** arriba antes, abajo después | ![](web-10-evaluacion-1440-antes-despues.png) |
| **Preparación, teléfono:** protocolo completo, acciones fijas | ![](web-12-preparacion-390-antes-despues.png) |
| **Preparación, escritorio** | ![](web-12-preparacion-1440-antes-despues.png) |
| **Ficha del método:** nombre completo | ![](web-11-nuevo-calculo-390-antes-despues.png) |
| **Nutrición:** encabezado y pestañas | ![](web-22-nutricion-390-antes-despues.png) |
| **Cartera:** encabezado | ![](web-20-cartera-390-antes-despues.png) |

Alto de la página de la toma, con los mismos datos:

| Ancho | Antes | Después |
|---|---|---|
| Teléfono, 390 px | 14.124 px | 7.525 px |
| Teléfono, 360 px | 14.683 px | 8.413 px |
| Escritorio, 1440 px | 9.951 px | 5.836 px |

Las mediciones, después, en filas por familia: [teléfono](web-mediciones-390-despues.png) ·
[escritorio](web-mediciones-1440-despues.png).

## APK: antes y después, en maqueta

| «Mi evolución», Azul noche | «Mi evolución», Claro |
|---|---|
| ![](maqueta-apk-mi-evolucion-azul-noche-antes-despues.png) | ![](maqueta-apk-mi-evolucion-claro-antes-despues.png) |

Las dos versiones usan los mismos datos de ejemplo, con métodos vigentes; cambia solo la estructura. La maqueta de la
pantalla está escrita a mano con la geometría de los componentes. **No es una captura de Android.**

La barra inferior a 320 dp: [maqueta](maqueta-apk-barra-320.png).

## La figura: los puntos en su lugar anatómico

**Regla de Dirección (2026-10-02):** los puntos anatómicos no se mueven para resolver cruces de líneas. Se ajustan las
guías, las tarjetas, la distribución o la escala. Que no haya cruces no prueba que un sitio esté bien ubicado.

**Qué se corrigió.** La primera versión de DL-113 corría dos sitios unos puntos para que las guías no se cruzaran:
- el bíceps, un poco más abajo que el tríceps;
- la cresta ilíaca, un poco más arriba que el supraespinal.

Ahora cada uno va a la altura que le corresponde:
- **el bíceps, a la altura del tríceps:** el bíceps está en la cara anterior del brazo y el tríceps en la posterior;
- **la cresta ilíaca, a la altura del supraespinal**, sobre la línea medioaxilar, que de frente es el borde del tronco.

De frente, cada par casi coincide. Las guías llegan al mismo lugar y las tarjetas dicen cuál es cuál. El tríceps sigue
marcado «posterior».

[Control de los sitios](control-sitios-anatomicos.png): las seis figuras, con los sitios del compositor en azul y estos
dos en rojo. Los diez caen sobre la silueta.

**Cómo se resuelven ahora los cruces, sin mover puntos:**
- **Lámina del website, Serie:** si una guía pasaría sobre otro punto, entra al sitio de costado. Con las posiciones
  anatómicas, es la guía del tríceps en el hombre y la del bíceps en la mujer.
- **Dos sitios en un mismo lugar** (a menos de 18 px en la lámina) no cuentan como cruce entre sí: sus guías tienen que
  llegar juntas. Las pruebas siguen exigiendo que ninguna guía pase sobre el punto de **otro** lugar.
- **Figura de la APK:**
  - las tarjetas se apilan por la altura media de sus sitios. El compositor las apila por su borde de arriba, y a la
    escala del teléfono eso ponía la tarjeta de cresta ilíaca, supraespinal y abdominal antes que la de subescapular y
    antebrazo, con las guías cruzadas;
  - los puntos se dibujan encima de las guías: si una guía pasa junto a otro punto, pasa por detrás.
  - La lámina del website conserva el orden del compositor.

| Lámina del website, captura real | Hombre | Mujer |
|---|---|---|
| Medición, Pliegues, cuerpo entero | ![](web-lamina-medicion-pliegues-hombre.png) | ![](web-lamina-medicion-pliegues-mujer.png) |
| Serie, Pliegues, tren superior | ![](web-lamina-serie-pliegues-hombre.png) | ![](web-lamina-serie-pliegues-mujer.png) |

| Figura de la APK, en maqueta (no es una captura de Android) |
|---|
| ![Hombre, Claro](maqueta-apk-figura-pliegues-hombre-claro-antes-despues.png) |
| ![Mujer, Azul noche](maqueta-apk-figura-pliegues-mujer-azul-noche-antes-despues.png) |

**Cruces medidos en la figura de la APK**, con todos los pliegues. Se mide con la misma geometría que el componente.
El «antes» es la APK 0.13.0: sitios corridos y tarjetas por el borde. Cada celda dice cuántos pares de guías se cruzan y
cuántas guías pasan a menos de 9 px del centro de otro punto.

| Figura | 320 dp | 360 dp | 393 dp | 412 dp |
|---|---|---|---|---|
| Pliegues, hombre, antes | 4 cruces · 3 cerca | 5 · 3 | 5 · 2 | 5 · 2 |
| Pliegues, hombre, ahora | 0 · 1 | 1 · 1 | 1 · 1 | 1 · 0 |
| Pliegues, mujer, antes | 1 · 1 | 1 · 1 | 1 · 0 | 1 · 0 |
| Pliegues, mujer, ahora | 1 · 2 | 1 · 1 | 1 · 0 | 1 · 0 |
| Perímetros, hombre (sin cambio) | 1 · — | 1 · — | 1 · — | 0 · — |
| Perímetros, mujer (sin cambio) | 3 · — | 2 · — | 2 · — | 2 · — |

**Lo que queda:**
- El cruce que queda en pliegues es dentro de una misma tarjeta: la guía del subescapular cruza la del antebrazo y pasa
  junto a su punto, ahora por detrás.
  - El subescapular está en el centro del pecho, rodeado de otros sitios. A esta escala no hay un camino recto que no
    pase cerca de alguno.
  - Invertir las filas de esa tarjeta lo mueve a la cresta ilíaca: se probó y no mejora.
- En la mujer a 320 dp, la guía de la axilar media pasa a 8,8 px del centro del bíceps: atraviesa su halo, no su punto.
- En perímetros, los cruces vienen del ancho de los anillos. No cambiaron con esta corrección.

**Observación para Dirección:** el supraespinal del compositor está en el borde del tronco. Por ISAK va sobre la línea
que une la espina ilíaca anterosuperior con el borde axilar anterior, a la altura de la cresta. De frente, ese punto
cae algo más adentro que la cresta ilíaca. No se movió, porque es un sitio del compositor.

## Pruebas ejecutadas

| Prueba | Resultado |
|---|---|
| **Recorrido de verificación**, local, con datos sintéticos (`web-verificacion-controles.json`) | **36 de 37.** El que falló es de la API: dos 503 (`P2028`), no de la interfaz. Cubre: <br>• encabezado y pestañas a 390 y 360 px, con la pestaña activa al final a la vista; <br>• sin desborde horizontal a 360, 390, 1280 y 1440 px, en las dos apariencias; <br>• lo escrito en un formulario sigue ahí después de cambiar la apariencia dos veces; <br>• un valor ilegible se marca en su campo; <br>• la barra fija sigue a la vista a mitad del formulario; <br>• una evaluación registrada en **nutrición** y otra en **entrenamiento**, con un profesional habilitado, y el aviso abajo; <br>• el estado vacío con su acción |
| **Capturas antes y después:** 28 pantallas en las dos apariencias | Sin desbordes ni errores de página |
| **Scripts:** copy, contraste, figuras, navegación de la APK y contexto citable | Verdes. T13 busca el titular en la fila nueva sin cambiar su oráculo: con el valor original como titular, falla |
| **tsc** del website y de la APK | Sin errores |
| **Dominio:** 430 pruebas, con las de la lámina | 430 de 430. Con las posiciones anatómicas falló una: la que pedía que la guía del **bíceps** del hombre entrara de costado. Ahora el desvío lo necesita el tríceps. La prueba nueva pide lo mismo, y para los dos sexos: la guía del pliegue del brazo que pasaría sobre el antebrazo entra de costado. No se aflojó ninguna otra prueba: las de holgura y cruces solo excluyen los pares que están en un mismo lugar |
| **Lámina del website**, captura real, Medición y Serie de Pliegues, hombre y mujer | Sin errores de página |

## Límites y pendientes de prueba manual

- **APK:** ninguna pantalla nueva se vio en un Android. «Mi evolución» y la barra están verificadas por tsc, pruebas y maqueta. Hay que mirar:
  - la primera pantalla de «Mi evolución» con letra normal y al máximo;
  - la barra en un teléfono de 320 a 360 dp;
  - el área segura con navegación por gestos y con tres botones;
  - que la barra se esconda con el teclado;
  - TalkBack, que debe anunciar cada zona como «pestaña» y la elegida como «seleccionada».
- **Website en un teléfono real:**
  - el desplazamiento de costado de pestañas y navegación, con el dedo;
  - la barra fija de la preparación con el teclado abierto.
- **Lector de pantalla del website:** las filas de medición nombran la medición en «Corregir» y «Anular» (`aria-label`), y `Cargando` es una región de estado. No se probó con NVDA ni con TalkBack.
- **La sombra del borde** (hay más de costado) se verificó en las dos apariencias a 360 px. Falta confirmarla en un teléfono real.
- **La figura de la APK** con los puntos en su lugar se vio solo en maqueta. En el teléfono hay que mirar «Mi evolución», Pliegues, con una toma del perfil completo: que el bíceps y el tríceps compartan lugar, y la cresta ilíaca y el supraespinal también, y que se lea qué guía va a qué tarjeta.
- **La ubicación de los sitios la valida Dirección.** Que no haya cruces no la prueba.
