# 12 · RF y RNF Web

*Lo que hace el website, donde trabajan el profesional y Administración, y con qué calidad lo hace.*

> BE ubica, no califica. Muestra qué se indicó, qué pasó y qué cambió, y la decisión queda en manos del profesional.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** Noviembre de 2026

> **Resumen.** El website es el escritorio del profesional de Nutrición, Entrenamiento y Antropometría, y la consola de Administración. Resuelve 57 requisitos funcionales, 32 propios y 25 compartidos con la app o resueltos por el servidor, y 32 no funcionales, cada uno con su criterio medible, su escenario y su evidencia.

**Entregable:** 12 · RF y RNF Web
**Fecha:** Noviembre de 2026
**Lo acompaña:** Los requisitos de la app, en el documento 13; los casos de uso, en el 10, y los casos de prueba, en el 11.

# Resumen

*57 requisitos funcionales y 32 no funcionales sostienen el website.*

**Qué es.** El website es donde trabaja el profesional de Nutrición, Entrenamiento o Antropometría, y donde Administración habilita a cada profesional por área. Está pensado para el escritorio, de 1024 a 1920 píxeles de ancho (1280 o más, recomendado). Acá está lo que hace, requisito por requisito, y con qué calidad lo hace.

**Para qué.** El profesional encuentra la historia de cada persona ordenada en el tiempo: lo que indicó, lo que la persona registró y lo que cambió en cada revisión, en sus tres áreas. Arma y activa los planes, compara períodos con gráficos y decide con todo el contexto. Si la persona venía de otro profesional y lo autoriza, también ve lo que pasó antes.

**Cómo se comprueba.** Cada requisito funcional se sigue hasta su caso de uso (documento 10) y su caso de prueba (documento 11). Cada no funcional dice con qué criterio se mide, en qué escenario se pone a prueba y dónde está la evidencia, en el repositorio del proyecto.

![Figura 1: Los 57 requisitos funcionales del website, por grupo. Cada baldosa es un requisito, con su número y su prioridad](pendiente)

> **Texto de la figura:**
> - Cuenta y acceso8 requisitos
> - 001P0
> - 002P0
> - 003P1
> - 004P2
> - 005P1
> - 006P0
> - 007P0
> - 069P1
> - Alta del profesional y Administración7 requisitos
> - 008P0
> - 011P0
> - 012P0
> - 014P0
> - 015P0
> - 068P1
> - 072P1
> - Vínculo, permiso y continuidad5 requisitos
> - 018P0
> - 021P0
> - 023P0
> - 024P0
> - 025P0
> - Nutrición9 requisitos
> - 026P0
> - 027P0
> - 028P0
> - 029P0
> - 073P1
> - 030P0
> - 031P0
> - 034P0
> - 035P0
> - Entrenamiento10 requisitos
> - 036P0
> - 064P0
> - 037P0
> - 038P0
> - 039P0
> - 040P0
> - 041P0
> - 044P0
> - 045P0
> - 046P0
> - Antropometría4 requisitos
> - 047P0
> - 048P0
> - 049P0
> - 050P0
> - Seguimiento y coordinación8 requisitos
> - 052P0
> - 053P0
> - 054P0
> - 055P0
> - 056P0
> - 057P0
> - 058P1
> - 066P1
> - Soporte profesional y servicios externos6 requisitos
> - 070P0
> - 071P0
> - 059P0
> - 060P0
> - 061P1
> - 062P2
> - Solo en el website **32**Compartido con la app o resuelto por el servidor **25**P0 núcleo · P1 alta prioridad · P2 complementario

# 1. El website

*Dos actores, un escritorio. El profesional planifica, sigue y revisa; Administración habilita.*

El website se usa en el escritorio, de 1024 a 1920 píxeles de ancho (1280 o más, recomendado), en los temas Claro y Azul noche. Lo usan dos actores:

- **El profesional**, con su cartera y lo pendiente de cada persona; la ficha de cada persona (Resumen, Patrones, Línea de tiempo y Analizar, y en cada área el plan, los registros y las revisiones); los editores de planes, con el contexto de la persona a la vista, y las plantillas, que se preparan también sin una persona; el catálogo de alimentos, el Recetario de BE, las recetas y los ejercicios; las tomas antropométricas sobre la figura; los gráficos del seguimiento; los pedidos de información y las notas de coordinación.
- **Administración**, que entra con contraseña y segundo factor. Da de alta a los profesionales con la matrícula verificada fuera de BE; observa, verifica o rechaza, suspende y rehabilita a cada uno por área, siempre con un fundamento registrado; atiende las incidencias y los pedidos de derechos de las personas, y asiste la recuperación del acceso. No ve datos de salud.

Cada área se abre con una franja: la vuelta como botón («Espacio profesional» o la ficha de la persona), el área, la persona y su acceso. Al volver a la pestaña, BE se fija solo si hay algo nuevo y lo dice con «Hay datos nuevos · Ver».

La persona también entra al website para ver su cuenta, sus vínculos y sus permisos, descargar sus datos o avisar un problema, pero su canal principal es la app.

> **La idea clave.** **Una sola historia por persona, en tres áreas.** El website pone cada plan, registro, toma y revisión sobre el mismo eje del tiempo, para que el profesional vea cómo cada cambio fue afectando a la persona.

## 1.1 Lo que el website le da al profesional

Los requisitos no son una lista suelta: cada grupo sostiene una parte del valor de BE.

![Figura 2: Lo que aporta el website y los requisitos que lo sostienen](pendiente)

> **Texto de la figura:**
> - 01. La persona, en el tiempo
> - Cada plan, comida, sesión, toma y revisión es un punto de una sola historia, ordenada por fecha.
> - RF-053RF-054RF-049RF-056
> - 02. Un sistema, no tres planillas
> - Nutrición, Entrenamiento y Antropometría sobre la misma persona; cada profesional ve también lo que la persona le comparte de las otras áreas.
> - Nutrición (8)Entrenamiento (10)Antropometría (4)RF-057
> - 03. Cada cambio, con su porqué
> - Un plan activado es una versión que no cambia; corregir agrega y cita al original; cada revisión guarda su fundamento y su decisión.
> - RF-031RF-041RF-044RF-050RF-035RF-046
> - 04. Comparar para ver patrones
> - Gráficos de las tres áreas sobre el mismo eje, alineados o superpuestos, con la cinta del tiempo arriba. Ayudan a formular hipótesis; no prueban causas.
> - RF-034RF-045RF-049RF-053
> - 05. No empezar de cero
> - Si la persona cambia de profesional, su historia sigue con ella y, si lo autoriza, el nuevo ve lo que pasó antes en esa área.
> - RF-025RF-023RF-024
> - 06. Más datos, más herramientas
> - Catálogos propios e importados, métodos de cálculo con versión, pedidos de información y formularios de inicio.
> - RF-027RF-028RF-037RF-038RF-048RF-070RF-071
> - **La condición**Son datos de salud: cada área se ve solo con el vínculo, el consentimiento de la persona y la habilitación vigentes. Lo decide el servidor en cada pedido.RF-015RF-018RF-021

## 1.2 El editor de planes

La pantalla que más requisitos junta es el editor de planes. Así se ve el de Entrenamiento, con lo que resuelve cada parte.

![Figura 3: El editor de Entrenamiento, con los requisitos que resuelve cada parte.Fuente: Captura del website en el tema Claro, a 1280 de ancho (recorte). La persona del ejemplo es sintética](pendiente)

> **Texto de la figura:**
> - 1. **RF-042** (de la app, documento 13). «Camila Ortiz no la ve»: en la app, la persona solo ve la versión activa, nunca la que está en preparación.
> - 2. **RF-039 y RNF-REL-001.** El plan en preparación se guarda solo, y «Guardado» aparece cuando el servidor lo confirma.
> - 3. **RF-041.** «Revisar y activar…» activa el plan como una versión que no cambia.
> - 4. **RF-041.** «Panel» abre «Antes de activar»: lo que impide activar y lo que queda sin completar.
> - 5. **RF-039.** La fase, su propósito y las sesiones, con sus días.
> - 6. **RF-040 y RF-045.** «Detalle y fuerza estimada» abre el cuadro del ejercicio: «La vez pasada», serie por serie, y la fuerza estimada (Epley v1).
> - 7. **RF-040.** La prescripción por serie: repeticiones, carga, el esfuerzo (RIR o RPE) y el descanso, cada uno con su mínimo, su máximo y su paso.

