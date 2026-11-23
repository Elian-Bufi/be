# Decisiones para ratificar · planificación (19/11)

*Las decisiones que tomé como continuador en los paquetes de la planificación, cada una en una línea y con lo que te recomiendo.*

> BE ubica, no califica: cada recomendación cuida que la pantalla diga solo lo que es cierto.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** 19 de noviembre de 2026

# Cómo leerlo

> Una tabla por paquete: leés la línea y mirás lo que te recomiendo.

1. Cada fila es una decisión: su código, qué decide en una línea y lo que te recomiendo.
2. **Ratificar** = queda como está · **Ratificar con cambio** = la apruebo con el ajuste que digo · **Decidís vos** = hay dos caminos y marco el que sugiero.
3. Lo que ya decidiste hoy figura como «Ya decidido por vos el 19/11»: no hace falta volver a mirarlo. Las decisiones técnicas que no se ven en pantalla van juntas en una fila.

### Los cambios que te recomiendo

| Código | El cambio, y por qué |
|---|---|
| NUA-D07 | Administración ve quién cargó cada alimento, pero nunca a qué persona se le indicó ni en qué plan; lo que suma al catálogo oficial nace como alimento nuevo, con su fuente y sin el nombre de quien lo cargó. El formulario sigue pidiendo no escribir datos de personas en el nombre, porque ahora lo lee Administración. |
| NUA-D03 | Una receta nueva, o una versión nueva de una receta, no puede sumar un alimento retirado: hoy, por una receta, un alimento retirado puede llegar a un plan que se activa después. |
| CTX-D08 | La nota de la medicación ubica y no indica: «Algunas medicaciones cambian el pulso o la respuesta al esfuerzo», sin «dosificá por esfuerzo percibido». La decisión es del profesional. |
| ENP-D01 | Las fases guardadas con el nombre automático «Bloque 1, 2…» se muestran como «Fase 1, 2…»: con el bloque nuevo dentro de la sesión, una fase llamada «Bloque» confunde. |
| CMP-D8 | En la pantalla única de compartir, «Elegir qué compartir» y «Ahora no» van como botones a la vista, no como un enlace chico: el consentimiento tiene que ser libre (Ley 25.326, art. 5). |
| DL-177 | Mientras no haya código por correo, quien trabaje con casos reales entra con Google y la verificación en dos pasos activa: con datos de salud de terceros, una contraseña sola es la única llave. |
| GR-VD08 | Una pregunta de «Analizar» abierta por un enlace, sin nada que mostrar, muestra un estado vacío neutro con su título, en vez de volver sin decir nada: la pantalla no cambia sin decir por qué. |

### Lo que ya decidiste hoy

- **Los alimentos cargados a mano son propios** (reemplaza NUA-D05 y D13): Administración ve quién los cargó, agrupa los parecidos con cuántos profesionales los cargaron y puede sumarlos al catálogo oficial con una fuente; el buscador sugiere el oficial.
- **La APK vieja no necesita compatibilidad** (ENP-D06 queda sin objeto), y **en pantalla se dice «Sin indicar»**, no «Sin objetivo».
- **El preset de la sesión vacía queda en la pantalla** (ENP-D18). **Se integra** al terminar las plantillas y el tramo 3 de Nutrición.

# Entrenamiento

> Las series de calentamiento y el editor del plan de Entrenamiento.

## Series de calentamiento (DL-178)

El profesional indica series de calentamiento antes de las efectivas; la persona las registra, pero no entran en ninguna cuenta: ni en la barra de la sesión, ni en «La vez pasada», ni en el 1RM estimado.

