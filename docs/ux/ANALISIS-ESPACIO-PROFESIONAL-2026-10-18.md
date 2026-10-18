# Espacio profesional sin vueltas: análisis de los flujos del profesional

**Fecha:** 2026-10-18. **Pedido de:** Dirección, al no encontrar dónde crear el plan de una persona nueva: «quiero que veas
los flujos y qué tan intuitivos son los pasos que debe seguir el profesional, que saques el ruido visual o las
explicaciones […], pero debería ser intuitivo; haz un análisis exhaustivo, con las leyes de heurística o los últimos
avances en esas áreas».
**Registro:** DEUDA_LEGAJO DL-145 (lo implementado) y DL-144 (los formularios de inicio, a decidir).
**Versión para leer, con las capturas:** publicada para Dirección el mismo día (página privada).

## Cómo se hizo

- **Recorrido real en el website de test**, como demo.pt (el profesional de demostración de Entrenamiento), sin escribir
  nada: 23 pantallas a 1440 × 900, en el tema Claro. Una persona nueva (la cuenta de prueba de Dirección, recién
  vinculada) y una con historia (A01).
- **El código de cada flujo** (`apps/web/src/app/pro`), para contar los pasos y ubicar cada texto.
- **Criterios:** las 10 heurísticas de Nielsen; las leyes de Tesler, Hick, Jakob, Miller y Fitts; las guías de NN/g
  sobre ayudas emergentes, estados vacíos y divulgación progresiva; la investigación sobre el primer clic (Bailey y
  Wolfson, 2009; MeasuringU); y lo que hace el mercado (Everfit, Trainerize).
- **Límite:** es una evaluación experta, no una prueba con usuarios. La prueba con cinco profesionales queda en el plan.

## El hallazgo principal: el plan tiene dos llaves escondidas

Para planificar, BE exige un objetivo vigente, y el objetivo se funda en una evaluación (B10-06; 09v10:613). La regla
tiene sentido: el plan sale de un punto de partida y de una meta. Pero la pantalla la presentaba al revés y sin camino:
- en **Plan** no había botón: decía «primero definí el objetivo» y mandaba a Resumen;
- en **Resumen**, el botón del objetivo estaba apagado, y lo que faltaba estaba en gris chico: «registrá una evaluación
  primero»;
- la evaluación estaba al final de la página, debajo del objetivo que depende de ella.

| | Pasos hasta el editor del plan |
|---|---|
| **Antes** | Abrir la ficha → abrir Entrenamiento → Plan (**sin botón**) → volver a Resumen (**objetivo apagado**) → bajar a Evaluaciones, completar y guardar → subir al objetivo, completar y guardar → volver a Plan → «Crear plan». 4 pantallas y 2 callejones. |
| **Ahora** | «Empezar el plan» desde Pendientes, la ficha o el Plan vacío → los tres pasos en orden, en la misma pantalla → el editor. |

La regla del legajo queda igual; lo que cambia es quién carga con ella (ley de Tesler: la complejidad no desaparece, se
mueve). Hoy el profesional tenía que descubrir el orden; ahora se lo da BE.

## Los hallazgos, del más grave al más leve

La gravedad sigue la escala de Nielsen: **bloquea** si impide la tarea, **grave** si la demora o la confunde, **molesta**
si la ensucia sin frenarla.

1. **Bloquea · El primer plan, escondido detrás del objetivo y de la evaluación.** El de arriba.
2. **Grave · Los pendientes dicen qué falta, pero el botón no lo dice.** 8 de los 9 pendientes de demo.pt decían «Sin
   plan activo», y todos los botones, «Abrir». El primer clic decide la tarea: Bailey y Wolfson midieron 87 % de éxito
   con el primer clic correcto y 46 % sin él; MeasuringU encontró diferencias distintas según el caso, siempre a favor del
   primer clic correcto. Ley de Fitts: la acción, junto al dato.
3. **Grave · Treinta y dos ayudas para explicar pantallas.** 21 explicaciones plegables y 11 «Cómo se lee esta vista»;
   la de la ficha tenía diez párrafos, con las reglas del objetivo de Nutrición también para un profesional solo de
   Entrenamiento. Heurística 10: lo mejor es que el sistema se use sin documentación. NN/g: lo que hace falta para
   completar una tarea no va escondido en una ayuda. Heurística 8: cada texto de más compite con el que importa.
4. **Grave · La ficha de una persona nueva muestra lo que no aplica, y no muestra lo único que sirve.** Indicadores le
   sugería «un período más largo» a alguien sin ningún dato; había «Notas recientes del equipo» sin equipo, cuatro
   preguntas sobre un plan que no existe y «Vista parcial» aunque el profesional veía todo lo suyo. La tarjeta del área
   decía «Sin datos registrados todavía», sin un botón para empezar. Divulgación progresiva; ley de Hick.
5. **Molesta · Palabras del sistema en lugar de palabras del oficio.** «Nueva versión de objetivo» para el primero (en
   Nutrición ya decía «Definir el objetivo»); «Solicitar contexto» y «Pedir información» para lo mismo; «Alcance» y
   «Área»; «Finalidad: —» vacío; «Constancia técnica». Heurísticas 2 y 4; ley de Jakob.
