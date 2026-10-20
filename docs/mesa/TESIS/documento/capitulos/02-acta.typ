#import "../plantilla.typ": *

= Acta del proyecto

Este apartado presenta BE antes que su técnica: qué problema aborda, para quién, con qué objetivo y hasta dónde llega.
Se apoya en los documentos canónicos 02 (visión y alcance) y 03 (modelo de negocio), en el acta DV-02 de septiembre y
en lo que efectivamente quedó implementado en la versión de referencia (#id("main 0fb1bff"), 20 de octubre de 2026).
Cada afirmación de alcance remite a un requisito (#id("RF")) o a una decisión registrada.

== El problema y cómo lo aborda BE

Un nutricionista arma un plan en un documento, lo envía por mensajería y anota el seguimiento en una planilla. Un
entrenador hace lo mismo por su lado. La persona que los consulta registra lo que come en una aplicación de consumo,
si es que registra algo. Nadie ve el proceso completo, nadie puede reconstruir por qué se decidió lo que se decidió y
la persona no controla quién accede a qué parte de su información de salud. Esta descripción es la *hipótesis de
problema* del proyecto (documento 02): no surge de entrevistas realizadas y se validará con la prueba con profesionales
descripta en 2.8.

BE aborda ese problema con cuatro decisiones de diseño, cada una implementada en la versión de referencia:

+ *Cada profesional en su área y la persona decide.* Un profesional trabaja con una persona dentro de un alcance
  (Nutrición, Entrenamiento o Antropometría) y solo con el permiso que ella otorgó para esa finalidad. La persona puede
  revocarlo y el corte vale hacia adelante (#id("RF-020"), #id("RF-022")).
+ *Lo indicado queda escrito y no cambia.* Un plan se arma en borrador y, al activarse, queda como una versión
  inmutable con su instantánea. Para cambiarlo se activa una versión nueva (#id("RF-031"), #id("RF-041")).
+ *Lo que pasó se registra aparte de lo indicado.* La persona registra en la APK lo que comió o entrenó. Ese registro
  no reemplaza al plan: el profesional los compara en una revisión con decisión de continuidad (#id("RF-033"),
  #id("RF-043"), #id("RF-056")).
+ *Nada se borra.* Una corrección o una anulación es un registro nuevo que cita al original. La base de datos lo exige
  con disparadores, no solo la aplicación (apartado 6). La única excepción es la foto de una comida que la persona
  pide suprimir: se borran sus bytes y queda la constancia, con su momento (API-MED-05).

#recuadro(titulo: [Lo que BE no hace], tipo: "decision")[
  BE no diagnostica ni califica: no calcula puntajes de adherencia ni de salud. Muestra hechos (qué se indicó, qué se
  registró, cuál es la diferencia) y la interpretación es del profesional (decisión DEC-014 del legajo). Los límites
  completos están en 2.6.
]

== Público objetivo

BE se dirige a dos poblaciones vinculadas y prevé una tercera que hoy no tiene interfaz:

- *Profesionales que hacen seguimiento longitudinal:* nutricionistas y profesionales del entrenamiento, en consultorio
  propio o en equipo, y profesionales con capacidad antropométrica, que puede acompañar a cualquiera de las dos
  especialidades o existir sola. Trabajan en el website, pensado para pantallas de escritorio.
- *Personas bajo seguimiento profesional* (el «asesorado», en el vocabulario del proyecto), titulares de sus datos.
  Usan la APK para Android y, para su cuenta y sus permisos, también el website.
- *Administración de la plataforma:* el legajo prevé un rol que verifica profesionales y resuelve incidencias, sin
  intervenir nunca en lo clínico. En esta entrega no está implementado (2.5); los profesionales de la demostración se
  habilitan con un servicio interno.

== Uso previsto

Un profesional habilitado invita a una persona (enlace, código o QR) o le envía una solicitud. La persona acepta el
vínculo y, en el mismo recorrido, autoriza el acceso para esa finalidad (B2) y, si todavía no lo hizo, el tratamiento de
sus datos de salud (A3). A partir de ahí el
profesional evalúa, fija un objetivo, diseña un plan en borrador y lo activa. La persona consulta en la APK lo que
tiene para hoy y registra lo que hizo. El profesional revisa periódicamente lo registrado contra lo indicado y decide
cómo seguir. Si la persona trabaja con más de un profesional, cada uno opera en su alcance y pueden dejarse notas de
coordinación sin ver los datos de un área que no les fue autorizada. El anexo B dibuja este recorrido completo.

== Objetivo

*Objetivo general.* Construir una plataforma en la que el trabajo profesional longitudinal en nutrición, entrenamiento y
antropometría sea trazable, versionado y gobernado por el consentimiento de la persona titular, con la planificación
separada de la ejecución real y sin que el sistema sustituya el criterio profesional.

*Objetivos específicos*, cada uno con su comprobación en este documento:

#table(
  columns: (auto, 1fr, 1fr),
  table.header([N.º], [Objetivo específico], [Cómo se comprueba]),
  [O1], [Gobernar cada acceso a datos de salud por alcance, finalidad y consentimiento vigente, igual en el website y en la APK.], [Requisitos #id("RF-020") a #id("RF-023")\; punto único de decisión de autorización (PDP) en el apartado 8; pruebas de acceso revocado (apartado 5).],
  [O2], [Versionar la planificación: lo activado no se modifica.], [Requisitos #id("RF-031") y #id("RF-041")\; restricciones de la base (apartado 6).],
  [O3], [Registrar la ejecución separada de lo indicado y revisarla con decisión de continuidad.], [Requisitos #id("RF-033"), #id("RF-043"), #id("RF-056")\; casos #id("UC-P12"), #id("UC-P13"), #id("UC-P17"), #id("UC-P18").],
  [O4], [Conservar toda la historia: corregir y anular sin borrar.], [Requisitos #id("RF-044") y #id("RF-050")\; disparadores de solo agregar (apartado 6).],
  [O5], [Medir el resultado del servicio con una métrica reproducible: la tasa de ciclos cerrados en 30 días (TVCC-30).], [Cálculo implementado (#id("RF-058"), #id("UC-S01")) y demostrado con datos sintéticos; la medición con profesionales reales queda pendiente.],
)

*Objetivo académico.* Demostrar un ciclo completo de análisis de sistemas, desde los requisitos hasta los contratos de
interfaz, el modelo de datos, la implementación y la verificación, con trazabilidad comprobable en cada eslabón
(anexo F).

== Alcance

El alcance se describe por capacidades, con estados que este documento nunca mezcla: *implementado* (está en la
versión de referencia, completo o en parte), *aprobado pendiente* (está en el legajo y no se construyó), *fuera de
alcance* (Dirección lo dejó fuera de esta entrega) y *propuesta* (no aprobado). El detalle por requisito y su
evidencia están en el apartado 3.

#table(
  columns: (1.35fr, auto, auto, 1.3fr),
  table.header([Capacidad], [Requisitos], [Superficie], [Estado en la versión de referencia]),
  [Identidad, sesión y cuenta], [#id("RF-001") a #id("RF-007"), #id("RF-069")], [W · A], [#estado("implementado") Acceso con Google; la sesión del website sobrevive a una recarga. Fuera de alcance: recuperar el acceso (#id("RF-005")).],
  [Alta y verificación de profesionales; administración], [#id("RF-008") a #id("RF-014"), #id("RF-067"), #id("RF-068")], [W], [#estado("fuera") Los profesionales de prueba se habilitan con un servicio interno (DL-036). Pendiente: las incidencias administrativas (#id("RF-068"), P1), que dependen del rol de administración.],
  [Vínculo, consentimiento y autorización], [#id("RF-015"), #id("RF-017") a #id("RF-025")], [W · A], [#estado("implementado") Invitación por enlace, código o QR. Parcial: el perfil propio tiene un solo campo (#id("RF-017")).],
  [Circuito de nutrición], [#id("RF-026") a #id("RF-035")], [W · A], [#estado("implementado") Con recetas propias y catálogo de USDA.],
  [Circuito de entrenamiento], [#id("RF-036") a #id("RF-046"), #id("RF-064")], [W · A], [#estado("implementado") Con prescripción por serie y agenda. Parcial: sustituir un ejercicio durante la sesión (#id("RF-043")), un defecto abierto de la candidata (DL-151).],
  [Antropometría], [#id("RF-047") a #id("RF-051")], [W · A], [#estado("implementado") Pendiente: publicar y descubrir servicios (#id("RF-051"), P1).],
  [Seguimiento: cartera, ficha, línea de tiempo, notas, TVCC-30], [#id("RF-052") a #id("RF-058"), #id("RF-065"), #id("RF-066")], [W · A], [#estado("implementado") Parcial: la capacidad del profesional, sin interfaz (#id("RF-066")).],
  [Integraciones y avisos], [#id("RF-059") a #id("RF-062")], [W · A], [#estado("implementado") Falta probar los avisos push en un teléfono.],
  [Métodos de cálculo e información pertinente], [#id("RF-070"), #id("RF-071")], [W · A], [#estado("implementado")],
)

*Propuestas (no implementadas ni aprobadas):* seis ampliaciones (A a F) planteadas el 2026-10-19 y diseñadas contra
el código, sin empezar (PR \#193); la biblioteca de recetas de BE; los rangos de macronutrientes por día y por comida,
pedido abierto sin decisión; y el piloto de inteligencia supervisada (PF-08, en
`docs/propuestas/BE_Plan_Funcional_Profesional_v1-1.md`). Se mencionan para mostrar hacia dónde puede crecer BE, no
como capacidades; sus fichas están en `docs/propuestas/`.

== Límites

Cada límite es una decisión registrada, no una omisión:

- *No diagnostica ni califica* (DEC-014): no hay puntajes de salud ni de adherencia; la figura antropométrica ubica
  puntos de medición y no los colorea por rango.
- *No calcula por su cuenta el requerimiento:* ofrece métodos versionados que el profesional elige ejecutar; el
  resultado es un apoyo y no cambia solo el objetivo ni el plan (regla INV-06-133 del documento 06).
- *No comparte sin consentimiento por finalidad:* ningún profesional accede a un área que no le fue autorizada, y la
  revocación corta hacia adelante (documento 08, §13 y §56).
- *No es un mercado de profesionales:* el descubrimiento de servicios antropométricos previsto es acotado y hoy no
  existe (#id("RF-051")).
- *No reemplaza la historia clínica institucional* ni certifica credenciales profesionales.
- *No procesa datos reales todavía:* el ambiente es de prueba, con datos sintéticos, hasta cumplir las condiciones del
  documento 08, §42 (doble factor, textos legales, respaldo con restauración probada, ambiente de producción separado,
  entre otras).

== Tecnologías utilizadas

Las versiones son las de los manifiestos del repositorio en la versión de referencia; las decisiones que las justifican
están en el apartado 8 (registros de decisión de arquitectura).

#table(
  columns: (auto, 1fr, 1.25fr),
  table.header([Capa], [Tecnología y versión], [Uso en BE y fundamento]),
  [API], [NestJS 11.2 sobre Node.js 22; TypeScript 5.9], [Monolito modular REST `/api/v1`: transacciones locales que hacen atómica cada operación de dominio (ASR-01).],
  [Persistencia], [PostgreSQL 16; Prisma 6.19], [113 tablas; índices únicos parciales, restricciones CHECK y disparadores para la historia por adición (ASR-02, ASR-05).],
  [Dominio compartido], [Paquete propio `@be/domain` con zod 4.6], [Contratos, textos y reglas que usan la API, el website y la APK: una sola definición por contrato.],
  [Website], [Next.js 15.5 (exportación estática) y React 19.2], [Espacio profesional y cuenta de la persona; se sirve como sitio estático y llama a la API con CORS (DL-007, DL-030).],
  [APK], [Expo SDK 57, React Native 0.86], [Aplicación Android de la persona; almacén seguro para la sesión, avisos por Expo.],
  [Despliegue], [Render, región Frankfurt: base Basic-256mb, API en Docker (plan Starter), sitio estático y una tarea programada], [Ambiente `test` con datos sintéticos; despliegue automático cuando la CI pasa (apartado 8).],
  [Integración continua], [GitHub Actions], [Cinco trabajos: hashes del legajo; verificación (tipos, pruebas, compilación, auditoría); integración con PostgreSQL 16 real (Testcontainers); recorridos de navegador; imagen de la API.],
  [Integraciones], [Open Food Facts, wger, Google Identity, Expo Push con Firebase Cloud Messaging; datos de USDA FoodData Central sembrados por migración], [Catálogos externos con procedencia y licencia; acceso con Google; avisos al teléfono.],
)

== Análisis de mercado

*Hechos (con su fuente).* El Censo Nacional de Profesionales en Nutrición 2023 de FAGRAN relevó un universo de 16.507
profesionales matriculados o asociados en sus 24 entidades miembro; respondieron 9.721 (59 %). El lugar de trabajo más
mencionado fue el consultorio particular (43,8 %) y el 56 % de quienes trabajaban tenía más de un empleo [C52]. El
censo no cubre todo el país (Tucumán no participó y la asociación es voluntaria). Del lado de la demanda, la 4.ª
Encuesta Nacional de Factores de Riesgo (INDEC, 2018) midió exceso de peso en el 66,1 % de las personas de 18 años o
más y actividad física baja en el 44,2 % [C53]. Para gimnasios y entrenadores no se encontraron datos defendibles:
solo estimaciones privadas citadas por la prensa, sin el informe original.

*Inferencias (no son hechos de las fuentes).* Un profesional de la nutrición que trabaja en consultorio propio y en más
de un lugar a la vez es un usuario plausible de una herramienta que ordena el seguimiento y la comunicación con la
persona. La prevalencia de exceso de peso y de sedentarismo sugiere demanda de seguimiento sostenido en el tiempo.
Ninguna de las dos cifras mide disposición a pagar ni adopción.

*Lo que falta para validar.* No hay una estimación defendible de tamaño de mercado, ingresos ni retención, y este
trabajo no la inventa. El modelo de negocio del documento 03 (servicio por suscripción para profesionales) sigue siendo
el encuadre, sin precios fijados. La validación prevista es la prueba con profesionales cuyo protocolo está en
`docs/ux/PRUEBA-CON-PROFESIONALES.md` (tareas, tiempos, errores de interpretación y valoración), todavía no realizada.

== Comparación con la competencia

Se relevaron el 20 de octubre de 2026 nueve productos en sus fuentes primarias (sitio oficial, centro de ayuda,
términos): los cinco del acta de septiembre, que siguen en línea (Hexfit cambió de dirección), y cuatro nuevos, entre
ellos uno argentino. La regla de lectura es estricta: «—» significa *no encontrado en las páginas consultadas*, no
«no lo tiene»; «sí\*» significa sí, con alcance limitado. Las citas textuales y los localizadores están en
`docs/mesa/TESIS/fuentes/COMPETENCIA-2026-10-20.md`.

#figure(
  kind: table,
  caption: [Comparación de funciones publicadas (consulta del 2026-10-20). Los números entre corchetes remiten a la bibliografía del anexo J.],
  table(
    columns: (1.25fr, auto, auto, auto, auto, auto, auto, auto),
    align: (left, center, center, center, center, center, center, center),
    table.header([Producto], [App o portal], [Varios profesionales], [Control del titular], [Historial o versiones], [Nutrición y entren.], [Antropometría], [Declara IA o puntajes]),
    [Nutrium [C1–C5]], [sí], [sí\*], [—], [—], [sí\*], [sí], [sí],
    [Hexfit [C6–C11]], [sí], [sí], [—], [—], [sí], [sí], [sí],
    [NutriAdmin [C12–C16]], [sí], [sí], [—], [—], [sí\*], [sí], [sí],
    [Healthie [C17–C24]], [sí], [sí], [—], [sí], [sí\*], [sí], [sí],
    [Practice Better [C25–C31]], [sí], [sí], [—], [sí], [sí\*], [sí], [sí],
    [ABC Trainerize [C32–C38]], [sí], [no#super[a]], [—], [sí\*], [sí], [sí], [sí],
    [TrueCoach [C39–C43]], [sí], [sí\*], [—], [sí\*], [sí\*], [sí], [sí],
    [Everfit [C44–C49]], [sí], [sí], [—], [sí\*], [sí], [sí], [sí],
    [MediFlow, Argentina [C50–C51]], [sí], [sí\*], [—], [sí], [—], [sí], [sí],
    table.cell(colspan: 8, align: left, text(size: 10pt)[#super[a] La fuente lo niega: «As of now, the platform does not support this feature» [C33]. En «Declara IA o puntajes», «sí» significa que la fuente menciona generación automática, IA o puntajes; varios productos aclaran que el profesional revisa lo generado.]),
  ),
)

*Lectura.* La documentación pública muestra solapamiento funcional amplio: todos ofrecen una aplicación o portal para
el cliente y casi todos permiten trabajar en equipo con permisos. En el eje del control del titular no se encontró, en
ninguno de los nueve, que el acceso lo decida la persona por área y finalidad: en todos lo decide el profesional o el
administrador de la cuenta (*inferencia* a partir de lo no encontrado, no prueba de ausencia). En versiones, tres se
acercan a lo que hace BE: Practice Better no deja editar un protocolo publicado, MediFlow muestra al paciente la última
versión publicada y Healthie conserva los planes desactivados.

*Conclusión defendible.* BE no se presenta como el único que integra áreas ni como el único que cuida datos. Su aporte
es hacer explícita y comprobable una combinación: el titular decide por finalidad, lo indicado se versiona, lo
registrado se separa de lo indicado y corregir no borra, en las dos superficies y con trazabilidad desde el requisito hasta
la prueba. Si esa combinación resuelve el problema del público objetivo es la hipótesis que valida la prueba con
profesionales; una comparación empírica exigiría cuentas de prueba en cada producto y el mismo protocolo.

== Roles del equipo y responsabilidades

Las responsabilidades se atribuyen solo con evidencia. El historial de Git de la versión de referencia tiene 852
commits entre el 16 de septiembre y el 20 de octubre de 2026, todos con la cuenta del autor como responsable, y 639 de
ellos declaran coautoría de un asistente de IA; hay 191 cambios integrados por pull request.

#table(
  columns: (1fr, 1.15fr, 1.3fr),
  table.header([Rol], [Quién], [Responsabilidades y evidencia]),
  [Dirección del proyecto y autoría académica], [Elián Bufi #pendiente("confirmar nómina completa del grupo")], [Define alcance y prioridades, aprueba cada etapa por acta (ACTA-DIR-021 a 034), decide las tensiones con el legajo (DEUDA_LEGAJO) e integra los cambios. Prueba la APK en el teléfono. Evidencia: actas firmadas, decisiones registradas, autoría de los commits.],
  [Análisis, especificación y ejecución técnica asistida], [Asistentes de IA bajo dirección del autor: Claude (Anthropic), mediante Claude Code], [Implementación, pruebas, documentación técnica y verificaciones, siempre sobre ramas y pull requests que integra la Dirección. Evidencia: coautoría declarada en 639 commits.],
  [Producción y revisión de derivaciones de mesa], [ChatGPT y Codex (OpenAI), según los propios documentos de mesa], [DV-03 y la corrección v5 de MESA-02, con contrarrevisión cruzada. Evidencia: notas de DV-02 y del estándar de calidad de MESA-02.],
)

#recuadro(titulo: [Lo que este documento no afirma], tipo: "nota")[
  No agrega integrantes ni correos que no estén confirmados: la portada los marca como pendientes. Un asistente de IA no
  es un integrante del grupo; figura porque la escuela pide declarar cómo se distribuyó el trabajo y porque el método
  (dirección humana, ejecución asistida y verificación con pruebas) es parte de lo que se defiende.
]
