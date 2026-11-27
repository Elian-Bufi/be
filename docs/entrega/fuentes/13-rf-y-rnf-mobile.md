# 13 · RF y RNF Mobile

*Los requisitos funcionales y no funcionales de la app Android, donde la persona sigue su plan, registra lo que hace, ve su evolución y decide quién ve qué.*

> BE ubica, no califica. Muestra dónde está la persona respecto de su plan y de sus tomas anteriores, y la decisión queda en manos de su profesional.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** Noviembre de 2026

> **Resumen.** La app de BE es donde la persona escribe su propia historia. Este documento reúne los 31 requisitos funcionales que la persona usa en la app o que el servidor resuelve para ella, separando lo que hace cada parte, y los 33 no funcionales que los sostienen, cada uno con cómo se comprueba.

**Entregable:** 13 · RF y RNF Mobile  
**Fecha:** Noviembre de 2026  
**Lo acompaña:** Los requisitos del website, en el documento 12; los casos de uso, en el 10, y los casos de prueba, en el 11. Los requisitos del website están en el documento 12.

# Resumen

*La app de la persona: donde sigue su plan, registra lo que hace, ve su evolución y decide quién ve qué.*

**Qué es.** La app de BE es para teléfonos Android 7 o posterior y está hecha con React Native y Expo. La persona la baja desde el website y la usa en cinco pestañas: Inicio, Nutrición, Entrenamiento, Evolución y Perfil. Ahí ve lo que sus profesionales le indicaron para hoy, registra lo que comió y lo que entrenó, sigue cómo cambia su cuerpo y decide qué ve cada uno.

**Por qué importa.** Cada comida, cada sesión y cada toma queda en la historia de la persona, unida al plan que tenía en ese momento y aparte de él. Esa historia es la que sus profesionales leen en el website: comparan períodos, ponen las áreas sobre el mismo eje del tiempo y ven cómo cada cambio del plan fue afectando a la persona. Lo que la persona registra en la app es la materia prima de todo eso.

**Qué hay en este documento.** Los requisitos funcionales que la persona usa en la app o que el servidor resuelve para ella, y los no funcionales que los sostienen. Cada requisito dice qué pide, qué hace la app y qué hace el servidor; cada no funcional, además, cómo se comprueba. Cada requisito se sigue hasta su caso de uso, en el documento 10; los casos de prueba están en el documento 11.

- **31** requisitos funcionales: 9 propios de la app y 22 compartidos con el website o resueltos por el servidor
- **33** no funcionales: seguridad, privacidad, confiabilidad, accesibilidad, mantenimiento y datos
- **5** pestañas: Inicio, Nutrición, Entrenamiento, Evolución y Perfil
- **7** Android, o posterior: la app se baja desde el website, con un QR o un botón

![Figura 1: Lo que la app le suma a la historia de la persona, con los requisitos que lo piden](pendiente)

> **Texto de la figura:**
> - 01 · El tiempo
> - La persona, en el tiempo
> - Cada comida, sesión y toma que registra es un punto de su historia, unido al plan que tenía en ese momento.
> - RF-033RF-043RF-065
> - 02 · Las tres áreas
> - Tres áreas, una sola app
> - Nutrición, Entrenamiento y la evolución del cuerpo, en las mismas cinco pestañas y sobre el mismo día.
> - RF-032RF-042RF-049
> - 03 · La trazabilidad
> - Lo hecho, aparte de lo indicado
> - Registrar no cambia el plan y corregir agrega: el profesional ve qué indicó, qué pasó y qué se corrigió.
> - RF-033RF-044RF-054
> - 04 · Comparar
> - La vez pasada, a mano
> - Mientras entrena, ve qué hizo la última vez; en Evolución, cada medida frente a la anterior comparable. Las comparativas entre áreas las arma el profesional con lo que ella registra acá.
> - RF-043RF-049RF-065
> - 05 · La continuidad
> - No empezar de cero
> - Si cambia de profesional, decide si el nuevo ve su historia anterior del área, y sabe cuándo la miró.
> - RF-023RF-025
> - 06 · Más datos
> - Más contexto para interpretar
> - Lo que cuenta en los formularios y en «Mis hábitos», la nota para su profe y la foto de una comida diferente: más datos para que el profesional entienda lo que pasó.
> - RF-071RF-043RF-033
> - **La condición**Son datos de salud: la persona acepta cada vínculo, autoriza cada área y retira el permiso cuando quiere, y el servidor lo decide en cada pedido.RF-019RF-020RF-022

> **La idea clave.** **La persona hace todo su recorrido en la app**: entra, acepta a sus profesionales, decide qué ve cada uno, sigue su plan, registra lo que hace y ve su evolución.

# 1. La app

*Cinco pestañas y una entrada corta. La persona registra; el profesional decide.*

La persona baja la app desde el website, con un QR o un botón, y la instala en su teléfono: no pasa por una tienda. Entra con su correo o con Google y, la primera vez, BE se presenta en tres tarjetas. Desde ahí, lo de cada día está a uno o dos toques de Inicio.

1. **Baja la app**: Desde el website, con un QR o un botón, en un Android 7 o posterior.
2. **Crea la cuenta**: Con su correo o con Google, su nombre y los tres actos del alta. RF‑001 y RF‑003.
3. **Completa lo que falta**: «Antes de seguir» y, la primera vez, tres tarjetas de presentación. RF‑006 y RF‑017.
4. **Recibe la invitación**: Un enlace que abre la app, un QR o «Tengo un código». RF‑018.
5. **Acepta y autoriza**: El vínculo y el permiso del área: dos actos distintos. RF‑019 y RF‑020.
6. **Usa la app**: Inicio, con lo de hoy. RF‑032 y RF‑042.

*Figura 2: Antes de usar la app: de bajarla al primer plan.*

## 1.1 Las cinco pestañas

![Figura 3: Las cinco pestañas de la app y los requisitos que resuelve cada una. Esquema](pendiente)

> **Texto de la figura:**
> - Lo de hoy
> - Inicio
> - «Sigue en tu plan», con «Empezar» y «Ya la hice», y «Otra sesión»
> - Las comidas del día, en el orden del plan
> - Lo que hay para responder
> - La actividad de 30 días y la última medida
> - RF-032RF-042RF-065RF-071
> - El plan y lo comido
> - Nutrición
> - El plan vigente, comida por comida, con sus opciones y recetas en un carrusel
> - Registrar lo que comió, o «Comí algo diferente» con una foto privada
> - Sus registros y las revisiones de su profesional
> - RF-032RF-033RF-054
> - Serie por serie
> - Entrenamiento
> - La agenda de hoy, con la «Fase» y los ejercicios bajo su bloque
> - Cada serie, con el descanso automático y «La vez pasada»
> - Sustituir un ejercicio sin cambiar el plan
> - «¿Algo para contarle a tu profe?»
> - Corregir sin borrar y «Tu historial»
> - RF-042RF-043RF-044RF-054
> - Dónde está, sin juicios
> - Evolución
> - Mapa corporal, Progreso e Indicadores
> - Cada medida frente a la anterior comparable, sobre fechas reales
> - Los resultados de las fórmulas, marcados como estimación
> - Sin colores que califiquen
> - RF-048RF-049RF-065
> - Lo suyo y sus permisos
> - Perfil
> - Sus datos, su cuenta y sus avisos
> - Sus profesionales y «Tengo un código»
> - «Quién ve qué», con un interruptor por cosa, quién miró y su historia anterior
> - Formularios y «Mis hábitos»
> - «Tus datos» y «Cerrar mi cuenta»
> - RF-017RF-018RF-022RF-023RF-024RF-025RF-069
> - Arriba de todas las pestañas, la campana abre las novedades (RF-061). Los avisos al teléfono los manda el servidor y no llevan datos de salud (RF-062).

