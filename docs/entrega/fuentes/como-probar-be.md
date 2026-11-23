# Cómo probar BE

*Qué hace falta, con qué cuenta entrar y qué probar con cada rol, paso a paso, hasta recorrer el ciclo completo entre la persona, sus profesionales y Administración.*

> Todos los datos son sintéticos: Diego Sosa y sus profesionales no son personas reales.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** Noviembre de 2026

> **Resumen.** Con las cuentas de evaluación se recorre BE de punta a punta. Primero, un recorrido corto por rol; después, el ciclo completo sobre la historia de Diego Sosa, de la invitación a la historia anterior.

**Fecha:** Noviembre de 2026
**Lo acompaña:** El paso a paso de cada tarea, en los manuales de usuario (09). Qué es BE y por qué importa, en el Resumen y guía (00).

# Resumen

*Tres maneras de entrar a BE, y un recorrido que las une.*

Esta guía sirve para recorrer BE sin ayuda, con cuentas preparadas para la evaluación. BE tiene tres roles, y cada uno entra por su lado: la **persona**, con la app en su teléfono Android; el **profesional**, con el website en la computadora; y **Administración**, también en el website, por su propia entrada.

Los datos son los de una historia sintética. Diego Sosa tiene 36 años y lleva tres en BE: la Lic. Sofía Paz lo acompaña en Nutrición y Antropometría, y el Prof. Martín Acosta, en Entrenamiento. Su historia tiene planes que cambiaron de versión, comidas y sesiones registradas, tomas y revisiones: lo que hace falta para ver a BE trabajar en el tiempo.

Se puede probar de dos maneras. Los **recorridos cortos** muestran qué ve y qué hace cada rol. El **recorrido completo** une a los tres, de la invitación de una profesional nueva a la historia anterior que Diego le autoriza.

> **La idea clave.** La prueba más elocuente es **cruzar las pantallas**: lo que la persona registra en el teléfono aparece en el website al lado de lo que el profesional indicó, y lo que el profesional activa o revisa le llega a la persona.

**Tabla 1.** Qué se prueba con cada rol y dónde está en esta guía.

| Rol | Dónde | Qué se prueba | En esta guía |
| --- | --- | --- | --- |
| Persona | La app, en un teléfono Android | Lo que tiene para hoy, registrar comidas y sesiones, su evolución y quién ve qué | «La persona, en la app» |
| Profesional | El website, en la computadora | Las personas que acompaña, la ficha de cada una, sus áreas, los planes, las revisiones y los gráficos | «El profesional, en el website» |
| Administración | El website, en su propia entrada | Habilitar a cada profesional por área, con su fundamento, sin ver datos de salud | «Administración, en el website» |
| Los tres | La app y el website | El ciclo completo, en ocho pasos | «El recorrido completo» |

# 1. Antes de empezar

*Un teléfono, una computadora, una app de códigos y una cuenta por rol, con datos sintéticos.*

## 1.1 Qué hace falta

- **PERSONA · Un teléfono Android.** Android 7 o posterior, para la app de la persona. Se instala desde un enlace, fuera de la tienda.

- **PROFESIONAL Y ADMINISTRACIÓN · Una computadora.** Con un navegador de escritorio y una pantalla de 1280 de ancho o más, para el website.

- **SEGUNDO FACTOR · Una app de códigos.** En cualquier teléfono; por ejemplo, Google Authenticator. Da el código que piden el profesional y Administración al entrar.

*Figura 1: Lo que hace falta para probar BE.*

## 1.2 Los enlaces

![Figura 2: Los dos enlaces de BE, con su código QR. El de la app baja siempre la última](pendiente)

