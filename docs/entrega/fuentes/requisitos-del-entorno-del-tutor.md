# Requisitos del entorno del tutor

*Qué tiene que ver el tutor, con qué profesional y qué personas, con qué calidad de datos y cómo se construye, se verifica y se restablece la muestra de BE.*

> Todo es ficticio y se dice que lo es. Lo que tiene que ser real es la verosimilitud.

**Autor:** Elián Bufi
**Carrera:** Analista de Sistemas, Escuela Da Vinci
**Fecha:** 19 de noviembre de 2026

> **Resumen.** Una profesional de demostración con las tres áreas y catorce meses de uso, cinco personas con historias distintas y creíbles, datos que respetan reglas fisiológicas que se verifican solas y un entorno que se rehace cada noche, separado de todo dato real.

**Fecha:** 19 de noviembre de 2026

# En dos frases

*Dónde estamos y qué te pido.*

**Dónde estamos.** Este documento fija qué va a ver el tutor cuando entre a BE como una profesional que lo usa todos los días desde hace más de un año, y con qué reglas se arma esa muestra. Ya pasó por una auditoría propia (como tutor exigente, como nutricionista y como entrenador): lo que encontró está aplicado en el cuerpo y contado al final («La auditoría y lo que cambió»).

**Qué necesito de vos.** Que respondas las ocho decisiones de «Lo que necesitamos decidir» (cada una trae la opción que te recomiendo) y que confirmes los nombres de las personas. Con eso arranco a construir; no programo nada antes de tu respuesta.

> **La idea clave.** La muestra no se mide por cuántos datos tiene, sino por **si un nutricionista y un entrenador expertos la miran diez minutos sin encontrar algo que no podría haber pasado**.

- **1** profesional: con las tres áreas y 14 meses de uso
- **5** personas: con historias distintas, de 5 semanas a 16 meses
- **79** requisitos: REQ-TUT-01 a 79, cada uno con su verificación
- **22** hallazgos: de la auditoría, todos resueltos en el cuerpo

### Cómo leerlo

- Cada requisito tiene un ID (**REQ-TUT-nn**), qué pide y **cómo se verifica**. Un requisito sin verificación no entra.
- «Hoy» es siempre el día en que se arma la muestra: todas las fechas son relativas a ese día («La construcción»).
- En el documento y en pantalla se dice **«persona»**, nunca «asesorado».
- Los gráficos que todavía no están programados figuran en la matriz con su estado, para que los datos ya los dejen listos; la guía del tutor muestra solo lo que está funcionando.

# 1. El objetivo y la audiencia

*Qué tiene que entender el tutor en 20 a 30 minutos, de lo macro a lo micro.*

El tutor no es usuario de BE ni tiene por qué saber de entrenamiento o nutrición. Tiene media hora, una computadora y, si quiere, un teléfono. Lo que se lleve de esa media hora es lo que va a defender o a cuestionar. Por eso la muestra no intenta mostrar todo: intenta que **cinco ideas** se vean con datos, sin que nadie se las explique.

**Tabla 1.** Las cinco ideas que el tutor tiene que ver, y dónde las ve.

|   | La idea | Dónde la ve con los datos | Con quién |
| --- | --- | --- | --- |
| 1 | BE es para seguir a una persona **en el tiempo**, no para un plan suelto | La cinta del tiempo y «Analizar» con 12 a 16 meses de historia | Valeria, Carolina |
| 2 | Las tres áreas **en un solo lugar**, y los patrones entre ellas | Los cruces de «Analizar»: los carbohidratos y la fuerza estimada; la energía y el peso | Valeria, Carolina |
| 3 | El profesional **planifica con el contexto a mano** | El editor con el panel de la persona, «La vez pasada» y el historial del ejercicio | Tomás |
| 4 | **Nada se pierde:** cada cambio del plan queda con su versión y su porqué | Las versiones, las fases, la descarga y las revisiones, sobre la cinta | Tomás, Valeria |
| 5 | **Continuidad:** un profesional nuevo no empieza de cero, con permiso de la persona | La historia anterior de Valeria y lo que Silvia comparte desde Nutrición | Valeria, Silvia |

**REQ-TUT-01 · Las cinco ideas se ven sin explicación.** Cada idea de Tabla 1 tiene al menos una pantalla donde se entiende sola, con los datos de la muestra. *Se verifica:* en la revisión final, Elián recorre cada pantalla sin la guía y dice en una frase qué entendió; si no coincide con la idea, la pantalla o los datos se corrigen.

**REQ-TUT-02 · El recorrido sugerido entra en 25 minutos.** La guía propone siete paradas, de lo macro a lo micro, con su tiempo (Figura 1). *Se verifica:* alguien que no conoce BE (no Elián ni yo) lo hace con la guía y un cronómetro: entre 20 y 30 minutos.

1. **Su día (3 min)** (Profesional): «Te toca a vos», «Esperan respuesta», «Tu semana» y la cartera: una profesional con trabajo real, ni todo al día ni todo atrasado.
2. **Una persona en el tiempo (4 min)** (Profesional): La ficha de Valeria: la cinta con 16 meses, las versiones, la descarga y la historia anterior.
3. **Los patrones (5 min)** (Profesional): «Analizar» de Valeria: los carbohidratos y la fuerza estimada, con «Coinciden en el tiempo».
4. **Planificar con contexto (5 min)** (Profesional): El editor de Tomás: el panel de la persona, «La vez pasada», el historial del ejercicio, las fases, los bloques y el calentamiento.
5. **El cuerpo (3 min)** (Profesional): Las tomas de Carolina: desde el inicio y desde la anterior, por sitio y por método; la energía y el peso.
6. **Sus herramientas (3 min)** (Profesional): Plantillas, recetas, alimentos propios con medidas caseras, habituales y enfoques.
7. **Del otro lado (3 min, opcional)** (Persona): La app con la cuenta de Carolina: su plan de hoy, una comida con foto y lo que ve de su evolución.

*Figura 1: El recorrido sugerido al tutor: siete paradas, de lo macro a lo micro.*

**REQ-TUT-03 · Tres momentos que tienen que salir perfectos.** Si el tutor ve solo tres pantallas, que sean estas: (a) el cruce de los carbohidratos con la fuerza estimada de Valeria; (b) el editor de Tomás con el contexto y el historial del ejercicio abierto; (c) las tomas de Carolina con «Desde el inicio y desde la anterior». *Se verifica:* las tres capturas, en Claro y en Azul noche, a 1920×1080 y a 1440×900, aprobadas por Elián antes de entregar.

**REQ-TUT-04 · Cada parada funciona sola.** El tutor puede saltar paradas o entrar en otro orden sin que nada dependa de lo anterior (ningún paso exige haber aceptado, activado o registrado algo antes). *Se verifica:* el recorrido se hace también al revés, de la 7 a la 1, sin errores.

**REQ-TUT-05 · Ningún vacío por falta de datos en lo que se muestra.** En las siete paradas, ningún gráfico ni panel aparece vacío, salvo los estados vacíos elegidos a propósito con Silvia (REQ-TUT-25), que muestran que BE no inventa cuando falta historia. *Se verifica:* las capturas de la matriz («La matriz de los gráficos») no tienen ningún «Sin datos» no declarado.

# 2. La profesional de demostración

*Una persona ficticia que usa BE todos los días desde hace catorce meses, en las tres áreas.*

## 2.1 Quién es

**REQ-TUT-06 · El perfil.** La profesional se llama **Lic. Julieta Arce** (nombre a confirmar por Elián, D-TUT-01). Es licenciada en Nutrición, profesora de Educación Física y antropometrista, que es la combinación que habilita con naturalidad las tres áreas: el plan alimentario es incumbencia de un licenciado en Nutrición, y un tutor o un nutricionista lo van a notar. *Se verifica:* el perfil en el website lo dice así, y Administración la tiene verificada en las tres áreas con el fundamento «Cuenta de demostración».

**REQ-TUT-07 · Ningún dato de matrícula real.** La matrícula, si la pantalla la muestra, es un valor que no puede existir (por ejemplo «MN 0000 · DEMO»). Un número con formato real podría coincidir con el de un profesional de verdad. *Se verifica:* la búsqueda del valor en la base de la muestra y en la pantalla del perfil.

**REQ-TUT-08 · Catorce meses de uso.** La cuenta, su verificación y su primera persona están fechadas hace 14 meses; su actividad (revisiones, planes, tomas) se reparte en todo ese tiempo, en días y horarios de trabajo (de lunes a sábado, de 8 a 21), con más carga en los meses de marzo a noviembre que en enero. *Se verifica:* el chequeo automático (R-PRO-01) cuenta la actividad por mes y por hora: ningún mes de los últimos 12 sin actividad y nada entre las 23 y las 6.

## 2.2 Sus herramientas, con historia

Un profesional que usa BE hace un año tiene sus herramientas armadas, y algunas cambiaron. Eso es lo que hace creíble el uso diario.

**Tabla 2.** Las herramientas propias de la profesional y lo que tiene que mostrar cada una.

