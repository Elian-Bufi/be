# WP-CONTEXTO-DE-LA-PERSONA — el contexto de la persona a mano mientras se planifica

> **La decisión de Dirección (2026-11-18), textual:** «el profesional tiene que tener el contexto de la persona a mano
> mientras planifica, sin salir del editor. Hacelo como sería en el mejor sistema, analizalo de todas las áreas, al más
> alto nivel, con las mejores prácticas y la teoría actualizada en cada área».
>
> Rama `wp-contexto-de-la-persona`, desde `main` (e13a5583). Registro en `docs/DEUDA_LEGAJO.md` (**DL-179**). Las
> decisiones de continuador (**CTX-D01 a CTX-D18**) y las propuestas (**CTX-P01 a CTX-P09**) están **a ratificar**.

## 0. Lo que había y lo que cita

**El problema.** Para planificar, el profesional tenía que salir del editor e ir a otra pestaña: los formularios en
«Información», el cuerpo en Antropometría (si la llevaba), lo de otras áreas en el Resumen de la ficha y sus notas en el
bloc del Resumen. Cada salida corta la planificación, y con un plan sin guardar, además, pregunta antes de irse
(ED-02). La evaluación de Entrenamiento ya citaba respuestas (DL-102), pero solo desde su propio formulario y solo las
de Entrenamiento; la de Nutrición no citaba nada.

**Lo que cita.**
- **04 RF-036** (la evaluación con «autoría, fecha, contexto y fuentes»), **RF-057** (coordinar sin transferir), **RF-071**
  (la información profesional pertinente).
- **06 §20.4** (la pertinencia: Vínculo + Alcance + B2 + PDP), **REG-06-109** (cada dato con su fuente), **CA-FOR-04** (lo
  declarado sigue siendo `SELF_REPORTED`: citarlo no lo vuelve observación).
- **08 §11-bis** (lo de otras áreas, sin candado ni hueco), **08 §19.7** (la persona ve quién miró lo que comparte), **08
  §27.3** (sin caché de datos de salud en el navegador), **08 §9.15** (sin notas secretas sobre la persona hacia otros).
- **10-B10:407** (el «no disponible» neutral), **B05** (sin «cumplimiento», «adherencia», «racha» ni «puntaje»).
- **Precedentes de BE:** DL-102 (la cita en la evaluación de Entrenamiento), DL-137 D-7 (lo nuevo va en operaciones
  nuevas), DL-163 D-13 y TA-85 a TA-92 (lo de otras áreas), DL-164 y DL-165 (los formularios de inicio), DL-173 (las notas
  propias, PG-D11), DL-176 (WP-COMPARTIR), y la decisión del 18/11 sobre los «%» (solo con su base y su número).

## 1. Qué consideran imprescindible los mejores profesionales antes de planificar

Lo que sigue es el criterio de «Lo importante». Se investigó qué piden las guías vigentes de cada área antes de prescribir,
y se cruzó con lo que los formularios de BE **realmente** preguntan (`packages/domain/src/plantillas-de-inicio.ts`). Lo que
las guías piden y BE no pregunta queda propuesto en el §6, sin inventar campos.

### 1.1 Entrenamiento

**Lo que dicen las guías.**
- **El tamizaje previo a la participación** (ACSM, *Guidelines for Exercise Testing and Prescription*, 11.ª ed., 2021,
  cap. 2; Riebe y col., *Med Sci Sports Exerc* 2015;47:2473, el algoritmo actual) pregunta tres cosas: si la persona hace
  actividad física hoy, si tiene enfermedad cardiovascular, metabólica o renal conocida, y si tiene signos o síntomas
  (dolor de pecho, falta de aire desproporcionada, mareos o síncope, palpitaciones). Con eso decide si hace falta el visto
  bueno médico y con qué intensidad se arranca.
