# Cómo probar BE

*Qué hace falta, con qué cuenta entrar y qué probar, paso a paso, con la cartera de una profesional que usa BE todos los días.*

> Todos los datos son sintéticos: la Lic. Julieta Arce, sus colegas y las personas que acompaña no son personas reales.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** Noviembre de 2026

> **Resumen.** Con dos cuentas se recorre BE de punta a punta: la de una profesional que trabaja las tres áreas, en el website, y la de una de sus personas, en la app. Primero, un recorrido corto por rol; después, cinco personas que muestran cada una algo distinto, y al final el ciclo completo entre el teléfono y la computadora.

**Lo acompaña:** El paso a paso de cada tarea, en los manuales (09). Qué es BE y por qué importa, en el Resumen y guía (00).

# Resumen

*Una profesional con más de un año de historia, cinco personas para mirar en profundidad y un recorrido que une los dos canales.*

Esta guía sirve para recorrer BE sin ayuda. BE tiene tres roles, y cada uno entra por su lado: la **persona**, con la app en su teléfono Android; el **profesional**, con el website en la computadora; y **Administración**, también en el website, por su propia entrada.

La muestra es la cartera de la **Lic. Julieta Arce**, licenciada en Nutrición, profesora de Educación Física y antropometrista: acompaña a quince personas en las tres áreas y usa BE desde hace dieciséis meses. Cinco de esas personas tienen una historia larga y completa, y cada una muestra algo distinto: el progreso, el estancamiento y la descarga, la vuelta después de una pausa, la composición corporal y una persona que recién empieza. Las otras diez completan una cartera de todos los días.

> **La idea clave.** La prueba más elocuente es **cruzar las pantallas**: lo que la persona registra en el teléfono aparece en el website al lado de lo que la profesional indicó, y lo que la profesional activa o revisa le llega a la persona.

**Tabla 1.** Qué se prueba con cada rol y dónde está en esta guía.

| Rol | Dónde | Qué se prueba | En esta guía |
| --- | --- | --- | --- |
| Persona | La app, en un teléfono Android | Lo que tiene para hoy, registrar comidas y sesiones, su evolución y quién ve qué | «La persona, en la app» |
| Profesional | El website, en la computadora | Las personas que acompaña, la ficha de cada una, sus áreas, los planes, las revisiones y los gráficos | «La profesional, en el website» y «Cinco personas, cinco historias» |
| Administración | El website, en su propia entrada | Habilitar a cada profesional por área, con su fundamento, sin ver datos de salud | «Administración, en el website» |
| Los dos canales | La app y el website | El ciclo completo, de un plan nuevo a la revisión | «El recorrido completo» |

> **Sobre las imágenes.** Estamos terminando los últimos detalles: algunas imágenes son representativas y, donde falta una, queda el texto de lo que va a mostrar.

# 1. Antes de empezar

*Un teléfono, una computadora y una cuenta por rol, con datos sintéticos.*

## 1.1 Qué hace falta

- **Persona · Un teléfono Android.** Android 7 o posterior, para la app de la persona. Se instala desde un enlace, fuera de la tienda.
- **Profesional · Una computadora.** Con un navegador de escritorio, de 1024 a 1920 de ancho; se recomienda 1280 o más, para el website.
- **Administración · La misma computadora.** Administración entra por su propia puerta y, además de la contraseña, escribe el código de una app de códigos, como Google Authenticator.

## 1.2 Los enlaces

![Figura 1: Los dos enlaces de BE, con su código QR. El de la app baja siempre la última](pendiente)

> **Texto de la figura:**
> - La app para Android: https://github.com/Elian-Bufi/be/releases/latest/download/be.apk. Desde el teléfono: se escanea el código con la cámara y baja el archivo «be.apk». El website también la ofrece en su portada, con «Bajar BE».
> - El website: https://be-web-1ngj.onrender.com. Desde la computadora. La profesional entra con «Ya tengo una cuenta». Administración tiene su propia entrada, en /admin.

## 1.3 Lo que conviene saber

