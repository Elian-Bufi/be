# Diccionario de métricas · Analizar

**Versión:** `BE-METRICAS-2026-10-v1`. **Código:** `packages/domain/src/metricas-del-analisis.ts` (la fuente de verdad:
este documento la explica, no la reemplaza). **Deuda:** DL-126. **Encargo:** §3, §10 a §13.

Cada métrica es una **vista de una proyección del 09** (API-PRJ-01) calculada con lo que ya existe en el dominio. No hay
un modelo canónico paralelo ni fórmulas nuevas para obtener una curva. Si la semántica de una métrica cambia, cambia la
versión del diccionario.

## 1. Reglas comunes a todas las métricas

| Atributo | Regla |
|---|---|
| **Identidad** | Un identificador opaco y estable: `nutricion.energia`, `entrenamiento.carga`, `antropometria.<código del catálogo>`. La URL y las vistas guardadas llevan solo identificadores (métrica, ejercicio, número de serie, unidad), nunca texto clínico ni valores. |
| **Fuente y permiso** | Cada métrica pertenece a una clave de proyección, y cada clave a un alcance de la PDP: `NUTRITION_PRESCRIBED_VS_RECORDED` → Nutrición, `TRAINING_PROGRESSION_BY_EXERCISE` → Entrenamiento, `ANTHROPOMETRY_LONGITUDINAL` → Antropometría. El servidor decide el permiso **antes** de leer: sin el alcance, la proyección responde 404 como un asesorado inexistente, y el selector no ofrece esas métricas. Solo se leen los planes, procesos y evaluaciones del profesional que consulta. |
| **Fecha aplicable** | La **fecha civil del hecho** en la zona del asesorado (`America/Argentina/Buenos_Aires` por defecto, DL-009): `localDate` del registro de comida, la fecha local de la sesión registrada y la fecha civil de `occurredAt` de la toma. **Nunca la fecha de carga** (`recordedAt`), que se muestra aparte (T-06-24). |
| **Semana** | De lunes a domingo, en la zona del asesorado. Una semana cortada por el período se marca como parcial (`partialBucket`) y dice cuántos días tuvo. |
| **Observaciones y grano de dibujo** | Cada métrica tiene un grano de **observación**: el día en Nutrición, la sesión en Entrenamiento y la toma en Antropometría (`granoDeObservacion`). El resumen de un período, la comparación de dos períodos y la referencia del cambio relativo se calculan siempre sobre esas observaciones, **en el rango exacto**. La semana es solo un grano de dibujo: agrupar el gráfico no cambia lo que significa un resumen. Una media de medias semanales no pondera los días, y una semana que un rango corta no se puede recortar. Ejemplo: del 7 al 20 de septiembre, con un día de 1.000 kcal en la primera semana y siete de 2.000 en la segunda, la media es 1.875 kcal (n = 8), no 1.500; del 16 al 20 es 2.000 (n = 5), no «sin valor». |
| **Día o semana sin completar** | El día de hoy, que sigue en curso, y una semana que el período corta son baldes incompletos (`partialBucket`). Se dibujan huecos y la lectura lo dice. No entran en la media ni en la mediana de un período, ni en una referencia: con el desayuno de hoy adentro, la media de siete días bajaría unas 240 kcal. El total sí los cuenta, porque lo registrado es real, y avisa que el período no terminó; dos totales no se restan si alguno está incompleto. |
| **Huecos** | No se interpola, imputa ni arrastra. La línea se corta en cada hueco (F-02) y al cambiar de tramo comparable. |
| **Lo desconocido** | `null` con su motivo, nunca 0. El 0 registrado es un dato. |
| **Redondeo** | El cálculo es exacto (racionales). Se redondea **una sola vez, al mostrar**, con los decimales de la métrica. En Nutrición se usa `redondeoDePresentacion` (kcal a entero y gramos a un decimal, HALF_UP), el mismo de la pantalla de registro, para que los dos números coincidan (encargo §11). |
| **Cobertura** | Cada punto lleva `n`, su calidad (completo, parcial o desconocido) y lo que falta. Cada período dice sus días con valor sobre sus días. |
| **Enlace al origen** | Cada punto lista sus registros de origen (`sources`, hasta 60 con aviso de recorte), y cada uno abre su registro en la pestaña de su dominio con retorno al análisis. |
| **Superposición** | Dos métricas comparten un gráfico en valores reales solo si tienen la **misma familia y la misma unidad**. Si no, van en paneles sincronizados (F-01: sin doble eje). |
| **Cambio relativo** | `100 × (valor − referencia) / referencia`, solo en escalas de razón, con una referencia explícita (rango, agregador y n) y positiva. Un porcentaje se compara en puntos porcentuales; el RIR, en sus valores. |
| **Referencia del cambio relativo** | Un rango del **período leído**, nunca el intervalo que se ve: los primeros N días del período (1 a 31; 7 por defecto) o un rango fijo de fechas. Acercar, alejar o restablecer el gráfico no la mueve; cambia solo con «Aplicar». Queda en la URL (`ref`) y en las vistas guardadas. La regla es la de la métrica (media de los días con valor, mediana de las sesiones o primera toma del rango), sobre las observaciones. Un rango que no cae entero en el período no se calcula: no hay con qué. |
| **Clase del dato** | Cada punto dice su clase (`dataClass`), con las palabras de la pestaña de Antropometría: **Medido**, **Reportado** por la persona (no medido) o **Calculado** por un método (una estimación). Hoy solo Antropometría tiene las tres; en Nutrición y Entrenamiento no aplica. El gráfico dibuja con contorno cortado lo reportado y con un punto adentro lo calculado; la lectura, la tabla, el resumen en texto y el CSV (columna «Clase de dato») lo dicen en palabras. |