# 2. Cómo leer este documento

*Cada requisito tiene un número, un canal y una prioridad.*

## 2.1 Un canal por requisito

Cada requisito conserva el número de la especificación del proyecto, por eso la numeración tiene saltos. Cada uno está asignado al canal donde se usa: el website, la app o los dos. Los compartidos, y los que resuelve el servidor sin pantalla propia, aparecen en este documento; los que también usa la app están además en el de la app (13). La línea «Funciona en» de cada uno dice dónde se ve.

![Figura 4: Los 55 requisitos funcionales de este documento, por canal](pendiente)

> **Texto de la figura:**
> - **30**solo en el website
> - **25**compartidos con la app, o resueltos por el servidor para los dos canales

## 2.2 La prioridad

**Tabla 1.** Las tres prioridades de la especificación.

| P | Qué significa | En este documento |
| --- | --- | --- |
| P0 | Núcleo del sistema: lo que no puede faltar. | 46 |
| P1 | Alta prioridad. | 7 |
| P2 | Complementario: suma sobre un núcleo firme. | 2 |

En cada tabla, la columna «Cómo lo resuelve BE» dice qué hace el sistema para cumplir el requisito, y la línea «Funciona en», dónde se ve.

# 3. Requisitos funcionales

*Ocho grupos y los gráficos del seguimiento. En cada tabla, qué pide el requisito, su prioridad y cómo lo resuelve BE.*

## 3.1 Cuenta y acceso (8)

Crear la cuenta, entrar, salir, recuperar el acceso y saber en qué estado está cada cosa.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-001**<br>compartido | **Crear una cuenta propia.** Cualquier persona o profesional crea su cuenta con correo y contraseña, o con Google. La cuenta no depende de un profesional ni de un plan. | P0 | Un mismo correo nunca crea dos cuentas. El alta pide aceptar los términos, leer la información de privacidad y declarar la mayoría de edad.<br>*Funciona en: website y app.* |
| **RF-002**<br>compartido | **Entrar y salir de la cuenta.** Iniciar y cerrar la sesión, y no dejar entrar a una cuenta que no está habilitada. | P0 | En el website, la sesión sobrevive a una recarga sin guardar la contraseña ni el token en el navegador; en la app, la credencial queda en el almacén seguro del teléfono. El profesional entra con su contraseña o con Google; Administración, además, con un segundo factor.<br>*Funciona en: website y app.* |
| **RF-003**<br>compartido | **Entrar con Google sin duplicar la cuenta.** Google es un método más para entrar; BE sigue decidiendo roles, áreas y permisos. | P1 | Si ya existe una cuenta con ese correo, Google se vincula a ella después de confirmar su contraseña: nunca se crea una segunda cuenta.<br>*Funciona en: website y app.* |
| **RF-004**<br>compartido | **Administrar los métodos de acceso.** Sumar o quitar métodos de acceso sin partir la cuenta en dos. | P2 | En «Cómo entrás», la cuenta muestra con qué se entra. Vincula Google confirmando la contraseña y lo desvincula solo si queda la contraseña: la cuenta nunca se queda sin un método. Cada cambio queda registrado.<br>*Funciona en: website y servidor.* |
| **RF-005**<br>compartido | **Recuperar el acceso.** Volver a entrar si se olvidó la contraseña, sin crear otra cuenta y sin revelar qué correos están registrados. | P1 | La persona pide recuperar el acceso desde «¿Olvidaste tu contraseña?», y la respuesta es siempre la misma, exista o no la cuenta. Administración verifica a la persona fuera de BE y le da un código de un solo uso, que vale 24 horas. Con el código elige una contraseña nueva y se cierran todas sus sesiones.<br>*Funciona en: website, app y servidor.* |
| **RF-006**<br>compartido | **Saber en qué estado está la cuenta.** Mostrar qué está listo y qué falta para usar cada función: cuenta, perfil, área habilitada, vínculo. | P0 | La cuenta muestra su estado y qué falta para cada función. Si falta el nombre, la app lo pide en «Antes de seguir».<br>*Funciona en: website y app.* |
| **RF-007**<br>compartido | **Llegar a cada función por el canal previsto.** El profesional y Administración encuentran lo suyo en el website; la persona, en la app. | P0 | Cada sesión dice desde qué canal llega y el servidor decide con eso. Ocultar un botón nunca reemplaza al permiso.<br>*Funciona en: website, app y servidor.* |
| **RF-069**<br>compartido | **Cerrar la propia cuenta.** El titular pide el cierre de su cuenta sin que se borren en silencio vínculos, decisiones ni historia. | P1 | Antes de cerrar, la cuenta muestra las consecuencias. El cierre corta las sesiones y finaliza los vínculos con un evento registrado; la historia no se borra. En «Tus datos», la persona descarga lo suyo y pide el acceso, la rectificación o la supresión, que resuelve Administración.<br>*Funciona en: website y app.* |

## 3.2 Alta del profesional y Administración (7)

Cómo un profesional queda habilitado por área. Administración verifica la matrícula fuera de BE, lo da de alta con su fundamento y después habilita, observa, suspende y rehabilita. También atiende los problemas que avisan las personas y los profesionales.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-008**<br>website | **Crear y mantener el perfil profesional.** Un profesional tiene su perfil sin que eso lo habilite a operar ni a ver datos de nadie. | P0 | Administración verifica la matrícula fuera de BE y da de alta al profesional con su fundamento. El perfil solo no habilita nada: hacen falta el área habilitada y, con cada persona, el vínculo y su permiso.<br>*Funciona en: website.* |
| **RF-011**<br>website | **Revisar el alta de un profesional.** Administración revisa cada área y deja observaciones o una resolución, con fecha, autor y fundamento. | P0 | La lista de Administración pone primero a quien espera una resolución. Cada observación y cada resolución quedan con su fundamento.<br>*Funciona en: website.* |
| **RF-012**<br>website | **Resolver la verificación por área.** Verificar, rechazar o suspender un área con motivo; la decisión afecta solo esa área. | P0 | Administración entra con contraseña y segundo factor, y verificar exige el fundamento. Habilitar no es certificar una matrícula.<br>*Funciona en: website.* |
| **RF-014**<br>website | **Suspender y rehabilitar a un profesional.** Cortar las acciones nuevas de un área sin borrar nada, y rehabilitarla con una resolución explícita. | P0 | Por área y con fundamento registrado. Suspender Nutrición corta esa área en el pedido siguiente del profesional, aun con su sesión abierta, y no toca Entrenamiento; las personas reciben el aviso sin los motivos.<br>*Funciona en: website.* |
| **RF-015**<br>compartido | **Separar verificación, habilitación y permiso.** Un área verificada no da acceso a los datos de una persona; un vínculo tampoco. Cada condición se evalúa por separado. | P0 | Lo resuelve el servidor en un único punto de decisión, que registra cada respuesta.<br>*Funciona en: servidor.* |
| **RF-068**<br>compartido | **Registrar incidencias administrativas.** Reportar y seguir problemas de acceso, perfiles, vínculos o funcionamiento. | P1 | Desde su cuenta, la persona o el profesional usa «Avisar un problema», con una categoría y una descripción, y ve el estado y la respuesta. Administración la toma, la resuelve con una respuesta o la reabre, y la historia de cada incidencia no se borra.<br>*Funciona en: website y servidor.* |
| **RF-072**<br>website | **Cuidar el catálogo de alimentos cargados a mano.** Administración revisa lo que los profesionales cargan a mano, ve quién lo cargó y nunca a quién se le indicó, certifica con una fuente, marca un equivalente verificado y suma al catálogo verificado lo que piden varios. | P1 | «Alimentos», en la consola de Administración, agrupa las cargas por nombre parecido y dice cuántos profesionales cargaron algo así. Cada decisión queda contra la versión que se vio y con su autor, y lo cargado a mano sigue siendo de quien lo cargó; el buscador de ese profesional le sugiere el verificado. Un profesional también puede «Proponer al Recetario de BE» una receta suya: si tiene foto, acepta antes la cesión de la foto, y BE guarda qué texto aceptó y cuándo. Administración ve cada propuesta con su autor y las recetas parecidas, y la suma o no, con un motivo opcional que ve quien la propuso.<br>*Funciona en: website.* |

