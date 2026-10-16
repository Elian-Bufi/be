# Investigación aplicada · Entorno profesional de seguimiento

**Encargo:** BE · Entorno profesional de seguimiento y análisis longitudinal (Dirección, 2026-10-08), §4.
**Consulta de fuentes:** 2026-10-08. **Método:** fuentes primarias (estándares, documentación oficial, publicaciones
originales). Cada fila dice qué se tomó, qué se decidió y qué no se puede atribuir a la fuente.

## Cómo leer este documento

Cada fila separa la **recomendación de la fuente** de la **elección de interfaz** que hace BE. Una elección de interfaz
es reversible y se puede discutir con Dirección. Una recomendación científica no se convierte en validación clínica de
BE: el entorno no diagnostica ni mide efectos.

## 1. Fuentes, hallazgos y decisiones

| # | Fuente (URL, versión) | Hallazgo (cita o síntesis fiel) | Decisión de producto | Limitación |
|---|---|---|---|---|
| F-01 | ONS Service Manual, *Axes and gridlines* — https://service-manual.ons.gov.uk/data-visualisation/guidance/axes-and-gridlines (sin fecha visible) | «Avoid using dual axis charts as they are often misleading and difficult to interpret.» Las barras empiezan en cero; las líneas pueden recortar el eje («if your data values range between 92 and 100, start your axis at 90»), con un espacio entre el eje y el primer dato. «If you are making several charts that show comparable data, try to use the same axis scale for each chart.» | **Sin doble eje vertical.** Unidades distintas van en **paneles sincronizados** (mismo eje temporal, cada uno con su escala). Las líneas pueden no empezar en cero, con un margen visible. Las barras (por ejemplo, de series realizadas) empiezan en cero. | Es una guía de estilo estadístico oficial, no un estudio de percepción. |
| F-02 | Government Analysis Function, *Data visualisation: charts* (19-05-2022) — https://analysisfunction.civilservice.gov.uk/policy-store/data-visualisation-charts/ | «Aim for a maximum for four lines.» Sobre los datos faltantes: «Do not join the points either side of the missing data point, even if the line is dotted or dashed. Joining points implies we know something about the data.» No recomienda el doble eje. Pide no depender solo del color para asociar etiquetas, y ofrecer «a table of the data presented in the chart [or] a text description». | **Tope de tres métricas** (por debajo del máximo de cuatro). **Las líneas se cortan en los huecos**, sin punteado que los una. Hay **nombres directos** en cada panel además del color, y una **tabla de datos** junto con un resumen textual. | Guía de gobierno; no trata datos de salud individuales. |
| F-03 | W3C WAI, *Complex Images* (actualizado el 08-04-2026) — https://www.w3.org/WAI/tutorials/images/complex/ | «A two-part text alternative is required»: una descripción corta que identifica la imagen y una larga que da «the essential information conveyed by the image». La larga puede ir con `figure`/`figcaption`, con un vínculo o con `aria-describedby`, e incluir una tabla. | Cada gráfico es un `figure` con un **título y período** (corto) y un **resumen textual** con n, fechas y cortes, además de la **tabla de datos** (larga) a un clic, en la misma página. | Tutorial informativo, no normativo. |
| F-04 | W3C, *WCAG 2.2*, Recomendación del 12-12-2024 — https://www.w3.org/TR/WCAG22/ | Criterios aplicables: 1.1.1, 1.3.1, 1.4.1, 1.4.3, 1.4.10 Reflow, 1.4.11, 1.4.12, 1.4.13 contenido en hover/foco (descartable, persistente), 2.1.1, 2.1.2, 2.4.3, 2.4.7, 2.4.11 foco no tapado, **2.5.7 arrastre con alternativa de un solo puntero**, 2.5.8 tamaño de objetivo, 3.3.1, 4.1.2, **4.1.3 mensajes de estado**. | Objetivo **AA** en los recorridos implementados:<br>• **2.5.7:** arrastrar es un atajo; siempre hay campos de fecha y botones;<br>• **1.4.13:** la información del cursor queda fija en un **panel de lectura** bajo los gráficos (no en un tooltip efímero), operable con teclado;<br>• **4.1.3:** la cantidad de resultados y las cargas se anuncian en una región `role="status"`. | No se declara conformidad total: se verifica lo pertinente en los recorridos (la matriz de aceptación dice cómo). |
| F-05 | W3C WAI-ARIA APG, *Slider (Multi-Thumb) Pattern* — https://www.w3.org/WAI/ARIA/apg/patterns/slider-multithumb/ | Cada manija lleva `aria-valuenow/min/max`, y `aria-valuetext` cuando el número no se entiende. El orden de tabulación no cambia con el valor. Advierte: «Some users of touch-based assistive technologies may experience difficulty utilizing widgets that implement this slider pattern». | **El intervalo se elige con dos campos de fecha** (inicio y fin) y con botones de período. El arrastre sobre el gráfico es un atajo, no el único medio. **No se usa un deslizador de dos manijas**, por la advertencia sobre el tacto. | Patrón de referencia; no prohíbe el deslizador. |
| F-06 | STROBE, *Explanation and Elaboration* (Vandenbroucke y otros, PLoS Med 2007; doi:10.1371/journal.pmed.0040297) y checklist v4 (ítems 11, 12c, 13 y 14) — https://www.strobe-statement.org/checklists/ | «Authors should report the number of missing values for each variable of interest … and for each step in the analysis.» Los análisis con casos completos «can be biased and are always inefficient». Ajustar por confusores no establece «the "causal part" of an association». Las recomendaciones «are not prescriptions for setting up or conducting studies». | Cada lectura muestra **n y cobertura por métrica y por período**, y **qué falta**. No se calculan correlaciones ni efectos. El texto fijo de la vista dice: «Coincidencia temporal: no indica causa». La comparación de etapas informa la duración, n y la cobertura de cada una. | STROBE es una guía de **reporte de estudios observacionales**: se usa como marco para pensar sesgos y faltantes. No convierte el entorno en un estudio ni acredita una validación clínica. |
| F-07 | NCI, *Dietary Assessment Primer — Food Record at a Glance* (actualizado el 29-12-2025) — https://epi.grants.cancer.gov/dietary-assessment-primer/profiles/record/ | Los registros están «potentially affected by reactivity». «A single administration of an n-day food record is unable to account for day-to-day variation, two or more non-consecutive administrations are required to estimate usual dietary intake». «Quality of data may decline with increased number of days reported.» | Lo que se muestra es **ingesta registrada**, nunca «consumo». Cada día dice si es un **subtotal** (cantidades conocidas en parte de sus comidas). Las medias declaran su **denominador** (días con cantidades). No se presenta una media como «ingesta habitual». | La fuente trata la epidemiología nutricional, no el seguimiento individual; se usa para la cautela de interpretación. |
| F-08 | Helms, Cronin, Storey y Zourdos, *Application of the RIR-based RPE scale for resistance training*, Strength Cond J 2016;38(4):42-49 (PMID 27531969; PMC4961270) | El RIR es una calificación subjetiva al terminar la serie. «May more accurately gauge intensity at near-limit loads» (es más preciso cerca del fallo). | **El RIR es ordinal:** se muestra como puntos y con **mediana** por sesión (sin promedio ni cambio porcentual). **RIR 0 es una respuesta válida y RIR nulo es «sin informar»;** nunca se imputa. | Solo se verificó el resumen; no se atribuyen cifras de precisión. |
| F-09 | Perini y otros, *Technical error of measurement in anthropometry*, Rev Bras Med Esporte 2005;11(1):86-90 — https://www.scielo.br/j/rbme/a/QvRGJGxRTYJKhSPNMxRk7KQ/?lang=en | ETM absoluto = √(Σd²/2n); ETM relativo = ETM / media × 100. El ETM «allows the estimation of confidence intervals» para saber si un cambio entre mediciones se debe al entrenamiento o a la variación del método. Pide control periódico de la técnica. | Como BE **no registra el ETM** del evaluador ni del equipo, **no se dibujan intervalos ni se califica un cambio como «real» o «significativo»**. Se muestran la diferencia y sus fechas, con n. Un **cambio de método corta la comparación**. | El artículo no fija los límites aceptables (los remite a la norma ISAK). BE no cita valores de ETM que no tiene. |
| F-10 | Mathisen y otros (subgrupo del consenso COI sobre REDs), BJSM 2023;57(17):1148-1158 (doi:10.1136/bjsports-2023-106812; PMID 37752006) — https://bjsm.bmj.com/content/57/17/1148 | Resumen verificado (Europe PMC): las guías piden un **equipo multidisciplinario** y **tratar los datos de composición corporal como información médica confidencial**, para reducir los trastornos alimentarios y la baja disponibilidad energética, y señalan que la práctica redujo el énfasis en informar el % de grasa. | Las métricas corporales **no llevan colores de juicio** ni metas automáticas. Solo se ven con el **permiso vigente** de Antropometría. No hay rankings. El peso no se rotula como grasa ni como músculo. | **El texto completo es de suscripción** (BJSM devolvió 403). No se le atribuyen recomendaciones específicas sobre las condiciones de medición. |
| F-11 | Plaisant y otros, *LifeLines: Visualizing Personal Histories*, CHI '96 (doi:10.1145/238386.238493); proyecto HCIL — https://www.cs.umd.edu/projects/hcil/lifelines/ | «A one screen overview of the record using timelines» con «direct access to the data». Los períodos van como **líneas horizontales**; los eventos puntuales, como **íconos**. Hay «semantic zooming and filters» y acceso al detalle bajo demanda. | **Las vigencias de plan son bandas** y los hechos son **marcas puntuales**. La línea de tiempo se agrupa por día y se expande a demanda. **Cada entrada abre su registro de origen** y se vuelve con el contexto. | Referente de investigación (1996-1998), no un producto actual. |