**Lo que esta versión no calcula, a propósito:** puntajes de adherencia, semáforos, rankings, correlaciones, rezagos,
promedios móviles e intervalos de confianza. Un promedio móvil exigiría declarar ventana, alineación hacia atrás, mínimo
de observaciones y cobertura (encargo §13); la semana con su denominador cubre la lectura resumida sin suavizar
subtotales.

## 2. Nutrición

**Fuente:** los registros de comida efectivos del período. Cada uno aporta `consumed`, el resultado de
`calcularNutrientes` (`SUM_SOURCE_PER_100G_V1`) sobre sus cantidades confirmadas o informadas, con las kcal de la fuente
(no 4/4/9). **Dato derivado.**

| Identidad | Nombre profesional | Unidad | Escala | Clase | Granos y agregación | Familia | Cambio relativo | Resumen de un período |
|---|---|---|---|---|---|---|---|---|
| `nutricion.energia` | Energía registrada | kcal | razón | derivable | día: suma de lo conocido · semana: media de los días con valor | `energia-kcal` | sí | media de los días con valor |
| `nutricion.proteinas` | Proteínas registradas | g | razón | derivable | ídem | `macronutriente-g` | sí | ídem |
| `nutricion.carbohidratos` | Carbohidratos registrados | g | razón | derivable | ídem | `macronutriente-g` | sí | ídem |
| `nutricion.grasas` | Grasas registradas | g | razón | derivable | ídem | `macronutriente-g` | sí | ídem |
| `nutricion.fibra` | Fibra registrada | g | razón | derivable | ídem | `macronutriente-g` | sí | ídem |
| `nutricion.registros` | Registros de comida | registros | conteo | disponible | día: conteo · semana: suma | — | no | total |
| `nutricion.energia-prevista-del-dia` | Energía prevista del día | kcal | — | **incompleta, no se ofrece** | — | — | — | — |

**Fórmulas:**
- **Día:** la suma exacta de lo conocido (`sumaExacta`) de los registros efectivos de esa fecha. Si algún registro del
  día no tiene cantidades o le falta el dato del nutriente, el día es un **subtotal de lo registrado** y dice qué falta.
- **Semana:** `mediaExacta` de los **días con valor** de esa semana. Dice su denominador («3 de 7 días con valor») y
  conserva el estado parcial de cada día. Nunca divide por siete una suma de tres días (encargo §11).
- **Registros:** se cuentan los registros efectivos, con y sin cantidades, del plan o diferentes.

