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
| E-15 | **En el encabezado de marca, la palabra «Apariencia» se oculta a la vista por debajo de 1360 px;** quedan el sol o la luna y el tema elegido. | Con el ícono, a 1280 px el aviso de ambiente de prueba bajaba a un segundo renglón. La palabra sigue siendo el nombre del selector para el lector de pantalla. |
| E-16 | **La comprobación de píxeles de los gráficos pide 100 o, en una serie de pocos puntos, 30 por marca,** y tiene su «prueba de la prueba». | En Azul noche, dos puntos calculados unidos por una línea fina dan 89 píxeles del color de su métrica sobre la superficie más oscura (117 en el paquete anterior). El gráfico está bien dibujado. Lo que se protege no cambia, y se agregó la mutación: con las series ocultas la medición da 0 y 9 píxeles, y falla. |

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
| La línea del objetivo en los macronutrientes dentro de Analizar (C-27 y parte de C-17) | La lectura de series trae hoy solo las calorías del objetivo; se confirma al empezar la Parte 2. Si es así, pide ampliar API-PRJ-01 | Para decidir |
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
solo se distinguen por el color, se anota en `docs/DEUDA_LEGAJO.md` antes de seguir.

## 8. Estado

| # | Parte | Estado |
|---|---|---|
| — | Definición, referencia de diseño, relevamientos y capturas del «antes» | Hecho el 2026-10-10 |
| 0 | La base visual | Hecho el 2026-10-10: paletas medidas (prueba de contraste 12/12, sin tocarla), familia de íconos en el dominio (4/4) y componente del website; 28 páginas capturadas en los dos temas, con el mismo alto que antes y sin errores de página |
| 1 | El marco de la ficha | Hecho el 2026-10-10: tres renglones fijos, 143 px; la primera tarjeta pasó de 305 a 224 px a 1440 × 900. Los siete recorridos pasan sobre una base nueva (60, 70 y 17; 20, 79, 75 y 6) |
| 2 | Analizar | Pendiente |
| 3 | Resumen | Pendiente |
| 4 | Línea de tiempo | Pendiente |
| 5 | Espacio profesional | Pendiente |