| Herramienta | Cuántas | Lo que tiene que mostrar |
| --- | --- | --- |
| Plantillas de Entrenamiento | 4 | «Full body inicial», «Torso y pierna · 4 días», «Fuerza con descarga» y «Fuerza y equilibrio · +55». Dos con 2 o 3 versiones; planes de personas que salieron de versiones distintas, con el número correcto |
| Plantillas de Nutrición | 2 | «Mantenimiento con días de entrenamiento» y «Vegetariana · descenso gradual», con su versión |
| Alimentos propios («Tuyo») | 8 a 10 | Preparaciones caseras sin marca comercial (granola casera, tarta de acelga casera, milanesa de soja casera…). Uno corregido, con su versión nueva; uno retirado, que se ve con su marca donde ya estaba citado |
| Medidas caseras | 12 a 15 | En alimentos de uso diario: «1 taza de arroz cocido», «1 feta», «1 cucharada sopera», cada una con su equivalencia en gramos |
| Recetas | 10 a 12 | Platos de casa, con su imagen (REQ-TUT-52), usadas como opciones del plan de al menos dos personas |
| Comidas habituales | 4 a 6 | «Desayuno con avena», «Colación después de entrenar», «Almuerzo de oficina»… |
| Sesiones habituales | 3 | «Core y movilidad», «Entrada en calor general», «Accesorios de tren superior» (con un bloque «En vueltas») |
| Ejercicios habituales | 12 a 15 | Los que más usa, marcados arriba del buscador |
| Ejercicios propios | 2 o 3 | Con su imagen; al menos uno usado en un plan activo |
| Enfoques de gráficos | 3 | «Foco en fuerza», «Composición corporal» y «Vuelta al entrenamiento», cada uno elegido para al menos una persona |
| Vistas guardadas de «Analizar» | 3 a 5 | Con nombres de trabajo, no de demostración |

**REQ-TUT-09 · Las herramientas de Tabla 2 existen, con su historia.** Cada una tiene la cantidad indicada, fechas repartidas en los 14 meses y al menos una versión corregida donde la herramienta tiene versiones. *Se verifica:* el resumen del generador cuenta cada herramienta, y la revisión pantalla por pantalla abre cada una.

**REQ-TUT-10 · Lo que sale de una plantilla dice de qué versión salió.** Al menos dos personas tienen planes creados desde versiones distintas de la misma plantilla. *Se verifica:* la nota de origen de cada plan nombra la versión aplicada, no la vigente.

**REQ-TUT-11 · Las notas propias.** Cada persona en profundidad tiene de 3 a 8 notas propias de la profesional, fechadas a lo largo de su historia, algunas atadas a un ejercicio o a una comida, y una o dos archivadas. Se escriben como notas de trabajo, cortas y en tono neutro («Pidió cambiar el día del entrenamiento de pierna por el turno nuevo»), sin juicios sobre el cuerpo ni sobre la conducta. *Se verifica:* el chequeo de vocabulario (R-TXT-01) y la lectura de todas las notas por Elián.

**REQ-TUT-12 · Las notas de coordinación.** Con la colega de Nutrición de Silvia (REQ-TUT-26), dos o tres notas de coordinación en cada sentido, fechadas en las últimas cinco semanas. *Se verifica:* se ven en la ficha de Silvia y en la cinta.

## 2.3 Su cartera y su día

**REQ-TUT-13 · Una cartera creíble.** Además de las cinco personas en profundidad, diez personas livianas (D-TUT-02) completan la cartera: de 1 a 8 meses en BE, con una o dos áreas, menos datos y las mismas reglas de verosimilitud. Una persona tiene el vínculo finalizado hace cuatro meses, como pasa en cualquier consultorio. *Se verifica:* «Las personas que acompañás» muestra 15 personas activas y una finalizada, con fechas «Desde el…» distintas.

**REQ-TUT-14 · El día de hoy, ni todo al día ni todo atrasado.** Lo que la profesional ve al entrar responde a una foto definida (Tabla 3), recalculada cada vez que se arma la muestra. *Se verifica:* el chequeo posterior a la carga (REQ-TUT-74) lee «Te toca a vos» y «Esperan respuesta» por la API y compara con la tabla.

**Tabla 3.** La foto del día de la profesional: lo que tiene que ver al entrar, siempre relativo a hoy.

| Dónde | Qué | Por qué |
| --- | --- | --- |
| Te toca a vos · hoy | La revisión de Entrenamiento de Tomás: termina su fase de fuerza | Lo que se hace hoy |
| Te toca a vos · vencido | La revisión de Nutrición de Gustavo, vencida hace 3 días | Un atraso chico, como en cualquier semana real |
| Te toca a vos · esta semana | La toma de Carolina, pasado mañana; el plan nuevo de Silvia en borrador, guardado ayer | Lo que viene |
| Te toca a vos · livianas | Dos pendientes de personas livianas, uno para mañana y otro para dentro de 5 días | Que la lista no sea solo de las cinco |
| Esperan respuesta | Un pedido de información a Silvia, enviado hace 2 días; una invitación a una persona nueva, enviada ayer | Lo que depende de otros |
| Lo nuevo | Una nota de la sesión de Valeria de ayer («La última serie de press me molestó el hombro izquierdo»), sin leer | Que la persona le escribe |
| Tu semana | Entre 6 y 9 eventos: revisiones, una toma, un plan que vence | Una semana con trabajo, sin desbordar |

**REQ-TUT-15 · El ritmo de trabajo es humano.** En los 14 meses, cada persona tiene una revisión por área cada 3 a 6 semanas, y en total la profesional registra de 2 a 7 revisiones por semana. Ninguna revisión cae un domingo, salvo una, a propósito, antes de una competencia de Tomás. *Se verifica:* R-PRO-02 cuenta revisiones por semana y por día.

# 3. Las personas

*Cinco historias distintas, fisiológicamente creíbles, y ninguna perfecta.*

> **La idea clave.** Una muestra donde a todos les va bien no es creíble. **Una progresa, una se estanca y descarga, uno deja y vuelve, una cambia su composición corporal y una recién empieza.**

## 3.1 Las cinco, en una tabla

**Tabla 4.** Las cinco personas en profundidad (nombres a confirmar). Todas son ficticias.

| Persona | Edad | En BE | Áreas con Julieta | La historia | Se luce en |
| --- | --- | --- | --- | --- | --- |
| Tomás Medina | 31 | 14 meses | Las tres | Empezó casi de cero y progresa: fases de adaptación, hipertrofia y fuerza, con descargas | El editor, el historial del ejercicio, la fuerza estimada |
| Valeria Quiroga | 38 | 16 meses | Las tres | Entrena hace años; vino de otro profesional; un estancamiento en press de banca, una descarga, más carbohidratos y un cambio de rango | La cinta, los cruces, dos etapas, la historia anterior |
| Gustavo Pereyra | 47 | 13 meses | Las tres | Dejó diez semanas por una mudanza y volvió: perdió algo de fuerza y la recuperó | La cinta con la pausa, la vuelta, los huecos honestos |
| Carolina Ríos | 34 | 12 meses | Las tres | Ovolactovegetariana; bajó grasa en dos etapas de déficit con una pausa en mantenimiento | Las tomas, Nutrición día por día, la energía y el peso |
| Silvia Domínguez | 58 | 5 semanas | Entrenamiento y Antropometría | Empieza por indicación médica; su nutricionista es otra profesional, con quien comparte | Los estados vacíos honestos, lo que comparte otra área |

**REQ-TUT-16 · Cinco personas en profundidad, con las historias de Tabla 4.** *Se verifica:* cada historia se reconoce en su cinta del tiempo sin leer la tabla (la prueba de REQ-TUT-01).

## 3.2 Lo que trae cada una

**REQ-TUT-17 · El perfil completo de cada persona.** Las cinco traen, salvo donde la tabla de la persona dice otra cosa:

1. **Los formularios de inicio** de sus áreas (Nutrición, Entrenamiento y Hábitos), respondidos al empezar, coherentes con su historia y con algún campo sin responder (como la gente real).
2. **Antropometría periódica:** una toma cada 3 a 6 semanas, con el perfil de REQ-TUT-37.
3. **Planes con versiones** a lo largo de su tiempo: fases con nombre propio, bloques «Seguido» y «En vueltas» donde tiene sentido, calentamiento en los ejercicios principales y al menos una versión creada desde una plantilla.
4. **Registros con huecos realistas** (REQ-TUT-32 y R-NUT-04).
5. **Nutrición** con planes y versiones, registros, comidas diferentes y, en Carolina y Valeria, fotos.
6. **Lo que comparte entre áreas**, aceptado con la pantalla única de compartir, y **la historia anterior** donde corresponde (Valeria).
7. **Las notas:** las propias de la profesional (REQ-TUT-11) y las notas de la sesión que la persona le escribe desde la app (de 3 a 10 en el año).
8. **Las revisiones** con su interpretación, fundamento y acción, en lenguaje de profesional.

*Se verifica:* el resumen del generador cuenta cada punto por persona; ninguna celda en cero salvo las declaradas.

## 3.3 Tomás Medina · el que progresa

31 años, 1,78 m, analista de sistemas. Nunca había entrenado en serio; puede de lunes a sábado después de las 19. Sin lesiones ni medicación.

**Tabla 5.** Tomás: de dónde partió y dónde está (valores orientativos: el generador los produce con su ruido).