**Ausencias y casos:**
- Un registro sin cantidades confirmadas cuenta como registro de la elección, no como consumo cuantificado.
- Una comida diferente con solo texto o foto no aporta calorías ni macros.
- Lo previsto de una opción del plan nunca se cuenta como consumido, y las alternativas del carrusel no se suman.
- Una **rectificación** cuenta una sola vez, en su versión efectiva. Un registro **anulado** queda en la línea de tiempo,
  fuera del número, y la cobertura dice cuántos se excluyeron.
- Un día sin registros es un hueco, no un punto en cero.

**Comparabilidad:** los cinco nutrientes son comparables entre días del mismo asesorado porque salen del mismo método. Las
proteínas, los carbohidratos, las grasas y la fibra comparten familia y unidad, y pueden superponerse. La energía va en
su propio panel.

**Contexto, no métrica:** el **requerimiento energético del objetivo** vigente se dibuja como escalón, con sus fechas de
vigencia. No es la energía prevista del plan.

**Por qué la energía prevista del día queda incompleta:** el plan ofrece alternativas por comida y BE no tiene una regla
canónica para sumarlas como objetivo del día. Lo previsto se muestra por opción, en el registro de cada comida.

**Límite de interpretación:** es lo registrado, no la ingesta total (F-07: reactividad y variación entre días).
«3 de 4 comidas registradas» es cobertura de esos momentos, no adherencia.

## 3. Entrenamiento

**Fuente:** las sesiones registradas del período en su **vista vigente** (la corrección vigente o el original), por la
identidad del ejercicio del catálogo (`e:<exerciseId>`), con `comparacion-de-entrenamiento.ts`. Cada punto se compara
con el **objetivo histórico de esa serie**: el de la versión del plan que rigió ese día, con la herencia que ya resuelve
el dominio.

| Identidad | Nombre profesional | Unidad | Escala | Clase | Granos y agregación | Familia | Cambio relativo | Resumen de un período |
|---|---|---|---|---|---|---|---|---|
| `entrenamiento.carga` | Carga registrada en la serie | kg o lb (series distintas) | razón | disponible | original: cada sesión | `carga` | sí | mediana |
| `entrenamiento.repeticiones` | Repeticiones registradas en la serie | rep | razón | disponible | original: cada sesión | — | sí | mediana |
| `entrenamiento.rir` | RIR declarado en la serie | RIR | **ordinal** | disponible | original: cada sesión | — | **no** | mediana |
| `entrenamiento.series-registradas` | Series registradas del ejercicio | series | conteo | derivable | original: conteo · semana: suma | — | no | total |
| `entrenamiento.volumen-carga-externa` | Volumen de carga externa | kg·rep | — | **futura, no se ofrece** | — | — | — | — |
| `entrenamiento.descanso-registrado` | Descanso registrado entre series | s | — | **derivable, fuera de esta versión** | — | — | — | — |

**Fórmulas:**
- **Carga, repeticiones y RIR:** el valor de la **serie del mismo número** (serie 1, serie 2…) en cada sesión registrada,
  tomado de `evolucion(observaciones, medida, serie)`. **No se promedian, suman ni eligen máximos entre series**
  (09v10:1285-1295): por eso no existe «la serie más pesada».
- **Series registradas:** las series del ejercicio con carga, repeticiones o RIR en el registro vigente. Una sesión
  registrada como «no realizada» aporta 0 series, y lo dice. La semana suma.

**Ausencias y casos:**
- Una serie sin el dato, un registro resumido u otro ejercicio no son un punto: son «sin dato».
- **RIR nulo es «sin informar» y RIR 0 es una respuesta válida** (F-08).
- **kg y lb no se mezclan:** cada unidad es su propia serie, y el análisis avisa cuántas sesiones quedaron en la otra.
- Los borradores del asesorado no llegan al profesional. Lo que sigue solo en un teléfono no está en la API: se habla de
  lo «recibido por BE».
- Sin calendario prescrito no se inventan sesiones faltantes ni cumplimiento semanal esperado.

**Comparabilidad:** misma identidad de ejercicio, mismo número de serie y misma unidad. Una nueva versión del plan no
corta la serie de lo registrado, pero cambia el objetivo con el que se compara, y la banda de vigencia lo muestra.