## 1.2 Lo que hace la app y lo que hace el servidor

La app es la cara de BE para la persona, pero casi ninguna regla vive en el teléfono. La app muestra, pregunta y registra; el servidor, una sola API para la app y el website, decide quién puede ver o escribir cada cosa, guarda con su auditoría, calcula y avisa. Por eso cada requisito de este documento tiene dos columnas: lo que la persona ve y hace en la app, y lo que el servidor resuelve para que eso funcione.

![Figura 4: Qué resuelve el teléfono y qué resuelve el servidor. Esquema](pendiente)

> **Texto de la figura:**
> - En el teléfono
> - La app
> - Muestra lo que el servidor autoriza, y dice por qué cuando algo no está disponible.
> - Pide y registra: comidas, sesiones serie por serie, correcciones, notas y respuestas.
> - Guarda la sesión en el almacenamiento seguro del teléfono y el entrenamiento en curso, cifrado, por cuenta.
> - Arma el aviso del descanso y mantiene la pantalla encendida mientras la persona entrena.
> - Da algo por hecho solo cuando el servidor lo confirma.
> - Por HTTPS, cada pedido con su sesión, su canal y, al escribir, su clave contra duplicados
> - En el servidor
> - La API de BE
> - Decide cada acceso en un único punto: rol, área, vínculo, permiso y finalidad.
> - Escribe y deja la auditoría en la misma transacción; lo indicado y lo hecho van por separado.
> - Calcula los resultados antropométricos con su método y su versión.
> - Emite los códigos para recuperar el acceso y manda los avisos, sin datos de salud.
> - Registra cada lectura de lo que la persona comparte, para que ella sepa quién miró.

Dos casos lo muestran bien. Para **recuperar el acceso** (RF-005), la app pide el correo y después el código y la contraseña nueva; el código lo genera el servidor y lo entrega Administración, después de verificar a la persona por el canal de ayuda. Con los **avisos** (RF-062), la app los activa a pedido y registra el teléfono; el servidor los manda cuando hay una novedad, con un texto que solo dice que hay algo para ver.

# 2. Cómo leer este documento

*Cada requisito tiene su identificador, su prioridad y lo que hace cada parte de BE.*

## 2.1 Los requisitos de la app

Los requisitos salen de la especificación de BE, con su identificador: la numeración tiene saltos porque es la de la especificación. Cada uno está asignado al canal donde se usa. Este documento reúne los que la persona usa en la app y los que el servidor resuelve para ella; los que se usan solo en el website están en el documento 12.

![Figura 5: Los 31 requisitos funcionales de la app, por grupo: el número, su prioridad y dónde se resuelve](pendiente)

> **Texto de la figura:**
> - Cuenta y acceso8 requisitos
> - 001P0
> - 002P0
> - 003P1
> - 005P1
> - 006P0
> - 007P0
> - 017P0
> - 069P1
> - Vínculo, permiso y autorización9 requisitos
> - 015P0
> - 018P0
> - 019P0
> - 020P0
> - 021P0
> - 022P0
> - 023P0
> - 024P0
> - 025P0
> - Nutrición2 requisitos
> - 032P0
> - 033P0
> - Entrenamiento3 requisitos
> - 042P0
> - 043P0
> - 044P0
> - Antropometría2 requisitos
> - 048P0
> - 049P0
> - Seguimiento2 requisitos
> - 054P0
> - 065P0
> - Información, novedades y proveedores5 requisitos
> - 059P0
> - 060P0
> - 061P1
> - 062P2
> - 071P0
> - Propios de la app **9**Compartidos con el website o con el servidor **20**Del servidor, sin pantalla propia **2**

## 2.2 Cómo se lee cada fila

**Tabla 1.** Las columnas de las tablas de requisitos funcionales.

| Columna | Qué dice |
| --- | --- |
| RF | El identificador y dónde se usa: propio de la app; compartido, en la app y en el website (o, los avisos, en la app y en el servidor); o del servidor, sin pantalla propia. |
| Requisito | Qué pide, en una o dos líneas. |
| P | Su prioridad. |
| En la app | Lo que la persona ve y hace en el teléfono, con los nombres de la pantalla. |
| En el servidor | Lo que la API decide, guarda o calcula para que eso funcione. |

**Tabla 2.** Las tres prioridades.

| P | Qué significa | En este documento |
| --- | --- | --- |
| P0 | El núcleo del sistema. | 26 |
| P1 | Alta prioridad. | 4 |
| P2 | Complementa el núcleo. | 1 |

Los requisitos no funcionales llevan una columna más, «Cómo se comprueba»: el criterio que se puede medir, el escenario que lo pone a prueba y dónde está la evidencia en el repositorio.

# 3. Requisitos funcionales

*Siete grupos. En cada fila, qué pide el requisito, su prioridad, qué hace la app y qué hace el servidor.*

> **La idea clave.** La app **muestra, pregunta y registra**; el servidor **decide, guarda y calcula**. Ocultar un botón nunca reemplaza al permiso.

## 3.1 Cuenta y acceso (8)

