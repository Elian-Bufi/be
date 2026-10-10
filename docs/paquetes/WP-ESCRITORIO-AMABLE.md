# WP-ESCRITORIO-AMABLE — el escritorio del profesional, amable de usar · definición del paquete

> **Estado:** DEFINIDO el 2026-10-10. La implementación avanza por partes en la rama `wp-escritorio-amable`, sin
> integrar. El estado de cada parte está en §8 y lo probado, en `EVIDENCIA/ESCRITORIO-AMABLE/`.
>
> **Encargo:** pedidos de Dirección del 2026-10-09 y del 2026-10-10, en la conversación de trabajo. El escritorio del
> profesional «tiene mucha información», con «los filtros y tantas opciones» a la vista: «primero hagamos amable el uso
> de la plataforma». Dirección delegó la dirección de UX en el ejecutor, devolvió correcciones sobre cuatro versiones
> de las maquetas y eligió los dos últimos íconos. El 2026-10-10 dijo que lo que no corrigió le parece correcto y
> aclaró que eso es confianza en el criterio del ejecutor, no una revisión pantalla por pantalla. A la propuesta de
> implementar por partes, empezando por la ficha del asesorado, respondió «Correcto en todo».
>
> **Autorización:**
> - **Sí:** desarrollar en una rama aislada, apilada sobre `wp-dashboard-comprension`; cambios de presentación y de
>   textos de pantalla en el website; pruebas y recorridos locales con datos sintéticos; un PR en borrador.
> - **No:** merge, despliegue, publicación de una APK, gastos ni servicios externos. Tampoco funciones nuevas, cambios
>   de permisos, de contratos, de la base o del legajo: lo que los pediría queda fuera (§6), con su motivo.
>
> **Base:** `wp-dashboard-comprension` en `ab90860` (PR #154, en borrador, apilado sobre #153 `wp-dashboard-profesional`).
> No incluye #151 ni #152. Cuando #154 se integre, la base de este PR pasa a la que corresponda, sin reescribir historia.
>
> **Datos:** solo sintéticos, en una base local propia (`be_test_escritorio`, PostgreSQL 16 en :55442) con su carpeta de
> trabajo `herramientas/trabajo-escritorio/`, que git ignora. Las bases `be_test_dashboard` (#153) y
> `be_test_comprension` (#154) no se regeneran: quedan para comparar.

## 0. Fuentes leídas

- **Pedidos y devoluciones de Dirección** del 9 y del 10 de octubre. Están resumidos, con la devolución que originó
  cada cambio, en `EVIDENCIA/ESCRITORIO-AMABLE/diseno/CRITERIO-Y-AUDITORIA.md` (§4: los 81 cambios respecto de hoy).
  En este documento, **C-17** quiere decir «el cambio 17 de esa lista».
- **Diseño** (`EVIDENCIA/ESCRITORIO-AMABLE/diseno/`): el criterio (ocho criterios, el mapa de qué queda a la vista y
  qué a un clic, las reglas para 1280 y 1024 px), las 29 pantallas en Claro y en Azul noche, y el catálogo de los 105
  íconos con lo que simboliza cada uno.
- **04:** RNF-ACC-001 (accesibilidad en los recorridos núcleo, con WCAG 2.2 AA como marco: teclado, foco visible,
  etiquetas, contraste, estados que no dependen solo del color), RNF-ACC-002 (lenguaje claro, no diagnóstico y no
  causal), RNF-ACC-003 (operable en las superficies objetivo sin perder acciones esenciales) y RNF-PERF-002 (estado
  visible sin bloqueo prolongado). RF-034, RF-053 y RF-054 son los requisitos de la ficha: no cambian.
- **Paquetes anteriores:** `WP-DASHBOARD-PROFESIONAL.md` (matriz PRO-01 a PRO-26) y `WP-DASHBOARD-COMPRENSION.md`
  (D-01 a D-33, CP-01 a CP-30). Sus decisiones siguen valiendo; §7 dice cuáles cambian de forma.
- **Guía de UX** (`docs/ux/GUIA-UX-UI.md`): se actualiza dentro de este paquete (§7).
- **Repositorio:** dos relevamientos del 2026-10-10, en `EVIDENCIA/ESCRITORIO-AMABLE/relevamientos/`:
  `ficha-y-estilos.md` (cómo está hecha hoy la ficha, la hoja de estilos, los temas y los gráficos) y
  `pruebas-y-evidencia.md` (qué comprobaciones dependen de los textos y de la estructura de las pantallas). Los otros
  tres (`antropometria.md`, `entrenamiento.md`, `informacion-y-nutricion.md`) son la base del segundo paquete (§6).
  Lectura directa de `tokens.css`, `scripts/contraste.test.cjs`, `apps/mobile/src/tema.ts` y las herramientas de
  recorrido.
- **10:** B10-10 (borrador, no canónico), §1 (invariantes), §11 (visualizaciones) y §12 (color y semántica), leído el
  2026-10-10. Lo que pide de los gráficos está en §7.

## 1. Objetivo y demostrables

Que el profesional encuentre lo que vino a mirar sin desplazarse ni configurar. BE no tiene opciones de más: tiene
demasiadas a la vista al mismo tiempo, y todas con el mismo peso. **No se quita ninguna función:** se decide qué queda
a la vista y qué a un clic.

Medido hoy con `herramientas/paginas.mjs`, a 1440 × 900, con el asesorado A y el período de 90 días:

| Vista | Hoy | Al cerrar su parte |
|---|---|---|
| Resumen | 2.313 px de alto (2,6 pantallas) | Objetivo, plan, pendientes y la acción de cada área, las preguntas y los indicadores, sin desplazarse |
| Línea de tiempo | 10.728 px (11,9 pantallas) para los primeros 50 hechos | Una semana a la vista; lo rutinario agrupado por día; el detalle, al costado |
| Analizar, con una pregunta en curso | 2,7 pantallas (medido el 9/10; se vuelve a medir al empezar la Parte 2) | La barra, los gráficos y la lectura, sin desplazarse; los gráficos ocupan la mayor parte del ancho |
| Espacio profesional | 2.634 px (2,9 pantallas) | Los pendientes y el directorio de asesorados, a la vista |

En todas: los dos temas con las paletas medidas el 30/9, una sola familia de íconos, y a 1280 y 1024 px las reglas
escritas en el criterio (§3, «En 1280 y en 1024 de ancho»). A 768 y 390 px no se rompe (RNF-ACC-003).

## 2. Lo que no cambia

- **Las funciones, las operaciones y los permisos.** No hay ninguna operación nueva ni cambia qué ve cada quien.
- **Los contratos.** Los parámetros de la URL y sus letras (`vista`, `p`, `m`, `modo`, `g`, `ref`, `cmp`…) y los
  enumerados que guarda el servidor (`PANELS|OVERLAY|RELATIVE`, `ORIGINAL|DAY|WEEK`) quedan igual: una vista guardada
  o un enlace de hoy se abren igual después. Cambia el nombre que se lee, no el valor que viaja.
- **Las reglas de BE:** ubicar, nunca calificar (sin verde ni rojo de juicio, sin porcentaje de cumplimiento, sin
  semáforos); un hueco es un hueco, nunca un cero; cada dato dice de dónde sale; ver no es revisar.
- **Los textos que son garantías.** Los que arma el dominio con prueba propia (la síntesis, la cobertura, «frente a
  lo indicado», los efectos de cada resultado de una revisión) no se reescriben para que entren en una composición.
- **La accesibilidad ya lograda:** «Saltar al contenido», un título principal por página, foco visible, teclado en el
  gráfico con su tabla equivalente, objetivos de 44 px, `prefers-reduced-motion`, y el orden del documento igual al
  orden visual.

## 3. Partes

Cada parte deja la rama en un estado que se puede integrar: si el plazo corta el paquete, lo hecho sirve.

| # | Parte | Pantallas del diseño | Cambios del criterio | Dónde está hoy |
|---|---|---|---|---|
| 0 | **La base visual,** en todo el website: las dos paletas medidas y la familia de íconos, como datos y componente. Las piezas que comparten las pantallas nuevas (control segmentado, etiqueta con ícono, chip con cantidad, bloque de estado) entran con la primera parte que usa cada una | Todas | C-11, C-23, C-29, C-32, C-44, C-45, C-47 | `tokens.css`, `globals.css`, `components/` |
| 1 | **El marco de la ficha:** persona, acceso, «Solicitar contexto», «Actualizar» y la hora en una franja; las tres vistas con su ícono; un solo control de período con los atajos adentro; las horas en 24 horas. La ayuda única de cada vista (C-04) entra con su vista, en las partes 2 a 4 | 01 a 12, 14 y 15 | C-02, C-10 | `advisees/workspace.tsx`, `seguimiento/barra.tsx` |
| 1 bis | **La barra de marca:** el menú de la cuenta en la esquina, con la apariencia adentro; «Cuenta» sale de la navegación del profesional; el aviso de ambiente de prueba sale de la barra; un solo renglón, también en la tablet de pie. **Las tarjetas de «Empezar por una pregunta»,** del mismo tamaño | No estaba en las maquetas: son tres pedidos de Dirección del 2026-10-10, al ver la Parte 1 | — | `components/encabezado.tsx`, `navegacion.tsx` y `menu-de-cuenta.tsx`; los estilos de `seguimiento/preguntas.tsx` |
| 2 | **Analizar:** la configuración en una barra, los gráficos y la lectura; «¿Qué querés mirar?»; todos puntos y la métrica por color y nombre; lo planificado y lo registrado en el mismo gráfico; los días sin registros, sombreados; «Separadas», «Juntas» y «Cambio relativo»; el origen del dato en el lugar de la lectura; comparar etapas | 03 a 05, 07 a 12 y 15 | C-08, C-12, C-13, C-16 a C-22, C-28, C-30, C-33 | `seguimiento/analizar.tsx`, `lienzo.tsx`, `selector.tsx`, `preguntas.tsx`, `etapas.tsx`, `contraste.tsx` |
| 3 | **Resumen:** una tarjeta por área, con su acción; cuatro preguntas; cuatro indicadores; la tira del objetivo del día | 01 y 14 | C-03, C-05, C-26, C-28, C-30, C-31 | `seguimiento/resumen.tsx` |
| 4 | **Línea de tiempo:** lo rutinario agrupado por día; vistas con nombre y cantidad; un día sin novedades, en un renglón; el detalle al costado | 02 | C-06, C-07, C-25 | `seguimiento/linea-de-tiempo.tsx`, `registro-original.tsx` |
| 5 | **Espacio profesional:** vistas con cantidad, el último registro debajo de cada pendiente y el directorio al costado | 13 | C-34 | `pro/espacio-profesional.tsx`, `pro/pendientes.tsx` |

Los estados de página (pantalla 19, C-43) entran con la parte que los muestra. C-18 (se mantienen las tres métricas) y C-24
(el isotipo real) ya se cumplen: no piden trabajo.

## 4. Decisiones

Se completan a medida que se implementa. Cada una dice qué se eligió y qué otra opción había.

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| E-01 | **Se rediseña en el lugar,** sin una versión paralela ni un interruptor. | La rama está aislada y en borrador: lo que hay se compara con las capturas del «antes». Una segunda versión detrás de un interruptor duplicaba el código y las pruebas. |
| E-02 | **Lo nuevo entra con clases nuevas; las compartidas solo cambian de piel.** `.pestanas`, `.chip`, `.tabla`, `.seccion` y `.dialogo` las usan también las pestañas de área, la cuenta y la cara pública: en este paquete reciben las paletas y nada más. | Recomponerlas ahora cambiaba pantallas que no están en el alcance. El costo: hasta el segundo paquete, la ficha y las pestañas de área comparten colores e íconos, pero no la disposición. |
| E-03 | **Los nombres cambian en la pantalla, no en el contrato** (§2). | Un enlace o una vista guardada de hoy tienen que seguir abriendo. |
| E-04 | **Los íconos van como datos en el dominio** (`packages/domain/src/iconos.ts`) **y el website los dibuja con un componente.** La APK sigue con los suyos hasta su propio paquete. Desde que entran al repositorio, ese archivo es la fuente: un dibujo se cambia ahí. | Es lo que comparten los dos productos: cada dibujo queda escrito una vez. Se descartó dejarlos solo en el website (habría que mudarlos al unificar la APK) y traer el generador del taller (necesita un navegador y rutas de una máquina). |
| E-05 | **Los textos que cambian quedan donde están hoy:** en la pantalla, si son de una sola; en el dominio, si ya vivían ahí. La prueba de palabras prohibidas (`scripts/copy-pantallas.test.cjs`) se extiende a la ficha, que hoy no cubre. | Mudar todos los textos de la ficha al dominio era otro trabajo. Extender la prueba cuesta poco y evita que entre una palabra que califica. |
| E-06 | **Cada comprobación de los recorridos conserva lo que protege.** Si cambia un texto o un selector, se actualiza la comprobación y se anota la equivalencia. Una comprobación negativa («la pantalla no dice X») se actualiza **en el mismo cambio** que el texto que niega. | Hay unas 25 comprobaciones negativas: si el texto cambia y la comprobación no, sigue pasando sin proteger nada. |

**De la Parte 0:**

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| E-07 | **En Claro, cuatro colores de texto van un punto más oscuros que los medidos:** secundario `#566881` (medido `#5e728d`), enlace `#135ddf` (`#1465f1`), error `#ad471a` (`#bb4d1c`) y éxito `#0f7640` (`#107f45`). | La prueba de contraste no se tocó: mide los mismos pares que antes, incluido el velo azul de la cara pública. Con los valores medidos, esos cuatro quedaban entre 4,0 y 4,4 sobre el velo; el mínimo es 4,5. Se descartó quitar el velo (cambiaba la portada) y sumar excepciones a la prueba. En Azul noche los valores medidos pasan sin cambios. |
| E-08 | **Hallazgo corregido en la portada:** el lema y los íconos de las tarjetas iban en cian también en Claro (1,4:1 sobre el fondo; ese par no estaba declarado en la prueba). Pasan al color de los enlaces, que sí se mide, y la portada usa los íconos de la familia en lugar de tres dibujos propios. | Era un defecto anterior a este paquete; quedó a la vista al revisar las 28 páginas con las paletas nuevas. Severidad baja: es un texto decorativo de una página pública. |
| E-09 | **En Azul noche el encabezado va un tono más profundo que la página** (`#000f1b` sobre `#011325`). | Con la paleta medida, el fondo de la página pasó a ser el azul que antes era del encabezado: sin el tono más profundo, solo los separaba la línea cian. |

**De la Parte 1:**

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| E-10 | **El marco tiene tres renglones fijos** (quién es y las acciones; el acceso actual; las vistas y el período), no el renglón único de la maqueta. | Con el texto real del acceso («Activo · acceso contextual») el renglón único se partía a 1440 px por 18 px y dejaba dos huecos. Tres renglones miden 143 px a 1440, 1280 y 1024, sin depender del largo del nombre. Se descartó decir «Las tres áreas» en lugar de nombrarlas (entraba en un renglón, pero el profesional dejaba de ver cuáles) y achicar la letra. |
| E-11 | **«Actualizar» y la hora van arriba a la derecha,** separados del acceso. | «Actualizar» vuelve a preguntar toda la ficha, no solo el acceso. Si el lugar no alcanza (tablet de pie), la hora pasa debajo del botón en vez de bajar el grupo entero. |
| E-12 | **El período es un solo control,** y «incluye hoy» sigue a la vista en el botón. | C-02. Que el día en curso esté incluido cambia cómo se lee un total: no se esconde detrás de un clic. Se descartó una lista desplegable nativa, que no admite el rango propio. |
| E-13 | **Las horas van en 24 horas en todo el website,** no solo en la ficha. | Hay un solo formateador (`lib/formato.ts`) y ninguna prueba dependía de «a. m.». Cambia también en la cuenta y en las pestañas de área. |
| E-14 | **«Solicitar contexto» pasa al marco** y sale de las acciones del Resumen. | Está a la vista en las tres vistas. Se pierde su línea de explicación («vuelve acá al enviarlo»): la pantalla de destino ya ofrece «Volver a la ficha, donde estabas». |
| E-15 | **Sustituida por E-17 y E-19 el mismo día.** Decía: en el encabezado de marca, la palabra «Apariencia» se oculta a la vista por debajo de 1360 px; quedan el sol o la luna y el tema elegido. | Con el ícono, a 1280 px el aviso de ambiente de prueba bajaba a un segundo renglón. Ni el selector suelto ni el aviso están ya en la barra. |
| E-16 | **La comprobación de píxeles de los gráficos pide 100 o, en una serie de pocos puntos, 30 por marca,** y tiene su «prueba de la prueba». | En Azul noche, dos puntos calculados unidos por una línea fina dan 89 píxeles del color de su métrica sobre la superficie más oscura (117 en el paquete anterior). El gráfico está bien dibujado. Lo que se protege no cambia, y se agregó la mutación: con las series ocultas la medición da 0 y 9 píxeles, y falla. |

**De la Parte 1 bis** (tres pedidos de Dirección del 2026-10-10, al ver la Parte 1):

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| E-17 | **Las opciones de la persona viven en un menú de la cuenta, en la esquina de la barra de marca.** Un solo botón, con el lugar del retrato, abre «Datos de la cuenta», la apariencia («Azul noche» o «Claro») y «Cerrar sesión». Sin sesión dice «Apariencia» y abre solo eso. «Cuenta» sale de la navegación del profesional, que queda con sus cuatro lugares de trabajo. | Dirección pidió sacar la apariencia de la barra, donde en una pantalla casi cuadrada sumaba un renglón, y armar el lugar donde irán las opciones que vengan; preguntó si convenía el retrato, un engranaje o un menú hamburguesa. Se eligió el retrato: es donde se busca «lo mío» y ya tiene el lugar para la imagen de perfil. Se descartó un engranaje aparte (hoy hay una sola preferencia: serían dos botones para tres opciones; cuando haya más, entran en el mismo menú) y el menú hamburguesa (esconde los cuatro lugares de trabajo, que en escritorio y en tablet entran a la vista; lo que no se ve se usa menos). Sustituye a E-15. |
| E-18 | **Las cuatro tarjetas de «Empezar por una pregunta» miden lo mismo:** las filas son iguales y cada tarjeta llena su celda. | Cada tarjeta tenía el alto de su texto, y la de descripción más corta (primera columna, segunda fila) quedaba 23 px más baja que su vecina. Se descartó recortar o alargar las descripciones para emparejarlas: el alto lo fija la más larga. |
| E-19 | **El aviso «Ambiente de prueba · solo datos sintéticos» sale de la barra de marca del website** (decisión de Dirección del 2026-10-10). Sigue en el pie de la cara pública («usá solo datos sintéticos; no ingreses datos reales de personas») y en el formulario de registro: donde alguien puede cargar datos por primera vez. | El legajo pide dos cosas, y ninguna es un aviso en cada pantalla: que en `test` solo haya datos sintéticos (08 §33) y que el despliegue identifique el ambiente (04, RNF-SEC-004), cosa que hace `APP_ENV` y que la API expone en su estado de salud (07 §26; `GET /health/live`). Se leyeron esos apartados y se buscó en el legajo una exigencia de aviso visible: no apareció. Tenerlo siempre a la vista era una convención del proyecto (WP-IDENTIDAD-VISUAL), que Dirección cambia: no hay deuda con el legajo que registrar. Sin el aviso, la barra ocupa un solo renglón también en la tablet de pie (65 px; antes 103 en dos renglones) y, en el teléfono, dos renglones en lugar de tres. **No se tocó la APK,** que conserva su franja: cambiarla pide una APK nueva y su prueba (`historial-navegacion.test.mjs`) la exige. Se actualizó el paso 1.2 de la guía de demostración, que señalaba el aviso de la barra. |
| E-20 | **«Cerrar sesión» desde el menú vuelve a «Iniciar sesión» con una carga completa de la página.** | La sesión vive en memoria: con la recarga no queda nada de la visita. Navegar sin recargar competía con la guarda de cada página, que al quedarse sin sesión manda al inicio con retorno a donde estaba. El botón de la página «Cuenta» sigue como estaba. |
| E-21 | **Un panel desplegado (el período, el menú de la cuenta) se cierra también cuando el foco sale de él.** | Abierto, tapa lo que tiene debajo: al seguir con Tab, el foco quedaba detrás del panel (WCAG 2.2, 2.4.11). No se cierra al cambiar de ventana. |
| E-22 | **Las herramientas eligen el tema por el menú, sin teclado y sin mover el foco,** y el recorrido principal suma las comprobaciones de la barra, del menú y de las tarjetas, con su «prueba de la prueba». | Cerrar el menú con Escape cerraba también el control de período abierto y dejaba el aro de foco en las capturas. Las dos mediciones nuevas se prueban con el defecto puesto a propósito: con la navegación partida la medición da dos líneas, y con las tarjetas sueltas da dos altos (101 y 78 px). En la prueba de contraste no cambió ningún par ni ningún mínimo: los dos pares del color tenue del encabezado dicen ahora que miden el borde del botón de la cuenta, porque el aviso ya no existe. |
| E-23 | **La medición de píxeles de los gráficos se hace sin los textos del gráfico** (y sin la línea de lo planificado). | En la primera pasada completa de esta parte falló la «prueba de la prueba» en Azul noche: con las series ocultas, la medición contaba 126 píxeles «del color de la métrica» en un gráfico de tres marcas (el mínimo es 90). No era un defecto de pantalla. Con la paleta de la Parte 0, el color de los textos secundarios de Azul noche (`#8dcae5`) queda a un paso del de la primera métrica (`#7cb8ff`): los bordes suavizados de las letras de los ejes entraban en la tolerancia. La medición ya estaba así desde la Parte 0 y venía pasando por poco (9 píxeles en la Parte 1). Se descartó subir el mínimo o achicar la tolerancia: lo que estaba mal era qué se medía. Las tres pasadas que miden píxeles se repitieron con datos nuevos: 17, 60 y 84. |

**De la Parte 2, primer tramo** (el lenguaje del gráfico y la composición de Analizar):

| # | Decisión | Por qué, y qué se descartó |
|---|---|---|
| E-24 | **Analizar se compone como una barra, los gráficos y la lectura.** La barra tiene tres renglones cortos: la pregunta (que es el título de la vista), las métricas elegidas —que son también la leyenda— y los modos, en controles segmentados. Debajo, dos tarjetas: los gráficos y la lectura de la fecha elegida. Con tres métricas (calorías, proteínas y peso, 90 días), la vista pasó de 2.368 a 1.093 px de alto a 1440 px de ancho, y las fechas del tercer gráfico terminan a los 887 px: los tres entran en una ventana de 900 px de alto. A 1280 px terminan justo a los 900, y a 1024, a los 957 (la barra ocupa un renglón más). | C-08. Antes eran tres columnas con la configuración siempre abierta. No se quitó ninguna función ni cambió ningún parámetro de la URL. **Límite medido:** una ventana más baja (una portátil de 1366 × 768) no llega a mostrar el tercer gráfico entero: la barra de marca, el marco de la ficha y la barra de Analizar suman unos 390 px antes del primero. |
| E-25 | **Lo que se usa de vez en cuando queda a un clic, en dos lugares.** «Más acciones» (arriba) despliega un panel con las vistas guardadas, la descarga, las capas, el intervalo con fechas y la comparación de dos períodos. El pie de los gráficos abre, debajo de ellos y de a una cosa por vez, la tabla de datos, el resumen en texto, los hitos, las etapas y «Cómo se calcula». | Son estado de la visita, no de la URL. Se descartó un menú flotante (varias de esas acciones son formularios, y un flotante con un formulario adentro se cierra solo y tapa el gráfico) y dejar cada cosa como un desplegable suelto (era la pila que hacía la página de dos pantallas y media). «Más acciones» se abre solo cuando se acaba de abrir una vista guardada, para que su aviso se vea; la comparación, cuando la URL ya trae una. |
| E-26 | **Todas las marcas son puntos; la métrica se reconoce por su color y por su nombre.** En «Separadas», el nombre va en el encabezado de su gráfico. En «Juntas» y en «Cambio relativo», además, al final de su línea, en una capa aparte del dibujo; si dos líneas terminan cerca, los nombres se separan. | C-16 y C-33; decisión de Dirección del 2026-10-09. El 10 pide que el color no sea el único medio (ver §7 de este documento): el nombre lo cumple. Se descartó la leyenda sola en el encabezado, que dejaba a las series distinguidas solo por el color. |
| E-27 | **Lo planificado y lo registrado, en el mismo gráfico: hoy, el objetivo de calorías.** Línea discontinua del mismo color, sin puntos, con un escalón por cada versión del objetivo. Está también en la lectura («Objetivo: 1.950 kcal por día»), en la tabla de datos y en el resumen en texto: lo que el gráfico dibuja se puede leer sin verlo. **No se calcula una diferencia** contra el objetivo. | C-17. El dato ya llegaba en la lectura de series y el website lo descartaba. El objetivo de los macronutrientes y el plan de entrenamiento como número no llegan (§6). La diferencia sería una resta nueva sin regla del dominio, y un subtotal no se compara con el objetivo del día. La exportación (CSV) todavía no lleva el objetivo: su formato es del dominio y tiene sus pruebas; queda anotado. |
| E-28 | **Los días sin registros de una serie diaria llevan un gris leve;** el día en curso no. La línea sigue cortada. Cuando varias métricas comparten el gráfico («Juntas», «Cambio relativo»), se sombrean los días que no tienen registros en ninguna. La muestra gris va en la cobertura del encabezado, al lado de «sin registros», solo cuando el gráfico sombrea (por día; agrupando por semana se dice la cuenta, sin muestra). | C-22. El dato (`gaps`) ya llegaba. Se usa `--grafico-hueco` con transparencia, sin colores nuevos. No se sombrea en tomas ni en sesiones: ahí lo normal es que la mayoría de los días no tenga dato. La muestra sin sombreado, por semana, la encontró la comprobación nueva y se corrigió. |
| E-29 | **Cada gráfico lleva las etapas de su área, con el rótulo arriba del dibujo y una vez por área.** Una medida corporal lleva las de las otras métricas si son todas de una misma área; con dos áreas a la vista, ninguna. El rótulo va entero si entra en el ancho de su banda («Nutrición · versión 2»), corto si es angosta («v2»), y no va si la etapa no llega a verse. | Adentro del dibujo, el rótulo quedaba tachado por la línea del objetivo y por los puntos. La regla de la medida corporal sale de las maquetas 03 y 09. En la pregunta del plan, que empieza el día de la activación, aparecía el rótulo de la versión anterior sin banda debajo. |
| E-30 | **Un cambio de protocolo, método o unidad se marca en el gráfico.** Si hay uno solo, con su motivo escrito; si hay varios, cada uno con un número, y el motivo se lee en la leyenda, debajo. | El motivo es el que escribe el dominio. Escritos, varios cortes cercanos se pisaban. En Nutrición y en Entrenamiento un tramo nuevo es solo un hueco, que ya se ve: no lleva marca. |
| E-31 | **Las líneas de los hitos se dibujan mientras su lista está abierta.** | Once líneas punteadas sin nada que dijera qué eran. Con la lista al lado, cada una tiene su fecha y su nombre. La capa «Hitos» sigue eligiéndose en «Más acciones» y viaja en la URL. |
| E-32 | **El encabezado de cada gráfico dice lo que el gráfico dibuja:** el nombre, qué es cada punto y su unidad, la muestra del objetivo y dos partes de la cobertura (cuántos tienen valor y cuántos días no tienen registros). Las fechas se escriben una vez, bajo el último gráfico; los demás conservan las marcas del eje. | La cobertura entera (subtotales, día en curso) son partes que escribe el dominio: no se reescriben; se eligen dos para el encabezado, y entera sigue en el resumen en texto y en las comparaciones. Los subtotales y el día en curso se ven como puntos huecos, con su leyenda. |
| E-33 | **Los modos se llaman «Separadas», «Juntas» y «Cambio relativo»; la agrupación, «Registro», «Día» y «Semana».** El motivo de un modo apagado se dice al costado de la barra, en una frase corta. | C-20. En la URL y en las vistas guardadas siguen `PANELS`, `OVERLAY`, `RELATIVE` y `ORIGINAL`, `DAY`, `WEEK` (E-03). |
| E-34 | **«Calorías» en lugar de «Energía»** en el catálogo de métricas del análisis y en la etiqueta de un registro en la línea de tiempo. Las métricas de Nutrición van en un solo orden: calorías, carbohidratos, grasas y proteínas. | C-28 y C-30. El objetivo sigue llamándose «requerimiento energético estimado», que es el término del legajo. **Toca una línea de la API** (la etiqueta que arma `lectura-linea-de-tiempo.ts`) y su prueba de integración, que tenía solo la comprobación negativa: ahora tiene también la positiva. No cambia ningún contrato. La pestaña Nutrición y «Mis recetas» todavía dicen «Energía» (segundo paquete; el texto de recetas lo comparte la APK). |
| E-35 | **La lectura pone el valor grande y, debajo, cómo leerlo:** la calidad, cuántos registros lo sostienen, el objetivo, lo que falta, la clase del dato como etiqueta con ícono y «Ver origen». En «Cambio relativo», el porcentaje va grande y el valor real, debajo. | Los textos son los de antes; cambió el orden. «Ir a una fecha» sigue estando: es la alternativa a elegirla sobre el gráfico (WCAG 2.5.7). |
| E-36 | **La leyenda dice solo lo que está dibujado** (puntos huecos, reportados, calculados, cortes numerados). | El objetivo y lo gris ya los nombra el encabezado de su gráfico. Un estado que no aparece no ocupa lugar. |
| E-37 | **Para mirar mientras se trabaja, se compila la versión estática; el servidor de desarrollo se descartó.** | Se probó: con las aplicaciones de Dirección abiertas quedan unos 650 MB libres y el navegador de pruebas deja de responder. `herramientas/ver.mjs` captura una ruta entera en los dos temas, con clics previos si hace falta. |
| E-38 | **Lo desplegado es del análisis que se mira.** El panel de «Más acciones» y lo que abre el pie se cierran al volver a la entrada de Analizar, a elegir otra pregunta; cambiar una métrica, el período o los datos de la pregunta no los cierra. Una región que no tiene qué mostrar no se dibuja. | Son estado de la visita (E-25) y la vista no se desarma al cambiar de análisis: la tabla abierta en una comparación libre aparecía abierta, con sus 80 filas, en la comparación de etapas siguiente (5.733 px de alto; cerrada, 1.961). Se descartó cerrarlos con cada cambio de selección: quien mira la tabla y agrega una métrica quiere seguir viéndola. |
| E-39 | **El aro de la fecha elegida va en una capa propia, alrededor de la marca.** | La biblioteca de gráficos recorta los puntos de una línea al área de dibujo, y con 90 días a la vista el último queda a 5 px del borde: en la vista de siempre (la última fecha elegida), el aro salía cortado. La marca conserva su forma y su clase. La comprobación de #154 que cuidaba que el aro no tapara la marca (CP-12) protege lo mismo midiendo que la rodea, con su prueba de la prueba (E-06). |
| E-40 | **La comparación de etapas no anida tarjetas:** la respuesta (las dos etapas y su tabla) es una tarjeta, y los gráficos y la lectura, las suyas. Lo mismo el formulario de «Cambiar los datos» de una pregunta que ya tiene gráficos. | Eran tres recuadros, uno adentro de otro. La composición propia de esa vista (C-12) queda para el tramo siguiente. |

## 5. Pruebas y evidencia

- **En la CI** (push a `wp-*`): typecheck y compilación del website; `contraste.test.cjs` con los pares de las paletas
  nuevas (4,5:1 para texto, 3:1 para bordes de control, foco y gráficos; ningún color fuera de los tokens);
  `copy-pantallas.test.cjs`, extendida a la ficha (E-05); las pruebas del dominio, con la de la familia de íconos.
- **Recorridos con navegador** (locales, fuera de la CI): `recorrido.mjs` y `recorrido-comprension.mjs` se actualizan
  parte por parte (E-06). La tabla de equivalencias queda en `EVIDENCIA/ESCRITORIO-AMABLE/ACEPTACION.md`, con lo que
  protege cada comprobación tocada.
- **Antes y después:** `herramientas/paginas.mjs` captura las 28 páginas del website en los dos temas y mide su alto.
  El «antes» es del 2026-10-10, sobre la compilación de `269d930`.
- **Accesibilidad:** axe sin violaciones en las pantallas tocadas, en los dos temas; teclado y foco; cada ícono que va
  solo tiene nombre, y el que acompaña a un texto no se lee dos veces.
- **Estados de la evidencia,** separados como siempre: implementado, verificado automáticamente, observado en una
  captura real, solo en maqueta, pendiente de prueba manual. Una maqueta sola no cierra una parte.

## 6. Fuera de alcance

| Qué | Por qué | Dónde queda |
|---|---|---|
| El alias del asesorado (C-01) | Es una decisión del legajo | DL-040, abierta |
| La clase del dato en comidas y series (C-09) | Es un dato nuevo del dominio | Para decidir |
| La línea del objetivo en los macronutrientes dentro de Analizar (C-27 y parte de C-17) | Confirmado en la Parte 2: la lectura de series trae solo el requerimiento de calorías, y la API lo manda solo con esa métrica. Pide ampliar API-PRJ-01 | Para decidir |
| El plan de entrenamiento como número junto a lo registrado (parte de C-17) | En la lectura de series el plan llega como texto, no como un valor por sesión | Para decidir |
| El objetivo de calorías en la exportación (CSV) | El formato del archivo es del dominio y tiene sus pruebas; el objetivo está en la lectura, en la tabla y en el resumen en texto (E-27) | Para decidir |
| Que los tres gráficos entren en una ventana baja (768 px de alto) | La barra de marca, el marco de la ficha y la barra de Analizar suman unos 390 px antes del primero (E-24). Pide repensar cuánto ocupa el marco, que es de todas las vistas | Para decidir, después de que Dirección use la ficha |
| Los rangos de macros por día tipo y por comida | Datos nuevos: legajo, contrato y base | Criterio §5; sin DL todavía |
| Preparar revisión (C-14, C-15) | La pantalla vive en las pestañas de Nutrición y de Entrenamiento | Segundo paquete |
| Nutrición, Entrenamiento, Antropometría, Información y la biblioteca (C-35 a C-42, C-49 a C-53, C-58 a C-81) | Son otras 15 pantallas, con dos editores de 800 a 1.000 líneas | Segundo paquete, con su propia definición |
| La estimación de cada opción en el website (C-36) | Pide ampliar una lectura de la API | Segundo paquete, si se decide |
| Unificar los 20 íconos propios de la APK | Toca pantallas validadas en el teléfono y pide una APK nueva | Otro paquete |
| Componer para 768 y 390 px | El profesional trabaja en escritorio: ahí solo no se rompe | — |

## 7. Lo que cambia en la guía de UX y la tensión con el legajo

La guía (`docs/ux/GUIA-UX-UI.md`) se ajusta en la misma parte que cambia la pantalla, y la Parte V dice qué cambió:

| Regla de hoy | Cómo queda | Parte |
|---|---|---|
| II.3: la miga «Ficha del asesorado» | Sin miga: la barra ya vuelve al Espacio profesional | 1 |
| II.4: cada observación dice «Sale de…» | La fila nombra su fuente; «Sale de…» no se repite en cada una (C-05) | 3 |
| II.1 y II.6: Analizar en «tres zonas»; «paneles sincronizados» | Las mismas tres cosas, acomodadas como barra, gráficos y lectura; los modos se llaman «Separadas», «Juntas» y «Cambio relativo» (C-08, C-20) | 2 |
| I.7: la métrica se distingue por forma y trazo | Todos puntos; la métrica, por color **y por su nombre** en el título de cada gráfico o al final de cada línea. El estado del punto (completo, subtotal, reportado, calculado) sigue yendo por la forma (C-16) | 2 |
| — | Sección nueva: la familia de íconos, sus tamaños y cuándo llevan nombre | 0 |

**Lo que pide el 10 de los gráficos** (B10-10, leído el 2026-10-10). En §1, que el color no sea el único canal. En §11,
que toda visualización tenga título, período, unidad, un equivalente en texto o en tabla, una leyenda comprensible y
«patrones además de color» para huecos y estados; y que una serie primaria y una secundaria se diferencien «no solo
por color». **No pide cuadrados ni círculos:** esa fue la manera de cumplirlo en WP-DASHBOARD-PROFESIONAL (una forma y
un trazo por métrica), y la definición de este paquete lo había atribuido al legajo por error.

Con la decisión de Dirección del 2026-10-09 (todas las marcas son puntos), la Parte 2 lo cumple así: cada métrica
lleva su nombre en el título de su gráfico o al final de su línea; lo planificado es una línea discontinua sin marcas
y lo registrado, una continua con puntos; y el estado de un punto (completo, subtotal, reportado, calculado) sigue
yendo por su forma. No hay una contradicción que registrar. Si al implementar apareciera un caso en que dos series
solo se distinguen por el color, se anota en `docs/DEUDA_LEGAJO.md` antes de seguir. **Implementado el 2026-10-10:** ese
caso no apareció. En «Juntas» y en «Cambio relativo», cada línea lleva su nombre al final, además de su color (E-26).

## 8. Estado

| # | Parte | Estado |
|---|---|---|
| — | Definición, referencia de diseño, relevamientos y capturas del «antes» | Hecho el 2026-10-10 |
| 0 | La base visual | Hecho el 2026-10-10: paletas medidas (prueba de contraste 12/12, sin tocarla), familia de íconos en el dominio (4/4) y componente del website; 28 páginas capturadas en los dos temas, con el mismo alto que antes y sin errores de página |
| 1 | El marco de la ficha | Hecho el 2026-10-10: tres renglones fijos, 143 px; la primera tarjeta pasó de 305 a 224 px a 1440 × 900. Los siete recorridos pasan sobre una base nueva (60, 70 y 17; 20, 79, 75 y 6) |
| 1 bis | La barra de marca y las tarjetas de preguntas | Hecho el 2026-10-10: la barra mide 65 px en un renglón a 1440, 1280, 1024 y 768 px (en la tablet de pie medía 103, en dos). Los siete recorridos pasan sobre una base nueva (60, 84 y 17; 20, 79, 75 y 6), con 14 comprobaciones nuevas, y la CI del commit de código está en verde. La pasada destapó un defecto de la medición de píxeles, que se corrigió (E-23) |
| 2 | Analizar | En curso. **Primer tramo hecho el 2026-10-10** (el lenguaje del gráfico y la composición; código en 780ca8d): con tres métricas a 1440 px, Analizar pasó de 2.368 a 1.093 px de alto y los tres gráficos entran en una ventana de 900 px. Los siete recorridos pasan sobre una base nueva (60, 112 y 17; 20, 79, 76 y 6), con 28 comprobaciones nuevas, y la CI del commit de código está en verde. Falta: la entrada «¿Qué querés mirar?», los estados por gráfico, «Cómo se lee esta vista», la composición propia de las etapas y del ejercicio, y el origen en el lugar de la lectura |
| 3 | Resumen | Pendiente |
| 4 | Línea de tiempo | Pendiente |
| 5 | Espacio profesional | Pendiente |
