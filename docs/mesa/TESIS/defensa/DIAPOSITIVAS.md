# BE · Defensa de tesis: las diapositivas

Esquema generado desde la fuente del mazo (`defensa/presentacion/project`) por `herramientas/esquema-de-diapositivas.mjs`.
El mazo se edita y se presenta en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U (privado hasta que Dirección lo
comparta; se descarga como PowerPoint o PDF). Las imágenes son recursos del mazo.

## Qué es BE, para quién y qué no hace.

### 1 · BE

- Trabajo final · Analista de Sistemas Escuela Da Vinci
- Plataforma integrada de inteligencia en salud
- Elián Bufi
- [se completa el jueves: integrantes]
- [se completa el jueves: correos]
- [se completa el jueves: tutor o tutora]
- Noviembre de 2026
- *Imagen:* La ficha de Diego Sosa en el website profesional de BE, vista Resumen, en el ambiente de prueba

> **Notas del orador.** Buenas tardes. Soy Elián Bufi y les presento BE, una plataforma para el seguimiento profesional en nutrición, entrenamiento y antropometría. La imagen es la ficha de Diego Sosa en el ambiente de prueba: una persona sintética con tres años de historia. En unos once minutos les cuento qué problema aborda, cómo funciona, qué cambió desde el 20 de octubre, una demo corta de las dos plataformas, lo que aprendí probándola en el teléfono y qué falta.

### 2 · Nadie ve el seguimiento completo

- El problema · hipótesis del proyecto
- Cada uno por su lado
- El plan en un documento, el seguimiento en una planilla, lo comido en otra aplicación.
- No queda el porqué
- Nadie puede reconstruir por qué se decidió lo que se decidió.
- La persona no decide
- No controla quién accede a qué parte de su información de salud.

> **Notas del orador.** Un nutricionista arma un plan en un documento, lo manda por mensajería y lleva el seguimiento en una planilla. Un entrenador hace lo mismo por su lado. La persona registra lo que come en otra aplicación, si registra algo. Nadie ve el proceso completo, nadie puede reconstruir por qué se decidió lo que se decidió y la persona no controla quién ve qué. Lo presento como hipótesis: no sale de entrevistas, y la tesis dice cómo se valida (apartado 2).

### 3 · Un solo seguimiento, con la persona al mando de sus datos

- La propuesta
- Website del profesional
- Evalúa, planifica, revisa y decide cómo seguir.
- APK del asesorado
- Ve lo que tiene para hoy y registra lo que hizo.
- Un núcleo que protege
- Vínculo por área, consentimiento y un único punto que autoriza.

> **Notas del orador.** BE junta las dos puntas sobre una misma historia. El profesional trabaja en el website: evalúa, arma el plan, revisa lo registrado y decide cómo seguir. El asesorado usa la APK: ve lo que tiene para hoy y registra lo que hizo. En el medio hay un núcleo que hace cumplir las reglas: cada profesional trabaja solo en el área en la que Administración lo habilitó, solo con el permiso que la persona dio para esa finalidad, y un único punto decide cada acceso.

### 4 · Qué hace BE y qué no hace

- Hace
- Cada profesional en su área, con el permiso de la persona
- Lo indicado queda escrito y no cambia
- Lo que pasó se registra aparte de lo indicado
- Nada se borra: corregir agrega un registro
- No hace
- No diagnostica ni califica a nadie
- No calcula solo el requerimiento
- No comparte sin consentimiento
- Todavía no procesa datos reales: solo prueba, con datos sintéticos

> **Notas del orador.** Cuatro decisiones de diseño, cada una implementada: cada profesional en su área y la persona decide; lo indicado queda escrito y no cambia, porque activar un plan es crear una versión; lo que pasó se registra aparte, así el profesional compara; y nada se borra, cosa que la base de datos exige con disparadores. Y cuatro límites, que son decisiones y no olvidos: no diagnostica ni puntúa, no decide el requerimiento por el profesional, no comparte sin consentimiento y no procesa datos reales: el ambiente es de prueba, con personas sintéticas.

## Cómo funciona y qué cambió desde el 20 de octubre.

### 5 · El circuito, de punta a punta