| ID | La decisión | Mi recomendación |
|---|---|---|
| D-6 | «Series efectivas» se dice solo donde hay calentamiento: «3 series efectivas + 2 de calentamiento»; sin calentamiento, el texto queda como siempre («4 series») | **Ratificar** (opción A: no cambia lo que la gente ya lee) |
| D-4 | Las efectivas se numeran 1, 2, 3 y el calentamiento lleva «C»; entre sesiones se compara la serie 1 con la serie 1, aunque una tenga calentamiento | **Ratificar** |
| D-3 | El calentamiento va siempre arriba del ejercicio; si llega uno después de una efectiva, BE avisa y no lo reordena en silencio | **Ratificar** |
| D-5 | Una serie es de calentamiento si lo dice el registro o el plan, así no se cuela un calentamiento como efectiva | **Ratificar** |
| D-2 | Un plan con calentamiento no se le entrega a una app que no sabe mostrarlo: lo vería todo efectivo | **Ratificar** (sin costo: la última APK ya lo conoce) |
| D-1 | Técnicas, sin efecto en pantalla (1) | **Ratificar** |

## Editor de Entrenamiento (DL-181)

Lo que se llamaba «Bloque» (la etapa de varias semanas) pasa a «Fase», y aparece un «Bloque» opcional dentro de la sesión, «Seguido» o «En vueltas»; además, las correcciones de tu prueba y once mejoras del editor.

| ID | La decisión | Mi recomendación |
|---|---|---|
| ENP-D01 | «Fase» en todas las pantallas; las fases nuevas nacen «Fase 1» y las guardadas conservan su nombre | **Ratificar con cambio:** las que tienen el nombre automático «Bloque N» se muestran «Fase N»; lo escrito a mano, igual |
| ENP-D04 | Dos tipos de bloque: «Seguido» (los ejercicios de a uno) y «En vueltas» (dos o más alternados); sin «superserie» ni «circuito» en pantalla, con un ejemplo en la ayuda | **Ratificar** |
| ENP-D05 | En un bloque «En vueltas», cada vuelta es una serie efectiva de cada ejercicio; al cambiar las vueltas, el editor iguala las series, con «Deshacer» | **Ratificar** |
| ENP-D06 | La APK vieja recibe el plan sin los bloques | **Ya decidido por vos el 19/11:** sin objeto, no hace falta compatibilidad |
| ENP-D07 | La APK nueva agrupa los ejercicios bajo su bloque y dice «Alterná estos 2 ejercicios · 3 vueltas · descansá 90 s al terminar cada vuelta»; la guía paso a paso queda para después | **Ratificar** |
| ENP-D08 | Plantillas y sesiones habituales conservan los bloques; copiar un ejercicio a otra sesión lo saca de su bloque | **Ratificar** |
| ENP-D10 · D18 | El preset de la sesión vacía se aplica a cada ejercicio que se agrega, vive en la pantalla y lo dice («Si cerrás o recargás el editor antes, no queda») | **Ya decidido por vos el 19/11:** queda en la pantalla, sin guardarlo en el plan |
| ENP-D11 · D12 | Los menús salen enteros, por encima de los paneles; «Todavía no hay un plan activo» pasa a una etiqueta chica en la cabecera | **Ratificar** |
| ENP-D13 | La revisión para activar dice en cuál de cuatro estados está y nunca afirma algo que el servidor no dijo: se terminó el «Nada impide activar» antes de tiempo | **Ratificar** |
| ENP-D14 · D15 | El criterio (RIR o % RM, con su objetivo) va arriba de las series; cada «Agregar» dice qué agrega («Agregar fase», «Agregar bloque»…) | **Ratificar** |
| ENP-D16 | «Copiar» a la vista en cada ejercicio; «Seleccionar series» escribe repeticiones, carga, RIR o descanso en varias a la vez | **Ratificar** |
| ENP-D19 · D20 | La versión activa y el plan compartido muestran los bloques y los describen, sin darle órdenes a nadie; una sesión admite hasta 20 bloques y el editor lo dice antes | **Ratificar** |
| ENP-D21 · D22 | «Ir a…» lleva al campo exacto que falta, y «Volver a la revisión» devuelve a donde estabas | **Ratificar** |
| ENP-D23 · D24 | La escritura rápida tiene su rótulo, «Se lee: …» mientras escribís y «Aplicar»; lo escrito sin aplicar no se pierde y no se activa sin resolverlo | **Ratificar** |
| ENP-D25 | Cambiar de criterio dice qué se quitó («se quitaron el objetivo RIR 2 y el RIR de 3 series») y se puede deshacer | **Ratificar** |
| ENP-D26 | Los días se eligen en un solo lugar, junto a cada sesión; las próximas fechas y «Duplicar el día», a pedido | **Ratificar** (si en la prueba con profesionales no encuentran «Duplicar el día», sumarlo al menú de la sesión) |
| ENP-D27 | En el catálogo, los ejercicios elegidos a la vista y un solo botón principal; crear o importar, en «No encuentro el ejercicio» | **Ratificar** |
| ENP-D28 | Cada valor dice si es común, propio o sin indicar; la APK y la lectura de la versión activa seguían con «Sin objetivo» | **Ya decidido por vos el 19/11:** «Sin indicar» en todas las pantallas, también en la versión activa y en la próxima APK |
| ENP-D29 | «Sesiones vacías»: armar de una vez Sesión A, B y C, sin pedir nombre ni enfoque | **Ratificar** |
| ENP-D02 · D03 · D09 · D17 | Técnicas, sin efecto en pantalla (4) | **Ratificar** |