- **El PAR-Q+** (Warburton y col., *Health Fit J Can*, versión 2024 del PAR-Q+ Collaboration) son siete preguntas
  generales de sí o no; un «sí» deriva a las preguntas de seguimiento o a un profesional de la salud. «Antes de entrenar»
  tiene las siete (corazón o presión, dolor de pecho, mareos, otra enfermedad crónica, medicación para una enfermedad
  crónica, huesos y articulaciones, supervisión médica).
- **La medicación que cambia la frecuencia cardíaca:** con betabloqueantes, algunos bloqueantes cálcicos o digoxina, la
  frecuencia cardíaca deja de servir para dosificar, y se usa el esfuerzo percibido (ACSM 2021, cap. 6 y apéndice A). Con
  insulina o sulfonilureas importa el horario y lo que comió antes (ADA, *Standards of Care in Diabetes* 2025, sección 5).
  BE no clasifica fármacos: muestra lo que la persona escribió, y lo dice.
- **Lesiones, dolor y cirugías:** la zona, cuándo molesta (solo al esforzarse, en el día o casi siempre) y si hay alguien
  tratándolo o un alta, porque cambian qué se trabaja ya y qué espera (NSCA, *Essentials of Strength Training and
  Conditioning*, 4.ª ed., 2016, cap. 17 y 21, el análisis de necesidades; consenso de Ardern y col. sobre la vuelta al
  deporte, *Br J Sports Med* 2016;50:853).
- **La experiencia y el nivel** (entrenado o no, años con fuerza, la técnica de los patrones básicos y el uso del RIR), que
  definen el volumen y la progresión inicial (ACSM, *Position Stand: Progression Models in Resistance Training*, 2009;
  Helms y col. sobre RIR, *Strength Cond J* 2016).
- **La disponibilidad real** (días, momento y minutos), **el lugar y el equipamiento**, **las otras actividades de la
  semana** (la carga que ya hay) y **el objetivo de la persona en sus palabras**, con su fecha si la tiene.
- **El descanso y el estrés** como moduladores de la carga (Kellmann y col., consenso sobre recuperación, *Int J Sports
  Physiol Perform* 2018;13:240).

**Lo que BE captura y muestra** (FRM-ENTRENAMIENTO v1 a v4, FRM-HABITOS v1 y v2):
| Grupo | Campos |
|---|---|
| Salud antes de entrenar (PAR-Q+) | `trn_salud_corazon`, `trn_salud_dolor_de_pecho`, `trn_salud_mareos`, `trn_salud_cronica` (+ `trn_salud_cronica_cual`), `medicacion_relevante` (+ `trn_medicacion_cual`), `trn_salud_huesos`, `trn_salud_supervision`, `trn_embarazo`, `trn_apto_medico`, `fuma` |
| Dolor, lesiones y cirugías | `dolor_o_lesiones`, `trn_zonas`, `trn_dolor_cuando`, `trn_movimientos_que_molestan`, `trn_dolor_tratamiento`, `trn_cirugias` (+ `trn_cirugias_cual`) |
| Experiencia y nivel | `trn_experiencia`, `trn_experiencia_en_fuerza`, `trn_tecnica`, `trn_resistencia_hoy`, `trn_rir`, `trn_cargas` |
| Disponibilidad y equipamiento | `trn_dias_por_semana`, `trn_dias_y_horario` (o `trn_dias_posibles` y `trn_franja`), `trn_minutos_por_sesion`, `trn_lugar_y_equipamiento`, `trn_equipamiento` |
| Lo que ya hace en la semana | `habitos_deportes` (o `trn_otros_deportes`), `nivel_de_actividad` |
| Descanso | `horas_de_sueno`, `habitos_estres` (o `trn_estres`) |
| Lo que busca | `trn_objetivo_principal`, `trn_objetivo_declarado`, `trn_fecha_importante` |
| Preferencias | `trn_preferencias`, `trn_aerobico`, `trn_no_quiero` |

### 1.2 Nutrición

**Lo que dicen las guías.**
- **El Proceso de Atención Nutricional** (Academy of Nutrition and Dietetics, eNCPT 2024, dominio *Assessment*) ordena la
  evaluación en cinco grupos: la historia alimentaria (patrón, horarios, quién cocina, dónde come, acceso y presupuesto),
  la antropometría, los datos bioquímicos, los hallazgos físicos y la historia de la persona (diagnósticos, medicación,
  suplementos, situación social).