Crear la cuenta, entrar y salir, recuperar el acceso, completar lo que falta y cerrar la cuenta.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-001**<br>app y website | **Crear una cuenta propia.** La cuenta no depende de un profesional, de una especialidad ni de un plan. | P0 | «Crear cuenta» con correo y contraseña, o «Continuar con Google». El alta pide el nombre y apellido, aceptar los términos, confirmar la información de privacidad y declarar que tiene 18 años o más. | Un mismo correo nunca crea dos cuentas. Cada acto del alta queda guardado con su versión. |
| **RF-002**<br>app y website | **Entrar y salir de la cuenta.** Iniciar y cerrar la sesión, y no dejar entrar a una cuenta que no está habilitada. | P0 | «Iniciar sesión». La sesión queda en el almacenamiento seguro del teléfono, cifrada con una clave del Keystore de Android; la contraseña nunca se guarda. En «Sesión y este teléfono», «Cerrar sesión» o «Cerrar todas mis sesiones». | Valida cada sesión, la puede revocar en cualquier momento y no deja entrar a una cuenta que no opera. Las contraseñas se guardan con bcrypt. |
| **RF-003**<br>app y website | **Entrar con Google sin duplicar la cuenta.** Google es un método más para entrar. | P1 | «Continuar con Google» en Iniciar sesión y en Crear cuenta. Si ya hay una cuenta con ese correo y contraseña, Google se le suma solo después de que la persona confirma su contraseña. Si Google no responde, se entra con correo y contraseña. | Verifica la identidad que da Google; los roles, las áreas y los permisos los sigue decidiendo BE. |
| **RF-005**<br>app y website | **Recuperar el acceso.** Volver a entrar si se olvidó la contraseña, sin crear otra cuenta y sin revelar qué correos están registrados. | P1 | «¿Olvidaste tu contraseña?», en dos pasos: el correo de la cuenta, y después el código y la contraseña nueva, dos veces. La pantalla dice lo mismo exista o no la cuenta, y muestra el canal de ayuda para pedir el código. Al cambiarla, entra con la contraseña nueva. | Genera un código de un solo uso, de diez caracteres, y guarda solo su huella. Lo entrega Administración, después de verificar a la persona por el canal de ayuda. Cinco códigos que no valen anulan el pedido. La identidad sigue siendo la misma y todas sus sesiones terminan. |
| **RF-006**<br>app y website | **Saber en qué estado está la cuenta.** Mostrar qué está listo y qué falta para usar cada función. | P0 | «Antes de seguir» pide lo que falta antes de usar BE: el nombre, o aceptar una versión nueva de los términos o de la privacidad, con su texto completo. «Mis datos» muestra el estado de la cuenta y el identificador BE. | Responde qué le falta a la cuenta y guarda cada aceptación con la versión que se mostró. |
| **RF-007**<br>app y website | **Llegar a cada función por el canal previsto.** La persona encuentra lo suyo en la app; el profesional y Administración, en el website. | P0 | La app tiene solo lo de la persona: seguir su plan, registrar, ver su evolución y decidir quién ve qué. | Cada pedido dice desde qué canal llega, y el servidor decide con eso. |
| **RF-017**<br>propio de la app | **Crear y mantener el perfil de la persona.** Una persona adulta tiene un perfil propio, aunque no tenga ningún profesional. | P0 | El perfil es suyo desde el alta. Su nombre, el que ven sus profesionales con un vínculo vigente, se cambia en «Mis datos». | Cada cambio del perfil es una versión nueva. Si cambió en otro lugar, la app lo vuelve a leer y lo dice. |
| **RF-069**<br>app y website | **Cerrar la propia cuenta.** Sin que se borren en silencio vínculos, decisiones ni historia. | P1 | «Cerrar mi cuenta», al final de los ajustes de Perfil: la explicación, las consecuencias y «Confirmar cierre». Antes, el teléfono deja de recibir los avisos. En «Tus datos», la persona descarga lo suyo o pide el acceso, la rectificación o la supresión. | Revoca las sesiones, suprime la credencial, finaliza los vínculos con un evento registrado y conserva la historia. La descarga se arma al bajarla, por una ruta que vence a los 15 minutos; los pedidos llevan los plazos de la Ley 25.326 y los resuelve Administración. |

## 3.2 Vínculo, permiso y autorización (9)

Cómo empieza y termina la relación entre la persona y un profesional, y cómo ella decide quién ve qué.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-015**<br>del servidor | **Separar verificación, habilitación y permiso.** Un área habilitada no da acceso a los datos de una persona; un vínculo tampoco. | P0 | La persona ve, en cada vínculo, el área y la finalidad del profesional y, por separado, el estado de su permiso. | Cada condición se evalúa por separado, en un único punto de decisión, que registra cada respuesta. |
| **RF-018**<br>app y website | **Invitar o pedir un vínculo.** Iniciar una relación que diga quién la pide, con quién, para qué área y con qué finalidad. | P0 | La invitación llega por un enlace que abre la app, por un QR o con «Tengo un código». Antes de decidir, la persona ve quién la invita y para qué área; si la invitación ya no sirve, la app dice por qué. | Cada invitación es de un solo uso y lleva quién, con quién, el área y la finalidad. |
| **RF-019**<br>propio de la app | **Aceptar o rechazar un vínculo.** En forma expresa. Antes de aceptar, el profesional no ve nada. | P0 | «Aceptar vínculo» o «Rechazar solicitud», con lo que implica aceptar justo encima de los botones. Aceptar no autoriza el acceso: el paso siguiente es revisar el permiso. Después de aceptar, una sola pantalla trae lo que se propone compartir, ya marcado: el área, lo de otras áreas y la historia anterior, con «Aceptar y compartir», «Elegir qué compartir» y «Ahora no». | Un vínculo aceptado, sin permiso, no da acceso a ningún dato. |
| **RF-020**<br>propio de la app | **Dar el permiso por área y finalidad.** Un consentimiento específico, con versión, que se puede retirar. | P0 | Quién, para qué, en qué área y el texto exacto de la versión que se acepta. El acto es «Autorizar acceso», sin casillas marcadas de antemano. El tratamiento de los datos de salud es un acto aparte, en el mismo recorrido. Lo que se comparte se decide en la misma pantalla de la aceptación, con todo marcado y retirable. | Cada versión queda guardada con su texto, su autor y su fecha. Volver a autorizar es un acto nuevo, nunca una reactivación. |
| **RF-021**<br>del servidor | **Decidir el acceso en cada operación.** Según el rol, el área, el vínculo, el permiso y la finalidad vigentes. | P0 | La app no decide permisos: muestra lo que el servidor responde. Si algo no está disponible, lo dice sin mostrar datos. | Un único punto de decisión, el mismo para la app y el website, permite o niega cada lectura y cada escritura. Lo ajeno responde igual que lo inexistente, y cada decisión queda registrada. |
| **RF-022**<br>propio de la app | **Retirar el permiso.** El profesional deja de leer y escribir en esa área desde ese momento; lo anterior no se borra. | P0 | «Revocar acceso de» ese profesional, desde el vínculo o desde Privacidad, con su explicación y su confirmación: tan a mano como autorizar. En «Quién ve qué» se deja de compartir una cosa sola, sin cortar el área entera. | El retiro vale en el acto, sin esperar a que venza la sesión del profesional. No finaliza el vínculo ni borra la historia. |
| **RF-023**<br>app y website | **Ver mis vínculos y permisos.** Lo que se muestra coincide con el acceso real. | P0 | «Quién ve qué», desde Perfil, junta en una vista qué autorizó a cada profesional, desde cuándo y si ve sus hábitos. En la tarjeta de cada uno, **quién miró**: cuándo abrió por última vez el plan que ella le comparte de otra área, como «Miró tu plan de Nutrición el martes 10 a las 18:20», o «Todavía no miró tu plan de Nutrición» cuando se sabe. Ahí mismo autoriza o retira su historia anterior (RF-025). Debajo de cada profesional, un interruptor por cosa, y los pedidos para responder. | Lo que se muestra sale de los mismos datos con que se decide el acceso. Cada lectura de lo que la persona comparte queda registrada con quién, qué y cuándo. |
| **RF-024**<br>app y website | **Pausar o finalizar un vínculo.** Sin borrar la cuenta ni la historia. | P0 | Pausar, reanudar o finalizar, con una confirmación y un motivo de una lista cerrada. Solo reanuda quien pausó. | Guarda el motivo y el autor. Si el vínculo cambió desde que la persona lo vio, pide actualizar la vista. |
| **RF-025**<br>app y website | **Conservar la historia al cambiar de profesional.** La cuenta y la historia siguen; el acceso no pasa solo al nuevo. | P0 | La historia sigue con la persona aunque el vínculo termine: «Tu historial», «Tus revisiones» y las notas entre sus profesionales. Con un profesional nuevo de un área, decide si le muestra **su historia anterior** de esa área: «Tu historia anterior de Nutrición», con un interruptor en «Quién ve qué» y una tarjeta al aceptarlo. Por omisión no se comparte, y se retira cuando quiera. «Miró tu historia anterior el …» le dice cuándo la miró. | El profesional nuevo no hereda acceso: necesita su vínculo, su permiso y esa autorización. Ve en solo lectura, marcado como de otro profesional, los planes activados, lo registrado bajo esos planes, las tomas con su método y las decisiones de las revisiones; nunca las notas privadas ni los borradores del anterior. La autoría de cada registro no cambia, y cada lectura queda registrada. |