> **Texto de la figura:**
> - La app para Android
> - https://github.com/Elian-Bufi/be/releases/latest/download/be.apk
> - Desde el teléfono: se escanea el código con la cámara y baja el archivo «be.apk». El website también la ofrece en su portada, con «Bajar BE».
> - El website
> - https://be-web-1ngj.onrender.com
> - Desde la computadora. El profesional entra con «Ya tengo una cuenta». Administración tiene su propia entrada: [be-web-1ngj.onrender.com/admin](https://be-web-1ngj.onrender.com/admin).

## 1.3 Lo que conviene saber

- **LOS DATOS · Son sintéticos.** Diego Sosa, su historia y sus profesionales están armados para la demostración. Ninguna persona es real.

- **LA HISTORIA · Nada se borra.** Lo que se acepta, se activa o se registra queda en la historia. Por eso el recorrido completo se hace una vez.

- **LAS VENTANAS · Una cuenta por ventana.** Al entrar con otra cuenta, las pestañas de la anterior se recargan: la segunda va en una ventana privada. Administración tiene su propia sesión.

- **LO DE AHORA · Volver a leer.** En el website, «Actualizar». En la app, se tira la pantalla hacia abajo: debajo del título dice «Al día» y la hora.

*Figura 3: Cuatro cosas que evitan sorpresas durante la prueba.*

## 1.4 Las cuentas de evaluación

Las credenciales no van en este documento: se entregan junto con él, en la fila de las cuentas de evaluación.

**Tabla 2.** Las cuentas de evaluación, quién es cada una en la historia y dónde entra.

| Rol | Quién es en la historia | Correo | Contraseña | Segundo factor |
| --- | --- | --- | --- | --- |
| Persona · en la app | Diego Sosa | [COMPLETAR: [correo]] | [COMPLETAR: [contraseña]] | No lo usa |
| Profesional · en el website | Lic. Sofía Paz: Nutrición y Antropometría | [COMPLETAR: [correo]] | [COMPLETAR: [contraseña]] | QR adjunto |
| Profesional · en el website | Prof. Martín Acosta: Entrenamiento | [COMPLETAR: [correo]] | [COMPLETAR: [contraseña]] | QR adjunto |
| Profesional · en el website | Prof. Lucía Benítez: Antropometría, la profesional nueva del recorrido completo | [COMPLETAR: [correo]] | [COMPLETAR: [contraseña]] | QR adjunto |
| Administración · en el website, /admin | La consola de Administración | [COMPLETAR: [correo]] | [COMPLETAR: [contraseña]] | QR adjunto |

## 1.5 Cómo se entra con el segundo factor

La persona entra con su correo y su contraseña. El profesional y Administración, además, escriben un código de seis dígitos que da una app de códigos y cambia cada 30 segundos: así, una contraseña sola no alcanza para ver datos de salud ni para habilitar profesionales. Cada una de esas cuentas ya tiene su autenticador configurado, y **el QR de ese autenticador se entrega junto con sus credenciales**.

**Tabla 3.** Entrar con el segundo factor.

| # | Qué hacer | Qué se ve |
| --- | --- | --- |
| 1 | En el teléfono, abrir la app de códigos, agregar una cuenta y escanear el QR que vino con las credenciales. Se hace una vez por cuenta. | La cuenta de BE en la app, con un código de seis dígitos que cambia cada 30 segundos. |
| 2 | En la computadora, entrar al website con el correo y la contraseña: el profesional, con «Iniciar sesión»; Administración, en /admin, con «Continuar». | El profesional ve «Confirmá que sos vos»; Administración, «Código del autenticador». |
| 3 | Escribir el código que muestra la app en «Código de seis dígitos» y tocar «Confirmar». | El profesional entra a su «Espacio profesional»; Administración, a «Profesionales». |

El profesional escribe el código una vez por sesión. Administración lo vuelve a escribir después de 15 minutos sin actividad, y su sesión vence a las 8 horas. Si un código no vale, «Si algo falla» dice qué hacer.

# 2. La persona, en la app

*Lo que tiene para hoy, registrar y decidir quién ve qué, desde el teléfono.*

## 2.1 Instalar la app

La app se instala fuera de Google Play, desde el archivo que baja el enlace de «Los enlaces». Para eso **no se desactiva ninguna protección**: Android solo pide, la primera vez, autorizar al navegador como fuente de la instalación. Play Protect sigue activo y, como la app no viene de la tienda, puede pedir una confirmación.

**Tabla 4.** La instalación, paso a paso. Los nombres cambian un poco según la marca del teléfono.

| # | Qué hacer | Qué se ve |
| --- | --- | --- |
| 1 | Escanear el QR de la app con la cámara del teléfono, o abrir el enlace en su navegador. | Baja el archivo «be.apk». |
| 2 | Tocar «be.apk» en el aviso de la descarga, o abrirlo desde «Descargas» o «Mis archivos». | Android avisa que, por seguridad, no instala apps de esa fuente. |
| 3 | Tocar «Configuración» (o «Ajustes») y activar «Permitir de esta fuente» para el navegador. | Se activa una sola vez. Con otras marcas, se busca «Instalar apps desconocidas» y se le permite al navegador. |
| 4 | Volver y tocar «Instalar». | Si Play Protect pregunta, se toca «Más detalles» y después «Instalar de todos modos». |
| 5 | Abrir BE. | La bienvenida, «Tu seguimiento, con tus profesionales», con «Crear cuenta» e «Iniciar sesión». |

## 2.2 El recorrido corto

Con la cuenta de Diego Sosa en el teléfono. La barra de abajo tiene cinco destinos: **Inicio, Nutrición, Entrenamiento, Evolución y Perfil**. Arriba a la derecha, la campana abre las «Novedades», con un punto mientras haya algo sin leer.

**Tabla 5.** El recorrido corto de la persona.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Abrir BE, tocar «Iniciar sesión» y entrar con la cuenta de Persona. | La primera vez en ese teléfono, tres tarjetas presentan BE; todas tienen «Saltar», y la tercera, «¿Te avisamos?», pregunta por los avisos. Después, Inicio, con la fecha de hoy: «Entrenamiento de hoy», las «Comidas» del día, «Mediciones» y la «Actividad». |
| 2 | En **Nutrición**, abrir una comida del plan de hoy, elegir una de sus opciones y tocar «Comí esta opción». | La comida queda registrada con su hora, también en Inicio. Si comió otra cosa, «Comí algo diferente» la registra aparte, con foto si quiere. |
| 3 | En **Entrenamiento**, tocar «Empezar» en la sesión de hoy. | Cada ejercicio con sus series y, debajo, una línea tenue con «La vez pasada»: la fecha y lo que hizo esa vez. |
| 4 | Tocar «Empezar serie 1» y, al terminarla, «Terminar serie 1»; seguir así y, al final, «Finalizar entrenamiento». | Entre serie y serie corre el descanso. Antes de finalizar, BE muestra cuántas series quedaron registradas; lo que falta queda «Sin registrar», nunca como un cero. «Ya la hice» registra una sesión de una vez, sin cronómetros. |
| 5 | En **Evolución**, mirar la última toma. | La última toma ubicada sobre la figura, cada medida en el tiempo y lo calculado con su método. Ningún valor se marca como bueno o malo. |
| 6 | Tocar la **campana**. | Las «Novedades»: un plan nuevo, una revisión registrada, un pedido de sus profesionales. Cada una abre lo que avisa. |
| 7 | En **Perfil**, abrir «Quién ve qué». | Por profesional y por área: lo que autorizó y desde cuándo, «Lo que ve de tus otras áreas», con un interruptor por cosa, y «Tus hábitos». Arriba, el tratamiento de sus datos de salud y los «Pedidos para responder». |
| 8 | En **Perfil**, mirar «Vínculos y solicitudes», «Mis hábitos» y «Privacidad y consentimientos». | Cada vínculo con su estado, y lo que autorizó, con su texto. Pausar o finalizar un vínculo corta el acceso del profesional: con la cuenta de evaluación, mejor no hacerlo. |

> **Si se va a hacer el recorrido completo.** Los pasos 2 a 4 quedan registrados en la historia de Diego. Se pueden dejar para el paso «Registrar» del recorrido completo («Registrar»). Si en Inicio aparece la tarjeta «Compartí lo tuyo entre tus profesionales», es la invitación a compartir el resumen y el plan de cada área entre sus profesionales: «Compartir todo con tus profesionales» abre la misma pantalla de «Aceptar y compartir», y «Ahora no» la deja de mostrar.

# 3. El profesional, en el website

*Las personas que acompaña, la ficha de cada una y su área, con todo el contexto.*

Con la cuenta de la Lic. Sofía Paz, que acompaña a Diego en Nutrición y Antropometría. El recorrido completo («El recorrido completo») muestra lo de Entrenamiento con el Prof. Martín Acosta.

**Tabla 6.** El recorrido corto del profesional.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Entrar al website con la cuenta de la Lic. Sofía Paz y su código («Cómo se entra con el segundo factor»). | El «Espacio profesional»: «Te toca a vos», con lo que hay que hacer y su fecha; «Esperan respuesta»; «Tu semana», y «Las personas que acompañás». |
| 2 | En «Las personas que acompañás», tocar **Diego Sosa**. | Su ficha, con las vistas «Resumen», «Línea de tiempo» y «Analizar». Arriba, «Acceso actual» dice qué áreas puede ver hoy; al lado, «Pedir información», «Más» y «Actualizar». |
| 3 | Mirar el «Resumen». | Una tarjeta por área, con su plan vigente y lo último registrado, y el enlace para abrirla: «Abrir Nutrición», «Abrir Antropometría». Sin semáforos: BE ubica, no califica. |
| 4 | Abrir la «Línea de tiempo». | La historia de Diego en orden: los planes y sus versiones, las revisiones y las tomas. |
| 5 | Abrir «Analizar». | «¿Qué querés mirar?»: las métricas de sus áreas en el tiempo, con las etapas de los planes de fondo; se pueden comparar dos etapas o dos períodos. |
| 6 | «Abrir Nutrición» y recorrer «Resumen», «Plan», «Registros» y «Revisiones». | En «Registros», lo indicado y lo registrado por día; un día sin registro dice «Sin registro», no un cero. En «Plan», «Otras áreas · lo comparte la persona», con el plan de Entrenamiento que Diego le comparte. |
| 7 | «Abrir Antropometría», abrir la toma más reciente en «Tomas» y bajar hasta el final. | «Desde el inicio y desde la anterior»: cada medida de la toma, la diferencia con la primera toma y con la anterior, y los días entre fechas. |
| 8 | Opcional: «Pedir información», arriba de la ficha. | El pedido se arma campo por campo, con su propósito. Pedir información no amplía el acceso ni el consentimiento; Diego lo ve en la app, en Perfil, «Para responder». |

![Figura 4: «Analizar», comparando dos etapas del plan de Nutrición de Diego Sosa: desde cuándo y hasta cuándo rigió cada versión, qué se sabe de cada una y la diferencia entre las dos, sin restar totales de duraciones distintas. Captura del website, vista por la Lic. Sofía Paz](pendiente)

![Figura 5: «Desde el inicio y desde la anterior», al final de una toma de Diego Sosa. Cada diferencia es una resta, con su signo y su unidad: ubica el cambio, no lo califica. Captura del website](pendiente)

# 4. Administración, en el website

*Habilitar a cada profesional por área, con su fundamento. Sin ver datos de salud.*

Administración decide qué profesionales pueden operar en BE y en qué área. Entra por su propia puerta, con su segundo factor, y ninguna de sus pantallas muestra un plan, un registro o una medición de una persona.

**Tabla 7.** El recorrido corto de Administración.

| # | Qué hacer | Qué se tiene que ver |
| --- | --- | --- |
| 1 | Abrir be-web-1ngj.onrender.com/admin. | «Entrar a Administración», aparte de la portada del website. |
| 2 | Escribir «Correo» y «Contraseña», tocar «Continuar» y, en «Código del autenticador», el código de la app; «Confirmar». | «Profesionales»: los profesionales registrados en BE y su situación en cada área. |
| 3 | Buscar «Benítez» en «Buscar por nombre o correo», o tocar «Ver las pendientes». | La lista, con la situación de cada área: «Puede operar», «Pendiente de revisión», «Verificada, sin habilitación»… |
| 4 | «Abrir la ficha» de la Prof. Lucía Benítez. | «Áreas»: en Antropometría, la «Verificación» y la «Habilitación para operar en BE», con desde cuándo. Debajo, el «Historial»: las decisiones de Administración y los hechos automáticos, del más nuevo al más viejo. |
| 5 | Mirar las decisiones que ofrece cada área. Se puede abrir una y salir con «Cancelar». | Cada decisión pide un «Fundamento interno», que ve solo Administración, y, cuando corresponde, un «Texto para el profesional». Cancelar no registra nada; confirmar sí, y avisa al profesional. |
| 6 | En el menú de la cuenta, arriba a la derecha, mirar «Seguridad de tu acceso», «Pedidos de derechos», «Incidencias» y «Recuperar el acceso». | Su autenticador; los pedidos de acceso, rectificación y supresión de las personas; lo que avisaron sobre el acceso, los datos o la app, y el código de un solo uso para que una persona recupere su acceso. |

> **Lo que se tiene que notar.** Administración **habilita, pero no mira**. Habilitar no es certificar una matrícula, y cada decisión queda en el historial con su fundamento.

# 5. El recorrido completo

*Ocho pasos entre la persona, sus profesionales y Administración, sobre la historia de Diego Sosa.*

Diego Sosa lleva tres años con la Lic. Sofía Paz y el Prof. Martín Acosta. Ahora suma a la **Prof. Lucía Benítez** para sus tomas de Antropometría. La invitación, el consentimiento, un plan nuevo con su registro y su revisión, los gráficos, un permiso que se retira y la historia anterior: todo el ciclo, con los tres roles. El recorrido **va y vuelve** entre el teléfono y la computadora, y termina donde BE se diferencia: una profesional nueva que no empieza de cero.

1. **Invitar** (Profesional): La Prof. Lucía Benítez crea una invitación: enlace, QR o código. Administración ya la habilitó en Antropometría.
2. **Aceptar y compartir** (Persona): Diego acepta y, en una sola pantalla, comparte lo que viene marcado.
3. **Activar un plan** (Profesional): El Prof. Martín Acosta ajusta el plan de Entrenamiento y activa la versión nueva.
4. **Registrar** (Persona): Diego hace la sesión serie por serie y registra una comida.
5. **Revisar** (Profesional): El Prof. Martín Acosta ve lo registrado y registra una revisión.
6. **Mirar los gráficos** (Profesional): «La vez pasada», el 1RM estimado y las versiones del plan, en el tiempo.
7. **Retirar algo** (Persona): En «Quién ve qué», Diego deja de compartir el plan de Nutrición.
8. **Ver la historia anterior** (Profesional): La Prof. Lucía Benítez ve, en solo lectura, las tomas de antes.

*Figura 6: El recorrido completo. Cada paso tiene su sección, con lo que se hace y lo que se tiene que ver.*

**Para prepararse.** El teléfono, con la cuenta de Diego Sosa. En la computadora, una ventana con la cuenta del Prof. Martín Acosta y una ventana privada con la de la Prof. Lucía Benítez; Administración, si se quiere ver el paso 1 desde su lado, en una pestaña aparte, porque su consola tiene su propia sesión. El recorrido se hace una sola vez: aceptar el vínculo, activar el plan y registrar quedan en la historia de Diego.

## 5.1 Invitar

**Administración** (opcional), en «Profesionales»: la ficha de la Prof. Lucía Benítez muestra Antropometría con «Puede operar». Sin esa habilitación, BE no la deja invitar en esa área.

**La Prof. Lucía Benítez**, en el website: en el «Espacio profesional», «Invitar a alguien nuevo» (enlace, QR o código). Como trabaja en una sola área, Antropometría ya viene elegida. Tocar «Crear invitación».

**Qué se tiene que ver:** «La invitación está lista», con el «Enlace», el «Código QR» y el «Código», y «Copiar enlace» y «Compartir por WhatsApp». El enlace y el código se muestran solo ahora; la invitación es para una sola persona y vence a los 7 días.

## 5.2 Aceptar y compartir

**Diego**, en la app: en Perfil, «Tengo un código»; escribir el código y tocar «Ver invitación». También se puede escanear el QR con la cámara: el enlace ofrece «Abrir en la app BE». La app dice «Prof. Lucía Benítez te invita a acompañarte en Antropometría.» Tocar «Aceptar invitación».

Enseguida aparece **una sola pantalla de consentimiento**, «Qué compartís con Prof. Lucía Benítez»: qué ve ella y para qué, y «Lo que vas a compartir», una línea por cosa, ya marcada. Sus datos de Antropometría; el resumen y el plan vigente de sus otras áreas, y lo de Antropometría para sus otros profesionales; su historia anterior de Antropometría, y sus hábitos, si corresponde.

Tres botones: **«Aceptar y compartir»**; **«Elegir qué compartir»**, que despliega un interruptor por cosa; y **«Ahora no»**, que no comparte nada. Las notas privadas de los profesionales nunca se comparten.

**Qué se tiene que ver:** «Listo: quedó registrado lo que compartís.», con «Ver vínculo» y el acceso a «Quién ve qué», donde cada cosa se puede retirar después.

*Maqueta*

![Figura 7: La pantalla única de consentimiento, con los textos de la app para este caso. La pantalla suma además el aviso del perfil de la profesional, y sus líneas dependen de lo que tiene cada persona](pendiente)

> **Texto de la figura:**
> - Vínculo aceptado
> - Qué compartís con Prof. Lucía Benítez
> - Prof. Lucía Benítez te va a acompañar en Antropometría. Para eso necesita ver tus datos de Antropometría. Y para planificar teniendo en cuenta todo lo tuyo, sirve que vea el resumen y el plan vigente de tus otras áreas, y que tus otros profesionales vean lo de Antropometría.
> - Lo que vas a compartir
> - Tus datos de Antropometría, para Prof. Lucía Benítez: para evaluación antropométrica.
> - El resumen y el plan vigente de Nutrición (de Lic. Sofía Paz), para Prof. Lucía Benítez.
> - El resumen y el plan vigente de Entrenamiento (de Prof. Martín Acosta), para Prof. Lucía Benítez.
> - El resumen de Antropometría (de Lic. Sofía Paz y Prof. Lucía Benítez), para Prof. Martín Acosta.
> - Tu historia anterior de Antropometría, para Prof. Lucía Benítez: lo que pasó antes en Antropometría con otros profesionales.
> - Las notas privadas de tus profesionales nunca se comparten.
> - Podés retirar cada cosa cuando quieras en «Quién ve qué», en tu Perfil: deja de verse desde ese momento, y no se borra nada.
> - Al tocar «Aceptar y compartir» aceptás los textos de lo que compartís: **Los textos completos ›**
> - Aceptar y compartir
> - Elegir qué compartir
> - Ahora no

A quien ya tiene vínculos, Inicio le muestra una sola vez la tarjeta «Compartí lo tuyo entre tus profesionales», con «Compartir todo con tus profesionales» y «Ahora no»: la misma pantalla, con todo lo de todos sus profesionales.

## 5.3 Activar un plan

**El Prof. Martín Acosta**, en el website: en «Las personas que acompañás», Diego Sosa. En el «Resumen», la tarjeta de Entrenamiento ofrece «Ajustar el plan» (o «Seguir el borrador», si ya hay uno): crea la versión nueva desde la vigente y la abre para editar. La versión en preparación avisa que Diego no la ve.

Cambiar algo, por ejemplo la carga de una serie, esperar «Guardado» y tocar «Revisar y activar…».

**Qué se tiene que ver:** «Antes de activar la versión» con su número: lo que impide activar, si hay algo; lo que cambia frente a la versión vigente; «Lo que va a ver Diego Sosa», y «¿Cuándo la revisás?». El botón «Activar la versión… de Entrenamiento» la activa, y la anterior se conserva.

**Diego**, en la app: la campana avisa «Plan nuevo de Entrenamiento», y Entrenamiento ya muestra el plan nuevo.

## 5.4 Registrar

**Diego**, en la app, en Entrenamiento: «Empezar» la sesión; en cada ejercicio, «Empezar serie 1» y «Terminar serie 1», con el descanso entre series, hasta «Finalizar entrenamiento». Para no hacerla entera, «Ya la hice» la registra de una vez. En Nutrición, una comida con «Comí esta opción».

**Qué se tiene que ver:** en Inicio, la sesión y la comida registradas. Lo registrado queda aparte de lo indicado: BE guarda las dos cosas, y ninguna pisa a la otra.

## 5.5 Revisar

**El Prof. Martín Acosta**, en el website: «Abrir Entrenamiento» y, en «Registros», la sesión que Diego acaba de hacer, al lado de lo que indicaba el plan. Después, en «Revisiones», «Nueva revisión», en tres pasos: «Lo que miraste» (lo que examinó, marcado por él), «Lo que observaste» y «Lo que decidís». Tocar «Registrar revisión».

**Qué se tiene que ver:** la revisión queda en «Revisiones registradas», con su resultado, su fundamento y la próxima acción. BE no sugiere el resultado: lo decide el profesional. **Diego** recibe en la campana «Revisión de Entrenamiento» y, al tocarla, la ve completa.

## 5.6 Mirar los gráficos

**El Prof. Martín Acosta**, en la versión en preparación del plan (si ya no hay, «Ajustar el plan» abre una nueva, que Diego no ve): en «Sentadilla trasera con barra», tocar «Detalle y fuerza estimada».

- **«La vez pasada»**, debajo de «Lo que indica el plan» y sin mezclarse con eso: lo que Diego registró las últimas veces, serie por serie.
- **«En el tiempo» → «Historial»:** el «1RM estimado (Epley v1)», una estimación por sesión con las versiones del plan de fondo; la carga, las repeticiones y el RIR de la misma serie; el RIR indicado y el registrado, y la cinta «Lo que pasó en el período». «Perfil de carga y repeticiones» muestra la carga frente a las repeticiones.
- **«Abrir en Analizar»** lleva el ejercicio a «Analizar». Ahí las métricas se ven «Alineadas», una debajo de la otra con el mismo eje de fechas, o «Superpuestas», en el mismo gráfico. En la ficha, «Patrones» → «Agregar un gráfico» abre **«Armá tu gráfico»**, que junta hasta tres series de distintas áreas. Cuando se superponen dos áreas, el gráfico lo dice: «Coinciden en el tiempo; esto no prueba que una cosa cause la otra.»

![Figura 8: El editor de Entrenamiento del Prof. Martín Acosta, con el historial de la sentadilla de Diego Sosa abierto al costado. Captura del website, a 1280 de ancho](pendiente)

> **Texto de la figura:**
> - 1. «9 · en preparación» y «8 · activa»: la versión nueva se prepara al lado de la vigente, y la persona no la ve hasta que se activa.
> - 2. «Detalle y fuerza estimada» abre el cuadro del ejercicio: lo que indica el plan, «La vez pasada» y «En el tiempo».
> - 3. El «Período» del historial: 12 semanas, 6 meses o desde que la acompaña.
> - 4. «1RM estimado (Epley v1)»: una estimación por sesión, con la versión del plan de fondo (v8). Es una estimación, nunca una medición.

![Figura 9: «La vez pasada» de la sentadilla: las tres últimas sesiones de Diego, serie por serie, en kg × repeticiones · RIR. Captura del website](pendiente)

## 5.7 Retirar algo en «Quién ve qué»

**Diego**, en la app: en Perfil, «Quién ve qué». Debajo del Prof. Martín Acosta, en «Lo que ve de tus otras áreas», apagar «El resumen y el plan de Nutrición».

**Qué se tiene que ver:** BE pide confirmar con «Dejar de compartir»: el Prof. Martín Acosta deja de verlo desde ese momento, no se borra nada y se puede volver a compartir. Al confirmar, el interruptor dice «No lo ve».

**El Prof. Martín Acosta**, en el website: «Actualizar» en la ficha de Diego. En Entrenamiento, «Otras áreas · lo comparte la persona» ya no muestra el plan de Nutrición y ofrece «Pedir ver su plan». Si lo pide, a Diego le llega en «Quién ve qué», en «Pedidos para responder», con «Sí, compartir» y «Ahora no», del mismo peso. Volver a prender el interruptor muestra el texto completo antes de compartir.

## 5.8 Ver la historia anterior con un profesional nuevo

**La Prof. Lucía Benítez**, en el website: en «Las personas que acompañás», Diego Sosa; en su ficha, «Más» → «Historia anterior». Se abre en Antropometría.

**Qué se tiene que ver:** arriba, el aviso fijo, «Lo que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura.». Debajo, las tomas de antes, con su protocolo y lo calculado con su método, cada cosa marcada «De otro profesional», sin nombre. Todo se ve como estaba cuando ella empezó a acompañarlo, y se recorre por tramos con «Tramo anterior» y «Tramo siguiente».

**Diego**, en «Quién ve qué»: debajo de la Prof. Lucía Benítez, «Tu historia anterior de Antropometría», con desde cuándo la ve y, cuando ella la miró, «Miró tu historia anterior» con el día y la hora. Con el interruptor «Compartir mi historia anterior» la deja de compartir: ella deja de verla desde ese momento, y no se borra nada.

Si Diego no la hubiera compartido, la página le diría a la profesional lo que hace falta, «Para ver la historia anterior, la persona tiene que autorizarte», sin insinuar que haya algo.

> **El final del recorrido.** Si la persona cambia o suma un profesional, **no empieza de cero**: el profesional nuevo ve lo que ella autoriza, en solo lectura y como estaba entonces, y ella sabe cuándo lo miró.

# 6. Si algo falla

*Lo que puede pasar durante la prueba, y qué hacer.*

**Tabla 8.** Qué hacer si algo falla.

| Lo que pasa | Qué hacer |
| --- | --- |
| Android no deja instalar la app | Autorizar al navegador como fuente («Permitir de esta fuente») y, si Play Protect pregunta, «Más detalles» → «Instalar de todos modos» («Instalar la app»). Hace falta Android 7 o posterior. |
| Ya hay una app BE en el teléfono | Instalar la última desde el enlace de esta guía. Si Android no la deja instalar encima, desinstalar la anterior y volver a instalar. |
| «Demasiados intentos. Probá de nuevo más tarde.» | Son cinco intentos de entrar cada 15 minutos, por red y por cuenta: esperar y volver a probar. |
| «El código no es válido o ya se usó.» | Esperar el código siguiente de la app de códigos, que cambia cada 30 segundos, y revisar que el teléfono tenga la hora automática. |
| El autenticador quedó bloqueado, después de varios códigos que no valían | Entrar con «Usar un código de recuperación», si se entregaron con las credenciales; cada uno sirve una sola vez. Si no, pedirle a Elián Gastón Bufi que restablezca el segundo factor. |
| Al recargar el website aparece «Recuperando tu sesión…» | Es normal: la sesión vuelve sola. Vence a las 12 horas; la de Administración, a las 8. Después, se entra de nuevo. |
| Al entrar con otra cuenta, las otras pestañas se recargaron | Es a propósito, para no mostrar los datos de otra cuenta. La segunda cuenta va en una ventana privada. |
| Un aviso dice que algo cambió mientras se miraba | Otro rol, u otra pestaña, cambió lo mismo al mismo tiempo. BE no pisa lo del otro ni guarda a medias: «Actualizar» y repetir. |
| Lo que hizo el otro rol todavía no aparece | En el website, «Actualizar» en la ficha. En la app, tirar la pantalla hacia abajo: debajo del título dice «Al día» y la hora de lo que se ve. |
| La app dice «Sin conexión» | Revisar la conexión del teléfono y volver a abrir la pantalla. |
| Algo sigue sin andar | Cerrar la sesión y volver a entrar: en la app, Perfil → «Sesión y este teléfono» → «Cerrar sesión»; en el website, «Cerrar sesión» en el menú «Cuenta». Si sigue, avisarle a Elián Gastón Bufi. |