# Nutrición

> El editor del plan de Nutrición con los números a la vista, y los alimentos del catálogo.

## Editor de Nutrición

El profesional arma el plan viendo lo que aporta lo que escribe: cada alimento, cada comida, cada opción frente a su rango y la suma de los rangos frente al objetivo del día. Nada bloquea ni califica: ubica.

| ID | La decisión | Mi recomendación |
|---|---|---|
| NUP-D01 · D02 | Lo que aporta cada alimento sale de la misma cuenta que el total (la suma de las filas da el total); lo que falta se dice, nunca es cero | **Ratificar** |
| NUP-D03 | La composición cada 100 g aparece al pasar por el alimento, con de dónde sale («USDA», «Cargado por vos») | **Ratificar** |
| NUP-D04 | Cada opción es un renglón que se abre; con varias, todas plegadas y con sus números a la vista | **Ratificar** |
| NUP-D05 | Ubicar frente al rango: «dentro del rango», «12 g por encima», «8 g por debajo», sin color ni ícono de juicio | **Ratificar** |
| NUP-D06 | La suma de los rangos de las comidas frente al objetivo; si a una comida le falta el tope, nunca dice «adentro» | **Ratificar**, con el criterio de la revisión: dice «X por encima del mínimo, sin tope para comparar» |
| NUP-D07 | Si los gramos del objetivo no suman sus kcal (más de un 5 % de diferencia), un aviso neutro con la diferencia; se puede guardar igual | **Ratificar** |
| NUP-D08 · D11 | El «%» del objetivo, siempre con su base y su número: «18 % de las 2.500 kcal · 112 g · 448 kcal», y nunca para calificar; la app de la persona sigue sin «%» | **Ratificar**: el «%» siempre con el número de su base |
| NUP-D09 · D10 | Enter lleva al siguiente campo que falta; tocar afuera de un cuadro es como Escape, y si hay algo escrito, pregunta antes de cerrar | **Ratificar** |
| NUP-D12 | Una comida vacía ofrece: una comida habitual, copiar de otra comida, una receta o alimentos | **Ratificar** |
| Abierto | ¿El «%» con su base vale también en los gráficos de Nutrición? Hoy los gráficos no lo usan | **Decidís vos:** A, sí, con la misma regla (la que sugiero, por coherencia) / B, los gráficos sin «%» |

## Alimentos del catálogo (DL-180)

Un alimento cargado a mano se corrige con versiones y se retira sin borrarse; cada uno dice de dónde sale y lleva el ícono de su grupo, y la imagen de la receta se elige desde el principio.