## 3.3 Vínculo, permiso y continuidad (5)

Cómo empieza y termina la relación entre una persona y un profesional, cómo la persona decide quién ve qué, y cómo su historia sigue con ella si cambia de profesional.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-018**<br>compartido | **Invitar o pedir un vínculo.** Iniciar una relación que diga quién la pide, con quién, para qué área y con qué finalidad. | P0 | El profesional invita para un área con un enlace, un QR o un código de un solo uso. La persona acepta desde la app y da su consentimiento por área.<br>*Funciona en: website y app.* |
| **RF-021**<br>compartido | **Decidir el acceso en cada operación.** Permitir o negar cada lectura y cada escritura según el rol, el área, el vínculo, el permiso y la finalidad vigentes. | P0 | Un único punto de decisión en el servidor, igual para el website y la app, en cada pedido. Lo ajeno o lo no autorizado responde igual que lo inexistente, y cada decisión queda registrada.<br>*Funciona en: servidor.* |
| **RF-023**<br>compartido | **Ver mis vínculos y permisos.** Cada uno ve sus relaciones y lo que autorizó, y lo que se muestra coincide con el acceso real. | P0 | En el website, la cuenta muestra los vínculos y los permisos de cada uno. En la app, «Quién ve qué» dice qué ve cada profesional y cuándo miró por última vez lo que la persona le compartió. Al aceptar a un profesional, la persona decide en una sola pantalla, con todo marcado y retirable: el área, lo que comparte de sus otras áreas y la historia anterior («Aceptar y compartir», «Elegir qué compartir» o «Ahora no»). Después, en «Quién ve qué», tiene un interruptor por cosa.<br>*Funciona en: website y app.* |
| **RF-024**<br>compartido | **Pausar o finalizar un vínculo.** Pausar o terminar la relación sin borrar la cuenta ni la historia. | P0 | Con motivo y autor. Quien pausó es quien reanuda, y pausar o finalizar no borra la historia.<br>*Funciona en: website y app.* |
| **RF-025**<br>compartido | **Conservar la historia al cambiar de profesional.** Si la persona cambia de profesional, su cuenta y su historia siguen; el acceso no pasa solo al nuevo. | P0 | La autoría de cada registro no cambia y nada se transfiere sin permiso. Con la autorización de la persona, que se da desde «Quién ve qué» en la app, el profesional nuevo de un área ve en «Historia anterior», dentro de la ficha, lo que pasó antes con otros profesionales en esa área: los planes que tuvo, lo que registró, las tomas y las decisiones de cada revisión, en solo lectura y marcado como de otro profesional. Las notas privadas del profesional anterior no se comparten. La persona retira la autorización cuando quiere y ve cuándo la miró.<br>*Funciona en: website, app y servidor.* |

## 3.4 Nutrición (9)

Evaluación y objetivo, plan en borrador, activación como versión, registro de la persona, análisis y revisión.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-026**<br>website | **Registrar la evaluación nutricional.** Cargar la evaluación con autor, fecha, fuente y contexto. | P0 | Al empezar el plan, la evaluación se arma en tres bloques: «Lo que contó» la persona (los formularios que respondió, que quedan vinculados a la evaluación sin copiar ninguna respuesta), «Lo medido» (la última toma de Antropometría que el profesional puede usar) y «Lo que necesita el cálculo» (edad, sexo, peso, talla y nivel de actividad, cada uno con su origen y su fecha). La fecha es la del momento en que se registra y se puede cambiar para una evaluación hecha antes. «Anotaciones» es un espacio libre y privado del profesional: la persona no lo ve. Distingue lo que informa la persona, lo que observa el profesional y lo que se calcula.<br>*Funciona en: website.* |
| **RF-027**<br>website | **Tener un catálogo propio de alimentos.** Un catálogo de BE y la carga manual, para no depender de ningún proveedor. | P0 | Catálogo base para todos, alimentos propios de cada profesional, recetas y «Mis habituales». Un alimento propio se corrige con una versión nueva o se retira, sin romper lo que lo cita; el buscador dice si es «Verificado» o «Tuyo» y muestra el ícono de su grupo. Las medidas caseras (la unidad, la cucharada, la taza y la porción) traen su equivalencia en gramos. En «Recetas», dos pestañas: «Mis recetas» y el «Recetario de BE», recetas de cocina familiar para todos los profesionales de Nutrición, de solo lectura, que se usan tal cual como opción del plan o se copian a «Mis recetas» para adaptarlas.<br>*Funciona en: website.* |
| **RF-028**<br>website | **Importar alimentos de Open Food Facts.** Traer alimentos de un catálogo público, revisarlos y recién ahí incorporarlos. | P0 | Cada alimento importado guarda de dónde vino y cuándo; lo que el proveedor no trae no se completa solo.<br>*Funciona en: website.* |
| **RF-029**<br>website | **Definir el objetivo nutricional.** Un objetivo con vigencia y responsable, relacionado con su evaluación. | P0 | Cambiar el objetivo crea una versión nueva y la anterior queda: los gráficos muestran cada una como el período en que rigió. El objetivo dice las kcal que suman sus gramos (4, 4 y 9 por gramo de proteína, carbohidratos y grasa) y avisa si no coinciden. Una versión del objetivo puede apoyarse en una toma de Antropometría: queda vinculada y, si llega una toma más nueva, BE lo avisa sin recalcular solo.<br>*Funciona en: website.* |
| **RF-073**<br>website | **Calcular el objetivo con un método publicado.** A pedido del profesional, estimar el gasto energético y proponer los macronutrientes con un método publicado y con los datos a la vista; el profesional decide. | P1 | «Calcular» propone el objetivo con un método publicado: usa la toma de Antropometría con un toque o los datos cargados a mano, muestra la fórmula y la cuenta, y deja lo largo y la fuente detrás de «?» y «Fuente». El ajuste se elige como «Mantener», «Déficit» o «Superávit», sin signos; proteína y grasa van en g/kg con su mínimo, su máximo y su paso. Entre los métodos están Mifflin-St Jeor, Harris-Benedict revisada, FAO/OMS/UNU, Katch-McArdle, Cunningham y las dos ecuaciones de ten Haaf y Weijs (2014) para personas que entrenan. «Usar estos valores en el objetivo» los lleva al formulario; el servidor rehace la cuenta al guardar.<br>*Funciona en: website.* |
| **RF-030**<br>website | **Armar el plan nutricional en borrador.** Comidas, opciones, cantidades y observaciones, antes de activarlo. | P0 | El plan se empieza en la vista del plan: «Crear nuevo plan», «Nueva versión del plan» (copia la activa), «Empezar en blanco» o «Empezar desde una plantilla», y se arma en un solo editor. Mientras se escriben los gramos, cada alimento muestra lo que aporta. Cada día tipo muestra su «Reparto por comida»: la parte del día de cada comida (en % de las kcal del día, que suman 100) y el rango que resulta en kcal, proteínas, carbohidratos y grasas. Cada comida muestra una franja por macro con el rango indicado y el promedio de sus opciones, y las opciones que se tildan, cada una en su color, se mueven en tiempo real al cambiar un alimento; la franja ubica y no califica. «Rangos y totales» resume el día y cada comida. El objetivo del día dice su versión y desde cuándo rige; si hay uno más nuevo, «Usarla ahora» lo toma. Una opción que es una receta muestra su imagen y la deja cargar o cambiar ahí mismo. El borrador se guarda solo y dice si el cambio ya está en el servidor; la persona no lo ve. Un borrador se puede descartar.<br>*Funciona en: website.* |
| **RF-031**<br>website | **Validar y activar el plan nutricional.** No dejar activar un plan inválido y, al activarlo, guardar una versión que no cambia. | P0 | «Revisar y activar…» muestra antes lo que impide activar. La persona ve exactamente la versión activada. «Descargar el plan en PDF» arma la hoja para la consulta, con un QR para bajar la app.<br>*Funciona en: website.* |
| **RF-034**<br>website | **Analizar lo registrado antes de revisar.** Ver juntos evaluación, objetivo, plan, lo registrado y la evolución de un período. | P0 | «Analizar», en la ficha, pone en el tiempo la energía de cada día, con lo que se sabe de ese día; la proteína, los carbohidratos, la grasa y la fibra, cada uno en su panel, con el objetivo de cada período de fondo; lo indicado y lo registrado, día por día, en gramos; y dos etapas lado a lado, con todas las observaciones. Abrir la pantalla no cuenta como revisión.<br>*Funciona en: website.* |
| **RF-035**<br>website | **Decidir cómo sigue el proceso nutricional.** Después de revisar: mantener, ajustar, sustituir o cerrar. | P0 | La decisión queda unida a su revisión, con su fundamento, y la persona la lee en la app.<br>*Funciona en: website (la persona la lee en la app).* |