- **Los datos · Son sintéticos.** La profesional, sus colegas y las personas que acompaña están armadas para la evaluación, con nombres ficticios y la inicial del apellido. Ninguna persona es real.
- **La historia · Nada se pisa.** Lo que se acepta, se activa o se registra queda en la historia. Por eso el recorrido completo se hace una vez.
- **Las ventanas · Una cuenta por ventana.** Si la profesional y la persona se abren en la misma computadora, la segunda va en una ventana privada. Administración tiene su propia sesión.
- **Lo de ahora · Se actualiza solo.** En el website, al volver a la pestaña, BE se fija si hay algo nuevo y lo dice con «Hay datos nuevos · Ver». En la app, se tira la pantalla hacia abajo: debajo del título dice «Al día» y la hora.

## 1.4 Cuentas para probar

[CUENTAS DEL TUTOR: se completan en el documento privado]

Las credenciales no van en este documento ni en el repositorio: se entregan aparte, por el canal acordado con el tutor.

**Tabla 2.** Las cuentas de la evaluación, quién es cada una y dónde entra.

| Rol | Quién es en la muestra | Dónde entra |
| --- | --- | --- |
| Profesional | Lic. Julieta Arce: Nutrición, Entrenamiento y Antropometría | El website, con «Ya tengo una cuenta» |
| Persona | Carolina R., una de sus personas | La app, en el teléfono |
| Administración, si se entrega | La consola de Administración | El website, en /admin, con su segundo factor |

## 1.5 Cómo se entra

La profesional y la persona entran con su correo y su contraseña (o con Google, si la cuenta lo tiene). Administración, además, escribe el código de seis dígitos de su app de códigos, que cambia cada 30 segundos: la consola que decide quién opera en BE pide dos pasos.

# 2. La persona, en la app

*Lo que tiene para hoy, registrar y decidir quién ve qué, desde el teléfono.*

## 2.1 Instalar la app

La app se instala fuera de Google Play, desde el archivo que baja el enlace de «Los enlaces». Para eso **no se desactiva ninguna protección**: Android solo pide, la primera vez, autorizar al navegador como fuente de la instalación. Play Protect sigue activo y, como la app no viene de la tienda, puede pedir una confirmación.

**Tabla 3.** La instalación, paso a paso. Los nombres cambian un poco según la marca del teléfono.

| # | Qué hacer | Qué se ve |
| --- | --- | --- |
| 1 | Escanear el QR de la app con la cámara del teléfono, o abrir el enlace en su navegador. | Baja el archivo «be.apk». |
| 2 | Tocar «be.apk» en el aviso de la descarga, o abrirlo desde «Descargas» o «Mis archivos». | Android avisa que, por seguridad, no instala apps de esa fuente. |
| 3 | Tocar «Configuración» (o «Ajustes») y activar «Permitir de esta fuente» para el navegador. | Se activa una sola vez. Con otras marcas, se busca «Instalar apps desconocidas» y se le permite al navegador. |
| 4 | Volver y tocar «Instalar». | Si Play Protect pregunta, se toca «Más detalles» y después «Instalar de todos modos». |
| 5 | Abrir BE. | La bienvenida, «Tu seguimiento, con tus profesionales», con «Crear cuenta» e «Iniciar sesión». |

## 2.2 El recorrido corto

Con la cuenta de Carolina R. en el teléfono. La barra de abajo tiene cinco destinos: **Inicio, Nutrición, Entrenamiento, Evolución y Perfil**. Arriba a la derecha, la campana abre las «Novedades», con un punto mientras haya algo sin leer. La app muestra los últimos 90 días: la historia larga se ve en el website.