## 3.3 Nutrición (2)

Lo que toca comer hoy según el plan vigente, y lo que la persona comió, aparte del plan.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-032**<br>propio de la app | **Ver qué toca comer hoy.** Lo que corresponde según el plan vigente, o un estado claro si no hay plan. | P0 | En Nutrición y en Inicio, las comidas del día en el orden del plan, cada una con sus opciones y sus recetas, que se pasan como un carrusel: deslizando, se detienen de a una y enteras, o con las flechas de arriba, que dicen «Opción n de m» y tienen los puntitos debajo. Cada opción muestra su foto grande a todo el ancho o, sin foto, la miniatura del plato al lado del nombre, y los macros con su ícono, su número y su abreviatura, como en el website. El nombre de la pantalla queda en la cabecera, para que la foto, los macros y «Comí algo diferente» entren sin desplazar. Sin plan vigente, la pantalla lo dice. | Arma el día con la versión vigente del plan. Un plan activado no cambia: el siguiente es otra versión. |
| **RF-033**<br>propio de la app | **Registrar lo que comió.** Con fecha y una observación opcional, asociado al plan vigente. | P0 | Registrar una opción del plan y completar o corregir sus cantidades, o «Comí algo diferente», con una foto opcional. La foto es privada: la ven la persona y el profesional que la acompaña en Nutrición. La foto se achica en el teléfono antes de subirla. | Cada registro queda unido a la versión del plan vigente y aparte de ella. Corregir agrega un registro nuevo; un reintento con la misma clave no duplica. La foto se guarda sin metadatos. |

## 3.4 Entrenamiento (3)

La sesión del día, cada serie registrada y la corrección sin borrar.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-042**<br>propio de la app | **Ver qué toca entrenar hoy.** Distinguir si no hay sesión, si ya la registró o si quedó una de días anteriores. | P0 | La agenda del día en Entrenamiento y, en Inicio, «Sigue en tu plan» con «Empezar» y «Ya la hice», y «Otra sesión» para elegir otra del plan, con su estado de la semana. «Entrenamiento» queda en la cabecera. Los ejercicios van bajo su bloque y, en uno «En vueltas», la indicación entra en una línea; la etapa del plan se llama «Fase». | La agenda sale de la versión vigente del plan. BE no elige por la persona la sesión ni el día. |
| **RF-043**<br>propio de la app | **Registrar la sesión y sus series.** Lo que realmente hizo, aparte de lo planificado. | P0 | Serie por serie, con el descanso automático y su aviso, la carga rápida «como el plan» y «Ya la hice» el mismo día; sustituir un ejercicio sin cambiar el plan; la pantalla no se apaga mientras entrena. Debajo del ejercicio, **«La vez pasada»**: lo que hizo la última vez, dentro de los últimos 90 días, serie por serie, con carga × repeticiones · RIR. Con la sesión ya registrada, **«¿Algo para contarle a tu profe?»**: una nota de hasta 280 caracteres, con frases a un toque. La serie «C» se registra como calentamiento y no avanza la barra de la sesión. Si el profesional indicó el plan en RPE, la app pregunta el esfuerzo en RPE, eligiendo de una lista (de 10 a 6,5 y «6 o menos»), y muestra lo indicado y lo registrado así; lo que guarda sigue siendo el RIR. | Lo hecho se guarda aparte de lo planificado. La sesión en curso se recupera desde cualquier teléfono de la cuenta. La nota viaja aparte, después de registrar la sesión; solo se agrega, no se edita, y el profesional la lee junto a la sesión. |
| **RF-044**<br>app y website | **Corregir lo registrado sin borrar.** Mostrando el valor original, el motivo y quién corrigió. | P0 | Corregir una sesión registrada, con su motivo. El detalle muestra el original y cada corrección, sin ocultar ninguna. | La corrección es un registro nuevo, con su autor y su motivo; el original queda. |

## 3.5 Antropometría (2)

Los resultados de cada toma y su evolución en el tiempo.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-048**<br>app y website | **Calcular resultados reproducibles.** Sin confundirlos con lo medido, guardando método, datos y versión. | P0 | En «Indicadores», cada resultado de una fórmula va marcado como estimación, con el método en su nombre. Dos métodos nunca se comparan ni se elige uno «mejor». En «Mi evolución», las mediciones de Kerr y sus cinco masas se ven con su nombre y su método, siempre como estimación. | Calcula guardando el método, los datos y la versión, separado de lo medido. El mismo cálculo da siempre el mismo resultado, y ninguno se presenta como diagnóstico. |
| **RF-049**<br>app y website | **Ver la evolución antropométrica.** Con el período, la unidad y la procedencia a la vista. | P0 | «Mi evolución», en tres vistas: Mapa corporal, Progreso (por Torso y Piernas, cada medida frente a la anterior comparable) e Indicadores. Los puntos van sobre las fechas reales, sin colores que juzguen, y cada gráfico tiene su lista equivalente para el lector de pantalla. Las mediciones de Kerr y sus cinco masas se ven con su nombre y su método. | Agrupa las tomas comparables y nunca mezcla dos grupos en un mismo eje. |

## 3.6 Seguimiento (2)

Lo que pasó, en orden, y la evolución de la persona en las tres áreas.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-054**<br>app y website | **Ver la línea de tiempo.** En orden, con fecha, área, autor y procedencia, sin mezclar lo indicado con lo hecho. | P0 | «Tu historial» ordena por fecha las sesiones de los últimos 90 días, cada una con el plan tal como se aceptó y sus correcciones. «Tus revisiones» muestra cada decisión con su período, su autor, su fecha y desde cuándo se aplicó. La línea de tiempo completa, con búsqueda, está en el website. | Cada hecho separa cuándo ocurrió y cuándo se registró, y lo indicado nunca se mezcla con lo hecho. |
| **RF-065**<br>propio de la app | **Ver mi progreso en la app.** Una síntesis de su evolución en las tres áreas, sin diagnósticos ni causas. | P0 | «Mi evolución», «Tu historial», sus registros de Nutrición y «Tus revisiones». En Inicio, la actividad de los últimos 30 días y la última medida frente a la anterior, dicha como dato: «+0,4 kg desde el 2 sept». | Las lecturas propias exigen solo el permiso de la persona sobre sus datos de salud: no dependen de un plan activo ni de que el profesional conserve el acceso. |

## 3.7 Información, novedades y proveedores (5)

Lo que los profesionales le piden a la persona, lo nuevo que le corresponde y cómo sigue BE si falla un proveedor.

