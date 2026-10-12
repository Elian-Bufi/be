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