**Tabla 4.** El recorrido corto de la persona.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Abrir BE, tocar «Iniciar sesión» y entrar con la cuenta de la persona. | La primera vez en ese teléfono, tres tarjetas presentan BE; todas tienen «Saltar», y la tercera, «¿Te avisamos?», pregunta por los avisos. Después, Inicio, con la fecha de hoy, el entrenamiento y las comidas del día. |
| 2 | En **Nutrición**, abrir una comida del plan de hoy, pasar sus opciones con las flechas o deslizando y tocar «Comí esta opción». | Arriba de cada opción, «Opción n de m» y los puntitos; la foto grande del plato o su miniatura, y los macros con su ícono, su número y su abreviatura. «Nutrición» queda en la cabecera. La comida queda registrada con su hora, también en Inicio. Si comió otra cosa, «Comí algo diferente» la registra aparte, con foto si quiere. |
| 3 | En **Entrenamiento**, tocar «Empezar» en la sesión de hoy. | Cada ejercicio con sus series, bajo su bloque si lo tiene, y debajo, una línea tenue con «La vez pasada»: la fecha y lo que hizo esa vez. |
| 4 | Tocar «Empezar serie 1» y, al terminarla, «Terminar serie 1»; seguir así y, al final, «Finalizar entrenamiento». | Entre serie y serie corre el descanso. Las series de calentamiento se registran y no cuentan. Si el plan está en RPE, el esfuerzo se elige de una lista. Antes de finalizar, BE muestra cuántas series quedaron registradas; lo que falta queda «Sin registrar», nunca como un cero. «Ya la hice» registra una sesión de una vez. |
| 5 | En **Evolución**, mirar la última toma. | La última toma ubicada sobre la figura, cada medida en el tiempo y lo calculado con su método, siempre como estimación. Ningún valor se marca como bueno o malo. |
| 6 | Tocar la **campana**. | Las «Novedades»: un plan nuevo, una revisión registrada, un pedido de su profesional. Cada una abre lo que avisa. |
| 7 | En **Perfil**, abrir «Quién ve qué». | Por profesional y por área: lo que autorizó y desde cuándo, con un interruptor por cosa, y «Tus hábitos». Arriba, el tratamiento de sus datos de salud y los «Pedidos para responder». |

> **Si se va a hacer el recorrido completo.** Los pasos 2 a 4 quedan registrados en la historia de Carolina. Se pueden dejar para el paso «Registrar» del recorrido completo.

# 3. La profesional, en el website

*Las personas que acompaña, la ficha de cada una y sus áreas, con todo el contexto.*

**Tabla 5.** El recorrido corto de la profesional.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Entrar al website con la cuenta de la Lic. Julieta Arce. | El «Espacio profesional»: «Te toca a vos», con lo que hay que hacer y su fecha; «Esperan respuesta»; «Tu semana», y «Las personas que acompañás». |
| 2 | En «Las personas que acompañás», tocar a una persona. | Su ficha, con «Resumen», «Patrones», «Línea de tiempo» y «Analizar». Arriba, «Acceso actual» dice qué áreas puede ver hoy. |
| 3 | Abrir un área («Abrir Nutrición», «Abrir Entrenamiento» o «Abrir Antropometría»). | Una franja arriba: la vuelta a la ficha, el área, la persona y su acceso. Debajo, «Resumen», «Plan», «Registros» y «Revisiones», o las tomas en Antropometría. |
| 4 | En «Plan» de Nutrición, abrir la versión en preparación, o empezar una con «Nueva versión del plan». | El editor: el «Reparto por comida» de cada día tipo, la franja de cada comida con el promedio de sus opciones y «Rangos y totales» al costado. Si hay un objetivo más nuevo, «Usarla ahora». |
| 5 | En «Plan» de Entrenamiento, abrir el editor. La primera vez aparece el recorrido guiado: seguirlo con «Siguiente» o tocar «Omitir»; «Ver el recorrido» lo vuelve a mostrar. | Arriba, la barra «Fases del plan»; debajo, las sesiones de la fase como tarjetas; a la derecha, el «Almanaque» con cada semana del color de su fase. En «Configurar plan», la «Intensidad del plan» (RIR, RPE, % RM o solo carga), «Redondear las cargas a» y «Pedir el esfuerzo de la sesión al terminar». |
| 6 | En el editor, abrir un ejercicio de una sesión y mirar el panel de la derecha; después, «Agregar ejercicios». | En el panel, «La carga en el tiempo» y «La vez pasada», lo que la persona registró serie por serie. En «Agregar ejercicios», todo el catálogo con filtros por grupo muscular, equipamiento y patrón, y la marca «Con historial». |
| 7 | En el menú de arriba, «Mis recetas». | Dos pestañas: «Mis recetas» y el «Recetario de BE», con «Copiar a Mis recetas». Una receta propia ofrece «Proponer al Recetario de BE». |
| 8 | En «Plantillas y habituales», mirar las plantillas. | Las plantillas de entrenamiento, con sus versiones; «Nueva plantilla» prepara una sin elegir a ninguna persona. Al empezar un plan, «Empezar desde una plantilla» ofrece también las «Plantillas de BE». |

