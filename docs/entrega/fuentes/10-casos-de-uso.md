# 10 · Casos de uso

*Qué hace cada actor con BE, de punta a punta: los casos de uso, sus diagramas y cómo se relacionan.*

> BE ubica, no califica: muestra qué se indicó, qué pasó y qué cambió, y la decisión queda en manos del profesional.

**Autor:** Elián Bufi  
**Carrera:** Analista de Sistemas, Escuela Da Vinci  
**Fecha:** Noviembre de 2026

> **Resumen.** Un caso de uso cuenta algo que alguien logra con BE, de punta a punta. Son 57, y juntos cuentan el circuito que une a la persona con sus profesionales, la historia que deja en el tiempo y su continuidad cuando cambia de profesional.

**Entregable:** 10 · Casos de uso  
**Fecha:** Noviembre de 2026  
**Lo acompaña:** Los requisitos de cada caso están en los entregables 12 y 13, y sus pruebas en el 11.

# Resumen

*Lo que cada persona logra con BE, de punta a punta.*

Un caso de uso cuenta algo que alguien quiere lograr con BE: quién lo empieza, qué pasos sigue y qué obtiene. Este documento reúne los 57 casos del sistema, con sus diagramas y sus relaciones, y con los mismos identificadores que la especificación, los requisitos y las pruebas.

Juntos cuentan un circuito. El profesional invita; la persona acepta y autoriza su área; el profesional evalúa, arma y activa un plan; la persona registra desde su teléfono lo que hizo; y el profesional revisa y decide cómo sigue. Cada paso queda en la historia de la persona, en el orden en que pasó y en todas sus áreas: Nutrición, Entrenamiento y Antropometría.

Sobre esa historia trabajan los casos de seguimiento y análisis. Los gráficos ponen las áreas sobre un mismo eje del tiempo, alineadas o superpuestas, para ver cómo cada cambio del plan fue afectando a la persona y encontrar patrones, sin afirmar causas. Y si la persona cambia de profesional, dos casos le dan continuidad: ella autoriza al nuevo a ver su historia anterior en esa área, y él la consulta en solo lectura.

> **La idea clave.** Cada caso de uso deja su rastro en la historia de la persona: **lo indicado, lo que pasó y lo que se decidió**, en el tiempo y con su permiso.

![Figura 1: El mapa de los 57 casos, por módulo. El color dice quién inicia cada uno](pendiente)

> **Texto de la figura:**
> - Acceso y cuenta7 casos
> - **P25**Registrar la cuenta y el perfil propio**P26**Iniciar y cerrar la sesión**P27**Pedir los propios datos y cerrar la cuenta**P28**Avisar un problema y gestionarlo**E05**Entrar con Google**E06**Administrar los métodos de acceso**E09**Recuperar el acceso
> - Profesionales y Administración5 casos
> - **P01**Incorporar a un profesional**P02**Resolver la verificación de un área**P03**Suspender o rehabilitar a un profesional**P29**Conceder o retirar la habilitación de un área**P36**Revisar los alimentos cargados a mano y las propuestas al Recetario
> - Vínculo y permisos5 casos
> - **P04**Invitar a una persona o pedirle un vínculo**P05**Aceptar o rechazar un vínculo**P06**Consultar, pausar o finalizar un vínculo**P07**Dar y consultar los permisos**P08**Retirar el permiso
> - Nutrición6 casos
> - **P09**Registrar la evaluación y el objetivo nutricional**P10**Diseñar el plan nutricional**P11**Validar y activar el plan nutricional**P12**Ver y registrar lo que comió**P13**Revisar lo registrado y decidir cómo sigue**E10**Calcular el objetivo con una toma
> - Entrenamiento7 casos
> - **P14**Registrar la evaluación y el objetivo de entrenamiento**P15**Diseñar el plan de entrenamiento**P16**Validar y activar el plan de entrenamiento**P17**Ver y registrar la sesión**E02**Corregir lo registrado**P18**Revisar lo registrado y decidir cómo sigue**P37**Preparar una plantilla de entrenamiento
> - Antropometría3 casos
> - **P19**Registrar una toma**P20**Ver la evolución antropométrica**E03**Corregir o anular una medición
> - Seguimiento y análisis4 casos
> - **P23**Ver la cartera y las revisiones pendientes**P24**Ver la ficha, la línea de tiempo y los gráficos**E07**Dejar una nota de coordinación**P31**Ver mi evolución
> - La historia anterior2 casos
> - **P34**Autorizar la historia anterior de un área**P35**Consultar la historia anterior de un área
> - Información, novedades y avisos5 casos
> - **P32**Pedir información a la persona**P33**Completar la información pedida**P30**Ver novedades**E08**Recibir un aviso en el teléfono**E11**Vincular formularios a la evaluación
> - Casos compartidos y proceso interno13 casos
> - **I02**Evaluar la autorización**I03**Auditar y conservar la historia**I04**Validar y versionar un plan**I05**Registrar una revisión válida**I06**Aplicar la continuidad o el cierre**I07**Importar con revisión**I08**Seguir con el respaldo manual**I09**Calcular resultados antropométricos**I10**Verificar que el profesional puede operar el área**I11**Encauzar por el canal previsto**I12**Registrar una corrección trazable**I13**Ejecutar y adoptar un cálculo profesional**S01**Calcular la TVCC-30
> - La inicia la personaLa inicia el profesionalLa persona o el profesionalAdministraciónAdentro de BE

# 1. Cómo leer este documento

*Cuatro tipos de caso, una ficha que siempre tiene la misma forma y una notación para los diagramas.*

## 1.1 Cuatro tipos de caso

**Tabla 1.** Los tipos de caso de uso y cuántos hay de cada uno.

| Tipo | Casos | Qué es |
| --- | --- | --- |
| Principal (UC-P) | 35 | Un objetivo completo de un actor: activar un plan, registrar una sesión, revisar. |
| Extensión (UC-E) | 9 | Un comportamiento que se suma a un caso base en un punto y solo con una condición: entrar con Google extiende iniciar la sesión, si se elige Google. |
| Compartido (UC-I) | 12 | Un paso que varios casos necesitan en el mismo punto, adentro de BE. Unos se usan siempre («include»), como evaluar la autorización; otros, solo con una condición («extend»), como importar un alimento que no está en el catálogo. |
| Soporte (UC-S) | 1 | Un proceso interno, sin pantalla: el cálculo de la TVCC-30. |

Los identificadores siguen la numeración de la especificación del proyecto y son los mismos en toda la entrega (requisitos, casos de uso y pruebas), así que la numeración tiene saltos.

## 1.2 La anatomía de una ficha

Cada caso tiene una ficha breve, siempre con la misma forma. Esta es la de UC-P13, el caso en el que el profesional de Nutrición cierra un período con una revisión.

![Figura 2: Las partes de una ficha, sobre el caso UC-P13](pendiente)

> **Texto de la figura:**
> - UC-P13 · PRINCIPAL
> - Revisar lo registrado y decidir cómo sigue
> - 1. **Quién**Profesional de Nutrición · Website2
> - **Objetivo**Cerrar un período con una revisión válida y una próxima acción.
> - **Recorrido**1. Toca «Preparar la revisión de Nutrición» cuando la revisión acordada se acerca 2. Mira el período: lo indicado y lo registrado día por día, la energía y los macronutrientes sobre el mismo eje, con el objetivo de cada período de fondo 3. Marca la evidencia, escribe lo que observó y elige uno de los seis resultados, con su fundamento y la próxima acción 4. Toca «Registrar revisión» y, en el momento o después, aplica lo decidido3
> - **Resultado**Una revisión válida en la línea de tiempo. Al aplicarla, deja de figurar como pendiente.
> - **Para qué**Cada decisión queda escrita con su fundamento: se puede reconstruir por qué se cambió el plan y ver qué pasó después.4
> - **Relaciones**Incluye UC-I02, UC-I03 y UC-I05. Lo extiende UC-I06.5
> - **Requisitos**RF-021, RF-034, RF-035, RF-055, RF-0566
> - 1**Identificador y tipo.** El identificador es el mismo en toda la entrega. La letra dice el tipo: P principal, E extensión, I compartido y S soporte. El color del borde dice quién lo inicia.
> - 2**Quién y dónde.** El actor que lo inicia y el canal: la app, el website o adentro de BE.
> - 3**El recorrido,** en pasos cortos. Los tres casos centrales tienen además su versión completa, con condiciones, alternativas y errores.
> - 4**Para qué:** lo que le aporta a la persona o al profesional, cuando no es evidente.
> - 5**Las relaciones:** lo que incluye siempre y lo que lo extiende con una condición.
> - 6**Los requisitos que cubre,** para seguirlo en los entregables 12 y 13.

## 1.3 La notación de los diagramas

Los diagramas siguen la notación de casos de uso de UML. BE es la frontera: los actores quedan afuera y todo lo que hace el sistema, también lo que pasa sin pantalla, queda adentro. Evaluar la autorización (UC-I02) y auditar (UC-I03) los incluye casi todo caso, así que no se dibujan en cada diagrama para no tapar lo importante: figuran en cada ficha y en la Tabla 4.

![Figura 3: Los elementos de los diagramas](pendiente)

> **Texto de la figura:**
> - Actor
> - Quien inicia el caso. Va afuera de la frontera de BE.
> - La frontera del sistema
> - Todo lo que hace BE va adentro, incluso lo que pasa sin pantalla.
> - Caso de uso
> - Celeste si es una extensión; verde agua si es compartido.
> - Asociación
> - Une al actor con el caso que inicia. No lleva flecha.
> - «include» y «extend»
> - El «include» sale del caso base; el «extend», de la extensión.
> - Servicio externo
> - Un actor secundario: BE lo usa, pero no lo controla.

# 2. Quién hace qué

*Tres actores con pantalla, los servicios externos que BE usa y lo que pasa adentro del sistema.*

> **La idea clave.** Cada actor tiene su canal: la persona, la app; el profesional y Administración, el website. **Administración no ve datos de salud.**

### Los actores

**Tabla 2.** Los actores de BE.

| Actor | Quién es | Canal |
| --- | --- | --- |
| Persona | Quien recibe el acompañamiento y es titular de sus datos. Sigue su plan, registra lo que hace, ve su evolución y decide quién ve qué. | App Android; en el website, su cuenta |
| Profesional | Acompaña a la persona en Nutrición, Entrenamiento o Antropometría. Evalúa, planifica, revisa, compara en el tiempo y se coordina con los otros profesionales de la persona. | Website |
| Administración | Incorpora a los profesionales con la matrícula verificada fuera de BE y decide sobre cada área, siempre con un fundamento registrado. Atiende los problemas que se avisan y los pedidos sobre los datos. Cuida los alimentos cargados a mano y el Recetario de BE. | Website, con segundo factor |
| Servicios externos | Actores secundarios: Google para entrar, Open Food Facts y wger para importar alimentos y ejercicios, y el servicio de avisos al teléfono. Si alguno falla, lo esencial sigue. | Fuera de BE |

## 2.1 La persona

Inicia 20 casos, casi todos desde la app. Su recorrido es corto a propósito: aceptar, autorizar, ver qué le toca, registrar y ver su evolución.

![Figura 4: Los casos que inicia la persona](pendiente)

> **Texto de la figura:**
> - Persona
> - App Android
> - Acceso y cuenta
> - **P25**Registrar la cuenta y el perfil propio**P26**Iniciar y cerrar la sesión**P27**Pedir los propios datos y cerrar la cuenta**P28**Avisar un problema y gestionarlo**E05**Entrar con Google**E06**Administrar los métodos de acceso**E09**Recuperar el acceso
> - Vínculo y permisos
> - **P05**Aceptar o rechazar un vínculo**P06**Consultar, pausar o finalizar un vínculo**P07**Dar y consultar los permisos**P08**Retirar el permiso
> - Nutrición
> - **P12**Ver y registrar lo que comió
> - Entrenamiento
> - **P17**Ver y registrar la sesión**E02**Corregir lo registrado
> - Antropometría
> - **P20**Ver la evolución antropométrica
> - Seguimiento y análisis
> - **P31**Ver mi evolución
> - La historia anterior
> - **P34**Autorizar la historia anterior de un área
> - Información, novedades y avisos
> - **P33**Completar la información pedida**P30**Ver novedades**E08**Recibir un aviso en el teléfono