| Medida | Al empezar | Hoy | Ritmo |
| --- | --- | --- | --- |
| Masa corporal | 73,8 kg | 77,6 kg | +0,27 kg por mes |
| Suma de 6 pliegues | 84 mm | 76 mm | casi estable, baja de a poco |
| Sentadilla trasera, 1RM estimado | ≈ 80 kg | ≈ 122 kg | rápido los 3 primeros meses, después más lento |
| Press de banca plano, 1RM estimado | ≈ 60 kg | ≈ 84 kg | ídem |
| Peso muerto convencional, 1RM estimado | ≈ 100 kg | ≈ 150 kg | ídem |
| Energía del objetivo | 2.900 kcal/día | 3.100 kcal/día | dos versiones del objetivo |

**REQ-TUT-18 · La historia de Tomás.** Siete versiones del plan en 14 meses, entre ellas «Adaptación» (6 semanas, cuerpo completo 3 días, 3×10-12, RIR 3), «Hipertrofia» (8 semanas, torso y pierna 4 días, 4×8-10, RIR 2), «Fuerza» (6 semanas, 4×5-6, RIR 1-2), una semana de «Descarga», y otra vuelta con rangos distintos. Los accesorios de brazos van en un bloque «En vueltas» (curl y tríceps, 3 vueltas). Calentamiento de 2 o 3 series en sentadilla, banca y peso muerto. Nutrición: superávit chico, proteína cerca de 1,9 g/kg. Un viaje de 9 días sin entrenar en el mes 7. Es la persona del recorrido del editor (parada 4). *Se verifica:* la cinta muestra las siete versiones con sus fases; el historial de la sentadilla muestra la curva rápida y después la lenta.

## 3.4 Valeria Quiroga · el estancamiento y la descarga

38 años, 1,64 m, docente. Entrena fuerza hace cuatro años. Llegó a Julieta hace 16 meses desde otro entrenador, y autorizó que Julieta vea su historia anterior. Toma levotiroxina por hipotiroidismo, estable: el panel de contexto lo muestra tal como ella lo escribió.

**REQ-TUT-19 · El estancamiento.** Durante unas 10 semanas, el 1RM estimado del press de banca se queda entre ≈ 51 y ≈ 53 kg, con RIR registrado que baja de 2 a 1 o 0 a igual carga (la señal que un entrenador reconoce como fatiga). Sigue una versión «Descarga» de una semana (cargas entre 10 y 20 por ciento menos, menos series, RIR indicado 3-4) y una fase nueva con otro rango de repeticiones (de 6-8 a 4-6). En las 12 semanas siguientes el press llega a ≈ 56 kg. *Se verifica:* «Dos etapas» de Valeria con al menos 7 sesiones por lado, y la descarga como versión con nombre en la cinta.

**REQ-TUT-20 · Los carbohidratos y la fuerza (el ejemplo de Dirección).** La fase nueva coincide con una versión nueva del objetivo nutricional: de 2.100 a 2.300 kcal/día, con los carbohidratos de unos 236 a unos 297 g/día, la proteína igual (120 g/día) y la grasa de 75 a 70 g/día. Cada etapa dura al menos 5 semanas. El peso sube unos 0,8 kg en el primer mes y se queda (agua y glucógeno: es lo que pasa). *Se verifica:* el cruce de carbohidratos y 1RM estimado en «Analizar» se arma en el caso 1 (la misma profesional con las dos áreas) y dice las dos etapas con su mediana, sus días contados y «Coinciden en el tiempo; esto no prueba que una cosa cause la otra».

**REQ-TUT-21 · La historia anterior.** Diez meses con el entrenador anterior (un profesional ficticio, REQ-TUT-26), en solo lectura y rotulados como de otro profesional: planes, sesiones y las decisiones de sus revisiones, sin sus notas privadas. *Se verifica:* la ficha de Valeria muestra la historia anterior con su rótulo; ninguna nota del profesional anterior aparece.

## 3.5 Gustavo Pereyra · el que dejó y volvió

47 años, 1,74 m, comerciante. Una molestia lumbar vieja (sin tratamiento actual) que figura en su formulario. Come asado los domingos.

**REQ-TUT-22 · La pausa.** Cuatro meses activo; después, 10 semanas sin registros en ninguna área por una mudanza (una nota propia de Julieta lo dice: «Se muda por trabajo; retomamos cuando se acomode»). El vínculo sigue vigente. A la vuelta, una toma: 2,8 kg más y 3 cm más de cintura. El 1RM estimado de la sentadilla vuelve entre 5 y 15 por ciento más bajo que al irse y se recupera en 6 a 8 semanas. *Se verifica:* la cinta muestra el hueco sin dibujar nada en él; «Desde el inicio y desde la anterior» muestra la toma de la vuelta con los días entre fechas.

**REQ-TUT-23 · La vuelta con otro plan.** A la vuelta, el plan nutricional se simplifica con medidas caseras («1 taza de arroz cocido») y una plantilla de la profesional; registra de 4 a 5 días por semana, sin fotos, con más comidas diferentes los domingos. *Se verifica:* «Día por día» de Gustavo muestra los huecos como «Sin registro», nunca como cero.

## 3.6 Carolina Ríos · la composición corporal

34 años, 1,66 m, diseñadora. Ovolactovegetariana. Entrena 3 días; quiere bajar grasa sin perder fuerza.

**Tabla 6.** Carolina: las cuatro etapas de su año (valores orientativos).

| Etapa | Semanas | Masa corporal | Objetivo energético y lo que pasa |
| --- | --- | --- | --- |
| Déficit 1 | 16 | 71,4 → 66,2 kg | 1.650 kcal/día, proteína 130 g/día; fines de semana con algo más registrado |
| Mantenimiento | 6 | 66,2 → 66,6 kg | 2.050 kcal/día: la pausa planificada |
| Déficit 2 | 12 | 66,6 → 63,4 kg | 1.600 kcal/día; baja más despacio |
| Mantenimiento | 18 | 63,4 → 63,6 kg | 1.950 kcal/día; hoy |

**REQ-TUT-24 · La historia de Carolina.** La suma de 6 pliegues baja de unos 148 a unos 101 mm y la cintura de 84 a 74 cm, en tomas cada 4 semanas, siempre a la mañana y con las mismas condiciones (14 tomas). La fuerza se sostiene y sube un poco (sentadilla trasera de ≈ 55 a ≈ 65 kg estimado), porque sigue siendo una persona con poca experiencia. Registra con foto un tercio de sus comidas; ninguna comida suya tiene carne ni pescado. Es la persona de la app (parada 7, D-TUT-07). *Se verifica:* R-NUT-06 (ningún alimento con carne en sus registros ni en sus planes) y la energía y el peso de toma a toma con al menos 14 días entre tomas.

## 3.7 Silvia Domínguez · la que recién empieza

58 años, 1,60 m, contadora. Su médica le indicó fuerza por una osteopenia informada en el formulario. Ya tenía nutricionista: la Lic. de Nutrición es otra profesional (ficticia), con quien Silvia comparte.

**REQ-TUT-25 · El contraste: poco tiempo, sin inventar.** Cinco semanas: los formularios, una toma, el plan 1 con máquinas y mancuernas (cargas bajas, RIR 3), 9 sesiones de las 15 indicadas (una semana con gripe). Sus gráficos muestran los estados vacíos de BE: «Se arma con 5 sesiones por lado», «La primera toma: todavía no hay con qué compararla». El plan 2 está en borrador. *Se verifica:* las capturas de Silvia muestran esos estados con su texto y ningún valor inventado.

**REQ-TUT-26 · Las otras profesionales, ficticias y mínimas.** Para mostrar lo que BE hace entre profesionales hacen falta dos cuentas más, que el tutor no usa: la Lic. de Nutrición de Silvia (que le comparte su resumen y su plan vigente a Julieta y viceversa) y el entrenador anterior de Valeria (dueño de su historia anterior). Tienen solo lo necesario para eso. *Se verifica:* en el editor de Silvia, «Otras áreas · lo comparte la persona» muestra el plan de Nutrición de la colega; la cuenta del tutor no puede entrar a ninguna de las dos.

## 3.8 Las personas livianas

**REQ-TUT-27 · Diez personas livianas, con las mismas reglas.** Nombres ficticios, de 19 a 72 años, mitad mujeres, con 1 a 8 meses de historia y menos datos: un plan con una o dos versiones, dos o tres tomas, registros de las últimas semanas. Cumplen todas las reglas de «La calidad de los datos». No se recorren en la guía; están para que la cartera y «Tu semana» sean creíbles. *Se verifica:* el chequeo automático corre sobre las 15, no solo sobre las cinco.

**REQ-TUT-28 · Variedad sin estereotipos.** Entre las 15 hay distintas edades, cuerpos, objetivos (salud, rendimiento, composición, volver a moverse), horarios y formas de registrar (quien registra todo, quien registra a la noche, quien se olvida los fines de semana). Ninguna historia se presenta como ejemplo a seguir ni como fracaso. *Se verifica:* la tabla de la cartera, leída por Elián.

# 4. La calidad de los datos

*Lo que un nutricionista y un entrenador expertos no tienen que poder objetar.*

> **La idea clave.** Cada regla se escribe con un número, porque una regla sin número no se puede verificar. **El chequeo automático (R-xx) corre antes de cargar: con una sola falla, no se carga.**

Las reglas van en tres tablas, una por área. Fuera de ellas hay cuatro familias más, que se definen en su requisito: R-PRO (la actividad de la profesional, REQ-TUT-08 y 15), R-CRU (entre áreas, REQ-TUT-38), R-RAR (las rarezas, REQ-TUT-39) y R-TXT (los textos, REQ-TUT-40).