**Límites de interpretación:** la carga no es 1RM ni fuerza máxima, ni una marca personal. El RIR es una estimación
subjetiva: se resume con la mediana y nunca con un promedio ni un porcentaje. Más series no prueban mayor estímulo.

**Por qué el volumen queda como futuro:** falta una convención para mancuerna única, carga por implemento,
unilateralidad, asistencia y peso corporal (encargo §12). Con una convención aprobada sería Σ carga externa ×
repeticiones de series compatibles (50 kg × 8 = 400 kg·rep), y aun así no equivaldría a trabajo mecánico, gasto
energético ni hipertrofia.

## 4. Antropometría

**Fuente:** la serie de API-ANT-06 (`construirSerie`), con sus grupos de comparabilidad (protocolo, método y unidad),
huecos y estado de corrección, leída hasta 366 días (ANT-06 conserva su límite de 92). Las métricas salen de los datos
del asesorado: `antropometria.<código>` para cada código del catálogo que tenga observaciones.

| Familia | Ejemplos | Clase | Grano | Familia de superposición | Cambio relativo |
|---|---|---|---|---|---|
| Masa corporal | `antropometria.peso` | medición directa o informada | original (cada toma) | `masa-<unidad>` | sí |
| Perímetros | `antropometria.perimetro-cintura` | medición directa | original | `perimetro-<unidad>` | sí |
| Pliegues | `antropometria.pliegue-triceps` | medición directa | original | `pliegue-<unidad>` | sí |
| Diámetros | `antropometria.diametro-humero` | medición directa | original | `diametro-<unidad>` | sí |
| Sumatorias | `antropometria.suma-6-pliegues-isak` | resultado de un método | original | `sumatoria-<unidad>` | sí |
| Masas estimadas | `antropometria.masa-libre-de-grasa-…` | resultado de un método | original | `masa-<unidad>` | sí |
| Porcentajes e índices | `antropometria.grasa-…`, `antropometria.imc` | resultado de un método | original | ninguna | **no**: puntos porcentuales |

**Reglas:**
- **Cada toma es un punto.** Dos tomas del mismo día son dos puntos («Toma 1 de 2 del día»); no se promedian.
- **Un cambio de protocolo, método o unidad corta la línea** y abre otro tramo, y se rotula. No hay diferencia ni cambio
  relativo entre tramos.
- **Un sitio faltante no es cero.** Si falta un sitio, el método no produce resultado.
- **La clase del dato se muestra:** medido, reportado por la persona o calculado por un método (§1, «Clase del dato»).

**Límites de interpretación:**
- Sin el error técnico de medición documentado (F-09) no se dibujan intervalos ni se califica un cambio como
  significativo.
- Un punto describe un estado; dos, una diferencia con sus fechas. Nunca una tendencia estable.
- El peso no es composición corporal, y masa libre de grasa, masa magra y masa muscular no son sinónimos.
- Ningún valor corporal lleva color de juicio ni meta automática (F-10).

## 5. Contexto que acompaña a las métricas

No son métricas y no se grafican como valores:
- las **vigencias de plan** (Nutrición y Entrenamiento), como bandas;
- las **activaciones y versiones**, las **tomas**, las **revisiones** y los **procesos** abiertos o cerrados, como marcas;
- el **requerimiento energético del objetivo**, como escalón.

Una activación no implica ejecución, y una vigencia no se infiere de la fecha de creación (encargo §10).

## 6. Captura futura (investigada, no implementada)

El encargo pide evaluar estos datos **sin capturarlos** en este paquete. Ninguno se convierte en un formulario diario
obligatorio ni en una integración con wearables. La primera versión produce valor con lo existente, y nada sensible se
capturaría «por si acaso».

**Fuentes nuevas para esta sección (consulta del 2026-10-08, resúmenes verificados en Europe PMC):**
- **F-12 ·** Saw, Main y Gastin, *Monitoring the athlete training response: subjective self-reported measures trump
  commonly used objective measures: a systematic review*, Br J Sports Med 2016;50:281-291 (PMID 26423706). Revisa 56
  estudios. Hallazgo: «Subjective measures reflected acute and chronic training loads with superior sensitivity and
  consistency than objective measures». *Limitación:* son deportistas, no la población de BE, y solo se verificó el
  resumen.