# 4. Cinco personas, cinco historias

*Cada persona muestra algo distinto. Todas tienen más de un año de historia, salvo la que recién empieza.*

**Tabla 6.** Qué mirar con cada persona.

| Persona | Qué muestra | Dónde mirarlo |
| --- | --- | --- |
| **Tomás M.**, 31 años | El progreso: fases de adaptación, hipertrofia, fuerza y descarga, con el objetivo de Nutrición ajustado en el camino. | En la ficha, «Analizar» → «¿Cómo viene progresando este ejercicio?»: el 1RM estimado de la sentadilla, sesión por sesión, con las versiones del plan de fondo. En el editor de Entrenamiento, «Con historial» y «La vez pasada». |
| **Valeria Q.**, 38 años | El estancamiento y la descarga, y la historia anterior: viene de otro entrenador, y lo autorizó a la profesional. | En «Más» → «Historia anterior», lo que pasó con el entrenador anterior, en solo lectura y marcado como de otro profesional. En «Analizar», el press que no cambió durante diez semanas y la descarga que siguió. En el editor, el panel «Contexto de…» muestra el contexto que declaró. BE guarda lo que la persona declara como contexto, medicación incluida, pero no lo interpreta ni lo trata. |
| **Gustavo P.**, 47 años | La vuelta después de una pausa por una mudanza, con un déficit moderado y un plan simplificado con medidas caseras. | En la «Línea de tiempo», las semanas sin registro, que dicen «Sin registro» y no un cero, y la vuelta con cargas más bajas. En el plan de Nutrición, las medidas caseras. |
| **Carolina R.**, 34 años | La composición corporal: dos déficits con un mantenimiento en el medio, con un plan sin carne ni pescado. Es la cuenta de la app. | En Antropometría, la evolución «Por medida» y «Por método»; en «Patrones», el peso y la energía en el mismo tiempo, sin afirmar causas. |
| **Silvia D.**, 58 años | La que recién empieza, por indicación médica: su plan siguiente en preparación, un pedido de información sin responder, y Nutrición con otra colega, la Lic. Natalia Y. | En el «Espacio profesional», su plan siguiente con «Seguir el borrador», y el pedido de información que todavía no respondió. En la ficha, lo que Silvia comparte de Nutrición y las notas de coordinación con la colega. |

![Figura 2: «Analizar», con el 1RM estimado de un ejercicio y las versiones del plan de fondo. Captura del website](pendiente)

![Figura 3: La historia anterior de Valeria Q., en solo lectura y marcada como de otro profesional. Captura del website](pendiente)

# 5. Administración, en el website

*Habilitar a cada profesional por área, con su fundamento. Sin ver datos de salud.*

Administración decide qué profesionales pueden operar en BE y en qué área. Entra por su propia puerta, con su segundo factor, y ninguna de sus pantallas muestra un plan, un registro o una medición de una persona. Esta parte se prueba si se entrega la cuenta de Administración.

**Tabla 7.** El recorrido corto de Administración.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Abrir el website en /admin. | «Entrar a Administración», aparte de la portada del website. |
| 2 | Escribir «Correo» y «Contraseña», tocar «Continuar» y, en «Código del autenticador», el código de la app; «Confirmar». | «Profesionales»: los profesionales registrados en BE y su situación en cada área. |
| 3 | Buscar a la profesional en «Buscar por nombre o correo» y abrir su ficha. | «Áreas»: en cada una, la «Verificación» y la «Habilitación para operar en BE», con desde cuándo, y el «Historial» de las decisiones. |
| 4 | Mirar las decisiones que ofrece cada área. Se puede abrir una y salir con «Cancelar». | Cada decisión pide un «Fundamento interno», que ve solo Administración, y, cuando corresponde, un «Texto para el profesional». Cancelar no registra nada. |
| 5 | En el menú, «Alimentos» y «Propuestas al Recetario de BE». | Los alimentos cargados a mano, agrupados por nombre parecido, con quién los cargó y nunca a quién se le indicaron; las recetas propuestas, con su autor, la cesión de la foto y las «Parecidas», con «Sumar al Recetario de BE» o «No sumarla». |

> **Lo que se tiene que notar.** Administración **habilita, pero no mira**. Habilitar no es certificar una matrícula, y cada decisión queda en el historial con su fundamento.