**Referentes comerciales:** TrainingPeaks y Cronometer Pro, en sus centros de ayuda públicos. Sus páginas respondieron
**403 a la consulta automática**, así que **no se les atribuye ningún dato**. Solo se registra el patrón general visible
en los resultados de búsqueda, sin verificar: los tableros por cliente con rangos de fecha y la comparación de sesiones.
No se copia identidad ni se prometen funciones a partir de esos productos.

## 2. Trabajo del profesional: evaluación experta (recorridos cognitivos)

No hubo profesionales disponibles para entrevistas. En su lugar se hicieron **recorridos cognitivos** con tareas
explícitas, declarados como **evaluación experta**: no hay participantes inventados ni resultados de usabilidad
atribuidos a usuarios.

| Momento | Tarea explícita | Qué necesita ver primero | Riesgo de mala lectura que la interfaz evita |
|---|---|---|---|
| Antes de la consulta | «¿Qué pasó desde que lo vi?» | Período, qué cambió, la fecha real de los datos, qué falta | Leer «sin registros» como «no comió» o «no entrenó» |
| Durante la consulta | «¿Cómo evolucionó el peso con lo registrado?» | Paneles alineados, n por período, cobertura nutricional | Atribuir el cambio de peso a los macros porque las curvas se parecen |
| Durante la consulta | «¿Rinde más en sentadilla?» | Carga y repeticiones del mismo ejercicio, con su objetivo histórico | Comparar ejercicios o unidades distintas como una sola magnitud |
| Comprobación | «¿Este punto de dónde sale?» | El registro original, su método, autor, versión y estado | Perder el período o las métricas al volver |
| Después de la consulta | «Quiero volver a esta vista la semana que viene» | La vista guardada, con los permisos revalidados | Que una vista guardada conceda acceso o copie datos |