## 3.5 Entrenamiento (10)

El mismo circuito, con la prescripción por serie, la corrección sin borrar y el historial de cada ejercicio.

![Figura 5: El historial de un ejercicio en «Analizar», con el 1RM estimado (Epley v1) y las versiones del plan de fondo.Fuente: Captura del website en el tema Claro, a 1280 de ancho (recorte). La persona del ejemplo es sintética](pendiente)

> **Texto de la figura:**
> - 1. **RF-045.** El 1RM estimado (Epley v1): una estimación hecha con una serie, que solo ve el profesional.
> - 2. **RF-045.** Cada versión del plan es una franja: cada estimación se lee contra el plan que regía ese día.
> - 3. **RF-045.** La lectura de la fecha elegida: la serie de origen, quién la escribió, «Cómo se calculó» y «Ver la sesión».
> - 4. La diferencia con la estimación anterior, en su unidad, y cuánto mueve la cuenta un RIR de diferencia.
> - 5. Lo que no tiene estimación se dice, con su motivo; nunca se dibuja como cero.
> - 6. **RNF-ACC-001.** La tabla equivalente: cada estimación con su serie, su autor y su cálculo.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-036**<br>website | **Registrar la evaluación de entrenamiento.** Cargar la evaluación con autor, fecha, contexto y fuentes. | P0 | Se distingue de lo que la persona registra después. Los formularios que la persona respondió se vinculan a la evaluación, sin copiar ninguna respuesta. La misma fecha automática y las mismas «Anotaciones» privadas que en Nutrición.<br>*Funciona en: website.* |
| **RF-064**<br>website | **Definir el objetivo de entrenamiento.** Un objetivo con período y responsable, relacionado con la evaluación y el plan. | P0 | Cada cambio crea una versión nueva y conserva la historia.<br>*Funciona en: website.* |
| **RF-037**<br>website | **Tener un catálogo propio de ejercicios.** Un catálogo de BE y la carga manual, para planificar aunque falle el proveedor externo. | P0 | Catálogo base y «Mis ejercicios», con imágenes y zonas musculares.<br>*Funciona en: website.* |
| **RF-038**<br>website | **Importar ejercicios de wger.** Traer ejercicios de un catálogo público con revisión, licencia y procedencia. | P0 | La fuente y la licencia quedan en cada ejercicio importado; las zonas musculares del proveedor no se toman como propias.<br>*Funciona en: website.* |
| **RF-039**<br>website | **Armar el plan por bloques y sesiones.** Estructurar el entrenamiento en períodos, bloques y sesiones antes de activarlo. | P0 | Fases (la etapa de varias semanas), microciclos y sesiones con sus días, en el editor, también desde plantillas propias; dentro de cada sesión, un «Bloque» opcional agrupa ejercicios «Seguido» o «En vueltas». Las plantillas se preparan también sin una persona, desde «Mis plantillas», y se guardan como versión: editarlas no toca los planes que salieron de ellas. Mientras se planifica, el panel «Contexto de…» muestra lo importante de la persona, sus formularios, su cuerpo, sus otras áreas y las notas, solo con su permiso. El plan en preparación se guarda solo, y la persona no lo ve hasta que se activa.<br>*Funciona en: website.* |
| **RF-040**<br>website | **Indicar ejercicios, series y parámetros.** Que la persona sepa qué hacer en cada sesión: ejercicio, series, repeticiones, carga, descanso. | P0 | La prescripción es por serie: repeticiones, carga, RIR y descanso. Al elegir un ejercicio, el buscador marca «Con historial» con las sesiones de la persona y la fecha de la última; el cuadro del ejercicio muestra «La vez pasada», serie por serie, sin mezclarla con lo indicado. «Calcular la carga desde la estimación…» parte de la fuerza estimada, y el profesional confirma. Las series de calentamiento van arriba de las efectivas y no entran en ninguna cuenta. La escritura rápida («4×8-12 RIR 2 · 60 kg · 90 s») se aplica con «Aplicar». El profesional elige «Cómo se escribe el esfuerzo»: RIR (repeticiones en reserva) o RPE (de 6 a 10, la escala basada en RIR: RPE = 10 − RIR, de a medio punto, con «6 o menos» como la opción más baja). Es la misma medida escrita de dos formas: BE guarda siempre el RIR, y el historial, los gráficos y lo que ven otros profesionales no cambian. Las repeticiones, el descanso y la carga tienen su mínimo, su máximo y su paso, y lo que no se entiende se marca en su celda sin correr la tabla.<br>*Funciona en: website.* |
| **RF-041**<br>website | **Validar y activar el plan de entrenamiento.** No dejar activar un plan incompleto y guardar una versión que no cambia. | P0 | «Revisar y activar…» muestra lo que impide activar y lo que queda sin completar. Activado, el plan es una versión que no cambia; una sustitución queda relacionada con la versión anterior. «Descargar el plan en PDF» arma la hoja para la consulta.<br>*Funciona en: website.* |
| **RF-044**<br>compartido | **Corregir lo registrado sin borrar.** Corregir una sesión mostrando el valor original, el motivo y quién corrigió. | P0 | La corrección es un registro nuevo; el original queda.<br>*Funciona en: website y app.* |
| **RF-045**<br>website | **Analizar lo registrado antes de revisar.** Comparar lo planificado con lo hecho en un período, antes de decidir. | P0 | «Analizar» compara lo planificado con lo hecho en el período. El historial de cada ejercicio muestra el 1RM estimado (Epley v1) sesión a sesión, con las versiones del plan de fondo, y la carga, las repeticiones y el RIR de la misma serie en paneles alineados; cada estimación dice de qué serie sale y cómo se calculó. El 1RM estimado sale solo de las series efectivas. Con el plan en RPE, lo indicado, lo registrado y la fuerza estimada se leen en RPE. Cada estimación dice con qué serie salió («estimado con 5 reps a RPE 8 · 100 kg»); BE estima solo con series de RPE 8 a 10 (RIR 0 a 2), y la estimación nunca se presenta como un máximo probado.<br>*Funciona en: website.* |
| **RF-046**<br>website | **Decidir cómo sigue el entrenamiento.** Después de revisar: mantener, progresar, reprogramar, sustituir o cerrar. | P0 | La decisión queda unida a la revisión y al plan siguiente.<br>*Funciona en: website.* |

## 3.6 Antropometría (4)