# 6. El recorrido completo

*Seis pasos entre la profesional y Carolina, del plan nuevo a la revisión.*

El recorrido **va y vuelve** entre la computadora y el teléfono. Para prepararse: el teléfono con la cuenta de Carolina R. y, en la computadora, la cuenta de la Lic. Julieta Arce. El recorrido se hace una sola vez: activar el plan y registrar quedan en la historia de Carolina.

1. **Invitar** (Profesional): La profesional crea una invitación para una persona nueva: enlace, QR o código.
2. **Activar un plan** (Profesional): Ajusta el plan de Entrenamiento de Carolina, con el esfuerzo en RPE, y activa la versión nueva.
3. **Registrar** (Persona): Carolina hace la sesión, eligiendo el esfuerzo en RPE, y registra una comida pasando sus opciones.
4. **Revisar** (Profesional): La profesional ve lo registrado frente a lo indicado y registra una revisión.
5. **Mirar los gráficos** (Profesional): «La vez pasada», el 1RM estimado con la serie de la que salió y las versiones del plan, en el tiempo.
6. **Retirar algo** (Persona): En «Quién ve qué», Carolina deja de compartir una cosa sola.

*Figura 4: El recorrido completo. Cada paso tiene su sección.*

## 6.1 Invitar

**La profesional**, en el website: en el «Espacio profesional», «Invitar a alguien nuevo» (enlace, QR o código); elegir el área y tocar «Crear invitación».

**Qué se tiene que ver:** «La invitación está lista», con el «Enlace», el «Código QR» y el «Código», y «Copiar enlace» y «Compartir por WhatsApp». El enlace y el código se muestran solo ahora; la invitación es para una sola persona y vence a los 7 días. Quien la acepta ve, en una sola pantalla, qué se propone compartir y para qué, cosa por cosa, y decide con un toque: «Aceptar y compartir»; «Elegir qué compartir», que muestra un interruptor por cosa, o «Ahora no», que no registra nada. Si deja sin marcar el tratamiento de sus datos de salud, la pantalla lo dice al lado: «Sin esto, ningún profesional ve tus datos de salud.»

## 6.2 Activar un plan

**La profesional**, en el website: en la ficha de Carolina, en el «Resumen», la tarjeta de Entrenamiento ofrece «Ajustar el plan» (o «Seguir el borrador», si ya hay uno). En «Configurar plan», elegir el «Inicio» y la «Duración», la «Intensidad del plan» en «RPE» y marcar «Pedir el esfuerzo de la sesión al terminar»; «Guardar». En una fase, «Editar fase» para ver sus semanas y sus días; en el «Almanaque» del panel, cada semana toma el color de su fase. Abrir un ejercicio con barra y cambiar algo, por ejemplo la carga de una serie; probar «Deshacer» y volver a hacerlo. Esperar «Guardado», mirar «Antes de activar» en la barra y tocar «Revisar y activar…».

**Qué se tiene que ver:** «Antes de activar» dice cuántas cosas impiden activar, o «Nada impide activar», y cada una lleva a su lugar con «Ir a…». En «Revisar y activar…», «Antes de activar la versión» con su número: lo que impide activar, si hay algo; lo que cambia frente a la versión vigente, con «Cómo se escribe el esfuerzo: RIR → RPE»; lo que va a ver Carolina, y «¿Cuándo la revisás?». «Activar la versión…» la activa, y la anterior se conserva.

**Carolina**, en la app: la campana avisa el plan nuevo de Entrenamiento, y Entrenamiento ya lo muestra.

## 6.3 Registrar

**Carolina**, en la app, en Entrenamiento: «Empezar» la sesión; en cada serie, el esfuerzo se elige de una lista (de 10 a 6,5 y «6 o menos»). Al tocar «Finalizar entrenamiento», la app pregunta «¿Qué tan duro fue el entrenamiento, en general?», de 0 a 10, con los minutos del cronómetro; responder y «Guardar» (o «Ahora no»). En Nutrición, abrir una comida, pasar sus opciones con las flechas o deslizando y tocar «Comí esta opción».