- **Lo que nunca se pasa por alto:** las alergias diagnosticadas (la exclusión es absoluta, también como ingrediente;
  NIAID/EAACI, guía de alergia alimentaria 2020-2024), las intolerancias y la celiaquía, y si están diagnosticadas.
- **Las patologías que cambian el plan:** diabetes (ADA 2025, sección 5), enfermedad renal (KDOQI, *Clinical Practice
  Guideline for Nutrition in CKD*, 2020), hígado graso, dislipemias, hipertensión, enfermedad intestinal, reflujo, y si el
  médico indicó algo.
- **La medicación** por sus interacciones con alimentos y horarios (levotiroxina en ayunas, warfarina y vitamina K,
  metformina y B12, los agonistas de GLP-1 y el hambre), y los suplementos.
- **Los trastornos de la conducta alimentaria, con cuidado** (AED, *Medical Care for Patients with Eating Disorders*, 4.ª
  ed., 2021; NICE NG69, 2017, actualizada en 2020): no poner números en primer plano, trabajar en equipo con salud mental,
  y no exponer el antecedente más de lo necesario.
- **Embarazo y lactancia,** que piden el plan junto al médico.
- **El patrón y las preferencias:** el estilo (vegetariano, vegano, sin carnes rojas), las restricciones culturales o
  éticas, lo que no come y por qué, lo que no quiere cambiar, el ritmo de cambio que prefiere y los planes anteriores.
- **El día tipo:** los horarios, la jornada, las comidas que hace y las que saltea, el hambre, el fin de semana, comer
  afuera, el picoteo, las bebidas (el mate, el alcohol).
- **La logística:** quién cocina, el tiempo, el equipamiento y el presupuesto (eNCPT, *food/nutrition-related history:
  access*).

**Lo que BE captura y muestra** (FRM-NUTRICION-INICIO v1 a v3, FRM-HABITOS v1 y v2):
| Grupo | Campos |
|---|---|
| Alergias e intolerancias | `nut_alergias` (+ `nut_alergias_cuales`), `nut_intolerancias` (+ `nut_intolerancias_quien`) |
| Salud que el plan tiene en cuenta | `condiciones_declaradas` (+ `nut_condiciones_indicacion`), `medicacion_relevante` (+ `nut_medicacion_cual`), `nut_suplementos`, `nut_embarazo`, `nut_digestion` (+ `nut_digestion_que`), `nut_peso_reciente` |
| Conducta alimentaria (con cuidado) | `nut_tca` |
| Patrón y preferencias | `nut_estilo`, `nut_alimentos_no`, `nut_no_negociable`, `nut_alimentos_si`, `nut_ritmo_de_cambio`, `nut_planes_previos` (+ `nut_planes_previos_que`) |
| Horario y día tipo | `habitos_horarios` (o `nut_horarios`), `nut_jornada`, `nut_comida_en_jornada`, `nut_momentos`, `nut_saltea` (+ `nut_saltea_por_que`), `nut_mas_hambre`, `nut_fin_de_semana` (+ qué cambia), `nut_afuera`, `nut_picoteo`, `nut_hora_de_entrenamiento` |
| Bebidas | `nut_agua`, `nut_mate`, `nut_cafe_te`, `nut_gaseosas`, `nut_alcohol` |
| Logística | `nut_quien_cocina`, `nut_tiempo_para_cocinar`, `nut_equipamiento_cocina`, `nut_presupuesto` |
| Lo que busca | `nut_objetivo`, `nut_objetivo_propio` |

### 1.3 Antropometría