- 1 · Invitar
- Profesional: elige el área; BE crea enlace y código
- 2 · Aceptar y consentir
- Asesorado: acepta el vínculo y autoriza el acceso
- 3 · Planificar y activar
- Profesional: evalúa, fija el objetivo y activa
- 4 · Registrar
- Asesorado: comidas y sesiones; profesional: tomas
- 5 · Revisar
- Profesional: compara lo indicado con lo registrado
- 6 · Continuar o cerrar
- BE aplica el resultado de la revisión
- AJUSTAR o SUSTITUIR vuelve al paso 3 · MANTENER sigue en el 4 · FINALIZAR cierra el proceso

> **Notas del orador.** Este es el recorrido completo. Antes de empezar, Administración habilita al profesional en su área. Uno: el profesional invita; BE crea un enlace y un código de un solo uso, y el website dibuja el QR. Dos: el asesorado acepta el vínculo y autoriza el acceso; sin eso, el profesional no ve nada. Tres: el profesional evalúa, fija el objetivo y activa el plan; activar crea una versión que ya no cambia. Cuatro: se registra. Cinco: el profesional revisa. Seis: BE aplica el resultado: se vuelve a planificar, se sigue igual o se cierra. La versión con carriles es la lámina B-01 del anexo B.

### 6 · Qué cambió desde el 20 de octubre

- Administración
- Habilita y suspende a cada profesional por área, con segundo factor. Suspender un área no toca las otras.
- Nutrición
- Un mismo gráfico con lo registrado, el objetivo y lo indicado en el plan. Cada revisión dice en qué se apoyó.
- Entrenamiento
- Se puede volver a sustituir un ejercicio durante la sesión, como en la versión estable.
- Compatibilidad
- Las APK ya instaladas siguen leyendo la API de hoy: lo que lee cada versión quedó congelado y se prueba.

> **Notas del orador.** Desde la versión del documento, el 20 de octubre, pasaron cuatro cosas que importan. Primero, Administración: una persona con segundo factor habilita o suspende a cada profesional por área, y suspender Nutrición no corta Entrenamiento; lo probé el 27 de octubre, siete de siete pasos. Segundo, en Nutrición, «Analizar» junta en un solo gráfico lo que la persona registró, el objetivo que fijó el profesional y lo indicado en el plan, y cada revisión muestra la evidencia que tuvo a la vista. Tercero, volvió la sustitución de un ejercicio durante la sesión. Y cuarto, las APK que ya están instaladas siguen andando contra la API nueva: lo que lee cada versión quedó congelado y se prueba en cada cambio. Son las decisiones DL-151 a DL-158.

## La demo, lo que mostró la prueba en el teléfono y el registro más simple.

### 7 · Demo: el profesional y la persona, en vivo

- Website · Sofía Paz con Diego: la ficha, «Analizar» y una revisión
- [se completa el jueves: captura nativa de la sesión guiada]
- APK · Prueba Uno: «Ya la hice» y la sesión guiada
- Plan B: capturas del jueves [se completa el jueves: commit y APK]
- *Imagen:* El espacio profesional de Sofía Paz en el website: pendientes y cartera de asesorados

> **Notas del orador.** La demo dura dos minutos y medio. En el website entro como Sofía Paz, nutricionista, y abro la ficha de Diego: el resumen por área dice qué hay y qué falta registrar. En «Analizar» veo, en un mismo gráfico, lo que Diego registró, el objetivo que fijé y lo indicado en el plan. Abro su última revisión: queda escrito en qué evidencia me apoyé para decidir. Diego es solo para mirar: no escribo nada sobre él. Paso al teléfono con Prueba Uno, una cuenta descartable. En una sesión pendiente toco «Ya la hice» y «Hice todo lo planificado»: veo los valores del plan y confirmo; si una serie fue distinta, la cambio ahí mismo. Después inicio la sesión de hoy: arriba dice en qué ejercicio y serie voy; tildo la casilla y la serie queda registrada con lo planificado, o escribo lo que hice. Si la red o Render fallan, sigo con las capturas del jueves, tomadas contra la misma versión. Guion y plan B: defensa/DEMO.md.

### 8 · Lo que mostró la prueba en el teléfono