**Qué se tiene que ver:** en Inicio, la sesión y la comida registradas. Lo registrado queda aparte de lo indicado: BE guarda las dos cosas, y ninguna pisa a la otra. Lo que se guarda del esfuerzo de cada serie es siempre el RIR, así que la historia no cambia. El esfuerzo de la sesión queda aparte («Gracias: quedó guardado.») y la profesional lo ve con la carga de la sesión: el esfuerzo por los minutos.

## 6.4 Revisar

**La profesional**, en el website: «Abrir Entrenamiento» y, en «Registros», la sesión que Carolina acaba de hacer, al lado de lo que indicaba el plan, en RPE. Después, en «Revisiones», «Nueva revisión», en tres pasos: «Lo que miraste», «Lo que observaste» y «Lo que decidís». Tocar «Registrar revisión».

**Qué se tiene que ver:** la revisión queda en «Revisiones registradas», con su resultado, su fundamento y la próxima acción. BE no sugiere el resultado: lo decide la profesional. **Carolina** recibe en la campana la revisión y, al tocarla, la ve completa.

## 6.5 Mirar los gráficos

**La profesional**, en el editor de Entrenamiento: en un ejercicio con barra, «Detalle y fuerza estimada».

- **«La vez pasada»**, debajo de «Lo que indica el plan» y sin mezclarse con eso: lo que Carolina registró las últimas veces, serie por serie, en la notación del plan.
- **«En el tiempo» → «Historial»:** el 1RM estimado, una estimación por sesión con las versiones del plan de fondo, y cada estimación dice con qué serie salió («estimado con 5 reps a RPE 8 · 100 kg»).
- **«Abrir en Analizar»** lleva el ejercicio a «Analizar». Ahí las métricas se ven «Alineadas» o «Superpuestas», y «Armá tu gráfico» junta hasta tres series de distintas áreas. Cuando se superponen dos áreas, el gráfico lo dice: «Coinciden en el tiempo; esto no prueba que una cosa cause la otra.»

![Figura 5: El editor de Entrenamiento de Carolina R.: la barra «Fases del plan», un ejercicio abierto con sus series y, en el panel, «La vez pasada». Captura del website](pendiente)

[Figura a recapturar: la figura 5 tiene que mostrar el editor nuevo sobre el plan de Carolina R., con la barra de fases, el «Almanaque» o «La vez pasada» en el panel y «Antes de activar» en la barra.]

## 6.6 Retirar algo en «Quién ve qué»

**Carolina**, en la app: en Perfil, «Quién ve qué». Debajo de la profesional, apagar una cosa sola.

**Qué se tiene que ver:** BE pide confirmar con «Dejar de compartir»: deja de verse desde ese momento, no se borra nada y se puede volver a compartir. Al confirmar, el interruptor dice «No lo ve». En el website, al volver a la pestaña, «Hay datos nuevos · Ver».

> **El final del recorrido.** BE guarda lo indicado y lo registrado por separado, en el tiempo, y la persona decide quién ve qué. Si cambia de profesional, **no empieza de cero**: la historia anterior de Valeria Q. muestra cómo lo ve el profesional nuevo.

# 7. Si algo falla

*Lo que puede pasar durante la prueba, y qué hacer.*

**Tabla 8.** Qué hacer si algo falla.

| Lo que pasa | Qué hacer |
| --- | --- |
| Android no deja instalar la app | Autorizar al navegador como fuente («Permitir de esta fuente») y, si Play Protect pregunta, «Más detalles» → «Instalar de todos modos». Hace falta Android 7 o posterior. |
| Ya hay una app BE en el teléfono | Instalar la última desde el enlace de esta guía. Si Android no la deja instalar encima, desinstalar la anterior y volver a instalar. |
| «Demasiados intentos. Probá de nuevo más tarde.» | Son cinco intentos de entrar cada 15 minutos, por red y por cuenta: esperar y volver a probar. |
| Lo que hizo la persona no aparece en el website | Volver a la pestaña: BE se fija solo si hay algo nuevo y lo dice con «Hay datos nuevos · Ver». |
| Administración: «El código no es válido o ya se usó.» | Esperar el código siguiente de la app de códigos, que cambia cada 30 segundos, y revisar que el teléfono tenga la hora automática. |
| Al recargar el website aparece «Recuperando tu sesión…» | Es normal: la sesión vuelve sola. Vence a las 12 horas; la de Administración, a las 8. Después, se entra de nuevo. |