## 4.1 Entrenamiento

**Tabla 7.** Las reglas de Entrenamiento, con su chequeo.

| Regla | Qué exige | Cómo se comprueba |
| --- | --- | --- |
| R-TRN-01 | **Progresión creíble por experiencia.** La mediana del 1RM estimado de 4 semanas sube, como máximo, 6 por ciento por mes en los primeros 3 meses de alguien sin experiencia, 2,5 por ciento por mes en un intermedio y 1 por ciento por mes en alguien con años de entrenamiento. Nunca más de 10 por ciento entre dos sesiones seguidas, salvo después de una pausa o una descarga | Por persona y por ejercicio, sobre la historia generada |
| R-TRN-02 | **Cargas que existen.** Barra en pasos de 2,5 kg (1,25 kg en press de banca y de hombros de quien carga poco); mancuernas de a 1 kg hasta 10 kg y de a 2 kg después; máquinas en pasos de 2,5 o 5 kg según la máquina | Cada carga contra el paso de su equipamiento |
| R-TRN-03 | **Repeticiones dentro de lo indicado.** Dentro del rango o a 2 repeticiones de él; nunca más de 30 en un ejercicio de fuerza | Cada serie contra su objetivo |
| R-TRN-04 | **RIR coherente con la carga.** Con la carga, las repeticiones y el RIR de una serie, el 1RM que implica (Epley) queda a 7 por ciento o menos de la mediana de las 4 semanas de esa persona en ese ejercicio. En quien recién empieza, el RIR tiene más ruido, y está bien | Cada serie efectiva con RIR |
| R-TRN-05 | **La fatiga dentro de la sesión.** A igual carga, las repeticiones de la serie siguiente no suben más de 1, o el RIR no sube. RIR 0 en menos de 1 de cada 10 series | Por sesión y ejercicio |
| R-TRN-06 | **El calentamiento.** De 1 a 3 series antes de los ejercicios principales con barra, entre 40 y 80 por ciento de la carga de trabajo, de 3 a 10 repeticiones, marcadas como calentamiento. Nunca entran en la fuerza estimada ni en «La vez pasada» | Cada serie de calentamiento |
| R-TRN-07 | **Descansos lógicos.** En las sesiones con el cronómetro de la app: la mediana de descanso entre 90 y 240 s en los ejercicios principales y entre 45 y 120 s en los accesorios; ningún descanso por debajo de 20 s; en un bloque «En vueltas», el descanso va al terminar la vuelta. Ningún descanso de más de 10 minutos (salvo lo de R-RAR-01) | Cada descanso medido |
| R-TRN-08 | **Duración de la sesión.** De 40 a 100 minutos, y a no más de 25 por ciento de la suma de lo indicado (series, descansos y calentamiento) | Cada sesión con tiempos |
| R-TRN-09 | **Horario de la persona.** Las sesiones empiezan dentro de la franja que declaró en su formulario (con una o dos excepciones al año); nunca dos sesiones del mismo plan el mismo día | Cada sesión contra el formulario |
| R-TRN-10 | **Asistencia con forma humana.** En los períodos activos, entre 70 y 92 de cada 100 sesiones indicadas registradas; las faltas se agrupan (viajes, enfermedad, fin de año), no caen al azar parejo | Por persona y por mes |
| R-TRN-11 | **La descarga se ve en el plan.** Toda baja de carga de más de 10 por ciento sin una pausa tiene una versión o una fase «Descarga» que la explica: BE no infiere descargas, y la muestra no las esconde | Cada baja contra las versiones |
| R-TRN-12 | **Volver después de una pausa.** Tras 8 a 12 semanas sin entrenar, el 1RM estimado vuelve entre 5 y 15 por ciento más bajo y se recupera en 4 a 8 semanas | Gustavo y las livianas con pausas |
| R-TRN-13 | **Esfuerzo de la sesión coherente.** Si la persona registra el esfuerzo de la sesión (de 1 a 10), con RIR 0-1 va de 7 a 9 y en la descarga de 4 a 6 | Cada sesión con esfuerzo |
| R-TRN-14 | **La fuerza estimada tiene de dónde salir.** Las personas que se lucen en la fuerza estimada hacen ejercicios de la lista de la v1 (los seis con barra del catálogo base), con series de RIR 0 a 2 escritas por la persona (con la procedencia que lo dice), y al menos 4 sesiones por versión | Por persona, contra la matriz |

**REQ-TUT-29 · Las reglas de Tabla 7 se cumplen en las 15 personas.** *Se verifica:* el informe del chequeo automático, con cero fallas.

**REQ-TUT-30 · Los nombres de los ejercicios son los del catálogo base.** Ningún ejercicio inventado en los planes, salvo los ejercicios propios de la profesional (REQ-TUT-09). *Se verifica:* cada ejercicio del generador existe en el catálogo.

**REQ-TUT-31 · Las sesiones registradas «Ya la hice» y resumidas existen, pocas.** Una o dos al año por persona, sin series, para mostrar que BE no inventa lo que no se escribió. *Se verifica:* «La vez pasada» dice que esa sesión no tiene series.

**REQ-TUT-32 · Los huecos de Entrenamiento.** Cada persona en profundidad tiene, en su año, al menos una semana sin sesiones por un motivo creíble (viaje, enfermedad, fiestas), y el motivo aparece en una nota de la sesión o en una nota propia. *Se verifica:* la cinta y las notas.

## 4.2 Nutrición

**Tabla 8.** Las reglas de Nutrición, con su chequeo.

| Regla | Qué exige | Cómo se comprueba |
| --- | --- | --- |
| R-NUT-01 | **Los macros cierran con la energía.** En cada objetivo, 4 × proteína + 4 × carbohidratos + 9 × grasa da la energía indicada, con una diferencia de 2 por ciento o menos | Cada versión del objetivo |
| R-NUT-02 | **Objetivos que un nutricionista firmaría.** Proteína entre 1,4 y 2,2 g/kg en quien entrena (1,0 a 1,2 en quien no); grasa de al menos 0,6 g/kg; fibra de 20 a 35 g/día; nunca menos de 1.200 kcal/día | Cada objetivo contra el peso de la toma más cercana |
| R-NUT-03 | **La energía la calcula BE.** Los registros y los planes usan alimentos del catálogo, propios o recetas con cantidades: los totales salen de BE, nunca se escriben a mano | El generador no tiene campos de totales |
| R-NUT-04 | **Lo registrado se parece a la gente.** En los días con cantidades en todos sus registros, la energía registrada va de 0,8 a 1,05 veces el objetivo en la semana, y de 1,1 a 1,25 veces en el fin de semana; entre 10 y 25 de cada 100 días sin registro; entre 10 y 20 de cada 100 con algo faltante; de 5 a 10 de cada 100 comidas cargadas al día siguiente | Por persona y por mes |
| R-NUT-05 | **Comidas diferentes con medida.** De 1 a 3 por semana, más los fines de semana; la mitad con cantidades y la otra mitad sin ellas (que BE muestra como «sin dato», no como cero) | Por persona y por semana |
| R-NUT-06 | **Coherencia con la persona.** Lo que alguien no come no aparece nunca (Carolina no tiene carne ni pescado); los alimentos son los de una casa argentina; nada de marcas comerciales en los nombres propios | Contra el formulario de cada persona |
| R-NUT-07 | **Horarios de las comidas.** Cada comida a la hora que su nombre sugiere y que la persona declaró (desayuno de 6:30 a 9:30, almuerzo de 12 a 14:30, cena de 20 a 22:30…), con una o dos excepciones al mes | Cada registro |
| R-NUT-08 | **Fotos solo donde la historia lo dice.** Carolina, un tercio de sus comidas; Valeria, algunas; el resto, ninguna (REQ-TUT-52) | Por persona |
| R-NUT-09 | **El balance cierra a lo largo de semanas.** En tramos de 8 semanas o más, el signo del cambio de peso coincide con el de la energía registrada (corregida por un subregistro de 1,1 a 1,25) frente al gasto estimado (Mifflin-St Jeor por el factor de actividad que declaró), y la magnitud no se aparta más de la mitad | Por persona y por etapa |

**REQ-TUT-33 · Las reglas de Tabla 8 se cumplen en las 15 personas.** *Se verifica:* el informe del chequeo, con cero fallas.

**REQ-TUT-34 · Los planes nutricionales tienen versiones con sentido.** Cada versión del plan cambia por una razón que dice su revisión (cambio de objetivo, de horario, de preferencia), y el plan usa recetas de la profesional como opciones en al menos dos personas, con un día de entrenamiento y otro de descanso en Valeria y Tomás. *Se verifica:* las revisiones de Nutrición de cada persona.

**REQ-TUT-35 · Nutrición con «%» solo donde está permitido.** Ningún texto de la muestra (notas, revisiones, nombres) usa el signo de porcentaje para Nutrición ni califica lo registrado frente a lo indicado. *Se verifica:* R-TXT-01.

## 4.3 Antropometría

**Tabla 9.** Las reglas de Antropometría, con su chequeo.