- Prueba breve · 26 al 29 de octubre · APK 0.18.0-candidata.1
- Un defecto de severidad alta
- Lo escrito sin tocar «Registrar serie» no se veía al cambiar de serie y se perdía sin aviso: la sesión quedó sin Press de banca.
- Lo que observé al usarla
- El botón quedaba abajo, después de la ayuda del RIR
- Mejor una cosa por vez, con el recorrido a la vista arriba
- Registrar tiene que ser fácil; detallar, una invitación
- En la APK nueva, lo escrito queda a la vista y guardado. [se completa el jueves: versión]
- *Imagen:* Captura nativa del 29 de octubre: en Sentadilla, la serie 1 muestra el plan en gris y el botón «Registrar serie 3» queda abajo, después de la ayuda del RIR y de «Cronometrar serie»

> **Notas del orador.** El 26 de octubre armé una prueba breve con cuentas descartables, y el 29 la hice en el teléfono con la candidata 0.18.0. Apareció un defecto de severidad alta: escribí dos series de Press de banca sin tocar «Registrar serie»; al pasar a otra serie, la fila volvía a mostrar el plan en gris, y al finalizar, la sesión quedó registrada sin ese ejercicio y sin ningún aviso. En la captura se ve por qué: el botón quedaba abajo de todo, después del cambio de unidad, del plan de la serie, de la ayuda del RIR y del cronómetro. Lo que aprendí: el error no estaba en la API sino en el recorrido, y eso solo se ve con la app en la mano. Por eso la APK nueva cambió la forma de registrar.

### 9 · Registrar, fácil; detallar, opcional

- Antes
- [se completa el jueves: «Ya la hice» en la APK nueva]
- Después
- Un toque: «Ya la hice»
- Lo planificado a la vista; se cambia lo distinto.
- La sesión guiada
- El recorrido arriba; una casilla por serie.
- Corregir sin formularios
- Suma lo que faltó; quita una serie destildándola.
- En el escritorio, lo cargado como el plan se ve como «carga rápida» y no se compara.
- *Imagen:* Antes: la corrección de una sesión en la candidata 0.18.0, un formulario con un campo por dato y por serie

> **Notas del orador.** La prueba mostró algo de fondo: no todos quieren cargar serie por serie. Así que el registro de entrenamiento pasó a tener niveles, como las comidas. Con un toque, «Ya la hice», queda registrado lo planificado, y si un ejercicio tuvo una serie menos, se cambia ahí mismo. El que quiere detalle usa la sesión guiada: arriba ve en qué ejercicio y serie va, y cada serie tiene su casilla. Y la corrección dejó de ser un formulario: suma lo que faltó y quita una serie destildándola. Para el profesional, lo importante es que cada serie dice cómo se cargó: lo cargado como el plan se ve como «carga rápida» y no se compara con lo indicado; lo que la persona escribió o cambió, sí. Detallar es una invitación, no una obligación. [se completa el jueves: decir «en curso» de lo que no esté instalado.]

## Por dentro, cómo se sabe que funciona, el método y lo que falta.

### 10 · Por dentro: cinco piezas y una sola base

- APK
- Expo y React Native
- API
- NestJS: un monolito modular de 23 módulos
- Autoriza cada operación y la audita en la misma transacción
- PostgreSQL 16
- 118 tablas; también las fotos
- [se completa el jueves: tablas de la versión integrada]
- Website
- Next.js, estático
- Recordatorios
- tarea programada, tres veces por día
- Todo en Render, en Frankfurt, con Docker y PostgreSQL estándar: se puede llevar a otro proveedor.

> **Notas del orador.** Por dentro son cinco piezas: la APK, el website, la API, la base de datos y una tarea programada que pide los recordatorios tres veces por día. Las aplicaciones nunca hablan con la base: todo pasa por la API. La API es un monolito modular, un solo proceso con veintitrés módulos; el último que entró es Administración. Es una decisión: una operación de salud tiene que ser completa o no ocurrir, y con una sola base alcanza una transacción local. Todo corre en Render, pero con Docker y PostgreSQL estándar; hasta las fotos van en la base. Láminas ARQ-02 y ARQ-03, apartado 8.

### 11 · Cómo se sabe que funciona

