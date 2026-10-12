# WP-ESCRITORIO-AREAS · qué se comprobó en cada parte

> Definición: `docs/paquetes/WP-ESCRITORIO-AREAS.md`. Referencia de diseño: `EVIDENCIA/ESCRITORIO-AMABLE/diseno/`. Este
> documento dice qué se comprobó, cómo y qué falta. Los estados van separados: **implementado**, **verificado
> automáticamente**, **observado en una captura real**, **solo en maqueta** y **pendiente de prueba manual**. Cuando una
> pantalla se miró con una respuesta armada por el recorrido, se dice: **sobre una respuesta simulada**.

## Parte 0 · El marco del área (2026-10-11)

El encabezado de las cuatro pestañas de área (Nutrición, Entrenamiento, Antropometría e Información) pasó a ser una sola
pieza, con los tres renglones del marco de la ficha. Lo de adentro de cada sección no cambió. No se quitó ninguna
función ni cambió ningún parámetro de la URL. Sobre la base propia (`be_test_escritorio`, regenerada antes de cada
pasada) y la compilación estática del código de esta parte (`b8d556f`, el marco; y `50530f2`, el arreglo de los enlaces de vuelta de los avisos, con las comprobaciones reforzadas).

**Medido en la página real, a 1440 × 900** (asesorado A; el «antes», sobre la compilación de `b84e068`, con los mismos
datos recién generados):

| Qué | Antes | Ahora |
|---|---|---|
| El encabezado | Una miga, el título y las secciones. No decía de quién era la página, ni el acceso, ni cuándo se había consultado | El marco: 143 px en tres renglones (53 + 39 + 50), **lo mismo que el de la ficha,** en las cuatro áreas y también a 1280 y a 1024 px |
| Nutrición · Resumen | 911 px de alto | 900 px (entra en la ventana) |
| Nutrición · Registros, llegando desde la ficha | 4.042 px | 3.985 px |
| Nutrición · Plan | 2.272 px | 2.248 px |
| Entrenamiento · Registros | 1.303 px | 1.279 px |
| Antropometría · Tomas | 1.178 px | 1.154 px |
| Antropometría · En preparación | 3.020 px | 2.996 px |
| Información · Pedir información, llegando desde Entrenamiento | 2.140 px | 2.083 px |

Las páginas quedan unos 24 px más cortas, y 57 cuando se llega desde otra pantalla: el camino de vuelta ya no ocupa un
renglón propio. El alto de cada sección es el de antes: esta parte no las recompone.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| El marco de cada área dice el área (el único título de la página), de quién es, su acceso actual con las palabras de BE, «Actualizar» con la hora de la consulta y las secciones, cada una con su ícono y su dirección de siempre; no hay miga (F-01) | `recorrido.mjs funcional`, comprobaciones del marco (solas, con `recorrido.mjs areas`). La persona y el acceso se calculan a mano con los vínculos que da la API | Pasa en las cuatro: «Nutrición: Activo · acceso contextual»; en Información, «Nutrición, Entrenamiento y Antropometría: Activo · acceso contextual» | Verificado automáticamente |
| El marco mide lo mismo que el de la ficha, renglón por renglón, en las cuatro áreas (F-06) | Lo mismo, midiendo los dos en la página | 143 px (53 + 39 + 50) en la ficha y en las cuatro | Verificado automáticamente |
| A 1280 y a 1024 px, el marco de Antropometría y el de Información (los de textos más largos) conservan sus tres renglones: nada baja de renglón ni desborda | Lo mismo, cambiando el ancho de la ventana | 143 px en los cuatro casos | Verificado automáticamente |
| La sección arranca en la misma vertical que el marco y conserva el ancho para el que se hizo (F-10) | Lo mismo | De 32 a 1.184 px (1.152 de ancho) en las cuatro | Verificado automáticamente |
| Sin haber llegado desde la ficha, el camino de vuelta dice «Volver a la ficha» y lleva a la ficha de esa persona; reemplaza a la miga (F-07) | Lo mismo. La misma consulta que no encuentra la miga en las cuatro áreas la encuentra en «Plantillas y habituales» | Pasa | Verificado automáticamente |
| Llegando desde la ficha, dice «Volver a la ficha, donde estabas», las cuatro secciones conservan el retorno y lleva a esa vista de la ficha, con su métrica (F-07) | Lo mismo, entrando con un `volver` a Analizar con una métrica, y usando el enlace | Pasa: vuelve a `vista=analizar` con `m=nutricion.energia` | Verificado automáticamente |
| Llegando a «Pedir información» desde Entrenamiento, dice «Volver a Entrenamiento» y lleva ahí (F-07) | Lo mismo | Pasa | Verificado automáticamente |
| `vista=ejecuciones` y `vista=preparacion` siguen abriendo lo suyo; se leen «Registros» y «Tomas»; ninguna sección dice «Ejecuciones» ni «Evaluaciones» (C-58, C-65, F-03) | Lo mismo. La sección que abre `vista=ejecuciones` no es el Resumen: empieza con otro título | Pasa | Verificado automáticamente |
| «Actualizar» vuelve a pedir todo lo que la sección leyó al entrar, una vez cada lectura, con los vínculos; la hora es la de esa consulta (F-08) | Lo mismo, comparando la lista de pedidos al entrar y al actualizar | Pasa: 5 lecturas al entrar a Nutrición · Resumen, las mismas 5 al actualizar | Verificado automáticamente |
| Con algo escrito sin guardar, «Actualizar» pregunta antes: dice qué se pierde y no lee nada; «Seguir editando» deja lo escrito; «Actualizar y descartar» vuelve a leer (F-08) | Lo mismo, escribiendo en la interpretación de una revisión de Nutrición, sin registrarla | Pasa. Sin nada escrito, con la misma consulta, no pregunta (la comprobación anterior) | Verificado automáticamente |
| Los otros ocho formularios avisan lo escrito sin guardar: los dos editores de plan, la revisión de Entrenamiento, la estimación de una comida, el pedido de información, la toma en preparación, corregir o anular una medición y el fundamento de un resultado | Leyendo el código: cada uno llama a `useCambiosSinGuardar` con su condición | Implementado; con comprobación en pantalla, solo la revisión de Nutrición | Implementado |
| Una falla de la lectura de una sección se dice en su lugar, con el motivo y «Reintentar»; el marco sigue diciendo el acceso del vínculo y no pregunta nada más (C-43, F-11) | Lo mismo, con un 503 simulado en el navegador | Pasa: «No pudimos cargar esta vista · BE no está disponible en este momento. Reintentá en unos minutos.» | Verificado automáticamente, sobre una respuesta simulada |
| Si las lecturas de la sección responden «no disponible», la sección dice el texto neutral y el marco pregunta una sola vez qué deja leer el resumen del asesorado; como el área se puede leer, sigue diciendo el acceso del vínculo (F-09) | Lo mismo, con un 404 simulado en las cuatro lecturas de Nutrición · Resumen | Pasa: una pregunta al resumen del asesorado | Verificado automáticamente, sobre una respuesta simulada |
| Si además el resumen dice que el área ya no se puede leer, el marco dice «Acceso no disponible» y deja de decir «Activo»; el de otra área sigue con el suyo. No dice quién lo retiró ni por qué (F-09) | Lo mismo, entregando el resumen real con Nutrición marcada como no disponible | Pasa | Verificado automáticamente, sobre una respuesta simulada |
| Cuando las lecturas vuelven a responder, «Actualizar» trae la sección y el acceso del vínculo (F-09) | Lo mismo, quitando las respuestas simuladas | Pasa | Verificado automáticamente |
| Después de una revocación real, el marco de Antropometría dice «Consentimiento revocado» y «Acceso no disponible», no «Activo», y su sección, el texto neutral; el de un área que sigue con acceso dice «Activo · acceso contextual» (F-09) | `recorrido.mjs descartable`: el asesorado revoca desde su web, y se abre la pestaña con respuestas reales de la API | Pasa | Verificado automáticamente |
| Si no se puede leer la cuenta, la página conserva el título del área y el camino de vuelta, y la falla va en el lugar de la sección; «Reintentar» trae el marco entero (F-01) | `recorrido.mjs areas`, con un 503 simulado | Pasa | Verificado automáticamente, sobre una respuesta simulada |
| Con el teclado, después del título se llega a «Actualizar» y después a las cuatro secciones, en su orden; axe no encuentra faltas | Lo mismo | Pasa | Verificado automáticamente |
| «Volver a la ficha, donde estabas», en el aviso de una revisión registrada o de una solicitud enviada, vuelve sin cargar la página de nuevo (la sesión vive en memoria: recargar la corta) | `scripts/enlaces-del-website.test.cjs`, en la batería: recorre el JSX del website y no admite un enlace interno que no sea de la aplicación. Y CP-20, que ahora usa el enlace del aviso | 2 de 2; antes del arreglo falló nombrando los tres enlaces. CP-20 pasa sobre la compilación corregida | Verificado automáticamente |
| La ficha sigue diciendo el acceso por área como antes (la regla salió a una pieza compartida) | Los recorridos de la ficha y los de la revocación, que ya lo miraban | Pasa: las del acceso por área de la ficha y las de la revocación (PRO-20, CP-23 y E-89), dentro de la pasada | Verificado automáticamente |
| El resto del website sigue funcionando | Los siete recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 240 de 240 (las 219 de antes y 21 nuevas), descartable 22 de 22 (las 21 de antes y una nueva). `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, revocación 6 de 6 y funcional 85 de 86. La que falló mostró un defecto de antes (ver abajo), que se corrigió en `50530f2`; sobre esa compilación, funcional 86 de 86 y las del marco 21 de 21. Pasada del 2026-10-11, de 20:23 a 20:55, sobre `b8d556f` con las comprobaciones reforzadas, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). Los otros cinco recorridos no se repitieron sobre la compilación corregida, que cambia solo el enlace de tres avisos | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre los commits de código | En verde las dos corridas (38182758939 sobre `b8d556f` y 38186931800 sobre `50530f2`): el legajo, la batería completa (typecheck; dominio, 617; guiones, 346, con las dos pruebas nuevas; API, 81), la integración (669) y la imagen de la API | Verificado automáticamente |
| El marco en las cuatro áreas a 1440 px, y en tres de ellas a 1280 y a 1024, en los dos temas; llegando desde la ficha y desde Entrenamiento | `ver.mjs`, sobre datos recién generados | 28 capturas de ahora (`parte-0/ahora/`), las 8 de antes a 1440 px en Claro (`parte-0/antes/`) y `parte-0/marco-antes-y-ahora.png` | Observado en una captura real |
| El marco con un área revocada | `recorrido.mjs descartable` | `parte-0/area-despues-de-revocar-1440-claro.png` | Observado en una captura real |

**Comprobaciones que cambiaron, y lo que protegen (E-06 del primer paquete):**

| Comprobación | Antes | Ahora | Qué protege |
|---|---|---|---|
| R3 (`recorrido-comprension.mjs`): «Solicitar contexto» abre el flujo de formularios con su retorno | Buscaba «Volver a la ficha» en toda la página | Exige «Volver a la ficha, donde estabas» en el camino de vuelta del marco, que solo lo escribe con un `volver` válido | Que desde la ficha se llegue con el retorno a donde se estaba. Con el marco, «Volver a la ficha» está siempre: la versión de antes ya no podía fallar |
| CP-20: registrar la revisión avisa, con la vuelta a la ficha | Buscaba «Volver a la ficha» en toda la página y tocaba el primer enlace que lo dijera | Lo busca dentro del aviso de la revisión, y toca ese enlace | Que el aviso de la revisión ofrezca la vuelta, y que funcione. Por lo mismo: de la otra forma pasaba siempre |
| CP-21 y la captura «nutricion-volver-a-la-ficha» | Tocaban `.retorno-a-la-ficha a` | Sin cambios: el marco conserva la clase y las palabras | Que se vuelva a la ficha con la configuración (lo comparan después, parámetro por parámetro) |
| Las del marco, nuevas: 20 y una medición, y una en `descartable` | — | Lo de la tabla de arriba | Las decisiones de esta parte (F-06 a F-13) |

Las comprobaciones negativas nuevas van con una positiva de la misma consulta: «no hay miga» (la miga de «Plantillas y
habituales»), «no pregunta» (la pregunta, con algo escrito), «no dice Activo» (el marco de Entrenamiento, que lo dice),
«no pregunta al resumen» ante una falla (la pregunta única ante un «no disponible»).

**La prueba de la prueba.** El marco se rompió a propósito y se compiló así, en dos tandas (algunas roturas tapan a
otras: en cada tanda, cada rotura tiene al menos una comprobación que solo ella puede hacer fallar).

- **Primera tanda, 15 roturas en una misma compilación** (`resultados/compilacion-rota-tanda-A.txt`). En `recorrido.mjs areas` fallaron 17 de las 20 comprobaciones; pasaron la del teclado y la de errores de página, que ninguna rotura de la tanda tocaba, **y la de la cuenta que no se pudo leer, que tenía que fallar.** En `recorrido.mjs descartable` falló la de la revocación real, y solo esa (21 de 22). Catorce roturas quedaron detectadas.
- **La que no se detectó mostró una comprobación floja.** La rotura escondía el camino de vuelta cuando no se puede leer la cuenta; la comprobación leía el texto del enlace, que se lee igual aunque el enlace no se dibuje. Ahora las comprobaciones del marco leen solo lo que está a la vista: el camino de vuelta, la persona, el acceso, la hora, «Actualizar» y las secciones.
- **Segunda tanda, 6 roturas** (cinco nuevas y esa, repetida; `resultados/compilacion-rota-tanda-B.txt`). Fallaron las seis comprobaciones que tenían que fallar y pasaron las otras catorce.
- En total, 20 roturas distintas, cada una con la comprobación que la detecta: lo escrito sin guardar que no se anota, «Actualizar» que no vuelve a leer, una falla mostrada como «no disponible», el marco que no vuelve a preguntar el acceso o que no usa la respuesta, un vínculo revocado que no se muestra, el marco 8 px más alto que el de la ficha, la sección estirada, una dirección de siempre que deja de abrir lo suyo, y las demás. Están una por una en esos dos archivos.

**Lo que encontraron las comprobaciones y las capturas, y qué se hizo.**

- **La primera corrida de las comprobaciones nuevas dio 12 de 21, y la pantalla estaba bien.** Lo esperado estaba
  escrito con valores que la API no usa: el estado de un vínculo vigente es `ACEPTADO` (no «ACTIVO»), y un área que el
  resumen no deja leer es `{ available: false, reason: … }`, sin los demás campos, así que la respuesta simulada no
  cumplía el contrato y la pantalla, con razón, la descartaba. Se corrigieron las comprobaciones, mirando el contrato.
- **La primera captura mostró la página entera dentro de una tarjeta blanca.** El envoltorio del marco se llamaba
  `.area`, que ya era la tarjeta de un área del Resumen. Se renombró (`.seccion-del-area`) antes de seguir.
- **Dos comprobaciones de antes habían dejado de poder fallar** (R3 y CP-20, arriba). No lo mostró ninguna corrida: se
  buscó, al cambiar la pantalla, qué comprobaciones miraban el texto que ahora está siempre.
- **«Ver ejecuciones» seguía en el resumen de Entrenamiento:** la búsqueda del nombre viejo se había hecho con
  mayúscula. Ahora dice «Ver registros».
- **La pasada completa encontró un defecto de antes, gracias a una comprobación corregida.** `recorrido-comprension.mjs funcional` dio 85 de 86. Después de registrar una revisión, el aviso ofrece «Volver a la ficha, donde estabas», y ese enlace cargaba la página de nuevo. La sesión vive solo en la memoria de la pestaña: el profesional quedaba frente a «Iniciar sesión». CP-20 decía comprobar esa vuelta y tocaba otro enlace con las mismas palabras, el de arriba de la página; al hacerla tocar el del aviso, falló. Eran tres avisos (la revisión de Nutrición, la de Entrenamiento y la solicitud de información enviada), los tres de #154. Ahora son enlaces de la aplicación, y una prueba nueva recorre el website y no deja pasar un enlace interno que recargue la página. Severidad media: no se perdía ningún dato (la revisión ya estaba registrada), pero la acción que la pantalla ofrecía cortaba la sesión.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección entre a un área desde la ficha y desde un pendiente, y use «Actualizar» con un plan
  a medio editar.
- «Actualizar» con algo escrito, en los otros ocho formularios: está implementado y solo el de la revisión de Nutrición
  tiene comprobación en pantalla. En la toma en preparación la marca es más gruesa (cualquier campo que se toca desde
  la última lectura), y quitar una fila sin escribir nada no la activa.
- La ayuda de cada vista («Cómo se lee esta vista»): el marco tiene su lugar, y ninguna sección tiene todavía la suya.
  Se suma con cada parte.
- Un vínculo pausado o finalizado en el marco: el escenario no los tiene en el asesorado A. Las palabras son las de
  `estadoParaMostrar`, que tiene sus pruebas en el dominio.
- 768 y 390 px: el marco usa las reglas del de la ficha (lo que no entra, baja); sin comprobaciones propias.
- Lector de pantalla con una persona: pendiente, como en los paquetes anteriores. Se verificaron axe, el título único,
  el nombre de la navegación de secciones y el orden del teclado.

## Parte 1 · Nutrición · Registros (2026-10-12)

La sección Registros de Nutrición pasó de una tabla por día, todas a la vista, a la lectura de la maqueta 20: **el día
es la unidad.** No se quitó ninguna función: la estimación del profesional sobre una comida diferente se agrega ahora
desde el detalle de ese registro, y la lista «Fuera del plan» que había al pie de cada día desapareció porque la comida
diferente ya se lee en la comida donde se registró. `vista=registros` sigue abriendo la sección; se suman cuatro
parámetros que antes no existían (`p`, `desde` y `hasta`, `ver` y `registro`). Sobre la base propia
(`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de esta parte
(`4c92c65`, la pantalla; y `ea85eb9`, la tabla del registro sin rayas y dos comprobaciones más).