**Lo que dicen las guías.** ISAK (*International Standards for Anthropometric Assessment*, Esparza-Ros, Vaquero-Cristóbal
y Marfell-Jones, 2019) y la práctica de la composición corporal (Kasper y col., *Sports Med* 2021;51:1281 sobre la
estandarización) piden registrar las **condiciones de medición**, porque una toma solo se compara con otra tomada igual:
el protocolo y el método, la hora del día, quién midió, el ayuno y la hidratación, el ejercicio de las 24 horas previas,
la fase del ciclo menstrual cuando corresponde, la vejiga vacía y la ropa. Para la bioimpedancia, además, las
contraindicaciones (marcapasos, embarazo).

**Lo que BE captura y muestra:** el protocolo y el método (la ficha de comparabilidad, REG-06-162), la procedencia
(medida, informada o importada), la hora de la toma, quién la tomó y el contexto escrito de la evaluación. El ayuno, la
hidratación, el ejercicio previo y el ciclo **no se preguntan hoy**: quedan propuestos (CTX-P05).

## 2. El panel

**Dónde.** Un botón **«Contexto de <nombre>»** en el marco de las tres áreas (`marco-del-area.tsx`): está en el Resumen
(donde se escriben la evaluación y el objetivo), en el Plan (el editor), en Registros y en Revisiones, sin salir de la
sección. También se abre y se cierra con **Alt + C**. Con «Ocultar nombres», el botón dice «Contexto de» y la referencia
neutral de la persona, la misma que muestra el marco; sin nombre todavía, «Contexto de la persona».

**Cómo.** Un panel lateral, a la derecha:
- **con 1680 px de ancho o más** (por ejemplo, 1920 con Chrome al 100 %), va al costado y empuja: el editor sigue entero y
  legible al lado;
- **con menos** (1536, que es Windows al 125 %, y 1280), se abre como un cajón encima del editor, de 440 px como mucho y
  nunca más del 92 % del ancho. Tapa parte del editor sin comprimirlo, y se cierra con Escape, con la X o con el mismo botón.

Al cerrarse, el foco vuelve a donde estaba al abrirlo (el campo de la evaluación, si se abrió con Alt + C mientras se
escribía) o, si eso ya no está, al botón. Reabierto por lo que se recuerda (CTX-D18), al cargar la página, no le saca el foco
al editor. Es un `aside` con nombre («Contexto de Diego Sosa»), sus pestañas son un
`tablist` con flechas, y cada carga dice qué lee («Leyendo los formularios…») a un lector de pantalla con una región viva.

**Las pestañas.**
1. **Lo importante** (la que abre por omisión): lo del §1, ya ordenado por área, cada dato con su fuente
   («Formulario "Antes de entrenar" · 10 nov»), y «Citar» al lado si hay algo que lo reciba.
2. **Formularios:** las respuestas completas, agrupadas por formulario y por sección, con un buscador que busca en la
   pregunta y en la respuesta, sin tildes.
3. **Cuerpo:** la última toma y su cambio desde la anterior, métrica por métrica, con su unidad y su signo; si las dos tomas
   no son comparables (otro protocolo, método o unidad), no hay cambio y se dice por qué.
4. **Otras áreas:** por cada otra área, quién la lleva y lo que la persona comparte (el resumen y el plan vigente, en una
   línea, con «Ver el plan completo»); lo no compartido dice **«No compartido»** con **«Pedir acceso»** cuando hay un pedido
   que hacer. Nunca las notas privadas de otro profesional.
5. **Notas:** las notas propias del profesional sobre la persona (PG-16), con «Agregar una nota».

## 3. Las operaciones nuevas y las que cambian (DL-179)