6. **Molesta · El encabezado de la ficha tiene once elementos.** Lo que está siempre a la vista pierde peso. Ley de
   Miller.
7. **Molesta · Sumar a una persona pide datos que BE ya sabe.** Elegir el área con una sola; «Alcance» y «Finalidad: —»
   al solicitar un vínculo.
8. **Molesta · «Mis ejercicios» está siempre en modo edición.** Cuatro ejercicios ocupaban 3.124 píxeles, cada uno con
   el selector de archivo y tres renglones de procedencia.
9. **Molesta · Vacíos que mandan a otro lado sin llevar.** «Se guardan desde una versión de plan», sin enlace; tres
   plegables «Quién ve tus…» en la misma página.
10. **Molesta · Filtros en cero sobre listas vacías.** Registros mostraba cuatro filtros en 0 y dos aclaraciones sobre
    «Todavía no hay sesiones registradas».

## La regla para cada texto

Cada texto de una pantalla pasa por tres preguntas:
- **¿Hace falta para decidir?** Va al lado del dato, corto (el contexto del dato no se pliega: GUIA-UX-UI I.2).
- **¿Es una regla del legajo que hay que decir?** Se dice una vez, en el momento de actuar.
- **¿Explica cómo funciona la pantalla?** Se saca. Si sin él no se entiende, se cambia la pantalla.

Las once «Cómo se lee esta vista» no se borraron: se leen juntas en la **Guía del espacio profesional** (`/pro/guia`), que
guarda también lo que el legajo exige poder leer (DL-113).

## La idea de Dirección: formularios de inicio (DL-144)

BE ya tiene tres formularios base sembrados («Salud», «Hábitos y contexto», «Antecedentes para entrenamiento»), y la
evaluación ya cita sus respuestas (DL-102). Hoy el profesional los manda a mano. Opciones:
- **A · BE los pide solo, al aceptar el vínculo (recomendada):** en el mismo recorrido del teléfono, después del permiso
  de datos de salud (DL-143). El profesional elige cuáles por defecto y puede pedir que se actualicen. Usa la solicitud,
  la respuesta, el consentimiento y las citas que ya existen, y cada respuesta va a quien la pidió, para un fin concreto.
  Es lo que hace Everfit con su «Onboarding Flow».
- **B · Un perfil de salud propio, sin que nadie lo pida:** descartada por ahora; junta datos de salud sin un fin concreto
  y es un concepto nuevo del legajo.
- **C · Un botón «Enviar los formularios de inicio»:** el mínimo, para las personas ya vinculadas; convive con A.

Si algún día se usa el PAR-Q+, va completo y sin cambios. Los formularios de BE son preguntas de producto, no un
instrumento clínico (DL-100).

## El primer día, como debería ser

1. El profesional invita a la persona (link o QR).
2. En el teléfono, la persona acepta, autoriza al profesional, da el permiso de datos de salud y completa los
   formularios de inicio.
3. Al profesional le llega una novedad.
4. En Pendientes, la fila dice «Sin plan activo», con «Empezar el plan».
5. Evaluación inicial (con las respuestas citadas), objetivo y plan, en una pantalla.
6. Activa el plan; a la persona le llega el aviso y lo ve en «Hoy».

## Qué se implementó antes de la entrega (DL-145, E-1 a E-7)

- «Empezar el plan» en Nutrición y en Entrenamiento, con sus entradas desde Pendientes, la ficha y el Resumen del área.
- El verbo de cada pendiente.
- La Guía del espacio profesional, con las ayudas de todas las vistas.
- La limpieza de textos.
- El vocabulario que no espera una decisión.
- La ficha según el momento de la persona.

## Qué queda para después

- Los formularios de inicio (DL-144).
- El área ya elegida al invitar, cuando el profesional trabaja en una sola (hace falta ese dato de la API).
- El encabezado de la ficha (toca las maquetas validadas el 2026-10-10).
- «Mis ejercicios» como grilla.
- «Activo · acceso contextual» y «Crear nueva versión a partir de esta», si Dirección los cambia.
- **Una prueba con cinco profesionales:** «armá el plan de esta persona nueva», sin ayuda. Se mide si lo logra, cuánto
  tarda, dónde hace el primer clic y «¿qué tan fácil fue?», del 1 al 7. En el producto: el tiempo desde que la persona
  acepta hasta el primer plan activo, cuántos vínculos nuevos tienen plan a los siete días y cuántas veces se abre la
  guía en las tareas de todos los días.

## Fuentes

- Nielsen Norman Group: *10 Usability Heuristics*; *Tooltip Guidelines*; *Designing Empty States in Complex
  Applications*; *Progressive Disclosure*; *Why You Only Need to Test with 5 Users* (nngroup.com).
- MeasuringU: *The Importance of the First Choice in Website Navigation*, con el estudio de Bailey y Wolfson (2009), y
  *Do Click Tests Predict Live Site Clicks?* (measuringu.com).
- Jon Yablonski, *Laws of UX* (lawsofux.com).
- Everfit, *Introducing Onboarding Flow* (blog.everfit.io).
- PAR-Q+ Collaboration (eparmedx.com).