**Medido en la página real** (asesorado A, el período de entrada, de siete días; el «antes», sobre la compilación de
`7aec95d`, con datos recién generados):

| Ancho de la ventana | Antes | Ahora |
|---|---|---|
| 1440 px | 3.985 px de alto: 4,4 pantallas de 900 | 1.073 px: 1,2 pantallas |
| 1280 px | 3.985 px | 1.073 px |
| 1024 px | 4.034 px | 1.198 px |

A 1440 × 900, en la primera pantalla entran las vistas, los nombres de las columnas y, entero, el día abierto (el que
tiene algo distinto). **La semana completa no entra:** el último día termina a los 1.009 px. Con 30 días, 1.502 px (se
ven 14 días y un botón trae los anteriores); con 90, 1.536 px.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Al entrar, Registros hace dos lecturas: el contexto de revisión, sin período (lo propone la API), y las comidas de la línea de tiempo de ese mismo período; el control dice el período (F-15) | `recorrido.mjs funcional`, comprobaciones de Registros (solas, con `recorrido.mjs registros`). Lo esperado se calcula a mano con lo que devuelven esas dos lecturas: no se usa el módulo que arma la pantalla | Pasa: una lectura de cada una; «Período: 6 oct – 12 oct 2026 · 7 días · incluye hoy» | Verificado automáticamente |
| Están todos los días, del más nuevo al más viejo, cada uno en un renglón con su cuenta («N de M comidas registradas», o «Sin registro»); los nombres de las columnas, una vez (C-49) | Lo mismo | Pasa en los 7 días | Verificado automáticamente |
| Arrancan abiertos los días con una comida diferente o con algo distinto de lo indicado, y solo esos (F-20) | Lo mismo | Pasa: uno de siete | Verificado automáticamente |
| Las cinco vistas, en su orden, cada una con la cantidad de comidas que trae; registradas, con comida diferente y sin registro suman «Todas las comidas» (F-16) | Lo mismo, contando a mano sobre las dos respuestas | Pasa: 28, 0, 0, 1 y 4 (23 registradas + 1 con comida diferente + 4 sin registro) | Verificado automáticamente |
| Cada comida del plan es una fila, en el orden del plan, con lo registrado, cómo se informaron las cantidades y la diferencia observada, con las palabras del dominio; una fila sin registro no abre nada (C-53) | Lo mismo, fila por fila, con el rótulo que oye el lector de pantalla | Pasa: 28 filas | Verificado automáticamente |
| Una comida diferente se lee en la comida donde se registró, con los dos hechos, y no cuenta como registrada (C-50) | Lo mismo | Pasa: «Cena · Sin opción del plan registrada · Comida diferente: «Milanesa con ensalada en un cumpleaños», Un plato» | Verificado automáticamente |
| Con las porciones del plan confirmadas la fila dice «Sin diferencia: son las porciones del plan» y nada más: ni una raya, ni las restas en cero que manda la API (C-51, F-21) | Lo mismo | Pasa: 23 filas; la API manda 57 restas en cero en el período, y ninguna se muestra | Verificado automáticamente |
| En el registro, la tabla de ingredientes dice la diferencia de cada uno con la resta o con palabras («sin diferencia», «igual», «no se resta»), sin rayas (C-51) | Lo mismo, en dos registros: uno con las porciones del plan y uno con cantidades informadas; lo esperado, a mano, con el registro que da la API | Pasa. Antes del arreglo falló: «— | —» | Verificado automáticamente |
| Elegir una vista no le pide nada a la API, queda en la dirección y deja a la vista las filas que cuenta; volver a tocarla deja «Todas» (F-16) | Lo mismo, con «Sin registro» | Pasa: 4 filas, 0 pedidos | Verificado automáticamente |
| Una vista en cero se muestra con su cero y, elegida, dice que ninguna comida coincide y cuántas hay (F-16) | Lo mismo | Pasa | Verificado automáticamente |
| Un día sin plan vigente lo dice con su frase y no se abre; la pantalla dice cuántos días son, y no entran en ninguna cantidad (F-16) | Lo mismo, con 90 días | Pasa: 6 días sin plan vigente. Un día sin día tipo determinado: el escenario no tiene; sus reglas tienen pruebas en el dominio | Verificado automáticamente |
| Tocar una fila abre su registro al costado, sin tapar la lista: el título recibe el foco, el registro se lee una vez y queda en la dirección; Escape lo cierra y el foco vuelve a la fila (F-18) | Lo mismo | Pasa | Verificado automáticamente |
| El registro de una comida con cantidades informadas dice «Informó lo que comió de cada ingrediente», con las columnas «Indicado», «Registrado» y «Diferencia» (C-53) | Lo mismo, abriéndolo por su dirección, con 90 días | Pasa: «Cena · Salmón con papa» | Verificado automáticamente |
| «Actualizar» con un registro abierto lo deja abierto al costado, sin pasar por el panel de encima ni por un instante (F-17, F-18) | Lo mismo, con un vigía puesto antes de tocar «Actualizar» | Pasa: 0 veces. Antes del arreglo falló: 2 veces (ver abajo) | Verificado automáticamente |
| A 1024 px el registro se abre encima, en un panel que retiene el foco; la página no desborda de costado (F-18) | Lo mismo | Pasa | Verificado automáticamente |
| El período elegido va en la dirección: las dos lecturas piden esos días y las cantidades son las de ese período; «Actualizar» conserva el período y la vista (F-17) | Lo mismo, con `p=30` | Pasa: 120 comidas en 30 días | Verificado automáticamente |
| El control de período ofrece 7, 30 y 90 días (no «1 año»); un rango propio de 100 días no sale y dice el tope; uno de 11 días queda en la dirección con sus dos fechas (F-17) | Lo mismo, usando el control | Pasa: «El período puede tener hasta 92 días.» | Verificado automáticamente |
| Con 30 días se muestran catorce y «Ver días anteriores» trae otros catorce sin pedirle nada a la API (F-19) | Lo mismo | Pasa | Verificado automáticamente |
| Con 90 días, la línea de tiempo se lee entera, de a 50; los días enteros sin registros dicen «Sin registro» y ninguno dice «0 de» (F-15, F-16) | Lo mismo | Pasa: 285 registros en 6 páginas; 338 comidas, 3 distintas, 3 sin confirmar, 4 con comida diferente y 55 sin registro | Verificado automáticamente |
| Si la línea de tiempo no se puede leer, los días y sus comidas siguen a la vista; un bloque dice el motivo, con «Reintentar»; las dos vistas que dependen de ella no llevan número; «Reintentar» trae lo que faltaba (F-15) | Lo mismo, con un 503 simulado en el navegador | Pasa: «No pudimos traer la opción ni las cantidades de cada registro» | Verificado automáticamente, sobre una respuesta simulada |
| En la primera pantalla, a 1440 × 900, entran las vistas, los nombres de las columnas y el día abierto, entero (F-20) | Lo mismo, midiendo en la página | Pasa: el día abierto termina a los 744 px | Verificado automáticamente |
| Registros tiene su ayuda en el marco, con cada marca y las cinco vistas; las otras secciones de Nutrición, que no tienen ayuda, no muestran el botón (F-14, F-23) | Lo mismo | Pasa | Verificado automáticamente |
| axe no encuentra faltas con todos los días abiertos, con un registro al costado ni con la ayuda abierta | Lo mismo | Pasa | Verificado automáticamente |
| **La estimación del profesional, desde el registro de una comida diferente:** el registro se abre por su dirección y ofrece «Agregar estimación»; sin describir nada, o con una cantidad que no es un número, no sale y marca el campo; con algo escrito, «Actualizar» pregunta antes; si guardar falla, lo dice y no se pierde lo escrito; al guardar, la API recibe un solo pedido y la estimación queda en la historia, con la descripción original intacta; después, «Actualizar» ya no pregunta (C-50, F-08, F-18) | `recorrido.mjs estimacion`: **escribe de verdad** en el escenario, por eso corre solo y último. Lo esperado sale de lo que devuelve la API antes y después de guardar | Pasa, 7 de 7: «Milanesa de carne al horno con ensalada · 250 g (Profesional, 12 oct 2026…)». La falla al guardar es un 503 simulado | Verificado automáticamente (la falla, sobre una respuesta simulada) |
| Las reglas del cálculo: las filas y sus estados, las cinco vistas y sus cantidades, el renglón del día, qué días arrancan abiertos, las palabras de una comida | `packages/domain/src/registros-de-nutricion.test.ts`, en la batería | 19 de 19 | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 265 de 265 (las 240 de antes y 25 nuevas: 24 comprobaciones y una medición), descartable 22 de 22 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 03:31 a 04:07, sobre `ea85eb9`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-1/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre los commits de código | En verde las dos corridas (38211001402 sobre `4c92c65` y 38212908176 sobre `ea85eb9`): el legajo, la batería completa (typecheck; dominio, 636, con las 19 nuevas; guiones, 346; API, 81), la integración (669) y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440 px en sus estados (la semana, 30 y 90 días, las vistas, un registro abierto, una comida diferente, el formulario de la estimación, la ayuda y la falla de la segunda lectura) y a 1280 y 1024 px, en los dos temas | `ver.mjs`, sobre datos recién generados | 32 capturas de ahora (`parte-1/ahora/`), las 6 de antes (`parte-1/antes/`) y `parte-1/registros-antes-y-ahora.png`. La captura de la falla es sobre una respuesta simulada | Observado en una captura real |