| ID | Método y ruta | AuthN | Qué hace |
|---|---|---|---|
| API-CTX-01 | `GET /advisees/{adviseeId}/person-context/answers` | SESSION | Las respuestas vigentes de la persona a las Solicitudes **de quien consulta**, de las áreas en que hoy la acompaña con el PDP permitido, con cada pregunta en palabras, su valor estructurado y su versión para citar. Sin ninguna área permitida, el 404 de lo inexistente |
| API-CTX-02 | `GET /advisees/{adviseeId}/person-context/body` | SESSION | La última toma registrada y la anterior, por métrica, con el cambio solo si son comparables. Quien lleva Antropometría ve sus tomas enteras; a quien la persona le comparte el resumen de Antropometría (DL-163 D-13), el peso y la composición en kilos, con su método, de las tomas de quien la lleva hoy, y la lectura queda registrada para la persona (08 §19.7: en «Quién miró» de la APK, «Miró tu resumen de Antropometría»). Quien lleva Antropometría con la persona, aunque esté en pausa o sin su B2, no la ve por lo compartido: la ve por su Alcance, como API-RES-06. Si no, el 404 de lo inexistente |
| API-NUT-01 (cambia, aditiva) | `POST /advisees/{adviseeId}/nutrition/evaluations` | — | Acepta `formResponseReferences` opcional, con el mismo contrato y las mismas reglas que la de Entrenamiento (DL-102). Ausente es `[]`. La conducta alimentaria no se cita (el 422 neutral, también en Entrenamiento) |
| API-NUT-02 y 03 (cambian, aditivas) | las lecturas de la evaluación | — | Devuelven `formResponseReferences`, las respuestas citadas, como Entrenamiento |

Migración aditiva `20261118120000_citas_en_evaluacion_nutricional`: la tabla
`cita_de_respuesta_en_evaluacion_nutricional`, con las mismas guardias que la de Entrenamiento (solo agregar, pertenencia
por trigger, en la misma transacción que la evaluación). Ninguna operación de siempre pierde ni renombra nada.

Lo demás se **reusa**: API-HBT-05 (los hábitos que la persona comparte), API-RES-04, 06 y 08 (lo de otras áreas, el plan y el
pedido), API-HBT-06 y 07 (el pedido de ver los hábitos y su estado), API-NPP-01 y 02 (las notas propias) y API-DSH-03 (lo que el marco ya lee).

## 4. Decisiones de continuador (CTX-D01 a CTX-D18, a ratificar)

- **CTX-D01 · En el marco del área, en las tres.** El botón va en el marco común, así está en el editor, en la evaluación,
  en el objetivo y en las demás secciones sin repetirlo. Se suma Antropometría, porque sus condiciones de medición son su
  «Lo importante» y porque quien mide también planifica la próxima toma. Información, que es de las tres áreas y ya
  muestra los formularios, no lo trae. Alternativa: solo en Plan y Resumen de dos áreas.
- **CTX-D02 · Se monta una sola vez por área y no se vuelve a leer al cambiar de sección.** Las lecturas salen al abrirlo
  por primera vez (nunca al cargar la página: el panel cerrado no lee datos de salud) y se repiten con «Actualizar» del
  marco o con «Volver a leer» del panel. No hay caché fuera de la memoria de la pestaña (08 §27.3).
- **CTX-D03 · Al costado desde 1680 px; cajón debajo de eso.** A 1920 el editor queda en 1480 px; a 1536 o 1280,
  comprimirlo lo volvía ilegible (las tablas de series y las comidas no entran), así que el panel se superpone. Alternativa:
  comprimir hasta 1280 (descartada: el editor de Entrenamiento necesita ~1100 px).
- **CTX-D04 · Alt + C, también dentro de un campo.** El profesional quiere mirar algo mientras escribe la evaluación. En
  macOS se usa `event.code`, así Option + C no escribe «ç» antes de abrir.
- **CTX-D05 · «Lo importante» ordena por seguridad primero.** El orden es el mismo en las tres áreas: lo que puede hacer daño
  (alergias, PAR-Q+, medicación, lesiones), lo que limita (intolerancias, estilo, lo que no quiere), la logística (días,
  horarios, quién cocina, presupuesto) y lo que busca. Un grupo sin respuestas no aparece; si no hay nada, se dice qué
  formulario pedir.
- **CTX-D06 · Solo lo que respondió, en sus palabras, con su fuente.** BE no infiere ni clasifica (no dice «riesgo», no
  convierte una medicación en «betabloqueante», no suma puntajes). Cada renglón trae la pregunta resumida, la respuesta en
  palabras y la fuente: el formulario, la fecha y, si la corrigió, «corregida el …»; si se cargó con la persona, «cargado
  con vos, confirmado el …». «Prefiero hablarlo en persona» se muestra tal cual.
