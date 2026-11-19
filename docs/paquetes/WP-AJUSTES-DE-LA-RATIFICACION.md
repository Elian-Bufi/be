# WP-AJUSTES-DE-LA-RATIFICACION · los ajustes de la ratificación de Dirección del 19/11

> Rama `wp-ajustes-de-la-ratificacion`, sobre main `f4fa73eb` (con DL-178 a DL-182 integradas). Es un paquete chico, sin
> DL propia: cada punto ajusta una decisión ya declarada (CTX-D08, ENP-D01, CMP-D8 de DL-176, GR-VD08, DL-108 D-3) o
> aplica una regla de Dirección del mismo día («Sin indicar»). Cada punto tiene su prueba, que falla sin el arreglo.

## Los puntos

1. **CTX-D08 · la nota de la medicación ubica, no indica.** La nota dice por qué el dato importa y nada más:
   «Algunas medicaciones cambian el pulso o la respuesta al esfuerzo.» (Entrenamiento) y «Algunas medicaciones van con
   horarios o con algún alimento.» (Nutrición). Sin consejo de dosificación: la decisión es del profesional.
2. **ENP-D01 · «Bloque N» se lee «Fase N».** Las fases de planes viejos que guardaron el nombre automático «Bloque N»
   se muestran «Fase N» en el editor, la versión activa, lo compartido, la hoja del plan, el detalle de la plantilla, la
   historia anterior y la APK (`nombreDeLaFase`). El dato guardado no cambia; un nombre propio queda tal cual.
3. **CMP-D8 (DL-176) · compartir en la APK.** «Elegir qué compartir» y «Ahora no» son botones a la vista, no un enlace
   chico: el consentimiento es libre (Ley 25.326, art. 5) si decir que no está tan a mano como decir que sí.
4. **GR-VD08 · «Analizar» sin nada que mostrar.** La pregunta con gráficos muestra su título y un estado vacío que dice
   por qué (`porQueNoHayGraficos`): el área que hoy no se ve, el par de áreas que pide el cruce, o lo que falta en el
   período.
5. **La nota de origen de Nutrición** dice la versión de la plantilla que se aplicó. La lectura de la plantilla
   nutricional trae solo la vigente: si la aplicada es esa, se dice su número; si no, «con una versión anterior a la
   vigente (hoy va por la versión N)». Sin operación nueva en la API (decisión del 19/11).
6. **DL-108 D-3 · al guardar como plantilla.** Además de las notas, se listan para confirmar o vaciar uno por uno los
   nombres (fases, microciclos, sesiones y bloques; en Nutrición, días tipo, comidas y opciones), los parámetros del
   profesional de cada ejercicio y la referencia del %RM. Un nombre no puede quedar vacío: vaciarlo lo cambia por el de
   su lugar («Fase 2», «Sesión A», «Bloque 1»). Un parámetro se quita entero; la referencia queda sin referencia.
7. **«Sin indicar» en todas las pantallas.** Un valor que el profesional no indicó se dice «Sin indicar»: en seguimiento
   y gráficos, en el editor de series, la versión activa, los registros de Entrenamiento y la APK (el texto compartido
   del dominio `COPY_ENTRENAMIENTO_POR_SERIE.sinObjetivo`). En los registros: «Sin indicar: no se compara»,
   «Repeticiones y RIR sin indicar» y «Nada indicado que comparar». «sin dato» (un dato que el catálogo no tiene, o que
   no se registró) es otra cosa y se queda. La APK va en la próxima candidata, sin compatibilidad con las anteriores.
8. **El catálogo de ejercicios a 1280 × 800.** «Prescripción para todos» va plegada y comparte renglón con el aviso del
   catálogo; con una búsqueda hecha y sin habituales, la explicación de cómo se marcan deja el lugar a los resultados.
   A 1280 × 800 se ven al menos 3 resultados sin desplazar (lo exige la escena 11 de las capturas).

## Los nombres comunes que no se listan (punto 6)

Dirección (19/11): los nombres que no nombran a nadie no se listan para revisar, así la lista muestra solo lo que puede
nombrar a la persona. Se comparan sin tildes, sin mayúsculas y con los guiones como espacios, y cada uno puede llevar
detrás un número o una letra («Piernas A», «Colación 2», «Pre-entreno»). Están en `plantillas-de-plan.ts`
(`esNombreGenerico`):

- **De su lugar:** fase, bloque, microciclo, semana, sesión, día tipo, día, comida, opción.
- **Nutrición:** desayuno, media mañana, almuerzo, merienda, media tarde, cena, colación, pre entreno, post entreno; y
  los días tipo que propone BE: día habitual, día de entrenamiento, día de descanso.
- **Entrenamiento:** un grupo muscular o una parte del cuerpo, solos (pierna, piernas, torso, core, tren superior, tren
  inferior, cuerpo completo, full body, empuje, tracción, pecho, espalda, hombro, brazo, glúteo, abdomen, cadera,
  gemelos, cuádriceps, isquiotibiales, bíceps, tríceps), y lo que dice qué se trabaja (principal, complementarios,
  accesorios, calentamiento, vuelta a la calma, movilidad, fuerza, hipertrofia, potencia, resistencia).

Cualquier otro nombre se lista, aunque no nombre a nadie («Café con leche, pan y queso»): decide el profesional. Un
nombre común con algo más («Torso de Diego», «Desayuno de Ana») se lista.

## Las capturas

- **Planificación de Entrenamiento:** la 11 (3 resultados a 1280 × 800), la 11b (el campo abierto), la 15 (la fase
  guardada «Bloque N» se lee «Fase N»: la herramienta guarda así la fase de Diego) y la 15b («Guardar como plantilla»
  con los parámetros y sin los nombres comunes).
- **Planificación de Nutrición:** la 06b («Guardar como plantilla» con los nombres, sin las comidas del día).
- **Gráficos:** la 24, «Ver la relación» abierta por el entrenador, con su estado vacío.