## 2.2 El profesional

Es el actor con más casos: 29. Trabaja en el website y repite el mismo circuito en cada área (evaluar, diseñar, activar y revisar), con la historia de la persona a la vista mientras decide.

![Figura 5: Los casos que inicia el profesional](pendiente)

> **Texto de la figura:**
> - Profesional
> - Website
> - Acceso y cuenta
> - **P25**Registrar la cuenta y el perfil propio**P26**Iniciar y cerrar la sesión**P27**Pedir los propios datos y cerrar la cuenta**P28**Avisar un problema y gestionarlo**E05**Entrar con Google**E06**Administrar los métodos de acceso**E09**Recuperar el acceso
> - Vínculo y permisos
> - **P04**Invitar a una persona o pedirle un vínculo**P06**Consultar, pausar o finalizar un vínculo
> - Nutrición
> - **P09**Registrar la evaluación y el objetivo nutricional**P10**Diseñar el plan nutricional**P11**Validar y activar el plan nutricional**P13**Revisar lo registrado y decidir cómo sigue**E10**Calcular el objetivo con una toma
> - Entrenamiento
> - **P14**Registrar la evaluación y el objetivo de entrenamiento**P15**Diseñar el plan de entrenamiento**P16**Validar y activar el plan de entrenamiento**P18**Revisar lo registrado y decidir cómo sigue**P37**Preparar una plantilla de entrenamiento
> - Antropometría
> - **P19**Registrar una toma**P20**Ver la evolución antropométrica**E03**Corregir o anular una medición
> - Seguimiento y análisis
> - **P23**Ver la cartera y las revisiones pendientes**P24**Ver la ficha, la línea de tiempo y los gráficos**E07**Dejar una nota de coordinación
> - La historia anterior
> - **P35**Consultar la historia anterior de un área
> - Información, novedades y avisos
> - **P32**Pedir información a la persona**P30**Ver novedades**E11**Vincular formularios a la evaluación

## 2.3 Administración

Participa en 9 casos, y en ninguno ve datos de salud. Decide quién opera en BE y en qué área, deja escrito por qué y atiende lo que se le pide.

![Figura 6: Los casos en los que participa Administración](pendiente)

> **Texto de la figura:**
> - Administración
> - Website, con segundo factor
> - Acceso y cuenta
> - **P26**Iniciar y cerrar la sesión**P27**Pedir los propios datos y cerrar la cuenta**P28**Avisar un problema y gestionarlo**E09**Recuperar el acceso
> - Profesionales y Administración
> - **P01**Incorporar a un profesional**P02**Resolver la verificación de un área**P03**Suspender o rehabilitar a un profesional**P29**Conceder o retirar la habilitación de un área**P36**Revisar los alimentos cargados a mano y las propuestas al Recetario

## 2.4 Lo que pasa adentro de BE

BE no es un actor: es la frontera de los diagramas. Lo que hace por su cuenta (decidir quién puede qué, auditar, validar una versión, calcular) son los casos compartidos, que viven adentro de esa frontera y se disparan desde los casos de los actores. Hay dos cosas que no empiezan con un actor, y se explican aparte:

- **El disparador programado de los recordatorios.** Tres veces por día (a las 10, a las 15 y a las 22, hora de Argentina) una tarea programada de la plataforma llama a una operación interna de BE. BE decide qué recordar según la hora: a la mañana, la sesión prevista para hoy o una que quedó sin registrar en los dos días anteriores; a la tarde y a la noche, que ese día todavía no registró ninguna comida; a la noche, la sesión del día sin registrar. Solo le llega a quien encendió los recordatorios y tiene un plan vigente en esa área, y repetir la corrida no duplica nada. Cada recordatorio es una novedad (UC-P30) y, si la persona activó los avisos, también un aviso en el teléfono (UC-E08). Es un evento de tiempo, no un actor: por eso no aparece como figura en los diagramas.
- **El cálculo de la TVCC-30 (UC-S01).** Lo pide quien opera el servicio, con un comando interno, sin pantalla. Mide cuántos ciclos de seguimiento se cierran a tiempo con una revisión válida y aplicada, y guarda el resultado para que se pueda repetir.

# 3. El circuito de punta a punta

*Ocho casos, en orden, cuentan la historia de un área; dos más le dan continuidad cuando la persona cambia de profesional.*

1. **Invita** (Profesional): UC-P04. Un enlace, un código o un QR de un solo uso.
2. **Acepta** (Persona): UC-P05. Ve quién la invita, para qué área y con qué finalidad.
3. **Da el permiso** (Persona): UC-P07. Por área y finalidad, con versión. Lo puede retirar (UC-P08).
4. **Evalúa y fija el objetivo** (Profesional): UC-P09 y UC-P14. Con un método de cálculo si hace falta.
5. **Arma el plan** (Profesional): UC-P10 y UC-P15. Un borrador que se guarda solo, con la historia a la vista.
6. **Revisa y activa** (Profesional): UC-P11 y UC-P16. Una versión que no cambia.
7. **Registra** (Persona): UC-P12 y UC-P17. Lo que comió o entrenó, aparte del plan.
8. **Compara y decide** (Profesional): UC-P24, UC-P13 y UC-P18. Una revisión válida y la próxima acción.

*Figura 7: El circuito de BE, contado con sus casos de uso.*

En cada paso que toca datos protegidos, BE decide en el servidor si se permite (UC-I02) y deja registro (UC-I03). Ningún botón oculto reemplaza esa decisión: un pedido directo a la API recibe la misma respuesta que la pantalla.

> **Lo que este circuito no es.** Abrir el tablero no es revisar: la revisión es válida solo si tiene evidencia, interpretación, resultado, fundamento y próxima acción (UC-I05). Y lo que la persona registra nunca reemplaza lo que indicó el profesional: se guarda aparte y no se sobrescribe.

### La continuidad

Cuando la persona cambia de profesional, el circuito no vuelve a empezar de cero.

1. **Termina con un profesional** (Persona): UC-P06. Su historia queda: la sigue viendo y la puede descargar.
2. **Autoriza la historia anterior** (Persona): UC-P34. Al profesional nuevo de esa área, cuando quiere, y la puede retirar.
3. **La consulta** (Profesional): UC-P35. En solo lectura, marcada como de otro profesional, sin sus notas privadas.

*Figura 8: La historia anterior: la persona autoriza y el profesional nuevo consulta.*

## 3.1 Las extensiones

Una extensión agrega un comportamiento a un caso base en un punto, y solo cuando se da una condición. Por eso cada una dice dónde se engancha y qué la dispara. Son 21 relaciones «extend»: las de las 9 extensiones, la de la historia anterior y las de los casos compartidos que se usan solo a veces.

**Tabla 3.** Cada «extend», con su punto de extensión y su condición.

| Extensión | Extiende a | Punto de extensión | Condición |
| --- | --- | --- | --- |
| UC-E05 · Entrar con Google | UC-P25 · Registrar la cuenta y el perfil propio | Elegir cómo crear la cuenta | Si elige «Continuar con Google» para crear la cuenta |
| UC-E05 · Entrar con Google | UC-P26 · Iniciar y cerrar la sesión | Elegir cómo entrar | Si elige «Continuar con Google» para entrar |
| UC-E06 · Administrar los métodos de acceso | UC-P26 · Iniciar y cerrar la sesión | Sesión abierta | Si abre «Cómo entrás» en su cuenta, con la sesión abierta |
| UC-E09 · Recuperar el acceso | UC-P26 · Iniciar y cerrar la sesión | Ingresar la contraseña | Si olvidó la contraseña y toca «¿Olvidaste tu contraseña?» |
| UC-P34 · Autorizar la historia anterior de un área | UC-P05 · Aceptar o rechazar un vínculo | Después de aceptar | Si acepta a un profesional en un área en la que ya tuvo otro: la historia anterior viene marcada en la pantalla única de compartir |
| UC-I13 · Ejecutar y adoptar un cálculo profesional | UC-P09 · Registrar la evaluación y el objetivo nutricional | Registrar la evaluación | Si el profesional elige ejecutar un método de cálculo |
| UC-E10 · Calcular el objetivo con una toma | UC-P09 · Registrar la evaluación y el objetivo nutricional | Definir el objetivo | Si el profesional toca «Calcular» |
| UC-E11 · Vincular formularios a la evaluación | UC-P09 · Registrar la evaluación y el objetivo nutricional | Registrar la evaluación | Si la persona respondió formularios o falta lo que contó |
| UC-I07 · Importar con revisión | UC-P10 · Diseñar el plan nutricional | Agregar un alimento | Si el alimento no está en el catálogo propio y lo busca afuera |
| UC-I08 · Seguir con el respaldo manual | UC-P10 · Diseñar el plan nutricional | Agregar un alimento | Si el catálogo externo no responde |
| UC-I06 · Aplicar la continuidad o el cierre | UC-P13 · Revisar lo registrado y decidir cómo sigue | Revisión registrada | Si el profesional aplica lo decidido, en el momento o después |
| UC-I13 · Ejecutar y adoptar un cálculo profesional | UC-P14 · Registrar la evaluación y el objetivo de entrenamiento | Registrar la evaluación | Si el profesional elige ejecutar un método de cálculo |
| UC-E11 · Vincular formularios a la evaluación | UC-P14 · Registrar la evaluación y el objetivo de entrenamiento | Registrar la evaluación | Si la persona respondió formularios o falta lo que contó |
| UC-I07 · Importar con revisión | UC-P15 · Diseñar el plan de entrenamiento | Agregar un ejercicio | Si el ejercicio no está en el catálogo propio y lo busca afuera |
| UC-I08 · Seguir con el respaldo manual | UC-P15 · Diseñar el plan de entrenamiento | Agregar un ejercicio | Si el catálogo externo no responde |
| UC-E02 · Corregir lo registrado | UC-P17 · Ver y registrar la sesión | Sesión registrada | Si la persona encuentra un error en una sesión ya registrada |
| UC-I06 · Aplicar la continuidad o el cierre | UC-P18 · Revisar lo registrado y decidir cómo sigue | Revisión registrada | Si el profesional aplica lo decidido, en el momento o después |
| UC-E03 · Corregir o anular una medición | UC-P19 · Registrar una toma | Toma registrada | Si el profesional encuentra un error en una medición registrada |
| UC-E03 · Corregir o anular una medición | UC-P20 · Ver la evolución antropométrica | Ver una toma | Si el profesional encuentra un error en una medición registrada |
| UC-E07 · Dejar una nota de coordinación | UC-P24 · Ver la ficha, la línea de tiempo y los gráficos | Ficha abierta | Si el profesional quiere darles contexto a los otros profesionales de la persona |
| UC-E08 · Recibir un aviso en el teléfono | UC-P30 · Ver novedades | Llega una novedad | Si la persona activó los avisos en ese teléfono |

## 3.2 Los casos compartidos

Un caso compartido es un paso que BE ejecuta adentro, sin pantalla propia. Cuando el caso base lo necesita siempre, es un «include»; cuando lo usa solo con una condición, el caso compartido lo extiende.

**Tabla 4.** Los casos compartidos, quién los usa siempre y quién solo con una condición.