- **CTX-D07 · El PAR-Q+, pregunta por pregunta.** Si todas son «no», un renglón: «Las 7 preguntas de salud: todas "no"».
  Si alguna es «sí», cada «sí» en su renglón, con el apto médico al lado. No se cuenta «2 de 7»: no es un puntaje.
- **CTX-D08 · La medicación, con la frase de para qué se mira.** Entrenamiento: «Algunas medicaciones cambian el pulso o la
  respuesta al esfuerzo.» Nutrición: «Algunas medicaciones van con horarios o con algún alimento.» Es una nota fija del
  área, no una lectura del fármaco: ubica, no indica. Sin consejo de dosificación; la decisión es del profesional
  (ratificación de Dirección del 19/11).
- **CTX-D09 · La conducta alimentaria, con cuidado.** El renglón dice «Conducta alimentaria» (no el nombre del trastorno), lo
  que marcó («Contó un antecedente» o «Prefiere hablarlo en persona») y lo que el formulario le prometió («armar el plan
  sin números a la vista y junto con un profesional de la salud»). Va sin color, sin ícono de alerta, fuera del título del
  panel y de cualquier resumen, y no se puede citar: ni en la evaluación ni en el objetivo, y la API lo repite con el 422
  neutral. En «Formularios» también se rotula «Conducta alimentaria», y el buscador no la encuentra por los nombres que trae
  la pregunta. Solo lo ve quien pidió el formulario (es de Nutrición).
- **CTX-D10 · Solo los formularios propios.** El panel muestra lo que respondió la persona a las Solicitudes de **quien
  mira** (la regla de FRM-05 y de la cita, DL-102). Lo que contó a otro profesional llega solo por lo que la persona comparte
  (el resumen, el plan o sus hábitos), nunca la respuesta de otro: el texto de «resumen» lo promete («nunca incluye lo de
  salud de tus formularios»).
- **CTX-D11 · Los hábitos, de dos lados.** Si quien mira pidió «Tus hábitos», salen de su formulario. Si no, y la persona se
  los comparte (API-HBT-05), salen de «Mis hábitos», con esa fuente («Mis hábitos · lo compartió el 12 nov»).
- **CTX-D12 · «Citar» va a lo que se está escribiendo.** Cuando la evaluación de Entrenamiento o de Nutrición está abierta,
  cada respuesta citable de esa área tiene «Citar» y queda en la lista de citas del formulario, con la versión que se vio
  (DL-102: tope de 20, 409 si cambió, sin perder la selección). Las citas de un renglón (la respuesta y su detalle) entran
  juntas o ninguna; «Citada» se decide con la versión vista, así una respuesta que la persona corrigió se vuelve a citar
  después de «Volver a leer» y reemplaza a la vieja. Con el objetivo abierto, «Citar» suma al fundamento una
  línea con la cita y su fuente («Antes de entrenar · 10 nov: Días por semana: 3»): el objetivo se funda en una evaluación
  y su contrato no tiene citas; hacerlas estructurales queda propuesto (CTX-P07). **Al objetivo nunca va lo de salud**
  (la categoría `SALUD_Y_SEGURIDAD`): el objetivo viaja con el plan que la persona comparte (API-RES-06, «resumen y plan»)
  y el texto que aceptó promete que lo compartido nunca incluye «lo de salud de tus formularios»; lo de salud se cita en la
  evaluación, que no se comparte. Sin nada abierto, «Citar» no aparece.
- **CTX-D13 · Nutrición cita como Entrenamiento.** El mismo contrato (`formResponseReferences`), opcional en el pedido y con
  la lista en la lectura, la misma validación (respuesta de la persona, a una Solicitud propia, de alcance NUTRICION,
  vigente al citar), el mismo 422 neutral y el mismo 409. La validación se generaliza por área en un solo módulo.