- 59 casos de prueba diseñados · recuento del 20/10
- 42 pasan en la CI
- 9 pasan en parte
- 8 no ejecutables con lo entregado
- CI en verde · main del 26/10
- 887 pruebas de dominio, 909 de integración con PostgreSQL, 159 de la API y 17 recorridos de navegador
- [se completa el jueves: corrida de la versión integrada]
- Probado en test
- Administración: 7 de 7 (27/10). Escenarios de prueba: 6 de 6, y 48 de 48 pantallas (26/10).
- Con profesionales reales: todavía no.

> **Notas del orador.** ¿Cómo sé que funciona? De los cincuenta y nueve casos de prueba del legajo, al 20 de octubre cuarenta y dos pasaban en la integración continua, nueve en parte y ocho no se podían ejecutar con lo entregado; cada uno tiene su motivo en el apartado 5. La CI de la versión del 26 de octubre corre ochocientas ochenta y siete pruebas de dominio, novecientas nueve de integración contra PostgreSQL, ciento cincuenta y nueve de la API y diecisiete recorridos de navegador, todo en verde. En test probé Administración, siete de siete pasos. Lo que todavía no hay es una prueba con profesionales reales, y lo digo así. [se completa el jueves: cifras de la versión integrada y recuento de los 59 casos.]

### 12 · Cómo se trabajó

- Legajo
- la fuente de verdad
- Paquete
- un objetivo corto
- Pull request
- con la CI en verde
- Decisión
- registrada, con opciones
- 943 commits
- y 208 pull requests integrados, del 16/9 al 26/10
- IA, declarada
- bajo dirección humana: 730 commits con coautoría

> **Notas del orador.** El método fue simple y estricto. El legajo es la fuente de verdad. Cada avance es un paquete de trabajo corto, que termina en un pull request con la integración continua en verde. Y cada vez que lo que dice el legajo no se podía o no convenía hacer tal cual, quedó una decisión registrada, con las opciones y lo que se eligió. En números: novecientos cuarenta y tres commits y doscientos ocho pull requests integrados entre el 16 de septiembre y el 26 de octubre. La implementación se hizo con asistentes de IA bajo mi dirección, y está declarado: setecientos treinta commits llevan su coautoría.

### 13 · Lo que falta y lo que sigue

- Falta probar
- Con profesionales reales
- Un aviso push recibido en un teléfono real
- Safari, Firefox y TalkBack
- [se completa el jueves: TalkBack probado o límite declarado]
- Lo que sigue
- Pasar la APK nueva a estable
- Google Play, en pruebas internas
- El alta pública de profesionales
- Para datos reales: segundo factor del profesional, respaldo probado y producción separada
- Hasta terminar la prueba de punta a punta, la estable sigue siendo la 0.13.2.

> **Notas del orador.** Prefiero decir lo que falta antes de que me lo pregunten. Falta la prueba con profesionales reales, un aviso push recibido en un teléfono real y la accesibilidad: Safari, Firefox y el lector de pantalla TalkBack. [se completa el jueves: si TalkBack se probó o queda como límite declarado, con su motivo.] Lo que sigue, en orden: pasar la APK nueva a estable cuando termine la prueba de punta a punta; publicarla en Google Play en pruebas internas; y el alta pública de profesionales, porque hoy Administración habilita a los que ya tienen cuenta. Y antes de tratar datos reales, las condiciones del documento 08: segundo factor también para profesionales, textos legales, respaldo con restauración probada y un ambiente de producción separado. Todo está en el anexo K, con su severidad.

## Preguntas.

### 14 · Preguntas

- Gracias
- Cada respuesta tiene su respaldo en la tesis: los apartados 1 a 14 y los anexos A a L.

> **Notas del orador.** Gracias por su atención. Quedo a disposición para las preguntas. Para cada una tengo el respaldo en la tesis, y después de esta diapositiva hay cuatro de respaldo: con quién habla BE, una operación protegida, los datos y los estados. Las preguntas más probables están en defensa/PREGUNTAS.md.

## Respaldo para las preguntas: con quién habla BE, una operación protegida, los datos y los estados.

### 15 · Con quién habla BE