| Caso compartido | Qué hace | Lo usan siempre («include») | Lo usan con una condición («extend») |
| --- | --- | --- | --- |
| UC-I02 · Evaluar la autorización | Decidir si una operación sobre datos protegidos se permite. | Todo caso que toca datos protegidos | — |
| UC-I03 · Auditar y conservar la historia | Dejar registro de cada operación sensible sin borrar lo anterior. | Todo caso que toca datos protegidos | — |
| UC-I04 · Validar y versionar un plan | Convertir un borrador válido en una versión que no cambia. | UC-P11 y UC-P16 | — |
| UC-I05 · Registrar una revisión válida | Exigir que la revisión tenga todo lo que la hace válida. | UC-P13 y UC-P18 | — |
| UC-I06 · Aplicar la continuidad o el cierre | Llevar a cabo lo que decidió la revisión. | — | UC-P13 y UC-P18 |
| UC-I07 · Importar con revisión | Traer un alimento o un ejercicio de un catálogo externo y revisarlo antes de usarlo. | — | UC-P10 y UC-P15 |
| UC-I08 · Seguir con el respaldo manual | No frenar el trabajo si un catálogo externo falla. | — | UC-P10 y UC-P15 |
| UC-I09 · Calcular resultados antropométricos | Calcular los derivados de una toma con método y versión. | UC-P19 y UC-E03 | — |
| UC-I10 · Verificar que el profesional puede operar el área | Comprobar, antes de iniciar un proceso, que el profesional puede trabajar en esa área. | UC-P11, UC-P16 y UC-P19 | — |
| UC-I11 · Encauzar por el canal previsto | Llevar a cada actor a su canal. | UC-P25 y UC-P26 | — |
| UC-I12 · Registrar una corrección trazable | Guardar una corrección sin perder el original. | UC-E02 y UC-E03 | — |
| UC-I13 · Ejecutar y adoptar un cálculo profesional | Ejecutar un método con versión y que el profesional decida si adopta el resultado. | UC-I09 | UC-P09 y UC-P14 |

# 4. Tres casos, completos

*Activar un plan, registrar lo que hizo la persona y registrar una revisión: los tres momentos que sostienen el circuito, con su disparador, sus condiciones, su flujo, sus alternativas y sus errores.*

> **La idea clave.** Los tres comparten una regla: **o pasa todo, o no pasa nada.** Un reintento nunca duplica, y lo que alguien no puede ver responde igual que lo que no existe.

## 4.1 UC-P11 · Validar y activar el plan nutricional

Es el momento en que lo indicado queda escrito. Desde ahí, todo lo que la persona registre se lee contra esta versión, y la que estaba vigente queda en el historial, unida a lo que pasó mientras rigió. Entrenamiento (UC-P16) sigue el mismo recorrido.

| Elemento | Detalle |
| --- | --- |
| Actor principal | Profesional de Nutrición, en el website. |
| Actores secundarios | La persona, que recibe la novedad y ve la versión en su app. El servicio de avisos, si ella activó los avisos. |
| Disparador | El profesional toca «Revisar y activar…» en la barra del editor del plan. |
| Precondiciones | · El profesional entró y puede operar Nutrición: el área está verificada y habilitada (UC-I10).<br>· La persona aceptó el vínculo de Nutrición, autorizó el tratamiento de sus datos de salud y dio el permiso del área (UC-I02).<br>· Hay un borrador del plan guardado y un objetivo vigente de la persona. |
| Resultado | · La versión queda activada, con su instantánea y su huella, y ya no se puede modificar. El plan apunta a ella; la anterior queda en el historial.<br>· El seguimiento de Nutrición se abre o continúa, con la próxima revisión acordada.<br>· La persona tiene una novedad y ve en su app exactamente esa versión. |
| Si algo falla | No cambia nada: la activación es una sola transacción, y el borrador queda como estaba. |
| Relaciones | Incluye UC-I02, UC-I03, UC-I04 y UC-I10. |
| Requisitos | RF-021, RF-031, RF-066 |

**Flujo principal**

1. **Profesional**Toca «Revisar y activar…», que está siempre en el mismo lugar de la barra del editor.
2. **BE**Abre «Antes de activar la versión 4 de Nutrición» y revisa el plan: primero en la pantalla y después con la validación del servidor.
3. **BE**Muestra, en este orden, lo que impide activar, lo que queda sin completar (sin bloquear), lo que cambia frente a la versión vigente y lo que va a ver la persona. Revisar mira la forma del plan, no su calidad.
4. **Profesional**Elige cuándo la revisa, en «¿Cuándo la revisás?».
5. **Profesional**Toca «Activar la versión 4 de Nutrición».
6. **BE**Vuelve a decidir en el servidor si el profesional puede operar el área y si la persona mantiene el vínculo y el permiso.
7. **BE**Comprueba que el borrador sea el mismo que vio el profesional, y valida su estructura y el objetivo vigente (UC-I04).
8. **BE**Guarda la instantánea del plan antes de que empiece a regir, la marca como vigente y deja la anterior en el historial.
9. **BE**Abre o continúa el seguimiento, fija la próxima revisión y publica la novedad para la persona, todo en la misma transacción.
10. **BE**Muestra el resultado. El aviso al teléfono sale después de confirmar, y el profesional puede «Descargar el plan en PDF»: una hoja con la versión, desde cuándo vale y un QR para bajar la app.

**Flujos alternativos**

|   | En el paso | Qué pasa |
| --- | --- | --- |
| A1 | 3 | Algo impide activar: cada cosa tiene «Ir a corregir», y el botón principal queda apagado y dice qué falta. El profesional corrige y vuelve al paso 2. |
| A2 | 3 | Hay cambios sin guardar: el cuadro avisa que se activa lo guardado. El profesional guarda y vuelve al paso 2. |
| A3 | 5 | Un doble clic, o una respuesta que no llega: el reintento lleva la misma clave de idempotencia, y BE devuelve el resultado original sin activar dos veces. |
| A4 | 9 | Es la primera versión: no hay una anterior, y el seguimiento de Nutrición se abre. |

**Errores**

|   | Situación | Qué hace BE |
| --- | --- | --- |
| E1 | El borrador cambió en otra pestaña o en otro equipo, o cambió la versión vigente de la que partió. | No activa. El cuadro pide cargar la versión guardada. |
| E2 | La versión ya estaba activada. | No la activa otra vez. Para cambiarla, se crea una versión nueva a partir de ella. |
| E3 | La persona tiene un plan de Nutrición vigente con otro profesional. | No activa: en cada área rige un solo plan a la vez. Aquel seguimiento se cierra cuando termina su vínculo. |
| E4 | El plan o el objetivo no están listos para activar. | Devuelve cada problema anclado a su lugar en el plan, y no cambia nada. |
| E5 | La persona retiró el permiso o pausó el vínculo, o el área dejó de estar habilitada. | Responde igual que si el plan no existiera, sin revelar la causa, y no cambia nada. |

En **Entrenamiento (UC-P16)**, el botón dice «Activar la versión N de Entrenamiento», y la versión lleva las sesiones con la prescripción de cada serie. La persona la ve sesión por sesión en su app.

## 4.2 UC-P17 · Ver y registrar la sesión

Es el lado de la persona: lo que hizo de verdad, aparte de lo que indicaba el plan. Lo que registra queda unido a la versión que regía ese día, y es lo que después lee su profesional para decidir.

| Elemento | Detalle |
| --- | --- |
| Actor principal | Persona, en la app. |
| Actores secundarios | El profesional de Entrenamiento, que lee lo registrado en la ficha. |
| Disparador | La persona abre Entrenamiento y, en «Hoy», toca «Iniciar entrenamiento» en una sesión del plan. Puede llegar también desde Inicio o desde el recordatorio de la mañana. |
| Precondiciones | · Tiene la sesión abierta en la app y autorizó el tratamiento de sus datos de salud.<br>· El vínculo de Entrenamiento está vigente y dio el permiso del área.<br>· Hay un plan de Entrenamiento vigente, con esa sesión disponible ese día. |
| Resultado | · Una sesión registrada, aparte de lo planificado, que no se modifica: para cambiarla se corrige (UC-E02).<br>· Queda unida a la versión del plan que regía ese día, con los tiempos de cada serie y de cada descanso.<br>· El profesional la ve en la ficha, junto a lo que indicaba el plan. |
| Si algo falla | Lo que la persona escribió queda guardado en el teléfono hasta que se manda, y nada se registra dos veces. |
| Relaciones | Incluye UC-I02 y UC-I03. Lo extiende UC-E02. |
| Requisitos | RF-021, RF-042, RF-043, RF-044 |

**Flujo principal**

1. **Persona**Elige la sesión de hoy en «Hoy» y toca «Iniciar entrenamiento». Si hay más de una, elige ella: BE no decide.
2. **BE**Abre el borrador de esa sesión; si ya existía, devuelve el mismo.
3. **BE**Muestra un ejercicio a la vez: su imagen, «Ver técnica», «La vez pasada» (lo que registró la última vez con ese ejercicio) y la tabla de series, con lo planificado de cada una en gris.
4. **Persona**Escribe la carga, las repeticiones y el RIR, y tilda la serie. Si la tilda sin escribir, queda registrada «como el plan».
5. **BE**Arranca el descanso solo, con su barra hasta el tiempo recomendado.
6. **BE**Guarda lo registrado primero en el teléfono y después lo manda: las series y los tiempos.
7. **Persona**Repite los pasos 4 a 6 en cada serie y en cada ejercicio.
8. **Persona**Toca «Finalizar entrenamiento», ve el resumen y confirma.
9. **BE**Crea la sesión registrada, una sola por sesión del plan y por día, que desde ahí no se modifica.
10. **Persona**Si quiere, responde «¿Algo para contarle a tu profe?». La nota viaja aparte y no frena el cierre.

**Flujos alternativos**

|   | En el paso | Qué pasa |
| --- | --- | --- |
| A1 | 3 | Quiere hacer otro ejercicio: «Sustituir ejercicio» registra otro en lugar del planificado, con su marca. Necesita conexión. |
| A2 | 1 | La hizo sin la app: «Ya la hice» la registra en dos a cinco pasos cortos, sin cronómetros, desde un toque («como el plan») hasta el detalle de cada serie. |
| A3 | 1 | La hizo otro día: «Registrar otro día» abre la sesión sin cronómetros, porque el pasado no se cronometra. |
| A4 | 6 | No hay conexión: lo registrado queda guardado en el teléfono y viaja después. Salir no pierde nada. |
| A5 | 8 | La respuesta no llega: «Reintentar» lleva la misma clave de idempotencia y no duplica la sesión. |
| A6 | Después | Se equivocó: «Corregir registro» guarda una corrección con su motivo (UC-E02). El original sigue visible. |

**Errores**

|   | Situación | Qué hace BE |
| --- | --- | --- |
| E1 | No hay un plan vigente. | No abre la sesión, y la app lo dice. |
| E2 | La sesión ya está registrada, por ejemplo desde otro teléfono. | No crea otra. |
| E3 | Faltan datos para confirmar. | Dice qué completar antes de confirmar. |
| E4 | La persona retiró el permiso de Entrenamiento, o el vínculo está en pausa. | Responde igual que si la sesión no existiera, y la app retira el contenido de la pantalla. |
| E5 | El borrador cambió en otro teléfono. | No pisa lo nuevo: la app lo vuelve a leer. |
| E6 | Esa sesión ya se había empezado ese día con la versión anterior del plan. | No la mezcla con la versión nueva. |

En **Nutrición (UC-P12)**, el registro es por comida: la persona registra la opción del plan que eligió, sin más detalle, con las porciones confirmadas o con lo que comió de cada ingrediente, o registra una comida diferente con una descripción o una foto. Lo indicado nunca se registra como comido.

## 4.3 UC-P13 · Revisar lo registrado y decidir cómo sigue

Es donde la historia se convierte en una decisión. Cada revisión deja escrito qué se miró, qué se observó, qué se decidió y por qué: así se puede reconstruir, meses después, por qué se cambió el plan y qué pasó a continuación.