| Regla | Qué exige | Cómo se comprueba |
| --- | --- | --- |
| R-ANT-01 | **El ritmo del peso.** Entre dos tomas, el cambio no pasa de 1 por ciento de la masa corporal por semana, salvo la vuelta de una pausa | Cada par de tomas |
| R-ANT-02 | **Pliegues y peso van juntos.** En un déficit, la suma de pliegues baja; en una etapa de ganancia con entrenamiento, puede subir poco o quedarse. Nunca baja la suma mientras el peso sube más de 2 kg sin una explicación en el plan | Cada etapa |
| R-ANT-03 | **El ruido de quien mide.** Entre tomas seguidas, cada pliegue varía con un ruido de hasta 5 por ciento y cada perímetro de hasta 1 por ciento; la mayoría de los sitios se mueve en la dirección de la suma, y uno o dos, al revés y poco | Cada sitio |
| R-ANT-04 | **La talla no cambia.** En un adulto, la talla queda igual (más o menos 0,5 cm entre tomas) | Cada persona |
| R-ANT-05 | **La cintura acompaña.** En un déficit, la cintura baja entre 0,7 y 1,2 cm por kg perdido, y la cadera menos que la cintura | Cada etapa de déficit |
| R-ANT-06 | **Los cálculos los hace BE.** El IMC, el porcentaje de grasa (Durnin-Womersley, Faulkner), las masas y la masa muscular de Lee salen de las funciones de cálculo de BE con los sitios crudos; ningún resultado se escribe a mano | El generador manda sitios, no resultados |
| R-ANT-07 | **Condiciones constantes.** Las tomas son a la mañana, por la misma profesional, con las mismas condiciones declaradas; si una toma es a otra hora, lo dice | Cada toma |

**REQ-TUT-36 · Las reglas de Tabla 9 se cumplen.** *Se verifica:* el informe del chequeo, con cero fallas.

**REQ-TUT-37 · El perfil de cada toma alcanza para todos los gráficos.** Masa, talla, los 8 pliegues (los 6 de la suma, más bíceps y cresta ilíaca, que pide Durnin-Womersley), los perímetros de brazo relajado y flexionado, cintura, cadera, muslo medio y pantorrilla, y los diámetros de húmero y fémur (para la somatocarta, cuando se programe). Una toma por persona, una sola, tiene un sitio sin medir, para ver el hueco. *Se verifica:* las tomas generadas contra esta lista.

## 4.4 Entre áreas, lo raro y las palabras

**REQ-TUT-38 · Coherencia entre áreas.** Los g/kg de Nutrición usan el peso de la última toma anterior; los días de entrenamiento tienen más energía indicada donde el plan tiene día de entrenamiento; la fuerza de Carolina no cae en el déficit. *Se verifica:* R-CRU-01 compara los tres pares por persona.

**REQ-TUT-39 · Lo raro, en su justa medida.** Por persona y por año: una o dos comidas corregidas por la persona después de cargarlas; una toma con un sitio sin medir; una semana de vacaciones; un día con solo el desayuno registrado; una serie con un RIR fuera de lo esperado. Y una sola rareza grande en toda la muestra: un descanso de 14 minutos en Gustavo, «me olvidé de parar el reloj», **solo si BE ya marca los datos dudosos** cuando se arma la muestra; si no, no va (R-RAR-01). *Se verifica:* el informe lista cada rareza; la lista coincide con esta, ni una más.

**REQ-TUT-40 · Ubicar, nunca calificar, también en lo escrito.** Ningún texto de la muestra (notas propias, notas de la sesión, revisiones, nombres de planes, de recetas y de enfoques) usa las palabras que B05 prohíbe, califica el cuerpo o la conducta, ni afirma causas («gracias a los carbohidratos subió la fuerza»). Las revisiones dicen qué se ve, en qué se funda y qué se hace. *Se verifica:* R-TXT-01, la guardia de vocabulario de BE corrida sobre todos los textos de la muestra, más la lectura de Elián.

**REQ-TUT-41 · Ningún «asesorado» en pantalla.** *Se verifica:* el texto visible de las capturas de la matriz, buscado por la palabra.

**REQ-TUT-42 · La matriz de los gráficos.** Cada gráfico aprobado tiene al menos una persona con la que se luce, y los datos que necesita («La matriz de los gráficos»). *Se verifica:* la captura de cada celda «Luce» de la matriz.

# 5. La matriz de los gráficos

*Qué gráfico se luce con qué persona, y qué tiene que traer el dato. «Luce» = es el ejemplo; «Ve» = se ve bien; «Vacío» = el estado vacío honesto, a propósito; «—» = no aplica.*

**Tabla 10.** Los 25 gráficos aprobados, «Armá tu gráfico», los enfoques, «Patrones» y los ocho cruces, por persona.

| ID | Gráfico | Hoy en BE | Tomás | Valeria | Gustavo | Carolina | Silvia | Lo que tiene que traer el dato |
| --- | --- | --- | --- | --- | --- | --- | --- | --- |
| GR-01 | «La vez pasada», serie por serie | Funcionando | Luce | Ve | Ve | Ve | Ve | Series escritas por la persona; calentamiento aparte; una vez hecha con otro ejercicio |
| GR-02 | 1RM estimado (Epley v1) con las versiones | Funcionando | Luce | Luce | Luce | Ve | Vacío | R-TRN-14: lista de la v1, RIR 0-2 escrito por la persona, 4 sesiones por versión |
| GR-03 | Carga, repeticiones y RIR alineados | Funcionando | Ve | Luce | Ve | Ve | Ve | La serie del mismo número entre sesiones; RIR indicado en el plan; la descarga |
| GR-04 | «Con historial» en el buscador | Funcionando | Ve | Ve | Ve | Ve | Ve | Sesiones en el último año |
| GR-05 | RIR indicado y registrado | Funcionando | Ve | Luce | Ve | Ve | Ve | El RIR indicado cambia entre versiones; series a igual carga |
| GR-06 | Perfil carga-repeticiones | Funcionando | Luce | Ve | Ve | Ve | Vacío | Rangos de 4 a 12 repeticiones en distintas fases |
| GR-07 | Series por zona del borrador | Por programar | Ve | Ve | Ve | Ve | Ve | Grupos musculares del catálogo en cada ejercicio |
| GR-08 | Series según un umbral de RIR | Por programar | Ve | Luce | Ve | Ve | — | RIR registrado en la mayoría de las series |
| GR-09 | kg × repeticiones por semana | Por programar | Luce | Ve | Ve | Ve | Vacío | Carga y repeticiones en todas las series efectivas |
| GR-10 | La carga de la semana con el esfuerzo | Por programar | Ve | Luce | Ve | Ve | Vacío | Esfuerzo de la sesión registrado en la mayoría (R-TRN-13) |
| GR-11 | Temporadas del objetivo y del plan | Funcionando | Ve | Luce | Ve | Luce | — | Versiones del objetivo con fecha y sentido |
| GR-12 | Energía registrada por día | Funcionando | Ve | Ve | Ve | Luce | — | R-NUT-04: días completos, subtotales, sin registro y cargados tarde |
| GR-13 | Proteína, carbohidratos, grasa y fibra | Funcionando | Luce | Ve | Ve | Luce | — | Fibra en los alimentos; tomas propias para los g/kg |
| GR-14 | Lo indicado y lo registrado, en gramos | Funcionando | Ve | Ve | Ve | Luce | — | Un indicado por día; comidas diferentes con y sin cantidades |
| GR-15 | La proteína por comida | Por programar | Luce | Ve | Ve | Luce | — | La proteína repartida en 3 a 5 comidas |
| GR-16 | Desde el inicio y desde la anterior | Funcionando | Ve | Ve | Luce | Luce | Vacío | Tomas comparables; la primera de Silvia |
| GR-17 | Pliegues con el error de medición | Por programar | Ve | Ve | Ve | Luce | Vacío | El error técnico de la profesional, cuando BE lo cargue |
| GR-18 | Perfil por sitio entre dos tomas | Funcionando | Ve | Ve | Ve | Luce | Vacío | R-ANT-03: sitios con ruido; un sitio sin medir |
| GR-19 | Perímetro corregido por pliegue | Por programar | Luce | Ve | Ve | Ve | Vacío | Perímetro y pliegue del mismo sitio (brazo, muslo, pantorrilla) |
| GR-20 | Masa grasa según cada método | Funcionando | Ve | Ve | Ve | Luce | Vacío | Los 8 pliegues (REQ-TUT-37) |
| GR-21 | Masa con las condiciones de la toma | Por programar | Ve | Ve | Ve | Ve | Ve | Las condiciones de cada toma (R-ANT-07) |
| GR-22 | Somatocarta con su recorrido | Por programar | Luce | Ve | Ve | Ve | Vacío | Diámetros y perímetros de REQ-TUT-37 |
| GR-23 | La cinta del tiempo | Funcionando | Ve | Ve | Luce | Ve | Ve | Versiones, tomas, revisiones, notas y la pausa |
| GR-24 | Dos etapas lado a lado | Funcionando | Ve | Luce | Ve | Luce | Vacío | 5 datos o más por lado, con un cambio de versión en el medio |
| GR-25 | Lo de sus semanas anteriores | Por programar | Ve | Ve | Ve | Ve | Vacío | Semanas comparables antes de hoy |
| GR-26 | «Armá tu gráfico» | Funcionando | Luce | Ve | Ve | Ve | Ve | Series de las tres áreas en la misma persona |
| GR-27 | Los enfoques | Por integrar | Luce | Ve | Ve | Luce | Ve | Los tres enfoques de REQ-TUT-09 |
| — | La sección «Patrones» | Por integrar | Ve | Luce | Ve | Ve | Vacío | Todo lo anterior |
| SP-01 | Carbohidratos × 1RM estimado | Funcionando | Ve | Luce | Ve | Ve | — | REQ-TUT-20: dos etapas de 5 semanas o más, la misma profesional en las dos áreas |
| SP-02 | Energía × peso de toma a toma | Funcionando | Ve | Ve | Ve | Luce | — | 14 días o más entre tomas; R-NUT-09 |
| SP-03 | Energía y peso × 1RM en déficit | Por programar | — | — | — | Luce | — | La fuerza de Carolina en sus déficits |
| SP-04 | Series por zona × perímetro | Por programar | Luce | Ve | Ve | Ve | — | Grupos musculares y perímetros |
| SP-05 | Proteína g/kg × masa muscular | Por programar | Luce | Ve | Ve | Ve | — | Perímetros corregidos (REQ-TUT-37) |
| SP-06 | Carbohidratos × pesajes en casa | Por programar | — | — | — | — | — | Necesita el peso en casa, que BE todavía no registra |
| SP-07 | Series por semana × RIR a igual carga | Por programar | Ve | Luce | Ve | Ve | — | Lo de GR-05 y GR-07 |
| SP-08 | Hábitos × carga y RIR | Por programar | Ve | Ve | Ve | Ve | — | Los hábitos versionados, cuando se programen |