| RF | Requisito | P | En la app | En el servidor |
| --- | --- | --- | --- | --- |
| **RF-059**<br>app y website | **Seguir funcionando si falla un proveedor.** Si Google, Open Food Facts, wger o los avisos fallan, lo esencial sigue. | P0 | Si Google no responde, se entra con correo y contraseña. Si un aviso no llega, la novedad está en la campana. Si una lectura falla, cada tarjeta de Inicio tiene su «Reintentar» y las demás siguen. | Cada proveedor tiene un tiempo máximo y, si falla, lo esencial sigue con el catálogo propio y la carga manual. |
| **RF-060**<br>app y website | **Ver de dónde viene un dato externo.** Proveedor, fecha y referencia de lo que vino de afuera. | P0 | Al sustituir un ejercicio, uno que vino de un catálogo externo lo dice: «Importado de wger». | Guarda el proveedor, la fecha y la referencia de cada dato importado. |
| **RF-061**<br>app y website | **Ver novedades.** Un centro donde cada uno ve lo nuevo que le corresponde, aunque no lleguen los avisos. | P1 | La campana, arriba de todas las pestañas, abre las novedades: un plan activado, una revisión, una solicitud de vínculo, un pedido para ver sus hábitos. Las importantes lo dicen con la palabra «Importante», no solo con un color. | Publica cada novedad después de confirmar el hecho. No son alertas clínicas. |
| **RF-062**<br>app y servidor | **Recibir avisos en el teléfono.** Para algunas novedades, sin datos sensibles y sin que sean la única vía. | P2 | «Activar avisos», en los ajustes de Perfil o en la tercera tarjeta de la presentación: el permiso de Android se pide recién ahí. El teléfono recibe los avisos de una cuenta por vez y, al cerrar la sesión, deja de recibirlos. El aviso del descanso es el único que arma el propio teléfono: vibra al llegar al descanso recomendado y no nombra el ejercicio. | Manda los avisos por Expo Push después de confirmar cada novedad: «Tenés una novedad.», sin datos de salud ni nombres. Hace hasta tres intentos y da de baja un teléfono que ya no sirve. Los recordatorios del día los arma una tarea programada. Todo queda, además, en Novedades. |
| **RF-071**<br>app y website | **Pedir y completar información.** El profesional pide información con una finalidad; la persona responde y puede rectificar. | P0 | «Formularios y pedidos», desde Perfil y desde Inicio: responder lo que le piden, corregir lo respondido o marcar «No es correcto», sin barras de avance ni recordatorios que culpen. «Mis hábitos»: lo que contó de su sueño, su día, su actividad y su semana, y «Compartir mis hábitos con mis profesionales», que decide ella. | Las plantillas tienen versión. Lo respondido queda como declarado por la persona, con quién lo cargó y qué se corrigió. Cambiar los hábitos agrega una versión. |

# 4. Requisitos no funcionales

*33 requisitos de calidad: cómo se protege, se comprueba y se sostiene lo que hace la app.*

> **La idea clave.** Cada uno dice **cómo se comprueba**: un criterio medible, su escenario y su evidencia.

Los requisitos no funcionales salen de la misma especificación. Acá están los que tocan a la app, contando los que el servidor resuelve para la app y el website a la vez.

![Figura 6: Los 33 requisitos no funcionales de la app, en cinco grupos](pendiente)

> **Texto de la figura:**
> - 8. Seguridad y privacidad
> - Quién accede, cómo se guardan las credenciales y qué sale del servidor.
> - SEC-001SEC-002SEC-003SEC-005SEC-006PRI-001PRI-002PRI-003
> - 6. Respuesta y confiabilidad
> - Que nada quede colgado, que no se pierda ni se duplique y que no haya éxitos falsos.
> - PERF-002PERF-003AVA-001AVA-002REC-002REL-001
> - 4. Accesibilidad y portabilidad
> - Que se lea, se entienda y se instale en el teléfono de la persona.
> - ACC-001ACC-002ACC-003PORT-001
> - 7. Mantenimiento y observabilidad
> - Una sola fuente de reglas, contratos que no se rompen y pruebas en cada cambio.
> - MAN-001MAN-002MAN-003MAN-004OBS-001OBS-002OBS-003
> - 8. Integración, escala y datos
> - Fechas y unidades coherentes, proveedores reemplazables y una historia que no se pisa.
> - INT-001INT-002SCA-002DAT-001DAT-002DAT-003DAT-004DAT-005

Cada tabla tiene cuatro columnas: el requisito con su categoría y su prioridad; qué exige; cómo lo resuelve BE, en la app y en el servidor; y cómo se comprueba. Las rutas de la evidencia son del repositorio público del proyecto.

## 4.1 Seguridad y privacidad (8)

