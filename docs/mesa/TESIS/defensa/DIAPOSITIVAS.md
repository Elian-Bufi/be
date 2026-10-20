# BE · Defensa de tesis: las diapositivas

Esquema generado desde la fuente del mazo (`defensa/presentacion/project`) por `herramientas/esquema-de-diapositivas.mjs`.
El mazo se edita y se presenta en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U (privado hasta que Dirección lo
comparta; se descarga como PowerPoint o PDF). Las imágenes son recursos del mazo.

## Qué es BE, para quién y qué no hace.

### 1 · BE

- Trabajo final · Analista de Sistemas Escuela Da Vinci
- Plataforma integrada de inteligencia en salud
- Elián Bufi
- [Integrantes, correos, mes y año: a confirmar]
- *Imagen:* La ficha de Diego Sosa en el website profesional de BE, vista Resumen, en el ambiente de prueba

> **Notas del orador.** Buenas tardes. Soy Elián Bufi y les presento BE, una plataforma para el seguimiento profesional en nutrición, entrenamiento y antropometría. La imagen es la ficha real de una persona sintética, Diego Sosa, en el ambiente de prueba: tres años de historia en una sola pantalla. En los próximos veinte minutos les muestro qué problema aborda, cómo funciona de punta a punta, una demostración de las dos plataformas, cómo está construido por dentro y qué falta. [Antes de la mesa: completar la nómina del grupo, los correos y el mes y año en esta portada.]

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

> **Notas del orador.** BE junta las dos puntas sobre una misma historia. El profesional trabaja en el website: evalúa, arma el plan, revisa lo registrado y decide cómo seguir. El asesorado usa la APK: ve lo que tiene para hoy y registra lo que hizo. En el medio hay un núcleo que hace cumplir las reglas: cada profesional trabaja en su área, solo con el permiso que la persona dio para esa finalidad, y un único punto decide cada acceso.

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

## Cómo funciona, de punta a punta.

### 5 · Con quién habla BE

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

> **Notas del orador.** Este es el contexto, en el modelo C4. A la izquierda, las personas: el asesorado usa la APK; el profesional, el website; y el responsable de validación mide la métrica de la tesis con un comando interno. A la derecha, con borde discontinuo, los tres servicios externos: Google para entrar con una cuenta de Google, Expo Push para que el aviso llegue al teléfono, sin datos de salud, y dos catálogos abiertos de donde el profesional importa alimentos y ejercicios. La lámina completa, con cada relación rotulada, es ARQ-01 en el apartado 8.

### 6 · El circuito, de punta a punta

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

> **Notas del orador.** Este es el recorrido completo. Uno: el profesional invita y elige el área; BE crea un enlace y un código de un solo uso, y el website dibuja el QR. Dos: el asesorado acepta el vínculo y autoriza el acceso; sin eso, el profesional no ve nada. Tres: el profesional evalúa, fija el objetivo y activa el plan; activar crea una versión que ya no cambia. Cuatro: se registra. Cinco: el profesional revisa. Seis: BE aplica el resultado; según cuál sea, se vuelve a planificar, se sigue igual o se cierra. La versión completa, con carriles, es la lámina B-01 del anexo B.

## La demo, en vivo o con su plan B.

### 7 · Demo: el mismo Diego en las dos plataformas

- Website · el espacio profesional, en test
- APK · render del cliente real; no es una captura nativa
- Plan B: capturas del 20/10 contra la misma versión, 0fb1bff
- *Imagen:* El espacio profesional de Sofía Paz en el website: pendientes y cartera de asesorados
- *Imagen:* La pantalla de Nutrición de la APK: el almuerzo con tres opciones del plan, en un render del cliente real en el navegador

> **Notas del orador.** La demo dura siete minutos y sigue a la misma persona, Diego Sosa, en las dos plataformas. En el website, con Sofía Paz: el espacio profesional, la ficha de Diego con su resumen, la línea de tiempo y el análisis del último año; el plan de nutrición con sus cinco versiones; la antropometría. Con Martín Acosta, el entrenamiento. En la APK: el plan del día, registrar una comida y la sesión serie por serie. Si la red o Render fallan, sigo con las capturas de esta mañana, tomadas contra la misma versión. Las de la APK son renders del cliente real en el navegador y lo digo al mostrarlas. Guion y respaldo: defensa/DEMO.md.