**El guion de antes, y lo que protegía (E-06 del primer paquete).** `recorrido-web-registros.mjs`, de
WP-NUTRICION-RECETAS, miraba esta pantalla buscando sus botones «Ver registro». Ya no corre contra la pantalla de hoy:
queda como constancia de la corrida de su paquete, y lo dice en su cabecera.

| Lo que protegía | Dónde se mira ahora |
|---|---|
| Cada comida registrada y cada comida diferente abren su registro | Cada fila con registro es un botón que lo abre (C-53 y F-18) |
| El registro con cantidades informadas dice cómo se registraron y la estimación de lo consumido | La comprobación del registro con cantidades informadas (C-53) |
| La comida diferente dice «Macros sin calcular» y su cantidad aproximada | La primera comprobación de `estimacion`, y la fila de la comida diferente (C-50) |
| Una comida diferente sin descripción dice «Sin descripción», sin comillas vacías | **No se mira:** el escenario de este recorrido no tiene ninguna. La fila usa el mismo texto del dominio |
| El profesional ve las fotos privadas del registro | **No se mira:** el escenario no tiene fotos. La pieza que las muestra no cambió |
| El website a 390 px (recetas y plan) | No es de esta pantalla: sigue en aquel guion |

Las comprobaciones negativas van con una positiva de la misma consulta: «no abre nada» (una fila con registro, que es
un botón), «no muestra el botón de ayuda» en Resumen (lo muestra en Registros), «no pregunta» después de guardar
(pregunta con algo escrito), «el panel de encima no se abre» a 1440 (se abre a 1024).

**La prueba de la prueba.**

- **El cálculo, roto de a una regla** (`resultados/calculo-roto-de-a-una-regla.txt`): 38 roturas del módulo del dominio,
  cada una contra sus pruebas. **La primera vez se notaron 32.** Las seis que no mostraron seis huecos: las cantidades
  informadas sin el resultado de la API, la comida diferente cuando la línea de tiempo no llegó, el orden de los rasgos
  de una fila, el singular («1 de 1 comida registrada») y que «sin confirmar» no abre el día. Se sumaron esas pruebas:
  38 de 38.
- **La pantalla, rota y compilada así, en tres tandas.** Primera (`compilacion-rota-tanda-A.txt`): 18 roturas del
  website, cada una con una comprobación que solo ella puede hacer fallar; fallaron esas 18 y ninguna otra. Segunda
  (`compilacion-rota-tanda-B.txt`): 9 roturas más del website —las de la estimación y el defecto del panel, puesto de
  nuevo—; se notaron las 9. **En esa tanda iban además dos roturas del cálculo, que no se notaron porque no llegaron a
  la compilación:** la herramienta las aplicaba sobre el dominio ya compilado, y compilar el website vuelve a compilar
  el dominio desde su fuente. Se corrigió la herramienta y fueron en una tercera tanda (`compilacion-rota-tanda-C.txt`),
  sobre la fuente: se notaron las dos, cada una en su grupo de comprobaciones (seis en total), y ninguna otra falló.
  Que el recorrido note una rotura del cálculo muestra que lo que espera no sale del módulo que arma la pantalla.
- En total, 29 roturas de la pantalla y 38 del cálculo, cada una con la comprobación que la detecta.

**Lo que encontraron las comprobaciones y las capturas, y qué se hizo.**

- **La primera captura midió 3.090 px: todos los días abiertos, y cada fila con una lista de «0 g».** El contraste trae
  una resta por cada ítem comparable también cuando da cero: así llegan las porciones del plan confirmadas. Ahora una
  resta en cero no es una diferencia (F-21), con su prueba, su comprobación en pantalla y su rotura.
- **La primera corrida de las comprobaciones dio 10 de 13, y la pantalla estaba bien.** Eran del instrumento: las
  etiquetas de una fila salen de todos sus registros; en 30 días el escenario no tiene un día entero sin registros (se
  mira con 90); y una espera estaba puesta en la sección equivocada.
- **Una raya en la tabla del registro.** La lista ya no tenía rayas, pero la tabla de ingredientes del detalle seguía
  diciendo «—» en «Diferencia», que es lo que C-51 pedía sacar. La mostró una captura, no una comprobación. Ahora cada
  celda dice la resta o por qué no hay una, con una función del dominio; la usa también la ficha, que abre el mismo
  registro.
- **Dos palabras que BE no dice.** La ayuda y una frase del dominio decían «incumplimiento» y «cumplimiento». Las frenó
  la prueba de palabras de la batería antes del commit.
- **Un dato repetido:** la porción que describió la persona figuraba en su registro y otra vez junto a la estimación.
- **La estimación se había mudado sin ninguna comprobación,** y el guion que la miraba ya no podía correr. Se escribió
  el modo `estimacion`, que guarda de verdad.
- **Ese modo encontró un defecto de antes.** Su primera corrida entera decía que «Actualizar» preguntaba después de
  guardar. No preguntaba: lo que se abría era el panel de encima, por un instante. Al montarse con un detalle ya abierto
  (por la dirección, o al tocar «Actualizar»), en una ventana ancha, la pantalla suponía que el detalle no entraba al
  costado hasta preguntarle a la ventana, y lo abría encima antes de pasarlo. Es de una pieza del primer paquete
  (`useDetalleAlCostado`), que usan también la línea de tiempo y Analizar de la ficha. Ahora lee la ventana desde el
  primer dibujo. Tiene su comprobación (un vigía: 2 veces antes del arreglo, 0 después) y su rotura. Severidad baja: un
  parpadeo, sin ningún dato en juego.
- **Dos huecos de las comprobaciones, vistos al escribir las roturas:** nadie miraba que la línea de tiempo se pidiera
  con el período elegido, ni nadie usaba el control de período (se entraba por la dirección). Se sumaron las dos.
- **La primera corrida de `estimacion` dio 3 de 7** por el instrumento: no borraba un campo antes de escribir.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección mire una semana de registros, abra uno y agregue una estimación.
- Las fotos de un registro, una comida diferente sin descripción y un día sin día tipo determinado: el escenario no los
  tiene (arriba).
- La estimación con un alimento del catálogo (el buscador de adentro del formulario): no se usa en el recorrido.
- Un período con más de 500 registros, que es cuando la pantalla avisa que no los leyó todos: el escenario tiene 285
  en 90 días.
- Que la semana entre entera en la primera pantalla: no entra (termina a los 1.009 px), y se dice arriba.
- 768 y 390 px: por debajo de 960 px cada fila apila sus datos; sin comprobaciones ni capturas propias.
- Lector de pantalla con una persona: pendiente. Se verificaron axe, el rótulo de cada dato de la fila, el foco al abrir
  y al cerrar un registro, y Escape.

**Para decidir, sin urgencia.** En esta pantalla conviven «lo indicado» (el título, las columnas, la ayuda) y una frase
heredada del registro que dice «la comida prescripta» («…no reemplaza la comida prescripta»). Es la palabra del legajo;
«indicado» es la que validó Dirección en las maquetas (C-53). No se tocó: es un texto del dominio que también muestra
la ficha.

## Parte 2 · Entrenamiento · Registros (2026-10-12)