| RNF | Qué exige | Cómo lo resuelve BE | Cómo se comprueba |
| --- | --- | --- | --- |
| **RNF-SEC-001**<br>Seguridad · P0 | **Autorización igual en todos los canales.** Toda lectura o escritura protegida pasa por la misma regla, llegue desde el website o desde la app. | Un único punto de decisión en el servidor, el mismo para los dos canales. La app no decide permisos: muestra lo que el servidor responde. | **Criterio:** ninguna operación protegida devuelve datos sin una decisión favorable. **Escenario:** un profesional pide los datos de una persona sin vínculo, sin permiso o sin el tratamiento de datos de salud: recibe lo mismo que si no existieran, y la decisión queda registrada. **Evidencia:** `test/integration/pdp.int-spec.ts` (TEST-AUTH-003 a 009). |
| **RNF-SEC-002**<br>Seguridad · P0 | **Credenciales, sesiones y secretos protegidos.** Que una filtración del repositorio, de los registros o del teléfono no exponga nada reutilizable. | **En la app:** la sesión va al almacenamiento seguro, cifrada con una clave del Keystore de Android y fuera del respaldo; nunca la contraseña. El entrenamiento en curso se guarda cifrado (AES-256-GCM), con una clave por cuenta. **En el servidor:** contraseñas con bcrypt, sesiones revocables, secretos fuera del repositorio y segundo factor para Administración (el profesional entra con su contraseña o con Google) en el website. | **Criterio:** ni las respuestas, ni los registros, ni la auditoría contienen credenciales, tokens, huellas ni correos. **Escenario:** se cierra la cuenta con sesiones abiertas en el website y en la app: el pedido siguiente de cada una responde 401. **Evidencia:** `test/integration/sanitizacion.int-spec.ts` y `cierre.int-spec.ts` (TEST-AUTH-012); `apps/mobile/src/almacen-seguro.ts` y `almacen-cifrado.ts`. |
| **RNF-SEC-003**<br>Seguridad · P0 | **Resistencia al abuso del acceso.** Limitar los intentos automáticos y no revelar qué cuentas existen. | El servidor cuenta los intentos por ventana y responde igual exista o no la cuenta: al entrar, al recuperar el acceso y al vincular Google. La app dice «Demasiados intentos. Probá de nuevo más tarde.». | **Criterio:** con los valores por omisión, más de 5 intentos de entrada con la misma cuenta desde la misma red en 15 minutos responden 429; la recuperación admite 3 pedidos por hora por correo. **Escenario:** se pide recuperar un correo sin cuenta y uno con cuenta: las dos respuestas son iguales. **Evidencia:** `test/integration/recuperacion-de-acceso.int-spec.ts`; `apps/api/src/plataforma/limitador.spec.ts`. |
| **RNF-SEC-005**<br>Seguridad · P0 | **Auditoría de lo sensible.** Toda operación sensible deja registro de quién, qué y cuándo. | La auditoría se escribe en la misma transacción que la operación: si una falla, no queda la otra. | **Criterio:** no existe una escritura sensible sin su registro. **Escenario:** la auditoría del alta falla: no queda la identidad ni efecto alguno. **Evidencia:** `test/integration/registro.int-spec.ts` (TEST-RNF-SEC-005). |
| **RNF-SEC-006**<br>Seguridad · P0 | **Mínimo privilegio por área.** Cada área accede solo a lo suyo. | Cada área tiene su módulo y sus tablas, y el acceso se evalúa por área. Administración no ve datos de salud. | **Criterio:** retirar el permiso de un área no toca el de otra. **Escenario:** la persona tiene profesionales de Entrenamiento y de Nutrición y retira el de Entrenamiento: ese pierde el acceso y el de Nutrición lo conserva. **Evidencia:** `test/integration/consentimiento.int-spec.ts` (TEST-RF-022). |
| **RNF-PRI-001**<br>Privacidad · P0 | **Pedir solo lo pertinente.** Minimizar los datos y pedir solo lo que hace falta para la finalidad. | Lo que la app guarda en el teléfono va cifrado o no es de salud. Los avisos dicen solo que hay algo para ver. Las fotos de las comidas son privadas, y el servidor las guarda sin metadatos (ni ubicación ni cámara). Un campo que no se completa no viaja. | **Criterio:** ningún aviso lleva datos de salud ni nombres. **Escenario:** el profesional registra una revisión: el aviso dice «Tenés una novedad.» y nada más; la foto subida con su ubicación se guarda sin ella. **Evidencia:** `packages/domain/src/copy-novedades.ts` (`textoDelAvisoPush`) y sus pruebas; `apps/api/src/medios/procesamiento-de-imagen.spec.ts`. |
| **RNF-PRI-002**<br>Privacidad · P0 | **Retiro del permiso efectivo y verificable.** Retirar el permiso deja al profesional sin acceso de verdad, y se puede comprobar. | El retiro vale en el acto, sin esperar a que venza la sesión del profesional. Un reintento de una escritura vuelve a pasar por la decisión. | **Criterio:** después del retiro, ninguna lectura ni escritura del profesional en esa área tiene éxito. **Escenario:** la persona retira el permiso con la ficha abierta en el website: al actualizar, la ficha lo dice, y recargar no devuelve el acceso. **Evidencia:** `test/navegador/recorridos.mjs` (`accesoRevocado`); `test/integration/entrenamiento.int-spec.ts` (la misma clave, revocado, responde lo mismo que lo inexistente). |
| **RNF-PRI-003**<br>Privacidad · P0 | **Cada canal muestra lo de su actor.** La app de la persona y el website del profesional muestran lo que corresponde a cada uno. | Cada pedido de la app viaja marcado como de la app, y el servidor decide y registra con ese canal. La app solo tiene pantallas de la persona. | **Criterio:** ninguna operación que usa la app es del profesional ni de Administración. **Escenario:** se revisa la lista congelada de lo que usa la app instalada. **Evidencia:** `packages/domain/fixtures/lecturas-de-la-apk/`; la cabecera `X-BE-Surface` del cliente compartido (`packages/domain/src/cliente-http.ts`), que la app manda como APK. |

## 4.2 Respuesta y confiabilidad (6)

| RNF | Qué exige | Cómo lo resuelve BE | Cómo se comprueba |
| --- | --- | --- | --- |
| **RNF-PERF-002**<br>Rendimiento · P1 | **Respuesta percibida.** Que la app avise cuando algo tarda. | Cada tarjeta dibuja su estructura mientras lee y carga sola: una lenta no frena a las demás. Al abrir la app, si comprobar la sesión tarda, lo dice. Debajo del título, «Al día, 10:42» o «Ves lo de las 09:15» dice de cuándo es lo que se ve, y se actualiza tirando hacia abajo. | **Criterio:** cada imagen pide la medida que necesita su marco: la miniatura donde es chica y la grande a todo el ancho. A los 5 segundos sin respuesta al comprobar la sesión, la app muestra «Está tardando más de lo habitual» y sigue esperando el mismo pedido. **Escenario:** la red está lenta al abrir la app. **Evidencia:** `apps/mobile/src/sesion-persistente.ts` (`UMBRAL_DE_DEMORA_MS`) y `pantallas/recuperacion.tsx`; `hora-de-lo-que-ves.test.ts`. |
| **RNF-PERF-003**<br>Rendimiento · P0 | **Integraciones con tiempo acotado.** Un proveedor lento no deja colgado al resto. | Cada proveedor externo (Google, Open Food Facts, wger, Expo Push y el correo) tiene un tiempo máximo y, si no responde, BE sigue con lo propio. | **Criterio:** ninguna integración retiene un pedido más de 5 segundos. **Escenario:** el proveedor está caído, lento o redirige: la API responde con el respaldo y la carga manual sigue. **Evidencia:** `test/integration/integraciones.int-spec.ts` (paso 6); `PRESUPUESTO_DEL_PROVEEDOR_MS` en `packages/domain/src/integraciones.ts`. |
| **RNF-AVA-001**<br>Disponibilidad · P0 | **Disponible cuando se lo necesita.** Que los recorridos núcleo estén operativos sin depender de terceros no esenciales. | La API, la tarea programada y la base corren en Render en planes pagos, que no se suspenden por inactividad, y el website es estático. | **Criterio:** ningún servicio de BE se suspende por inactividad. **Escenario:** la primera consulta del día responde como cualquier otra, sin un arranque en frío. **Evidencia:** `render.yaml` (el plan de cada servicio); la lectura de salud de la API. |
| **RNF-AVA-002**<br>Disponibilidad · P0 | **Los datos persisten tras un reinicio.** Reiniciar o redesplegar no pierde datos. | PostgreSQL 16 administrada en Render, aparte de la API. Cada despliegue aplica las migraciones antes de servir. | **Criterio:** un redespliegue de la API no toca los datos. **Escenario:** la imagen de la API arranca, aplica las migraciones y recién entonces se declara lista; si una migración falla, el arranque se aborta. **Evidencia:** el control «imagen API · migrate deploy + readiness» de `.github/workflows/ci.yml`; `test/integration/despliegue.int-spec.ts`. |
| **RNF-REC-002**<br>Recuperación · P0 | **Reintentos sin duplicados.** Repetir una operación sensible no crea dos veces el mismo hecho. | La app manda cada escritura sensible con una clave por intento, y un reintento tras un resultado incierto reusa la misma. El servidor guarda la respuesta de cada clave: repetirla devuelve lo mismo, y la misma clave con otro contenido se rechaza. | **Criterio:** varios envíos con la misma clave dejan un solo hecho. **Escenario:** se corta la red al confirmar una sesión y la persona toca «Reintentar». **Evidencia:** `test/integration/entrenamiento.int-spec.ts` («un reintento con la misma clave no duplica»). |
| **RNF-REL-001**<br>Confiabilidad · P0 | **Nunca un éxito falso.** No mostrar «guardado» antes de que el servidor lo confirme, y explicar cómo seguir si algo falla. | La app muestra «Sesión registrada» o «Le contaste a tu profe» solo con la respuesta del servidor. Si el resultado es incierto, dice «No pudimos confirmar el resultado. Reintentá.». | **Criterio:** ninguna confirmación aparece antes de la respuesta del servidor. **Escenario:** la nota para el profe no se puede mandar: la sesión sigue registrada y la nota dice «No se mandó», con «Reintentar». **Evidencia:** `apps/mobile/src/nota-para-tu-profe.ts` y su prueba (TEST-PG-014). |