Tomas, cálculos reproducibles, correcciones sin borrar y la evolución del cuerpo en el tiempo.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-047**<br>website | **Registrar una toma antropométrica.** Cargar mediciones con protocolo, unidades, fecha, autor y contexto. | P0 | La toma se hace sobre la figura, con los puntos del protocolo. Antes de medir, «Qué vas a calcular»: uno o varios métodos, o un conjunto de un toque («Kerr (1988), cinco componentes», «Somatotipo de Heath y Carter»). La figura y la lista piden solo lo que necesitan esos métodos, más peso, talla y edad; vienen elegidos los de la última toma del profesional, «+ Otra medición» suma un punto suelto y lo que ya tiene dato nunca se esconde. Al elegir Jackson y Pollock, BE dice dónde se toma el suprailíaco.<br>*Funciona en: website.* |
| **RF-048**<br>compartido | **Calcular resultados reproducibles.** Calcular resultados derivados sin confundirlos con lo medido, guardando método, datos y versión. | P0 | Cada cálculo guarda su método, su versión y sus entradas, y se puede repetir con el mismo resultado. Ninguno se presenta como diagnóstico. El catálogo incluye el fraccionamiento de Kerr (1988) en cinco masas (piel, adiposa, muscular, ósea y residual), cada una con su fuente y su población. La toma muestra el peso de la balanza, las cinco masas, su suma (el «Peso estructurado») y la diferencia con el peso medido, en kg y en % del peso medido, que es como Kerr valida el modelo: por debajo del 4 % del peso medido, salvo en fisicoculturistas (8 % del peso medido).<br>*Funciona en: website y servidor.* |
| **RF-049**<br>compartido | **Ver la evolución antropométrica.** Comparar tomas en el tiempo con período, unidad y procedencia a la vista. | P0 | «Desde el inicio y desde la anterior» ubica cada medida de una toma frente a la primera y a la anterior, con los días entre fechas. Además, el perfil por sitio entre dos tomas y la masa grasa según cada método, en un eje común. La persona ve su evolución en la app.<br>*Funciona en: website y app.* |
| **RF-050**<br>website | **Corregir o anular una medición.** Corregir o anular conservando el original y el motivo. | P0 | Nada se sobrescribe; la anulación queda como estado del registro, con su motivo.<br>*Funciona en: website.* |

![Figura 6: «Desde el inicio y desde la anterior»: cada medida de una toma frente a la primera y a la anterior.Fuente: Captura del website en el tema Claro, a 1280 de ancho (recorte). La persona del ejemplo es sintética](pendiente)

> **Texto de la figura:**
> - 1. **RF-049.** Contra qué tomas se compara: la primera y la anterior, con el mismo protocolo, método y unidad.
> - 2. Desde cuándo se leyeron las tomas.
> - 3. **RF-049.** Una resta con su signo, su unidad y los días entre las tomas: ubica el cambio, no lo califica.

## 3.7 Seguimiento y coordinación (8)

La cartera, la ficha de cada persona, la línea de tiempo, los gráficos, las revisiones y la coordinación entre profesionales.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-052**<br>website | **Ver la cartera de personas.** El profesional ve sus personas y procesos, con lo que necesita atención. | P0 | La cartera muestra a cada persona con lo que necesita atención.<br>*Funciona en: website.* |
| **RF-053**<br>website | **Ver la ficha de una persona.** Una síntesis del proceso: áreas, vínculos, permisos, revisiones y próxima acción, sin calificar a la persona. | P0 | La ficha reúne Resumen, Patrones, Línea de tiempo y Analizar, con los resúmenes de las otras áreas que la persona permite; cada área tiene su plan, sus registros y sus revisiones, con «Preparar la revisión». En «Patrones», los gráficos de la persona sobre el mismo eje y con un solo cursor; «Armá tu gráfico», con hasta tres series alineadas o superpuestas; y los enfoques de cada profesional, para una persona o un plan.<br>*Funciona en: website.* |
| **RF-054**<br>compartido | **Ver la línea de tiempo.** Reconstruir en orden lo que pasó, con fecha, área, autor y procedencia, sin mezclar lo indicado con lo hecho. | P0 | Con búsqueda en el website. La cinta del tiempo pone arriba de los gráficos, sobre el mismo eje, las versiones de los planes, las tomas, las revisiones y las notas.<br>*Funciona en: website y app.* |
| **RF-055**<br>website | **Saber qué revisiones están pendientes.** Señalar qué proceso necesita revisión y por qué, sin presentarlo como alerta clínica. | P0 | En «Pendientes» de la cartera, con el motivo de cada una.<br>*Funciona en: website.* |
| **RF-056**<br>website | **Registrar la revisión y la próxima acción.** Una revisión válida identifica lo revisado, el período, el autor, el fundamento y el resultado. | P0 | Uno de seis resultados: mantener, ajustar, sustituir, reprogramar, cambiar el objetivo o finalizar, con el período revisado, el fundamento y la evidencia marcada.<br>*Funciona en: website.* |
| **RF-057**<br>website | **Dejar notas de coordinación.** Documentar contexto para otros profesionales sin pasarles responsabilidad ni facultades. | P0 | La persona también las lee en la app. Aparte, en «Tus notas», el profesional anota lo suyo con su fecha, y eso no se manda a nadie.<br>*Funciona en: website (la persona lee las notas de coordinación en la app).* |
| **RF-058**<br>compartido | **Calcular la TVCC-30.** Producir los datos para medir cuántos ciclos de revisión se cierran a tiempo en 30 días. | P1 | El servidor la calcula con los hechos de la base, sin pantalla propia; mirar no cambia nada y el resultado queda conservado.<br>*Funciona en: servidor.* |
| **RF-066**<br>website | **Representar las habilitaciones sin cobro.** Representar la habilitación de cada profesional por área y su capacidad, sin cobros reales. | P1 | Administración concede y retira la habilitación por área, con su fundamento. La capacidad de cada profesional es un dato aparte, con versiones, que el servidor respeta al activar un plan para otra persona; por omisión, sin límite. BE no cobra.<br>*Funciona en: website y servidor.* |

## 3.8 Los gráficos del seguimiento

Los gráficos ponen la historia de la persona sobre el mismo eje del tiempo y aparecen donde el profesional decide: al elegir un ejercicio, al analizar un período y al preparar una revisión. Cada gráfico tiene su tabla equivalente y se maneja con teclado, y todo lo que se ve acá muestra solo las áreas que la persona autorizó.

**Tabla 2.** Los gráficos del website, dónde aparecen y el requisito que resuelven.

| Gráfico | Qué muestra | Dónde | RF |
| --- | --- | --- | --- |
| «Con historial» | En el buscador «Agregar ejercicio», cuántas sesiones tiene la persona con ese ejercicio y cuándo fue la última. | El buscador del editor de Entrenamiento | RF-040 |
| «La vez pasada» | Lo que la persona registró las últimas veces que hizo el ejercicio, serie por serie, debajo de lo que indica el plan y sin mezclarse con eso. | El cuadro del ejercicio | RF-040 |
| El historial del ejercicio | El 1RM estimado (Epley v1) sesión a sesión, con las versiones del plan de fondo, y la carga, las repeticiones y el RIR de la misma serie en paneles alineados. | El cuadro del ejercicio y «Analizar» | RF-045 |
| La alimentación en el tiempo | La energía de cada día; la proteína, los carbohidratos, la grasa y la fibra en paneles, con el objetivo de cada período de fondo; lo indicado y lo registrado, día por día, en gramos. | «Analizar», la ficha y «Patrones» | RF-034 |
| El cuerpo en el tiempo | «Desde el inicio y desde la anterior»; el perfil por sitio entre dos tomas; la masa grasa según cada método, en un eje común. | La ficha y «Analizar» | RF-049 |
| Dos etapas lado a lado | Todas las observaciones de dos etapas, no solo su promedio. | «Analizar» y «Patrones» | RF-034 y RF-045 |
| «Armá tu gráfico» | Hasta tres series de las áreas autorizadas, alineadas (una arriba de la otra) o superpuestas cuando comparten el eje del tiempo, con hasta dos unidades. | «Analizar» y «Patrones» | RF-053 |
| La cinta del tiempo | Las versiones de los planes, las tomas, las revisiones y las notas, arriba de los gráficos y sobre el mismo eje. | «Analizar», «Patrones» y la ficha | RF-054 |
| «Patrones» y los enfoques | Los gráficos de la persona en el mismo tiempo, con un solo cursor. Cada profesional guarda sus enfoques, de hasta seis gráficos, para una persona o un plan. Si lleva las dos áreas, «Ver la relación» muestra los cruces entre ellas, con lo que también cambió en ese período. | La ficha y el editor | RF-053 |

> **La frase de los cruces.** Cada cruce entre áreas dice **«Coinciden en el tiempo; esto no prueba que una cosa cause la otra»**. El gráfico ayuda a formular una hipótesis; la decisión es del profesional.

## 3.9 Soporte profesional y servicios externos (6)

Métodos de cálculo, pedidos de información, continuidad cuando falla un proveedor, novedades y avisos.