- **CTX-D14 · El cuerpo, según cómo se llega.** Quien lleva Antropometría ve sus dos últimas tomas registradas, todas las
  métricas. Quien la recibe compartida ve lo que el texto aceptado promete: «de Antropometría, el peso y la composición en
  kilos, con su método», de las tomas de quien la lleva hoy, y su lectura queda en «Quién miró» de la persona («Miró tu
  resumen de Antropometría»). Quien lleva Antropometría con la persona, aunque esté en pausa o sin su B2, no la ve por lo
  compartido: la ve por su Alcance, como API-RES-06. Las tomas en preparación nunca. Sin una de las dos cosas, 404.
- **CTX-D15 · El cambio, solo entre comparables.** El cambio es la diferencia con su signo y su unidad, y además el «%» con
  su base y su número («−1,2 kg (−1,5 % de 80,0 kg)»), como pidió Dirección el 18/11. Sin colores de bien o mal. Entre dos
  tomas no comparables no hay cambio: «No se compara: otro protocolo».
- **CTX-D16 · Otras áreas, con lo que ya existe.** Las tarjetas de «Otras áreas» de la ficha (`otras-areas.ts`) se reusan
  tal cual; el panel suma el renglón «No compartido» cuando no hay nada, «Pedir acceso» (API-RES-08) para el plan de un área
  que lo tiene, y «Pedir ver sus hábitos» (API-HBT-06) para los hábitos. Para Antropometría, que no tiene pedido, «No
  compartido · lo decide la persona en "Quién ve qué"» (el pedido queda propuesto, CTX-P06).
- **CTX-D17 · Notas: las propias y nada más.** Las de PG-16 (solo su autor), con «Agregar una nota» en el mismo panel. Las
  notas de coordinación siguen en la Línea de tiempo: no son privadas y tienen su lugar.
- **CTX-D18 · Lo único que se recuerda en el navegador** es si el panel estaba abierto y la pestaña elegida, por área y en
  ese navegador. Ningún dato de la persona.

## 5. Las reglas, y dónde se prueban

| Regla | Dónde |
|---|---|
| Solo se ve lo que la persona autorizó | API-CTX-01 (Solicitudes propias + PDP del área), API-CTX-02 (PDP de Antropometría o la autorización de resumen vigente) · `test/integration/contexto-de-la-persona.int-spec.ts` |
| Lo ajeno o no autorizado = 404 de lo inexistente | Persona de otro, profesional sin vínculo, B2 revocado, vínculo en pausa, id malformado · mismo cuerpo (TEST-CTX-033); el cuerpo compartido retirado o en pausa (TEST-CTX-042); con dos áreas, el B2 revocado de una (TEST-CTX-043); quien lleva Antropometría, nunca por lo compartido (TEST-CTX-045) |
| Retirar un permiso corta, también en carrera | Las dos lecturas esperan a un corte en curso: el PDP (`be_bloquear_lo_que_corta`) y el cerrojo compartido de la autorización de resúmenes, como API-RES-06 (TEST-CTX-044, sin pausas) |
| Administración nunca ve datos de salud | Una sesión de Administración recibe 404 en las dos lecturas; el panel solo vive en `/pro` |
| Lo de salud no va al objetivo, que viaja con el plan compartido; la conducta alimentaria no se cita | `citasAdmitidas` y `fundamentoConCitas` (TEST-CTX-028), `CAMPOS_QUE_NO_SE_CITAN` (TEST-CTX-012) y `validarCitas` en la API |
| Ubicar, nunca calificar; sin «asesorado», «cumplimiento», «adherencia», «racha» ni «puntaje» | `packages/domain/src/contexto-de-la-persona.test.ts` recorre todos los textos del panel |
| Los «%» con su base y su número | `metricasDelCuerpo` y `partesDelCambio` en el dominio (TEST-CTX-007) |
| Teclado, foco, lector de pantalla, dos temas, 1280/1536/1920 | `apps/web/test/contexto-de-la-persona.test.mjs` (TEST-CTX-020 a 029) y las escenas de capturas |

## 6. Propuestas (CTX-P01 a CTX-P09, a ratificar; nada de esto se programa)