## Por dentro: arquitectura, una operación protegida, los datos y los estados.

### 8 · Por dentro: cinco piezas y una sola base

- APK
- Expo y React Native
- API
- NestJS: un monolito modular de 22 módulos
- Autoriza cada operación y la audita en la misma transacción
- PostgreSQL 16
- 113 tablas; también las fotos
- Website
- Next.js, estático
- Recordatorios
- tarea programada, tres veces por día
- Todo en Render, en Frankfurt, con Docker y PostgreSQL estándar: se puede llevar a otro proveedor.

> **Notas del orador.** Por dentro son cinco piezas: la APK, el website, la API, la base de datos y una tarea programada que pide los recordatorios tres veces por día. Las aplicaciones nunca hablan con la base: todo pasa por la API. La API es un monolito modular, un solo proceso con veintidós módulos por dominio, y eso es una decisión: una operación de salud tiene que ser completa o no ocurrir, y con una sola base alcanza una transacción local. Todo corre en Render, en Frankfurt, pero con Docker y PostgreSQL estándar; hasta las fotos van en la base. Láminas ARQ-02 y ARQ-03 en el apartado 8; la decisión es el ADR-01 del anexo H.

### 9 · Una operación protegida: activar un plan

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

### 10 · Los datos: la base cuida la historia

- 113
- tablas, en 14 vistas por dominio
- 212
- claves foráneas, todas RESTRICT
- 34
- índices únicos parciales
- 275
- disparadores
- 134
- restricciones CHECK
- 51
- migraciones aplicadas
- Lo emitido no se modifica: corregir o anular agrega un registro.

> **Notas del orador.** La base no es un depósito pasivo: cuida la historia por su cuenta. Son ciento trece tablas en catorce vistas por dominio. Las doscientas doce claves foráneas son RESTRICT, así no hay borrados en cascada; treinta y cuatro índices únicos parciales garantizan, por ejemplo, un solo proceso abierto por profesional, persona y área; y los disparadores impiden modificar lo emitido. Corregir o anular agrega un registro que cita al original. La excepción es la foto que el asesorado pide suprimir: se borran los bytes y queda la constancia. Cifras leídas del catálogo de PostgreSQL con las cincuenta y una migraciones aplicadas; apartado 6 y anexo G.

### 11 · Estados con reglas, no con banderas

- El proceso de seguimiento
- ABIERTO
- CERRADO
- Una revisión que no finaliza lo deja abierto.
- Lo cierran FINALIZAR, el fin del vínculo o el cierre de la cuenta. No se reabre.
- El consentimiento
- VIGENTE
- REVOCADO
- Lo decide siempre el asesorado.
- Revocar corta hacia adelante; puede volver a otorgarlo.

> **Notas del orador.** Las piezas importantes tienen máquinas de estados, y las transiciones están en tablas del dominio que el servicio consulta antes de escribir y la base refuerza. Dos ejemplos. El proceso de seguimiento se abre al activar un plan; cada revisión que no finaliza lo deja abierto, y lo cierran una revisión que finaliza, el fin del vínculo o el cierre de la cuenta; cerrado, no se reabre. El consentimiento lo decide siempre el asesorado: lo otorga, lo revoca y lo puede volver a otorgar, y la revocación corta hacia adelante. Las cinco máquinas reales, con sus tablas, están en el anexo E.

## Cómo se sabe que funciona y qué falta.

### 12 · Cómo se sabe que funciona

- 59 casos de prueba diseñados
- 42 pasan en la CI
- 9 pasan en parte
- 8 no ejecutables con lo entregado
- CI en verde, versión 0fb1bff
- 832 pruebas de dominio, 823 de integración con PostgreSQL y 12 recorridos de navegador
- Verificado en test el 20/10
- Sesión: Chrome 15 de 15 y Edge 13 de 13. Borradores 11 de 11. Recetas 16 de 16.