| RF | Requisito y qué pide | P | Cómo lo resuelve BE |
| --- | --- | --- | --- |
| **RF-070**<br>website | **Usar métodos de cálculo reproducibles.** El profesional elige un método con versión, ve qué datos pide y obtiene un resultado que no cambia solo el objetivo ni el plan. | P0 | Un catálogo de métodos con versión, cada uno con su ficha. Solo la versión vigente se ofrece; la anterior se consulta como tal. Los métodos se eligen antes de medir; el catálogo suma Kerr (1988) y las ecuaciones de ten Haaf y Weijs (2014), cada uno con su fuente, su población y para quién sirve.<br>*Funciona en: website.* |
| **RF-071**<br>compartido | **Pedir y completar información.** El profesional pide información con una finalidad; la persona responde y puede rectificar. | P0 | Pedidos con plantillas versionadas, formularios de inicio y «Tus hábitos», que la persona comparte con permiso. La persona responde desde la app y puede rectificar. Desde la evaluación, «Completarlo ahora con» la persona crea el pedido y abre la carga en el mismo lugar, con lo necesario para planificar primero y el resto a pedido; al terminar, vuelve a la evaluación con lo cargado, que la persona confirma desde la app. Si la persona corrige algo, la evaluación lo dice.<br>*Funciona en: website y app.* |
| **RF-059**<br>compartido | **Seguir funcionando si falla un proveedor.** Si Google, Open Food Facts, wger o los avisos fallan, lo esencial sigue con lo propio. | P0 | Respaldo con el catálogo propio y la carga manual; cada consulta externa tiene un tiempo máximo.<br>*Funciona en: website y servidor.* |
| **RF-060**<br>compartido | **Ver de dónde viene un dato externo.** Mostrar proveedor, fecha y referencia de lo que vino de afuera. | P0 | El origen aparece en cada fila del buscador de alimentos y ejercicios.<br>*Funciona en: website y servidor.* |
| **RF-061**<br>compartido | **Ver novedades.** Un centro donde cada actor ve lo nuevo que le corresponde, aunque no lleguen los avisos. | P1 | En el website y en la app. No son alertas clínicas.<br>*Funciona en: website y app.* |
| **RF-062**<br>compartido | **Recibir avisos en el teléfono.** Avisos para algunas novedades, sin datos sensibles y sin que sean la única vía. | P2 | El servidor manda los avisos y los recordatorios al teléfono, sin contenido de salud, y la persona los activa o los apaga desde la app. Nunca son la única vía: todo está también en las novedades.<br>*Funciona en: app y servidor.* |

# 4. Requisitos no funcionales

*32 requisitos de calidad, cada uno con su criterio, su escenario y su evidencia.*

> **La idea clave.** **Cada promesa de calidad se puede comprobar:** qué se mide, cómo se pone a prueba y dónde está la evidencia.

## 4.1 Los 32, por categoría

Los no funcionales conservan el número de la especificación. Valen para el website y, cuando los resuelve el servidor, también para la app. Las pruebas de integración están en `test/integration`, contra PostgreSQL 16 real; los recorridos del navegador, en `test/navegador`. Las dos capas corren en la verificación de cada cambio.

![Figura 7: Los 32 requisitos no funcionales del website, por categoría, con su prioridad](pendiente)

> **Texto de la figura:**
> - Seguridad5 requisitos
> - SEC-001P0
> - SEC-002P0
> - SEC-003P0
> - SEC-005P0
> - SEC-006P0
> - Privacidad3 requisitos
> - PRI-001P0
> - PRI-002P0
> - PRI-003P0
> - Rendimiento y disponibilidad2 requisitos
> - PERF-003P0
> - AVA-002P0
> - Recuperación y confiabilidad2 requisitos
> - REC-002P0
> - REL-001P0
> - Accesibilidad y lenguaje3 requisitos
> - ACC-001P0
> - ACC-002P0
> - ACC-003P0
> - Mantenibilidad4 requisitos
> - MAN-001P0
> - MAN-002P0
> - MAN-003P0
> - MAN-004P0
> - Observabilidad3 requisitos
> - OBS-001P1
> - OBS-002P1
> - OBS-003P0
> - Integración3 requisitos
> - INT-001P1
> - INT-002P0
> - INT-003P0
> - Escala2 requisitos
> - SCA-001P1
> - SCA-002P1
> - Datos5 requisitos
> - DAT-001P0
> - DAT-002P0
> - DAT-003P0
> - DAT-004P0
> - DAT-005P0

## 4.2 Seguridad y privacidad

| RNF | Criterio medible | Escenario | Evidencia |
| --- | --- | --- | --- |
| **RNF-SEC-001** · P0<br>**Autorización igual en todos los canales.** | Ninguna lectura ni escritura protegida se permite sin vínculo, consentimiento, alcance y habilitación vigentes, venga del website o de la app. Lo no autorizado responde igual que lo inexistente. | Un profesional verificado pide los datos de una persona sin consentimiento, o con el vínculo pausado o finalizado: 404, y la auditoría registra el motivo. | `pdp.int-spec.ts` (TEST-RNF-SEC-001, TEST-AUTH-003 a 008); el recorrido «accesoRevocado». |
| **RNF-SEC-002** · P0<br>**Credenciales, sesiones y secretos protegidos.** | Ninguna credencial, token, hash ni dirección IP en los registros, la auditoría o las respuestas; el correo tampoco está en los registros ni en la auditoría. Contraseñas con bcrypt de costo 10 o más; en el website, la sesión en una cookie HttpOnly; segundo factor para el profesional y Administración; los secretos, fuera del repositorio. | Después de entrar, operar y salir, ni los registros ni el almacenamiento del navegador tienen nada reutilizable. | `sanitizacion.int-spec.ts` (TEST-RNF-SEC-002); el recorrido «sesion»; `segundo-factor-del-profesional.int-spec.ts` y `administracion.int-spec.ts`. |
| **RNF-SEC-003** · P0<br>**Resistencia al abuso del acceso.** | Entrar: 5 intentos por cuenta y red cada 15 minutos, 20 por cuenta desde cualquier red y 100 por red. Recuperar: 3 pedidos por hora por correo; cinco códigos que no valen anulan el pedido. Pasado el cupo, el mismo 429, exista o no la cuenta. El segundo factor se pide en Administración; el profesional entra con su contraseña o con Google, con estos mismos límites y con sesiones que vencen. | Muchos intentos contra una cuenta desde varias direcciones: pasado el cupo, 429, aun con la contraseña correcta, y la misma respuesta para una cuenta que no existe. | `sesiones.int-spec.ts` (TEST-RNF-SEC-003); `recuperacion-de-acceso.int-spec.ts`. |
| **RNF-SEC-005** · P0<br>**Auditoría de lo sensible.** | Cada operación sensible registra actor, momento, operación, sujeto y resultado en la misma transacción: si la auditoría falla, la operación no ocurre. La cesión de la foto de una receta propuesta al Recetario de BE queda registrada con el texto aceptado, su huella y el momento; las decisiones de Administración, con su autor. | Se fuerza una falla de la auditoría durante un alta: no queda la identidad ni ningún otro efecto. | `registro.int-spec.ts` (TEST-RNF-SEC-005); `pdp.int-spec.ts`. |
| **RNF-SEC-006** · P0<br>**Mínimo privilegio por área.** | Cada profesional lee y opera solo las áreas que tiene habilitadas y que la persona le autorizó. Administración no recibe datos de salud. | La persona pausa Entrenamiento: ese profesional deja de verla y el de Nutrición sigue con Nutrición. Un profesional de Nutrición no ve la fuerza estimada de la misma persona. | `pdp.int-spec.ts` (TEST-AUTH-007, TEST-RNF-SEC-006); `nutricion.int-spec.ts`, `antropometria.int-spec.ts` y `fuerza.int-spec.ts`. |
| **RNF-PRI-001** · P0<br>**Pedir y guardar solo lo pertinente.** | Los avisos al teléfono no llevan contenido. Las fotos se guardan sin metadatos (ni EXIF ni GPS) y se leen por rutas que vencen en 15 minutos como máximo. Las «Anotaciones» de la evaluación son del profesional: ninguna lectura de la persona las trae. | La persona sube la foto de una comida con su ubicación: lo guardado no tiene metadatos y la ruta de lectura vence. | `medios.int-spec.ts`; `novedades.int-spec.ts`. |
| **RNF-PRI-002** · P0<br>**Retiro del permiso efectivo y verificable.** | Retirar el consentimiento corta el acceso del área en el pedido siguiente, sin borrar la historia, y queda registrado quién y cuándo. | Con la ficha abierta en el website, la persona retira el consentimiento desde el teléfono: al actualizar, «Acceso no disponible», sin acciones; recargar recupera la sesión, no el permiso. | `pdp.int-spec.ts` (TEST-AUTH-005, TEST-RNF-PRI-002); el recorrido «accesoRevocado». |
| **RNF-PRI-003** · P0<br>**Cada superficie muestra lo de su actor.** | El website del profesional, la consola de Administración y la app de la persona reciben solo lo de su actor. Lo que es solo del profesional, como la fuerza estimada, no llega a la app. | La sesión de Administración pide una operación de personas: no autentica. La persona pide la estimación de su fuerza: no la recibe. | `administracion.int-spec.ts`; `fuerza.int-spec.ts`. |