## 4.3 Accesibilidad y portabilidad (4)

| RNF | Qué exige | Cómo lo resuelve BE | Cómo se comprueba |
| --- | --- | --- | --- |
| **RNF-ACC-001**<br>Accesibilidad · P0 | **Accesibilidad en los recorridos núcleo.** Contraste suficiente y uso con lector de pantalla. | Los colores de los dos temas, Claro y Azul noche, pasan una prueba de contraste en cada cambio. Las pantallas llevan etiquetas para TalkBack, cada gráfico tiene su lista equivalente, la letra sigue el tamaño del sistema y la app respeta «reducir movimiento» y el texto de alto contraste de Android. | **Criterio:** cada par de texto llega a 4,5:1 y cada borde de control a 3:1, en los dos temas (WCAG 2.2, criterios 1.4.3 y 1.4.11). TalkBack anuncia «Opción n de m» una vez al cambiar y lee el título de la cabecera como encabezado; los macros se leen con su nombre completo. **Escenario:** se agrega un color que no llega: la verificación falla y el cambio no entra. **Evidencia:** `scripts/contraste.test.cjs`, que lee `apps/mobile/src/tema.ts`. |
| **RNF-ACC-002**<br>Lenguaje · P0 | **Lenguaje claro, sin diagnósticos.** Los textos no diagnostican, no califican ni atribuyen causas. | Pruebas de redacción recorren los textos del paquete compartido y los escritos en cada pantalla de la app y del website, con la lista de palabras que BE no usa en cada área. Una diferencia es un número con su signo, sin color de «mejor» o «peor». | **Criterio:** ninguna pantalla usa un término de la lista prohibida de su área. **Escenario:** un texto nuevo con un término prohibido rompe la verificación. **Evidencia:** `scripts/copy-pantallas.test.cjs`; `test/integration/textos-de-uso-real.int-spec.ts`. |
| **RNF-ACC-003**<br>Accesibilidad · P0 | **Adaptado a cada pantalla.** El website se usa bien en el escritorio y la app en el teléfono. | La app está hecha para el teléfono Android, en vertical, con la letra del sistema y dos temas. El website está diseñado para la computadora, de 1024 a 1920 de ancho; se recomienda 1280 o más. | **Criterio:** los gráficos del website se capturan a 1024, 1280, 1440 y 1920 de ancho, en los dos temas. **Escenario:** la persona sube la letra del sistema: la app la sigue. **Evidencia:** el flujo `capturas-de-los-graficos` de la CI; `apps/mobile/src/escala-de-letra.ts`. |
| **RNF-PORT-001**<br>Portabilidad · P0 | **App instalable en un Android físico.** La app se instala y se puede usar en un teléfono real. | Se baja desde el website, con un QR o un botón, y se instala en Android 7 o posterior. Cada APK se firma con la clave de la app y se publica con su huella SHA-256. | **Criterio:** el paquete declara Android 7.0 (API 24) como mínimo y la firma se verifica antes de publicarlo. **Escenario:** se instala en un teléfono físico desde el enlace del website. **Evidencia:** `scripts/aab/verificar-aab.mjs` (el Android mínimo y el objetivo, y la firma del paquete); `scripts/aab/apk-desde-aab.mjs` (la firma de la APK, verificada con apksigner); el archivo `.sha256` de cada descarga. |

## 4.4 Mantenimiento y observabilidad (7)

| RNF | Qué exige | Cómo lo resuelve BE | Cómo se comprueba |
| --- | --- | --- | --- |
| **RNF-MAN-001**<br>Mantenibilidad · P0 | **Una sola fuente de reglas.** Responsabilidades separadas y cada regla escrita en un solo lugar. | Un monolito modular de 35 módulos en la API y un paquete de dominio que comparten el servidor, el website y la app: las reglas, los contratos y los textos se escriben una vez. | **Criterio:** la app no reescribe una regla del dominio. **Escenario:** «La vez pasada» de la app usa la misma regla que el editor del profesional en el website. **Evidencia:** `apps/mobile/src/la-vez-pasada-en-la-sesion.ts`, que importa `lineaDeLaVezPasada` de `packages/domain`. |
| **RNF-MAN-002**<br>Mantenibilidad · P0 | **Contratos compatibles y verificables.** Un cambio en el servidor no rompe a quien lo usa. | El contrato de la API se genera desde el dominio, y la CI falla si se desvía. Las 108 operaciones que usa la app instalada quedan congeladas en una prueba. | **Criterio:** cero diferencias entre lo que la app instalada espera y lo que responde la API. Los campos nuevos del plan (el tipo de serie y los bloques de la sesión) salen solo para la app que declara conocerlos. **Escenario:** un cambio en la API altera un campo que la app lee: la verificación falla antes de llegar al teléfono. **Evidencia:** `packages/domain/src/lecturas-de-la-apk.test.ts` y `test/integration/lecturas-de-las-apk.int-spec.ts`; `scripts/generar-openapi.cjs --verificar`. |
| **RNF-MAN-003**<br>Mantenibilidad · P0 | **Esquema que evoluciona en forma reproducible.** Cada cambio de la base se aplica igual en todos lados. | 107 migraciones de Prisma, aplicadas igual en la integración de la CI y en cada despliegue. | **Criterio:** la base armada desde cero con las migraciones coincide con el esquema. **Escenario:** una migración que falla aborta el arranque de la imagen. **Evidencia:** `test/integration/schema.int-spec.ts`; el control de la imagen de la API. |
| **RNF-MAN-004**<br>Mantenibilidad · P0 | **Pruebas proporcionales al riesgo.** Más pruebas donde más riesgo hay. | En cada cambio: tipos, pruebas unitarias del dominio, la API, el website y la app, integración contra PostgreSQL 16 real, la imagen de la API y recorridos en el navegador. | **Criterio:** ningún cambio entra al repositorio sin los cuatro controles obligatorios en verde: el legajo, la verificación, la integración y la imagen de la API. **Escenario:** un cambio rompe un permiso: la integración falla y el cambio no entra. **Evidencia:** `.github/workflows/ci.yml` y las reglas de protección del repositorio en GitHub, que exigen esos cuatro controles. |
| **RNF-OBS-001**<br>Observabilidad · P1 | **Diagnóstico sin exponer datos.** Diagnosticar un error sin que los registros muestren datos sensibles. | Los errores devuelven un código y un identificador de pedido; el registro de la API no imprime datos de salud ni credenciales. | **Criterio:** un error no clasificado deja en el registro solo su tipo y el identificador del pedido. **Escenario:** falla una operación con datos de una persona. **Evidencia:** `test/integration/sanitizacion.int-spec.ts` (TEST-RNF-OBS-001). |
| **RNF-OBS-002**<br>Observabilidad · P1 | **Salud del despliegue a la vista.** Saber si el servidor está vivo y qué versión corre. | La lectura de salud de la API dice si está viva, si está lista y qué versión corre. | **Criterio:** la lectura de salud informa la versión desplegada. **Escenario:** después de un despliegue, la versión informada es la del cambio que entró. **Evidencia:** `apps/api/src/health`; `test/integration/despliegue.int-spec.ts`. |
| **RNF-OBS-003**<br>Observabilidad · P0 | **Trazabilidad en los dos sentidos.** Ir del requisito a la prueba y de la prueba al requisito. | Una tabla del repositorio sigue cada requisito hasta su caso de uso y su familia de operaciones de la API, y las pruebas llevan en su nombre el identificador de lo que prueban. | **Criterio:** cada requisito de este documento tiene su caso de uso en esa tabla. **Escenario:** del RF-022 se llega a la prueba TEST-RF-022, y de la prueba, al requisito. **Evidencia:** `docs/mesa/MESA_02/DV-03/DV-03_RF_POR_CANAL.csv`; los resultados de integración por identificador que guarda la CI; los documentos 10 y 11. |

