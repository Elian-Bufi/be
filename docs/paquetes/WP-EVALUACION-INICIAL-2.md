# WP-EVALUACION-INICIAL-2 — la evaluación inicial como pantallazo del caso

> **Estado:** PROGRAMADO en la rama `wp-evaluacion-inicial-2`, desde `main` aef7c87e (PR en borrador, sin integrar). Las
> decisiones de continuador EI-D01 a EI-D16 están **a ratificar**. DEUDA_LEGAJO **DL-189**: si al integrar el número choca
> con otro paquete, se renumera.
>
> **Origen** (Dirección, 2026-11-21): recorrió «Empezar el plan» de Nutrición en el escritorio profesional y la evaluación
> inicial «no le cierra». Hoy es una planilla de «Concepto / Valor / Unidad / Fuente» con pastillas «Para empezar» y el
> texto «Cada dato indica de dónde sale. Un dato calculado declara el método: BE no calcula». Ratificó el rediseño de §1 y
> pidió empezar ya.
>
> **En paralelo:** el frente `wp-recorrido-plan-pulido` es dueño del marco del área, del calculador y del objetivo, del
> editor del plan, de los rangos y de los estilos de las filas de campos. Este paquete no los toca (§4).
>
> **Datos:** solo sintéticos (la cohorte de #161 y lo que suman las capturas), en local, en la CI y en `test`.

## 0. Legajo y decisiones que cita

- **04:** RF-026 y RF-036 (la evaluación de Nutrición y la de Entrenamiento); RF-071 (solicitar y completar información
  profesional pertinente); RNF-SEC-006 y RNF-PRI-001.
- **05:** UC-P09 y UC-P14 (evaluación y objetivo); UC-P32 y UC-P33 (el profesional solicita, la persona completa).
- **06:** REG-06-97 (la evaluación es un hecho: no se sobrescribe); REG-06-109 (cada dato con su fuente); REG-06-210 (la
  Solicitud tiene dos estados).
- **09:** API-NUT-01 a 03, API-TRN-01 a 03, FRM, FRI, CTX, HBT, EVF y OBC, **sin cambios de forma**. Este paquete no
  agrega operaciones a la API: todo lo nuevo es del dominio y del website.
- **DL:** DL-048 (la evaluación como datos con su fuente); DL-145 y DL-146 («Empezar el plan»); DL-164 (D-3 la propuesta,
  D-4 la transcripción, D-6 lo no confirmado se borra); DL-165 (D-1 una parte por pantalla, D-7 las obligatorias);
  DL-169 (el perfil propio es el nombre); DL-173 (las notas propias); DL-179 (citar); DL-185 (vincular, EVF); DL-186 (el
  calculador, OBC).

## 1. Las partes

| ID | Qué | Toca la API | Se acepta cuando |
|---|---|---|---|
| RP-00 | Declaración | No | Este paquete y DL-189 están en el repo. |
| RP-02 | Sin «Todavía no hay un plan activo.» de más | No | Con los pasos de «Empezar el plan» o con la versión en preparación a la vista, el renglón no aparece: lo dicen ellos. En Resumen queda como estaba. |
| RP-10 | Los pasos en una franja | No | «① Evaluación › ② Objetivo › ③ Plan», finita y arriba, con el estado de cada paso («Lista · 21/11», «Ahora», «Después»). Debajo, solo el paso actual abierto. Un paso listo se abre tocándolo en la franja; uno que viene no se abre. |
| RP-11 | La fecha automática | No | La evaluación lleva el momento en que se registra. Se ve «Hoy, 12:12 · cambiar»; «cambiar» abre el campo de fecha y hora para una evaluación hecha antes (no puede ser posterior a ahora). En Nutrición y en Entrenamiento. |
| RP-12 | La evaluación en tres bloques | No | En Nutrición, sin «Concepto / Valor / Unidad», sin «Para empezar» y sin «BE no calcula»: «Lo que contó {nombre}», «Lo medido» y «Lo que necesita el cálculo» (§2), con «+ Agregar otro dato» plegado al pie. |
| RP-13 | «Anotaciones» | No | Un espacio amplio de texto libre, privado del profesional, en Nutrición y en Entrenamiento. La persona no lo ve en ninguna lectura suya: TEST-EVI-010 lo fija contra PostgreSQL. |
| RP-14 | «Completarlo ahora con {nombre}» | No | Un clic crea por detrás la solicitud del área y la de «Tus hábitos» (si el dominio sugiere sumarla); lo demás que puede pedir se tilda antes de seguir. «Cargar con la persona» se abre ahí mismo y al terminar se vuelve a la evaluación con lo cargado. «Enviárselo» es «Pedir información», como hoy. |
| RP-15 | Primero las preguntas críticas | No | `CAMPOS_CRITICOS_POR_PLANTILLA` en el dominio (§3). En «Cargar con la persona», arriba «Primero lo necesario para planificar» con las críticas; el resto detrás de «Cargar también el resto». La APK ya deja completar lo que falta al confirmar (§5). |
| RP-16 | La corrección se ve | No | Si la persona corrigió algo de lo que cargó el profesional, la evaluación lo dice: «{nombre} corrigió: Combino sentado y de pie → Mucho de pie o caminando», con `correctedFieldCodes` de la transcripción. |

## 2. Los tres bloques (RP-12)

1. **«Lo que contó {nombre}».** Los formularios que la persona le respondió a este profesional en el área (API-CTX-01),
   «Tus hábitos» incluido si él lo pidió, cada uno con su fecha, su procedencia y lo crítico en palabras; «Ver todo» abre
   las respuestas por sección. Al registrar quedan vinculados con EVF (API-EVF-02), sin copiar ninguna respuesta. Lo que
   la persona le comparte de sus hábitos (API-HBT-05) se ve con su fecha y no se vincula (EVF-D03).
   - Sin ningún formulario respondido ni pedido: «Completarlo ahora con {nombre}» (RP-14) y «Enviárselo».
   - Con una solicitud enviada sin responder: «Se lo pediste el {fecha}» y «Completarlo ahora con {nombre}», sobre esa
     misma solicitud. Si ya se cargó con la persona: «Cargado por vos el {fecha} · falta que {nombre} lo confirme», con lo
     cargado en palabras y «Seguir cargando».
2. **«Lo medido».** La última toma de Antropometría que este profesional puede usar (API-OBC-01, la misma que lee el
   calculador): el peso, la talla, la edad y la composición con su método, con su fecha, y «Ver toma». Sin toma, una línea.
3. **«Lo que necesita el cálculo».** Edad, sexo, peso, talla y nivel de actividad, cada uno con su origen y su fecha:
   «Toma del 10/11», «Respondido por {nombre} · 12/11», «Confirmado por {nombre} · 12/11», «Cargado por vos · falta que
   {nombre} lo confirme», «Compartido por {nombre} · 5/11» o «Cargado por vos». Si hay un medido y un declarado, vale el
   medido y el declarado se ve al lado. «Cambiar» abre el campo, y lo cambiado pasa a «Cargado por vos» con el valor
   anterior al lado. La regla es del dominio (`loQueNecesitaElCalculo`), y lo que se registra también
   (`entradasDelCalculo`): un dato por renglón, con su fuente (la toma, observado; lo demás, informado) y su procedencia en
   `evidenceReferences`.
   - **El punto de unión con el calculador** es `datosDelCalculoEnLaEvaluacion` (dominio): de una evaluación registrada,
     los datos del cálculo con su fuente, también los de evaluaciones anteriores que usaron «Peso» y «Talla». El
     calculador (DL-186) arranca hoy de la toma más nueva o de lo escrito a mano (`calculadorInicial`); sumar este punto de
     partida es un cambio de una línea en el frente del objetivo, que no se tocó acá (EI-D15).

## 3. Los campos críticos (RP-15)

`CAMPOS_CRITICOS_POR_PLANTILLA`, por clave de plantilla, en el orden del formulario. Lo eligió el ejecutor con lo que
necesitan el objetivo y el plan (a ratificar, EI-D10); el profesional no lo elige.

| Plantilla | Críticos | Por qué |
|---|---|---|
| «Cómo comés hoy» (FRM-NUTRICION-INICIO) | `nut_jornada`, `nut_momentos`, `nut_alimentos_no`, `nut_alergias`, `nut_alergias_cuales`, `nut_intolerancias`, `nut_estilo`, `condiciones_declaradas`, `medicacion_relevante`, `nut_peso_reciente`, `nut_embarazo`, `nut_tca`, `nut_objetivo` | Las comidas que hace y su jornada arman el plan; lo que no come, las alergias, las intolerancias y el estilo lo acotan; las condiciones, la medicación, el embarazo y la conducta alimentaria condicionan el objetivo (un déficit, por ejemplo); el peso reciente y lo que busca lo orientan. |
| «Antes de entrenar» (FRM-ENTRENAMIENTO) | `trn_salud_corazon`, `trn_salud_dolor_de_pecho`, `trn_salud_mareos`, `trn_salud_cronica`, `medicacion_relevante`, `trn_salud_huesos`, `trn_salud_supervision`, `trn_embarazo`, `trn_apto_medico`, `dolor_o_lesiones`, `trn_zonas`, `trn_experiencia_en_fuerza`, `trn_objetivo_principal`, `trn_dias_y_horario`, `trn_dias_por_semana`, `trn_minutos_por_sesion`, `trn_lugar_y_equipamiento` | La salud antes de entrenar y el dolor de hoy deciden si se empieza y con qué cuidado; la experiencia, lo que busca, los días, el tiempo y el lugar arman el plan. |
| «Tus hábitos» (FRM-HABITOS) | `habitos_horarios`, `horas_de_sueno`, `nivel_de_actividad`, `habitos_hace_deporte`, `habitos_deportes` | El nivel de actividad entra en el cálculo; los horarios, el sueño y el deporte de la semana ubican las comidas y las sesiones. |

- Cuentan solo los pedidos en la solicitud y visibles con lo cargado (una condicional cerrada no aparece). En una versión
  que trae la parte «Tus hábitos» (las de la ronda 2), también cuentan los críticos de hábitos.
- Un código que la versión no tiene no se busca: la lista sirve para las versiones viejas y para las nuevas.
- Sin ninguna crítica pedida (otra plantilla), «Cargar con la persona» arranca con las partes, como hoy.

## 4. Lo que no cambia

- Las operaciones de la API y sus formas: ninguna nueva, ninguna cambiada. La evaluación sigue siendo un hecho
  (REG-06-97); lo vinculado vive en EVF; lo cargado con la persona sigue siendo una propuesta que ella confirma (DL-164).
- La APK y lo que lee (DL-152): sin cambios (§5).
- Los archivos del frente `wp-recorrido-plan-pulido`: `marco-del-area.tsx`, `nutrition/calculador.tsx`,
  `calculador-del-objetivo.ts`, `referencia-del-objetivo.tsx`, la parte del objetivo de `nutrition/formularios.tsx`, el
  editor del plan, los rangos y los estilos de las filas de campos. Los estilos nuevos van en un bloque propio al final
  de `globals.css`.
- Resumen: «Nueva evaluación» de Nutrición usa el mismo formulario nuevo; la evaluación más reciente se ve como hoy.

## 5. La confirmación en la APK (RP-15, verificado en `apps/mobile/src/pantallas/formularios.tsx`)

Una propuesta parcial ya deja completar el resto, sin cambiar la APK:
- «Revisá lo que cargó {profesional}» muestra cada pregunta pedida; lo que no se cargó dice «Sin responder».
- «Confirmo que son mis datos» revisa con `validarRespuestasV2` antes de enviar: si falta una obligatoria, abre el
  formulario con lo cargado, en la parte de la primera que falta, y la marca. Lo que responde ahí viaja con `fromProposal`
  (API-FRI-04) y queda en `correctedFieldCodes` como «sumado».
- «Corregir» abre el formulario completo con lo cargado: ahí responde también las opcionales que el profesional no cargó.

Por eso **no hace falta una APK nueva**. Lo que sí se puede pulir en la próxima APK (sin pedido): decir arriba de la
revisión cuántas preguntas quedan sin responder y ofrecer «Completar lo que falta» en lugar de mostrarlo como un problema
al confirmar.

## 6. Decisiones de continuador (a ratificar)

| ID | Decisión | Por qué | Alternativa |
|---|---|---|---|
| EI-D01 | **Los tres bloques y «Completarlo ahora» van en Nutrición.** Entrenamiento recibe la franja, la fecha automática, «Anotaciones» y la carga con lo crítico primero; su evaluación sigue con sus filas y «Formularios que respondió». | Es la que recorrió Dirección y la única con calculador: «Lo que necesita el cálculo» es de Nutrición. | Los mismos bloques en Entrenamiento, sin el tercero (la próxima tanda). |
| EI-D02 | **Edad de la toma; sexo, lo elige el profesional.** El perfil propio tiene solo el nombre (DL-169): ni fecha de nacimiento ni sexo. La toma registra la edad; el sexo no es un dato de la toma (DL-186). | No se inventa un dato del perfil que no existe. | Sumar la fecha de nacimiento y el sexo al perfil de la persona: es una decisión de producto y legal (dato sensible). |
| EI-D03 | **Peso y talla declarados: la regla está, el dato no.** Ningún formulario pregunta el peso ni la talla (DL-164: «el peso en sí lo vemos en la toma de medidas»). «Vale el medido y el declarado al lado» está en el dominio con su prueba, y se activa sumando el código del campo a `CAMPOS_DEL_CALCULO`. | No se agregan preguntas a una plantilla vigente (sería una versión nueva, con su migración) sin pedido. | Una versión nueva de «Cómo comés hoy» con peso y talla declarados. |
| EI-D04 | **Fuente y procedencia de lo registrado.** La toma, «observado»; lo respondido, confirmado, compartido o cargado, «informado». Lo que el profesional cambia, también «informado»: si lo midió, es una toma de Antropometría. La procedencia de cada dato va en `evidenceReferences` en palabras («Peso: toma del 10/11/2026»). | `methodStatement` es el método de un dato calculado (DL-048); `evidenceReferences` es texto libre de la evaluación y nadie más lo lee. | Elegir la fuente en cada renglón (lo que Dirección no quiso ver). |
| EI-D05 | **Se vinculan todos los formularios que muestra «Lo que contó».** Al registrar, sin casillas, hasta 20 (EVF-D05), con la versión vista. Se desvinculan después desde la evaluación registrada, como hoy. | Es lo que el profesional tuvo a la vista al evaluar; una casilla por formulario era la planilla que no cerraba. | Las casillas de EVF-04. |
| EI-D06 | **«Anotaciones» es `professionalNotes` de la evaluación**, hasta 4000 caracteres, y no una nota propia (NPP): una nota propia admite 1000, se ata a un ejercicio o a una comida, y atarla a una evaluación cambiaba la forma de API-NPP-01 y 02. Ninguna lectura de la persona devuelve una evaluación. Como la evaluación no se edita (REG-06-97), se escriben al registrar; lo que se agregue después va en una nota propia. | Encaja sin operaciones nuevas y ya es privado. | Un ancla `EVALUATION` en NPP, en operaciones nuevas. |
| EI-D07 | **«Cambiar» en cada dato.** Abre el campo en el renglón; lo cambiado dice «Cargado por vos» y deja el valor anterior al lado. Vaciarlo deja «Sin indicar». | Que se vea de dónde salió lo que se registra. | Un formulario aparte para editar. |
| EI-D08 | **Qué crea «Completarlo ahora».** El formulario vigente del área, con las preguntas y las obligatorias que trae la plantilla (`marcadoPorOmision`) y su «para qué» sugerido; «Tus hábitos» si el dominio sugiere sumarlo (`sugerenciaDeSumarHabitos`). Si hay otros formularios del área o transversales que puede pedir, o hábitos recientes, se muestran para tildar antes de «Seguir». Cada pedido con su clave; si uno falla, se dice cuál, y lo creado queda. | Es lo mismo que «Pedir información» con lo que viene marcado, en un clic. | Abrir «Pedir información» completo. |
| EI-D09 | **Una solicitud pendiente se completa sin crear otra.** «Se lo pediste el …» abre «Cargar con la persona» sobre esa (y sobre la de «Tus hábitos», si también está pendiente). | No duplicar pedidos a la persona. | Crear una nueva. |
| EI-D10 | **La lista de críticos de §3**, por clave de plantilla, en el dominio. En las versiones con la parte «Tus hábitos» cuentan también los de hábitos. | Lo pidió Dirección; la lista es una propuesta del ejecutor. | Otra lista. |
| EI-D11 | **La APK no cambia** (§5). | Ya deja completar lo que falta. | El pulido de §5 en la próxima APK. |
| EI-D12 | **«antes → después» solo cuando el antes quedó en la evaluación.** Al confirmar, la propuesta se borra (DL-164 D-6): el antes de una respuesta corregida no queda en ningún lado, salvo en la evaluación si el profesional lo registró (los datos del cálculo). Para el resto: «{nombre} corrigió «pregunta»: ahora dice …». | No guardar lo que la persona dijo que no era así. | Guardar el antes en la transcripción (cambia D-6 y la forma de API-FRI-03). |
| EI-D13 | **RP-02 en Entrenamiento**: el editor deja de recibir `sinPlanActivo` desde el Plan, sin tocar el editor. | El editor es del otro frente. | — |
| EI-D14 | **La fecha sin cambiar es la del registro**, no la de abrir el formulario. Con «cambiar», no puede ser posterior a ahora. | «El momento de la carga» es cuando se registra. | La de abrir el formulario. |
| EI-D15 | **El punto de unión con el calculador** es una función del dominio, `datosDelCalculoEnLaEvaluacion`; el calculador no se tocó. | El calculador es del otro frente. | — |
| EI-D16 | **La franja:** un paso listo se abre tocándolo (muestra su resumen: la evaluación registrada con sus formularios vinculados y las correcciones; el objetivo vigente); el actual está abierto; los que vienen no se abren. | «Solo el paso actual queda abierto», sin perder lo que había debajo de «Registrada el …» (EVF-05). | Los pasos listos sin abrir. |

## 7. Pendiente legal

- **Ley 26.529, art. 14:** la persona es titular de su historia clínica. Si la evaluación y sus «Anotaciones» son parte de
  ella, la persona puede pedirlas, aunque no las vea en la app. Hoy la exportación propia (UF-06) no incluye las
  evaluaciones de Nutrición ni de Entrenamiento. **Lo revisa el abogado**, con el resto del legajo legal (DL-164 D-8):
  si las anotaciones entran en la exportación y cómo se le dice al profesional que escribe.

## 8. Oráculos

- **Dominio** (`packages/domain/src/evaluacion-inicial.test.ts`): TEST-EVI-001 (los críticos: pedidos, visibles, en
  orden, con hábitos en las versiones con la parte), 002 (lo que necesita el cálculo: medido antes que declarado, el
  declarado al lado, cada origen con su fecha, lo cambiado), 003 (lo que se registra: fuente, unidad y procedencia), 004
  (el punto de unión con el calculador, también con evaluaciones anteriores), 005 (la corrección: antes → después y
  ahora dice), 006 (los textos sin el vocabulario prohibido).
- **Integración** (`test/integration/evaluacion-inicial.int-spec.ts`): TEST-EVI-010 (las anotaciones no llegan a ninguna
  lectura de la persona, en las dos áreas, y la persona recibe el 404 de lo inexistente).
- **Website** (`apps/web/test/evaluacion-inicial.test.mjs`): TEST-EVI-020 a 026 (la franja, la fecha, los tres bloques y
  dónde se montan, lo que se vincula al registrar, «Completarlo ahora», lo crítico primero en «Cargar con la persona», sin
  «BE no calcula» ni «Todavía no hay un plan activo» de más, y nada de la persona en el navegador).

## 9. Lo que queda

- Ratificar EI-D01 a EI-D16, y la lista de críticos (§3).
- Que el calculador arranque con `datosDelCalculoEnLaEvaluacion` (EI-D15, frente del objetivo).
- Los tres bloques en Entrenamiento (EI-D01).
- Las capturas en la CI (el trabajo «Evaluación y formularios» de `capturas-de-la-planificacion`) y la prueba con un
  lector de pantalla.
- El pendiente legal (§7).