## 4.3 Rendimiento, disponibilidad y confiabilidad

| RNF | Criterio medible | Escenario | Evidencia |
| --- | --- | --- | --- |
| **RNF-PERF-003** · P0<br>**Integraciones con tiempo acotado.** | Cada consulta a un proveedor externo tiene un tope de 5 segundos, sin reintentos dentro del pedido, y ninguna transacción queda abierta mientras se espera. Si no responde, BE contesta con el respaldo. | Open Food Facts está caído, lento o redirige: 503 con el respaldo, sin crear nada para importar, y la carga manual sigue. | `integraciones.int-spec.ts` (con un proveedor simulado); `apps/api/src/integraciones/proveedor-http.ts`. |
| **RNF-AVA-002** · P0<br>**Los datos persisten tras un reinicio.** | Reiniciar la API no pierde operaciones confirmadas ni exige rehacer nada a mano: el estado vive en una base PostgreSQL administrada. | La API se reinicia en cada despliegue; en los recorridos del navegador arranca dos veces, y lo registrado antes del reinicio sigue ahí. | `test/navegador/LEEME.md`; `render.yaml` (la base administrada). |
| **RNF-REC-002** · P0<br>**Reintentos sin duplicados.** | Repetir una operación sensible con la misma clave de idempotencia devuelve el mismo resultado sin repetir el efecto; la misma clave con otro contenido responde 409. | El website reintenta la activación de un plan después de perder la respuesta: una sola versión activa y la misma respuesta. | `nutricion.int-spec.ts`, `registro.int-spec.ts`, `vinculo.int-spec.ts` y `cierre.int-spec.ts` (TEST-RNF-REC-002). |
| **RNF-REL-001** · P0<br>**Nunca un éxito falso.** | «Guardado a las…» aparece solo con la respuesta del servidor. Ante una falla, lo escrito sigue en pantalla y la barra dice qué pasó y cómo seguir. | Se corta la red mientras se edita un plan: «No se pudo guardar», y al volver la conexión se guarda solo. Un 503 ofrece «Reintentar»; una respuesta perdida termina guardada sin aviso de conflicto. | Los recorridos «borrador», «reintentar», «respuestaPerdida» y «salidaConFallas»; `apps/web/test/estado-de-guardado.test.mjs`. |

Las imágenes de las recetas se guardan en dos medidas livianas, una grande para el detalle y una miniatura para listas y tarjetas, y cada lugar pide la que necesita; el website achica la foto antes de subirla y una misma foto del mismo profesional se guarda una sola vez.

## 4.4 Accesibilidad, mantenibilidad y observabilidad

| RNF | Criterio medible | Escenario | Evidencia |
| --- | --- | --- | --- |
| **RNF-ACC-001** · P0<br>**Accesibilidad en los recorridos núcleo.** | Contraste de 4,5:1 en el texto y de 3:1 en bordes, foco y marcas, en los dos temas. Cero faltas críticas o serias de axe-core (WCAG 2.2, niveles A y AA) en las pantallas del profesional, que se recorren con teclado y el foco visible. Cada gráfico, con su tabla equivalente. Cada cantidad lleva su ícono, su número y su abreviatura («2.500 kcal», «112 g P»), y el lector de pantalla oye el nombre completo; las franjas por comida se leen como texto, opción por opción. | Un color nuevo que no llega al contraste hace fallar la verificación del cambio. Con el teclado, la pista de un botón aparece enseguida y Escape la cierra sin mover el foco; con el zoom al 200 %, la pista entra y nada se corre de costado. | `scripts/contraste.test.cjs` (en cada cambio); `scripts/auditoria-accesibilidad.mjs` y `EVIDENCIA/ESCRITORIO-AREAS/ACEPTACION.md`; el recorrido «pistas». |
| **RNF-ACC-002** · P0<br>**Lenguaje claro, sin diagnósticos.** | Los textos ubican, nunca califican: una prueba recorre el texto visible de todas las pantallas del website y de la app, y falla si aparece una de las palabras que BE nunca usa, ni siquiera negada; las pruebas de cada pantalla cuidan las demás. Los cruces entre áreas llevan siempre «Coinciden en el tiempo; esto no prueba que una cosa cause la otra». | Un texto nuevo que califica a la persona hace fallar la prueba, y el cambio no entra. | `apps/web/test/vocabulario-visible.test.mjs`; `packages/domain/src/vocabulario-de-los-graficos.ts`. |
| **RNF-ACC-003** · P0<br>**Adaptado a cada pantalla.** | El website se usa en el escritorio, de 1024 a 1920 píxeles de ancho (1280 o más, recomendado), sin acciones cortadas ni desbordes de costado, en los temas Claro y Azul noche. Con un error, nada cambia de lugar: cada aviso tiene su renglón reservado. Las acciones son botones discretos y el subrayado queda para lo que lleva a otro lado. La ayuda de cada sección va en un «?» en su esquina superior derecha y lo que explica flota, sin correr lo que se está editando; se cierra con Escape. | Los gráficos se capturan a 1024, 1280, 1440 y 1920 de ancho, y los editores a 1280, 1440 y 1920, en los dos temas. | Los flujos de capturas de los gráficos y de los editores (`EVIDENCIA/GRAFICOS/herramientas/capturas.mjs`); `EVIDENCIA/ESCRITORIO-AREAS/ACEPTACION.md`. |
| **RNF-MAN-001** · P0<br>**Una sola fuente de reglas.** | Cada regla vive en un solo lugar: el paquete de dominio que comparten la API, el website y la app. La autorización se decide en el servidor, nunca solo en la pantalla. | Un cambio en una regla del dominio vale igual en el website, la app y la API, y lo comprueban las pruebas de cada uno. | `packages/domain`; la API, un monolito modular de 29 módulos (`apps/api/src`); `apps/api/src/autorizacion/pdp.service.ts`. |
| **RNF-MAN-002** · P0<br>**Contratos compatibles y verificables.** | El contrato de la API, de 335 operaciones, se genera desde el dominio, y la verificación falla si no coincide. Lo que lee la app distribuida queda fijado en pruebas: cada operación que llama, leída con sus propios esquemas. Los campos nuevos del plan (el tipo de serie y los bloques de la sesión) salen solo para la app que declara conocerlos. | Un cambio del servidor que rompe una respuesta que lee la app instalada hace fallar la verificación, y el cambio no entra. | `docs/api/openapi.json` y `scripts/generar-openapi.cjs --verificar`; `contrato.int-spec.ts` y `lecturas-de-las-apk.int-spec.ts`. |
| **RNF-MAN-003** · P0<br>**Esquema que evoluciona en forma reproducible.** | Cada cambio de la base es una migración versionada (87). Aplicadas desde una base vacía describen exactamente el esquema, y una migración que falla aborta el despliegue sin quedar registrada. | Cada cambio aplica todas las migraciones sobre un PostgreSQL 16 vacío, las compara con el esquema y arranca la imagen de la API con ellas. | `schema.int-spec.ts` (la deriva es vacía); `despliegue.int-spec.ts` (TEST-RUN-003); el trabajo «imagen API» de la verificación. |
| **RNF-MAN-004** · P0<br>**Pruebas proporcionales al riesgo.** | Ningún cambio entra sin cuatro controles en verde: el legajo (las huellas SHA-256 de la documentación del proyecto), la verificación (tipos, pruebas unitarias y construcción), la integración con PostgreSQL 16 y la imagen de la API. Los 24 recorridos del navegador corren en cada cambio. | Una regla rota a propósito pone en rojo su prueba. | `.github/workflows/ci.yml`; 96 archivos de integración, 95 de pruebas del dominio y 56 del website. |
| **RNF-OBS-001** · P1<br>**Diagnóstico sin exponer datos.** | Cada error devuelve un código y un identificador de pedido. Un error no clasificado deja en el registro solo su tipo y ese identificador. | Un error inesperado: la respuesta y el registro se correlacionan por el identificador, sin el mensaje ni datos de la persona. | `sanitizacion.int-spec.ts` (TEST-RNF-OBS-001, TEST-RUN-009); `apps/api/src/http/request-id.ts`. |
| **RNF-OBS-002** · P1<br>**Salud del despliegue a la vista.** | `/health/ready` responde 200 con el ambiente, la versión desplegada y sus dependencias; sin la base o con una migración sin aplicar, 503 `DB_UNAVAILABLE`. Nunca muestra secretos. | Un despliegue recibe tráfico solo cuando `/health/ready` responde 200. En la verificación de cada cambio, la imagen nueva de la API tiene que responder 200 con la versión esperada. | `despliegue.int-spec.ts` (TEST-RUN-002); `render.yaml` (`healthCheckPath`); el trabajo «imagen API» de la verificación. |
| **RNF-OBS-003** · P0<br>**Trazabilidad en los dos sentidos.** | Cada operación de la API lleva su ID de la especificación, o de una familia propia declarada, y ninguno se repite. Cada requisito se sigue hasta su caso de uso, su operación y su prueba, y cada prueba nombra lo que demuestra. | Una operación nueva con un ID repetido o sin declarar hace fallar la verificación. | `scripts/trazabilidad-de-operaciones.test.cjs`; los IDs TEST-RF, TEST-RNF y TEST-UC en las pruebas; los documentos 10 y 11. |