## 4.5 Integración, escala y datos (8)

| RNF | Qué exige | Cómo lo resuelve BE | Cómo se comprueba |
| --- | --- | --- | --- |
| **RNF-INT-001**<br>Integración · P1 | **Proveedores reemplazables.** Cambiar un proveedor externo sin rehacer el núcleo. | Cada proveedor se usa detrás de un adaptador propio: Open Food Facts, wger, Google, Expo Push y el correo. | **Criterio:** el núcleo no llama a un proveedor directamente. **Escenario:** los avisos se apagan por configuración: no sale nada y las novedades siguen en el centro. **Evidencia:** `apps/api/src/integraciones`, `novedades/canal-expo.ts` y `plataforma/correo.service.ts`. |
| **RNF-INT-002**<br>Integración · P0 | **Fechas, unidades y zona horaria coherentes.** Que un día sea el mismo día para todos y una unidad no se confunda con otra. | Los días y los períodos usan la fecha civil de Buenos Aires; los instantes se guardan en UTC; cada valor lleva su unidad. En la app, el día es el de la API: a la medianoche cambia y lo de hoy se vuelve a leer. | **Criterio:** un registro hecho a las 23:30 en Buenos Aires cae en ese día, no en el siguiente. **Escenario:** la persona registra una comida cerca de la medianoche. **Evidencia:** `apps/api/src/nutricion/zona.ts`; `apps/mobile/src/dia-de-la-api.ts`. |
| **RNF-SCA-002**<br>Escala · P1 | **Habilitación y capacidad desacopladas.** Cambiar la habilitación o el cupo sin tocar el código. | La capacidad de cada profesional está separada de su habilitación y vale «sin límite» por omisión. | **Criterio:** sin una versión de capacidad, el profesional no tiene tope. **Escenario:** Administración habilita a un profesional sin fijarle cupo. **Evidencia:** `apps/api/src/proceso/proceso.service.ts` (la cadena de capacidad). |
| **RNF-DAT-001**<br>Datos · P0 | **Estados íntegros.** Un estado solo pasa a otro permitido. | La base exige las transiciones con sus propias reglas, no solo la aplicación: un salto no declarado se rechaza. | **Criterio:** una transición no permitida se rechaza en la base. **Escenario:** se intenta pasar un vínculo finalizado a aceptado o a pausado: la base lo rechaza. **Evidencia:** `test/integration/maquinas-wp03.int-spec.ts` y `maquina-de-estado.int-spec.ts` (TEST-RNF-DAT-001). |
| **RNF-DAT-002**<br>Datos · P0 | **Procedencia obligatoria.** Cada hecho dice de dónde viene. | Las tablas de hechos tienen la procedencia como campo obligatorio. Lo precargado del plan nunca se cuenta como dato escrito por la persona. | **Criterio:** no hay un hecho sin procedencia. **Escenario:** una serie tildada con lo planificado no puede pasar a «escrita por la persona»: se rechaza y no se guarda nada. **Evidencia:** `test/integration/procedencia-por-campo.int-spec.ts`. |
| **RNF-DAT-003**<br>Datos · P0 | **Versiones sin sobrescritura.** Nada se pisa en silencio. | Versiones encadenadas, tablas a las que solo se agrega y 334 claves foráneas, todas con borrado restringido. | **Criterio:** ninguna clave foránea borra en cascada. **Escenario:** se intenta borrar una fila que otras referencian: la base no lo permite. **Evidencia:** `prisma/schema.prisma` (`onDelete: Restrict` en cada relación). |
| **RNF-DAT-004**<br>Datos · P0 | **Validación con errores accionables.** Un dato inválido se rechaza diciendo qué corregir. | El contrato valida cada pedido y el error dice qué campo corregir; la app lo muestra junto a ese campo. | **Criterio:** cada rechazo por validación nombra el campo. **Escenario:** la persona manda dos valores fuera de sus límites: un solo rechazo, con un error por campo y sus límites, y no se escribe nada. **Evidencia:** `test/integration/contrato.int-spec.ts` y `formularios-errores.int-spec.ts`. |
| **RNF-DAT-005**<br>Datos · P0 | **Reproducibilidad en el tiempo.** Poder reconstruir qué pasó y cuándo. | Cada hecho separa cuándo ocurrió y cuándo se registró, y cada cálculo guarda su método y su versión. | **Criterio:** los hechos guardan los dos momentos. **Escenario:** la persona registra el lunes la sesión del domingo: queda del domingo, registrada el lunes. **Evidencia:** `prisma/schema.prisma` (`momento_de_ocurrencia` y `momento_de_registro`). |

# Fuentes

*De dónde sale cada dato, para quien quiera verificarlo en el repositorio público del proyecto.*

> **Fuentes.** 1. Identificador, prioridad y texto de cada requisito: la especificación de requisitos, documento 04 del legajo (`docs/legajo/04_BE_LEG_04_v0.4.2.1.md`).
> 2. Canal de cada requisito: la separación por canal DV-03 (`docs/mesa/MESA_02/DV-03/DV-03_RF_POR_CANAL.csv`).
> 3. Lo que hace la app: `apps/mobile/src` (las pantallas, su lógica y sus pruebas). Lo que hace el servidor: `apps/api/src`, `packages/domain/src` y `prisma/schema.prisma`. «La vez pasada», quién miró y la nota para el profe: `apps/mobile/src/la-vez-pasada-en-la-sesion.ts`, `quien-miro.ts` y `nota-para-tu-profe.ts`, con sus pruebas.
> 4. Cifras del no funcional, contadas en el repositorio del proyecto en noviembre de 2026: 35 módulos de la API, 107 migraciones, 334 claves foráneas con borrado restringido y 108 operaciones que usa la app instalada (`packages/domain/fixtures/lecturas-de-la-apk/`).
> 5. El Android mínimo (API 24) y el objetivo (API 36): la verificación de cada publicación de la app (`scripts/aab/verificar-aab.mjs`).
