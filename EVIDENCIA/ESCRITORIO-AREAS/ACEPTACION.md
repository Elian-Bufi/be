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

## Parte 5 · Nutrición · Plan activo (2026-10-12)

«Plan», de Nutrición, pasó de una página con la versión en preparación, el plan activo y el historial uno debajo del
otro —todos los días tipo y todas las comidas, abiertos— a la lectura de la maqueta 16: **el plan activo de a un día
tipo, con las comidas plegadas, las opciones lado a lado, el objetivo del día de esa versión a la vista y el historial
al costado; y, cuando hay una versión en preparación, un selector para mirar una u otra.** No se quitó ninguna función:
«Crear nueva versión a partir de esta», «Crear nuevo plan», «Guardar como plantilla» y «Empezar desde una plantilla»
hacen lo mismo que antes, y `vista=plan` abre lo mismo desde la ficha, desde un pendiente y desde una revisión aplicada.
La versión en preparación sigue en el editor de siempre: su recomposición es la parte 7. No cambian la API, la base ni
la APK: los textos que la APK comparte no se tocaron. Sobre la base propia (`be_test_escritorio`, regenerada antes de
cada pasada) y la compilación estática del código de esta parte (`601ff01`).

**Lo que la maqueta dibuja y no entró,** dicho en la definición (§6): la estimación de cada opción y «lo que cubren las
opciones», que la lectura del plan del profesional no trae (C-36), y los rangos de macros por día tipo y por comida, que
son un dato que BE no tiene. La pantalla no deja su lugar ni los anuncia. «Ver la opción 3» tampoco está: sin la
estimación al lado, las opciones entran todas (F-60).

**Medido en la página real.** El asesorado A tiene un plan de un solo día tipo, con cuatro comidas. Para mirar lo que A
no tiene se armó, por la API y en las cuentas descartables, un plan de dos días tipo con comidas de una, dos y tres
opciones, una opción que nació de una receta y un ítem con su nota (`datos/generar.mjs descartable-plan`). El «antes»
es la pantalla como quedó al cerrar la parte 4, con esos mismos datos, medida antes de tocar nada.

| A 900 px de alto | Antes | Ahora |
|---|---|---|
| El plan de A (un día tipo), a 1440 px | 2.248 px | 900 px: entra en la ventana |
| Lo mismo, a 1280 y a 1024 px | 2.248 px | 900 px y 1.067 |
| El plan de dos días tipo, a 1440 px | 3.621 px: los dos días, uno debajo del otro | 900 px: entra en la ventana (la última comida termina a los 765 px) |
| Lo mismo, a 1280 y a 1024 px | 3.621 px | 900 px y 1.085, con el historial debajo |
| El mismo plan, con las cuatro comidas del día abiertas, a 1440 px | — (antes no se podían plegar) | 1.505 px (1.636 a 1280 y 1.762 a 1024) |
| Con una versión en preparación, a 1440 px | El editor y, debajo, el plan activo y el historial (no se midió antes de tocar: el plan de dos días tipo no tenía una versión en preparación) | Arriba, el selector; se ve una versión o la otra. El editor, que no cambió, mide 9.045 px con ese plan; la activa, 900 |