| Elemento | Detalle |
| --- | --- |
| Actor principal | Profesional de Nutrición, en el website. |
| Actores secundarios | La persona, que recibe la novedad y lee la decisión en «Revisiones», en su app. |
| Disparador | Se acerca o vence la revisión acordada: la cartera y la ficha la muestran, y el profesional toca «Preparar la revisión de Nutrición» (o «Nueva revisión», en Revisiones). |
| Precondiciones | · El profesional entró y puede operar Nutrición.<br>· La persona mantiene el vínculo y el permiso del área.<br>· Hay un seguimiento de Nutrición abierto: una versión del plan activada. |
| Resultado | · Una revisión válida, con su período, la evidencia marcada, la interpretación, uno de los seis resultados, el fundamento y la próxima acción.<br>· Registrarla no cambia nada por sí sola. Al aplicarla, BE crea lo que corresponde y la revisión deja de figurar como pendiente.<br>· Queda en la línea de tiempo, y la persona la ve. |
| Si algo falla | Abrir la pantalla no es revisar: nada se escribe hasta «Registrar revisión», y lo escrito no se pierde al cambiar el período. |
| Relaciones | Incluye UC-I02, UC-I03 y UC-I05. Lo extiende UC-I06. |
| Requisitos | RF-021, RF-034, RF-035, RF-055, RF-056 |

**Flujo principal**

1. **Profesional**Toca «Preparar la revisión de Nutrición».
2. **BE**Propone el período, desde la última revisión hasta hoy (hasta 92 días), y lee su contexto: el objetivo y las versiones del plan que rigieron, lo registrado, la comparación día por día entre lo indicado y lo registrado, los días sin dato y las revisiones anteriores.
3. **Profesional**Mira el período: lo indicado y lo registrado en gramos, la energía registrada de cada día con lo que se sabe de ese día y los macronutrientes en paneles alineados, con el objetivo de cada período de fondo. Nada viene marcado ni elegido.
4. **Profesional**En el paso «Lo que miraste», marca la evidencia que sostiene la revisión.
5. **Profesional**En «Lo que observaste», escribe la interpretación.
6. **Profesional**En «Lo que decidís», elige uno de los seis resultados (mantener, ajustar, sustituir, reprogramar la revisión, cambiar el objetivo o finalizar), lee su efecto y escribe el fundamento y la próxima acción. BE no sugiere un resultado.
7. **Profesional**Toca «Registrar revisión».
8. **BE**Comprueba que esté completa y que cada evidencia sea de este seguimiento (UC-I05), la registra y publica la novedad para la persona.
9. **Profesional**Toca «Aplicar continuidad», en el momento o después (UC-I06).
10. **BE**Crea lo que corresponde al resultado (el borrador sucesor, el objetivo nuevo, la próxima revisión o el cierre) y recién entonces registra el hecho. La revisión deja de figurar como pendiente.

**Flujos alternativos**

|   | En el paso | Qué pasa |
| --- | --- | --- |
| A1 | 2 | Cambia el período: lo escrito se conserva; lo marcado que quedó afuera se quita, y la pantalla lo dice. |
| A2 | 6 | Elige «reprogramar la revisión»: BE pide la fecha nueva. |
| A3 | 6 | Elige «finalizar»: el seguimiento se cierra y la historia se conserva. Finalizar no es eliminar el plan. |
| A4 | 9 | No aplica todavía: la revisión queda registrada y se aplica después, desde la lista de Revisiones o desde «De a una». |
| A5 | 7 y 9 | La respuesta no llega: el reintento lleva la misma clave de idempotencia y no registra ni aplica dos veces. |

**Errores**

|   | Situación | Qué hace BE |
| --- | --- | --- |
| E1 | Falta un componente: la evidencia, la interpretación, el fundamento, la próxima acción o la fecha de la reprogramación. | No la registra, y dice qué falta en el resumen y en su campo. |
| E2 | Una evidencia no corresponde a este seguimiento, o no hay un seguimiento de Nutrición abierto. | No la registra. |
| E3 | Al aplicar, ya estaba aplicada, o no se puede aplicar ahora (por ejemplo, porque ya hay un borrador abierto). | Lo dice y no aplica dos veces. |
| E4 | La persona retiró el permiso. | Responde igual que si no existiera, sin revelar la causa. |

En **Entrenamiento (UC-P18)**, el recorrido es el mismo, con «Preparar la revisión de Entrenamiento» y «Aplicar próxima acción»; el período se compara serie por serie y, en «Analizar», con el 1RM estimado (Epley v1). No hay un séptimo resultado: la progresión es ajustar o sustituir.

# 5. Los casos, módulo por módulo

*Diez grupos, cada uno con su diagrama y la ficha de cada caso.*

## 5.1 Acceso y cuenta

Crear la cuenta, entrar y salir, recuperar el acceso, avisar un problema, pedir los propios datos y cerrar la cuenta. La cuenta es de quien la crea y es una sola, entre con su contraseña o con Google. El profesional entra con su contraseña o con Google; Administración, que decide quién opera en BE, confirma además con un segundo factor.

![Figura 9: Casos de uso de Acceso y cuenta](pendiente)

> **UC-P25 · Registrar la cuenta y el perfil propio.** Principal · Persona o profesional · App y website
>
> **Objetivo.** Tener una cuenta propia, única e independiente de cualquier profesional.
>
> **Recorrido.**
>
> 1. Elige crear la cuenta con su correo y una contraseña, o con Google
> 2. Acepta los términos, lee la información de privacidad y declara que es mayor de edad, como tres actos separados
> 3. Escribe su nombre y apellido, el que van a ver sus profesionales
> 4. BE comprueba que el correo no tenga otra cuenta y la crea
>
> **Resultado.** Una sola cuenta. Tenerla no da ningún permiso: ver los datos de otro exige un vínculo y un consentimiento, y el tratamiento de los propios datos de salud se autoriza aparte.
>
> **Relaciones.** Incluye UC-I11 y UC-I03. Lo extiende UC-E05.
>
> **Requisitos.** RF-001, RF-006, RF-017

> **UC-P26 · Iniciar y cerrar la sesión.** Principal · Persona, profesional o Administración · App y website
>
> **Objetivo.** Entrar a BE y salir de forma segura, cada uno por su canal.
>
> **Recorrido.**
>
> 1. Ingresa su correo y su contraseña, o entra con Google
> 2. BE valida la cuenta y su estado, sin revelar qué dato falló
> 3. Administración, además, confirma con el código de su aplicación autenticadora
> 4. BE lleva a cada uno a su lugar: la persona a la app (en el website, a su cuenta), el profesional al espacio profesional y Administración a su consola
> 5. Al salir, la sesión deja de servir; también puede cerrar todas las sesiones abiertas
>
> **Resultado.** Una sesión abierta en su canal, o un rechazo neutro.
>
> **Variante.** Si alguien de Administración perdió su autenticador y sus códigos de recuperación, otro administrador lo verifica por el canal de ayuda y restablece su segundo factor; al volver a entrar, lo configura de nuevo.
>
> **Para qué.** Cada uno entra por su canal, con el límite de intentos y sesiones que vencen. La consola de Administración, que decide quién opera en BE, pide además un segundo paso.
>
> **Relaciones.** Incluye UC-I11 y UC-I03. Lo extienden UC-E05, UC-E06 y UC-E09.
>
> **Requisitos.** RF-002, RF-005, RF-006

> **UC-P27 · Pedir los propios datos y cerrar la cuenta.** Principal · Persona o profesional · App y website; Administración resuelve los pedidos
>
> **Objetivo.** Ejercer los derechos sobre los propios datos y, si quiere, cerrar la cuenta sin que la historia se borre en silencio.
>
> **Recorrido.**
>
> 1. En «Tus datos», baja una copia de sus datos o pide el acceso, la rectificación o la supresión, cada pedido con su plazo legal
> 2. Administración resuelve cada pedido y la respuesta aparece en «Tus pedidos»
> 3. Para cerrar la cuenta, elige «Cerrar mi cuenta», lee qué pasa y confirma con una entrada reciente
> 4. BE cierra todas sus sesiones, suprime su credencial y finaliza sus vínculos con un hecho registrado
>
> **Resultado.** Una copia de sus datos, un pedido resuelto o una cuenta que no abre sesiones nuevas. Se conserva lo que la ley obliga a conservar, y nada se borra en silencio.
>
> **Para qué.** Son los derechos que la Ley 25.326 le da a la persona sobre sus datos, al alcance de un botón.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-069

> **UC-P28 · Avisar un problema y gestionarlo.** Principal · Persona o profesional · Website; Administración lo gestiona desde su consola
>
> **Objetivo.** Que quien encuentra un problema lo cuente por un canal con seguimiento, y que Administración lo atienda.
>
> **Recorrido.**
>
> 1. En su cuenta, abre «Avisar un problema»
> 2. Elige de qué se trata (el acceso, el perfil, un vínculo, un dato que no coincide o que falta, o el funcionamiento de la app o del website) y lo describe
> 3. BE lo registra abierto y sin responsable
> 4. Administración lo pasa a «en curso», queda a cargo y lo resuelve con una respuesta para quien avisó
> 5. Quien avisó ve el estado y la respuesta en su cuenta
>
> **Resultado.** Un problema con su historia, su responsable y su respuesta. No es un chat: lo urgente sigue por el canal de ayuda.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-068

> **UC-E05 · Entrar con Google.** Extensión · Persona o profesional · App y website
>
> **Objetivo.** Usar la cuenta de Google para crear la cuenta o para entrar, sin duplicarla.
>
> **Recorrido.**
>
> 1. Elige «Continuar con Google»
> 2. BE valida en el servidor la respuesta de Google: la firma, el vencimiento y que el correo esté verificado
> 3. Si esa cuenta de Google ya es un método de su cuenta, entra
> 4. Si hay una cuenta de BE con ese correo y contraseña, la vincula después de que confirme la contraseña; si no hay ninguna, le ofrece crearla
>
> **Resultado.** Entra a la misma cuenta con cualquiera de sus métodos.
>
> **Relaciones.** Extiende UC-P25 (si elige «Continuar con Google» para crear la cuenta) y UC-P26 (si elige «Continuar con Google» para entrar). Incluye UC-I03.
>
> **Requisitos.** RF-002, RF-003, RF-006

> **UC-E06 · Administrar los métodos de acceso.** Extensión · Persona o profesional · Website («Cómo entrás»)
>
> **Objetivo.** Agregar o quitar un método de acceso sin partir la cuenta.
>
> **Recorrido.**
>
> 1. En su cuenta, abre «Cómo entrás» y ve sus métodos: el correo y la contraseña y, si la tiene, su cuenta de Google
> 2. Vincula su cuenta de Google confirmando su contraseña de BE; si el correo de Google es otro, BE lo dice y vincula solo si lo confirma
> 3. O desvincula Google, con una confirmación y una entrada reciente
>
> **Resultado.** Una sola cuenta, con uno o dos métodos. Nunca queda sin un método para entrar: la contraseña no se quita.
>
> **Relaciones.** Extiende UC-P26, si abre «Cómo entrás» en su cuenta, con la sesión abierta. Incluye UC-I03.
>
> **Requisitos.** RF-002, RF-004, RF-005

> **UC-E09 · Recuperar el acceso.** Extensión · Persona o profesional · App y website; Administración, en la recuperación asistida
>
> **Objetivo.** Volver a entrar si olvidó la contraseña, sin revelar qué cuentas existen.
>
> **Recorrido.**
>
> 1. Toca «¿Olvidaste tu contraseña?» y escribe su correo
> 2. BE responde siempre igual, exista o no la cuenta
> 3. Recibe un código de un solo uso: por correo o, si BE no envía correos, de Administración, que antes la verifica por el canal de ayuda
> 4. Con el código, define una contraseña nueva, y se cierran todas sus sesiones
>
> **Resultado.** La misma cuenta, con una credencial nueva.
>
> **Relaciones.** Extiende UC-P26, si olvidó la contraseña y toca «¿Olvidaste tu contraseña?». Incluye UC-I03.
>
> **Requisitos.** RF-002, RF-005, RF-006