> **Notas del orador.** ¿Cómo sé que funciona? De los cincuenta y nueve casos de prueba diseñados en el legajo, cuarenta y dos pasan en la integración continua, nueve pasan en parte y ocho no se pueden ejecutar con lo que se entrega, y cada uno tiene su motivo en el apartado 5. La CI de la versión que presento corre ochocientas treinta y dos pruebas de dominio, ochocientas veintitrés de integración contra PostgreSQL y doce recorridos de navegador, todo en verde. Y además verifiqué en el ambiente de prueba, hoy, la sesión que sobrevive a la recarga, los borradores y las recetas. La trazabilidad de requisito a prueba es el anexo F.

### 13 · Lo que falta, dicho sin vueltas

- Falta probar
- La candidata 0.17.0 entera, en el teléfono
- Un aviso push recibido en un teléfono real
- TalkBack, Safari y Firefox
- Pendiente o fuera de alcance
- Sustituir un ejercicio en la sesión: regresión de la candidata; el arreglo está en borrador
- Verificar profesionales y el administrador: fuera de esta entrega
- Datos reales: después de las condiciones del legajo
- Por eso la candidata todavía no pasó a estable: la estable es la 0.13.2.

> **Notas del orador.** Prefiero decir lo que falta antes de que me lo pregunten. Falta probar la candidata entera en el teléfono, un aviso push recibido en un teléfono real, y la accesibilidad con TalkBack y los navegadores Safari y Firefox. Hay una regresión conocida: la candidata no ofrece sustituir un ejercicio durante la sesión, que la 0.13.2 sí ofrecía; el arreglo está en un pull request en borrador. La verificación de profesionales y el administrador quedaron fuera de esta entrega por decisión de Dirección, y BE no procesa datos reales hasta cumplir las condiciones del documento 08. Todo esto está en el anexo K con su severidad.

## Método, lo que sigue y preguntas.

### 14 · Cómo se trabajó

- Legajo
- la fuente de verdad
- Paquete
- un objetivo corto
- Pull request
- con la CI en verde
- Decisión
- registrada, con opciones
- 852 commits
- y 191 pull requests, del 16/9 al 20/10
- IA, declarada
- bajo dirección humana: 639 commits con coautoría

> **Notas del orador.** El método fue simple y estricto. El legajo es la fuente de verdad. Cada avance es un paquete de trabajo corto, que termina en un pull request con la integración continua en verde. Y cada vez que lo que dice el legajo no se podía o no convenía hacer tal cual, quedó una decisión registrada, con las opciones y lo que se eligió. En números: ochocientos cincuenta y dos commits y ciento noventa y un pull requests entre el 16 de septiembre y el 20 de octubre. La implementación se hizo con asistentes de IA bajo mi dirección, y está declarado: seiscientos treinta y nueve commits llevan su coautoría. Roles en el apartado 2.

### 15 · Lo que sigue

- 1
- Probar la candidata en el teléfono y pasarla a estable
- 2
- Recuperar la sustitución de ejercicios en la sesión
- 3
- Verificación de profesionales y el rol de administración
- 4
- Las condiciones para datos reales: doble factor, respaldo probado, producción separada

> **Notas del orador.** Lo que sigue, en orden. Primero, probar la candidata entera en el teléfono, con un aviso push real, y recién ahí pasarla a estable. Segundo, integrar la recuperación de la sustitución de ejercicios, que ya está en un pull request en borrador. Tercero, la verificación de profesionales y el rol de administración que prevé el legajo. Y cuarto, las condiciones que el documento 08 pone antes de tratar datos reales: doble factor, textos legales, respaldo con restauración probada y un ambiente de producción separado, entre otras.

### 16 · Preguntas

- Gracias
- Cada respuesta tiene su respaldo en la tesis: los apartados 1 a 14 y los anexos A a L.

> **Notas del orador.** Gracias por su atención. Quedo a disposición para las preguntas. Para cada una tengo el respaldo en la tesis: la sección, el archivo de código o la decisión registrada que la sostiene; las preguntas más probables y sus respuestas están en defensa/PREGUNTAS.md.