«Funcionando» es lo que está en la rama principal hoy; «Por integrar», lo que está en su rama, revisado o en revisión; «Por programar», las fases 3 a 5 de WP-GRAFICOS. **La guía del tutor muestra solo lo que funciona** el día de la entrega; los datos dejan listo el resto para que, al programarse, se luzca sin rehacer la muestra.

# 6. La privacidad y la honestidad

*Todo es ficticio, se dice que lo es, y nada real queda al alcance.*

**REQ-TUT-43 · Todo ficticio, todo marcado.** Cada dato de la muestra lleva la procedencia `DATOS-SINTETICOS` / `SIEMBRA-TUTOR`, y la guía lo dice en la primera página: «Todas las personas y la profesional son ficticias». *Se verifica:* la consulta por procedencia cuenta todo lo de las cuentas de la muestra; ningún dato de esas cuentas sin ella (salvo lo que haga el tutor, que el restablecimiento borra).

**REQ-TUT-44 · Una marca visible de demostración.** El website y la app muestran, con las cuentas de la muestra, una franja discreta «Entorno de demostración · datos ficticios» (D-TUT-04). No interrumpe el recorrido ni tapa contenido. *Se verifica:* las capturas de la matriz la muestran; con cualquier otra cuenta, no aparece.

**REQ-TUT-45 · Ningún nombre real.** Los nombres de las 15 personas, de la profesional y de sus colegas se eligen de una lista ficticia y se cruzan con: los casos reales de Elián, las personas de su servicio con amigos y familia y los nombres de figuras públicas. Elián confirma la lista (D-TUT-01). *Se verifica:* el cruce automático contra una lista que Elián tiene fuera del repositorio, más su confirmación.

**REQ-TUT-46 · Correos que no llegan a nadie.** Todas las cuentas de la muestra usan correos de `@example.invalid`, un dominio que no puede existir. Sin teléfonos, documentos ni direcciones. *Se verifica:* la consulta de los correos de las cuentas de la muestra.

**REQ-TUT-47 · Separada de los casos reales.** Las cuentas de la muestra no tienen vínculo, invitación, pedido ni nota con ninguna cuenta que no sea de la muestra; la cuenta de Elián (persona y profesional) no toca la muestra. *Se verifica:* la prueba de permisos de REQ-TUT-76.

**REQ-TUT-48 · Lo real fuera del alcance del tutor.** Antes de entregar, los casos reales que Elián cargó en test se borran (como quedó acordado al cargarlos) o se mueven a otro entorno, y el tutor no recibe la cuenta de Administración de un entorno con datos reales (D-TUT-05). *Se verifica:* el conteo de personas de test que no son de una cohorte sintética es cero el día de la entrega, o Administración no está entre las cuentas del tutor.

**REQ-TUT-49 · Qué puede romper el tutor, y qué no.** El tutor entra como la profesional y puede hacer todo lo que ella hace: crear planes, activar, revisar, escribir notas, invitar. Nada de eso alcanza a datos fuera de la muestra, y todo se deshace con el restablecimiento (REQ-TUT-66). No puede verificar profesionales ni ver la consola de Administración. *Se verifica:* la prueba de permisos y una prueba de «tutor travieso» (REQ-TUT-77).

**REQ-TUT-50 · Si el tutor invita a alguien real.** La guía le pide no cargar datos reales; si de todos modos invita a una cuenta real o la crea, el restablecimiento corta ese vínculo y borra lo que esa cuenta cargó para la muestra, y se le avisa a Elián. *Se verifica:* la prueba de REQ-TUT-77 con una cuenta creada a mano.

**REQ-TUT-51 · Lo que no es real se declara.** Hay tres cosas que la muestra no puede hacer reales: BE no existía hace 14 meses; los textos de consentimiento y las versiones de los formularios tienen fechas anteriores a su vigencia; y la historia anterior viene de un profesional ficticio. La guía lo dice en una línea, sin esconderlo. *Se verifica:* la línea está en la guía.

**REQ-TUT-52 · Las fotos.** Las fotos de comidas y de recetas son de platos, sin personas ni manos reconocibles, sin marcas y sin metadatos (fecha, lugar, cámara). Salen de fotos propias de Elián o de un banco con licencia que permita este uso, con la fuente anotada fuera del repositorio público. *Se verifica:* la lectura de metadatos de cada imagen da vacío; la lista de fuentes está completa.

# 7. El acceso

*Cómo entra el tutor, con qué, y qué recibe.*

**REQ-TUT-53 · La cuenta de la profesional, en el website.** El tutor entra al website con el correo y la contraseña de la Lic. Julieta Arce. Hoy, por la decisión de Dirección del 18/11, el profesional entra **solo con su contraseña**, sin código de autenticador, hasta que exista el código por correo. Como la muestra es ficticia, el riesgo de una sola llave es bajo. *Se verifica:* el inicio de sesión desde una ventana privada, sin autenticador.

**REQ-TUT-54 · Opcional: la app como Carolina.** Con la última versión de la app, la que la web ofrece para bajar. La app muestra los últimos 90 días: alcanza, porque la historia larga se ve en el website. *Se verifica:* el inicio de sesión en un teléfono limpio y el recorrido de la parada 7.

**REQ-TUT-55 · La contraseña.** Una por cuenta, de 16 caracteres o más, que no se usa en ningún otro lado y que se cambia al terminar la evaluación. *Se verifica:* el cambio queda anotado en el estado del proyecto.

**REQ-TUT-56 · Qué recibe el tutor.** La fila «Usuario de prueba» del Excel de la entrega con el enlace del website, el de la app, y las dos cuentas (correo y contraseña), más la guía «Cómo probar BE» rehecha sobre esta muestra (D-TUT-06). Las credenciales no van en ningún PDF ni en el repositorio: Elián las pasa por el canal que use con el tutor. *Se verifica:* ninguna contraseña en los PDF ni en el repositorio (búsqueda).

**REQ-TUT-57 · Una cuenta por ventana.** La guía avisa que, si abre la profesional y la persona en la misma computadora, la segunda va en una ventana privada. *Se verifica:* está en la guía.

**REQ-TUT-58 · El servidor despierto.** El día que el tutor prueba, el website y la API responden en menos de 3 segundos desde la primera pantalla (el servicio pago de Render no se duerme). *Se verifica:* la primera carga cronometrada la mañana de la entrega.

# 8. La construcción

*Un generador que se puede rehacer en cualquier momento, con el mismo resultado, sin tocar nada a mano.*

## 8.1 El generador