- **CTX-P01 · La medicación que cambia el pulso, como opción.** En «Antes de entrenar», después de `trn_medicacion_cual`:
  «¿Alguna es para la presión, el corazón o el ritmo?» (sí, no, no sé). Hoy el profesional lo deduce del texto.
- **CTX-P02 · Las preguntas de seguimiento del PAR-Q+** para quien responde «sí» (las de la página 2 a 4 del PAR-Q+ 2024).
- **CTX-P03 · Restricciones religiosas o culturales** en «Cómo comés hoy»: kosher, halal, ayunos (Ramadán, Cuaresma), con
  opciones y «otra». Hoy entran por «Otro» del estilo o por lo que no negocia.
- **CTX-P04 · El presupuesto en rangos** («¿Cuánto gastás por semana en comida, más o menos?»): hoy es «¿te limita?».
- **CTX-P05 · Las condiciones de la toma**, en la evaluación de Antropometría: ayuno (horas), ejercicio en las 24 horas
  previas, hidratación, fase del ciclo (si corresponde) y, para la bioimpedancia, marcapasos o embarazo. Serían campos
  opcionales de la toma, con migración aditiva.
- **CTX-P06 · Pedir ver el resumen de Antropometría** (extender API-RES-08 a `SUMMARY` de Antropometría).
- **CTX-P07 · Citas estructurales en el objetivo**, como en la evaluación (un campo opcional en API-NUT-04 y API-TRN-04).
- **CTX-P08 · Ver en el panel las respuestas que la persona comparta de otros profesionales,** con una autorización propia
  (hoy el texto de «resumen» lo excluye a propósito).
- **CTX-P09 · Fijar datos en «Lo importante»:** que el profesional elija qué renglones quiere ver siempre arriba.

## 7. Cómo se ve, y qué falta

**Las capturas** las saca la CI (`.github/workflows/capturas-del-contexto.yml`, con la herramienta
`EVIDENCIA/CONTEXTO-DE-LA-PERSONA/herramientas/capturas.mjs`) y quedan como artefacto `capturas-del-contexto`: Claro y
Azul noche, a 1280 × 800, a 1536 × 730 (Windows al 125 %) y a 1920 × 950, con el editor de Entrenamiento en cada pestaña,
la evaluación de Entrenamiento con una cita, el editor de Nutrición, su evaluación con una cita y «Notas». Cada captura
anota en `capturas.json` si el panel quedó al costado o como cajón y el ancho que le quedó al editor.

**Lo que queda abierto** (además de ratificar CTX-D01 a CTX-D18):
- las propuestas CTX-P01 a CTX-P09, que no se programan sin su paquete;
- la prueba con TalkBack/NVDA y con una persona real, que la CI no reemplaza (en particular, si «Leyendo…» se anuncia: la
  región viva aparece junto con su texto, y algunos lectores no anuncian eso);
- el número de DL (DL-179), si otro paquete de la misma planificación lo toma antes de integrar.

## 8. La revisión adversaria (2026-11-19)

Tres miradas, una después de la otra: privacidad y permisos, datos y código, y experiencia. Lo alto y lo medio se arregló en
la rama, cada cosa con su prueba; el detalle está en la descripción del PR. Lo que cambió del comportamiento:
- **Al fundamento del objetivo no va lo de salud** (CTX-D12): viaja con el plan compartido.
- **API-CTX-02 no se abre por lo compartido a quien lleva Antropometría** (CTX-D14), como API-RES-06.
- **«Quién miró», en la APK,** dice «tu resumen de Antropometría» (Antropometría no tiene plan). Llega con la próxima APK.
- **La conducta alimentaria no se cita tampoco por la API** (CTX-D09).
- **«Citar»:** el renglón entra entero o no entra (tope de 20), y una cita que cambió se vuelve a citar (CTX-D12).
- **«Lo importante»:** el detalle sale del mismo formulario que la respuesta; «La tomó» respeta «Ocultar nombres».
- **El foco** vuelve a donde estaba al abrir, y **las pestañas** van en un renglón.