| ID | La decisión | Mi recomendación |
|---|---|---|
| NUA-D05 · D13 | Lo cargado a mano se compartía con los demás profesionales de Nutrición, y corregirlo lo compartía | **Ya decidido por vos el 19/11:** lo cargado a mano es propio, no se comparte |
| NUA-D06 | Cada alimento dice de dónde sale; con lo de hoy, quedan dos niveles: «Verificado» (la tabla oficial o lo certificado) y «Tuyo» | **Ya decidido por vos el 19/11:** sin «De otro profesional»; el buscador sugiere el oficial |
| NUA-D07 | Administración revisa lo cargado a mano: lo certifica con una fuente o lo marca como equivalente de uno oficial | **Ratificar con cambio:** ve quién lo cargó, nunca a qué persona se le indicó ni en qué plan; lo sumado al catálogo oficial nace nuevo, con su fuente y sin el nombre de quien lo cargó |
| NUA-D01 | Corregir un alimento crea una versión nueva; lo que ya lo citaba (un plan activado, una receta, un registro) conserva la suya | **Ratificar** |
| NUA-D02 | Retirar no borra: sale del buscador y, donde ya está, se ve con la marca «retirado» | **Ratificar** |
| NUA-D03 | Un plan en borrador que ya tenía uno retirado se sigue guardando, pero no se activa así | **Ratificar con cambio:** una receta nueva no puede sumar un alimento retirado; las que ya lo tenían lo conservan |
| NUA-D08 | Trece grupos de alimentos, doce con su ícono propio y «Otros» con el genérico | **Ratificar**; los doce íconos, a validar por vos |
| NUA-D10 | «Mis alimentos», un lugar propio para corregir y retirar, al que se llega desde «Plantillas y habituales» y desde la opción del plan | **Ratificar** |
| NUA-D11 · D12 | La imagen de la receta se elige al crearla y se carga sola; si falla, «Reintentar la imagen». Los pasos 3 y 4 del asistente, con los campos de BE | **Ratificar** |
| NUA-10 | Platos argentinos (tramo siguiente): las tablas argentinas no permiten copiarlas sin permiso | **Decidís vos:** A, recetas de ejemplo armadas con ingredientes de la tabla oficial (la que sugiero) / B, pedir permiso a una tabla argentina |
| NUA-D04 · D09 | Técnicas, sin efecto en pantalla (2) | **Ratificar** |

# La persona y lo que comparte

> El contexto a mano mientras se planifica, la historia anterior, la pantalla única de compartir y cómo entra el profesional.

## Contexto de la persona (DL-179)

Un panel al costado del editor con lo que la persona contó en sus formularios, su cuerpo, lo de otras áreas y las notas propias, para planificar sin salir del editor.

| ID | La decisión | Mi recomendación |
|---|---|---|
| CTX-D01 | El botón del panel está en las tres áreas y en Antropometría, en todas sus secciones menos «Información» | **Ratificar** |
| CTX-D03 · D04 | En pantallas anchas, como la tuya, el panel va al costado; en notebooks, encima, como cajón. Se abre con Alt + C, también mientras escribís | **Ratificar** |
| CTX-D05 | «Lo importante» ordena igual en las tres áreas: primero lo que puede hacer daño, después lo que limita, la logística y lo que busca | **Ratificar** |
| CTX-D06 | Solo lo que la persona respondió, en sus palabras y con su fuente; BE no infiere ni clasifica | **Ratificar** |
| CTX-D07 | Las preguntas de salud (PAR-Q+), una por una; si todas son «no», un renglón; nunca «2 de 7» | **Ratificar** |
| CTX-D08 | La medicación, con una nota fija del área («si es así, dosificá por esfuerzo percibido») | **Ratificar con cambio:** la nota ubica y no indica: «Algunas medicaciones cambian el pulso o la respuesta al esfuerzo»; decide el profesional |
| CTX-D09 | La conducta alimentaria se nombra así, sin el nombre del trastorno, sin color ni alerta, y no se puede citar | **Ratificar** |
| CTX-D10 · D11 | Cada profesional ve solo las respuestas a sus propios formularios; los hábitos, de su formulario o de lo que la persona le compartió, con la fuente | **Ratificar** |
| CTX-D12 | «Citar» lleva una respuesta a la evaluación que estás escribiendo; lo de salud nunca va al objetivo, que viaja con el plan compartido | **Ratificar** |
| CTX-D14 | El cuerpo: quien lleva Antropometría ve sus dos últimas tomas; quien lo recibe compartido ve peso y composición, y la persona lo ve en «Quién miró» | **Ratificar** |
| CTX-D15 | El cambio del cuerpo, solo entre tomas comparables y con el «%» de su base: «−1,2 kg (−1,5 % de 80,0 kg)»; si no, «No se compara: otro protocolo» | **Ratificar** |
| CTX-D16 · D17 | Lo de otras áreas, como en la ficha, con «Pedir acceso» donde existe; las notas, solo las propias | **Ratificar** |
| CTX-D02 · D13 · D18 | Técnicas, sin efecto en pantalla (3): nada se lee hasta abrir el panel y el navegador no guarda datos de la persona | **Ratificar** |