La sección Registros de Entrenamiento pasó de una tarjeta por sesión —con «Ver detalle», que desplegaba debajo una
tabla de seis columnas, un gráfico, lo planificado y el registro original— a la lectura de la maqueta 25: **una fila
por sesión, y el detalle al costado, con cada serie una sola vez.** No se quitó ninguna función: los descansos y la
duración de cada serie, la sesión tal como estaba en el plan de ese día, el gráfico por serie y el registro original
con sus correcciones siguen en el detalle, cada uno a un clic. La evolución de un ejercicio, que estaba repetida en un
bloque «Planificado y registrado», queda en Analizar, con un enlace que lleva. `vista=ejecuciones` sigue abriendo la
sección; se suman los parámetros `p`, `desde` y `hasta`, `ver`, `version`, `ejercicio` y `sesion`. Sobre la base
propia (`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de esta parte:
`9c823ac` (la pantalla), `01fb07b` (la franja de la tabla, que también era de Nutrición), `83f0b63`, `afc7d59` y
`e565a00` (tres ajustes a 1280 px que mostraron las capturas).

**Medido en la página real** (asesorado A; el «antes», sobre la compilación de la parte 1, con datos recién generados):

| Ancho de la ventana | Antes, al entrar | Antes, con una sesión abierta | Ahora, al entrar | Ahora, con una sesión abierta |
|---|---|---|---|---|
| 1440 px | 1.185 px | 3.996 px: 4,4 pantallas de 900 | Entra en una pantalla | 1.343 px: 1,5 pantallas |
| 1280 px | 1.185 px | 3.996 px | Entra en una pantalla | 1.344 px |
| 1024 px | 1.185 px | 4.218 px | Entra en una pantalla | Entra en una pantalla: el detalle se abre encima, en un panel |

Es el período de entrada, de siete días, con dos sesiones. Con 90 días hay 25 sesiones: se muestran quince y un botón
trae las demás; la página mide 1.584 px a 1440 y, con una sesión abierta, 1.612 (2.043 a 1280; 1.668 a 1024). El
detalle queda fijo al costado mientras se baja por la lista, y tiene su propio desplazamiento. **Las alturas «con una
sesión abierta» son con el detalle desplegado entero** (la herramienta agranda la ventana para capturarlo): una sesión
de diez series no entra en una pantalla de 900 px.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Al entrar, Registros lee el contexto de revisión, sin período (lo propone la API), y una vez el plan de cada versión que aparece en el período; el control dice el período (F-24) | `recorrido.mjs funcional`, comprobaciones de Registros de Entrenamiento (solas, con `recorrido.mjs sesiones`). Lo esperado se calcula a mano con lo que devuelven esas lecturas: no se usa el módulo que arma la pantalla | Pasa: una lectura del contexto y una por versión; «Período: 6 oct – 12 oct 2026 · 7 días · incluye hoy» | Verificado automáticamente |
| Cada sesión registrada es una fila, de la más nueva a la más vieja: la sesión con su condición (la del registro que rige), cuántas series se registraron y cómo quedaron frente a lo indicado; los nombres de las columnas, una vez; la fila entera es un botón (C-68) | Lo mismo, fila por fila, con 90 días | Pasa en las 25 sesiones | Verificado automáticamente |
| Un período largo se muestra de a quince sesiones; «Ver sesiones anteriores» trae las demás sin pedirle nada a la API (F-31) | Lo mismo | Pasa: 15 al entrar, 25 después, 0 pedidos | Verificado automáticamente |
| Una sesión registrada como no realizada no se cuenta serie por serie: dice por qué no tiene series, y ninguna fila dice «0 de»; una serie sin registrar se cuenta aparte y no es una diferencia (F-25) | Lo mismo | Pasa: una no realizada («Sin series: la sesión se registró así») y cuatro con series sin registrar. **Resumidas, ninguna:** el escenario no tiene; su regla tiene pruebas en el dominio | Verificado automáticamente |
| Las cuatro vistas, en su orden, cada una con la cantidad de sesiones que trae; «Con diferencias» cuenta las que tienen alguna serie con las repeticiones o el RIR fuera de lo indicado, y la carga no cuenta (F-26) | Lo mismo, contando a mano | Pasa: 25, 24, 2 y 4 | Verificado automáticamente |
| Elegir una vista no le pide nada a la API, queda en la dirección y deja a la vista las sesiones que cuenta; volver a tocarla deja «Todas las sesiones» (F-26) | Lo mismo, con «Con series sin registrar» | Pasa: 4 filas, 0 pedidos | Verificado automáticamente |
| Tocar una sesión abre su detalle al costado, sin tapar la lista: el título recibe el foco; la tabla tiene cada serie una sola vez, por ejercicio, con «N de M series registradas» y cómo quedó cada una; la serie con una diferencia va en negrita y además lo dice; Escape lo cierra y el foco vuelve a la fila (C-66) | Lo mismo, serie por serie, calculado a mano | Pasa: 3 ejercicios y 10 series; «Rep.: por debajo · RIR: por debajo», con «Carga: por encima de la sugerida» aparte | Verificado automáticamente |
| El detalle dice cuándo ocurrió, cuándo se registró y frente a qué versión del plan, por su número; lee una vez los tiempos de esa sesión y no vuelve a leer el plan; sin tiempos marcados, lo dice y no ofrece abrir descansos que no hay (F-27) | Lo mismo; el número de la versión, a mano, por el orden de activación | Pasa: «…frente al plan versión 2, el de ese día» | Verificado automáticamente |
| Con tiempos marcados, el detalle dice los tres tiempos de la sesión, cada uno con su certeza, y «Descansos y duración de cada serie» abre el descanso de cada serie frente al recomendado, su duración y el tiempo de cada ejercicio; un descanso que quedó abierto dice «Incompleto», y una serie sin descanso marcado lo dice con palabras (F-27) | Lo mismo, **con una respuesta armada por el recorrido:** el escenario no tiene ninguna sesión con tiempos | Pasa: «54:20 · medido», «03:10 · medido», «51:10 · estimado»; «01:45 registrado · 01:30 recomendado · +00:15»; «Incompleto · 01:30 recomendado»; «Sin descanso marcado» | Verificado automáticamente, sobre una respuesta simulada |
| La evolución de un ejercicio ya no está en la sección: no hay un bloque «Planificado y registrado» ni un gráfico al entrar, y sí un enlace a Analizar, de la aplicación, con la pregunta del ejercicio y el período que se está mirando (C-67, F-32) | Lo mismo | Pasa | Verificado automáticamente |
| Nada de lo que se veía se quitó: «Ver la sesión en el plan», «Registro original» y «Ver en un gráfico» se abren en el lugar (F-32) | Lo mismo | Pasa: los tres ejercicios indicados ese día, el registro con su condición y el gráfico por serie | Verificado automáticamente |
| Los días del período sin ninguna sesión se dicen con su cantidad y como falta de dato; «Ver los días» los lista (F-25) | Lo mismo, con el número que da la API | Pasa: «65 días del período sin sesión registrada. Sin registro no quiere decir que no haya entrenado: no hay dato.» | Verificado automáticamente |
| El período, la vista y el filtro por versión viven en la dirección: con una versión elegida se ven solo sus sesiones y las cantidades son las de esa versión; «Actualizar» conserva todo (F-28) | Lo mismo, eligiendo la versión en «Más filtros» | Pasa: 11 de 25 sesiones | Verificado automáticamente |
| La sesión abierta vive en la dirección: se abre al entrar con ella, y «Actualizar» la deja abierta al costado sin pasar por el panel de encima ni por un instante (F-28) | Lo mismo, con un vigía puesto antes de tocar «Actualizar» | Pasa: 0 veces | Verificado automáticamente |
| Si el plan de una versión no se puede leer, las sesiones siguen a la vista con lo registrado; un bloque lo dice, con «Reintentar»; cada sesión dice «No se pudo leer lo indicado» y ninguna «Dentro de lo indicado»; «Con diferencias» queda sin número, no con un cero; «Reintentar» trae lo que faltaba (F-29) | Lo mismo, con un 503 simulado en el navegador | Pasa: «No pudimos leer lo indicado de algunas sesiones» | Verificado automáticamente, sobre una respuesta simulada |
| A 1440 × 900, con una sesión abierta, las vistas y los nombres de las columnas entran en la primera pantalla, y la lista y el detalle se reparten la ventana por mitades (F-30) | Lo mismo, midiendo en la página | Pasa: 678 px cada mitad; los nombres de las columnas terminan a los 365 px | Verificado automáticamente |
| A 1024 px el detalle se abre encima, en un panel que retiene el foco, con la misma tabla; la página no desborda de costado (C-66) | Lo mismo | Pasa | Verificado automáticamente |
| La tabla de las series no lleva una franja a los costados, ni al costado ni en el panel de encima (C-66). Lo mismo, la tabla de ingredientes de un registro de Nutrición (C-53) | Lo mismo: el color de la superficie y el de las «tapas» de la tabla, resueltos por el navegador. Una comprobación en `sesiones` y otra en `registros` | Pasa. **Antes del arreglo fallaron las dos:** la superficie, rgb(5, 34, 56); las tapas, rgb(1, 19, 37) | Verificado automáticamente |
| A 1280 px, con una sesión abierta, ningún dato de una fila se sale de su columna: la marca «Realizada con desvío» parte su texto adentro (F-30) | Lo mismo, con la vista que trae esa sesión | Pasa. **Antes del arreglo falló:** «fuera de su columna: Realizada con desvío» | Verificado automáticamente |
| A 1280 px, en la tabla, lo que no entra en un renglón baja de a una parte entera: ninguna parte («RIR 1», «6 rep.») queda partida (F-30) | Lo mismo, midiendo el alto de cada parte; y otra vez con la regla quitada en el navegador, para saber que la medida ve algo | Pasa: ninguna de 44. Sin la regla, 7 partidas | Verificado automáticamente |
| En la fila, una frase de dos partes no deja el número separado de lo que cuenta ni el separador al principio de un renglón (F-30) | Lo mismo, sobre el texto de la página sin normalizar los espacios | Pasa: «1⍽serie con diferencias⍽· un ejercicio no se compara» (⍽: el espacio que no se parte) | Verificado automáticamente |
| Registros de Entrenamiento tiene su ayuda en el marco, con cada cosa y las cuatro vistas; Resumen, que no tiene ayuda, no muestra el botón (F-14) | Lo mismo | Pasa: 14 renglones | Verificado automáticamente |
| axe no encuentra faltas en la lista, con una sesión al costado ni con la ayuda abierta | Lo mismo | Pasa | Verificado automáticamente |
| Las reglas del cálculo: cómo se dice una serie, cómo queda frente a su objetivo, la fila de cada clase de sesión, las cuatro vistas y sus cantidades, y qué pasa si lo indicado no se pudo leer | `packages/domain/src/registros-de-entrenamiento.test.ts`, en la batería | 14 de 14 | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 292 de 292 (las 265 de antes, 26 de `sesiones` y una más en `registros`), descartable 22 de 22 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 05:47 a 06:20, sobre `e565a00`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-2/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre los commits de código | En verde las cuatro corridas que terminaron: 38219625693 sobre `9c823ac`, 38221887033 sobre `01fb07b`, 38223944761 sobre `afc7d59` y 38225243086 sobre `e565a00`. La de `83f0b63` se canceló sola al llegar el commit siguiente, y no cuenta. En la última: el legajo; la batería completa (typecheck; dominio, 650, con las 14 nuevas; guiones, 346; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440 px en sus estados (la semana, 90 días, las vistas, «Más filtros», una sesión abierta, una no realizada, una corregida, la sesión en el plan, la ayuda, la falla de la lectura de lo indicado y la llegada desde la ficha) y a 1280 y 1024 px, en los dos temas | `ver.mjs`, sobre datos recién generados | 44 capturas de ahora (`parte-2/ahora/`), las 12 de antes (`parte-2/antes/`) y `parte-2/sesiones-antes-y-ahora.png`. La captura de la falla es sobre una respuesta simulada | Observado en una captura real |
| Los tiempos de una sesión, en pantalla | La comprobación de los tiempos guarda una captura | `parte-2/sesion-con-tiempos-simulados-1440-azul-noche.png`: **es una respuesta armada**, y el nombre lo dice | Observado en una captura, sobre una respuesta simulada |

**El guion de antes, y lo que protegía (E-06 del primer paquete).** `recorrido-web-ejecuciones.mjs`, de
WP-ENTRENAMIENTO-SERIES, miraba esta pantalla buscando sus tarjetas con «Ver detalle» y la tabla de seis columnas,
después de que la APK registrara dos sesiones. Ya no corre contra la pantalla de hoy: queda como constancia de la
corrida de su paquete, y lo dice en su cabecera.

| Lo que protegía | Dónde se mira ahora |
|---|---|
| De cada serie, lo indicado ese día y lo registrado | La tabla del detalle (C-66), serie por serie, calculada a mano con lo que da la API |
| El descanso de cada serie frente al recomendado, y la duración de cada serie cronometrada | La comprobación de los tiempos (F-27), **sobre una respuesta armada:** un descanso medido y una serie cronometrada |
| Los tres tiempos de la sesión, cada uno con su certeza (medido o estimado) | Lo mismo |
| El descanso que quedó abierto cuando la app se cerró: «Incompleto» | Lo mismo. No se miraba: se sumó al escribir esta acta |
| Que los valores sean los que la APK registró de verdad, con su reloj | **No se mira acá:** el escenario de este recorrido no tiene sesiones con tiempos. El cálculo de los tiempos tiene sus pruebas en el dominio y en la API, y no cambió |

Las comprobaciones negativas van con una positiva de la misma consulta: «ninguna fila dice 0 de» (las demás dicen
«N de M»), «no muestra el botón de ayuda» en Resumen (lo muestra en Registros), «el panel de encima no se abre» a 1440
(se abre a 1024), «Con diferencias sin número» con la falla (lo lleva sin ella) y «no ofrece abrir descansos» sin
tiempos (los abre con la respuesta armada).

**La prueba de la prueba.**

- **El cálculo, roto de a una regla** (`resultados/calculo-roto-de-a-una-regla.txt`): 45 roturas del módulo del dominio,
  cada una contra sus pruebas. **La primera vez se notaron 41 de 43.** Las dos que no mostraron dos huecos: con una
  corrección vigente nadie miraba que se contara la corrección y no el registro original, y una sesión sin nada que
  comparar podía decir «Dentro de lo indicado». Se sumaron esas pruebas y dos roturas más: 45 de 45.
- **La pantalla, rota y compilada así, en dos tandas.** Primera (`compilacion-rota-tanda-A.txt`): 19 roturas del
  website, cada una con una comprobación que solo ella puede hacer fallar. **Se notaron 18.** La que no —el botón que
  cierra el detalle, sin nombre— quedó tapada por otra rotura de la misma tanda: «Actualizar» cerraba la sesión, y axe
  miró una página sin el detalle. Fue a la segunda tanda. Segunda (`compilacion-rota-tanda-B.txt`): esa y dos del
  cálculo, aplicadas sobre la fuente del dominio. **El primer intento no compiló:** TypeScript rechazó una de las
  roturas porque podía probar que la comparación era imposible; se reescribió. Se notaron las 3 —una no realizada
  contada serie por serie hizo fallar cinco comprobaciones; la carga contada como diferencia, dos— y ninguna otra
  falló. Que el recorrido note una rotura del cálculo muestra que lo que espera no sale del módulo que arma la pantalla.
- **Las cuatro comprobaciones que se sumaron después de mirar las capturas** (la franja, la marca a 1280 px, las partes
  de la tabla y las frases de la fila) no pasaron por una tanda: cada una se corrió primero sobre la compilación que
  tenía el defecto, y falló; después, sobre la corregida. La de las partes mide además con la regla quitada en el
  navegador. La de las frases mira cómo está armado el texto, no dónde cortó el renglón: es más débil que las otras.
- En total, 22 roturas de la pantalla y 45 del cálculo.

**Lo que encontraron las comprobaciones y las capturas, y qué se hizo.**

- **La primera corrida dio 19 de 20, y la pantalla estaba bien:** la comprobación esperaba que «Descansos y duración»
  se ofreciera siempre, y una sesión sin tiempos no lo ofrece. Ahora lo que espera sale de lo que dice la API.
- **Una comprobación que no probaba nada:** la del filtro por versión comparaba dos listas vacías (el filtro, más una
  vista sin sesiones). Ahora mira el filtro solo, fila por fila.
- **Una franja a cada lado de la tabla del detalle.** La mostró la primera captura de los tiempos, en Azul noche: una
  banda oscura en los bordes de la tabla. Lo que se desplaza de costado lleva dos «tapas» del color de la superficie
  donde está; en un área, fuera del marco de la ficha, tomaban el del fondo de la página. **Estaba también en Nutrición
  · Registros, desde la parte 1,** donde las capturas en el tema claro casi no la muestran. Se corrigió con una regla, y
  cada recorrido tiene su comprobación.
- **La marca «Realizada con desvío» se salía de su columna a 1280 px,** hacia la de las series. En el escenario no
  llegaba a pisar un dato; con dos renglones en las series, sí. La mostró una captura que no estaba en la lista de
  evidencia: se sumó.
- **«RIR» en un renglón y su número en el de abajo,** en cada serie de la tabla, a 1280 px. Ahora baja una parte
  entera. El primer arreglo aplicaba lo mismo a la fila de la lista y **la empeoró** (cuatro renglones donde había
  tres, porque ahí las partes son frases que no entran en su columna): lo mostró la captura siguiente. En la fila
  quedó otra regla, más liviana.
- **Una captura con el nombre equivocado:** la de los tiempos se llamaba «claro» y es de Azul noche. Se renombró.
- **El primer intento de compilar la pantalla falló** (faltaba exportar el módulo nuevo del dominio).

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección mire las sesiones de un asesorado, abra una y diga si la tabla le alcanza.
- **Los tiempos de una sesión, con datos de verdad.** El escenario no tiene sesiones con tiempos: la pantalla se miró
  con una respuesta armada (arriba). La cadena completa, de la APK al website, la miraba el guion de antes sobre la
  pantalla de antes.
- Una sesión resumida: el escenario no tiene ninguna en 90 días. Su regla tiene pruebas en el dominio.
- El detalle de una sesión con otro ejercicio en lugar del indicado: su fila se comprueba («un ejercicio no se
  compara») y está en una captura, pero el recorrido no abre su tabla.
- **Si la vista «Con diferencias» sirve con datos reales.** En el escenario trae 24 de 25 sesiones: casi todas tienen
  alguna serie con el RIR por debajo o por encima de lo indicado. Es como está armado el escenario, pero muestra que
  una diferencia de un punto de RIR alcanza para entrar en la vista.
- 1280 px, como comodidad: la lista queda en 598 px y cada fila ocupa tres renglones. Se lee; no es cómoda.
- La lista de versiones del plan se lee de a 20 (un defecto de antes, de la pestaña Plan): con más de 20 versiones, el
  detalle nombraría la versión por su fecha. Se corrige con la parte 6.
- «Registro original», plegado al pie del detalle, es la pieza de antes, que comparte la ficha: una repetición sin
  registrar se muestra ahí con una raya.
- 768 y 390 px: por debajo de 960 px cada fila apila sus datos; sin comprobaciones ni capturas propias.
- Lector de pantalla con una persona: pendiente. Se verificaron axe, el rótulo de cada dato de la fila, el foco al
  abrir y al cerrar una sesión, y Escape.

**Para decidir, sin urgencia.**

1. **El nombre de la segunda vista.** La maqueta dice «Distinto de lo indicado»; quedó «Con diferencias», porque en la
   línea de tiempo de la ficha ese nombre ya quiere decir otra cosa para una sesión (F-26).
2. **Si una diferencia de RIR tiene que contar** igual que una de repeticiones, a la luz del 24 de 25 de arriba.
3. **El gráfico por serie** («Ver en un gráfico», en el detalle): la tabla dice lo mismo. No se borró; si Dirección
   confirma que la tabla lo reemplaza, se retira en otro cambio (F-32).

## Parte 3 · Antropometría · Tomas y una medición (2026-10-12)

La sección «Tomas» pasó de una lista de tomas y, de la abierta, una fila por medición con «Medido · Vigente» y dos
botones («Corregir» y «Anular»), más una lista con todas las corridas de cálculo —cada una con su desplegable y su
«Dejar como referencia»—, a la lectura de las maquetas 22 y 29: **la lista en tramos del mismo protocolo; lo que vale
para toda la toma, dicho una vez; los resultados vigentes, por categoría; las mediciones, por familia y con solo lo que
se sale de lo común; y cada medición, en un panel,** con su historia, lo que cambió en los resultados y los dos actos.
«En preparación» dejó de ser una sección: la carga de una toma se abre desde «Tomas». No se quitó ninguna función:
corregir, anular, calcular con un método, dejar un resultado como referencia, ver los cálculos sin efecto y la lámina
siguen, cada uno a un clic. `vista=evaluaciones`, `vista=preparacion` y `evaluacion=` abren lo mismo que antes. Sobre
la base propia (`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de esta
parte: `a7ba80c` (la pantalla), `969fd56` (las palabras del Espacio profesional), `5b7ba8c` (las reglas de estilo de la
pantalla de antes, que salieron) y `defe9e1` (lo que mostraron la prueba de la prueba y las capturas).

**Medido en la página real,** con la toma del perfil completo (30 mediciones y 8 resultados calculados, en las cuentas
descartables, recién cargada por la API). El «antes» es la pantalla como quedó al cerrar la parte 2 (`d4b262b`), puesta
sobre el código de hoy y compilada así, con los mismos datos: los textos son los de hoy («toma»), la disposición es la
de antes.

| Ancho de la ventana | Antes | Antes, con «Calcular con un método» abierto | Ahora | Ahora, después de corregir, anular, calcular y dejar una referencia |
|---|---|---|---|---|
| 1440 px | 4.283 px: 4,8 pantallas de 900 | 5.098 px | 1.162 px: 1,3 pantallas | 1.260 px |
| 1280 px | 4.283 px | No se midió | 1.311 px | 1.402 px |
| 1024 px | 4.463 px | No se midió | 1.813 px | 1.904 px |

Con el asesorado A (ocho tomas; la que abre sola tiene dos mediciones) la página medía 1.154 px a 1440 y a 1280, y
1.240 a 1024; ahora mide 1.018, 1.018 y 900: ahí manda el largo de la lista de tomas. La carga de una toma, que era una
sección, medía 2.996 px y mide 3.034 (sumó el enlace para volver a «Tomas»): no cambió en esta parte, es la 9. **Una
toma completa no entra en una pantalla:** cada fila mide 44 px, que es lo que mide todo lo que se toca (guía, I.5); la
maqueta las dibuja más bajas (su dibujo mide 960 px).

**Las lecturas.** Al entrar, «Tomas» lee una vez la lista, una vez la toma en preparación, una vez el detalle de cada
toma (ocho, en el asesorado A), una vez los métodos y una vez los cálculos. Cambiar de toma no lee nada. La pantalla de
antes volvía a pedir la lista, el detalle, los métodos y los cálculos en cada clic sobre otra toma (leído en su código;
no se contó en pantalla).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Al entrar se lee la lista entera una vez, la toma en preparación una vez y una vez el detalle de cada toma (hasta veinte): ninguno dos veces. Los métodos y los cálculos, una vez (F-33) | `recorrido.mjs funcional`, comprobaciones de «Tomas» (solas, con `recorrido.mjs tomas`). Lo esperado se calcula a mano con lo que devuelve la API: no se usa el módulo que arma la pantalla | Pasa: 1, 1, 8 detalles de 8 tomas, 1 y 1 | Verificado automáticamente |
| La lista tiene todas las tomas registradas, de la más nueva a la más vieja, en tramos seguidos del mismo protocolo (una toma con otro protocolo en el medio parte el tramo); cada una dice su día y hora y sus cuentas: mediciones, corregidas y anuladas (C-64) | Lo mismo, con las cuentas hechas a mano sobre el detalle de cada toma | Pasa: 8 tomas en 3 tramos: «Perfil antropométrico completo» (5), «Protocolo de laboratorio (demostración)» (1) y «Perfil antropométrico completo» (2) | Verificado automáticamente |
| El título dice «Tomas», cuántas hay registradas y que una toma registrada no se edita; el botón dice «Preparar una toma» si no hay ninguna empezada (C-58) | Lo mismo | Pasa: «8 registradas.» | Verificado automáticamente |
| Sin una toma en la dirección abre la más reciente, marcada en la lista; su encabezado dice cuándo se tomó, la clase del dato si todas las mediciones la comparten y, en un renglón, el protocolo, las cuentas, cuándo se registró y quién (F-36) | Lo mismo | Pasa: «Toma del 11 oct 2026, 08:00» · «Medido» | Verificado automáticamente |
| Elegir otra toma la pone en la dirección, la marca en la lista y la muestra sin pedirle nada a la API ni pasar por «Cargando…» (F-33) | Lo mismo, con un vigía puesto antes del clic | Pasa: 0 pedidos y 0 veces «Cargando…» | Verificado automáticamente |
| Las mediciones van por familia, en el orden del dominio y, adentro, en el del catálogo; cada fila dice el nombre corto, el valor que rige y solo lo que se sale de lo común; la unidad, una vez en el título de la familia si todas la comparten. El lector de pantalla oye el nombre completo y el valor con su unidad (F-36, C-61) | Lo mismo, fila por fila, con el orden del catálogo escrito a mano | Pasa: «Masa y estatura» (1), «Pliegues cutáneos · mm» (7) y «Perímetros · cm» (2); «Pliegue bicipital: 6 mm · Anulada» | Verificado automáticamente |
| Una toma de hasta seis mediciones muestra sus familias una al lado de la otra, sin dejar vacío el lugar de las que no tiene; una más cargada conserva el lugar fijo de cada familia (F-36) | Lo mismo, midiendo la separación en la página | Pasa: 26 px entre «Masa y estatura» y «Perímetros». **Antes del arreglo falló:** 351 px | Verificado automáticamente |
| Entre las mediciones no hay ningún botón «Corregir» ni «Anular»: la fila entera abre la medición en un panel que retiene el foco, sin pedirle nada a la API, con su valor que rige, sus marcas, el protocolo, cuándo se tomó, su historia y los dos actos. Escape lo cierra y el foco vuelve a la fila (C-62) | Lo mismo | Pasa: «Peso · 80,2 kg · Medido, Vigente»; «Corregir medición» y «Anular esta medición» | Verificado automáticamente |
| Una medición anulada se abre igual: dice «Anulada» y no «Vigente», conserva su valor, su historia empieza por la anulación con el motivo y quién la hizo, dice que no se reactiva y no ofrece ninguna acción (F-37) | Lo mismo; la misma consulta encuentra las acciones en una medición vigente | Pasa: «6 mm»; «Por qué se anuló: «Sitio mal marcado». La anulaste vos.» | Verificado automáticamente |
| Si ningún resultado de la toma usaba la medición anulada, «Lo que pasó con los resultados» lo dice con las palabras de una anulación (F-38) | Lo mismo | Pasa: «Ningún resultado calculado de esta toma quedó sin efecto por esta anulación.» **Antes del arreglo falló:** decía «…cambió por esta corrección» | Verificado automáticamente |
| Una medición corregida muestra en la fila y en el panel el valor que rige, no el que se tomó primero, con «Corregida»; su historia va de lo más nuevo a lo más viejo: la corrección, con su motivo y quién la hizo, marcada como el valor vigente, y el original, que se conserva (F-37) | Lo mismo; la fila y el panel, leídos de la pantalla | Pasa: la fila, «Cintura 90,5 Corregida»; el panel, «90,5 cm» (se tomó 95) | Verificado automáticamente |
| Si ningún resultado de la toma usa la medición corregida, «Lo que cambió con la corrección» lo dice, sin listar nada ni un «antes» (F-38) | Lo mismo. En el asesorado A la corrección se cargó en la base, sin cálculos que la usen | Pasa: «Ningún resultado calculado de esta toma cambió por esta corrección.» | Verificado automáticamente |
| Los resultados vigentes van por categoría del catálogo y, adentro, por método, cada uno con los decimales que su método declara; «Ver N anteriores, sin efecto» está solo si hay alguno; una toma sin cálculos lo dice y no muestra ninguna categoría (F-39, C-63) | Lo mismo, con el orden y los decimales calculados a mano | Pasa: «Índice de masa corporal (IMC) 25,1 kg/m²»; «Todavía no hay cálculos para esta toma.» | Verificado automáticamente |
| Un resultado se abre en el panel: su método, su valor, «Calculado», con qué se calculó (la versión, la regla, la precisión y una línea por entrada) y, si corresponde, «Dejar como referencia». «Calcular con un método» se abre en el mismo panel, con todos los métodos del catálogo; «Cancelar» lo cierra sin escribir nada (F-39) | Lo mismo | Pasa: 2 entradas; 22 métodos | Verificado automáticamente |
| «En preparación» dejó de ser una sección: el marco tiene tres. El botón de «Tomas» abre la carga (`vista=preparacion`), con «Tomas» marcada y un enlace de la aplicación para volver (F-35, C-59) | Lo mismo | Pasa: «Tomas», «Evolución» y «Lámina»; la carga, «Nueva toma» | Verificado automáticamente |
| La toma elegida vive en la dirección: se abre al entrar con ella, y «Actualizar» vuelve a leer la lista y la deja abierta (F-33) | Lo mismo | Pasa: una lectura de la lista | Verificado automáticamente |
| Una toma pedida por la dirección que no está disponible lo dice con el texto neutral, sin tapar la lista, que sigue completa; «Volver a la lista de tomas» saca el parámetro y abre la más reciente (F-33) | Lo mismo, con un identificador que no existe | Pasa: «La toma solicitada no está disponible. La lista de tomas sigue completa.» | Verificado automáticamente |
| Si la lista no se puede leer, la sección dice la falla con «Reintentar» y nunca «Todavía no hay tomas registradas». Si lo que no se puede leer son los cálculos, la toma y sus mediciones siguen a la vista, el bloque de resultados dice que no pudo leerlos (no «todavía no hay cálculos») y «Reintentar» los trae (F-39) | Lo mismo, con dos 503 simulados en el navegador | Pasa: «No pudimos leer los resultados calculados de esta toma.» | Verificado automáticamente, sobre respuestas simuladas |
| «Tomas» tiene su ayuda en el marco del área; Evolución, que no tiene, no muestra el botón (F-14, F-43) | Lo mismo | Pasa: «Cómo se leen las Tomas», 11 renglones | Verificado automáticamente |
| axe no encuentra faltas en «Tomas», ni con una medición abierta en el panel, ni con la ayuda abierta | Lo mismo | Pasa | Verificado automáticamente |
| A 1280 px la lista sigue al costado de la toma; a 1024 px pasa arriba, como un selector con las mismas tomas, sus cuentas y sus tramos, y elegir ahí abre la toma y la pone en la dirección. En ningún ancho la página desborda de costado (F-41) | Lo mismo | Pasa: 8 opciones de 8 | Verificado automáticamente |
| **Lo que escribe,** sobre la toma del perfil completo de las cuentas descartables. La toma abre sola y se lee como la maqueta 22: las 30 mediciones en sus cinco familias, y sus resultados por categoría (F-36) | `recorrido.mjs mediciones`: corre solo, con esas cuentas recién generadas, y no toca los datos de A, B ni C. Lo esperado sale de lo que devuelve la API antes y después de cada escritura | Pasa: 2, 11, 13, 3 y 1 mediciones; «30 mediciones» | Verificado automáticamente |
| Corregir pide el valor y el motivo: sin los dos, el botón está apagado; un valor que no se entiende como número se marca en su campo y no sale ningún pedido (F-37) | Lo mismo, con «84,5,1» | Pasa | Verificado automáticamente |
| Si la corrección no se puede guardar, el panel lo dice adentro, sigue abierto con el formulario y lo escrito, y la medición no cambió (F-37) | Lo mismo, con un 503 simulado en el navegador | Pasa | Verificado automáticamente, sobre una respuesta simulada |
| Al corregir sale un solo pedido, con el valor, el motivo y la unidad de la medición. El panel sigue abierto y lo dice: rige el valor corregido, con «Corregida», y la historia tiene la corrección («La corregiste vos», marcada como el valor vigente) y el original, que se conserva (F-37) | Lo mismo: la cintura, de 48 a 84 cm, por la pantalla | Pasa: «Corrección registrada. El valor original se conserva.» | Verificado automáticamente |
| «Lo que cambió con la corrección» lista los resultados que la API volvió a calcular porque usaban la cintura, cada uno con el valor de ahora y el de antes: ni uno más ni uno menos, y ninguno que no la usa (F-38) | Lo mismo: los pares salen, a mano, de la corrida vigente y la que reemplaza, según la API | Pasa: «Índice cintura/cadera 0,81 antes 0,46», «Índice cintura/talla 0,50 antes 0,29» y «Masa grasa relativa (RFM), mujeres 36,0 % antes 6,0 %» | Verificado automáticamente |
| Cerrado el panel, la toma ya dice lo nuevo sin volver a entrar: la fila de la cintura, 84 con «Corregida»; la lista, «1 corregida»; los resultados, con su valor nuevo; y los anteriores, a un clic (F-39) | Lo mismo | Pasa: «Ver 3 anteriores, sin efecto» | Verificado automáticamente |
| Los cálculos que quedaron sin efecto se abren a pedido, en el lugar: los que la API da por reemplazados, cada uno con su método y el valor que tenía (F-39) | Lo mismo | Pasa: los tres | Verificado automáticamente |
| Anular dice antes del botón que no borra nada y que no se reactiva, pide el motivo y su botón no es el principal. Al anular sale un solo pedido; el panel sigue abierto, dice «Anulada», conserva el valor, cuenta la anulación con su motivo y ya no ofrece ninguna acción (F-37) | Lo mismo: el pliegue de la pantorrilla, por la pantalla | Pasa: «Medición anulada. Su historia se conserva.» | Verificado automáticamente |
| Los resultados que usaban la medición anulada quedan sin efecto y sin un cálculo que los reemplace: el panel los nombra con el valor que tenían y dice que no se reemplazan por cero; en la toma dejan de estar entre los vigentes, sin un cero ni un resultado vacío en su lugar (F-38) | Lo mismo | Pasa: «Suma de 6 pliegues (ISAK): antes 134,0 mm» | Verificado automáticamente |
| «Calcular con un método» muestra la ficha del método elegido; al calcular sale un solo pedido y el panel pasa a mostrar el resultado nuevo, que queda en su categoría sin volver a entrar (F-39) | Lo mismo, con un método que la toma cubre y todavía no tenía | Pasa: «Masa libre de grasa (Durnin y Womersley), mujeres» | Verificado automáticamente |
| «Dejar como referencia» explica antes del botón que no cambia el cálculo ni borra los otros; sale un solo pedido, el resultado queda marcado «Referencia» en el panel y en la toma, y es el único marcado: BE no marca ninguno por su cuenta (F-39) | Lo mismo | Pasa: «Jackson, Pollock y Ward, 7 pliegues, mujeres · Siri» | Verificado automáticamente |
| A 1440, 1280 y 1024 px, ningún renglón deja un número separado de la palabra que cuenta ni el separador al principio: en las cuentas de la lista, en el renglón de la toma y en los nombres de los métodos (F-41) | Lo mismo: mide dónde quedó cada letra en la pantalla, no cómo está armado el texto; exige que haya textos de más de un renglón | Pasa: 13, 13 y 9 textos; 5, 8 y 7 en más de un renglón. **Antes del arreglo falló:** «1 corregida · 1 / anulada», a 1440 y a 1280 | Verificado automáticamente |
| A 1440 px, con «Ver N anteriores, sin efecto» a la vista, el título de los resultados, su nota y sus dos acciones siguen en un renglón: las acciones no bajan, y la nota no se parte para dejarles lugar (F-41) | Lo mismo, midiendo la altura del título y de las acciones, y en cuántos renglones quedó la nota | Pasa: los dos, a los 445 px, y la nota en un renglón (a 1280 px, donde no entran, las acciones bajan: 436 y 476) | Verificado automáticamente |
| Con una toma guardada y sin registrar, «Tomas» lo dice: el botón pasa a «Seguir con la toma en preparación» y cuenta sus mediciones; no está entre las registradas, y el botón lleva a la carga, que la retoma con lo guardado (F-35) | Lo mismo: una toma de una medición, cargada por la pantalla | Pasa: «Hay una toma en preparación, con 1 medición.»; «4 registradas.» | Verificado automáticamente |
| Registrar una toma desde la carga vuelve a «Tomas» con esa toma abierta —no la más reciente—, puesta en la dirección y marcada en la lista, que la tiene en su lugar y cuenta una más. Sale un solo pedido para crearla y uno solo para registrarla (F-35) | Lo mismo: la toma nueva es de ocho días antes que la completa | Pasa: «Toma del 2 oct 2026, 09:15»; «5 registradas.» | Verificado automáticamente |
| Al volver de registrar, «Tomas» dice «Toma registrada. Ya forma parte de la evolución.» en un aviso que se ve entero dentro de la ventana (F-35) | Lo mismo: el aviso se lee apenas aparece | Pasa | Verificado automáticamente |
| axe no encuentra faltas en la toma completa, ni en el panel de una medición corregida con lo que cambió | Lo mismo | Pasa | Verificado automáticamente |
| Las reglas: el orden y los tramos de la lista, las cuentas, las mediciones por familia, el nombre corto, las marcas, la historia de una medición por su cadena de correcciones y lo que cambió con una corrección | `packages/domain/src/tomas-de-antropometria.test.ts`, en la batería | 24 de 24 | Verificado automáticamente |
| El titular de una medición muestra el valor vigente, no el original; la pantalla no elige ningún valor | `scripts/copy-pantallas.test.cjs`, adaptada a las pantallas nuevas | Pasa | Verificado automáticamente |
| Ningún texto de Antropometría usa una palabra prohibida, tampoco los que dependen de una cantidad | `dominio-wp05.test.ts` (T13), que ahora llama a cada texto con 0, 1 y 3 | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 316 de 316 (las 292 de antes y las 24 de `tomas`), descartable 22 de 22, mediciones 18 de 18 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 08:57 a 09:35, sobre `defe9e1`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-3/resumen-de-la-pasada.txt`. **Después de la pasada salió una regla de estilo** (`591b1b4`; está contado en la prueba de la prueba): sobre esa compilación se corrieron de nuevo `tomas` (24 de 24) y `mediciones` (18 de 18), no la pasada entera | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre los commits de código | En verde las cuatro corridas: 38235248561 sobre `a7ba80c`, 38236853710 sobre `5b7ba8c` (que trae `969fd56`), 38246004713 sobre `defe9e1` y 38253400716 sobre `591b1b4`. En cada una: el legajo; la batería completa (typecheck; dominio, 674, con las 24 nuevas; guiones, 346; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440 px en sus estados (la lista, otra toma, una medición, una anulada, una corregida, un resultado, la ayuda, las dos fallas, una toma que no está y la carga) y a 1280 y 1024 px, en los dos temas; y la toma completa, recién cargada y después de escribir (los anteriores, la medición corregida y la anulada, la referencia, «Calcular», y los formularios de corregir y de anular) | `ver.mjs`, sobre datos recién generados | 62 capturas de ahora (`parte-3/ahora/`) y 32 de antes (`parte-3/antes/`). `parte-3/tomas-antes-y-ahora.png`: la toma completa, recién cargada, en las dos pantallas. Las dos capturas de fallas son sobre respuestas simuladas | Observado en una captura real |

Las comprobaciones negativas van con una positiva de la misma consulta: «entre las mediciones no hay botones» (el
panel tiene los dos actos), «una anulada no ofrece ninguna acción» (una vigente las ofrece), «Evolución no muestra el
botón de ayuda» («Tomas» lo muestra), «a 1024 px la lista no está» (está el selector, y a 1280 está la lista), «el
botón dice Preparar una toma» sin ninguna empezada (dice «Seguir con la toma en preparación» cuando hay una) y «ningún
resultado en lugar del que quedó sin efecto» (está entre los anteriores).

**La prueba de la prueba.**

- **Las reglas, rotas de a una** (`resultados/calculo-roto-de-a-una-regla.txt`): 50 roturas del módulo del dominio, cada
  una contra sus 24 pruebas. Se notaron las 50. Antes de la primera corrida se reordenó un caso de prueba: como estaba
  escrito, los datos ya venían ordenados, y romper el orden de «lo que cambió» no se habría notado.
- **Al armar las roturas de la pantalla aparecieron dos huecos, antes de correr nada.** Uno: la comprobación de la
  medición corregida decía «en la fila y en el panel» y miraba solo el panel; la toma de esa medición no es la que
  recorre la comprobación de las familias, así que la fila corregida no la leía nadie. Se sumó la lectura de la fila. La
  rotura que lo muestra —en el dominio, la fila toma el valor original— dio «la fila: Cintura 95 Corregida · el panel:
  90,5 cm». Dos: ningún recorrido registraba una toma por la pantalla, y esta parte cambió qué pasa al registrar
  (adónde se vuelve, y dónde se dice el aviso). Se sumaron sus comprobaciones al recorrido que escribe.
- **La pantalla, rota y compilada así, en tres tandas.** **Primera corrida,** sobre la pantalla de `a7ba80c` y `5b7ba8c`, con las comprobaciones ya reforzadas (`resultados/primera-corrida/`): 19 roturas del website contra `tomas`, 4 de las reglas del dominio contra `tomas`, y 14 contra `mediciones` (12 del website y 2 del dominio). Se notaron las 37, cada una por su comprobación, y ninguna otra falló. **Segunda corrida,** sobre `defe9e1`, después de los ajustes que mostraron las capturas y con las roturas de las comprobaciones nuevas (`resultados/compilacion-rota-tanda-A.txt`, `-B` y `-M`): 20 de 20, 4 de 4 y **16 de 17.** La que no se notó —«Calcular con un método» con su ancho de antes— mostró que sobraba una regla. Para que el título de los resultados entrara en un renglón se habían hecho dos cosas: angostar ese botón y dejar que la nota cediera lugar. Con la segunda sola, el título y las acciones seguían en un renglón (la nota se partía en dos), y la comprobación miraba solo el título y las acciones. Se quitó la regla que sobraba, la comprobación mira ahora también la nota, y la rotura se repitió sola sobre `591b1b4` (`compilacion-rota-tanda-N.txt`): se nota, porque las acciones bajan a un segundo renglón (el título, a los 436 px; las acciones, a los 476). Que el recorrido note una rotura de las reglas del dominio muestra que lo que espera no sale del módulo que arma la pantalla. En total, 41 roturas de la pantalla y 50 de las reglas.
- **Las comprobaciones que se sumaron después de mirar las capturas** se corrieron primero sobre la compilación que
  tenía el defecto, y fallaron por lo que tenían que fallar: el texto de la anulación («…cambió por esta corrección»),
  las familias de una toma de pocas mediciones (351 px) y los cortes de renglón («1 corregida · 1 / anulada»). **La del
  encabezado de los resultados falló la primera vez por otra cosa:** medía con los anteriores abiertos, donde el enlace
  dice «Ocultar los anteriores», y esperaba «Ver N anteriores». Se corrigió la comprobación (los pliega antes de
  medir). Su rotura es la que la tercera tanda no notó (arriba). **La de «Seguir con la toma en preparación»** no tuvo
  un defecto que mostrar: su rotura, en la tercera tanda, se notó.

**Lo que encontraron las comprobaciones y las capturas, y qué se hizo.**

- **Un texto que hablaba de una corrección que no hubo.** Una medición anulada, sin resultados que la usaran, decía «Ningún
  resultado calculado de esta toma cambió por esta corrección». Se vio al repasar los textos del panel mientras se
  armaban las roturas, y estaba a la vista en el detalle de una falla de la tercera tanda. Tiene su texto: «…quedó sin
  efecto por esta anulación».
- **«1» arriba y «anulada» abajo,** en las cuentas de la toma abierta, en la lista; y «7» y «pliegues», en el nombre de
  un método, a 1280 px. Es el defecto que la parte 2 corrigió en Entrenamiento, y la regla ya estaba en la guía (II.8).
  Las piezas que la aplican pasaron a un lugar común y se usan acá.
- **El título de los resultados, en dos renglones** a 1440 px cuando está «Ver N anteriores, sin efecto»: no entraba
  por unos pocos píxeles. En la maqueta entra en uno. «Calcular con un método» lleva ahora menos relleno, con el mismo
  alto.
- **Un hueco de 351 px** entre «Masa y estatura» y «Perímetros» en la toma que abre sola, que tiene dos mediciones: cada
  familia tiene su lugar fijo, pensado para un perfil completo, y el del medio quedaba vacío.
- **«Este cálculo dejó de tener efecto…», arriba de una lista de cuatro.** El texto era el del detalle de un cálculo.
  La lista y la ayuda tienen el suyo, en plural.
- **Cuatro comprobaciones de antes contaban cuatro secciones en Antropometría,** y una esperaba que su primera sección
  conservara el ancho viejo: se pusieron al día en el commit de la pantalla.
- **El primer intento de compilar la pantalla falló** (un ícono pedido en un tamaño que no existe), y **la primera
  corrida del generador de la toma completa, también** (un campo del pedido tenía otro nombre).
- **`scripts/auditoria-accesibilidad.mjs` no se tocó.** Busca las pestañas viejas de Antropometría, pero está fuera de
  la CI y vieja en varias líneas desde antes (WP-ESCRITORIO-AMABLE, «actualizarla o retirarla»): cambiarle una sola
  línea la haría parecer al día sin estarlo.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección abra una toma, corrija una medición y diga si el panel le alcanza.
- **«Lo que cambió», cuando se corrigieron dos entradas del mismo resultado.** Si después de esta corrección se corrigió
  otra medición que usa el mismo cálculo, el resultado vigente y el anterior usaron esta con el mismo valor, y el cambio
  ya no se muestra en su panel (sigue entre los anteriores, sin efecto). Está escrito en F-38; no hay un caso en los
  datos.
- En el asesorado A, la corrección y la anulación están cargadas en la base, sin cálculos que las usen: ahí los dos
  bloques dicen que ningún resultado cambió. El cambio de verdad se comprueba en las cuentas descartables, escribiendo.
- **Más de veinte tomas.** El protocolo y las correcciones se leen de las veinte más recientes, y la lista lo dice; el
  escenario tiene ocho. Tampoco una lista que llegue incompleta («Al menos N registradas»).
- Una toma con mediciones de dos clases («Medido» y «Reportado»), una medición sin valor vigente (la cadena de
  correcciones sin resolver) y una medición con dos correcciones: no están en los datos. Sus reglas tienen pruebas en el
  dominio.
- **El orden de los resultados dentro de una categoría** es por nombre de método («Índice cintura/cadera» antes que
  «Índice de masa corporal»); la maqueta dibuja el IMC primero.
- El foco al abrir el panel va a «Cerrar», como en los otros paneles de la ficha, no al título.
- La carga de una toma: no cambió en esta parte (solo sus textos y el enlace para volver). Es la parte 9.
- Evolución y Lámina: recibieron las palabras nuevas («toma»), sin otro cambio. Las miran sus pruebas de textos y el
  recorrido del marco; no tienen capturas nuevas.
- Los mensajes de rechazo de la API, que siguen diciendo «evaluación» (F-40).
- 768 y 390 px: sin comprobaciones ni capturas propias.
- Lector de pantalla con una persona: pendiente. Se verificaron axe, el nombre completo de cada fila, el foco al abrir
  y al cerrar el panel, y Escape.

**Para decidir, sin urgencia.**

1. **El alto de las filas.** Con 44 px, una toma completa mide 1.162 px a 1440; la maqueta la dibuja en 960, con filas
   más bajas. Bajarlas es hacer más chico lo que se toca.
2. **El orden de los resultados** dentro de cada categoría: por nombre de método, como hoy (el orden neutral del
   dominio, el mismo de la lámina), o con el IMC primero, como la maqueta.
3. **`scripts/auditoria-accesibilidad.mjs`:** actualizarla entera o retirarla. Hoy no corre contra ninguna de las áreas
   recompuestas.
4. **Los mensajes de rechazo de la API** que dicen «evaluación»: cambiarlos toca el servidor, sus pruebas y un
   despliegue.

## Parte 4 · Información · Solicitudes y el pedido (2026-10-12)

La pestaña Información pasó de dos secciones —una lista de solicitudes con «Ver detalle» en cada renglón, que abría
debajo todas las versiones de la respuesta, y una página aparte para pedir— a la lectura de las maquetas 26 y 27: **una
lista con tres vistas con nombre; el detalle al costado, con lo que la persona declaró por pregunta pedida y la
respuesta que rige; la historia de la respuesta, con cada versión a un clic; y «Pedir información» en un cajón que se
abre sobre la lista,** con sus tres pasos a la vista y lo que hay que saber antes de enviar junto al botón. No se quitó
ninguna función: `vista=solicitudes` y `vista=pedir` abren lo mismo que antes, desde la ficha, desde Entrenamiento
(«Solicitar contexto») y desde un pendiente. No cambian la API, la base ni la APK: los textos que la APK comparte no se
tocaron. Sobre la base propia (`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del
código de esta parte: `1a876db` (Solicitudes), `07285ac` (el cajón) y `11dfd32` («Requerida», al lado de su pregunta, después de la
prueba de la prueba y de las capturas).

**Se aplicó la decisión F-05** (Dirección, 2026-10-12): al elegir un formulario vienen todas sus preguntas marcadas y
ninguna como requerida. Está registrada en `docs/DEUDA_LEGAJO.md`, DL-131, con lo que dice el legajo y con su costo. No
viene ningún formulario elegido: la primera decisión es del profesional.

**Medido en la página real,** con las tres solicitudes de las cuentas descartables, recién cargadas por la API: una
respondida, una respondida y corregida por la persona (cambió una respuesta y agregó otra, con su motivo) y una sin
responder, en dos áreas. El «antes» es la pantalla como quedó al cerrar la parte 3, con los mismos datos, medida antes de
tocar nada.

| A 900 px de alto | Antes | Ahora |
|---|---|---|
| La solicitud respondida y corregida, abierta, a 1440 px | 1.327 px: el detalle, debajo de su renglón | 1.105 px: la lista en 520 px y el detalle, al costado, en 836 |
| Lo mismo, a 1280 px | 1.327 px | 1.207 px |
| Lo mismo, a 1024 px | 1.327 px | 900 px: el detalle se abre encima, en un panel |
| La solicitud respondida de seis preguntas, abierta, a 1440 px | No se midió: la captura que iba a mostrarla abrió otra solicitud | 1.236 px (1.271 antes de un ajuste que mostraron las capturas) |
| «Pedir información» con el formulario de seis preguntas elegido, a 1440 px | 1.835 px, en otra página | Un cajón de 800 × 900 px sobre la lista, que no desplaza la página. Su contenido mide 902 px, en 755 a la vista: el resto se desplaza adentro, con el botón siempre a la vista |
| Lo mismo, a 1024 px | 1.858 px | El cajón ocupa todo el ancho |

La lista sola, sin nada abierto, medía 900 px y mide 900: entra en la ventana en las dos. **El cajón no entra entero en
900 px con el formulario más largo del catálogo:** con seis preguntas, el paso 3 queda debajo del borde y hay que
desplazar adentro del cajón. Con los de tres preguntas entra.

**Las lecturas.** Al entrar, «Solicitudes» lee una vez la lista y una vez la respuesta de cada solicitud respondida (dos
de dos); ninguna de las que están sin responder, y ningún formulario. Abrir una solicitud respondida no lee su respuesta
de nuevo: lee una vez su formulario, y una sola vez por versión. Abrir el cajón lee el catálogo una vez; elegir un
formulario, su versión. La pantalla de antes hacía dos lecturas cada vez que se abría un detalle, también si era el
mismo (leído en su código; no se contó en pantalla).

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| Al entrar se lee la lista entera una vez y, una vez, la respuesta de cada solicitud respondida: ninguna dos veces, ninguna de las sin responder, y ningún formulario (F-44) | `recorrido.mjs solicitudes`: corre solo, sobre las cuentas descartables recién generadas, y no toca los datos de A, B ni C. Lo esperado se calcula a mano con lo que devuelve la API: no se usa el módulo que arma la pantalla | Pasa: 1 lectura de la lista; 1 y 1 de las dos respondidas; 0 de la sin responder; 0 formularios | Verificado automáticamente |
| La lista tiene todas las solicitudes, en el orden de la API (la más nueva primero); cada renglón dice el formulario, su estado, cuándo se pidió, en qué área, cuántas preguntas tiene, si la persona corrigió su respuesta, y para qué (C-72) | Lo mismo, renglón por renglón | Pasa: tres solicitudes, en dos áreas; una dice «corrigió su respuesta» | Verificado automáticamente |
| «Pedir información» es un botón de «Solicitudes», no una sección: el marco tiene una sola; ningún renglón lleva un botón «Ver detalle» (C-70) | Lo mismo; la misma consulta encuentra el botón de pedir | Pasa | Verificado automáticamente |
| Las tres vistas, en su orden, cada una con la cantidad que trae, contada a mano; «Sin responder» y «Respondidas» suman «Todas». Elegir una no le pide nada a la API, queda en la dirección, y volver a tocarla deja «Todas» (F-45) | Lo mismo | Pasa: «Todas 3 · Sin responder 1 · Respondidas 2»; 0 pedidos al elegir | Verificado automáticamente |
| Una solicitud respondida se abre al costado, sin tapar la lista, con el foco en su título. Dice cuándo se pidió y en qué área, para qué, y cuándo respondió y corrigió la persona. «Declarado por la persona» se dice una vez. De cada pregunta pedida, la respuesta que rige —la de la corrección que señala la API—, con «Corregida» y lo que había antes, también si antes estaba sin responder; «Requerida», junto a su pregunta (C-71, F-46) | Lo mismo: la respuesta que rige, «Corregida» y «Antes» se calculan a mano, por la cadena de correcciones que entrega la API | Pasa: «Asma leve. Uso inhalador antes de entrenar. · Corregida · Antes: «Asma leve, desde hace años.»» y «Molestia en el hombro derecho… · Corregida · Antes: sin responder.» | Verificado automáticamente |
| Abrir una solicitud respondida no vuelve a leerla: lee una vez la versión de su formulario (F-44) | Lo mismo | Pasa: 0 lecturas de la solicitud y 1 del formulario | Verificado automáticamente |
| La historia va de lo más nuevo a lo más viejo: la corrección, «Vigente», con el motivo que escribió la persona; y la original, que se conserva, con cuántas de las preguntas respondió (una cuenta, nunca una proporción). «Ver lo que respondió» abre, en el lugar, lo que dijo en esa versión (C-71, F-49) | Lo mismo | Pasa: «Corrección · Vigente · Motivo que escribió: «Me olvidé de aclarar que uso inhalador antes de entrenar.» · Respondió las 2 preguntas.» y «Respuesta original · Respondió 1 de las 2 preguntas.» | Verificado automáticamente |
| Una respondida sin correcciones: rige la original, ninguna fila dice «Corregida» ni «Antes», y un número lleva la unidad de su pregunta (F-46) | Lo mismo | Pasa: «3 días por semana» y «45 min» (la respuesta guardada no trae unidad) | Verificado automáticamente |
| En el detalle, «Requerida» sigue a la última palabra de su pregunta: si entra al lado, no ocupa un renglón propio (F-51) | Lo mismo: mide en qué renglón termina cada pregunta y dónde quedó su etiqueta | Pasa: las 5 preguntas requeridas, todas de dos renglones, con la etiqueta al lado. **Antes del arreglo falló:** las 5 con la etiqueta abajo, aunque entraba | Verificado automáticamente |
| Una solicitud sin responder se abre igual, sin leer nada más que su formulario: dice las preguntas pedidas y «Todavía sin responder. No responder también es una opción.». No tiene tabla, historia ni «Declarado por la persona», ni ningún porcentaje (F-47) | Lo mismo; la misma consulta encuentra la tabla y la etiqueta en una respondida | Pasa | Verificado automáticamente |
| Escape cierra el detalle y el foco vuelve al renglón. La solicitud abierta vive en la dirección: se abre al entrar con ella, y «Actualizar» vuelve a leer la lista y la deja abierta (F-48) | Lo mismo | Pasa: una lectura de la lista | Verificado automáticamente |
| En ningún estado de «Solicitudes» el texto afirma una medición ni un diagnóstico, ni usa un porcentaje ni un término prohibido de formularios; la negación está: «No es una medición ni un diagnóstico.» (F-49) | Lo mismo, con el detector del dominio, que sí encuentra la palabra en una frase que la afirma | Pasa | Verificado automáticamente |
| Si la lista no se puede leer, la sección dice la falla con «Reintentar» y nunca «Todavía no le pediste información». Si no se pueden leer la respuesta o las preguntas del formulario, el detalle lo dice —no dice «sin responder», ni muestra el código de una pregunta— y cada «Reintentar» trae lo suyo (F-50) | Lo mismo, con tres 503 simulados en el navegador | Pasa | Verificado automáticamente, sobre respuestas simuladas |
| «Solicitudes» tiene su ayuda en el marco del área: los estados, «Declarado por la persona», «Requerida» y la respuesta que rige (F-14) | Lo mismo | Pasa: «Cómo se leen las Solicitudes», 8 renglones | Verificado automáticamente |
| A 1280 px el detalle sigue al costado. A 1024 px se abre encima, en un panel que retiene el foco, con las mismas filas y la respuesta debajo de su pregunta; Escape lo cierra. Nada desborda de costado, ni un renglón deja un número separado de su palabra (F-51) | Lo mismo | Pasa | Verificado automáticamente |
| axe no encuentra faltas con una solicitud abierta al costado (1440 y 1280 px), en el panel de encima (1024 px) ni con la ayuda abierta (F-48) | Lo mismo | Pasa | Verificado automáticamente |
| «Pedir información» abre un cajón sobre «Solicitudes», que sigue detrás con su lista y sin volver a leerla: la dirección dice `vista=pedir`, el marco sigue marcando «Solicitudes» y el cajón dice de quién es, con las palabras del marco. El foco va a su título. Tiene los tres pasos, ningún formulario elegido, y al abrirse lee el catálogo una vez y ninguna versión (C-70, F-52) | Lo mismo; el catálogo esperado sale de la API | Pasa: «1 Qué formulario», «2 Qué preguntas», «3 Para qué y en qué área»; tres formularios, con 6, 3 y 3 preguntas | Verificado automáticamente |
| Elegir un formulario lee su versión una vez y muestra su descripción (la de los otros, no). Vienen todas sus preguntas marcadas y ninguna requerida; la cuenta sigue a las casillas. «Responde con» es el tipo y la unidad de la API. La «Requerida» de una pregunta sin pedir está apagada y no se puede marcar; la de una pedida, sí. Cada fila y cada formulario miden 44 px o más (C-73, F-05) | Lo mismo | Pasa: «3 de 3 elegidas.»; «Número · h», «Texto» y «Sí o no»; al desmarcar una, «2 de 3 elegidas.» | Verificado automáticamente |
| La nota de las requeridas dice lo que pasa; junto al botón, siempre adentro de la ventana, lo que hay que saber antes de enviar: que la va a ver en su teléfono (no que «le llega» un aviso) y que no se puede cancelar ni editar. El cajón no dice «Alcance», «plantilla» ni «campo», ni ningún término prohibido (C-74, F-56) | Lo mismo | Pasa: «La va a ver en su teléfono, en «Información». No se puede cancelar ni editar después de enviarla.» | Verificado automáticamente |
| Escape cierra el cajón: la dirección vuelve a `vista=solicitudes`, el foco vuelve al botón que lo abrió y no sale ninguna escritura. Lo armado no se pierde por cerrar: al abrirlo de nuevo está como estaba. Con eso sin enviar, «Actualizar» pregunta antes de descartarlo, nombrándolo, y no lee nada. «Atrás» también lo cierra (F-52) | Lo mismo: un formulario elegido, una pregunta desmarcada, otra requerida y el para qué escrito | Pasa: al reabrir, «2 de 3 elegidas.» y el para qué; «Tenés cambios sin guardar… en el pedido de información» | Verificado automáticamente |
| Con algo sin completar, «Enviar solicitud» no envía nada y dice en su lugar qué falta, con el foco en lo primero que falta; cada cosa deja de decirse cuando se completa (F-53) | Lo mismo: sin nada elegido; y con un formulario sin área propia y todas sus preguntas desmarcadas | Pasa: «Elegí un formulario.» y «Escribí para qué lo necesitás.»; después, «Elegí al menos una pregunta para pedir.», el para qué y «Elegí en qué área lo pedís.» | Verificado automáticamente |
| El área: con un formulario sin área propia hay que elegirla, se ofrecen las tres y no viene ninguna; con uno de un área sola queda fija, en un campo que no se edita, y lo dice. La aclaración que la persona lee debajo de cada pregunta está a un clic, y es la de la API (F-54) | Lo mismo: qué formulario tiene área propia lo dice la API | Pasa: «Este formulario es solo de Entrenamiento.»; 0 aclaraciones a la vista y, al pedirlas, las 5 que ese formulario tiene | Verificado automáticamente |
| Un rechazo al enviar se dice adentro del cajón, con el foco en el aviso, y lo elegido sigue como estaba. Si una pregunta no es pertinente para el área, lo dice con esas palabras; si la respuesta es «no disponible», dice el texto neutral del profesional y el marco vuelve a preguntar el acceso; sin conexión, dice que no se pudo confirmar y el botón pasa a «Reintentar», hasta que se cambia algo. Ninguna solicitud se creó (F-55) | Lo mismo, con tres respuestas simuladas en el navegador (422, 404 y el pedido cortado) | Pasa: «Alguna de las preguntas pedidas no es pertinente para esta área. Revisá las preguntas o el área.»; «No encontramos un recurso disponible para esta acción.», con una pregunta al resumen; «No pudimos confirmar el resultado. Reintentá.» | Verificado automáticamente, sobre respuestas simuladas |
| A 1440 y a 1280 px el cajón mide 800 px, pegado al borde derecho y de arriba a abajo, y la página sigue a la vista a su izquierda; a 1024 px ocupa todo el ancho. En los tres el pie queda adentro de la ventana, nada desborda de costado y axe no encuentra faltas con un formulario elegido y un rechazo a la vista (F-56) | Lo mismo | Pasa: quedan 640 y 480 px de la página a la vista | Verificado automáticamente |
| **Lo que escribe.** Al enviar sale un solo pedido, con lo que quedó elegido: las preguntas marcadas (no la que se desmarcó), en el orden del formulario, la requerida, el para qué y el área. El cajón se cierra, la página queda en «Solicitudes» y lo dice; la lista se vuelve a leer y tiene una más, primera y sin responder, y las cantidades de las vistas suben. El pedido siguiente empieza de cero (F-05) | Lo mismo: lo que guardó la API se lee después de enviar | Pasa: un pedido; dos preguntas, una requerida, Nutrición; «Solicitud enviada.»; «Todas 4 · Sin responder 2» | Verificado automáticamente |
| Llegando desde Entrenamiento, el cajón se abre con la precarga ratificada (DL-100): seis preguntas, cinco requeridas, el para qué y el área fija; lo dice, y no dice «Vienen todas elegidas». Cerrarlo deja a la persona en «Solicitudes», con «Volver a Entrenamiento» en el marco, y al reabrirlo la precarga sigue. Al enviar sale un solo pedido con eso y se vuelve a Entrenamiento, que al llegar dice «Solicitud enviada.» (F-57) | Lo mismo: la precarga está escrita a mano en el recorrido | Pasa | Verificado automáticamente |
| «Solicitar contexto», en el marco de la ficha, abre «Pedir información» sobre las solicitudes de la persona, con su retorno a la ficha; cerrarlo y volver sin enviar no crea ninguna solicitud | `recorrido-comprension.mjs funcional`, comprobación R3, adaptada: antes hacía clic en el retorno con la página del pedido a la vista; ahora cierra primero el cajón, que retiene el foco. Lo que protege no cambió | Pasa | Verificado automáticamente |
| Las reglas: las vistas, el valor con su unidad, con qué se responde una pregunta, la respuesta que rige por pregunta pedida, «Corregida» y «Antes», la historia, la cadena sin resolver y los textos | `packages/domain/src/solicitudes-de-informacion.test.ts`, en la batería | 18 de 18 | Verificado automáticamente |
| Ningún texto escrito en las pantallas de Información usa un término prohibido de formularios | `scripts/copy-pantallas.test.cjs`, con un bloque nuevo para la carpeta `forms` | Pasa | Verificado automáticamente |
| Quien inicia sesión desde Información vuelve a Información; un pedido a medio armar no se retoma (se vuelve a las solicitudes) | `scripts/retorno-seguro.test.mjs` | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 316 de 316, descartable 22 de 22, mediciones 18 de 18, solicitudes 32 de 32 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 13:08 a 13:49, sobre el código de `11dfd32`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-4/resumen-de-la-pasada.txt`. Una pasada anterior, empezada sobre `07285ac`, se cortó a los dos minutos para corregir lo que mostraron las capturas | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre los commits de código | En verde las tres corridas: 38260666114 sobre `1a876db`, 38268292846 sobre `07285ac` y 38280316620 sobre `11dfd32`. En cada una: el legajo; la batería completa (typecheck; dominio, 692 en las dos últimas, con las 18 nuevas; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440 px en sus estados (la lista; una solicitud corregida, una respondida y una sin responder; la historia abierta; una vista; la ayuda; dos fallas; y el cajón vacío, con un formulario de tres preguntas, con el de seis, con las aclaraciones, con lo que falta y llegando desde Entrenamiento) y a 1280 y 1024 px, en los dos temas | `ver.mjs`, sobre las cuentas descartables recién generadas | 51 capturas de ahora (`parte-4/ahora/`: 46 a 1440, 1280 y 1024 px, en los dos temas, y 5 a 768 y 390 px, en Claro) y 22 de antes (`parte-4/antes/`). `parte-4/solicitudes-antes-y-ahora.png` y `parte-4/pedido-antes-y-ahora.png`. Las dos capturas de fallas son sobre respuestas simuladas | Observado en una captura real |

Las comprobaciones negativas van con una positiva de la misma consulta: «ningún renglón lleva un botón Ver detalle» (el
botón «Pedir información» está), «una sin responder no tiene tabla ni Declarado por la persona» (una respondida los
tiene), «al abrirse el cajón no lee ninguna versión» (al elegir un formulario lee una), «un rechazo por pertinencia no le
pregunta nada al resumen» (el «no disponible» le pregunta una vez), «el cajón no dice Le llega» (dice «La va a ver»), y
«con las aclaraciones cerradas no hay ninguna a la vista» (al pedirlas están las cinco que ese formulario tiene).

**La prueba de la prueba.**

- **Las reglas, rotas de a una** (`resultados/calculo-roto-de-a-una-regla.txt`): 41 roturas del módulo del dominio, cada
  una contra sus pruebas. **La primera corrida notó 36: cinco mostraron pruebas que faltaban.** Dos eran de «Antes» con
  dos correcciones (tomar el valor más viejo en vez del último distinto, o mirar solo la versión inmediata anterior):
  ninguna prueba tenía una pregunta que cambiara dos veces, ni una que cambiara en la primera corrección y quedara igual
  en la segunda. Una, el código de una pregunta en una fila sin valor, cuando el formulario no se pudo leer. Y dos,
  textos que llevan un dato («2 de 3 elegidas.» con los números cruzados; «Este formulario es solo de…» sin el área).
  Se sumaron dos pruebas y se reforzó una: con 18 pruebas se notan las 41.
- **La pantalla, rota y compilada así, en seis tandas** (`resultados/compilacion-rota-tanda-S.txt`, `-T`, `-D`, `-U`, `-V`
  y `-W`). Contra `solicitudes`: 22 roturas del website, 7 más sobre comprobaciones que protegen más de una cosa, y 6 de
  las reglas del dominio, en su fuente. Contra `recorrido-comprension.mjs funcional`, una (el cajón con otro título: la
  nota R3). Contra `areas`, una («Solicitudes» con el ancho de antes: la nota F-10, que esta parte puso al día). **Se
  notaron 36 de 37, cada una por su comprobación, y ninguna otra falló sin que se la esperara.**
- **La que no se notó mostró una rotura mal elegida, no un hueco.** Era «al abrirse el cajón, el foco no va al título»,
  hecha sacando la línea que se lo pide. El foco quedó igual en el título: el navegador lo lleva solo a lo primero que
  lo admite, y es el título. Lo que la comprobación protege es dónde queda el foco, no esa línea. Se rehízo —el título
  deja de admitir el foco, y entonces cae en «Cerrar»— y se corrió sola (tanda W): se nota. La línea se conserva, con su
  motivo escrito: que el foco quede en el título no tiene que depender de cómo lo resuelva cada navegador.
- Que el recorrido note una rotura de las reglas del dominio muestra que lo que espera no sale del módulo que arma la
  pantalla.
- **Las comprobaciones de «Solicitudes» y del cajón pasaron todas en su primera corrida completa:** ninguna se había
  visto fallar. Por eso cada una tiene su rotura. La que se sumó después de mirar las capturas («Requerida», al lado
  de su pregunta) se corrió primero sobre la compilación que tenía el defecto, y falló por lo que tenía que fallar: las
  cinco etiquetas abajo, aunque entraban al lado.

**Lo que encontraron las comprobaciones y las capturas, y qué se hizo.**

- **El primer recorrido con el cajón no pasó de la entrada.** El cajón está siempre en la página, cerrado, para que lo
  armado no se pierda; y cerrado dejaba adentro el «Cargando…» de un catálogo que no se lee hasta abrirlo. No se veía,
  pero estaba: la espera del recorrido («nada cargando») no terminaba. Ahora el cajón dibuja su contenido solo mientras
  está abierto, y lo armado vive en quien lo abre.
- **Las aclaraciones de las preguntas empujaban el paso 3 fuera de la ventana.** El plan las ponía siempre a la vista,
  debajo de cada pregunta; con el formulario de seis preguntas la tabla medía el doble. Lo mostró la primera captura.
  Quedaron a un clic, para todas a la vez, y «Responde con» pasó a una columna más angosta: las preguntas entran en un
  renglón.
- **Cada pregunta requerida ocupaba un renglón de más.** En el detalle, «Requerida» bajaba sola a un renglón propio
  cuando la pregunta ocupaba dos, aunque entrara al lado de su última palabra: la solicitud de seis preguntas medía
  1.271 px. Lo mostraron las capturas de la evidencia, con la pasada completa recién empezada: se cortó, se corrigió y
  se corrió todo de nuevo sobre la compilación final. Ahora la etiqueta sigue al texto.
- **Una captura de «antes» mal rotulada.** La que iba a mostrar la solicitud respondida de seis preguntas tocó el primer
  «Ver detalle», que era el de la solicitud sin responder, y quedó igual a esa. No está en la evidencia: de esa
  solicitud no hay un «antes» medido.
- **Un cambio del marco, visto antes de compilar.** El cajón necesita decir de quién es el pedido, que el marco tapa.
  Pasar ese dato por el mismo contexto que el marco usa para avisar un «no disponible» hacía que, al llegar el nombre, el
  marco preguntara el acceso dos veces: es lo que cuida la nota F-09 del recorrido de las áreas. Va por un contexto
  aparte.
- **La comprobación del ancho de las secciones** (F-10, de la parte 0) falló al recomponer «Solicitudes»: esperaba una
  sola sección de entrada a todo el ancho, «Tomas». Se puso al día, nombrando las dos; su rotura se notó.
- **R3,** la comprobación de «Solicitar contexto», se adaptó en el mismo commit que el cajón.
- **Dos defectos de antes, que quedaban a la vista al reescribir:** el éxito de un pedido hecho desde Entrenamiento no se
  veía (se guardaba en la página que se abandonaba), y quien iniciaba sesión desde Información volvía a Cuenta. Los dos
  tienen su comprobación.
- **Un nombre repetido** en el recorrido lo frenó antes de correr: lo mostró la revisión de sintaxis.

**Lo que esta parte no comprueba:**

- El uso real: falta que Dirección abra una solicitud corregida, arme un pedido y diga si el cajón le alcanza.
- **La cadena de correcciones que no se puede resolver, en pantalla.** La API no la produce con datos válidos: está
  probada en el dominio (ninguna versión rige, y se dice), no en una captura.
- **Dos correcciones de una misma respuesta, un «Sí» o un «No» respondido, y un formulario con más de una sección:** no
  están en los datos (la única pregunta de «Sí o no» está en la solicitud sin responder; los tres formularios tienen una
  sección). Sus reglas tienen pruebas en el dominio; en pantalla no se vieron.
- **Más de veinte solicitudes respondidas,** o una lista que llegue incompleta («Al menos N»): el escenario tiene tres.
- **Los rechazos de verdad.** Los tres se miraron con respuestas simuladas en el navegador. Con la configuración de hoy
  la API no rechaza ningún pedido por pertinencia (las cuatro categorías de datos se pueden pedir en las tres áreas:
  `MATRIZ_DE_PERTINENCIA`), y las cuentas descartables tienen acceso a las tres áreas: no hay cómo provocar un «no
  disponible» sin retirarlo.
- El aviso «Solicitud enviada.» con «Volver a la ficha, donde estabas», cuando se llegó desde la ficha: el recorrido
  entra sin retorno. El enlace es el de siempre (no cambió).
- **El foco al abrir:** en el cajón va al título; en los paneles de la ficha y de las áreas va a «Cerrar». Son dos
  reglas.
- 768 y 390 px: sin comprobaciones propias. Se miraron en capturas: a 768 px el cajón ocupa todo el ancho, con su tabla;
  a 390 px, una pregunta por bloque, con «Responde con» y «Requerida» escritos, y el botón siempre a la vista; el
  detalle de una solicitud se abre como un diálogo y se lee.
- Lector de pantalla con una persona: pendiente. Se verificaron axe, el nombre de cada casilla («Requerida: {pregunta}»),
  el foco al abrir y al cerrar, Escape, y el foco en lo primero que falta.

**Para decidir, sin urgencia.**

1. **La descripción de dos formularios trae una cita interna** («…(CAND-10-TRN-A)», «…(08:201-204)»). Es parte del dato
   del catálogo, y la pantalla no lo recorta: sacarla pide una versión nueva de esos formularios.
2. **«Solicitar contexto» (en la ficha y en Entrenamiento) y «Pedir información» (en el área)** son la misma acción con
   dos nombres. Unificarlos toca el marco de la ficha y un texto de Entrenamiento.
3. **El foco al abrir un panel:** al título, como el cajón, o a «Cerrar», como los paneles de hoy.
4. **Si la nota «Vienen todas elegidas: desmarcá las que no necesites» alcanza** para que no se pida de más (DL-131). Se
   ve con el uso.
5. **Que la lista de la API diga si una respuesta fue corregida:** ahorra una lectura por solicitud respondida al entrar.