- **F-13 ·** Foster y otros, *A new approach to monitoring exercise training*, J Strength Cond Res 2001;15(1):109-115
  (PMID 11708692). Hallazgo: «the session RPE method is a valid method of quantitating exercise training during a wide
  variety of types of exercise». *Limitación:* se validó contra la frecuencia cardíaca en ciclismo y básquet, no contra
  ejercicios de fuerza con series.

| Candidato | Pregunta que resolvería | Quién lo aporta | Frecuencia mínima útil | Carga para la persona | Unidad o escala | Fiabilidad | Permiso necesario |
|---|---|---|---|---|---|---|---|
| **Fatiga o esfuerzo percibido de la sesión** | ¿La sesión se sintió más dura que lo planificado, con la misma carga? | El asesorado, al cerrar la sesión | Por sesión registrada | Baja: una pregunta | Escala de esfuerzo de la sesión (0-10, ordinal), como en F-13 | Validada como medida de la carga de la sesión (F-13); lo subjetivo refleja la carga con más sensibilidad que varios marcadores objetivos (F-12) | Entrenamiento |
| **Sueño** | ¿Una semana de peor rendimiento coincide con menos descanso? | El asesorado, al despertar | Diaria durante un bloque acotado, no permanente | Media si es diaria | Horas declaradas y calidad ordinal (1-5) | Autoinforme: útil para detectar cambios propios, impreciso como duración absoluta | Entrenamiento, o una dimensión nueva de bienestar con consentimiento propio |
| **Dolor o molestia** | ¿Una baja de carga responde a una molestia localizada? | El asesorado, por sesión; el profesional lo valora | Cuando aparece, no a diario | Baja si es opcional | Zona más intensidad ordinal (0-10) | Subjetiva y contextual; no es diagnóstico | Dato de salud: consentimiento explícito y una dimensión propia. No entra en Entrenamiento sin una decisión de Dirección |
| **Estrés percibido** | ¿Los días de menos registro o rendimiento coinciden con períodos de estrés? | El asesorado | Semanal | Baja | Ordinal (1-5) | Autoinforme (F-12 lo incluye entre las medidas subjetivas sensibles) | Dimensión de bienestar con consentimiento propio |
| **Enfermedad o síntoma agudo** | ¿Hay que excluir un período de la comparación de etapas? | El asesorado o el profesional, como evento | Cuando ocurre | Muy baja | Evento con fechas (sí/no y descripción libre opcional) | Alta como marca temporal; baja como detalle clínico | Dato de salud: consentimiento explícito; BE no lo interpreta |
| **Cambio de medicación** | ¿Un cambio de peso o de rendimiento coincide con un cambio de medicación? | El asesorado o un profesional de la salud habilitado | Cuando ocurre | Baja | Evento con fecha; **sin nombre de fármaco ni dosis** en BE | Depende de quién lo informe | Dato de salud de categoría especial: **no recomendado** sin una base legal y un rol clínico que hoy BE no tiene |
| **Pasos o actividad diaria** | ¿El gasto fuera del entrenamiento cambió entre etapas? | Un dispositivo o una aplicación | Diaria | Nula si es automática; alta si es manual | Pasos por día (conteo) | Variable según el dispositivo y su uso; no comparable entre dispositivos | Una integración nueva, **excluida por el encargo**; se documenta y no se implementa |
| **Circunstancias de la medición** | ¿Dos tomas son comparables (ayuno, hora, hidratación, ciclo, ejercicio previo)? | El evaluador, en la toma | En cada toma | Nula para el asesorado | Casillas estructuradas por protocolo | Alta si se registra en el momento | Antropometría. **Es la más valiosa:** mejora la comparabilidad que ya existe sin pedir nada nuevo al asesorado |

**Recomendación:** si Dirección decide capturar algo, el orden propuesto es (1) las circunstancias de la medición, porque
mejoran lo existente sin carga para el asesorado; (2) el esfuerzo percibido de la sesión, con una sola pregunta al
cerrarla; (3) los eventos de enfermedad, como marcas para excluir períodos. Dolor, medicación y estrés necesitan una
decisión de privacidad antes que una pantalla.