## 4.5 Integración, escala y datos

| RNF | Criterio medible | Escenario | Evidencia |
| --- | --- | --- | --- |
| **RNF-INT-001** · P1<br>**Proveedores reemplazables.** | Cada proveedor externo (Google, Open Food Facts, wger, los avisos y el correo) se usa detrás de un adaptador; el núcleo no depende de sus respuestas. | Las pruebas de integración corren con proveedores simulados que responden completo, incompleto, caído o lento, sin llamar a ningún tercero. | `soporte-proveedores.ts`, `soporte-google.ts` y `soporte-correo.ts`; `apps/api/src/integraciones`. |
| **RNF-INT-002** · P0<br>**Fechas, unidades y zona horaria coherentes.** | Los instantes se guardan en UTC, con la zona en que ocurrieron (Buenos Aires por omisión); el día de cada registro es el de esa zona. Cada valor lleva su unidad. | Un instante que en UTC ya es el día siguiente cuenta en el día civil de su zona. | `packages/domain/src/fechas-civiles.test.ts`; `tvcc30.int-spec.ts`. |
| **RNF-INT-003** · P0<br>**Importaciones validadas.** | Lo importado se revisa antes de entrar: lo que el proveedor no trajo viaja vacío y no se incorpora sin completarlo. Se limpian los caracteres de control y se conserva la procedencia. | Un alimento de Open Food Facts sin su base de referencia: 422 con la ruta de cada faltante, y no entra al catálogo hasta completarlo. | `integraciones.int-spec.ts` (TEST-RF-028 y TEST-RF-038). |
| **RNF-SCA-001** · P1<br>**Escala para la validación y el primer grupo de profesionales.** | La cartera lee hasta 200 personas por profesional, y su lectura no crece con la historia de cada una. Con cinco profesionales a la vez, cero errores. | Medición con 50, 100 y 200 personas sintéticas y 1, 3 y 5 profesionales a la vez: con 200 personas, una página tarda una mediana de 0,94 s con uno y de 2,2 s con cinco; 3.320 pedidos sin errores, en un servidor de pruebas de 4 CPU. | `test/rendimiento`; `EVIDENCIA/RENDIMIENTO-CARTERA/LECTURA-POR-CONJUNTOS.md`. |
| **RNF-SCA-002** · P1<br>**Habilitación y capacidad desacopladas.** | La habilitación por área y la capacidad del profesional son datos con historia, separados del código: una versión nueva de cualquiera de los dos no cambia las otras áreas del profesional ni los permisos de las personas. | Con la capacidad ocupada, activar un plan para otra persona se rechaza sin cambiar nada. Retirar la habilitación de un área no toca las otras. | `entrenamiento.int-spec.ts` (REG-06-91 y 93); el recorrido «administracion». |
| **RNF-DAT-001** · P0<br>**Estados íntegros.** | Un estado solo pasa a otro permitido, la base lo exige por sí misma y cada transición deja su evento. Una operación queda completa o sin efectos. | Suspender una cuenta sin fundamento se rechaza; la cuenta solo pasa de operativa a suspendida o cerrada, con su evento. | `maquina-de-estado.int-spec.ts` (TEST-RNF-DAT-001) y las demás pruebas de las máquinas de estado (`maquinas-*.int-spec.ts`); las pruebas del dominio. |
| **RNF-DAT-002** · P0<br>**Procedencia obligatoria.** | Cada hecho dice quién o qué lo originó y cuándo. En lo registrado, cada valor dice si lo escribió la persona, lo observó el profesional o vino del plan. | El profesional corrige la carga de una serie: ese valor deja de decir «de la persona» y los demás conservan su origen. | `procedencia-por-campo.int-spec.ts` (TEST-EDP-059 y 060). |
| **RNF-DAT-003** · P0<br>**Versiones sin sobrescritura.** | Un plan activado es una versión que la base no deja reabrir, editar ni borrar; corregir agrega. Las 326 claves foráneas tienen el borrado restringido. | Editar o borrar una versión activada directamente en la base: la base lo rechaza. | `maquinas-wp04.int-spec.ts`; `cierre.int-spec.ts` (la historia no se borra); `prisma/schema.prisma`. |
| **RNF-DAT-004** · P0<br>**Validación con errores accionables.** | Un dato inválido se rechaza antes de escribir nada: 422 con un detalle por campo y su límite, sin repetir el valor enviado. | Una respuesta con 9 días y 45,5 minutos: un 422 con un detalle para cada campo, y no se guarda nada; corregida, se registra. | `formularios-errores.int-spec.ts`; `apps/api/src/http/validacion.spec.ts`. |
| **RNF-DAT-005** · P0<br>**Reproducibilidad en el tiempo.** | Cada hecho separa cuándo ocurrió de cuándo se registró. Cada cálculo guarda método, versión, regla y entradas, y el mismo conjunto da el mismo resultado. | Otra corrida del mismo método sobre las mismas entradas es una corrida nueva, y la anterior queda como estaba. | `calculos.int-spec.ts` (TEST-CAL-001 a 005); `tvcc30.int-spec.ts`. |

# Fuentes

*De dónde sale cada dato, para quien quiera verificarlo en el repositorio público del proyecto.*

> **Fuentes.** 1. Número, prioridad y texto de cada requisito: la especificación de requisitos del proyecto (documento 04 del legajo, en `docs/legajo`).
> 2. Canal de cada requisito: la separación por canal (`docs/mesa/MESA_02/DV-03/DV-03_RF_POR_CANAL.csv`).
> 3. Cómo lo resuelve BE y la evidencia de cada no funcional: el código del sistema y sus pruebas, en el repositorio `github.com/Elian-Bufi/be`.
> 4. Cifras del sistema (34 módulos, 335 operaciones, 102 migraciones y 326 claves foráneas): contadas en el código del repositorio (`apps/api/src`, `docs/api/openapi.json`, `prisma/migrations` y `prisma/schema.prisma`).
> 5. La medición de la cartera: `test/rendimiento` y `EVIDENCIA/RENDIMIENTO-CARTERA`.
> 6. Las capturas: pantallas del website tomadas por la verificación automática, con datos sintéticos, en el tema Claro, a 1280 de ancho.