## 3. Arquitecturas de interacción comparadas (máximo tres)

| Arquitectura | A favor | En contra | Decisión |
|---|---|---|---|
| **A. Tres vistas dentro de la ficha del asesorado** (Resumen → Línea de tiempo → Analizar), con el período, los filtros y el retorno compartidos | Sigue el mapa de superficies del B10-08 §4 y §32 («no crear `/dashboard` universal»). Conserva el contexto de un asesorado y sus permisos. Responde las preguntas 1 a 8 sin otro menú. | Hay que coordinar el estado entre vistas (la URL y la memoria de la sesión) | **Elegida** |
| B. Centro de analítica global con filtro de asesorado | Compara asesorados rápido | Contradice el B10-08 (ni cartera como triaje ni `/dashboard` universal). Invita a rankings y aumenta el riesgo de exposición entre asesorados. | Descartada |
| C. Gráficos dentro de cada pestaña de dominio, sin vista transversal | Simple y aislada por permiso | No responde las preguntas 6 y 7 (coincidencias entre áreas) y duplica controles | Descartada como base. Las pestañas de dominio siguen siendo el destino de «Abrir registro». |

**Dentro de Analizar** se compararon tres modos de lectura y se adoptan los del encargo:
1. **Paneles sincronizados:** el modo por defecto para unidades distintas (F-01, F-02).
2. **Superposición en valores reales:** solo con la misma unidad y compatibilidad semántica declarada en el diccionario.
3. **Cambio relativo:** contra una referencia explícita, positiva y con n.

**Se descarta el doble eje vertical** (F-01, F-02) y **la normalización 0-1**.

## 4. Decisiones UX derivadas (resumen; el detalle está en ESPECIFICACION.md)

1. El resumen no reemplaza al análisis (B10-08 DEC-10-UX-01): pocas piezas, sin los ocho gráficos.
2. La línea de tiempo ordena por **fecha del hecho**: «Registrado el…» es un metadato secundario y nunca rellena la
   ocurrencia (B10-08 §11; T-06-24).
3. Analizar admite **hasta tres métricas**. Un objetivo graficado como curva ocupa un lugar, y las bandas de plan son
   contexto.
4. **Nada se interpola:** puntos reales y líneas cortadas en los huecos y en los cambios de método (F-02, ADV-10-PRJ-05).
5. **Todo número dice de dónde sale:** unidad, fecha efectiva, n, cobertura y estado (F-06).
6. Ningún juicio de color sobre cambios corporales o de rendimiento (B10-08 §10; F-10).
7. **Accesibilidad:** campos de fecha como alternativa al arrastre, panel de lectura persistente, tabla y resumen textual
   (F-03, F-04, F-05).