**Las lecturas.** Para ver el plan se leen tres cosas, una vez cada una: la lista de versiones (entera, no su primera
página), la versión vigente y el objetivo vigente. Las plantillas ya no se leen al entrar: se leen al abrir su diálogo.
Si la versión cita un objetivo que no es el vigente, se lee además la lista de objetivos. Elegir un día tipo, abrir o
plegar comidas y pasar de una versión a la otra no le pide nada a BE.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| El plan activo se presenta en un renglón: «Plan activo», «Solo lectura» y «Versión N · activada el … · es lo que ve el asesorado», con el número que le toca por su orden de activación. Para verlo se leen tres cosas, una vez cada una (F-62) | `recorrido.mjs planes`: corre solo, sobre las cuentas descartables recién generadas con su plan de dos días tipo, y no toca los datos de A, B ni C. Lo esperado se calcula a mano con lo que devuelve la API (`esperadoDelPlan`): no se usa el módulo que arma la pantalla | Pasa: «Versión 2 · activada el 12 oct · es lo que ve el asesorado»; 1 lectura de la lista, 1 de la versión, 1 del objetivo y ninguna otra de Nutrición | Verificado automáticamente |
| Con más de un día tipo, el plan se lee de a uno: un control con el nombre de cada día, en el orden del plan, y elegido el primero. A la vista, solo las comidas de ese día (F-58) | Lo mismo | Pasa: «Día de entrenamiento» (elegido) y «Día de descanso»; «4 comidas» | Verificado automáticamente |
| Las comidas van plegadas, cada una en un renglón con su cantidad de opciones y, plegada, los nombres de sus opciones; abierta la primera, con los ítems de la API. Con una sola opción dice «1 opción», sin «se elige una» (F-59) | Lo mismo, comida por comida | Pasa: «Almuerzo · 3 opciones · se elige una · Arroz con pollo y brócoli · Guiso de lentejas · Salmón con papa»; «Merienda · 1 opción» | Verificado automáticamente |
| El objetivo del día de la versión está a la vista, al lado del día tipo: calorías, carbohidratos, grasas y proteínas, en ese orden. Son los de la API (F-63) | Lo mismo | Pasa: 2.250 kcal · 220 g · 65 g · 130 g | Verificado automáticamente |
| El historial va al costado de las comidas, a la altura de la primera: las versiones activadas, de la más nueva a la más vieja, con su número, su día y su hora, y cuál es la vigente; al pie, la huella de la instantánea (F-64) | Lo mismo: mide dónde empieza cada caja | Pasa: «Versión 2 · activada el 12 oct, 17:09 · vigente» y «Versión 1 · … · anterior, conservada»; el historial y la primera comida empiezan a la misma altura | Verificado automáticamente |
| A 1440 × 900 el plan entra en la primera pantalla: el día tipo, el objetivo, las cuatro comidas (una abierta) y el historial (F-70) | Lo mismo | Pasa: la última comida termina a los 765 px y el historial, a los 614 | Verificado automáticamente |
| Sin una versión en preparación, y con objetivo vigente, las acciones son tres, en su orden: «Guardar como plantilla», «Empezar desde una plantilla» y «Crear nueva versión a partir de esta». Entrar no lee las plantillas (F-67) | Lo mismo | Pasa: 0 lecturas de plantillas al entrar | Verificado automáticamente |
| Lo elegido vive en la dirección: elegir el segundo día tipo escribe «dia» y deja abierta su primera comida; abrir otra escribe «comidas»; «Abrir todas las comidas» pasa a «Plegar todas», que escribe «ninguna»; volver al primer día limpia la dirección. Nada de eso le pide algo a BE (F-66) | Lo mismo | Pasa: `dia=2`; `comidas=1.2`, `1.2.3`, `ninguna` y, al volver, nada; 0 pedidos | Verificado automáticamente |
| «Actualizar» vuelve a leer las tres cosas y conserva el día tipo y la comida abierta, que no es la primera (F-66) | Lo mismo | Pasa: «Almuerzo», de «Día de descanso», antes y después; 1 lectura de cada cosa | Verificado automáticamente |
| Una dirección con valores que el plan no tiene (un día 9, una comida 7, una versión desconocida) no rompe ni muestra un día vacío (F-66) | Lo mismo | Pasa: el plan activo, en su primer día tipo, con las comidas plegadas | Verificado automáticamente |
| Con todas las comidas abiertas, cada una muestra todas sus opciones, con los ítems de la API. Las tres del almuerzo están lado a lado, a la misma altura, y ninguna queda detrás de un «ver la opción 3». Con una sola opción, el título no lleva número (F-60) | Lo mismo: mide dónde quedó cada opción | Pasa: tres opciones en tres columnas, a la misma altura; «Yogur con manzana», sin «Opción 1:» | Verificado automáticamente |
| Una opción que nació de una receta lo dice con las palabras de BE, y sus ítems son los de la API. La nota de un ítem se lee debajo (F-61) | Lo mismo | Pasa: «Receta «Guiso de lentejas», versión 1 · La opción lleva los ingredientes de una porción de la receta.»; «Aceite de oliva · 10 g · crudo · Nota: En crudo, al servir.» | Verificado automáticamente |
| En toda la sección, con todo abierto, no hay un porcentaje ni una palabra de la lista de Nutrición (F-70) | Lo mismo, con el detector del dominio; la misma consulta encuentra los nombres de las comidas y «se elige una» | Pasa | Verificado automáticamente |
| «Plan» tiene su ayuda en el marco del área: se abre por el título, Escape la cierra y el foco vuelve al botón; no usa palabras de la lista (F-14) | Lo mismo, con axe | Pasa: «Cómo se lee el Plan», 11 renglones | Verificado automáticamente |
| axe no encuentra faltas en «Plan» con todas las comidas abiertas, en los dos temas (F-70) | Lo mismo | Pasa | Verificado automáticamente |
| A 1440 px con todo abierto, y a 1280, 1024, 768 y 390 con una comida abierta, ningún renglón empieza con el separador « · » ni deja un número lejos de su unidad (F-70) | Lo mismo: mira dónde quedó cada letra en la pantalla | Pasa: 40 textos a 1440 px; 56 ocupan más de un renglón, sumando los cinco anchos | Verificado automáticamente |
| El historial sigue al costado a 1280 px y pasa debajo de las comidas a 1024; las opciones se acomodan al ancho de su caja (a 390 px, una por fila) y ninguna queda más angosta de 250 px. En los cuatro anchos la página no desborda (F-70) | Lo mismo | Pasa: con el almuerzo abierto, 1.147 px de alto a 1280 (dos opciones por fila), 1.272 a 1024 (tres), y una por fila a 390 | Verificado automáticamente |
| Sin plan y sin objetivo, la sección lo dice y ofrece «Ir a Resumen», y ninguna acción para crear. Sin plan y con objetivo, «Crear nuevo plan», primero, y «Empezar desde una plantilla». No se dibuja un historial vacío (F-68) | Lo mismo, con respuestas simuladas en el navegador: el escenario no tiene esos estados | Pasa | Verificado automáticamente, sobre respuestas simuladas |
| Si hoy rige un objetivo más nuevo que el de la versión, la tira muestra el de la versión y lo dice. Si hoy no hay objetivo vigente, también, y en lugar de «Crear nueva versión» explica que primero hay que definir el objetivo (F-63) | Lo mismo, con respuestas simuladas | Pasa: 2.250 kcal (no las 2.600 del objetivo simulado) y «Es el objetivo con el que se armó esta versión. Hoy rige uno más nuevo.» | Verificado automáticamente, sobre respuestas simuladas |
| Si el objetivo de la versión no se puede leer, el plan se ve entero y la tira lo dice, sin ningún número, con «Reintentar»; al reintentar, aparece (F-63) | Lo mismo, con un 503 simulado | Pasa: «No pudimos leer el objetivo de esta versión.», con las cuatro comidas a la vista | Verificado automáticamente, sobre una falla simulada |
| Si la lista de versiones no se puede leer, la sección dice la falla con su motivo y «Reintentar»; no dice «Todavía no hay un plan activo» (F-68) | Lo mismo, con un 503 simulado | Pasa | Verificado automáticamente, sobre una falla simulada |
| Con siete días tipo de nombre largo, a 1024 px, los siete segmentos están enteros dentro de la pantalla, en más de un renglón, y el elegido es el que pide la dirección (F-58) | Lo mismo, con una respuesta simulada | Pasa: 7 segmentos en 4 renglones; ninguno pasa de los 993 px | Verificado automáticamente, sobre una respuesta simulada |
| Con un solo día tipo no hay nada que elegir: la pantalla dice su nombre, sin control (F-58) | Dos veces: con una respuesta simulada, en `planes`; y de verdad, con el plan del asesorado A, en `recorrido.mjs funcional` (`plan`) | Pasa: «Día tipo Día de entrenamiento» y «Día tipo Día habitual» | Verificado automáticamente |
| «Guardar como plantilla» guarda la versión activa con una sola escritura y lo avisa. «Empezar desde una plantilla» abre un diálogo que recién entonces lee las plantillas, una vez: está la que se guardó, con sus comidas contadas a mano; ninguna viene elegida, y crear el borrador está apagado hasta elegir (F-67) | `planes`, que escribe de verdad | Pasa: 1 escritura; 1 lectura al abrir; «7 comidas · Sin cantidades»; 0 elegidas | Verificado automáticamente |
| Si las plantillas no se pueden leer, el diálogo dice la falla con su motivo y «Reintentar», y no «No tenés plantillas activas»; al reintentar, la lista aparece. Con la lista vacía de verdad, dice que no hay y dónde se arman (F-67) | Lo mismo, con un 503 y una lista vacía simulados | Pasa: «No pudimos leer tus plantillas · BE no está disponible en este momento. Reintentá en unos minutos.» | Verificado automáticamente, sobre respuestas simuladas |
| Elegida una plantilla, crear el borrador se enciende. Si esa escritura falla, el motivo se dice dentro del diálogo, que sigue abierto con la plantilla elegida (F-67) | Lo mismo, con un 503 simulado sobre la escritura | Pasa: «El servicio no está disponible en este momento. Probá de nuevo más tarde.» | Verificado automáticamente, sobre una falla simulada |
| «Crear nueva versión a partir de esta» hace una sola escritura. Aparece el selector de versión, con «En preparación» elegida y «El asesorado no la ve.»; la activa figura como «2 · activa». Se ve el editor, y ya no se ofrece crear otra versión (F-65) | `planes`, que escribe de verdad; la API confirma que la versión nueva sucede a la activa | Pasa: 1 escritura; «Borrador creado» | Verificado automáticamente |
| Con cambios sin guardar, pasar a «2 · activa» muestra el plan activo y deja el editor fuera de la vista; volver a «En preparación» lo muestra con lo escrito intacto. Ir y volver no le pide nada a BE, y la versión y el día tipo elegidos quedan en la dirección (F-65) | Lo mismo: escribe en el nombre de una comida, va, elige otro día tipo, vuelve y lee el campo | Pasa: «Desayuno» → «Desayuno (ajuste)», antes y después; 0 pedidos; en la activa, «Ya hay una versión en preparación: se sigue sobre esa.» | Verificado automáticamente |
| Con cambios sin guardar, «Actualizar» pregunta antes de volver a leer y dice qué se perdería; «Seguir editando» deja todo como estaba (F-65) | Lo mismo | Pasa: «Tenés cambios sin guardar… en el plan en preparación.» | Verificado automáticamente |
| Activar la versión en preparación la convierte en la vigente: el selector desaparece, el plan dice «Versión 3 · … · es lo que ve el asesorado», su primera comida lleva el nombre que se escribió, el historial lista las tres y la dirección queda limpia (traía el segundo día tipo) (F-65) | Lo mismo: guarda y activa por la pantalla; lo que quedó se lee de la API | Pasa: «Desayuno (ajuste)»; la 3, vigente; la 2 y la 1, conservadas; 1 escritura de activación | Verificado automáticamente |
| Elegida la plantilla, «Crear el borrador desde esta plantilla» hace una sola escritura: el diálogo se cierra, la pantalla lo avisa y queda una versión en preparación que la API reconoce como salida de esa plantilla. El selector vuelve, con «3 · activa» (F-67) | Lo mismo | Pasa | Verificado automáticamente |
| El plan de A dice su versión con una fecha de otro mes y sin el año; el historial, sus dos versiones con día y hora; la tira, el objetivo de la API (F-62) | `recorrido.mjs funcional` (`plan`), con los datos de A; solo lee | Pasa: «Versión 2 · activada el 7 sept · es lo que ve el asesorado»; «activada el 7 sept, 09:30» y «el 21 jul, 09:00» | Verificado automáticamente |
| En la ficha, el detalle de la activación muestra la misma pieza en su columna: el día tipo, las comidas de la API con la primera abierta y sus opciones una debajo de la otra; nada se sale de la columna; los títulos bajan un nivel; abrir otra comida no toca la dirección de la ficha (F-69) | Lo mismo: mide cada elemento contra la caja del detalle | Pasa: columna de 480 px; 2 opciones en una columna; 0 elementos afuera | Verificado automáticamente |
| El detalle de un plan activado sigue abriendo con «Versión N · activada el» y «Ver en Nutrición · Plan» (E-74) | `recorrido.mjs funcional` (`linea`), que no se tocó | Pasa | Verificado automáticamente |
| Las reglas: el número de una versión, el historial y la vigente, el día tipo que pide la dirección, las comidas abiertas y lo que se escribe en la dirección, cuántas opciones tiene una comida, el título de una opción, lo indicado de un ítem y los textos | `packages/domain/src/plan-de-nutricion.test.ts`, en la batería | 12 de 12 | Verificado automáticamente |
| Ningún texto escrito en las pantallas de Nutrición usa un término prohibido | `scripts/copy-pantallas.test.cjs`, que recorre la carpeta `nutrition` entera: los archivos nuevos entran solos | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 320 de 320 (los 316 de antes y los 4 de `plan`), descartable 22 de 22, mediciones 18 de 18, solicitudes 32 de 32, planes 33 de 33 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 16:27 a 17:16, sobre el código de `601ff01`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-5/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código | En verde la corrida 38303338236, sobre `601ff01`: el legajo; la batería completa (typecheck; dominio, 704, con las 12 nuevas; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440, 1280 y 1024 px en los dos temas (el plan de A; el de dos días tipo al entrar, con una comida abierta y con todas; el segundo día tipo; la ayuda; «Guardar como plantilla»; el selector con una versión en preparación; y la pieza en la ficha), a 1920 px, y a 768 y 390 px | `ver.mjs`, sobre el asesorado A y sobre las cuentas descartables recién generadas; y `recorrido.mjs planes`, para los estados simulados y los diálogos | 51 capturas de ahora (`parte-5/ahora/`: 39 de `ver.mjs` y 12 del recorrido; ocho son sobre respuestas simuladas, y lo dicen en su nombre) y 12 de antes (`parte-5/antes/`). `parte-5/plan-de-dos-dias-antes-y-ahora.png` y `parte-5/plan-de-un-dia-antes-y-ahora.png`. De la versión en preparación va solo la parte de arriba, donde está el selector: el editor no cambió | Observado en capturas |

Las comprobaciones negativas van con una positiva de la misma consulta: «no hay un porcentaje ni una palabra de la
lista» (los nombres de las comidas y «se elige una» están), «entrar no lee las plantillas» (abrir el diálogo las lee una
vez), «ninguna plantilla viene elegida» (al elegir una, el botón se enciende), «sin plan no se dibuja un historial» (con
plan está, con sus versiones), «con una versión en preparación no se ofrece crear otra» (sin ella, se ofrece), y «con
la falla, el diálogo no dice No tenés plantillas» (con la lista vacía de verdad, lo dice).

**La prueba de la prueba.**
- **Las reglas del dominio, rotas de a una** en una copia (el módulo verdadero no se toca): 35 roturas. La primera corrida
  notó 34. La que quedó mostró una prueba que faltaba —que no se escriba en la dirección una comida que el día no
  tiene—; con ella, 35 de 35 (`resultados/calculo-roto-de-a-una-regla.txt`).
- **La pantalla, rota a propósito y compilada así,** en cuatro tandas: 34 roturas, las 34 notadas por la comprobación
  que se esperaba, y ninguna comprobación falló sin que se la esperara (`resultados/compilacion-rota-tanda-*.txt`). La
  P, 20 roturas sobre `planes`; la Q, 8 más sobre `planes`, para las comprobaciones que en la P caían de rebote o no
  tenían rotura; la D, 3 en las reglas del dominio, que muestran que lo esperado por el recorrido no sale del módulo que
  arma la pantalla; y la A, 3 sobre `plan`, la parte de solo lectura. Antes de las tandas, el recorrido de control pasó
  33 de 33.
- **Dos comprobaciones no tienen una rotura propia:** «Actualizar conserva lo elegido» y «Actualizar pregunta con cambios
  sin guardar». Las dos fallaron de rebote en la tanda P, con la rotura de otra: eso muestra que pueden fallar, no que
  noten lo suyo.
- **La primera corrida del recorrido dio 32 de 33.** La que falló era la comprobación, no la pantalla: buscaba de qué
  plantilla salió la versión nueva en la lista de versiones, y la API lo dice en la lectura de la versión. Se corrigió
  la comprobación.

**Lo que mostraron las capturas, antes de la pasada larga.** Se miraron todas antes de lanzarla.
- La tira del objetivo dejaba 40 px entre cada rótulo y su número, y el ícono pegado al rótulo: en la tarjeta del
  Resumen la acomoda su caja, y acá no tenía quién. Se corrigió.
- El historial empezaba a la altura del renglón «4 comidas», no de la primera comida. Se alineó.
- A 1024 px, en una opción de receta, el separador « · » quedaba al principio del segundo renglón. Ahora va pegado a lo
  que tiene antes; la comprobación de los cortes (F-70) lo mira a cinco anchos.
- A 1280 px la huella de la instantánea se partía por la mitad. Ahora baja entera.
- Donde todavía no hay un plan, el aviso se estiraba de lado a lado para una sola frase, y la acción principal iba
  segunda. Ahora mide lo que mide su texto y «Crear nuevo plan» va primero.
- «Guardar como plantilla» iba con el borde azul de una acción secundaria con acento: pasó a ser una acción quieta, como
  en el dibujo.

**Hallazgos fuera de lo dibujado.**
- **La nota de un ítem no se veía en el website** (severidad media: el profesional no veía algo que su asesorado sí lee
  en la APK). Corregido en esta parte (F-60).
- **«Empezar desde una plantilla» presentaba una lectura fallida como «No tenés plantillas activas»** (media: una falla
  dicha como ausencia). Corregido (F-67).
- **Crear desde la activa y crear desde una plantilla compartían la clave de intento** (baja: solo después de un
  resultado incierto). Corregido (F-67).
- **El número de versión se calculaba con la primera página de la lista** (baja: no hay planes con tantas versiones).
  Corregido (F-62).
- **«Guardar como plantilla» responde distinto con una opción de receta según dónde se toque** (baja). No se cambió:
  es una decisión. DL-132, con tres opciones y una recomendación.
- **«2 unidad», sin plural,** en una cantidad que se mide en unidades (baja; está igual en la APK). No se cambió: §6 de
  la definición.

**Límites, dichos.**
- **La versión en preparación es el editor de antes,** dentro de la sección nueva: mide unas diez pantallas con el plan
  de dos días tipo. El selector lo saca de debajo del plan activo; ordenarlo es la parte 7.
- **A 1440 px, el renglón de la versión ocupa dos líneas** («Versión 2 · activada el 12 oct ·» y «es lo que ve el
  asesorado»): las tres acciones entran en el mismo renglón que el título y le dejan ese lugar. A 1280 y a 1024 las
  acciones bajan y la frase va entera. Con una ventana de 1920 px entra todo en un renglón (`ahora/plan-dos-dias-1920-claro.png`).
- **Los estados que el escenario no tiene se miraron con respuestas simuladas en el navegador** (sin plan, sin objetivo,
  un objetivo más nuevo, las tres fallas, siete días tipo, un solo día tipo en las cuentas descartables): la API y la
  base no se tocan, y lo que se comprueba es qué hace la pantalla con esa respuesta. El día tipo único se comprobó
  además de verdad, con el plan de A.
- **Una versión anterior no se puede abrir desde el historial:** no está dibujado y la pantalla de antes tampoco lo
  hacía. Se lee en la ficha, en la etapa que rigió.
- **El guion de WP-NUTRICION-RECETAS** (`recorrido-web.mjs`) contaba las recetas del plan activo con todo abierto: se le
  sumó el paso de abrir todas las comidas. No se corrió: usa su propio juego de datos y no está en la pasada.
- **Sin teléfono ni lector de pantalla reales:** el teclado, el foco y los nombres accesibles se comprobaron con el
  navegador y con axe.

**Dónde está.** `EVIDENCIA/ESCRITORIO-AREAS/parte-5/`: `ahora/` (51 capturas), `antes/` (12),
`plan-de-dos-dias-antes-y-ahora.png`, `plan-de-un-dia-antes-y-ahora.png`, `resumen-de-la-pasada.txt` y `resultados/`
(los resultados de cada recorrido, las pruebas y los veredictos de las roturas).

## Parte 6 · Entrenamiento · Plan activo (2026-10-12)

«Plan», de Entrenamiento, pasó de una página con la versión en preparación, el plan activo y el historial uno debajo del
otro —todos los bloques, las sesiones y los ejercicios, abiertos— a la lectura de la maqueta 24: **el plan activo de a
una sesión, con los ejercicios plegados, la tabla de objetivos por serie con lo general al lado y el historial al
costado; y, cuando hay una versión en preparación, un selector para mirar una u otra.** No se quitó ninguna función:
«Crear nueva versión a partir de esta», «Crear plan», «Guardar como plantilla» y «Empezar desde una plantilla» hacen lo
mismo que antes, y `vista=plan` abre lo mismo desde la ficha, desde un pendiente y desde una revisión aplicada. La
versión en preparación sigue en el editor de siempre: su recomposición es la parte 8. No cambian la API, la base ni la
APK: los textos que la APK comparte no se tocaron. Sobre la base propia (`be_test_escritorio`, regenerada antes de cada
pasada) y la compilación estática del código de esta parte (`883297d`).

**Lo que los dos planes comparten ahora vive en un solo lugar.** El renglón de la versión, el selector, el historial y
sus palabras son los mismos en Nutrición y en Entrenamiento: una pieza (`advisees/versiones-del-plan.tsx`) y unas reglas
(`versiones-de-plan.ts`, en el dominio). «Plan», de Nutrición, pasó a usar esa pieza: su recorrido (`planes`) volvió a
pasar entero en la pasada de esta parte.

**Lo que la maqueta no dibuja y se conservó,** dicho en la definición (F-72, F-74): el microciclo, que va en un renglón
propio solo cuando el bloque los usa; la lista para cinco o más sesiones; los parámetros del profesional, la referencia
del % RM y la imagen del ejercicio, en «Lo general».

**Medido en la página real.** El asesorado A tiene un plan de un bloque y dos sesiones, y una versión en preparación.
Para mirar lo que A no tiene se armó, por la API y en las cuentas descartables, un plan de dos bloques —uno con dos
microciclos—, con un ejercicio de objetivos distintos por serie (la carga, el RIR y el descanso), una serie sin descanso
recomendado, la nota de una serie y un ejercicio sin criterio de intensidad (`datos/generar.mjs
descartable-plan-de-entrenamiento`). El «antes» es la pantalla como quedó al cerrar la parte 5, con ese mismo plan,
medida antes de tocar nada (después se cambió un solo texto del plan: el propósito de un bloque, que usaba una palabra
de la lista).

| A 900 px de alto | Antes | Ahora |
|---|---|---|
| El plan de dos bloques, a 1440 px | 4.222 px: los dos bloques, con sus sesiones y sus ejercicios, uno debajo del otro | 994 px: entran el encabezado, lo que se elige, el primer ejercicio abierto (termina a los 803 px) y el historial; el último ejercicio plegado termina a los 930 |
| Lo mismo, a 1280 y a 1024 px | 4.222 px | 1.020 px y 1.217, con el historial debajo |
| La sesión que tiene el ejercicio con objetivos distintos por serie, a 1440 px | — (antes iba dentro de la página de 4.222 px) | 1.040 px (1.092 a 1280 y 1.264 a 1024) |
| La misma sesión, con sus tres ejercicios abiertos, a 1440 px | — (antes no se podían plegar) | 1.601 px (1.653 a 1280 y 1.825 a 1024) |
| El bloque que usa microciclos, a 1440 px | — | 900 px: entra en la ventana |
| El plan de A, que tiene una versión en preparación, a 1440 px | 22.699 px: el editor de la versión en preparación y, debajo, el plan activo y el historial | Arriba, el selector: se ve una versión o la otra. La activa, 993 px (998 a 1280 y 1.222 a 1024); el editor, que no cambió, 20.241 px |
| El detalle de la activación del plan, en la ficha | La página se rompía entera (`antes/la-ficha-se-rompia.txt`) | La pieza, en su columna de 480 px |

**Las lecturas.** Para ver el plan se leen tres cosas, una vez cada una: la lista de versiones (entera, no su primera
página), la versión vigente con sus objetivos por serie y el objetivo vigente. Las plantillas ya no se leen al entrar:
se leen al abrir su diálogo. Elegir un bloque, un microciclo o una sesión, abrir o plegar ejercicios y pasar de una
versión a la otra no le pide nada a BE. La imagen de un ejercicio se pide recién al abrirlo.

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| El plan activo se presenta en un renglón: «Plan activo», «Solo lectura» y «Versión N · activada el … · es lo que ve el asesorado», con el número que le toca por su orden de activación. Para verlo se leen tres cosas, una vez cada una; las plantillas no se leen al entrar (F-71) | `recorrido.mjs entrenamientos`: corre solo, sobre las cuentas descartables recién generadas con su plan de dos bloques, y no toca los datos de A, B ni C. Lo esperado se calcula a mano con lo que devuelve la API (`esperadoDelPlanDeEntrenamiento`): no se usa el módulo que arma la pantalla | Pasa: «Versión 2 · activada el 12 oct · es lo que ve el asesorado»; 1 lectura de la lista, 1 de la versión con sus objetivos por serie, 1 del objetivo y ninguna otra de Entrenamiento | Verificado automáticamente |
| Se mira una sesión por vez. Con dos bloques, un control con el nombre de cada uno y, al lado, cuántas sesiones tiene el elegido y su propósito. El primer bloque no usa microciclos, y no hay renglón de microciclo. Con dos sesiones, un control, elegida la primera, y «Sin día asignado: tu asesorado elige cuál hace.». Las indicaciones de la sesión se leen antes de sus ejercicios (F-72) | Lo mismo | Pasa: «Fuerza: progresión» (elegido) y «Descarga»; «2 sesiones · Propósito: Más carga, menos repeticiones»; «A · Tren inferior» (elegida) y «B · Tren superior» | Verificado automáticamente |
| Los ejercicios van plegados, cada uno en un renglón con lo que piden sus series, calculado a mano con los objetivos que da la API. Al entrar está abierto el primero: dice cuántas series tiene y con qué criterio, y muestra «Lo que recibe tu asesorado», serie por serie, y «Lo general del ejercicio». La sesión dice cuántos ejercicios y cuántas series tiene (F-73) | Lo mismo, ejercicio por ejercicio | Pasa: «3 ejercicios · 10 series»; «Sentadilla · 4 series · criterio de intensidad: RIR», abierto, con sus cuatro filas; «Peso muerto · 3 × 5 rep. · 85 kg · RIR 2 · descanso 03:00» | Verificado automáticamente |
| El historial va al costado de los ejercicios, a la altura del primero: las versiones activadas, de la más nueva a la más vieja, con su número, su día y su hora, y cuál es la vigente; al pie, la huella de la instantánea. A 1440 × 900 entran el encabezado, lo que se elige, el primer ejercicio abierto entero y el historial (F-76) | Lo mismo: mide dónde empieza y dónde termina cada caja | Pasa: «Versión 2 · activada el 12 oct, 20:28 · vigente» y «Versión 1 · … · anterior, conservada»; el historial y el primer ejercicio empiezan a la misma altura; el primer ejercicio termina a los 803 px | Verificado automáticamente |
| Cuánto mide «Plan» al entrar, a 1440 × 900 (F-80) | Lo mismo: lo mide y lo informa, sin compararlo con un tope | 994 px: el último ejercicio, plegado, termina a los 930 px. No entra entero en 900 | Medido |
| En un ejercicio con objetivos distintos por serie, cada serie muestra el suyo, el que resolvió la API: la carga, las repeticiones, el RIR y el descanso recomendado. Una serie sin descanso recomendado dice «Sin objetivo», no un cero ni un hueco. La nota de una serie se lee en su fila. Los valores heredados ya no llevan « · de la prescripción». «Lo general del ejercicio» dice la intensidad, cómo se cuenta la carga, qué cuentan las repeticiones y las notas (F-74) | Lo mismo, serie por serie | Pasa: «Press de banca»: 62,5 kg, 6–8 rep., RIR 2 y 02:30 en las dos primeras; RIR 1 en la tercera; y en la cuarta, 60 kg, RIR 1, «Sin objetivo» en el descanso y la nota «Si se pierde la técnica, cortar la serie.» | Verificado automáticamente |
| Plegado, un ejercicio con todas las series iguales se dice entero; uno sin criterio de intensidad lo dice; y el que tiene objetivos distintos no se resume con su primera serie ni con un rango: dice qué cambia «por serie». Abierto, dice cuántas series son y con qué criterio (F-73) | Lo mismo: los tres textos están escritos a mano en el recorrido | Pasa: «Press de banca · 4 series · 6–8 rep. · carga, RIR y descanso por serie»; «Remo con barra · 4 × 8–10 rep. · 47,5 kg · RIR 2 · descanso 02:00»; «Dominadas · 4 × 6 rep. · sin criterio de intensidad · descanso 02:00» | Verificado automáticamente |
| Lo elegido vive en la dirección, por su número de orden. Elegir la segunda sesión escribe «sesion»; abrir otro ejercicio, «ejercicios» con los dos; «Abrir todos los ejercicios» pasa a «Plegar todos», que escribe «ninguno». Elegir otro bloque escribe «bloque» y quita la sesión y los ejercicios, que eran del anterior; ese bloque usa microciclos, y aparece su renglón, con el propósito del elegido; elegir el segundo escribe «micro». Volver al primer bloque limpia la dirección. Nada de eso le pide algo a BE (F-75) | Lo mismo | Pasa: `sesion=2`; `ejercicios=1.3`, `1.2.3` y `ninguno`; `bloque=2`, con «Semana 1» y «Semana 2» y la sesión «Cuerpo completo»; `micro=2`; al volver, nada; 0 pedidos | Verificado automáticamente |
| «Actualizar» vuelve a leer las tres cosas y conserva lo elegido (el segundo bloque, su segundo microciclo y todos los ejercicios plegados). Una dirección con valores que el plan no tiene no rompe ni deja la pantalla vacía (F-75) | Lo mismo | Pasa: «Descarga · Semana 2», con todo plegado, antes y después; 1 lectura de cada cosa; con valores que no existen, «Fuerza: progresión · A · Tren inferior», con los ejercicios plegados | Verificado automáticamente |
| Con los tres ejercicios de la sesión abiertos, en toda la sección no hay una palabra de la lista de Entrenamiento ni un porcentaje que no sea «% RM». En cada ejercicio, «Lo general» va al lado de la tabla de series, a su misma altura (F-80) | Lo mismo, con el detector del dominio; la misma consulta encuentra el contenido | Pasa: 1.930 caracteres sin una palabra de la lista; la tabla termina a los 702 px del borde izquierdo y «Lo general» empieza a los 730 | Verificado automáticamente |
| «Plan» tiene su ayuda en el marco del área: se abre por el título, explica cada cosa que la pantalla escribe, sin palabras de la lista; Escape la cierra y el foco vuelve al botón (F-14) | Lo mismo, con axe | Pasa: «Cómo se lee el Plan», 12 renglones | Verificado automáticamente |
| axe no encuentra faltas en «Plan» con todos los ejercicios abiertos, en los dos temas (F-80) | Lo mismo | Pasa | Verificado automáticamente |
| El historial sigue al costado a 1280 px y pasa debajo de los ejercicios a 1024. «Lo general» sigue al lado de la tabla mientras entra, y pasa debajo cuando no (a 390 px). A 1280, 1024, 768 y 390 px la página no desborda de costado, y ningún renglón empieza con el separador « · » ni deja un número lejos de su unidad (F-80) | Lo mismo: mira dónde quedó cada letra en la pantalla | Pasa: con la sesión del ejercicio de objetivos distintos, 1.092 px de alto a 1280, con el historial al costado; 1.264 a 1024, con el historial debajo; 1.522 a 768 | Verificado automáticamente |
| Sin plan y sin objetivo, la sección lo dice y ofrece «Ir a Resumen», y ninguna acción para crear. Sin plan y con objetivo, «Crear plan», primero, y «Empezar desde una plantilla». Con plan y sin objetivo vigente, el plan se ve y, en lugar de «Crear nueva versión», explica que primero hay que definir el objetivo. Si la lista de versiones no se puede leer, dice la falla con «Reintentar», no que no hay plan (F-78) | Lo mismo, con respuestas simuladas en el navegador: el escenario no tiene esos estados | Pasa: «Ir a Resumen»; «Crear plan» y «Empezar desde una plantilla»; con plan y sin objetivo, solo «Guardar como plantilla» | Verificado automáticamente, sobre respuestas simuladas |
| Con seis sesiones para elegir, no hay seis botones: una lista, que dice cuál se mira y cuántas hay, y elegida la que pide la dirección; a 1024 px la página no desborda. Un bloque sin sesiones lo dice, y no muestra una lista vacía ni un ejercicio (F-72) | Lo mismo, con una respuesta simulada | Pasa: una lista de 6 y «4 de 6»; «Acá no hay sesiones.», y al lado del bloque, «sin sesiones» | Verificado automáticamente, sobre una respuesta simulada |
| Con el criterio % RM, «Lo general» dice la intensidad con su referencia, y los parámetros del profesional con su unidad (un número, con coma); la tabla no tiene columna de RIR, y la cabecera del ejercicio dice el criterio (F-74) | Lo mismo, con una respuesta simulada | Pasa: «4 series · criterio de intensidad: % RM»; «Intensidad: 72,5 % RM (1RM estimado en la última evaluación)»; «Tempo: 3-1-1»; «Pausa abajo: 1,5 s» | Verificado automáticamente, sobre una respuesta simulada |
| Un ejercicio con imagen la muestra en «Lo general», dibujada, con su texto alternativo y dentro de la tarjeta. Su acceso se pide una sola vez, y recién con el ejercicio abierto: plegado, no hay imagen ni pedido (F-74) | Lo mismo, con una imagen armada por el recorrido y las dos respuestas simuladas que la pantalla pide para mostrarla; el acceso se entrega solo si el pedido lleva la sesión de la página | Pasa: dibujada, 80 × 96 px; 1 pedido de acceso con el ejercicio abierto y 0 con el ejercicio plegado | Verificado automáticamente, sobre respuestas simuladas |
| «Guardar como plantilla» guarda la versión activa con una sola escritura y lo avisa. «Empezar desde una plantilla» abre el diálogo común, que recién entonces lee las plantillas de entrenamiento, una vez: está la que se guardó, con sus sesiones contadas a mano y «Sin cargas»; ninguna viene elegida y crear el borrador está apagado. Si esa lectura falla, el diálogo dice la falla con «Reintentar», no «No tenés plantillas activas» (F-77) | `entrenamientos`, que escribe de verdad; la falla, con un 503 simulado | Pasa: 1 escritura; 1 lectura al abrir; «4 sesiones · Sin cargas»; 0 elegidas; con la falla, «No pudimos leer tus plantillas» | Verificado automáticamente |
| «Crear nueva versión a partir de esta» hace una sola escritura y aparece el selector de versión, con «En preparación» elegida, «El asesorado no la ve.» y la activa como «2 · activa». Con cambios sin guardar, pasar a la activa muestra el plan activo (con «Guardar como plantilla» como única acción y la explicación de por qué no se crea otra) y deja el editor fuera de la vista; volver lo muestra con lo escrito intacto. Ir y volver no le pide nada a BE (F-79) | Lo mismo: escribe en el nombre del bloque, va a la activa, vuelve y lee el campo | Pasa: 1 escritura; «Fuerza: progresión» → «Fuerza: progresión (ajuste)», antes y después; 0 pedidos | Verificado automáticamente |
| Con cambios sin guardar, «Actualizar» pregunta antes de volver a leer. Guardar y activar la versión en preparación la convierte en la vigente: el selector desaparece, el plan dice «Versión 3 · … · es lo que ve el asesorado», su bloque lleva el nombre que se escribió, el historial lista las tres y la dirección queda limpia (traía la segunda sesión). El plan tiene objetivos distintos por serie, y se activa porque el titular ya usó una app que los muestra (F-79) | Lo mismo: guarda y activa por la pantalla; lo que quedó se lee de la API | Pasa: «Tenés cambios sin guardar…»; «Versión 3 · activada el 12 oct · es lo que ve el asesorado»; «Fuerza: progresión (ajuste)»; la 3, vigente; la 2 y la 1, conservadas | Verificado automáticamente |
| Elegida la plantilla, «Crear el borrador desde esta plantilla» hace una sola escritura: el diálogo se cierra, la pantalla lo avisa y queda una versión en preparación que la API reconoce como salida de esa plantilla. El selector vuelve, con «3 · activa» (F-77) | Lo mismo | Pasa | Verificado automáticamente |
| A tiene una versión en preparación: al entrar a «Plan» se ve el selector, con «En preparación» elegida, y el editor; el plan activo no está a la vista. Al elegir «N · activa» se ve el plan activo, con su versión y una fecha de otro mes sin el año, un solo bloque dicho por su nombre y los ejercicios de la API (F-79) | `recorrido.mjs funcional` (`plan-entrenamiento`), con los datos de A; solo lee | Pasa: «En preparación» (elegida) y «2 · activa»; «Versión 2 · activada el 7 sept · es lo que ve el asesorado»; «Bloque Fuerza progresión», sin control | Verificado automáticamente |
| En la ficha, el detalle de la activación de un plan de entrenamiento muestra la misma pieza en su columna, **y la página sigue en pie.** Dice la versión, el bloque y las sesiones; los ejercicios son los de la API, con el primero abierto; cada ejercicio ocupa el ancho de la columna y nada se sale, salvo la tabla, que se desplaza dentro de su caja; los títulos bajan un nivel; elegir la otra sesión no toca la dirección de la ficha (F-81) | Lo mismo: mide cada elemento contra la caja del detalle | Pasa: columna de 480 px; el ejercicio ocupa 438; 0 elementos afuera; al elegir «B · Tren superior», sus ejercicios | Verificado automáticamente |
| En la ficha, un ejercicio con imagen la muestra, dibujada, con su texto alternativo y dentro de la columna: el acceso que la pieza le pedía al contexto de la pestaña ahora se lo da la ficha, con la sesión de la página (F-81) | Lo mismo, con la imagen y las respuestas simuladas | Pasa: dibujada, 80 px de ancho; 1 pedido de acceso | Verificado automáticamente, sobre respuestas simuladas |
| Las reglas: lo que se mira del plan según la dirección, cuántas sesiones tiene un bloque, la cuenta de la sesión, la cabecera y el renglón de un ejercicio, la tabla de series, lo general y los textos; y las que comparten los dos planes (el número de una versión, el historial, lo elegido y lo abierto por su número de orden) | `packages/domain/src/lectura-del-plan-de-entrenamiento.test.ts` y `plan-de-nutricion.test.ts`, en la batería | 13 de 13 y 12 de 12 | Verificado automáticamente |
| Ningún texto escrito en las pantallas de Entrenamiento usa un término prohibido | `scripts/copy-pantallas.test.cjs`, que recorre la carpeta `training` entera: los archivos nuevos entran solos | Pasa | Verificado automáticamente |
| «Plan», de Nutrición, sigue igual después de pasar a la pieza común de las versiones | `recorrido.mjs planes` y `plan`, en la pasada de esta parte | Pasa: 33 de 33 y los 4 de `plan` | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | `recorrido.mjs`: capturas 60 de 60, funcional 324 de 324 (los 320 de antes y los 4 de `plan-entrenamiento`), descartable 22 de 22, mediciones 18 de 18, solicitudes 32 de 32, planes 33 de 33, entrenamientos 22 de 22 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 19:41 a 20:33, sobre el código de `883297d`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-6/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código | En verde la corrida 38322861573, sobre `883297d`: el legajo; la batería completa (typecheck; dominio, 717, con las 13 nuevas; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440, 1280 y 1024 px en los dos temas (el plan de A, por la activa; el de dos bloques al entrar, en la sesión del ejercicio con objetivos distintos y con sus tres ejercicios abiertos; el bloque con microciclos; la ayuda; el selector con una versión en preparación; y la pieza en la ficha), a 1920 px, y a 768 y 390 px | `ver.mjs`, sobre el asesorado A y sobre las cuentas descartables recién generadas; y `recorrido.mjs entrenamientos` y `plan-entrenamiento`, para los estados simulados y los diálogos | 42 capturas de ahora (`parte-6/ahora/`: 36 de `ver.mjs` y 6 del recorrido; 3 son sobre respuestas simuladas, y lo dicen en su nombre) y 12 de antes (`parte-6/antes/`). `parte-6/plan-de-dos-bloques-antes-y-ahora.png`. De la versión en preparación va solo la parte de arriba, donde está el selector: el editor no cambió | Observado en capturas |

Las comprobaciones negativas van con una positiva de la misma consulta: «no hay una palabra de la lista ni un porcentaje
que no sea % RM» (los nombres de los ejercicios y «Lo que recibe tu asesorado» están), «entrar no lee las plantillas»
(abrir el diálogo las lee una vez), «ninguna plantilla viene elegida» (al elegir una, el botón se enciende), «el
ejercicio con objetivos distintos no se resume con su primera serie» (el que tiene todas iguales sí dice su carga),
«sin microciclos no hay renglón de microciclo» (el bloque que los usa lo tiene), «plegado, la imagen no se pide»
(abierto, se pide una vez) y «con una versión en preparación no se ofrece crear otra» (sin ella, se ofrece).

**La prueba de la prueba.**
- **Las reglas del dominio, rotas de a una** en una copia (el módulo verdadero no se toca): 48 roturas, sobre las reglas
  de Entrenamiento · Plan y sobre las que comparten los dos planes. La primera corrida notó 46. Las dos que quedaron
  mostraron pruebas que faltaban —que la versión activa diga su número en el selector, y que un bloque sin microciclos
  no invente uno—; con ellas, 48 de 48 (`resultados/calculo-roto-de-a-una-regla.txt`).
- **La pantalla, rota a propósito y compilada así,** en seis tandas: 25 roturas, las 25 notadas por la comprobación
  que se esperaba, y ninguna comprobación falló sin que se la esperara (`resultados/compilacion-rota-tanda-*.txt`). La
  R, 12 roturas sobre `entrenamientos`; la S, 5 más sobre `entrenamientos`, para las comprobaciones que en la R caían
  de rebote o no tenían rotura (entre ellas, que la imagen de un ejercicio se pida aunque esté plegado); la P, una
  sola, que devuelve « · de la prescripción» a cada valor: hace fallar a la vez las cuatro comprobaciones que
  comparan una fila de serie, y por eso va aparte; la D, 3 en las reglas del dominio, que muestran que lo esperado por
  el recorrido no sale del módulo que arma la pantalla; la B, 2 sobre `plan-entrenamiento`: **devolver el defecto de
  la ficha** —la pieza vuelve a pedir el contexto de la pestaña— y abrir «Plan» por la activa cuando hay una versión
  en preparación; y la C, 2 más: la pieza aplastada en media columna y la ficha pasándole a la pieza un acceso sin la
  sesión, con lo que la imagen no se puede leer. Antes de las tandas, los dos recorridos de control pasaron 22 de 22 y
  4 de 4.
- **En la primera vuelta, dos veredictos no salieron limpios, y la falla estaba en las pruebas.** En la S, la rotura
  que hace calificar al historial hizo fallar además la comprobación del % RM, que también busca palabras de la lista
  en toda la sección: no estaba declarado. Se declaró, y el veredicto se volvió a leer sobre el mismo registro. En la
  B, con la ficha rota el recorrido se cortaba en lugar de marcar la falla y seguir: el paso de la imagen hacía clic
  en una fila que ya no estaba. Se corrigió el recorrido y la tanda se corrió de nuevo.
- **Dos comprobaciones miraban menos de lo que decían,** y se reforzaron antes de las tandas: «no resume con la primera
  serie» comparaba el texto esperado consigo mismo, y ahora lee el renglón plegado en la pantalla; y la de la ficha no
  notaba la pieza aplastada, porque nada se salía de la columna: ahora mide el ancho del ejercicio.
- **La primera corrida del recorrido dio 20 de 21.** Lo que falló era la pantalla: en «Lo general», una nota con
  números se cortaba entre el número y su palabra («3» arriba y «segundos» abajo). Se corrigió.

**Lo que mostraron las capturas, antes de la pasada larga.** Se miraron todas antes de lanzarla. Las de `ver.mjs` son de
la compilación anterior a los dos últimos retoques (el ejemplo de la ayuda y la tabla apilada), que no cambian la
pantalla de escritorio; las tres que sí cambian —la ayuda, en los dos temas, y la de 390 px— se volvieron a tomar.
- En la ficha, la pieza quedaba aplastada en media columna: la grilla de dos columnas —ejercicios e historial— se
  aplicaba aunque no hubiera historial. Se corrigió, y la comprobación de la ficha ahora mide el ancho del ejercicio.
- Dentro de la tarjeta de un ejercicio, la tabla de series dejaba una franja a cada lado: las tapas del desplazamiento
  llevaban el color del fondo de la página, no el de la tarjeta. Se corrigió.
- Con indicaciones en la sesión, el historial ya no empezaba a la altura del primer ejercicio. Las indicaciones pasaron
  arriba, con lo que se elige.
- Un bloque sin sesiones decía «0 sesiones»: un hueco dicho como un cero. Ahora dice «sin sesiones».
- En la ayuda, el ejemplo del renglón se cortaba entre «47,5» y «kg». Ahora cada parte baja entera.
- A 390 px, la tabla de series se apila y los datos quedaban sin decir qué eran («02:30», «Sin objetivo»). Ahora cada
  dato lleva su rótulo, y la serie dice «Serie 1» (B10-10 §9). No es un ancho para el que se componga: solo no se rompe.
- Los datos de prueba usaban una palabra de la lista en el propósito de un bloque. Se cambiaron los datos.

**Hallazgos fuera de lo dibujado.**
- **Abrir en la ficha el detalle de «Plan de entrenamiento activado» rompía la página entera** (severidad alta, pero no
  está en lo publicado: viene de `cc17ba2`, WP-DASHBOARD-COMPRENSION, que es parte de esta cadena de ramas). La pieza del
  plan pedía el contexto de la pestaña Entrenamiento para leer la imagen de un ejercicio, y en la ficha ese contexto no
  existe. Ningún recorrido abría ese detalle: el de la línea de tiempo abre la activación de un plan de Nutrición.
  Corregido (F-81): la pieza recibe el acceso de quien la usa. Se revisó además que ninguna otra pieza que la ficha
  comparte con las pestañas pida el contexto de una: no hay otra.
- **La nota de una serie no se veía en el website** (severidad media: el profesional no veía algo que su asesorado sí
  lee en la APK). Corregido (F-74).
- **«Empezar desde una plantilla» presentaba una lectura fallida como «No tenés plantillas activas»** (media: una falla
  dicha como ausencia). Es el mismo defecto que la parte 5 corrigió en Nutrición. Corregido (F-77).
- **Crear desde la activa y crear desde una plantilla compartían la clave de intento** (baja: solo después de un
  resultado incierto). Corregido (F-77).
- **El número de versión se calculaba con la primera página de la lista** (baja: no hay planes con tantas versiones).
  Corregido (F-71).

**Límites, dichos.**
- **La versión en preparación es el editor de antes,** dentro de la sección nueva: con el plan de A mide más de veinte
  pantallas. El selector lo saca de arriba del plan activo; ordenarlo es la parte 8.
- **El plan no entra entero en 900 px de alto.** A 1440 px, con un ejercicio de cuatro series abierto, la página mide
  unos 990 px: entran el encabezado, lo que se elige, el ejercicio abierto y el historial, y el último renglón plegado
  queda cortado. Es lo que comprueba el recorrido (F-76), y no más que eso.
- **A 1440 px, el renglón de la versión ocupa dos líneas** cuando están las tres acciones, como en Nutrición. A 1280 y a
  1024 las acciones bajan y la frase va entera; con una ventana de 1920 px entra todo en un renglón
  (`ahora/plan-de-dos-bloques-sesion-b-1920-claro.png`).
- **La imagen de un ejercicio se miró con respuestas simuladas.** El escenario no tiene ejercicios con imagen: el
  recorrido arma una y simula las dos respuestas que la pantalla pide para mostrarla (el acceso y el contenido). El
  acceso simulado se entrega solo si el pedido lleva la sesión de la página. Falta sumar al escenario un ejercicio
  propio con su imagen, subida por el flujo real (definición, §6).
- **Los demás estados que el escenario no tiene también se miraron con respuestas simuladas en el navegador** (sin plan,
  sin objetivo, la lista de versiones que no se puede leer, seis sesiones, un bloque sin sesiones, el criterio % RM con
  su referencia y los parámetros del profesional, y las plantillas que no se pueden leer): la API y la base no se
  tocan, y lo que se comprueba es qué hace la pantalla con esa respuesta.
- **Con cinco o más sesiones se elige en una lista, y en Nutrición los días tipo —siete como mucho— siguen como
  botones.** Es lo que escribe el criterio para cada pantalla; son dos formas de elegir en dos pantallas hermanas.
- **Una versión anterior no se puede abrir desde el historial:** no está dibujado y la pantalla de antes tampoco lo
  hacía. Se lee en la ficha, en la etapa que rigió.
- **El guion de WP-ENTRENAMIENTO-SERIES** (`recorrido-web.mjs`) leía el plan activo con todas las sesiones y todos los
  ejercicios abiertos, por una clase de la tabla que el plan activo ya no usa, y contaba cinco imágenes a la vez: no
  corre contra la pantalla de hoy. No se adaptó ni se corrió: usa su propio juego de datos y no está en la pasada. Lo
  que protegía del plan activo —que cada serie muestre el objetivo que resolvió la API— lo comprueba el recorrido
  nuevo, serie por serie; las imágenes, que ese guion miraba de verdad, acá se miran simuladas.
- **Sin teléfono ni lector de pantalla reales:** el teclado, el foco y los nombres accesibles se comprobaron con el
  navegador y con axe.

**Dónde está.** `EVIDENCIA/ESCRITORIO-AREAS/parte-6/`: `ahora/` (42 capturas), `antes/` (12 y
`la-ficha-se-rompia.txt`), `plan-de-dos-bloques-antes-y-ahora.png`, `resumen-de-la-pasada.txt` y `resultados/` (los
resultados de cada recorrido, las pruebas y los veredictos de las roturas).

## Parte 7, primer tramo · Nutrición · «Agregar ítem» (2026-10-12)

La parte 7 recompone la versión en preparación del plan de comidas (maquetas 17, 18 y 21). Va en tres tramos, cada uno
con la pantalla funcionando: **este es el primero, «Agregar ítem» (maqueta 21; C-52).** Los otros dos —el editor (17) y
activar (18), que van juntos— no están hechos: el editor es el de antes, y ahora abre el buscador en un cajón.

**Qué cambió.** «Agregar ítem» abría un recuadro dentro de la opción, con el buscador, los habituales y tres enlaces
pegados. Ahora abre **un cajón al costado, uno solo para todo el borrador,** con el editor a la vista por detrás: el
buscador con el foco, los alimentos habituales como fichas, los resultados en una tabla con calorías y macros, y
«Crear manualmente» e «Importar desde Open Food Facts» adentro, con «Volver a la búsqueda». **Elegir un alimento no
cierra el cajón:** lo suma a la opción y lo anuncia. No se quitó ninguna función. No cambian la API, la base ni la APK.
Sobre la base propia (`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de
este tramo (`9f701c0`).

**Medido en la página real,** con el plan de dos días tipo de las cuentas descartables y una versión en preparación:

| A 1440 × 900 | Antes | Ahora |
|---|---|---|
| El editor, sin tocar nada | 9.045 px | 9.045 px: el editor no cambió |
| Con «Agregar ítem» abierto | 9.345 px: el recuadro se abría dentro de la opción y empujaba lo demás | El editor no se mueve. El cajón mide 800 px de ancho y el alto de la ventana; con tres resultados, su contenido mide 700 px |
| Sumar tres alimentos a una opción | Abrir el recuadro tres veces: se cerraba con cada uno | Una sola apertura |

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| «Agregar ítem» abre el buscador del catálogo en un cajón al costado, no dentro de la opción: dice de qué comida y de qué opción es, el foco está en el campo de búsqueda y abrirlo no le pide nada a BE. El cajón no ocupa toda la ventana: el editor sigue detrás. Antes de buscar no hay resultados ni un «no encontramos»; en el pie, lo que hay que saber antes de elegir y las otras dos vías (F-82) | `recorrido.mjs planes`, al final: corre sobre las cuentas descartables recién generadas, con la versión en preparación que el mismo recorrido creó desde una plantilla. No toca los datos de A, B ni C | Pasa: «Desayuno · opción 1: Avena con leche»; el cajón empieza a los 640 px y mide 800; 0 pedidos al abrir | Verificado automáticamente |
| Buscar es una sola lectura, con el texto en el cuerpo del pedido y no en la dirección. Los resultados van en una tabla: el alimento y, en este orden, calorías, carbohidratos, grasas y proteínas; son los que da la API para esa búsqueda. Cada uno dice si es cada 100 g o cada 100 ml, y de dónde se importó si vino de afuera. La cuenta se dice porque la búsqueda trajo todo. El foco sigue en el campo (F-83) | Lo mismo: lo esperado se calcula a mano con lo que devuelve la API para la misma búsqueda | Pasa: 1 pedido; «Arroz blanco de grano largo, cocido · 130 kcal · 28,17 g · 0,28 g · 2,69 g», «Arroz integral · 112 kcal · 23,5 g · 0,9 g · 2,6 g» y «Arroz blanco · 130 kcal · 28 g · 0,3 g · 2,7 g»; «3 en el catálogo» | Verificado automáticamente |
| Con más coincidencias que las veinte que se piden, el cajón no dice una cuenta: la API no informa el total. Dice «Los primeros 20» y que hay más, para acotar la búsqueda (F-83) | Lo mismo, con una respuesta simulada: el catálogo de prueba no tiene una búsqueda con tantos resultados | Pasa: 20 filas, ninguna cuenta, «Los primeros 20 con «alimento»» y «Hay más alimentos que coinciden: escribí algo más del nombre para acotar.» | Verificado automáticamente, sobre una respuesta simulada |
| Elegir un alimento lo suma a la opción y no cierra el cajón: lo anuncia y deja seguir; con el segundo dice cuántos van. Elegir no le pide nada a BE. Al cerrar, el foco vuelve a «Agregar ítem», la opción tiene los dos ítems nuevos al final, sin cantidad y con la unidad apagada, y el editor dice que hay cambios sin guardar (F-84) | Lo mismo | Pasa: «Agregado: Arroz blanco de grano largo, cocido. Podés sumar otro o cerrar.» y «Agregado: Arroz integral (van 2). …»; 0 pedidos al elegir; «Cambios sin guardar» | Verificado automáticamente |
| Cada vez que se abre, el cajón empieza con el buscador vacío. La chinche de un resultado lo marca como habitual con una sola escritura: queda apretada, cambia su nombre a «Quitar de habituales» y el alimento aparece arriba, como una ficha que lo agrega con un clic. Volver a tocarla lo quita, y la ficha se va. Antes de marcar ninguno, el bloque dice cómo se marcan (F-85) | Lo mismo: marca y quita de verdad, y lee de la API cómo quedó | Pasa: 1 escritura al marcar; la ficha «Agregar Arroz integral»; al quitar, ninguno en la pantalla ni en la API | Verificado automáticamente |
| Si los alimentos habituales no se pueden leer, el cajón lo dice, con su motivo y «Reintentar», y no «Todavía no marcaste alimentos habituales»; el buscador queda a la vista. Al reintentar, el bloque vuelve a decir cómo se marcan (F-85) | Lo mismo, con un 503 simulado sobre esa lectura | Pasa: «No pudimos leer tus alimentos habituales. El servicio no está disponible en este momento. Probá de nuevo más tarde. Rein»; al reintentar, el bloque vuelve a decir cómo se marcan | Verificado automáticamente, sobre una falla simulada |
| Una búsqueda que no encuentra nada lo dice y ofrece las otras dos vías; no muestra una tabla vacía ni una cuenta. Una búsqueda que falla dice la falla con su motivo y «Reintentar», y no «No encontramos alimentos con ese nombre»; al reintentar, los resultados aparecen (F-86) | Lo mismo; la falla, con un 503 simulado | Pasa: «No encontramos alimentos con ese nombre. Podés crearlo a mano o importarlo, con los botones de abajo.»; «No pudimos buscar en el catálogo. El servicio no está disponible en este momento. Probá de nuevo más tarde.»; al reintentar, 3 alimentos | Verificado automáticamente |
| «Crear manualmente» se abre dentro del cajón, en el lugar de los resultados, con «Volver a la búsqueda» y sin las acciones del pie; pide el nombre y, en el orden de BE, calorías, carbohidratos, grasas y proteínas. Enviarlo vacío no escribe nada y dice en cada campo qué falta. Con los cinco datos hace una sola escritura, suma el alimento a la opción, vuelve a la búsqueda con el foco en el campo y lo anuncia. El alimento queda en el catálogo con los valores que se escribieron (F-87) | Lo mismo: crea un alimento de verdad y lo busca en la API | Pasa: vacío, 5 campos marcados y 0 escrituras; al crear, 1 escritura; en el catálogo, 120 kcal, 22,5 g, 1,5 g y 4 g | Verificado automáticamente |
| Con una búsqueda hecha, en el cajón no hay un porcentaje ni una palabra de la lista de Nutrición. axe no encuentra faltas con el cajón abierto, en los dos temas. A 1280 px el cajón sigue al costado; a 1024, 768 y 390 ocupa todo el ancho. En los cuatro, nada se sale del cajón, su pie queda a la vista y la página no desborda (F-88) | Lo mismo, con el detector del dominio y con axe; mide cada elemento contra la caja del cajón | Pasa: a 1280, el cajón mide 800 px y empieza a los 480; a 1024, 768 y 390, mide lo que la ventana | Verificado automáticamente |
| «Guardar cambios» guarda la opción con lo que se agregó, con una sola escritura: en la API, sus últimos cuatro ítems son los dos elegidos del catálogo, el habitual y el que se creó a mano, en ese orden y sin cantidad ni estado de preparación. Guardar no activa (F-84) | Lo mismo: guarda por la pantalla y lee la versión de la API | Pasa: 6 ítems en la API, los 4 nuevos sin cantidad; la versión sigue en preparación | Verificado automáticamente |
| «Pedir información», que usa el mismo cajón, sigue abriendo con el foco en su título | `recorrido.mjs solicitudes`, que no se tocó, en la pasada | Pasa: 32 de 32 | Verificado automáticamente |
| Ningún texto escrito en las pantallas de Nutrición usa un término prohibido | `scripts/copy-pantallas.test.cjs`, que recorre la carpeta `nutrition` entera: el archivo nuevo entra solo | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de este tramo | `recorrido.mjs`: capturas 60 de 60, funcional 324 de 324, descartable 22 de 22, mediciones 18 de 18, solicitudes 32 de 32, planes 43 de 43 (los 33 de antes y los 10 de «Agregar ítem»), entrenamientos 22 de 22 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-12, de 22:19 a 23:12, sobre el código de `9f701c0`, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-7/agregar-item/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código | En verde la corrida 38335783978, sobre `9f701c0`: el legajo; la batería completa (typecheck; dominio, 717; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440, 1280 y 1024 px en los dos temas (el cajón al abrirse, con resultados, después de elegir, sin resultados y «Crear manualmente») y a 390 px | `ver.mjs`, sobre las cuentas descartables recién generadas; y `recorrido.mjs planes`, para los estados simulados | 18 capturas de ahora (`parte-7/agregar-item/ahora/`; una es sobre una respuesta simulada, y lo dice en su nombre) y 4 de antes (`antes/`: el editor y el recuadro que se abría dentro de la opción; va la parte de arriba de la página, que mide diez pantallas) | Observado en capturas |

Las comprobaciones negativas van con una positiva de la misma consulta: «abrir no le pide nada a BE» (buscar hace un
pedido), «el texto buscado no viaja en una dirección» (el pedido de la búsqueda está), «elegir no le pide nada a BE»
(marcar un habitual hace una escritura), «con la falla no dice No encontramos» (sin resultados, lo dice) y «enviar
vacío no escribe nada» (con los cinco datos hace una escritura).

**La prueba de la prueba.**
- **La pantalla, rota a propósito y compilada así,** en tres tandas sobre `planes`: 10 roturas, las 10 notadas por la
  comprobación que se esperaba, y ninguna comprobación falló sin que se la esperara
  (`resultados/compilacion-rota-tanda-*.txt`). La T, 7 roturas: el foco en el título y no en el buscador, las proteínas
  donde van los carbohidratos, la chinche que no cambia de nombre, una falla dicha como «no encontramos», un campo de
  «Crear manualmente» con el rótulo de otro, el cajón a todo el ancho a 1280 px y un ítem que nace con un estado de
  preparación que nadie eligió. La U, una sola —elegir cierra el cajón—, que hace caer de rebote a las tres
  comprobaciones que usan el cajón abierto, y por eso va aparte. La V, 2 sobre las comprobaciones que se sumaron
  después: los habituales que no se pueden leer dichos como «todavía no marcaste», y una cuenta dicha cuando hay más
  coincidencias que las pedidas. Antes de cada vuelta, el recorrido de control pasó entero.
- **Este tramo no tiene reglas nuevas en el dominio:** los textos y el orden de los valores son de la pantalla, y los
  mira el recorrido.

**Lo que mostraron las capturas y las primeras corridas.**
- **A 390 px el contenido del cajón se salía de costado:** el botón «Buscar», la nota de los habituales y la
  procedencia de un alimento quedaban cortados. La fila del buscador no dejaba achicar la columna. Se corrigió; lo
  notó la comprobación de los anchos (F-88), que mide cada elemento contra la caja del cajón.
- **Al abrirse, el foco quedaba en el título y no en el buscador:** el cajón ponía su foco después que el buscador.
  Ahora el cajón recibe de quien lo abre dónde va el foco. Se vio en la primera captura, antes de escribir la
  comprobación.
- Los cuatro valores de «Crear manualmente» iban tres en una fila y uno solo debajo. Ahora van los cuatro en una fila.
- **Dos fallas eran del recorrido, no de la pantalla:** no vaciaba el buscador antes de escribir la búsqueda
  siguiente (el triple clic no selecciona el texto de ese campo), y comparaba el texto de un error sin contar el
  símbolo de aviso que lleva delante.

**Hallazgos fuera de lo dibujado.**
- **Una búsqueda del catálogo que fallaba se presentaba como «No encontramos alimentos con ese nombre»** (severidad
  media: una falla dicha como ausencia). Corregido (F-86).
- **Lo mismo con los alimentos habituales:** si no se podían leer, decía «Todavía no marcaste alimentos habituales»
  (media). Corregido (F-85).
- **«Crear manualmente», «Importar desde Open Food Facts» y «Cerrar búsqueda» iban pegados,** sin espacio entre uno y
  otro (baja). Ya no existen como enlaces: son los dos botones del pie y «Cerrar».

**Límites, dichos.**
- **El editor es el de antes.** Diez pantallas de alto con el plan de dos días tipo. Su recomposición y «Activar plan»
  son los dos tramos que faltan de esta parte.
- **La importación desde Open Food Facts no se miró con un producto.** Se abre dentro del cajón y vuelve a la búsqueda,
  y eso se vio; su formulario es el de antes («Energía», y las proteínas antes que los carbohidratos). El entorno de
  prueba no tiene un proveedor propio y los recorridos no llaman a servicios de afuera (definición, §6).
- **La cuenta de resultados se dice solo si la búsqueda trajo todo.** Con más de veinte coincidencias, el cajón dice
  «Los primeros 20» y pide acotar: no hay «ver más», como antes. No se comprobó en pantalla: el catálogo de prueba no
  tiene una búsqueda con más de veinte resultados.
- **Las fallas se miraron con respuestas simuladas en el navegador** (la búsqueda y la lista de habituales): la API y
  la base no se tocan.
- **Sin teléfono ni lector de pantalla reales:** el foco, los nombres accesibles y el anuncio de «Agregado» se
  comprobaron con el navegador y con axe.

**Dónde está.** `EVIDENCIA/ESCRITORIO-AREAS/parte-7/agregar-item/`: `ahora/` (18 capturas), `antes/` (4),
`resumen-de-la-pasada.txt` y `resultados/` (los resultados de cada recorrido y los veredictos de las roturas).

## Parte 7, tramos 2 y 3 · Nutrición · La versión en preparación y «Activar plan» (2026-10-13)

Con estos dos tramos la parte 7 queda completa: **el editor del plan de comidas recompuesto (maqueta 17; C-37 y C-38) y
«Activar plan» (maqueta 18; C-40 a C-42).** El primer tramo, «Agregar ítem» (maqueta 21), está más arriba.

**Qué cambió.** La versión en preparación era una jerarquía de cajas, una adentro de la otra, con todo abierto: cada
día tipo, cada comida y cada opción con su campo de nombre, todos los botones a la vista y las acciones al final. Ahora
**se mira un día tipo por vez, con sus comidas plegadas** —cada una en un renglón, con su nombre y cuántas opciones
tiene—; abierta, una comida muestra **sus opciones en pestañas y los ítems de la que se eligió en una tabla.** Los
nombres se cambian a pedido, y lo que se usa de vez en cuando (cambiar un nombre, quitar, guardar como plantilla o como
habitual) va en un menú. Arriba, en un renglón, el estado del guardado y las acciones. **«Activar plan» guarda antes si
hace falta y recién entonces pregunta;** su diálogo dice qué entra y qué queda, y ahí se fija la próxima revisión. Es
otra composición de lo mismo: **no se agregó ni se quitó ninguna operación.** No cambian la API, la base ni la APK.
Sobre la base propia (`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de
estos tramos (`77597aa`).

**Lo que hubo que resolver, que el dibujo no dice.** Con un día tipo por vez, las comidas plegadas y una opción por
pestaña, **lo que no deja guardar puede no estar a la vista:** un nombre borrado, o una cantidad que no es un número, en
otro día tipo o en otra pestaña. Entonces: la comida lo dice en su renglón, también plegada; lo que no tiene nombre
muestra su campo siempre; «Guardar cambios» no escribe nada y lista cada cosa con su lugar; y **cada renglón de esa
lista —y de la de «Validar plan»— es un botón que lleva hasta ahí:** elige el día tipo, abre la comida y la opción, y
deja el foco en el campo. Es una regla nueva del dominio (`editor-del-plan-de-nutricion.ts`), con sus pruebas.

**Medido en la página real,** con el plan de dos días tipo de las cuentas descartables y una versión en preparación:

| A 1440 × 900 | Antes | Ahora |
|---|---|---|
| El editor, al abrirse | 9.045 px: diez pantallas | 950 px: una, casi entera |
| Para cambiar una cantidad | Buscarla a mano en esas diez pantallas | Elegir el día tipo, abrir la comida y, si hace falta, pasar de pestaña |
| Con una comida abierta (tres opciones, cuatro ítems) | — | 1.431 px (1.485 a 1024) |
| Campos a la vista al entrar | Todos los del plan: cada nombre y, de cada ítem, la cantidad, la unidad y el estado | Ninguno: se abre lo que se va a tocar |
| Activar con cambios sin guardar | Guardar a mano, y recién entonces el botón se encendía | «Activar plan» guarda y pregunta |
| La próxima revisión | Un campo suelto, al pie de la página | En el diálogo de activar, que es cuando empieza a valer |

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| La versión en preparación se abre con un día tipo a la vista y sus comidas plegadas, cada una con su nombre y cuántas opciones tiene, como los da la API. No hay ningún campo a la vista. Arriba, el estado del guardado y, en este orden, el menú de la versión, «Validar plan», «Activar plan» y «Guardar cambios», apagado porque no hay nada que guardar (apagado, no deshabilitado). El objetivo del día es el de la API. La página mide menos de 1.000 px (F-89) | `recorrido.mjs planes`: corre sobre las cuentas descartables recién generadas, con la versión en preparación que el mismo recorrido crea desde la activa. Lo esperado se escribe a mano con lo que devuelve la API; no usa el módulo del dominio que arma la pantalla. No toca los datos de A, B ni C | Pasa: 950 px; «Desayuno: 2 opciones · se elige una», «Almuerzo: 3 opciones · se elige una», «Merienda: 1 opción», «Cena: 2 opciones · se elige una»; 0 campos a la vista | Verificado automáticamente |
| El día tipo que se mira y las comidas abiertas viven en la dirección, por su posición. Elegir y abrir no le piden nada a BE. «Actualizar» vuelve a leer la versión y deja a la vista el mismo día y la misma comida abierta. Al volver al primer día, la dirección queda limpia (F-90) | Lo mismo | Pasa: `dia=2`, `comidas=2`; 0 pedidos al elegir; tras «Actualizar», el mismo día y «Almuerzo» abierta | Verificado automáticamente |
| Abrir una comida muestra sus opciones en pestañas («N · nombre», y la de receta marcada), con la primera elegida, y los ítems de esa opción en una tabla, con los valores de la API. Cada campo dice de qué alimento es en su nombre accesible. La pestaña de la receta se lee y no se edita: la receta con su versión y los ingredientes de una porción, sin campos ni «Agregar ítem». Mirar no le pide nada a BE ni ensucia la versión (F-91) | Lo mismo | Pasa: «1 · Arroz con pollo y brócoli», «2 · Guiso de lentejas» (receta) y «3 · Salmón con papa»; cuatro ítems con su cantidad, su unidad y su estado; en la de receta, 0 campos | Verificado automáticamente |
| Los nombres se cambian a pedido: «Cambiar el nombre» abre el campo en el lugar, con el foco y el nombre seleccionado; lo que se escribe lo reemplaza y Enter lo cierra. Vale para la comida (desde su menú «Más»), la opción (al pie) y el día tipo (desde su menú). Una acción que no se puede usar va apagada y dice por qué: «Guardar como habitual», en una comida con una opción de receta; «Guardar como plantilla», en el menú de la versión, con una receta en el plan. Escape cierra el menú y devuelve el foco a su botón. Nada de esto le pide algo a BE (F-92) | Lo mismo: escribe tres nombres por la pantalla | Pasa: el campo `comida-0-1` con el foco y «Almuerzo» seleccionado; la comida pasa a «Almuerzo del recorrido», la pestaña a «1 · Arroz con pollo y brócoli (ajustada)» y el día a «Día de descanso (ajustado)»; 0 pedidos | Verificado automáticamente |
| Agregar, mover y quitar: «Agregar opción» despliega dos caminos; la opción nueva queda elegida, sin ítems y con su nombre abierto. «Agregar comida» suma una comida al final, abierta, que dice «Falta el nombre» hasta que se lo escribe. «Subir» la mueve un lugar y lo abierto la acompaña; en la primera comida está apagado. «Agregar» suma un día tipo, lo elige y abre su nombre; «Quitar este día tipo» lo saca y deja elegido el anterior. Nada de esto le pide algo a BE (F-93) | Lo mismo | Pasa: «3 · Opción del recorrido»; «Comida 4 · Sin opciones · Falta el nombre» y, con su nombre, «Colación del recorrido»; tras «Subir», tercera, con `comidas=2.3`; tres días tipo y, al quitar, dos | Verificado automáticamente |
| Lo que no deja guardar no queda escondido. Una cantidad que no es un número se marca en su campo, con el motivo, y el renglón de su comida lo dice. Un nombre vacío no se cierra con Enter, y su comida dice «Falta el nombre», también plegada. Con las dos cosas —una en cada día tipo—, «Guardar cambios» no escribe nada y las lista, en el orden del plan y con su lugar. El renglón de la cantidad lleva al otro día tipo, abre la comida y deja el foco en el campo; corregida, la lista se va. Al guardar otra vez queda el nombre: su renglón abre el campo, con el foco (F-94) | Lo mismo: escribe «60x» en una cantidad y borra el nombre de una comida | Pasa: «Escribí un número: «150» o «72,5».» y «1 cantidad que no se entiende»; 0 escrituras; «Hay nombres sin completar y cantidades que no se entienden. Corregilos antes de guardar.», con «Día de entrenamiento → Comida 1 → falta el nombre» y «Día de descanso (ajustado) → Desayuno → Opción 1 → Ítem 1 → la cantidad no se entiende»; el foco, en `item-1-0-0-0-cantidad` | Verificado automáticamente |
| Con todo corregido, «Guardar cambios» hace una sola escritura y la API queda con lo que se hizo en pantalla, y nada más: los tres nombres nuevos, la cantidad corregida (75,5), la opción nueva sin ítems y la comida nueva, sin opciones, en el lugar al que se la subió; lo demás, igual (la opción de receta, con sus ingredientes). Guardar no activa. El botón queda apagado, con el foco todavía en él (F-95) | Lo mismo: guarda por la pantalla, lee la versión de la API y la compara, entera, con la de antes más los seis cambios | Pasa: 1 escritura; «Guardado»; el foco, en «Guardar cambios»; la versión sigue en preparación y la activa es la misma | Verificado automáticamente |
| «Validar plan», sin cambios por guardar, no guarda: valida y dice «Hay elementos por corregir» con cada problema y su lugar, por sus nombres. Los dos están en el día tipo que no se está mirando. Cada renglón es un botón: el de la comida lleva a su día, la abre y deja el foco en su renglón; ese renglón y el de la otra comida, plegada, dicen «1 problema para revisar». Quitadas la comida y la opción vacías, «Validar plan» guarda antes y valida: «Plan válido» (F-96) | Lo mismo | Pasa: «Día de descanso (ajustado) → Almuerzo → Opción 3 → falta al menos un ítem» y «… → Colación del recorrido → falta al menos una opción»; al validar, 0 escrituras de guardar y 1 de validar; al revalidar, 1 y 1 | Verificado automáticamente |
| «Agregar receta como opción» abre las recetas propias en el cajón, que dice de qué comida es, con una sola lectura. Elegir una cierra el cajón y suma una opción con el nombre de la receta, elegida y marcada como receta: se lee y no se edita, y dice que sus ingredientes se cargan al guardar; el foco vuelve a «Agregar opción». Al guardar, la API arma los ítems con los ingredientes de una porción —los mismos que tiene la otra opción de esa receta— y la pantalla los muestra (F-99) | Lo mismo: agrega la receta y guarda por la pantalla, y lee la versión de la API | Pasa: «Guiso de lentejas (Versión 1 · 2 porciones · 355 kcal por porción)»; 1 lectura; «2 · Guiso de lentejas»; al guardar, 1 escritura y los tres ingredientes | Verificado automáticamente |
| Con una comida abierta, en el editor no hay un porcentaje ni una palabra de la lista de Nutrición; la misma consulta encuentra los nombres de los alimentos. axe no encuentra faltas, en los dos temas. A 1280, 1024, 768 y 390 px la página no desborda, nada se sale del editor, el nombre de la comida abierta entra en dos renglones como mucho y todos sus campos están a la vista con su tamaño táctil (F-97) | Lo mismo, con el detector del dominio y con axe; mide cada elemento contra la caja del editor | Pasa: sin palabras de la lista; axe sin faltas; en los cuatro anchos, sin desborde y con todos los campos a la vista (a 1280 y a 1024, el nombre en un renglón y 9 de 9 campos) | Verificado automáticamente |
| Con cambios sin guardar en la versión en preparación, pasar a «2 · activa» muestra el plan activo y deja el editor fuera de la vista; volver lo muestra con lo escrito intacto y «Cambios sin guardar», en el día tipo que se miraba en la activa. Ir y volver no le pide nada a BE. «Actualizar» pregunta antes de volver a leer (F-65) | Lo mismo: son las comprobaciones de la parte 5, que ahora escriben en un nombre que se abre a pedido | Pasa: «Desayuno» → «Desayuno (ajuste)»; 0 pedidos | Verificado automáticamente |
| «Activar plan» guarda antes si hay cambios, y recién entonces pregunta. Si no se puede guardar, no abre el diálogo: dice por qué, la versión sigue con «Cambios sin guardar» y no se activa nada. Cuando sí se puede, hace una sola escritura y abre el diálogo, con el foco en «Volver»: dice qué entra y qué queda, y trae «Próxima revisión (opcional)», vacía. «Volver» lo cierra sin escribir nada y devuelve el foco a «Activar plan». axe no encuentra faltas con el diálogo abierto (F-98) | Lo mismo; la falla al guardar, con un 503 simulado sobre esa escritura | Pasa: con la falla, «El servicio no está disponible en este momento. Probá de nuevo más tarde.», sin diálogo y 0 activaciones; sin ella, 1 escritura y «Esta versión pasa a ser la vigente: 2 días tipo y 7 comidas.» y «La versión 2, activa desde el 13 oct, queda en el historial.» (el día en que se generaron los datos) | Verificado automáticamente; la falla, sobre una respuesta simulada |
| Activar, con una fecha de próxima revisión puesta en el diálogo, hace dos escrituras: guarda la fecha y activa. La versión pasa a ser la vigente, con esa fecha en la API; el selector desaparece, el plan activo dice «Versión 3 · … · es lo que ve el asesorado» y la dirección queda limpia (F-65) | Lo mismo: activa por la pantalla y lee de la API cómo quedó | Pasa: 1 escritura de guardar y 1 de activar; la próxima revisión, en la API | Verificado automáticamente |
| Lo que se usa de vez en cuando sigue estando, en su menú: en una versión sin opciones de receta, «Guardar como plantilla» abre su diálogo, y «Guardar como habitual», encendida, trae el nombre de la comida. Guardarla es una sola escritura; recién entonces aparece, al pie del día tipo, «Agregar una comida habitual» con esa comida. Agregarla la suma al final, plegada, con sus opciones, y lo dice (F-100) | Lo mismo, sobre la versión que el recorrido crea desde una plantilla: guarda una comida habitual de verdad y la agrega | Pasa: 1 escritura; «Habitual del recorrido … · 4 alimentos · Sin cantidades»; la comida, al final | Verificado automáticamente |
| Con los topes del contrato —siete días tipo de nombre largo y una comida con doce opciones—, a 1024 px: los siete segmentos y las doce pestañas están enteros dentro del editor, en más de un renglón; «Agregar» un día tipo está apagado y dice el tope; nada se sale y la página no desborda (F-101) | Lo mismo, con una respuesta simulada: el escenario de prueba no tiene un plan así | Pasa: 7 segmentos en 4 renglones y 12 pestañas en 4; «Un plan lleva hasta 7 días tipo.» | Verificado automáticamente, sobre una respuesta simulada |
| Una opción de nombre muy largo: su pestaña lo corta mientras no es la elegida; al pasar a esa opción, lo muestra entero, sin salirse del editor (C-38; F-102) | Lo mismo, sobre la misma respuesta simulada | Pasa: sin elegir, cortada; elegida, entera | Verificado automáticamente, sobre una respuesta simulada |
| «Agregar ítem» sigue funcionando sobre el editor nuevo: el cajón, la búsqueda, elegir, los habituales, «Crear manualmente» y guardar (F-82 a F-88) | `recorrido.mjs planes`: son las diez comprobaciones del primer tramo, que ahora leen la opción en el marcado nuevo | Pasan las diez | Verificado automáticamente |
| Las reglas del editor: dónde está un problema y cómo se dice su lugar; qué no deja guardar; qué dice una comida plegada; el día tipo y las comidas abiertas que pide la dirección; la pestaña de una opción; y lo que entra y lo que queda al activar | `packages/domain/src/editor-del-plan-de-nutricion.test.ts`, con los resultados esperados escritos a mano | Pasan las 12 | Verificado automáticamente |
| Ningún texto escrito en las pantallas de Nutrición usa un término prohibido | `scripts/copy-pantallas.test.cjs`, que recorre la carpeta `nutrition` entera: el archivo nuevo entra solo | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de estos tramos | `recorrido.mjs`: capturas 60 de 60, funcional 324 de 324, descartable 22 de 22, mediciones 18 de 18, solicitudes 32 de 32, planes 57 de 57 (los 43 de antes y los 14 de estos tramos), entrenamientos 22 de 22 y estimación 7 de 7. `recorrido-comprension.mjs`: mirar 20 de 20, capturas 80 de 80, funcional 86 de 86 y revocación 6 de 6. Pasada del 2026-10-13, de 02:19 a 03:15, sobre el árbol que después fue el commit `77597aa`, sin cambios en el medio, con los datos generados de nuevo y verificados (26 de 26 y 10 de 10). `parte-7/editor/resumen-de-la-pasada.txt` | Verificado automáticamente |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código | En verde la corrida 38355789979, sobre `77597aa`: el legajo; la batería completa (typecheck; dominio, 729; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla, a 1440, 1280 y 1024 px en los dos temas (al entrar, una comida abierta, la opción de receta, los menús, un nombre a pedido, lo recién agregado, las recetas en el cajón, lo que no deja guardar, los problemas de «Validar» y el diálogo de activar) y a 768 y 390 px | `ver.mjs`, sobre las cuentas descartables recién generadas, con una versión en preparación creada por la pantalla; y `recorrido.mjs planes`, de la pasada limpia, para lo que se arma escribiendo y para los estados simulados | 42 capturas de ahora (`parte-7/editor/ahora/`), 6 del recorrido (`del-recorrido/`: dos son sobre una respuesta simulada, y lo dicen en su nombre), 3 de antes (`antes/`: el editor entero, de 9.045 px, y su primera pantalla en los dos temas) y la comparación `antes-y-ahora-1440-claro.png` | Observado en capturas |

Las comprobaciones negativas van con una positiva de la misma consulta: «no hay ningún campo a la vista» (con una comida
abierta, la misma consulta encuentra los de sus ítems), «elegir no le pide nada a BE» («Actualizar» vuelve a leer la
versión), «guardar no escribe nada» (corregido, hace una escritura), «con la falla no se abre el diálogo» (sin ella, se
abre) y «“Volver” no escribe nada» (confirmar hace dos escrituras).

**La prueba de la prueba.**
- **Las reglas, rotas de a una:** 50 mutaciones de `editor-del-plan-de-nutricion.ts`, cada una contra las pruebas del
  módulo en una copia de la compilación. **Las 50 detectadas** (`resultados/roturas-de-las-reglas.txt`).
- **La pantalla, rota a propósito y compilada así,** en cinco tandas sobre `planes`: 27 roturas
  (`resultados/compilacion-rota-tanda-*.txt`). La W, 11 del website, una por comprobación (las diez nuevas y la activación): el editor más alto de
  lo que entra, el botón de una comida que no dice que está abierta, un campo que no dice de qué alimento es, una
  acción del menú que no se apaga, «Subir» encendido en la primera comida, una cantidad que no se marca como inválida,
  la unidad que cambia sola al escribir una cantidad, el foco que no va a su lugar, «Activar plan» que no guarda antes,
  la fecha que no se guarda al activar y la del teléfono, que es la que hubo que rehacer. La X, 3 en la fuente de las reglas del dominio: muestran que lo esperado por
  el recorrido no sale del módulo que arma la pantalla. La T y la U, las 8 de «Agregar ítem», otra vez, porque el
  recorrido ahora lee la opción en el marcado nuevo. La Y, 5 sobre lo que se sumó después: el nombre de la opción de
  una receta, la lista de comidas habituales que no se vuelve a leer, «Agregar» encendido con siete días tipo, la
  pestaña elegida que corta su nombre y la cabecera de la comida en el teléfono.
- **Una rotura no se notó a la primera, y era una rotura mal elegida:** para el teléfono, quitaba una regla de estilo
  que no era la que arreglaba el defecto (la cabecera seguía bajando de renglón). Rehecha en la tanda Y —quita la que
  sí lo arregla—, se nota. En ninguna de las cinco tandas falló una comprobación sin que se la esperara.
- **Un rebote que no estaba declarado, en la tanda U:** con «elegir cierra el cajón», el alimento habitual que el
  recorrido marca no llega a quitarse, y la comprobación de los habituales que no se pueden leer encuentra uno al
  reintentar. Es un rebote legítimo: se declaró y el veredicto se releyó sobre el mismo resultado
  (`resultados/compilacion-rota-tanda-U.txt`).
- Las tandas W, X, T y U corrieron sobre el código anterior a cuatro ajustes de esa misma noche (la pestaña elegida
  con el nombre entero, el objetivo que llega de la sección sin una segunda lectura, el foco pendiente que se olvida y
  el pie con la comida habitual en un renglón); la Y y la pasada completa, sobre el código final.

**Lo que mostraron las capturas y las primeras corridas.**
- **En la primera captura, la tabla de ítems estaba rota** —cada fila se partía en varios renglones—: los estilos del
  editor de antes (`.fila-de-item`), que sigue usando el editor de Entrenamiento, alcanzaban a las filas nuevas. Las
  filas tienen ahora su propio nombre. El editor, además, quedaba angosto: heredaba el tope de 72 rem de la jerarquía.
- **Las columnas cambiaban de lugar de una opción a otra,** según el largo de los nombres. Ahora miden lo mismo en toda
  opción.
- **El motivo de una cantidad que no se entiende ocupaba tres renglones** en su columna angosta. Ahora se lee de
  corrido, por debajo de los otros campos de la fila.
- **A 390 px, el nombre de la comida abierta quedaba de a una letra por renglón,** al lado de «Subir» y «Más»; y a 768
  la tabla dejaba al alimento en una columna de una palabra por renglón. Ahora, en el teléfono, el nombre va en su
  renglón; y a 768 y 390 cada ítem es su nombre y, debajo, sus tres campos con su rótulo. Lo cubre F-97.
- **La pestaña de una opción recién agregada decía «4 · Opción 4».** Ahora, «Opción 4».
- **El control de «Agregar una comida habitual» quedaba desalineado al pie:** una pila de rótulo, lista y botón al lado
  de «Agregar comida». Ahora van en un renglón.
- **Al revisar el criterio se vio que faltaba una parte de C-38:** la pestaña cortaba un nombre largo también cuando
  era la elegida, y el nombre entero no se leía en ningún lado. Ahora la elegida lo muestra entero (F-102).
- **Un campo de nombre vacío desaparecía con la primera letra** que se escribía en él: se vio al razonar la
  comprobación, antes de correrla. Corregido.
- **La primera corrida del recorrido no llegó a empezar:** la API respondió 503 (la base no contestó a tiempo) mientras
  se generaban los datos; la máquina estaba con poca memoria libre. Se repitió y pasó: no es de la pantalla.

**Hallazgos fuera de lo dibujado.**
- **Un nombre borrado llegaba a la API y volvía como «Plan → revisá este elemento»,** sin decir cuál (severidad media:
  en el editor de antes el campo vacío estaba a la vista; en el nuevo podía no estarlo). Corregido (F-94).
- **Al guardar, el teclado quedaba fuera de lugar:** los botones se deshabilitaban mientras se guardaba, y un botón
  deshabilitado pierde el foco (media, de accesibilidad; es de antes y pasa en otras pantallas). Corregido en la
  cabecera del editor (F-95); los demás botones del website siguen como estaban.
- **El editor leía el objetivo vigente por segunda vez,** apenas después de la sección, y si esa segunda lectura
  fallaba no lo decía (baja). Ahora usa el que ya leyó la sección.

**Límites, dichos.**
- **«Agregar una comida habitual» conserva su forma de antes:** una lista y un botón, en el lugar. El plan de
  implementación proponía un diálogo; no es lo que hacía larga la pantalla, y funciona.
- **La versión que entra, en el diálogo de activar, no dice su número** («Esta versión pasa a ser la vigente»): no lo
  tiene hasta activarse. El dibujo dice «Versión 3».
- **No se dibujan los rangos de macros ni la estimación de cada opción,** que la maqueta muestra al costado de la
  comida abierta: son datos que hoy no existen o no llegan (definición, §6).
- **No hay «bajar», ni mover una opción o un día tipo, ni deshacer:** no existían. «Actualizar» sigue preguntando y, si
  se sigue, descarta lo escrito.
- **Los topes del contrato y el nombre largo se miraron con una respuesta simulada** (siete días tipo, doce opciones):
  el escenario de prueba tiene dos días tipo y hasta tres opciones.
- **La falla al guardar antes de activar se miró con una respuesta simulada** en el navegador: la API y la base no se
  tocan.
- **Los botones del resto del website se siguen deshabilitando al enviar.** El cambio es solo de la cabecera de este
  editor.
- **Sin teléfono ni lector de pantalla reales:** el foco, los nombres accesibles y los avisos se comprobaron con el
  navegador y con axe. 768 y 390 px se miraron para que no se rompa: el profesional trabaja en escritorio.

**Dónde está.** `EVIDENCIA/ESCRITORIO-AREAS/parte-7/editor/`: `ahora/` (42 capturas), `del-recorrido/` (6), `antes/` (3), `antes-y-ahora-1440-claro.png`,
`resumen-de-la-pasada.txt` y `resultados/` (los resultados de cada recorrido, los veredictos de las roturas y las
roturas de las reglas).

## Parte 8 · Entrenamiento · La versión en preparación (2026-10-14)

**El editor del plan de entrenamiento recompuesto (maqueta 28; C-75 a C-78).** La parte se planeó en dos tramos —la
composición, y después la tabla de series—, pero se hicieron juntos: con la composición nueva y los campos de antes, un
ejercicio abierto seguía midiendo casi 3.000 px.

**Qué cambió.** La versión en preparación era una jerarquía de cajas, una adentro de la otra, con todo abierto: cada
bloque, microciclo y sesión con su nombre y su propósito, y cada serie con cinco campos y tres casillas. Ahora **se mira
una sesión por vez** —la del bloque y, si el bloque los usa, del microciclo elegidos—, **con los ejercicios plegados:**
cada uno dice en un renglón lo que piden sus series, con lo escrito y todavía sin guardar. Abierto, un ejercicio muestra
**sus series en una tabla, con una celda por objetivo y sus tres estados** (DL-122): en gris, lo que la serie toma de lo
general; con un valor, el suyo; «Sin objetivo», elegido con la flecha de la celda. Lo que se ve es lo que recibe el
asesorado: sale «Así lo ve tu asesorado». El descanso se lee «02:30». Los nombres, el propósito y las indicaciones se
cambian a pedido; lo que se usa de vez en cuando va en un menú; «Agregar ejercicio» abre el buscador en un cajón.
**«Activar plan» guarda antes y pregunta,** con la próxima revisión en el diálogo. Es otra composición de lo mismo:
**no se agregó ni se quitó ninguna operación.** No cambian la API, la base ni la APK. Sobre la base propia
(`be_test_escritorio`, regenerada antes de cada pasada) y la compilación estática del código de esta parte
(`6d85355`).

**Un defecto de antes, corregido (severidad media, de datos).** Lo escrito que no era un número viajaba como NaN, y al
armar el pedido un NaN se vuelve `null`. En un descanso o en el RIR de una serie, `null` quiere decir «sin objetivo»: si
el profesional escribía «90,5» en un descanso o «dos» en un RIR, se guardaba otra cosa, en silencio, y la pantalla decía
«Guardado.». En la carga y en las repeticiones la API lo rechazaba, con un mensaje sin lugar. Ahora el editor no lo
manda: la celda se marca, el ejercicio lo dice en su renglón (también plegado) y «Guardar cambios» lo lista con su
lugar, como un nombre que falta o el objetivo de intensidad que falta con un criterio elegido. Es una regla nueva del
dominio (`editor-del-plan-de-entrenamiento.ts`), con sus pruebas.

**Medido en la página real,** con el plan de dos bloques de las cuentas descartables y una versión en preparación creada
desde la activa:

| A 1440 × 900 | Antes | Ahora |
|---|---|---|
| El editor, al abrirse | 28.413 px: casi treinta pantallas (29.149 a 1024) | 955 px: una pantalla, casi entera |
| Con un ejercicio abierto (cuatro series) | — (con la composición nueva y los campos de antes: 2.932 px) | 1.555 px (1.730 a 1280 y 1.853 a 1024, con «Lo general» debajo) |
| Campos a la vista al entrar | Todos: nombres, propósitos, indicaciones y, de cada serie, cinco campos y tres casillas | Ninguno: se abre lo que se va a tocar |
| Un objetivo de una serie | Un campo, una casilla «Sin objetivo en esta serie» y su ayuda; y una tabla aparte, «Así lo ve tu asesorado» | Una celda: en gris lo que toma, el propio, o «Sin objetivo» |
| Un descanso o un RIR por serie mal escritos | Se guardaban como «sin objetivo», y decía «Guardado.» | No dejan guardar, y dice dónde están |
| Activar con cambios sin guardar | Guardar a mano, y recién entonces el botón se encendía | «Activar plan» guarda y pregunta |

| Qué | Cómo se comprobó | Resultado | Estado |
|---|---|---|---|
| La versión en preparación se abre en una sesión, con sus ejercicios plegados: cada uno con el renglón del plan activo (es una copia), calculado a mano con la API. Arriba, el estado del guardado y el menú de la versión, «Validar plan», «Activar plan» y «Guardar cambios», apagado (no deshabilitado). El bloque y la sesión con los nombres de la API, cuántas sesiones tiene el bloque y su propósito, cuántos ejercicios y series tiene la sesión, y sus indicaciones. Ningún campo a la vista; menos de 1.000 px (F-103) | `recorrido.mjs entrenamientos`: corre sobre las cuentas descartables recién generadas, con la versión en preparación que el mismo recorrido crea desde la activa. Lo esperado se escribe a mano con lo que devuelve la API; no usa el módulo del dominio que arma la pantalla. No toca los datos de A, B ni C | Pasa: 955 px; «Guardado»; las cuatro acciones, con «Guardar cambios» apagado; «Fuerza: progresión» y «Descarga», «2 sesiones» y su propósito; 0 campos a la vista | Verificado automáticamente |
| Lo que se mira vive en la dirección, por su posición: la segunda sesión (`sesion=2`), un ejercicio abierto (`ejercicios=1`), el segundo bloque, que usa microciclos (`bloque=2`, y aparece su renglón), el segundo microciclo (`micro=2`); al volver al primer bloque, la dirección queda limpia. Nada de eso le pide algo a BE (F-104) | Lo mismo | Pasa: `sesion=2`, `ejercicios=1`, `bloque=2` («Semana 1» y «Semana 2»; la sesión, «Cuerpo completo»), `micro=2`; al volver, la dirección limpia; 0 pedidos | Verificado automáticamente |
| Abierto, un ejercicio con objetivos distintos por serie muestra su tabla: cada celda en el estado que guardó la API —en gris lo que toma, el propio, «Sin objetivo» elegido—, el descanso como «02:30», los encabezados con lo que hace falta para llenarlos, y «Lo general del ejercicio» al costado con los valores de la API. Ya no está «Así lo ve tu asesorado». El escenario tiene los tres estados (F-105) | Lo mismo: lo esperado de cada celda se arma a mano con la serie de la API (la clave que no está, `null` o un valor) | Pasa: «Press de banca», cuatro series: la carga, 62,5 en gris en las tres primeras y 60 propia en la cuarta; el RIR, 2 en gris en las dos primeras y 1 propio en las otras dos; el descanso, 02:30 en gris y «Sin objetivo» elegido en la cuarta; la nota de la cuarta | Verificado automáticamente |
| Lo que se escribe en una celda es lo que se guarda: un número deja el propio; «Tomar de lo general» quita el de la serie; «Sin objetivo en esta serie» lo quita aunque lo general lo tenga. El botón de la celda ofrece solo lo que cambia algo. Un descanso escrito en segundos se lee «01:45» al salir del campo; uno escrito «2:00» se guarda como 120 segundos. «Guardar cambios» hace una sola escritura (F-106) | Lo mismo: escribe por la pantalla, guarda, lee la versión de la API y la compara serie por serie (lo declarado, y el objetivo que recibe el teléfono con su origen) | Pasa: 1 escritura; «Guardado»; en la API, la serie 1 con 65 kg propios, la 2 con RIR 1 y sin descanso (`null`: lo declara la serie), la 3 con 105 s y la 4 tomando de lo general la carga y el descanso; el remo, con 120 s | Verificado automáticamente |
| Un RIR por serie y un descanso mal escritos no se guardan como otra cosa: la celda queda marcada y el campo dice el formato; plegados, cada ejercicio dice «1 dato que no se entiende». Desde otra sesión, «Guardar cambios» no le pide nada a BE, dice qué hay que corregir y lista cada cosa con su lugar; cada renglón elige la sesión, abre el ejercicio y deja el foco en el campo (F-107) | Lo mismo: escribe «dos» en un RIR y «90,5» en un descanso | Pasa: «1 dato que no se entiende» en los dos renglones; 0 escrituras; «Hay datos que faltan o no se entienden. Corregilos antes de guardar.», con «Fuerza: progresión (ajuste) → B · Tren superior → Ejercicio 1 → Serie 2 → el RIR no se entiende» y «… → Ejercicio 2 → el descanso no se entiende: va como 02:30, o en segundos»; el foco, en el descanso del ejercicio 2 y en el RIR de la serie 2 | Verificado automáticamente |
| Los nombres se cambian a pedido: el menú del bloque ofrece «Cambiar el nombre», «Organizar por microciclos» (apagada, con su motivo) y «Quitar este bloque»; el campo se abre con el foco y el nombre seleccionado, y Enter lo cierra y deja el foco en el botón del menú. Los menús de la sesión y del microciclo; en un bloque con microciclos, el menú no ofrece organizarlo por microciclos (F-108) | Lo mismo | Pasa: «Organizar por microciclos», apagada, con «Solo mientras el bloque no tiene sesiones: con microciclos, las sesiones van dentro de ellos.»; el campo `b0-nombre`, con el foco y el nombre seleccionado; después, «Fuerza: progresión (ajuste)» y el foco en el menú del bloque | Verificado automáticamente |
| Agregar y quitar: un bloque (elegido, con su nombre abierto); una sesión nueva; un ejercicio desde el cajón, que dice adónde se agrega, deja el foco en la búsqueda, no se cierra al elegir y lo anuncia; Escape lo cierra y devuelve el foco. El ejercicio nuevo tiene una serie sin repeticiones ni criterio, y lo dice; «Quitar», en su menú, lo saca. Nada de esto escribe en BE (F-109) | Lo mismo: busca en el catálogo de la API local | Pasa: `bloque=3`, con el campo `b2-nombre`; «Sesión A»; el cajón dice «Bloque del recorrido · Sesión A»; «Agregado: Sentadilla. Podés sumar otro o cerrar.»; el foco vuelve a «Agregar ejercicio»; «1 serie sin repeticiones fijadas · sin criterio de intensidad»; 0 escrituras | Verificado automáticamente |
| «Validar plan», con cambios sin guardar, guarda antes y valida. La sesión vacía del bloque nuevo es un problema de la API: el aviso lo nombra sin rutas técnicas, como un botón que elige el bloque y deja el foco en el menú de la sesión, y recuerda que validar revisa la forma, no la calidad. Sin problemas, lo dice igual (F-113) | Lo mismo | Pasa: 1 escritura de guardar y 1 de validar; «Bloque del recorrido → Sesión A → falta al menos un ejercicio»; el foco, en el menú de la sesión; sin el bloque nuevo, «El borrador no tiene problemas de estructura. Validar revisa la forma del plan, no su calidad…» | Verificado automáticamente |
| Con los ejercicios de una sesión abiertos, sin palabras de la lista de Entrenamiento y axe sin faltas en los dos temas. «Lo general» al costado a 1440 y debajo a 1280, 1024, 768 y 390; sin desborde (F-112) | Lo mismo, con el detector del dominio y con axe | Pasa: sin palabras de la lista; axe sin faltas en los dos temas; «Lo general» debajo a 1280 (1.730 px), 1024 (1.853), 768 y 390; sin desborde | Verificado automáticamente |
| «Activar plan», con cambios sin guardar, guarda antes y pregunta. El diálogo dice la consecuencia, qué entra y qué queda, trae la próxima revisión vacía y el foco en «Volver», que no escribe nada. Con la fecha, activa: dos escrituras, y la API devuelve la fecha (F-110) | Lo mismo: activa por la pantalla y lee de la API cómo quedó | Pasa: al abrir, 1 escritura; «Esta versión pasa a ser la vigente: 2 bloques y 4 sesiones.» y «La versión 2, activa desde el 14 oct, queda en el historial.» (el día en que se generaron los datos); el foco en «Volver», que no escribe; al activar, 1 escritura de guardar y 1 de activar; la fecha, en la API | Verificado automáticamente |
| Con cambios sin guardar, pasar a la versión activa y volver no pierde nada ni le pide algo a BE; «Actualizar» pregunta. Activada, la versión pasa a ser la vigente con el nombre que se escribió, y el historial lista las tres (F-79) | Lo mismo: son las comprobaciones de la parte 6, que ahora escriben en un nombre a pedido | Pasan las dos | Verificado automáticamente |
| Con el bloqueo de la app, «Activar plan» está apagado, lo describe su motivo («Todavía no podés activar este plan», por qué y qué hacer) y tocarlo no abre nada ni escribe nada (F-111) | Lo mismo, con una respuesta simulada: el titular del escenario ya usó una app que muestra los objetivos por serie | Pasa: «Activar plan» apagado (no deshabilitado), descrito por `motivo-sin-activar`: «Todavía no podés activar este plan…»; tocarlo no abre nada; 0 escrituras | Verificado automáticamente, sobre una respuesta simulada |
| Las reglas del editor: qué se mira, dónde está un problema, qué no deja guardar, qué dice un ejercicio plegado, cómo se lee un descanso, qué muestra y qué escribe la celda de un objetivo, y qué entra al activar | `packages/domain/src/editor-del-plan-de-entrenamiento.test.ts`, con los resultados esperados escritos a mano | Pasan las 23 | Verificado automáticamente |
| Ningún texto de las pantallas de Entrenamiento usa un término prohibido | `scripts/copy-pantallas.test.cjs`, que recorre la carpeta `training` entera: los archivos nuevos entran solos | Pasa | Verificado automáticamente |
| El resto del website sigue funcionando | La pasada completa de los recorridos, sobre la compilación de esta parte | **La pasada completa no se pudo hacer el 14/10.** Con 200 a 800 MB libres (en la máquina había además un navegador de 1,3 GB), todo iba tan lento que la sesión de prueba se vencía a mitad de camino (la API respondía 401) y las fallas eran de la máquina: se cortó. Se corrieron los dos recorridos de los editores sobre el código final: `entrenamientos`, 34 de 34; y `planes`, dos veces, 56 de 57, con una comprobación distinta del plan activo cada vez (F-63 y después F-66: una lectura que no llegó a tiempo), y las catorce del editor del plan de comidas bien en las dos. **Hecha el 15/10** (02:05 a 02:58), con la máquina libre, sobre la rama de la parte 10 (`7850b3d`), que contiene esta parte sin cambios en sus pantallas: R capturas 60/60, funcional 322 de 324, descartable 22, mediciones 18, solicitudes 32, planes 57/57, entrenamientos 34/34, revisiones 16, estimación 7; RC mirar 20, capturas 80, funcional 86, revocación cortada. Las tres fallas son de otras pantallas, con páginas que no terminaron de cargar; repetidas sobre datos nuevos pasaron (revocación 6/6; funcional 323 de 324, con otra del mismo tipo, E-63): cada comprobación pasó en al menos una de las dos corridas (`parte-8/editor/resumen-de-las-corridas.txt`) | Verificado en pantalla, en dos corridas (sobre la rama de la parte 10) |
| Toda la batería de la CI | La CI de GitHub sobre el commit de código | En verde la corrida 38667931879, sobre `6d85355`: el legajo; la batería completa (typecheck; dominio, 752; guiones, 347; y las pruebas de la API); la integración; y la imagen de la API | Verificado automáticamente |
| La pantalla en sus estados: al entrar, el segundo bloque, un ejercicio abierto (1440 en los dos temas, 1280, 1024, 768 y 390), lo que no deja guardar, el cajón, el diálogo de activar y el bloqueo de la app | `ver.mjs` sobre las cuentas descartables recién generadas, con una versión en preparación creada por la pantalla; y `recorrido.mjs entrenamientos`, de la pasada limpia | 32 capturas de ahora (`parte-8/editor/ahora/`: al entrar, el segundo bloque, un ejercicio abierto, la sesión con todo abierto, los menús, un nombre y un propósito a pedido, «Agregar» de la sesión y la flecha de una celda, en los dos temas a 1440; al entrar y con un ejercicio abierto a 1280, 1024, 768 y 390), 5 del recorrido (`del-recorrido/`: lo que no deja guardar, el cajón, el diálogo de activar, el bloqueo de la app —sobre una respuesta simulada, y lo dice en su nombre— y un ejercicio abierto en Azul noche), 3 de antes (`antes/`: los primeros 16.000 px del editor, que mide 28.413, y su primera pantalla en los dos temas) y la comparación `antes-y-ahora-1440-claro.png`. Cuatro capturas de ahora se repitieron: con poca memoria, la primera página después de levantar la API la encontraba todavía arrancando («No hay conexión con BE») | Observado en capturas |

Las comprobaciones negativas van con una positiva de la misma consulta: «no hay ningún campo a la vista» (con un
ejercicio abierto, la misma consulta encuentra los de sus series), «elegir no le pide nada a BE» (guardar hace una
escritura), «guardar no escribe nada» (corregido, escribe una vez), «“Volver” no escribe nada» (activar escribe dos) y
«tocar el botón bloqueado no abre nada» (sin el bloqueo, el diálogo se abre).

**La prueba de la prueba.**
- **Las reglas, rotas de a una:** 72 mutaciones de `editor-del-plan-de-entrenamiento.ts`, cada una contra las pruebas
  del módulo en una copia de la compilación. **A la primera sobrevivió una, y destapó un hueco:** nada comprobaba que una
  celda vacía no vale por un cero (si la serie tenía «RIR 0» o «0 kg» y la celda quedaba vacía, el cero no se mostraba).
  Se sumó esa prueba; **las 72, detectadas** (`resultados/roturas-de-las-reglas.txt`).
- **La pantalla, rota a propósito y compilada así,** en tres tandas sobre `entrenamientos`: 15 roturas
  (`resultados/compilacion-rota-tanda-*.txt`). La E1, 11 del website, una por comprobación: «Guardar cambios»
  deshabilitado en vez de apagado, la sesión escrita desde cero en la dirección, «Lo general» debajo a 1440, el foco
  perdido al confirmar un nombre, la celda de un dato mal escrito sin marcar, las dos opciones de la celda dejando la
  serie sin objetivo, el cajón que se cierra al elegir, el foco que no va al menú de la sesión, los ejercicios que no
  miden su ancho, «Activar plan» que no guarda antes y el bloqueo de la app sin su motivo. La E2, 3 en la fuente de las
  reglas del dominio: muestran que lo esperado por el recorrido no sale del módulo que arma la pantalla. **Todas
  notadas.**
- **Una rotura de la E1 no se notó, y era un error de armado:** «los ejercicios no miden su ancho» quedó tapada por
  otra de la misma tanda, que ya ponía «Lo general» debajo en todos los anchos. Sola, en la tanda E3, se nota, sin
  ninguna otra falla.
- **La primera corrida de la E1 se cortó antes de llegar al editor,** en un paso del plan activo que ninguna rotura
  toca: la API respondía 503 a los ocho segundos (la base no contestaba; la máquina tenía unos 700 MB libres). Repetida,
  corrió entera. En esa segunda corrida fallaron además, sin que se las esperara, la comprobación de anchos del plan
  activo (una página que no llegó a cargar) y la de errores de página («Failed to fetch» al navegar): las dos son de la
  misma falta de memoria, y en la E2, la E3 y la pasada limpia no aparecen.

**Lo que mostraron las capturas y las primeras corridas.**
- **Con los campos de antes, un ejercicio abierto medía 2.932 px** (cuatro series de cinco campos y tres casillas
  cada una, y la tabla aparte). Por eso la tabla de series se hizo en el mismo paso que la composición.
- **A 1440 y a 1280 la celda cortaba «Sin objetivo»** («Sin objetivc»). Ahora, sin un valor, el texto va un poco más
  chico y desde la izquierda.
- **A 1280, «Lo general» al costado dejaba a la nota una columna de unos 80 px.** Se aplicó lo que el plan de
  implementación ya proponía (DEC-30): por debajo de unos 1.200 px para los ejercicios, «Lo general» va debajo, en dos
  columnas.
- **A 768 la tabla se apretaba.** Ahí y a 390, cada serie es un bloque con sus campos rotulados.
- **«RIR = repeticiones en reserva Cada serie puede tener el suyo.»** —sin el punto— era la ayuda del criterio en el
  editor de antes. Ahora esa explicación está en «Cómo se lee esta vista», como pide DEC-28.

**Hallazgos fuera de lo dibujado.**
- **El dato mal escrito que se guardaba como «sin objetivo»** (media, de datos; es de antes): corregido (F-107).
- **En los dos editores, confirmar un nombre con Enter dejaba el foco al principio de la página** (media, de
  accesibilidad; en el de comidas lo dejé así en la parte 7). Ahora va a lo que muestra ese nombre (F-108).
- **Un parámetro que se deja vacío** («Agregar parámetro» lo crea así) lo rechaza el contrato, que pide su nombre y su
  valor: el editor de antes lo mandaba igual, y el problema volvía con el texto genérico de una falla de forma («falta
  un dato, o el número es demasiado chico»). Ahora se dice antes de guardar: «a un parámetro le falta el nombre o el
  valor», en su ejercicio, y lleva al campo (baja; por lectura del contrato, sin correrlo con el editor de antes).

**Límites, dichos.**
- **La unidad de la carga va en el encabezado de la columna**, no en cada celda como la dibuja la maqueta («62,5 kg»):
  en el editor la celda es un campo, y escribir «60» y leer «60 kg» en el mismo campo pide separar el número de su
  unidad. Para decidir.
- **Los topes del contrato** (doce bloques, treinta sesiones por bloque, cuarenta ejercicios, veinte series) no se
  anticipan en la pantalla: los dice la API al guardar, ubicados en su lugar.
- **«Importar desde wger» no se miró en pantalla:** los recorridos no llaman a servicios de afuera.
- **El bloqueo de la app se miró con una respuesta simulada.**
- **Los guiones de WP-ENTRENAMIENTO-SERIES ya no corren contra el editor nuevo** (DEC-31): lo que protegían —escribir
  los tres estados y comparar con la API— está en F-105 a F-107, F-110 y F-111.
- **«Actualizar» sigue preguntando y, si se sigue, descarta lo escrito.**
- **Sin teléfono ni lector de pantalla reales:** el foco, los nombres accesibles y los avisos se comprobaron con el
  navegador y con axe. 768 y 390 px se miraron para que no se rompa.

**Dónde está.** `EVIDENCIA/ESCRITORIO-AREAS/parte-8/editor/`: `ahora/`, `del-recorrido/`, `antes/`,
`antes-y-ahora-1440-claro.png`, `resumen-de-las-corridas.txt` y `resultados/` (los resultados de los dos recorridos de
los editores, los veredictos de las roturas y las roturas de las reglas).