## 5.2 Profesionales y Administración

Quién trabaja como profesional en BE y en qué área. El profesional no se declara solo: Administración verifica su matrícula o su formación fuera de BE, lo incorpora y después decide sobre cada área, siempre con un fundamento que queda registrado. Administración no ve datos de salud.

![Figura 10: Casos de uso de Profesionales y Administración](pendiente)

> **UC-P01 · Incorporar a un profesional.** Principal · Administración · Website, con segundo factor
>
> **Objetivo.** Que una persona con su cuenta creada pase a operar como profesional, solo en las áreas verificadas.
>
> **Recorrido.**
>
> 1. La persona crea su cuenta y pide entrar como profesional por el canal de ayuda
> 2. Administración verifica su matrícula o su formación en el registro que corresponda, fuera de BE
> 3. En la consola, elige «Incorporar un profesional» y carga el correo de la cuenta, el nombre profesional, el tipo, la matrícula si es de la salud, las áreas y dónde lo verificó
> 4. BE crea el perfil profesional con la verificación y la habilitación de cada área, y registra el fundamento
>
> **Resultado.** Un profesional que entra al espacio profesional con su contraseña o con Google y opera solo sus áreas. Habilitar no es certificar una matrícula.
>
> **Relaciones.** Incluye UC-I03.
>
> **Requisitos.** RF-008, RF-015

> **UC-P02 · Resolver la verificación de un área.** Principal · Administración · Website, con segundo factor
>
> **Objetivo.** Decidir, área por área, si un profesional queda verificado.
>
> **Recorrido.**
>
> 1. Abre la ficha del profesional y el área en revisión
> 2. Elige verificarla, observarla o rechazarla, con un fundamento interno y, al observar o rechazar, un texto para el profesional
> 3. Antes de confirmar, el cuadro dice qué cambia, qué sigue igual y a quiénes se avisa
> 4. BE aplica la decisión solo a esa área, contra la versión del área que vio Administración
>
> **Resultado.** El área verificada, observada o rechazada, con autor, fecha y fundamento; el profesional recibe la novedad.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-011, RF-012, RF-015

> **UC-P03 · Suspender o rehabilitar a un profesional.** Principal · Administración · Website, con segundo factor
>
> **Objetivo.** Cortar o devolver la operación de un área, con motivo y autoría.
>
> **Recorrido.**
>
> 1. Elige el profesional y el área
> 2. Escribe el motivo y el texto para el profesional
> 3. BE suspende la operación de esa área, o la rehabilita
> 4. Avisa al profesional y a cada persona vinculada con él en esa área
>
> **Resultado.** El área suspendida o rehabilitada. Nada se borra, y los vínculos y los consentimientos no cambian.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-012, RF-014, RF-015

> **UC-P29 · Conceder o retirar la habilitación de un área.** Principal · Administración · Website, con segundo factor
>
> **Objetivo.** Decidir en qué áreas verificadas puede trabajar cada profesional.
>
> **Recorrido.**
>
> 1. Abre un área verificada de un profesional
> 2. Concede la habilitación, o la retira con su motivo
> 3. BE la registra; desde ese momento, la habilitación decide si el profesional puede iniciar procesos en esa área
>
> **Resultado.** Un profesional opera un área solo si está verificada y habilitada.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-015, RF-066

> **UC-P36 · Revisar los alimentos cargados a mano y las propuestas al Recetario.** Principal · Administración · Website, con segundo factor
>
> **Objetivo.** Que el catálogo de Nutrición tenga valores confiables, que lo que piden varios profesionales esté verificado para todos y que el Recetario de BE sume las recetas que valen para todos.
>
> **Recorrido.**
>
> 1. Abre «Alimentos» y mira las cargas a mano agrupadas por nombre parecido, con cuántos profesionales cargaron algo así
> 2. Revisa una carga en la versión que ve: la certifica con su fuente, marca su equivalente verificado o suma un alimento al catálogo verificado
> 3. En «Propuestas al Recetario de BE» mira cada receta que propuso un profesional, con su autor, la cesión de la foto y las «Parecidas»
> 4. Elige «Sumar al Recetario de BE» o «No sumarla», con un motivo opcional que ve quien la propuso
>
> **Resultado.** Cada decisión con su versión, su fuente y su autor. El buscador de quien cargó el alimento le sugiere el verificado, y una receta sumada queda para todos los profesionales de Nutrición. Administración ve quién cargó o propuso, nunca a qué persona se le indicó.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-072, RF-027, RF-060

## 5.3 Vínculo y permisos

Cómo empieza, se autoriza, cambia y termina una relación. Aceptar un vínculo no es consentir: el permiso sobre los datos de un área es un acto propio de la persona, que puede retirar cuando quiera, con efecto desde ese momento. Son datos de salud: sin ese permiso, el profesional no ve nada.

![Figura 11: Casos de uso de Vínculo y permisos](pendiente)

> **UC-P04 · Invitar a una persona o pedirle un vínculo.** Principal · Profesional · Website
>
> **Objetivo.** Proponer una relación con una persona, para un área.
>
> **Recorrido.**
>
> 1. En el espacio profesional, elige «Invitar a una persona» y el área
> 2. BE genera una invitación de un solo uso, que vence a los 7 días: un enlace, un código corto y un QR
> 3. El profesional se la comparte; si la persona ya tiene cuenta, también puede mandarle una solicitud con su identificador BE
> 4. Cuando la persona la usa, BE registra la solicitud como pendiente, sin dar acceso a nada
>
> **Resultado.** Una solicitud que dice quién pide, para qué área y con qué finalidad.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-015, RF-018, RF-021

> **UC-P05 · Aceptar o rechazar un vínculo.** Principal · Persona · App y website
>
> **Objetivo.** Responder en forma expresa a una invitación o a una solicitud.
>
> **Recorrido.**
>
> 1. Abre la invitación (el enlace, el QR o el código) o la solicitud recibida
> 2. Ve quién la invita, para qué área y con qué finalidad
> 3. Acepta o rechaza
> 4. Si acepta, sigue en una sola pantalla con lo que se propone compartir, ya marcado: el área, lo de sus otras áreas y, si ya tuvo otro profesional en esa área, la historia anterior (UC-P07 y UC-P34)
>
> **Resultado.** Un vínculo aceptado o rechazado, con su registro y una novedad para el profesional.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extiende UC-P34.
>
> **Requisitos.** RF-015, RF-019, RF-021, RF-023

> **UC-P06 · Consultar, pausar o finalizar un vínculo.** Principal · Persona o profesional · App y website
>
> **Objetivo.** Ver las propias relaciones y cambiar su estado.
>
> **Recorrido.**
>
> 1. Abre sus vínculos
> 2. Elige pausar, reanudar o finalizar un área, y el motivo
> 3. BE aplica el cambio y avisa a la otra parte
> 4. Con la pausa, el acceso del profesional se detiene desde la operación siguiente; al finalizar, se cierra el seguimiento de esa área
>
> **Resultado.** El vínculo en su estado nuevo, y la historia intacta. Quien pausó es quien reanuda.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-023, RF-024, RF-025

> **UC-P07 · Dar y consultar los permisos.** Principal · Persona · App y website
>
> **Objetivo.** Autorizar el uso de sus datos de salud y, área por área, qué ve cada profesional; y saber siempre qué autorizó.
>
> **Recorrido.**
>
> 1. Autoriza el tratamiento de sus datos de salud, como un acto separado de crear la cuenta
> 2. Al aceptar un vínculo, lee el texto del permiso de esa área y, en una sola pantalla con todo marcado, decide qué comparte: «Aceptar y compartir», «Elegir qué compartir» o «Ahora no»; BE guarda la versión, la fecha y el autor
> 3. Autoriza aparte las fotos de sus comidas para su profesional de Nutrición, y decide con quiénes comparte «Mis hábitos»
> 4. En «Quién ve qué» ve, por profesional, lo que autorizó y desde cuándo, con un interruptor por cosa: el área, lo de otras áreas y la historia anterior (UC-P34)
>
> **Resultado.** Permisos vigentes, específicos y con versión: cada profesional ve solo lo que la persona autorizó.
>
> **Para qué.** La ley de datos de salud pide un consentimiento expreso: BE lo pide por área y por finalidad, y lo deja registrado.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-015, RF-020, RF-021, RF-023

> **UC-P08 · Retirar el permiso.** Principal · Persona · App y website
>
> **Objetivo.** Cortar el acceso de un profesional a un área, desde ahora.
>
> **Recorrido.**
>
> 1. En «Quién ve qué», apaga una cosa sola que ya no quiere compartir, o elige «Revocar acceso» del área de ese profesional
> 2. Confirma
> 3. BE retira el acceso en ese momento y avisa al profesional
>
> **Resultado.** El profesional no lee ni escribe más en esa área. El vínculo no se finaliza, lo anterior se conserva y volver a autorizar es un acto nuevo.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-020, RF-021, RF-022, RF-023

## 5.4 Nutrición

El circuito completo de un área: la evaluación y el objetivo, el plan en borrador, la activación como versión, lo que la persona registra en la app y la revisión que decide cómo sigue. Cada versión queda unida a lo que se registró mientras rigió.

![Figura 12: Casos de uso de Nutrición](pendiente)

> **UC-P09 · Registrar la evaluación y el objetivo nutricional.** Principal · Profesional de Nutrición · Website
>
> **Objetivo.** Dejar la base del plan: lo evaluado y el objetivo acordado, con su vigencia.
>
> **Recorrido.**
>
> 1. Con el área vacía, en la ficha, toca «Empezar el plan»: arriba, la franja de los pasos («Evaluación › Objetivo › Plan»), con el estado de cada uno
> 2. Registra la evaluación en tres bloques: «Lo que contó» la persona, «Lo medido» y «Lo que necesita el cálculo», cada dato con su origen y su fecha; la fecha es la de ahora y se puede cambiar, y «Anotaciones» queda solo para él
> 3. Si falta lo que contó la persona, lo completa con ella en el mismo lugar (UC-E11)
> 4. Si quiere, ejecuta un método de cálculo con versión y decide si adopta el resultado, o toca «Calcular» para que BE proponga el objetivo con un método publicado (UC-E10)
> 5. Define el objetivo de energía y de macronutrientes, con su vigencia; BE dice las kcal que suman sus gramos y avisa si no coinciden
>
> **Resultado.** La evaluación y el objetivo, con autor, fecha y versión. Un objetivo nuevo no pisa al anterior: lo sucede.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extienden UC-I13, UC-E10 y UC-E11.
>
> **Requisitos.** RF-021, RF-026, RF-029, RF-070, RF-071, RF-073

> **UC-P10 · Diseñar el plan nutricional.** Principal · Profesional de Nutrición · Website
>
> **Objetivo.** Armar el plan en borrador, con el contexto a mano, antes de activarlo.
>
> **Recorrido.**
>
> 1. Crea el borrador desde la vista del plan: en blanco, copiando la versión activa o desde una plantilla
> 2. Arma los días tipo y las comidas con alimentos («Verificado» o «Tuyo»), recetas propias o del Recetario de BE y «Mis habituales», con la cantidad en gramos o en medidas caseras; mientras escribe, ve lo que aporta cada alimento, y puede copiar desde otra comida
> 3. Si quiere, fija rangos de macronutrientes para el día o para cada comida, en gramos o en gramos por kilo de peso
> 4. Mira el reparto por comida y la franja de cada comida, con el promedio de sus opciones; el panel «Contexto de…» le muestra lo de la persona sin salir del editor
> 5. Si un alimento no está, lo busca en un catálogo externo o lo carga a mano
> 6. BE guarda solo y dice si el cambio ya llegó; la pestaña «Patrones» del editor muestra lo registrado con el objetivo de cada período de fondo
>
> **Resultado.** Un borrador que la persona todavía no ve.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extienden UC-I07 y UC-I08.
>
> **Requisitos.** RF-021, RF-027, RF-028, RF-030, RF-059, RF-060

