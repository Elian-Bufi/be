# Guía de UX y UI de BE

**Estado:** vigente desde el 2026-10-01 (DL-113), a ratificar por Dirección.
**Alcance:** el website del profesional y del asesorado (`apps/web`) y la APK del asesorado (`apps/mobile`).
**Cuándo se usa:** en cada pantalla nueva y en cada cambio de una pantalla existente. Antes de abrir el PR se recorre la
[lista de control](#9-lista-de-control-por-pantalla).

Las reglas del legajo están por encima de esta guía. Las más citadas son:
- TEST-PRJ-009: no calificar;
- RNF-ACC-001 y B10-10: accesibilidad;
- REG-06-156/158: un cálculo reproducible.

Cuando una regla de acá choca con el legajo, gana el legajo y se anota en `docs/DEUDA_LEGAJO.md`.

---

## 1. Principios

1. **Lo que la persona viene a hacer, primero.** Arriba van el dato principal y la acción. El porqué y el «cómo se
   lee» quedan a un toque. Si una función queda debajo de tres párrafos, para la persona no existe.
2. **Plegar no es borrar.** Ningún texto que el legajo exige decir se elimina para simplificar: se pliega. Hay una
   excepción. Lo que la persona tiene que leer **antes** de un acto queda a la vista, por ejemplo consentir, revocar,
   cerrar la cuenta, anular o registrar algo que no se deshace.
3. **Ubicar, nunca calificar** (TEST-PRJ-009, RF-048):
   - ni verde para «mejoró» ni rojo para «empeoró», ni semáforos, ni rangos;
   - una diferencia es una resta con signo, y solo entre valores comparables (mismo protocolo, método y unidad);
   - un hueco es «Sin dato» y un resultado que falta es «Sin calcular»; nunca cero, y nunca «—» sin explicación.
4. **Un solo lugar para cada texto.** El copy vive en el dominio (`packages/domain/src/copy-*.ts`) y lo comparten
   website y APK. Se escribe en español rioplatense, con voseo y sin anglicismos innecesarios. Los textos que una sola
   pantalla usa pueden quedar en ella.
5. **Accesible por defecto.** Teclado, lector de pantalla, letra grande y contraste no son un repaso final: son parte
   de la pantalla desde el primer commit.

## 2. Texto

- **Una línea de contexto por bloque, como máximo, a la vista.** Lo demás va plegado:
  - en el website, `Ayuda` (`apps/web/src/components/ayuda.tsx`), un `<details>` nativo;
  - en la APK, `Ayuda` o `Desplegable` (`apps/mobile/src/ui.tsx`).
- **El título de lo plegado dice de qué trata**, por ejemplo «Qué pasa al revocar», «Cómo conviven los cálculos» o
  «Con qué se calculó». No sirve «Más información». Por defecto es «Cómo se lee».
- **Varias notas seguidas van en una sola Ayuda**, no en tres.
- **Siempre a la vista:**
  - el texto de consentimiento o de efectos antes del botón que actúa;
  - las advertencias de honestidad junto a un número, por ejemplo «no es una valoración de progreso»;
  - la ayuda de un campo que hace falta para llenarlo bien, atada con `aria-describedby`;
  - los estados vacíos, con qué hacer;
  - los errores, con qué corregir (DL-104).
- **Palabras prohibidas.** Cada dominio tiene su lista (`terminosProhibidos…` en el dominio). La prueba
  `scripts/copy-pantallas.test.cjs` recorre el texto de las pantallas y falla si aparece alguna.
- **Números:**
  - siempre con su unidad;
  - con la precisión que declara el método, sin redondeo silencioso (REG-06-158);
  - con el separador decimal y de miles del español (`numero`, `cantidad`).

## 3. Avisos y diálogos

| Qué pasó | Cómo se muestra | Pieza |
|---|---|---|
| Una acción salió bien | Fijo abajo, donde la persona está mirando. No mueve la página ni roba el foco. Se anuncia (`role=status`) y se puede cerrar. Se va solo cuando alcanzó a leerse: 6 s como mínimo, más según el largo. Mientras se lo mira o tiene el foco, no se va. Si trae un enlace o un botón, se queda hasta que se cierra (`seQueda`, WCAG 2.2.1). | Website: `AvisoFlotante` · APK: `Aviso tipo="exito"` en su sección |
| Algo salió mal | Junto al formulario, con el foco, diciendo qué corregir y en qué campo. | `Aviso tipo="error" enfocar` (website) · `Aviso` y error por campo (APK) |
| Hay que confirmar | Diálogo **modal** centrado, con el foco adentro. Escape vuelve. La acción con efecto nunca es la opción por defecto. | Website: `DialogoDeConfirmacion` · APK: `dialogo.tsx` |
| Información de contexto | Junto a lo que explica, plegada si es larga. | `Aviso tipo="info"` / `Ayuda` |

No se usa `<dialog open>` en el flujo de la página: en el teléfono aparece arriba de todo, lejos del botón que lo
abrió. Pasó con «Registrar evaluación» en la prueba del 2026-10-01.

## 4. Navegación

**APK**
- Barra inferior con cinco zonas: Nutrición, Entrenamiento, Evolución, Información y Cuenta (`barra-de-zonas.tsx`).
- Cada zona lleva texto **e** ícono, mide 56 dp de alto y al menos 48 de ancho, y tiene rol de pestaña con su estado
  «seleccionada».
- La zona elegida se marca con una barrita y negrita, no solo con color.
- En una subpantalla se resalta la zona madre, y el enlace «Volver» solo aparece en subpantallas.
- La barra se oculta mientras el teclado está abierto.
- Atrás, desde una zona, vuelve a Nutrición; desde Nutrición, sale de la app.
- Una función nueva entra en la zona que le corresponde por dominio. No se agregan botones de zona en Cuenta.
- **Volver a una zona no recarga todo** (candidata 0.13.2, `src/lecturas.ts`).
  - Se ve al instante lo último leído en la sesión y se vuelve a pedir una vez, en silencio. Mientras tanto corre una
    línea fina sobre el borde del encabezado.
  - La respuesta nueva manda. Escribir olvida todo lo leído, y nada pasa de una sesión a otra.
  - Cada zona vuelve a la altura en que se la dejó, y tocar la zona en la que se está lleva al principio.

**Website**
- Adentro de un asesorado, una pestaña por dominio.
- La dirección dice dónde se está: se navega con el router (`irA`), no cambiando un estado escondido.
- La acción principal de cada vista va arriba, visible sin desplazarse en 390 px de ancho.
- **Lo principal, primero.** En la lámina, el orden es:
  - qué se muestra (la toma y la hoja);
  - enseguida, la imagen con «Descargar imagen»;
  - después, los ajustes de cómo se ve;
  - al final, la explicación.
  En el teléfono, la imagen entra en la primera pantalla. El orden del documento es el del teléfono, y el foco lo sigue.
- **Desde 1100 px (`69rem`), columnas con sentido:**
  - las tomas, la lista a la izquierda (fija) y la abierta a la derecha;
  - la lámina, lo que se elige a la izquierda y la imagen a la derecha, fija mientras se ajusta.
- **En el teléfono, el encabezado tiene tres renglones, no cinco:**
  - la marca y la apariencia (la etiqueta «Apariencia» queda oculta a la vista, pero sigue siendo el nombre accesible);
  - la navegación, en una sola línea;
  - el aviso de ambiente, que el 08 §33 exige siempre a la vista.
- **Las pestañas de cada sección van en una línea** (`Pestanas`).
  - Si no entran, se desplazan de costado. Es un desplazamiento deliberado del componente, no de la página.
  - Una sombra en el borde avisa que hay más.
  - La pestaña elegida siempre queda a la vista, también al rotar el teléfono.

## 5. Toque, tamaño y letra

- Objetivos táctiles de al menos 44 px en el website (`2.75rem`) y 48 dp en la APK, con separación entre ellos.
- La pantalla soporta la letra del sistema al máximo, en la APK, y el zoom al 200 %, en el website:
  - sin cortar texto;
  - sin desplazamiento horizontal;
  - `adjustsFontSizeToFit` solo en la barra inferior.
- **APK: el contenido crece sin tope.** Solo el encabezado y las etiquetas de la barra inferior crecen hasta 1,15: la
  marca no informa nada, y en la barra el ícono acompaña y el lector de pantalla dice el nombre completo. No se
  desactiva el escalado ni se achica el texto para que entre.
- **Las opciones excluyentes van en píldoras** (`Segmentos`, APK). Si no entran, bajan enteras a la línea siguiente:
  nunca se parte una palabra. Lo usan las preferencias visuales: la figura y los colores.
- **Una figura con texto adentro se adapta a la letra** (`composicion-de-la-figura.ts`). Con la letra de la persona,
  cada fila mide lo que necesita. Si las tarjetas no entran, la figura pasa a números, que bajan en orden, y debajo va
  una lista que crece sin tope.
- **Website, con el teclado del teléfono abierto:**
  - la ventana se achica (`interactive-widget=resizes-content`, en `layout.tsx`), y una barra fija queda arriba del
    teclado, no detrás;
  - el campo enfocado se lleva por encima de la barra (`scroll-padding-bottom`).
- Anchos de referencia:
  - APK: 360 dp, y 286–300 dp para los equipos chicos;
  - website: 390 px en el teléfono y 1280 px en la computadora.

## 6. Color y temas

- **Solo tokens:**
  - website: variables de `globals.css`;
  - APK: `tema.ts`;
  - lámina: `COLORES_DE_LA_LAMINA`.
  La prueba `scripts/contraste.test.cjs` falla con un color literal en una pantalla y mide los pares declarados.
- **Contraste AA:**
  - 4,5:1 para el texto;
  - 3:1 para los bordes de los controles y los íconos que comunican.
- **Temas:**
  - website: «Azul noche», que es el predeterminado, y «Claro». Se eligen en el encabezado. La preferencia vive en el navegador (`localStorage`): no se guarda en la cuenta ni pasa a otros dispositivos. Cambiar de apariencia no toca lo escrito en un formulario;
  - APK: «Azul noche» y «Claro», elegibles en Cuenta;
  - la lámina tiene sus tres temas propios, que no cambian la apariencia del website.
- **El significado no va solo en el color.** Un pliegue de la cara posterior se marca con el aro punteado y la palabra
  «posterior». Una zona elegida, con barrita y negrita.
- **Una silueta clara sobre un fondo claro lleva contorno**, con su contraste medido.
  - En Claro, el cuerpo blanco daba de 1,01:1 a 1,19:1 contra la lámina.
  - El contorno de la APK (`laminaContorno`) da 4,0:1, y la prueba de contraste lo verifica.

## 7. Figuras, láminas y gráficos

- **La figura ubica:**
  - cada medida con valor tiene su punto (pliegue) o su anillo (perímetro) y una guía a su fila;
  - lo que no tiene valor no se dibuja.
- **Guías limpias:**
  - las filas de una tarjeta siguen la altura de sus sitios;
  - las guías no se cruzan y no pasan a menos de 14 px de otro punto;
  - en Serie, si hace falta, entran al sitio de costado.
  Lo prueba `packages/domain/src/lamina.test.ts`.
- **Un sitio nuevo en la figura:**
  - se ubica sobre la imagen con una vista de control: los seis recortes con los sitios marcados;
  - se prueba que cae sobre el cuerpo y que no pisa a otro;
  - se declara a validar por Dirección.
- **Los puntos anatómicos no se mueven para resolver cruces de guías.**
  - Un cruce se resuelve con las guías, las tarjetas, el reparto o la escala. Por ejemplo, la guía puede entrar al sitio de costado.
  - Que no haya cruces no prueba que el sitio esté bien ubicado: la ubicación la valida Dirección.
  - Dos sitios de caras distintas a la misma altura quedan, de frente, casi en el mismo lugar: el bíceps y el tríceps, la
    cresta ilíaca y el supraespinal. Sus guías llegan juntas, la tarjeta dice cuál es cuál y el posterior lleva su marca.
  - En el teléfono, las tarjetas se apilan por la altura media de sus sitios y los puntos se dibujan encima de las guías:
    si una guía pasa junto a otro punto, pasa por detrás.
- **En el teléfono, la figura es liviana.** Halos y aros chicos, guías finas, y una calle entre las tarjetas y el cuerpo
  para que las guías doblen afuera.
- **La imagen exportada se equilibra.** En Medición con el cuerpo entero, la figura arranca en 290 y mide 1390. Así no
  queda una franja vacía bajo el encabezado (Dirección, 2026-10-03). Los otros encuadres son los del compositor.
- **Tabla equivalente.** Todo gráfico o figura tiene una tabla o lista equivalente, que es el camino del teclado y del
  lector de pantalla (B10-10 §11). En la APK, «La figura, en lista».
- **Los resultados calculados siempre llevan su método.** Dos métodos no se comparan entre sí, y ninguno se marca
  como «el bueno» (REG-06-205).

## 8. Estados

Toda vista que lee datos contempla estos estados, con las piezas de `estados.tsx` (website y APK):
- **cargando:** `Cargando`. En el website es una región de estado (`role="status"`), con una marca que se detiene con «reducir movimiento»;
- **actualizando** (APK): con datos a la vista no se vuelve a «Cargando…». Corre la línea del encabezado, que queda quieta con «reducir movimiento». Si el pedido falla de forma pasajera, `SinActualizar` dice «No pudimos actualizar», muestra lo leído en la sesión y deja reintentar;
- **error con reintento:** `ErrorConReintento`, sin perder lo que la persona escribió;
- **vacío:** `EstadoVacio` en el website. Lleva un título que dice qué falta, una línea con qué significa y, si existe, la acción real que corresponde, nunca un dato inventado. Ejemplo: sin tomas, «Preparar una toma»;
- **acceso retirado** (B10-06): se retira el contenido entero, no a medias;
- **sesión vencida:** vuelve a «Iniciar sesión» y lo dice, con su propio aviso. En la APK, solo un código de sesión cierra la sesión: un 403, un 429, un 5xx o la falta de red, nunca.

## 9. Lista de control por pantalla

Se copia en la descripción del PR y se marca.

**Contenido**
- [ ] Lo primero que se ve es el dato principal o la acción.
- [ ] A la vista hay como máximo una línea de explicación por bloque; lo demás está en una Ayuda con título.
- [ ] Ningún texto exigido por el legajo se borró; lo que se lee antes de actuar está a la vista.
- [ ] Ningún número está calificado; los huecos dicen «Sin dato» y los cálculos que faltan, «Sin calcular».
- [ ] Pasa `node --test scripts/copy-pantallas.test.cjs`: ninguna palabra prohibida.
- [ ] Español rioplatense, con voseo.

**Interacción**
- [ ] Los éxitos son flotantes; los errores, junto al campo y con el foco.
- [ ] Las confirmaciones son modales y la acción con efecto no es la opción por defecto.
- [ ] Los objetivos táctiles miden al menos 44 px o 48 dp.
- [ ] La APK no agrega accesos fuera de la barra inferior y su zona.

**Accesibilidad y visual**
- [ ] Con teclado se alcanza todo y el foco se ve.
- [ ] El lector de pantalla anuncia nombre, rol y estado: expandido, seleccionada, deshabilitado.
- [ ] Funciona en 360 dp o 390 px sin desplazamiento horizontal, y con la letra al máximo.
- [ ] Usa solo tokens: pasa `node --test scripts/contraste.test.cjs`.
- [ ] Los dos temas de la APK se ven bien.

**Verificación**
- [ ] Se miró la pantalla de verdad: captura del website con datos sintéticos, o maqueta y después teléfono, para la APK.
- [ ] El informe separa lo verificado por automatización de lo que falta probar en el teléfono.

## 10. Componentes y patrones del website

Viven en `apps/web/src/components/` y en `globals.css`. Antes de crear otro, se usa uno de estos.

| Pieza | Para qué | Ejemplo |
|---|---|---|
| `Pestanas` | Las secciones de un asesorado, en una línea. La elegida, a la vista | `<Pestanas etiqueta="Secciones de Nutrición" vistas={VISTAS} actual={vista} href={(c) => …} />` |
| `Ayuda` | Una explicación larga, plegada. Es un enlace con su marca ▸, no una caja | «Cómo conviven los cálculos», «Con qué se calculó» |
| `AvisoFlotante` | El éxito de una acción, abajo. Con `seQueda` si trae una acción | «Cálculo registrado», «Guardado» |
| `EstadoVacio` | Lo que todavía no hay, con su paso siguiente | «Todavía no hay evaluaciones registradas» → «Preparar una toma» |
| `.metadatos` | Lo que vale para todo un bloque, dicho una vez debajo del título | «Protocolo: … · 30 mediciones · registrada el … por …» |
| `.subseccion` | Un bloque dentro de una sección: un separador, no otra tarjeta | «Cálculos» y «Mediciones» dentro de la toma |
| `.encabezado-de-bloque` | El título de un bloque con su acción principal al lado | «Cálculos» + «Calcular con un método» |
| `.panel` | Un formulario que se abre en el lugar: una sola superficie | La ficha de un cálculo nuevo |
| `.acciones--fijas` | Las acciones de un formulario largo, fijas al pie, con el estado de lo guardado | La preparación de una toma: «Todavía no se guardó.» + «Guardar» |
| `.boton--compacto` | Una acción de fila: el mismo alto táctil (44 px), menos relleno | «Corregir» y «Anular» en cada medición |
| `.tomas` | Elegir entre registros por su **fecha de ocurrencia**. El elegido, marcado por forma | Las tomas de antropometría |
| `.mediciones` / `.medicion__fila` | Filas compactas por familia, con el valor alineado y las acciones en la fila | Las 30 mediciones de una toma |

**Reglas que salieron de este trabajo:**
- **La fecha que importa nombra al registro.** La fecha de ocurrencia es lo principal. La de registro es un metadato: con ella sola, tres tomas registradas el mismo día se veían iguales.
- **El resultado va antes que el detalle.** En la toma, los cálculos van antes que las 30 mediciones.
- **Una sola vez.** El protocolo, la fecha y la cantidad de algo que vale para todo un bloque se dicen una vez. En una fila, solo si difieren.
- **Nombres completos a la vista.** Si un desplegable corta un nombre en el teléfono, el nombre elegido se repite completo en la ficha.
- **Las acciones se jerarquizan por el estado real.**
  - Sin borrador, «Guardar» es lo principal.
  - Con borrador, lo principal es «Registrar», que guarda antes.
  - Una acción excepcional, como agregar una medición fuera del protocolo, no va entre las principales.
- **No se pliega lo que hace falta para decidir:** requisitos de un cálculo, población en que se validó, advertencias. Se pliega la explicación larga.

## 11. Cómo se verifica

| Qué | Cómo | Quién |
|---|---|---|
| Tipos, copy y contraste | `npx tsc --noEmit` (website y APK) y `node --test scripts/*.test.cjs` | CI y ejecutor |
| Geometría de la figura y la lámina | pruebas del dominio (`lamina.test.ts`) y recortes de control | ejecutor |
| Recorrido del website | puppeteer con datos sintéticos, en un entorno aislado; capturas a 390 y 1280 px | ejecutor |
| Pantallas de la APK | maquetas HTML con la misma composición que la APK (`composicion-de-la-figura.ts`), con la escala de letra simulada y en los dos temas. Se rotulan «MAQUETA · NO ES LA APK» | ejecutor |
| Uso real | la APK publicada, en el teléfono, con TalkBack y la letra al máximo | **Dirección** |

La automatización no reemplaza la prueba de Dirección en el teléfono. Un informe nunca dice «todo validado» si esa
prueba no se hizo.

## 12. Lo que se sabe que falta

Son las mejoras de UX detectadas que no entraron en DL-113. Cada una entra en un tramo cuando Dirección la prioriza.
- **La figura del teléfono, en el tronco.** Los halos se achicaron en la candidata 0.13.2, y con la letra grande la
  figura pasa a números. Falta mirarlo en el teléfono. Con números y letra ×2, algunas guías de pliegues todavía se
  cruzan, porque los sitios no se mueven.
- **TalkBack y letra al máximo en un Android físico** (RNF-ACC-001). Nunca se probaron.
- **Recargar el website cierra la sesión** (DL-012): la sesión vive en memoria.
- **Cerrar la APK, o que Android cierre su proceso, obliga a volver a entrar** (DL-012). La propuesta de guardar el
  token en el almacenamiento seguro hasta que venza está en DL-012 y espera la decisión de Dirección.
- **El texto de la imagen exportada se ve chico en un teléfono.** El lienzo es de 1080 px; equilibrarlo no lo agranda.
  Agrandar la letra exige recomponer las tarjetas.
- **Búsqueda por texto** en los catálogos externos (DL-098).
- **La barra inferior de la APK a 320 dp.** Las etiquetas crecen hasta 1,15 y se achican hasta el 85 % si no entran: hay que mirarlo en un teléfono chico.
- **Los filtros de «Pendientes» en el teléfono** ocupan una pantalla antes del primer pendiente.
- **Un 503 intermitente de la API** (`P2028`: la transacción no pudo empezar a tiempo) con lecturas concurrentes y poca memoria. La pantalla lo muestra con su reintento. Es de la API, no de la interfaz.
- **Las demás pantallas del website.** Siguen esta guía desde DL-113. Las que se toquen después se revisan con la lista
  de control.