## Historia anterior (DL-175)

Si la persona cambia de profesional, el nuevo ve lo que pasó antes en su área, en solo lectura y marcado como de otro profesional, si ella lo autoriza.

| ID | La decisión | Mi recomendación |
|---|---|---|
| Opción A | Una autorización aparte, con su propio texto, en vez de cambiar el consentimiento del vínculo que todos ya aceptaron | **Ratificar** (opción A) |
| HA-T01 · T16 | En la pantalla única al aceptar, va marcada si antes hubo otro profesional; en «Quién ve qué», compartirla abre el texto entero | **Ratificar** |
| HA-T02 · T07 | Entran los planes activados, lo registrado, las tomas y las decisiones de las revisiones; nunca las notas del anterior, sus borradores ni su nombre | **Ratificar** |
| HA-T03 | Se ve como estaba cuando empezó el acompañamiento del profesional nuevo, sin correcciones posteriores | **Ratificar** |
| HA-T08 · T15 | Cada lectura queda registrada y la persona ve la última; la app no dice «La ve» si hoy el profesional no tiene acceso | **Ratificar** |
| HA-T14 | Retirar el permiso del área retira también la historia anterior; el consentimiento general de datos de salud y la pausa, no | **Ratificar** (como está) |
| HA-T05 · T10 · T12 | El texto, pendiente de validación jurídica; se ve por tramos de 90 días, en una página propia desde «Más» | **Ratificar** |
| HA-T04 · T06 · T09 · T11 · T13 | Técnicas, sin efecto en pantalla (5) | **Ratificar** |

## Compartir casi por omisión (DL-176)

Conectar con el profesional es el único paso aparte; después, una sola pantalla con todo marcado y un toque, y cada cosa se retira cuando la persona quiera. Las dudas legales de lo preseleccionado siguen yendo a la validación jurídica.

| ID | La decisión | Mi recomendación |
|---|---|---|
| Opción A · CMP-D1 | El vínculo se acepta aparte y enseguida aparece la pantalla única, con todo marcado y «Aceptar y compartir» | **Ratificar** (opción A) |
| CMP-D2 · D4 | Trae marcado el permiso de su área, el consentimiento de datos de salud si falta, lo de las otras áreas en los dos sentidos, la historia anterior y los hábitos si corresponde | **Ratificar** |
| CMP-D3 | Lo que la persona retiró antes no vuelve marcado: «casi por omisión» no pisa una decisión suya | **Ratificar** |
| CMP-D8 | La pantalla dice cada cosa en una línea y deja los textos completos plegados; «Ahora no» es un enlace chico | **Ratificar con cambio:** «Elegir qué compartir» y «Ahora no», como botones a la vista; el consentimiento tiene que ser libre (art. 5) |
| CMP-D5 · D12 · D13 · D14 | Los hábitos «si corresponde»; la tarjeta única, una vez por teléfono; «Quién ve qué» con un interruptor por cosa; los pedidos con «Sí, compartir» o «Ahora no» | **Ratificar** |
| CMP-D6 · D7 · D9 · D10 · D11 · D15 · D16 | Técnicas, sin efecto en pantalla (7) | **Ratificar** |