> **UC-P11 · Validar y activar el plan nutricional.** Principal · Profesional de Nutrición · Website
>
> **Objetivo.** Emitir el plan como una versión que no cambia.
>
> **Recorrido.**
>
> 1. Toca «Revisar y activar…»
> 2. Lee lo que impide activar, lo que cambia frente a la versión vigente y lo que va a ver la persona
> 3. Elige cuándo la revisa y activa
> 4. BE valida y crea la versión vigente; la anterior queda en el historial
>
> **Resultado.** La persona ve exactamente la versión activada y recibe una novedad.
>
> **Relaciones.** Incluye UC-I02, UC-I03, UC-I04 y UC-I10.
>
> **Requisitos.** RF-021, RF-031, RF-066
>
> **Completo en** «UC-P11 · Validar y activar el plan nutricional».

> **UC-P12 · Ver y registrar lo que comió.** Principal · Persona · App
>
> **Objetivo.** Saber qué le toca hoy y registrar lo que realmente comió.
>
> **Recorrido.**
>
> 1. Abre Inicio o Nutrición y ve, para cada comida, las opciones del plan vigente
> 2. Registra la opción que eligió: sin más detalle, con las porciones del plan confirmadas o con lo que comió de cada ingrediente
> 3. Si comió otra cosa, registra una comida diferente con una descripción, una foto (si la autorizó) o las dos
> 4. Si se equivocó, corrige las cantidades o anula el registro, sin borrar el original
>
> **Resultado.** Un registro aparte del plan, unido a la versión que regía ese día, que el profesional puede leer. Lo indicado nunca se registra como comido.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-032, RF-033, RF-044

> **UC-P13 · Revisar lo registrado y decidir cómo sigue.** Principal · Profesional de Nutrición · Website
>
> **Objetivo.** Cerrar un período con una revisión válida y una próxima acción.
>
> **Recorrido.**
>
> 1. Toca «Preparar la revisión de Nutrición» cuando la revisión acordada se acerca
> 2. Mira el período: lo indicado y lo registrado día por día, la energía y los macronutrientes sobre el mismo eje, con el objetivo de cada período de fondo
> 3. Marca la evidencia, escribe lo que observó y elige uno de los seis resultados, con su fundamento y la próxima acción
> 4. Toca «Registrar revisión» y, en el momento o después, aplica lo decidido
>
> **Resultado.** Una revisión válida en la línea de tiempo. Al aplicarla, deja de figurar como pendiente.
>
> **Para qué.** Cada decisión queda escrita con su fundamento: se puede reconstruir por qué se cambió el plan y ver qué pasó después.
>
> **Relaciones.** Incluye UC-I02, UC-I03 y UC-I05. Lo extiende UC-I06.
>
> **Requisitos.** RF-021, RF-034, RF-035, RF-055, RF-056

> **UC-E10 · Calcular el objetivo con una toma.** Extensión · Profesional de Nutrición · Website
>
> **Objetivo.** Proponer el objetivo con un método publicado y con los datos a la vista, sin que BE decida por el profesional.
>
> **Recorrido.**
>
> 1. En el objetivo, toca «Calcular»
> 2. Elige «Usar la toma del» día de la última toma de Antropometría que puede usar, o «Cargar a mano»
> 3. Elige el método (cada uno dice para quién sirve; «De dónde sale» y «Fuente» muestran la fórmula y la cita), el ajuste («Mantener», «Déficit» o «Superávit») y los g/kg de proteína y grasa
> 4. «Usar estos valores en el objetivo» los lleva al formulario, y el profesional decide y guarda
>
> **Resultado.** Un objetivo apoyado en una toma y en un método publicado. El servidor rehace la cuenta al guardar y la guarda con sus valores; si llega una toma más nueva, BE lo avisa sin recalcular solo.
>
> **Relaciones.** Extiende UC-P09. Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-073, RF-029, RF-070
>
> **Completo en** «UC-P13 · Revisar lo registrado y decidir cómo sigue».

## 5.5 Entrenamiento

El mismo circuito, con la prescripción serie por serie, la sesión guiada en el teléfono y la historia de cada ejercicio a la vista mientras se planifica: «La vez pasada», el historial y el 1RM estimado (Epley, versión 1).

![Figura 13: Casos de uso de Entrenamiento](pendiente)

> **UC-P14 · Registrar la evaluación y el objetivo de entrenamiento.** Principal · Profesional de Entrenamiento · Website
>
> **Objetivo.** Dejar la base de la planificación.
>
> **Recorrido.**
>
> 1. Con el área vacía, en la ficha, toca «Empezar el plan»: arriba, la franja de los pasos («Evaluación › Objetivo › Plan»)
> 2. Registra la evaluación, con la fecha de ahora (que se puede cambiar) y sus «Anotaciones» privadas; si falta lo que contó la persona, lo completa con ella en el mismo lugar (UC-E11)
> 3. Si quiere, ejecuta un método de cálculo con versión y decide si adopta el resultado
> 4. Define el objetivo, con su período
>
> **Resultado.** La evaluación y el objetivo, con autor, fecha y versión.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extienden UC-I13 y UC-E11.
>
> **Requisitos.** RF-021, RF-036, RF-064, RF-070, RF-071

> **UC-P15 · Diseñar el plan de entrenamiento.** Principal · Profesional de Entrenamiento · Website
>
> **Objetivo.** Armar fases, sesiones y la prescripción serie por serie, viendo lo que la persona ya hizo.
>
> **Recorrido.**
>
> 1. Crea el borrador en blanco o desde una plantilla, y ordena las fases y las sesiones, con sus días; dentro de una sesión puede agrupar ejercicios en un bloque «Seguido» o «En vueltas»
> 2. Busca los ejercicios en el catálogo, con su imagen y sus zonas musculares; el buscador marca «Con historial» los que ya estuvieron en sesiones registradas de la persona en el último año, con cuántas y la fecha de la última
> 3. En el cuadro de cada ejercicio ve «La vez pasada» (las últimas tres veces, serie por serie: carga, repeticiones y RIR) y su historial en paneles alineados: carga, repeticiones y RIR de la misma serie, el RIR indicado frente al registrado y, en los ejercicios con método aprobado, el 1RM estimado (Epley v1) sesión a sesión, con las versiones del plan de fondo
> 4. Elige cómo se escribe el esfuerzo: RIR o RPE
> 5. Indica las series de calentamiento y las efectivas, y de cada serie las repeticiones, la carga, el esfuerzo y el descanso, también con la escritura rápida y «Aplicar»; puede calcular la carga desde la estimación, y la confirma él
> 6. Mientras planifica, el panel «Contexto de…» le muestra lo de la persona; si un ejercicio no está, lo busca en un catálogo externo o crea uno propio
>
> **Resultado.** Un borrador completo que la persona todavía no ve.
>
> **Para qué.** La historia de cada ejercicio está donde se decide la carga: no hace falta salir del editor ni reconstruir lo que pasó.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extienden UC-I07 y UC-I08.
>
> **Requisitos.** RF-021, RF-037, RF-038, RF-039, RF-040, RF-059, RF-060

> **UC-P16 · Validar y activar el plan de entrenamiento.** Principal · Profesional de Entrenamiento · Website
>
> **Objetivo.** Emitir el plan como una versión que no cambia.
>
> **Recorrido.**
>
> 1. Toca «Revisar y activar…»
> 2. Lee lo que impide activar, lo que cambia frente a la versión vigente y lo que va a ver la persona
> 3. Elige cuándo la revisa y activa
> 4. BE valida y crea la versión vigente, sin vigencias superpuestas
>
> **Resultado.** La persona ve la versión activada, sesión por sesión y serie por serie.
>
> **Relaciones.** Incluye UC-I02, UC-I03, UC-I04 y UC-I10.
>
> **Requisitos.** RF-021, RF-041, RF-066
>
> **Completo en** «UC-P11 · Validar y activar el plan nutricional».

> **UC-P17 · Ver y registrar la sesión.** Principal · Persona · App
>
> **Objetivo.** Saber qué entrenar hoy y registrar lo que realmente hizo.
>
> **Recorrido.**
>
> 1. Abre «Hoy» y toca «Iniciar entrenamiento»
> 2. Ve un ejercicio a la vez, bajo su bloque, con «La vez pasada» y lo planificado de cada serie en gris
> 3. Registra cada serie con lo que hizo o con un toque, y responde el esfuerzo en la notación del plan (RIR o RPE); las series de calentamiento se registran y no cuentan; el descanso arranca solo
> 4. Toca «Finalizar entrenamiento» y confirma; si quiere, le deja una nota a su profe
>
> **Resultado.** Una sesión registrada aparte de lo planificado, unida a la versión que regía ese día.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extiende UC-E02.
>
> **Requisitos.** RF-021, RF-042, RF-043, RF-044
>
> **Completo en** «UC-P17 · Ver y registrar la sesión».

> **UC-E02 · Corregir lo registrado.** Extensión · Persona · App
>
> **Objetivo.** Corregir una sesión ya registrada sin ocultar el original.
>
> **Recorrido.**
>
> 1. Abre la sesión registrada y toca «Corregir registro»
> 2. Indica el valor correcto y el motivo
> 3. BE guarda la corrección como un registro nuevo que cita al original
>
> **Resultado.** El original y la corrección, visibles los dos, con autor y motivo; la prescripción no se toca.
>
> **Relaciones.** Extiende UC-P17, si la persona encuentra un error en una sesión ya registrada. Incluye UC-I02, UC-I03 y UC-I12.
>
> **Requisitos.** RF-021, RF-044

> **UC-P18 · Revisar lo registrado y decidir cómo sigue.** Principal · Profesional de Entrenamiento · Website
>
> **Objetivo.** Cerrar un período con una revisión válida y una próxima acción.
>
> **Recorrido.**
>
> 1. Toca «Preparar la revisión de Entrenamiento»
> 2. Compara lo planificado con lo registrado; en «Analizar», el 1RM estimado (Epley v1) con la serie de origen y «Cómo se calculó», y dos etapas lado a lado con todas las observaciones
> 3. Escribe lo que observó y elige el resultado: mantener, ajustar, sustituir, reprogramar la revisión, cambiar el objetivo o finalizar
> 4. Registra la revisión y aplica la próxima acción
>
> **Resultado.** Una revisión válida, unida al plan que sigue.
>
> **Relaciones.** Incluye UC-I02, UC-I03 y UC-I05. Lo extiende UC-I06.
>
> **Requisitos.** RF-021, RF-045, RF-046, RF-055, RF-056

> **UC-P37 · Preparar una plantilla de entrenamiento.** Principal · Profesional de Entrenamiento · Website
>
> **Objetivo.** Tener listos sus planes base sin elegir a una persona.
>
> **Recorrido.**
>
> 1. En «Mis plantillas», elige «Nueva plantilla» (en blanco o desde otra) o «Editar»
> 2. Arma fases, sesiones, bloques y series en el mismo editor de los planes, que se guarda solo
> 3. Toca «Revisar»
> 4. Elige «Guardar plantilla» o «Guardar nueva versión»
>
> **Resultado.** Una versión nueva de la plantilla. Los planes que salieron de las anteriores no cambian, y cada plan dice qué versión se aplicó.
>
> **Relaciones.** Incluye UC-I02, UC-I03 y UC-I04.
>
> **Requisitos.** RF-039, RF-040
>
> **Completo en** «UC-P13 · Revisar lo registrado y decidir cómo sigue».

## 5.6 Antropometría

Tomas con protocolo y cálculos que se pueden repetir, correcciones que no borran y la evolución de cada medida en el tiempo, siempre dentro del mismo protocolo, método y unidad.

![Figura 14: Casos de uso de Antropometría](pendiente)

