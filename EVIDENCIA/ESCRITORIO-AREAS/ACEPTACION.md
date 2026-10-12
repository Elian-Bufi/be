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