## Cómo entra el profesional (DL-177)

El profesional entra con su contraseña o con Google, sin el código del autenticador, hasta que exista un código por correo; Administración sigue con contraseña y autenticador.

| ID | La decisión | Mi recomendación |
|---|---|---|
| Opción A | Solo contraseña (o Google) hasta tener el código por correo | **Ya decidido por vos el 18/11** |
| Legajo | Se suspende la regla del legajo que pedía el segundo factor antes de operar con datos reales, hasta la etapa del correo | **Ratificar con cambio:** mientras tanto, quien trabaje con casos reales entra con Google y la verificación en dos pasos activa |
| Técnicas (3) | La regla vive en el código y no en un interruptor del servidor; restablecer el autenticador queda fuera de la consola; lo ya configurado no se borra | **Ratificar** |

# Gráficos

> Las pasadas visuales de los gráficos de Entrenamiento (GR-VB), de Nutrición y el cuerpo (GR-VC) y de «Analizar» (GR-VD).

Cómo se dibuja cada gráfico para que diga solo lo que los datos permiten decir.

| ID | La decisión | Mi recomendación |
|---|---|---|
| GR-VC13 | Una sola media semanal de Nutrición en todo BE: la de los días registrados completos, si son 4 o más; un día a medias no entra en la media | **Ratificar** |
| GR-VC12 · VD04 · VD10 | De entrada se ve por semana solo si la mayoría de las semanas tiene media; la semana sin media es una raya baja y cortada, no una caja | **Ratificar** |
| GR-VC01 · VC04 | Nutrición por semana con más de seis semanas; por semana, «Lo indicado y lo registrado» no escribe una diferencia, que queda día por día | **Ratificar** |
| GR-VC02 | Los gramos por kilo, solo día por día: una media semanal mezclaría dos pesos sin decirlo | **Ratificar** |
| GR-VC05 · VC06 | Con menos de 4 tomas, el gráfico de masa grasa va como tabla; nombra solo los métodos que aparecen | **Ratificar** |
| GR-VC09 · VC11 | El día completo dice «Sin faltantes»; el gráfico se llama «Lo indicado y lo registrado» | **Ratificar** |
| GR-VB01 · VB09 | El cambio de lo indicado se lee en la línea de cada versión del plan («v8 · de 4 a 3 repeticiones»), de la serie elegida donde se elige una | **Ratificar** |
| GR-VB10 · VB11 | Una sesión en la que no se hizo el ejercicio no se dibuja ni se cuenta; una sin series escritas corta la línea del 1RM estimado | **Ratificar** |
| GR-VB12 | Lo lleno del 1RM estimado se llama «Hasta 10 rep. equivalentes» | **Ratificar** |
| GR-VB08 · VC08 | A la vista, lo que cambia la lectura (el método, lo que falta, lo de otro profesional); el resto, en «Cómo leerlo» | **Ratificar** |
| GR-VD01 · VD02 · VD05 | Las preguntas de Nutrición y «Ver la relación» también en «Analizar» mientras «Patrones» no está; «Lo que también cambió» lista primero el cambio de lo indicado | **Ratificar** |
| GR-VD08 | Una pregunta abierta por un enlace, sin nada que mostrar, vuelve a «Analizar» sin decir nada | **Ratificar con cambio:** un estado vacío neutro con su título, para que la pantalla no cambie sin decir por qué |
| GR-VB02 a VB07 · VC03 · VC07 · VC10 · VD06 · VD07 | Medidas y ubicación de los dibujos: tamaños, ejes, alturas, números a la vista, leyendas y fechas | **Ratificar** |
| GR-VD03 · VD09 | Técnicas, sin efecto en pantalla (2) | **Ratificar** |