> **UC-P19 · Registrar una toma.** Principal · Profesional de Antropometría · Website
>
> **Objetivo.** Medir con protocolo y obtener resultados que se pueden repetir.
>
> **Recorrido.**
>
> 1. Elige qué va a calcular: uno o varios métodos, o un conjunto de un toque, como «Kerr (1988), cinco componentes»
> 2. Abre la toma nueva, que se guarda como borrador mientras la completa, y carga sobre la figura solo lo que piden esos métodos, más peso, talla y edad
> 3. BE calcula los resultados derivados con su método y su versión; con Kerr, el «Peso estructurado» frente al peso medido
> 4. Registra la toma: desde ese momento es historia y no se edita
>
> **Resultado.** Las mediciones y los cálculos, separados, con método y versión.
>
> **Relaciones.** Incluye UC-I02, UC-I03, UC-I09 y UC-I10. Lo extiende UC-E03.
>
> **Requisitos.** RF-021, RF-047, RF-048, RF-066

> **UC-P20 · Ver la evolución antropométrica.** Principal · Persona o profesional autorizado · App y website
>
> **Objetivo.** Comparar las tomas en el tiempo, medida por medida.
>
> **Recorrido.**
>
> 1. El profesional abre una toma: al final, «Desde el inicio y desde la anterior» muestra cada medida con su valor, la diferencia con la primera toma y con la anterior, y los días entre fechas
> 2. En las vistas «Por sitio» y «Por método» compara dos tomas sitio por sitio, y la masa grasa según cada método sobre un eje común
> 3. La persona, en «Mi evolución», elige perímetros o pliegues y la zona del cuerpo, y ve cada medida sobre fechas reales
> 4. BE compara solo tomas del mismo protocolo, método y unidad, y dice que no tiene cargado el error de medición de quien mide
>
> **Resultado.** Una comparación sin colores ni palabras que califiquen: cada diferencia es una resta con su signo y su unidad («+1,5 kg», «−0,8 cm»), y una medida sin tomar es un hueco, no un cero.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extiende UC-E03.
>
> **Requisitos.** RF-021, RF-049, RF-054

> **UC-E03 · Corregir o anular una medición.** Extensión · Profesional de Antropometría · Website
>
> **Objetivo.** Arreglar un error sin borrar el original.
>
> **Recorrido.**
>
> 1. Elige la medición de una toma registrada
> 2. La corrige o la anula, con su motivo
> 3. BE recalcula lo que dependía de ella
>
> **Resultado.** El original sigue visible, y la corrección o la anulación queda relacionada con él.
>
> **Relaciones.** Extiende UC-P19 y UC-P20, si el profesional encuentra un error en una medición registrada. Incluye UC-I02, UC-I03, UC-I09 y UC-I12.
>
> **Requisitos.** RF-021, RF-048, RF-050

## 5.7 Seguimiento y análisis

Dónde se lee la historia: la cartera con lo que espera cada persona, la ficha con su línea de tiempo, «Analizar» y «Patrones», los gráficos que ponen las áreas que el profesional puede ver sobre un mismo eje del tiempo, y lo que la persona ve de su propia evolución. Los gráficos ubican, no califican: cada cruce entre áreas dice «Coinciden en el tiempo; esto no prueba que una cosa cause la otra».

![Figura 15: Casos de uso de Seguimiento y análisis](pendiente)

> **UC-P23 · Ver la cartera y las revisiones pendientes.** Principal · Profesional · Website
>
> **Objetivo.** Organizar el trabajo: qué persona necesita atención y por qué.
>
> **Recorrido.**
>
> 1. Abre el espacio profesional
> 2. Ve a sus personas con lo que espera cada una: la revisión acordada que vence, el borrador sin activar, lo que le toca a él
> 3. Entra a la ficha de una
>
> **Resultado.** Solo sus relaciones, con el motivo de cada pendiente. Una revisión figura pendiente solo si hay una acordada y su fecha llegó.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-052, RF-055

> **UC-P24 · Ver la ficha, la línea de tiempo y los gráficos.** Principal · Profesional autorizado · Website
>
> **Objetivo.** Entender el proceso de una persona en el tiempo y en todas las áreas que le permite ver.
>
> **Recorrido.**
>
> 1. Abre la ficha de la persona; en «Resumen» ve cada área que lleva y sus notas propias
> 2. En «Patrones», la cinta del tiempo marca arriba los cambios de plan, las tomas, las revisiones y las notas; debajo, los gráficos de su enfoque, sobre el mismo eje de fechas y con un cursor común
> 3. Con «Armá tu gráfico», en «Analizar» o en «Patrones», elige hasta tres series de sus áreas y las ve alineadas, una arriba de la otra, o superpuestas en el mismo gráfico cuando comparten el eje
> 4. Si lleva las dos áreas, con planes o tomas propios en las dos, «Ver la relación» las pone juntas (por ejemplo, los carbohidratos registrados y el 1RM estimado de esas semanas, o la energía registrada y el peso de toma a toma), con «Lo que también cambió» en ese tiempo
> 5. Guarda lo que mira como un enfoque, para esa persona o para uno de sus planes, y queda hasta que lo cambie
> 6. En «Línea de tiempo» y en «Analizar» recorre los hechos y las métricas del período, y compara dos etapas lado a lado
>
> **Resultado.** Una lectura de la historia sin calificaciones ni causas: los huecos se ven como huecos y cada cruce dice «Coinciden en el tiempo; esto no prueba que una cosa cause la otra».
>
> **Para qué.** Ver cómo cada cambio del plan fue afectando a la persona y formular hipótesis con datos y no con recuerdos. La decisión es del profesional.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extiende UC-E07.
>
> **Requisitos.** RF-021, RF-053, RF-054

> **UC-E07 · Dejar una nota de coordinación.** Extensión · Profesional · Website
>
> **Objetivo.** Darles contexto a los otros profesionales de la persona.
>
> **Recorrido.**
>
> 1. En la ficha, toca «Nota de coordinación», en «Más»
> 2. Elige para quién (todos los profesionales que hoy acompañan a la persona o uno en particular) y la finalidad
> 3. Escribe la nota, de hasta 600 caracteres
> 4. BE la registra con autor y área, y cada destinatario recibe una novedad
>
> **Resultado.** Una nota que no cambia planes ajenos ni registra revisiones, y que la persona también lee.
>
> **Relaciones.** Extiende UC-P24, si el profesional quiere darles contexto a los otros profesionales de la persona. Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-057

> **UC-P31 · Ver mi evolución.** Principal · Persona · App
>
> **Objetivo.** Entender cómo viene su proceso en sus áreas.
>
> **Recorrido.**
>
> 1. Abre «Mi evolución»
> 2. Elige perímetros o pliegues y la zona, y ve cada medida sobre fechas reales, con el cambio respecto de la toma anterior comparable
> 3. En «Tu historial» ve sus sesiones de los últimos 90 días, serie por serie, con sus correcciones
> 4. En «Revisiones» lee las decisiones de sus profesionales
>
> **Resultado.** Su evolución por área, sin diagnósticos, sin causas y sin colores que califiquen.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-054, RF-065

## 5.8 La historia anterior

Cuando la persona cambia de profesional, su historia sigue con ella. El profesional nuevo no hereda nada: con la autorización de la persona, ve lo que pasó antes en su área, en solo lectura, para entender qué le funcionó y decidir con más información.

![Figura 16: Casos de uso de la historia anterior](pendiente)

> **UC-P34 · Autorizar la historia anterior de un área.** Principal · Persona · App
>
> **Objetivo.** Que el profesional nuevo de un área vea lo que pasó antes, con otros profesionales, en esa misma área.
>
> **Recorrido.**
>
> 1. En su Perfil, «Quién ve qué», debajo del profesional de un área, encuentra «Tu historia anterior» de esa área; si acaba de aceptar a un profesional en un área en la que ya tuvo otro, BE se lo ofrece en ese momento, con «Compartir mi historia anterior» o «Ahora no»
> 2. Lee qué le muestra: en Nutrición y en Entrenamiento, las versiones de los planes que se activaron, lo que registró bajo esos planes y las decisiones de las revisiones; en Antropometría, sus tomas con su método. Las notas privadas de los otros profesionales, sus borradores y lo de otras áreas no se comparten
> 3. Toca «Compartir mi historia anterior»; BE guarda la autorización con la versión del texto que leyó. Por omisión, no se comparte
> 4. Ve cuándo la miró el profesional por última vez («Miró tu historia anterior…») y, cuando quiere, la deja de compartir: desde ese momento él no la ve, y no se borra nada
>
> **Resultado.** Una autorización vigente para ese profesional y esa área, auditada, que se puede retirar en cualquier momento.
>
> **Variante.** Si todavía no autorizó el tratamiento de sus datos de salud, BE le pide hacerlo primero, en Privacidad. Con el vínculo en pausa, el profesional no la ve aunque esté compartida.
>
> **Para qué.** La persona no empieza de cero al cambiar de profesional, y decide ella qué parte de su historia viaja.
>
> **Relaciones.** Extiende UC-P05, si acepta a un profesional en un área en la que ya tuvo otro. Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-020, RF-025

> **UC-P35 · Consultar la historia anterior de un área.** Principal · Profesional autorizado · Website
>
> **Objetivo.** Ver qué planes tuvo la persona en su área, cómo los ejecutó y qué se decidió antes de su acompañamiento, para decidir con más información.
>
> **Recorrido.**
>
> 1. En la ficha de la persona, abre «Historia anterior» desde «Más»
> 2. Lee el aviso fijo: «Lo que sigue pasó con otro profesional, antes de tu acompañamiento. Solo lectura»
> 3. Recorre, por tramos de fechas, lo que pasó antes de que él empezara a acompañarla: las versiones de los planes con su vigencia y por qué terminaron, lo registrado semana por semana, las tomas con su método y las decisiones de las revisiones (el resultado, el fundamento y la próxima acción)
> 4. Cada cosa aparece marcada «De otro profesional», sin nombrarlo; si hubo más de uno, con su orden
>
> **Resultado.** Una lectura de solo lectura, que BE registra y que la persona ve. Nunca entran los borradores ni las notas privadas de los otros profesionales, ni datos de otra área, ni lo propio de quien lee.
>
> **Variante.** Sin la autorización, la vista dice cómo pedírsela a la persona, sin mostrar ni insinuar ningún dato. Sin el vínculo, el permiso del área o el consentimiento vigentes, BE responde como si no existiera.
>
> **Para qué.** Ver qué le funcionó a la persona y en qué contexto, sin pedirle que lo cuente de memoria.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-025, RF-053

## 5.9 Información, novedades y avisos

El pedido de información con plantillas que tienen versión, los hábitos que la persona declara, el centro de novedades y los avisos al teléfono, que nunca llevan datos de salud.

![Figura 17: Casos de uso de Información, novedades y avisos](pendiente)

> **UC-P32 · Pedir información a la persona.** Principal · Profesional autorizado · Website
>
> **Objetivo.** Pedir solo lo pertinente, para una finalidad.
>
> **Recorrido.**
>
> 1. Desde la ficha, toca «Pedir información»
> 2. Elige una plantilla con versión o un formulario de inicio, y la finalidad
> 3. Si ya sabe algo, carga una propuesta para que la persona la confirme o la corrija
> 4. BE envía el pedido y la persona recibe una novedad; también puede pedirle que le comparta «Mis hábitos»
>
> **Resultado.** Un pedido con autor, finalidad y versión de la plantilla. Pedir no es acceder: la respuesta llega solo si la persona la envía.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-071

> **UC-P33 · Completar la información pedida.** Principal · Persona · App
>
> **Objetivo.** Responder un pedido y poder corregirlo después.
>
> **Recorrido.**
>
> 1. Abre el pedido en «Formularios»
> 2. Responde, o confirma o rechaza la propuesta de su profesional
> 3. Si se equivocó, rectifica, y la respuesta original queda
> 4. En «Mis hábitos» declara sus hábitos y decide con quiénes los comparte
>
> **Resultado.** Una respuesta marcada como declarada por la persona, no como una medición.
>
> **Relaciones.** Incluye UC-I02 y UC-I03.
>
> **Requisitos.** RF-021, RF-071