- Asesorado
- APK: registra y consulta
- BE
- Seguimiento profesional con los datos de salud protegidos
- Google
- verifica la identidad
- Profesional
- website: evalúa y revisa
- Expo Push
- avisos sin datos de salud
- Validación
- mide la TVCC-30
- Catálogos abiertos
- Open Food Facts y wger
- Administración
- habilita por área

> **Notas del orador.** Este es el contexto, en el modelo C4. A la izquierda, las personas: el asesorado usa la APK; el profesional, el website; el responsable de validación mide la métrica de la tesis con un comando interno; y, desde el 25 de octubre, Administración entra al website con segundo factor y habilita o suspende a cada profesional por área, sin ver datos de salud. A la derecha, con borde discontinuo, los servicios externos: Google para entrar, Expo Push para los avisos, sin datos de salud, y dos catálogos abiertos. La lámina ARQ-01 del documento es del 20 de octubre y todavía muestra a Administración punteada, como prevista.

### 16 · Una operación protegida: activar un plan

- 1 · El website pide activar, con una clave de idempotencia
- 2 · La API abre una transacción y bloquea esa clave
- 3 · El PDP decide con el vínculo y el consentimiento, y lo registra
- 4 · Se escriben la versión activada, el proceso y la novedad
- 5 · Se audita, se guarda la respuesta y se confirma
- 6 · Después, fuera de la transacción: el aviso push
- Por qué importa
- Si algo falla, no cambia nada
- Un reintento recibe la misma respuesta
- Una revocación previa se respeta
- El aviso no frena la operación

> **Notas del orador.** Así es una escritura protegida, con nombres reales de clases en la lámina E-01 del anexo E. El website pide activar un plan con una clave de idempotencia. La API abre una sola transacción y bloquea esa clave. Dentro de la transacción, el punto de autorización decide con el vínculo y el consentimiento del momento, y registra su decisión. Recién ahí se escribe: la versión activada, el proceso y la novedad para el asesorado. Se audita, se guarda la respuesta y se confirma todo junto. El aviso push sale después, fuera de la transacción. Resultado: si algo falla no cambia nada, un reintento no duplica y una revocación que llegó antes se respeta.

### 17 · Los datos: la base cuida la historia

- 118
- tablas (el documento, del 20/10, muestra 113)
- 218
- claves foráneas, todas RESTRICT
- 53
- migraciones aplicadas
- 34
- índices únicos parciales, al 20/10
- 275
- disparadores, al 20/10
- 134
- restricciones CHECK, al 20/10
- Lo emitido no se modifica: corregir o anular agrega un registro.

> **Notas del orador.** La base no es un depósito pasivo: cuida la historia por su cuenta. Al 26 de octubre son ciento dieciocho tablas, con cincuenta y tres migraciones; las cinco tablas nuevas son de Administración. Las doscientas dieciocho claves foráneas son RESTRICT, así no hay borrados en cascada; los índices únicos parciales garantizan, por ejemplo, un solo proceso abierto por profesional, persona y área; y los disparadores impiden modificar lo emitido. Corregir o anular agrega un registro que cita al original. La excepción es la foto que el asesorado pide suprimir: se borran los bytes y queda la constancia. Las tres cifras en gris son del catálogo del 20 de octubre. [se completa el jueves: recontar las seis cifras en el catálogo de la versión integrada.]

### 18 · Estados con reglas, no con banderas

- El proceso operativo
- ABIERTO
- CERRADO
- Una revisión que no finaliza lo deja abierto.
- Lo cierran FINALIZAR, el fin del vínculo o el cierre de la cuenta. No se reabre.
- El consentimiento
- VIGENTE
- REVOCADO
- Lo decide siempre el asesorado.
- Revocar corta hacia adelante; puede volver a otorgarlo.

> **Notas del orador.** Las piezas importantes tienen máquinas de estados, y las transiciones están en tablas del dominio que el servicio consulta antes de escribir y la base refuerza. Dos ejemplos. El proceso operativo se abre al activar un plan; cada revisión que no finaliza lo deja abierto, y lo cierran una revisión que finaliza, el fin del vínculo o el cierre de la cuenta; cerrado, no se reabre. El consentimiento lo decide siempre el asesorado: lo otorga, lo revoca y lo puede volver a otorgar, y la revocación corta hacia adelante. Las cinco máquinas reales, con sus tablas, están en el anexo E.