**REQ-TUT-59 · Una extensión de la cohorte que ya existe.** La muestra se arma con el generador de la cohorte (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/`), ampliado con lo que hoy no carga: formularios, fotos, recetas, alimentos propios, medidas caseras, plantillas, fases, bloques y calentamiento, tiempos de la sesión, notas, enfoques, compartir e historia anterior. Lo de hoy va por la API, como un cliente; lo del pasado, por SQL con los disparadores activos y cada transición con su hecho, como hace la cohorte. *Se verifica:* la revisión del código del generador y su prueba en local antes de test.

**REQ-TUT-60 · Primero la historia, después la carga.** El generador arma primero la historia entera como archivos (pura, sin base), corre el chequeo de verosimilitud sobre esos archivos y recién entonces carga. *Se verifica:* sin el informe del chequeo en cero, el paso de carga se niega a correr.

**REQ-TUT-61 · Semilla fija.** La misma semilla («BE-TUTOR-v1») y el mismo «hoy» dan exactamente la misma historia, en local y en test. *Se verifica:* dos corridas con la misma semilla y el mismo día dan la misma huella (un resumen criptográfico de los archivos).

**REQ-TUT-62 · Idempotente.** Correr la carga dos veces no duplica nada: cada cosa tiene una clave estable derivada de la semilla. *Se verifica:* después de dos cargas seguidas, los conteos son iguales a los de una.

**REQ-TUT-63 · Fechas relativas a hoy.** Todo se define como «hace N días» o «en la semana N de la historia»: nada lleva una fecha fija. La historia termina hoy: nada ocurre después del momento de la carga. *Se verifica:* el generador no contiene fechas fijas (búsqueda), y una corrida con otro «hoy» da la misma forma corrida en el tiempo.

**REQ-TUT-64 · Después de integrar la planificación.** La muestra se construye sobre el esquema con la planificación integrada (fases, bloques, calentamiento, plantillas, alimentos propios y medidas caseras), porque los usa (D-TUT-08). *Se verifica:* el generador corre contra la rama principal con esas migraciones.

## 8.2 Dónde corre y cómo se restablece

**REQ-TUT-65 · Corre en test.** La muestra vive en el entorno test (website, API y base de Render). No va a producción. *Se verifica:* la variable de entorno del entorno que la carga.

**REQ-TUT-66 · Se restablece entera.** Un comando borra todo lo de las cuentas de la muestra (lo generado y lo que haya hecho el tutor: planes, notas, invitaciones, personas nuevas que invitó) y vuelve a cargarla. Antes de borrar, muestra los conteos de lo que va a borrar y verifica que nada de eso pertenezca a otra cuenta. *Se verifica:* un restablecimiento en local con una base que tiene además otra cohorte: la otra queda idéntica (mismos conteos y misma huella).

**REQ-TUT-67 · Se rehace cada noche.** Durante la evaluación, la muestra se rehace sola todas las noches a las 4 (hora de Buenos Aires), así «hoy» siempre es hoy y lo que el tutor cambió vuelve a su estado (D-TUT-03). La guía lo dice. *Se verifica:* dos mañanas seguidas, «Te toca a vos» muestra la foto de Tabla 3 con la fecha de ese día.

**REQ-TUT-68 · El día se completa.** A las 12 y a las 18, un paso liviano agrega lo que las personas registrarían hasta esa hora (el desayuno y el almuerzo de Carolina, una sesión de Tomás a la tarde), sin borrar nada. Así, quien mire a la tarde no ve un día vacío. *Se verifica:* a las 12:30, Carolina tiene su desayuno de hoy registrado.

**REQ-TUT-69 · Sin abrir la base a una máquina.** Lo que corre de noche corre dentro de Render, junto a la API, sin abrir la base a ninguna dirección de afuera. La carga a mano desde la computadora de Elián queda solo como respaldo, con el acceso abierto y cerrado en el momento, como hoy. *Se verifica:* la lista de direcciones permitidas de la base de test, vacía después de cada carga.

**REQ-TUT-70 · Si falla de noche, no queda a medias.** Si la carga nocturna falla, la muestra queda como estaba (la del día anterior) y Elián recibe el aviso. Nunca queda una base con la mitad de la muestra. *Se verifica:* una falla provocada en local a mitad de la carga.

## 8.3 Cómo se verifica

**REQ-TUT-71 · El chequeo de verosimilitud.** Un programa que lee la historia generada y aplica todas las reglas R-xx de «La calidad de los datos», con su umbral, y entrega un informe por regla y por persona: cumple, falla (con el dato que falla) o rareza declarada. *Se verifica:* el programa tiene sus propias pruebas, con casos que tienen que fallar (un descanso de 17 minutos, un RIR imposible, macros que no cierran).

**REQ-TUT-72 · Las capturas de cada gráfico por persona.** Cada celda «Luce» y «Vacío» de la matriz, más las tres pantallas de REQ-TUT-03, se captura en Claro y en Azul noche, a 1920×1080 y a 1440×900, con la herramienta de capturas de los gráficos, contra la muestra cargada en test. *Se verifica:* la carpeta de capturas tiene una por celda y yo las reviso antes de mostrárselas a Elián.

**REQ-TUT-73 · El chequeo de textos.** R-TXT-01 recorre todos los textos de la muestra con la guardia de vocabulario de BE y la búsqueda de «asesorado». *Se verifica:* cero hallazgos.

**REQ-TUT-74 · El chequeo después de cargar.** Con la cuenta de la profesional, por la API: los conteos por persona, las fechas de lo último registrado, «Te toca a vos» contra Tabla 3, y los valores clave (rangos de 1RM estimado, pesos de las tomas) contra la historia generada. *Se verifica:* el informe, en cero diferencias.

**REQ-TUT-75 · El chequeo de privacidad.** Los nombres contra la lista de nombres reales, los correos contra `@example.invalid`, los metadatos de las fotos y la ausencia de matrículas reales. *Se verifica:* el informe, en cero hallazgos.

**REQ-TUT-76 · La prueba de permisos.** La cuenta del tutor recibe «no existe» al pedir una persona, una nota o un plan que no son de la muestra, y no entra a Administración. *Se verifica:* un guion de pruebas por la API con cinco pedidos de este tipo.

**REQ-TUT-77 · La prueba del tutor travieso.** En local: con la cuenta de la profesional, crear y activar planes, archivar notas, retirar alimentos, invitar a una cuenta creada a mano y registrar con ella; después, restablecer. *Se verifica:* después del restablecimiento, la huella de la muestra es la de una carga limpia y la cuenta creada a mano no tiene vínculo.

# 9. Los criterios de aceptación

*La lista que tiene que dar todo «sí» antes de darle la cuenta al tutor.*

**Tabla 11.** Los criterios de aceptación: todos se verifican con un informe, una captura o una prueba.

| ID | Criterio | Evidencia |
| --- | --- | --- |
| CA-TUT-01 | El chequeo de verosimilitud da cero fallas en las 15 personas, y las rarezas son exactamente las de REQ-TUT-39 | El informe del chequeo |
| CA-TUT-02 | La misma semilla y el mismo día dan la misma huella en dos corridas; dos cargas seguidas dan los mismos conteos | Las dos huellas y los conteos |
| CA-TUT-03 | El chequeo después de cargar da cero diferencias, y «Te toca a vos» coincide con la foto del día | El informe por la API |
| CA-TUT-04 | Cada celda «Luce» y «Vacío» de la matriz tiene su captura en los dos temas y los dos tamaños, revisada | La carpeta de capturas |
| CA-TUT-05 | Los textos dan cero hallazgos de vocabulario y ningún «asesorado» | El informe de R-TXT-01 |
| CA-TUT-06 | La privacidad da cero hallazgos y no hay datos reales al alcance del tutor | El informe y el conteo de REQ-TUT-48 |
| CA-TUT-07 | La prueba de permisos y la del tutor travieso pasan | Los guiones de prueba |
| CA-TUT-08 | Dos mañanas seguidas, la muestra se rehízo sola y «hoy» es hoy | Dos capturas de «Te toca a vos» con su fecha |
| CA-TUT-09 | Alguien que no conoce BE hace el recorrido con la guía en 20 a 30 minutos | El tiempo y sus comentarios |
| CA-TUT-10 | La revisión con Elián, pantalla por pantalla, termina sin observaciones abiertas | El acta de la revisión |

**REQ-TUT-78 · La revisión final con Elián.** Pantalla por pantalla, siguiendo las siete paradas y después la matriz, Elián mira cada captura y cada pantalla en vivo; lo que observe se corrige en el generador (nunca a mano en la base) y se vuelve a cargar. *Se verifica:* el acta con cada observación y su arreglo.

**REQ-TUT-79 · Una mirada experta, si se puede.** Si Elián tiene a mano un nutricionista o un entrenador de confianza, diez minutos de su mirada sobre Carolina y Valeria valen más que cualquier regla. *Se verifica:* sus comentarios, si los hay, en el acta.

# 10. Lo que necesitamos decidir

*Ocho preguntas cerradas, cada una con la opción que te recomiendo.*

**Tabla 12.** Las decisiones de Dirección para el entorno del tutor.

| ID | La pregunta | Lo que te recomiendo, y por qué |
| --- | --- | --- |
| D-TUT-01 | ¿Los nombres? (Lic. Julieta Arce; Tomás, Valeria, Gustavo, Carolina, Silvia; la colega y el entrenador anterior) | **Confirmarlos, o cambiar los que choquen** con alguien que conozcas. Lo cruzo con tu lista de nombres reales, que no tiene que pasar por el repositorio |
| D-TUT-02 | ¿Solo cinco personas, o cinco en profundidad más diez livianas? | **Cinco más diez livianas.** Con cinco, la cartera y «Tu semana» parecen de alguien que recién empieza, y eso contradice «hace un año que lo usa». Cuesta poco: las livianas usan el mismo generador |
| D-TUT-03 | ¿Se rehace sola cada noche, o solo cuando la pido? | **Cada noche**, durante la evaluación. Si no, en diez días todo lo de «hoy» queda viejo y los pendientes aparecen vencidos. Lo que el tutor cambie se pierde a la noche, y la guía lo avisa |
| D-TUT-04 | ¿Una franja visible «Entorno de demostración», o solo la aclaración en la guía? | **La franja, discreta.** Es honesto, protege si alguien saca una captura de contexto y no le quita inmersión. Es un cambio chico en el website y la app |
| D-TUT-05 | ¿Qué hacemos con tus casos reales en test? | **Borrarlos antes de entregar** (o moverlos a otro entorno) **y no darle al tutor la cuenta de Administración** de un entorno con datos reales. Es lo que quedó acordado al cargarlos |
| D-TUT-06 | ¿La guía «Cómo probar BE» se rehace sobre esta muestra? | **Sí.** La de hoy recorre a Diego con tres profesionales; la nueva recorre a Julieta con sus personas. La cohorte de Diego queda para pruebas internas |
| D-TUT-07 | ¿Con qué persona entra el tutor a la app? | **Carolina**: su día tiene comidas con foto, entrenamiento y tomas, y se entiende rápido. Tomás es la alternativa si querés mostrar más Entrenamiento |
| D-TUT-08 | ¿Se construye ahora con lo que está en la rama principal, o después de integrar la planificación? | **Después de integrar la planificación**, que está terminando su revisión: la muestra usa fases, bloques, calentamiento, plantillas y alimentos propios. Construirla antes obliga a hacerla dos veces |

# 11. Los riesgos y lo que queda fuera

*Lo que puede salir mal, cómo lo cuido, y lo que esta muestra no intenta.*

**Tabla 13.** Los riesgos del entorno del tutor.

| Riesgo | Peso | Cómo lo cuido |
| --- | --- | --- |
| Un experto encuentra un dato imposible | Alto | Las reglas con número (R-xx), el chequeo que bloquea la carga, la revisión con Elián y, si se puede, una mirada experta (REQ-TUT-79) |
| Un dato real queda al alcance del tutor | Alto | Separación por vínculos, borrado de los casos reales y sin Administración (REQ-TUT-47 y 48) |
| La muestra envejece o queda rota a mitad de la evaluación | Medio | Se rehace cada noche, y si falla queda la del día anterior (REQ-TUT-67 y 70) |
| El generador escribe por SQL y un cambio del esquema lo rompe | Medio | Se construye después de integrar la planificación y se prueba en local contra la rama principal antes de cada cambio de esquema (REQ-TUT-64) |
| El tutor ve un gráfico que todavía no existe | Medio | La guía muestra solo lo «Funcionando» el día de la entrega (la matriz) |
| Un gráfico se ve vacío por un detalle del dato (la procedencia de la serie, un pliegue faltante) | Medio | R-TRN-14, REQ-TUT-37 y las capturas de cada celda |
| La computadora no da abasto para cargar y capturar | Medio | La carga corre en Render y las capturas en la CI; en la computadora, un proceso pesado por vez |
| Render cobra algo más por la tarea nocturna | Bajo | Te lo confirmo con el número antes de activarla; si no conviene, se rehace a pedido |
| El tutor entra con la sesión vencida o el servidor lento | Bajo | La primera carga se prueba la mañana de la entrega (REQ-TUT-58) |

**Lo que queda fuera.**

- Una muestra para Administración: el tutor no la necesita para ver el valor de BE, y su consola hoy pide el autenticador.
- iOS: BE es Android y website.
- Los gráficos de las fases 3 a 5: los datos los dejan listos, pero la guía no los muestra hasta que existan.
- El peso en casa, los hábitos versionados y otras áreas de la salud.
- Datos reales de cualquier tipo, aunque sean de personas que lo autoricen: esta muestra es ficticia por diseño.
- Producción: la muestra vive solo en test.

# 12. La auditoría y lo que cambió

*Leí el borrador como el tutor más exigente, como un nutricionista y como un entrenador. Esto es lo que encontré y cómo quedó resuelto.*

> **La idea clave.** Los tres hallazgos más graves: **con una sola profesional no se ven ni el compartir ni la historia anterior**; **los datos reales de test quedaban al alcance de la cuenta de Administración**; y **la fuerza estimada podía quedar vacía** si las series no dicen que las escribió la persona.

## 12.1 Lo que no era creíble

| ID | El hallazgo | Cómo quedó |
| --- | --- | --- |
| H-01 | El borrador ponía a una profesional con las tres áreas sin decir con qué títulos: un nutricionista nota enseguida que el plan alimentario es incumbencia de un licenciado | Licenciada en Nutrición, profesora de Educación Física y antropometrista (REQ-TUT-06) |
| H-02 | Con solo las cinco personas, la cartera y «Tu semana» no son las de alguien que trabaja hace un año | Diez personas livianas y un vínculo finalizado (REQ-TUT-13, D-TUT-02) |
| H-03 | «Progresiones creíbles» sin tasa: nada impedía que alguien con años de entrenamiento subiera como un principiante, o que a todos les fuera bien | Tasas máximas por experiencia (R-TRN-01) y una persona estancada (REQ-TUT-19) |
| H-04 | La descarga se pensaba como una baja de cargas en los registros, pero BE no infiere descargas: sin una versión que la nombre, la cinta no la muestra | La descarga es una versión con nombre en el plan (R-TRN-11) |
| H-05 | «Dejó y volvió» sin magnitud: un entrenador sabe cuánto se pierde en 10 semanas y cuánto tarda en volver | Pérdida de 5 a 15 por ciento y recuperación en 4 a 8 semanas (R-TRN-12) |
| H-06 | «El RIR coherente» no decía coherente con qué: una serie con RIR 3 a una carga cercana al máximo pasaba | El 1RM implícito de cada serie, a 7 por ciento o menos de su mediana (R-TRN-04) |
| H-07 | El generador de la cohorte saca las comidas diferentes de una lista común (asado, milanesa, choripán): a una persona vegetariana le habría tocado carne | Coherencia con lo que la persona no come (R-NUT-06) |
| H-08 | «Registros con huecos» sin forma: una persona que registra exactamente lo indicado todos los días no es creíble | El subregistro, los fines de semana, los días sin registro y lo cargado tarde, con números (R-NUT-04) |
| H-09 | Nada ataba el peso de las tomas a la energía registrada: un nutricionista lo mira primero | El balance de varias semanas, con el subregistro (R-NUT-09) |
| H-10 | La cohorte reparte la suma de pliegues en proporciones fijas por sitio, con poco ruido: en el perfil por sitio entre dos tomas, todos los sitios se mueven casi igual, y eso no pasa con una persona real | El ruido de quien mide por sitio, con uno o dos sitios al revés (R-ANT-03) |

## 12.2 Lo que faltaba para que cada gráfico se luzca

| ID | El hallazgo | Cómo quedó |
| --- | --- | --- |
| H-11 | La fuerza estimada solo usa los seis ejercicios con barra de la lista de la v1, con RIR 0 a 2 y escritos por la persona; la cohorte de hoy no marca la procedencia salvo con una variable, y sin ella los gráficos quedan vacíos | R-TRN-14 y la matriz dicen qué necesita cada uno |
| H-12 | La masa grasa por método pide 8 pliegues (bíceps y cresta ilíaca, para Durnin-Womersley), y la somatocarta pide diámetros que la cohorte no carga | El perfil de cada toma (REQ-TUT-37) |
| H-13 | Los descansos medidos y la duración salen de los tiempos de la app, que la cohorte no genera | Tiempos de sesión con sus reglas (R-TRN-07 y 08) |
| H-14 | El cruce de carbohidratos y fuerza solo existe cuando la misma profesional tiene las dos áreas, y pide etapas de al menos 3 semanas separadas por una versión del objetivo | Valeria, con etapas de 5 semanas o más (REQ-TUT-20) |
| H-15 | La matriz prometía los 25 gráficos, pero diez todavía no están programados y dos están por integrar | La columna «Hoy en BE»; la guía muestra solo lo que funciona |

## 12.3 Lo que podía exponer un dato real

| ID | El hallazgo | Cómo quedó |
| --- | --- | --- |
| H-16 | Test tiene los casos reales de Elián, y la guía de hoy le da al tutor la cuenta de Administración | Borrarlos o moverlos, y sin Administración (REQ-TUT-48, D-TUT-05) |
| H-17 | Una matrícula con formato real podía coincidir con la de un profesional de verdad; las marcas comerciales en los alimentos propios nombran empresas reales | Matrícula imposible (REQ-TUT-07) y alimentos sin marcas (R-NUT-06) |
| H-18 | Las fotos de comidas pueden traer la ubicación y la fecha de quien las sacó, o caras | Fotos sin personas y sin metadatos, con fuente (REQ-TUT-52) |
| H-19 | El tutor podía invitar a una cuenta real y quedar unida a la muestra | El restablecimiento corta y borra, y avisa (REQ-TUT-50) |

## 12.4 Lo que no se podía verificar, y otros cambios

| ID | El hallazgo | Cómo quedó |
| --- | --- | --- |
| H-20 | «Creíble», «excelente» y «que quede bien» no se pueden verificar | Cada regla con un número y su chequeo; cada requisito con su «Se verifica» |
| H-21 | Con una sola profesional, el compartir entre áreas y la historia anterior no se ven: los dos necesitan a otro profesional | Una colega de Nutrición para Silvia y un entrenador anterior para Valeria, mínimos y ficticios (REQ-TUT-21 y 26) |
| H-22 | La cohorte de hoy fija el día al cargarse («recargar exige base nueva»): a los diez días todo envejece, y a la mañana el día de hoy está vacío | Borrado acotado por procedencia, la carga de cada noche y el día que se completa a las 12 y a las 18 (REQ-TUT-66 a 68) |

**Otros ajustes menores**, aplicados sin ID: el descanso de 17 minutos del ejemplo pasó a ser una sola rareza, y solo si BE ya marca los datos dudosos (REQ-TUT-39); la guía dice en una línea lo que la muestra no puede hacer real (REQ-TUT-51); las tres pantallas imprescindibles quedaron nombradas (REQ-TUT-03), porque media hora no alcanza para todo; y cada parada del recorrido funciona sola (REQ-TUT-04).