> **UC-E11 · Vincular formularios a la evaluación.** Extensión · Profesional de Nutrición o de Entrenamiento · Website
>
> **Objetivo.** Que la evaluación se apoye en lo que la persona contó, sin copiar sus respuestas.
>
> **Recorrido.**
>
> 1. En «Lo que contó», ve los formularios que la persona respondió y los vincula a la evaluación
> 2. Si falta algo, «Completarlo ahora con» la persona abre la carga en el mismo lugar, con «Primero lo necesario para planificar» y «Cargar también el resto» (UC-P32 y UC-P33)
> 3. Al terminar, vuelve a la evaluación con lo cargado, que la persona confirma o corrige desde la app
> 4. Si prefiere, «Enviárselo» se lo pide a la app, como «Pedir información»
>
> **Resultado.** La evaluación con sus formularios vinculados, sin copiar ninguna respuesta. Si la persona corrige algo, la evaluación lo dice.
>
> **Relaciones.** Extiende UC-P09 y UC-P14. Incluye UC-P32, UC-P33, UC-I02 y UC-I03.
>
> **Requisitos.** RF-026, RF-036, RF-071

> **UC-P30 · Ver novedades.** Principal · Persona o profesional · App y website
>
> **Objetivo.** Enterarse de lo nuevo que le corresponde.
>
> **Recorrido.**
>
> 1. Abre el centro de novedades
> 2. Ve lo nuevo: un plan activado, una revisión, una solicitud, una nota, un recordatorio
> 3. Al abrir una, queda leída
>
> **Resultado.** Las novedades de su alcance, sin datos de salud ni alertas clínicas.
>
> **Relaciones.** Incluye UC-I02 y UC-I03. Lo extiende UC-E08.
>
> **Requisitos.** RF-021, RF-061

> **UC-E08 · Recibir un aviso en el teléfono.** Extensión · Persona · App
>
> **Objetivo.** Saber que hay algo nuevo sin abrir la app.
>
> **Recorrido.**
>
> 1. La persona activa los avisos en su teléfono
> 2. Cuando hay una novedad o un recordatorio, BE envía un aviso sin datos de salud
> 3. Al tocarlo, la app abre la novedad
>
> **Resultado.** Un aviso que nunca es la única vía: la novedad está igual en la app.
>
> **Relaciones.** Extiende UC-P30, si la persona activó los avisos en ese teléfono. Incluye UC-I03.
>
> **Requisitos.** RF-021, RF-061, RF-062

## 5.10 Casos compartidos y proceso interno

Los pasos que varios circuitos necesitan en el mismo punto. Los ejecuta BE, adentro de su frontera y sin pantalla propia: algunos se usan siempre («include») y otros solo cuando se da una condición («extend»). Al final, el cálculo de la TVCC-30, un proceso interno.

Quién usa cada uno, siempre o con una condición, está en la Tabla 4.

> **UC-I02 · Evaluar la autorización.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Decidir si una operación sobre datos protegidos se permite.
>
> **Recorrido.**
>
> 1. Recibe quién pide, qué operación, sobre qué persona y en qué área
> 2. Comprueba la cuenta de quien pide y la de la persona, la autorización de sus datos de salud, la verificación y la habilitación del profesional, el vínculo del área y su permiso
> 3. Permite o niega, y registra la decisión
>
> **Resultado.** Una decisión igual para todos los canales. Lo ajeno o lo no autorizado responde igual que lo inexistente.
>
> **Relaciones.** Lo incluye todo caso que toca datos protegidos.
>
> **Requisitos.** RF-015, RF-020 a RF-023, RF-052, RF-053, RF-071

> **UC-I03 · Auditar y conservar la historia.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Dejar registro de cada operación sensible sin borrar lo anterior.
>
> **Recorrido.**
>
> 1. Registra quién, qué y cuándo, en la misma transacción que la operación
> 2. Agrega, nunca reemplaza: una corrección cita al original
>
> **Resultado.** Una historia completa, que permite reconstruir qué se sabía en cada momento.
>
> **Relaciones.** Lo incluye todo caso que toca datos protegidos.
>
> **Requisitos.** RF-025, RF-044, RF-050, RF-054, RF-057, RF-069, RF-071

> **UC-I04 · Validar y versionar un plan.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Convertir un borrador válido en una versión que no cambia.
>
> **Recorrido.**
>
> 1. Valida la estructura del plan y el objetivo vigente
> 2. Guarda la instantánea del plan antes de que empiece a regir
> 3. La marca como vigente y deja la anterior en el historial
>
> **Resultado.** Una sola versión vigente por persona y área. La base de datos no deja modificar una instantánea guardada.
>
> **Relaciones.** Lo incluyen UC-P11 y UC-P16.
>
> **Requisitos.** RF-031, RF-041

> **UC-I05 · Registrar una revisión válida.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Exigir que la revisión tenga todo lo que la hace válida.
>
> **Recorrido.**
>
> 1. Comprueba el período, la evidencia, la interpretación, el resultado (uno de seis), el fundamento y la próxima acción
> 2. Comprueba que cada evidencia sea de ese seguimiento
> 3. La registra, sin aplicar nada
>
> **Resultado.** Una revisión válida, o un rechazo que dice qué falta.
>
> **Relaciones.** Lo incluyen UC-P13 y UC-P18.
>
> **Requisitos.** RF-034, RF-045, RF-055, RF-056

> **UC-I06 · Aplicar la continuidad o el cierre.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Llevar a cabo lo que decidió la revisión.
>
> **Recorrido.**
>
> 1. Lee el resultado de la revisión
> 2. Crea lo que corresponde: el borrador sucesor, el objetivo nuevo, la próxima revisión o el cierre del seguimiento
> 3. Recién después registra el hecho: sin la consecuencia aplicada, no hay hecho
>
> **Resultado.** Un seguimiento coherente con lo decidido, sin tocar la historia.
>
> **Relaciones.** Extiende UC-P13 y UC-P18, si el profesional aplica lo decidido, en el momento o después.
>
> **Requisitos.** RF-035, RF-046, RF-056

> **UC-I07 · Importar con revisión.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Traer un alimento o un ejercicio de un catálogo externo y revisarlo antes de usarlo.
>
> **Recorrido.**
>
> 1. Consulta el catálogo externo: Open Food Facts para los alimentos y wger para los ejercicios
> 2. Normaliza el dato, y el profesional lo revisa antes de usarlo
> 3. Lo incorpora con su procedencia
>
> **Resultado.** Un elemento externo identificado como tal.
>
> **Relaciones.** Extiende UC-P10 (si el alimento no está en el catálogo propio y lo busca afuera) y UC-P15 (si el ejercicio no está en el catálogo propio y lo busca afuera).
>
> **Requisitos.** RF-028, RF-038, RF-060

> **UC-I08 · Seguir con el respaldo manual.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** No frenar el trabajo si un catálogo externo falla.
>
> **Recorrido.**
>
> 1. Detecta que el catálogo externo no responde
> 2. Ofrece el catálogo propio y la carga manual
>
> **Resultado.** El profesional sigue trabajando, y la procedencia de cada dato queda.
>
> **Relaciones.** Extiende UC-P10 y UC-P15, si el catálogo externo no responde.
>
> **Requisitos.** RF-059, RF-060

> **UC-I09 · Calcular resultados antropométricos.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Calcular los derivados de una toma con método y versión.
>
> **Recorrido.**
>
> 1. Toma las mediciones registradas
> 2. Aplica el método vigente
> 3. Guarda el resultado con sus datos de entrada
>
> **Resultado.** Un cálculo que se puede repetir.
>
> **Relaciones.** Lo incluyen UC-P19 y UC-E03. Incluye UC-I13.
>
> **Requisitos.** RF-048, RF-050, RF-070

> **UC-I10 · Verificar que el profesional puede operar el área.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Comprobar, antes de iniciar un proceso, que el profesional puede trabajar en esa área.
>
> **Recorrido.**
>
> 1. Lee la verificación y la habilitación del área
> 2. Comprueba que la sesión esté vigente
> 3. Permite o rechaza
>
> **Resultado.** Solo inicia procesos quien está verificado y habilitado en el área.
>
> **Relaciones.** Lo incluyen UC-P11, UC-P16 y UC-P19.
>
> **Requisitos.** RF-031, RF-041, RF-066

> **UC-I11 · Encauzar por el canal previsto.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Llevar a cada actor a su canal.
>
> **Recorrido.**
>
> 1. Lee qué capacidades tiene la cuenta
> 2. La lleva a su lugar
>
> **Resultado.** El profesional en el espacio profesional del website, la persona en la app y Administración en su consola.
>
> **Relaciones.** Lo incluyen UC-P25 y UC-P26.
>
> **Requisitos.** RF-007

> **UC-I12 · Registrar una corrección trazable.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Guardar una corrección sin perder el original.
>
> **Recorrido.**
>
> 1. Crea el registro nuevo
> 2. Lo une al original, con el autor y el motivo
>
> **Resultado.** El original y la corrección, los dos visibles.
>
> **Relaciones.** Lo incluyen UC-E02 y UC-E03.
>
> **Requisitos.** RF-044, RF-050

> **UC-I13 · Ejecutar y adoptar un cálculo profesional.** Compartido · Adentro de BE · Servidor
>
> **Objetivo.** Ejecutar un método con versión y que el profesional decida si adopta el resultado.
>
> **Recorrido.**
>
> 1. Ejecuta el método con los datos que pide
> 2. Muestra el resultado
> 3. El profesional lo adopta o no: nada cambia solo
>
> **Resultado.** Una corrida conservada, con método y versión.
>
> **Relaciones.** Extiende UC-P09 y UC-P14, si el profesional elige ejecutar un método de cálculo. Lo incluye UC-I09.
>
> **Requisitos.** RF-048, RF-070

> **UC-S01 · Calcular la TVCC-30.** Soporte · Quien opera el servicio · Un comando interno, sin pantalla
>
> **Objetivo.** Medir en forma reproducible cuántos ciclos de seguimiento se cierran a tiempo.
>
> **Recorrido.**
>
> 1. Toma los ciclos de seguimiento que vencieron en una ventana de 30 días
> 2. Cuenta cuántos tuvieron, a tiempo, una revisión válida con su continuidad o su cierre aplicados
> 3. Guarda el resultado con su ventana, su versión y quién lo pidió
>
> **Resultado.** Un valor que se puede auditar y repetir. Mide el servicio; no dice nada de la salud de nadie.
>
> **Relaciones.** Incluye UC-I03.
>
> **Requisitos.** RF-058

# Fuentes

*De dónde sale cada dato, para quien quiera verificarlo en el repositorio público del proyecto.*

> **Fuentes.** 1. Identificadores, actores, recorridos y requisitos de cada caso: la especificación de casos de uso del proyecto (docs/legajo/05_BE_LEG_05_v0.15.md) y los requisitos funcionales (docs/legajo/04_BE_LEG_04_v0.4.2.1.md).
> 2. Lo que hace cada caso, sus reglas y sus errores: el código del repositorio, en la API (apps/api), el website (apps/web), la app (apps/mobile) y los contratos y textos compartidos (packages/domain), con la descripción de cada operación en packages/domain/src/openapi.ts.
> 3. Los gráficos: su especificación (docs/paquetes/WP-GRAFICOS.md) y su código, en apps/web/src/app/pro/advisees/graficos. La historia anterior: packages/domain/src/historia-anterior.ts (lo que entra de cada área, lo que nunca entra y los textos de sus pantallas), apps/api/src/historia-anterior y apps/web/src/app/pro/advisees/previous-history.
> 4. El disparador programado de los recordatorios: render.yaml (la tarea be-recordatorios) y apps/api/src/novedades/recordatorios.service.ts.
> 5. Los diagramas y las fichas salen de los mismos datos, y la fuente que los arma está junto a este documento.
