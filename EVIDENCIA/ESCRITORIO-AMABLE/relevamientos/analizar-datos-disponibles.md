# Qué datos llegan hoy a «Analizar» (rama `wp-escritorio-amable`)

Solo leí archivos: no compilé ni ejecuté nada. Lo que digo sobre cómo se dibuja sale de leer `lienzo.tsx`, no de una captura.

**Prefijos de rutas absolutas**
- `D/` = `C:\Users\bufim\BE-Best-entrenamiento\packages\domain\src\`
- `A/` = `C:\Users\bufim\BE-Best-entrenamiento\apps\api\src\`
- `W/` = `C:\Users\bufim\BE-Best-entrenamiento\apps\web\src\app\pro\advisees\`
- `S/` = `C:\Users\bufim\BE-Best-entrenamiento\apps\web\src\app\pro\advisees\seguimiento\`
- `M/` = `C:\Users\bufim\BE-Best-entrenamiento\apps\mobile\src\`
- `R/` = `C:\Users\bufim\BE-Best-entrenamiento\`

## Cuatro cosas que no son como se daban por hechas

1. **«¿Cómo viene progresando este ejercicio?» no embebe `EvolucionDelEjercicio`.** Resuelve a `tipo: 'ANALIZAR'` con carga, repeticiones y RIR, dibujadas por el `Lienzo` desde API-PRJ-01 (`D/preguntas-profesionales.ts:209-218`). La que lo embebe es «¿Lo registrado coincide con lo indicado?» con área Entrenamiento (`D/preguntas-profesionales.ts:205-206` → `S/analizar.tsx:262` → `S/contraste.tsx:44-46, 86-97`).
2. **El objetivo de calorías llega y el website lo descarta.** `estadoDe` guarda solo `serie, observaciones, bandas, parcial, generada, zona` (`S/series.ts:98-112`). `energyRequirement` no aparece en ningún archivo de `apps/web`.
3. **`gaps` y `segments[]` llegan y no se leen.** En `apps/web/src` no hay ningún uso de `.gaps`, `.segments` ni `breakReason`; solo se usa `point.segment`.
4. **Un texto visible no coincide con lo que se dibuja en antropometría.** `ausencias` dice «la línea se corta en los huecos» (`D/metricas-del-analisis.ts:361`), pero el tramo solo cambia por grupo de comparabilidad (`D/antropometria-del-analisis.ts:78-81`). La prueba deja dos tomas con 30 días de hueco en el mismo tramo (`D/analisis-longitudinal.test.ts:375-381, 393`).

## 1. La lectura de series (API-PRJ-01)

**Cómo se pide.** `GET /advisees/:id/projections/:key` (`D/cliente-http.ts:1185-1187`), una lectura por métrica. Si el gráfico se agrupa distinto del grano de observación, se suma una segunda (`S/series.ts:125-135`).
- Nutrición: `metric` (por defecto `ENERGY`) y `grain` `DAY|WEEK` (`A/analisis/consultas.ts:226-233`).
- Entrenamiento: `exerciseId`, `metric`, `setIndex`, `unit`, `grain`; `WEEK` solo para `SETS_RECORDED` (`:234-260`).
- Antropometría: `metric` con hasta 3 códigos; el website manda uno (`:261-267`; `S/series.ts:85`).
- Período: 84 días por defecto, 366 como máximo (`A/analisis/consultas.ts:33, 215`).

**Cómo se arma.** `A/analisis/analisis.controller.ts:155-235` lee en una transacción y arma después con funciones del dominio:
- `serieNutricional` (`D/nutricion-del-analisis.ts:127-242`)
- `serieDeEntrenamiento` (`D/entrenamiento-del-analisis.ts:118-259`)
- `serieAntropometrica` (`D/antropometria-del-analisis.ts:71-139`)

Todo está acotado a los planes del profesional que consulta (`A/analisis/fuentes.ts:86, 96`).

**Sobre** (`D/contratos-analisis.ts:323-336`)

| Campo | Uso hoy |
|---|---|
| `period.timeZone` | zona del CSV (`S/series.ts:111`) |
| `partialView` | «Vista parcial…» (`S/analizar.tsx:300`) |
| `generatedAt` | «generada el…» (`S/analizar.tsx:860`); `ahora` de las etapas |
| `dataState` | sin acceso / sin especificación (`S/series.ts:102-103`) |
| `projectionKey`, `reason`, `derivation`, `sourceDomains` | no se leen en Analizar |

**Serie** (`D/contratos-analisis.ts:178-190`)

| Campo | Uso hoy |
|---|---|
| `label` | encabezado del resumen en texto y descripción oculta del gráfico (`D/series-del-analisis.ts:484`; `S/analizar.tsx:216, 222-239`) |
| `unit` | eje, títulos, tabla; rehace la definición antropométrica (`S/series.ts:176`) |
| `scale` | solo dominio: la referencia exige `RATIO` (`D/series-del-analisis.ts:166`) |
| `grain` | guarda de observaciones (`D/series-del-analisis.ts:27-32`); CSV |
| `aggregation` | «cada punto es la media de…» (`S/analizar.tsx:849`); CSV |
| `notes` | lista de «Cómo se calcula» (`S/analizar.tsx:855`) |
| `metricId`, `gaps`, `segments` | **no se leen** |

**Punto** (`D/contratos-analisis.ts:123-164`)

| Campo | Uso hoy |
|---|---|
| `pointId` | claves y mapa de relativos (`S/analizar.tsx:191`) |
| `date`, `dateEnd`, `at` | eje X: la semana va al medio y `at` separa dos tomas del mismo día (`S/lienzo.tsx:37-45`) |
| `value` | lo dibujado; `null` no se dibuja (`S/lienzo.tsx:173-174`) y se lee «Sin valor conocido» (`S/analizar.tsx:775, 899`) |
| `quality` | `PARTIAL` es punto hueco (`S/lienzo.tsx:251`); textos (`S/analizar.tsx:94`) |
| `n` | «n = N» en la lectura (`S/analizar.tsx:775`) |
| `segment` | una línea por tramo (`S/lienzo.tsx:168-177`); tramo de la referencia (`S/analizar.tsx:715`) |
| `corrected` | «con una corrección vigente» (`S/analizar.tsx:777`) |
| `partialBucket` | punto hueco suelto, sin línea (`S/lienzo.tsx:171, 177`); «día en curso…» (`S/analizar.tsx:96-97`) |
| `dataClass`, `method` | forma del punto (`S/lienzo.tsx:252`), leyenda (`S/analizar.tsx:312-321`), tabla (`:901`) |
| `missing` | «Falta: 2 registro(s) sin cantidades» (`S/analizar.tsx:780`) |
| `detail` | renglón de notas de la lectura (`S/analizar.tsx:779`) |
| `sources`, `sourcesTruncated` | «Ver el origen de este dato» (`S/analizar.tsx:519, 812-826`) |
| `planVersionIds` | no en el website; lo usa `resumirEtapa` (`D/etapas-de-planificacion.ts:147, 177`) |
| `coverage` | no se lee del punto; va al CSV (`D/exportacion-del-analisis.ts:149-151`) |

**Resultado por clave**
- **Nutrición** (`D/contratos-analisis.ts:229-254`):
  - `recorded`: la serie.
  - `prescribed.energyRequirement` y `prescribed.note`: no se leen.
  - `coverage`: Resumen e Información (`S/series.ts:255`).
  - `planVersions`: bandas y etapas.
- **Entrenamiento** (`:276-292`): `exercises` alimenta el selector (`S/series.ts:253`); `progression.series` es la serie; `planVersions`.
- **Antropometría** (`:307-314`): `available` alimenta el selector; `series[0]`; `honesty` no se lee.

## 2. Lo planificado frente a lo registrado

**Nutrición**

| Dato | Dónde llega hoy | Forma y vigencia |
|---|---|---|
| Calorías objetivo | API-PRJ-01, solo con `metric=ENERGY`: `result.prescribed.energyRequirement[]` (`A/analisis/lectura-proyecciones.ts:71-78`) | `{objectiveVersionId, from, to, value, unit:'kcal/day'}` (`D/contratos-analisis.ts:221-227`) |
| Calorías objetivo, solo el vigente hoy | API-DSH-03, ya en `panel` (`W/workspace.tsx:90`): `domains.nutrition.summary.objective` | `estimatedEnergyRequirement.value` y `effectiveFrom`; sin fin ni historia (`D/contratos-vinculo.ts:307-313`) |
| Calorías objetivo, como texto | API-DSH-04, entradas `NUTRITION_OBJECTIVE_SET` | `details`: «Requerimiento energético estimado: 2.200 kcal/día» (`A/analisis/lectura-linea-de-tiempo.ts:133`) |
| Carbohidratos, grasas y proteínas objetivo | **Ninguna lectura de la ficha** | — |
| Fibra objetivo | No existe | el objetivo solo tiene `protein, carbohydrate, fat` (`D/contratos-nutricion.ts:93`) |

- **Calorías: por tramo, no por día.** Hay un escalón por versión del objetivo. `to` es el día en que empieza la sucesora o el fin declarado, y `null` si sigue (`A/analisis/fuentes.ts:136-142`). Lo fija `R/test/integration/analisis.int-spec.ts:270-285`. Con otra métrica la lista llega vacía.
- **Macros: no están en ninguna de las tres lecturas.**
  - API-PRJ-01 lee solo `requerimientoKcal` (`A/analisis/fuentes.ts:144-159`).
  - API-DSH-03 selecciona solo `requerimientoEnergetico` (`A/dashboard/lectura-dashboard.ts:145`).
  - `S/` no llama a `listarObjetivos` ni a `objetivoEfectivo`.
- **Dónde sí existen:** API-NUT-05 y 06 (`D/cliente-http.ts:711-716`; `A/nutricion/evaluaciones.service.ts:217-241`), que hoy usa solo la pestaña Nutrición (`W/nutrition/resumen.tsx:42, 182-185`). Traen `macronutrientDistribution` con `effectiveFrom` y `effectiveUntil`. Tres reparos si se usaran desde la ficha:
  - La unidad puede ser `'g/day'` o `'energy_share'` (`D/contratos-nutricion.ts:92`); el formulario del website escribe siempre `g/day` (`W/nutrition/formularios.tsx:201`).
  - `effectiveUntil` es el declarado: una versión reemplazada lo conserva vacío, así que el corte habría que recalcularlo en el navegador.
  - Pagina de a 20 (`A/http/paginacion.ts:9`).
- El paquete ya lo anticipa como fuera de alcance: `R/docs/paquetes/WP-ESCRITORIO-AMABLE.md:152`.
- **Lo previsto del plan no es un objetivo diario.** Las opciones por comida no se suman (`D/nutricion-del-analisis.ts:259-260`), y «Energía prevista del día» está como `INCOMPLETA` (`D/metricas-del-analisis.ts:133-156`).

**Entrenamiento**

- **En API-PRJ-01 lo planificado llega solo como texto.** Es un renglón de `detail`: `{label:'Objetivo de esta serie', value:'8 a 10 rep' | '40 kg (sugerida)' | '75 % RM (no se convierte a kg)' | 'sin fijar'}` (`D/entrenamiento-del-analisis.ts:83-98, 231`). Hoy se ve en la lectura (`S/analizar.tsx:779`). No es un número para dibujar.
- **`EvolucionDelEjercicio` usa otras dos lecturas** (`S/contraste.tsx:53-72`):
  - API-TRN-21 (`contextoDeRevisionDeEntrenamiento`), con tope de 92 días (`S/contraste.tsx:41-42, 52`; `A/entrenamiento/revisiones.service.ts:36-38`). Trae `registeredExecutions[]` y `activePlanVersions`.
  - API-SER-01 (`planConObjetivos`), una por versión, con los objetivos por serie (`W/training/ejecuciones.tsx:252-254`).
- **Forma de cada ejecución** (`D/contratos-entrenamiento.ts:662-678`):
  - Planificado: `plannedSession.prescriptions[]`, con `sets[].repetitions` (valor o rango), `intensity` y `suggestedLoad` (`:298-311`).
  - Registrado: `original`, `corrections` y `effectiveView`, con `load`, `completedRepetitions` y `rir` por serie.
- **Lo que arma el dominio.** `observacionesDelEjercicio` → `evolucion` devuelve `PuntoDeEvolucion {indice, observacion, fila, planificado, registrado, diferencia, tramoPlanificado, tramoRegistrado}` (`D/comparacion-de-entrenamiento.ts:554-569, 575-628`).
  - `ValorPlanificado`: `valor` (con `sugerida`), `rango {min,max}`, `sin-fijar`, `porcentaje-rm`, `otra-unidad`, `no-planificada`, `sin-serie`, `otro-ejercicio`, `identidad-desconocida` (`:279-292`).
  - `ValorRegistrado`: `valor`, `sin-dato`, `otra-unidad`, `no-realizada` (`:294-298`).
- **Cómo lo dibuja hoy** (`W/training/comparacion.tsx`):
  - Planificado: línea discontinua con cuadrados (`:927-945`); un rango va como barra rayada (`:925`).
  - Registrado: línea continua con círculos (`:946-963`).
  - Sesión sin valor: franja gris rayada (`:888-892`).
  - El eje X es el orden de las sesiones, no el tiempo (`:897-909`).

**Antropometría: confirmado, no hay nada planificado.**
- El resultado no tiene `prescribed` ni `planVersions` (`D/contratos-analisis.ts:307-314`).
- `planVersionIds: []` (`D/antropometria-del-analisis.ts:104`) y las bandas quedan vacías (`S/series.ts:110`).
- «Antropometría no tiene objetivo ni plan en BE» (`S/resumen.tsx:222`).
- Prisma solo tiene objetivos de nutrición y de entrenamiento (`R/prisma/schema.prisma:1148, 1164, 1813, 1827`).

## 3. Los días sin registros

| Caso (nutrición, grano día) | Qué llega | Cómo se ve hoy |
|---|---|---|
| Día sin registros | no hay punto; además `gaps[] {from,to,days}` (`D/nutricion-del-analisis.ts:234`) | gráfico: nada, la línea se corta. Lectura: «Sin dato en esta fecha. El más cercano…» (`S/analizar.tsx:787-792`) |
| Con registros, sin cantidades | punto `value:null`, `quality:'UNKNOWN'`, `missing` con `SIN_CANTIDADES` o `COMIDA_DIFERENTE_SIN_CANTIDADES` (`:61-65, 159-169`) | gráfico: nada. Lectura: «Sin valor conocido» y «Falta: …» |
| Con cantidades, sin dato del nutriente | igual, con `SIN_DATO_DEL_NUTRIENTE` | igual |
| Subtotal | valor con `quality:'PARTIAL'` | punto hueco |
| Hoy, en curso | `partialBucket:true` si tiene registros (`:164`); si no tiene, no hay punto | punto hueco suelto |

- **En el gráfico de hoy, un día sin registros y uno con registros sin cantidades se ven igual:** nada dibujado. Solo los separan la lectura, la tabla y los conteos.
- **Los conteos.** `resumirPeriodo(…, hoy)` → `diasDelResumen` da `sinRegistros`, `sinCantidades`, `sinDatoDelNutriente` y `hoyEnCurso` (`D/series-del-analisis.ts:305-323`). `partesDeLaCobertura` los pasa a texto (`:411-423`). Devuelve cantidades, no fechas.
- **Sí se puede saber día por día.** Son las fechas del período sin punto en `estado.observaciones`, o los rangos de `gaps`. Para nutrición, `observaciones` es siempre diaria aunque el gráfico esté por semana (`S/series.ts:128-129`).
- Reparos:
  - `gaps` cuenta a hoy si todavía no tiene registros; hay que excluirlo con `hoyEn()` (`S/estado.ts:52-54`).
  - `gaps` cuenta los días anteriores al primer plan. Se separan con `planVersions[].from`; el Resumen ya lo aclara (`S/resumen.tsx:790-793`).
  - Por semana, `gaps` llega vacío.
- **Entrenamiento:** `gaps: []`, «no tener sesión un día no es un dato faltante» (`D/entrenamiento-del-analisis.ts:254-255`). Una sesión sin dato de la serie no es un punto: se saltea y solo queda un conteo en `notes` (`:201-210, 241-242`).
- **Antropometría:** `gaps` son los días sin toma (`D/antropometria-del-analisis.ts:135`).
- **Dato ya disponible sin pedir nada:** `useDisponibles` lee nutrición con `metric:'RECORDS'` (`S/series.ts:226`). Esa respuesta trae la serie diaria de registros con sus `gaps` y hoy se tira; solo se guardan `coverage` y `planVersions`.

## 4. Tramos, bandas e hitos

- **Tramos.** `point.segment` define las líneas: una `<Line connectNulls>` por tramo (`S/lienzo.tsx:163-185, 320-323`).
  - Nutrición: `t1, t2…`; lo corta un día sin registros o sin valor (`D/nutricion-del-analisis.ts:146-152`).
  - Entrenamiento: lo corta una sesión sin dato (`D/entrenamiento-del-analisis.ts:221`).
  - Antropometría: `${comparabilityGroup}#n`; lo corta un cambio de grupo o `incomparableWithPrevious` (`D/antropometria-del-analisis.ts:78-81`).
- **`segments[]` no se muestra.** Trae `{segment, label, breakReason}`. En antropometría, `label` es «protocolo · método · unidad» y `breakReason` es «Cambió el protocolo de medición.», «Cambió el método de cálculo.» o «Cambió la unidad.» (`:65-69, 84-88`). Lo único visible del corte es una nota general (`:137`) y el aviso por punto de otro tramo en cambio relativo.
- **Bandas.** `VigenciaDePlan {domain, planVersionId, label:'v2', activatedAt, from, to, endedAt, endReason}` (`D/contratos-analisis.ts:194-212`; `A/analisis/fuentes.ts:74-78`).
  - Se dibujan como `ReferenceArea` con relleno `var(--fondo-suave)` y rótulo «Nutrición v2» (`S/lienzo.tsx:288-299`).
  - Salen solo de las series cargadas (`S/analizar.tsx:208-210`): con métricas solo antropométricas no hay bandas, aunque `disponibles.vigencias` tenga las dos áreas (`S/series.ts:250`).
  - La banda de referencia y el arrastre usan el mismo gris (`S/lienzo.tsx:301, 325`). Un sombreado gris para días sin registros se confundiría con los tres.
- **Hitos.** API-DSH-04 con ocho tipos y `limit:'50'`, sin paginar (`S/analizar.tsx:98, 211-213`); el orden es del más reciente al más antiguo (`D/linea-de-tiempo.ts:29-31`). Se usan solo `occurredDate` y `title` (`S/analizar.tsx:214`). Se dibujan como línea vertical punteada sin rótulo (`S/lienzo.tsx:303-305`) y se listan en un desplegable (`S/analizar.tsx:342-353`). Llegan y no se usan `eventType`, `domain`, `source`, `details`, `planVersionId`.

## 5. La referencia del cambio relativo

- **Qué es.** `ReferenciaDelCambio`: `FIRST_DAYS {days 1..31}` o `RANGE {start,end}` (`D/contratos-analisis.ts:513-516`). Por defecto, los primeros 7 días (`S/estado.ts:217`); en la URL, `ref=N` o `ref=AAAA-MM-DD_AAAA-MM-DD` (`:219-234`).
- **Cómo se calcula.** `referenciaElegida` sobre las observaciones, nunca sobre lo agrupado (`D/series-del-analisis.ts:212-218`; `S/analizar.tsx:180`). La regla depende del área (`:164-190`):
  - Nutrición: media de los días con valor.
  - Entrenamiento: mediana de las sesiones.
  - Antropometría: la primera toma; solo se compara con puntos de su mismo tramo.
  - Los baldes incompletos quedan fuera.
  - Fórmula: `100 × (valor − ref) / ref` (`:221`).
- **Motivos de invalidez** (`:119-127`) y su texto (`S/analizar.tsx:82-87`):
  - `ESCALA_NO_ADMITE`: «no admite cambio relativo (no es una escala de razón)»
  - `SIN_OBSERVACIONES`: «no tiene observaciones en los días de referencia»
  - `NO_POSITIVA`: «su referencia es cero o negativa»
  - `FUERA_DEL_PERIODO`: «el rango de referencia no está dentro del período leído»
- **No admiten cambio relativo:**
  - `nutricion.registros`
  - `entrenamiento.rir`
  - `entrenamiento.series-registradas`
  - Las antropométricas con unidad `%` o código `grasa-*`, `indice-*` o `imc` (`D/metricas-del-analisis.ts:320, 354`)
- **Con una sola serie sin referencia válida, el modo se deshabilita para todas** (`S/analizar.tsx:184-186`). El radio dice «No disponible: Registros: no admite cambio relativo…» (`:424-435, 542-546`) y la vista cae a paneles. Dos preguntas quedan sin cambio relativo por construcción: «¿Qué cambió desde que empezó este plan?» en nutrición (incluye Registros) y «¿Cómo viene progresando este ejercicio?» (incluye RIR).
- **Consecuencia leída en el código, no probada:** el editor de la referencia solo se muestra en modo relativo (`S/analizar.tsx:469-479`). Si el modo está deshabilitado por `SIN_OBSERVACIONES` o `FUERA_DEL_PERIODO`, no hay en pantalla forma de elegir otra referencia.
- **Con referencia válida** se muestra:
  - «Referencia: los primeros 7 días del período, del … al …» (`:323-328`).
  - Por serie, regla, rango, valor, `n`, subtotales e incompletos, con «pocas observaciones, la referencia es frágil» si `n < 3` (`:700-710`).
  - Por punto, «+3,2 % contra la referencia · valor real …» o «sin cambio relativo: es de otro tramo comparable que la referencia» (`:713-718`).

## 6. El catálogo, «Energía» y el orden

**Métricas fijas, en el orden en que se ofrecen** (`D/metricas-del-analisis.ts:100-157, 164-312, 315`)

| # | id | nombre / nombre corto | unidad | área | notas |
|---|---|---|---|---|---|
| 1 | `nutricion.energia` | Energía registrada / Energía | kcal | Nutrición | día: suma de lo conocido; semana: media |
| 2 | `nutricion.proteinas` | Proteínas registradas / Proteínas | g | Nutrición | |
| 3 | `nutricion.carbohidratos` | Carbohidratos registrados / Carbohidratos | g | Nutrición | |
| 4 | `nutricion.grasas` | Grasas registradas / Grasas | g | Nutrición | |
| 5 | `nutricion.fibra` | Fibra registrada / Fibra | g | Nutrición | |
| 6 | `nutricion.registros` | Registros de comida / Registros | registros | Nutrición | conteo; sin cambio relativo |
| — | `nutricion.energia-prevista-del-dia` | Energía prevista del día / Energía prevista | kcal | Nutrición | no se ofrece |
| 7 | `entrenamiento.carga` | Carga registrada en la serie / Carga | kg o lb | Entrenamiento | pide ejercicio y serie |
| 8 | `entrenamiento.repeticiones` | Repeticiones registradas en la serie / Repeticiones | rep | Entrenamiento | |
| 9 | `entrenamiento.rir` | RIR declarado en la serie / RIR | RIR | Entrenamiento | ordinal |
| 10 | `entrenamiento.series-registradas` | Series registradas del ejercicio / Series registradas | series | Entrenamiento | conteo; admite semana |
| — | `entrenamiento.volumen-carga-externa` | Volumen de carga externa… / Volumen | kg·rep | Entrenamiento | no se ofrece |
| — | `entrenamiento.descanso-registrado` | Descanso registrado entre series / Descanso | s | Entrenamiento | no se ofrece |

- **Antropométricas:** son dinámicas, `antropometria.<código>`. El nombre y el nombre corto salen de `nombreDeMetrica` y la unidad, de los datos (`D/metricas-del-analisis.ts:335-370`; `D/nombres-de-metricas.ts:9-70, 107-112`). Se ofrecen en orden alfabético de código (`A/antropometria/evolucion.service.ts:149`).
- **Cómo se ofrecen:** áreas en el orden Nutrición, Entrenamiento, Antropometría (`S/selector.tsx:52`); el desplegable muestra `nombre` (`:155-159, 179-183`), y los chips, la leyenda y las tablas muestran `nombreCorto` (`:27`). Los ejercicios van por cantidad de sesiones (`S/series.ts:253`).
- **Máximo 3 métricas:** `MAXIMO_DE_METRICAS` (`D/metricas-del-analisis.ts:398`) y el contrato de vistas guardadas (`D/contratos-analisis.ts:553`). Calorías más tres macros no entran juntas.

**Dónde «Energía» es texto visible**
- **Dominio:**
  - `D/metricas-del-analisis.ts:101`: nombre y nombre corto. De ahí sale también la explicación «Energía registrada en los registros de comida…» (`:91`), que se ve en el selector (`S/selector.tsx:224`) y en «Cómo se calcula» (`S/analizar.tsx:845`).
  - `D/metricas-del-analisis.ts:136-137`: «Energía prevista…», en «Lo que todavía no se ofrece» (`S/selector.tsx:238-246`).
  - `D/preguntas-profesionales.ts:75`: «Energía y proteínas registradas… en paneles sincronizados», en la tarjeta de la pregunta.
  - `D/copy-recetas.ts:78`: «Energía y macros estimados», de la pantalla de recetas.
- **API:**
  - `recorded.label = 'Energía registrada'` viaja en la respuesta (`D/nutricion-del-analisis.ts:228`) y encabeza el resumen en texto.
  - `A/analisis/lectura-linea-de-tiempo.ts:184`: detalle «Energía registrada» en cada comida de la línea de tiempo. En el mismo archivo, `:186` ya dice «Calorías y macros».
- **Website:** el único literal es `W/nutrition/importacion.tsx:38`. En `S/` no hay ninguno: todo sale del dominio. Aparte, «requerimiento energético estimado» está en `S/resumen.tsx:203`, `S/informacion.tsx:78` y `W/tarjetas-de-dominio.tsx:41`.
- **APK:** un literal propio, `M/pantallas/nutricion.tsx:148`. No importa el diccionario del análisis ni llama a API-PRJ-01 ni a API-DSH-04. Sus rótulos de nutrientes salen de `ETIQUETA_DE_NUTRIENTE`, que ya dice «Calorías» (`D/copy-recetas.ts:23-29`; `M/franja-de-macros.ts:14, 35`).
- **Pruebas que lo fijan:**
  - `D/analisis-longitudinal.test.ts:127` y `:539`.
  - `R/test/integration/analisis.int-spec.ts:132`, por el rótulo de la línea de tiempo.
  - `R/EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/recorrido.mjs:790, 794` y `recorrido-comprension.mjs:940, 992`, que buscan la fila que empieza con «Energía».
  - `D/exportacion-del-analisis.test.ts:71, 102` usa «Energía» como nombre propio de la prueba: no depende del diccionario.

**¿Se puede cambiar solo para el website?** Sí, por dos caminos:
- **Solo en `apps/web`:** nombre local en `nombreDeLaReferencia`, en las opciones del selector y en `tituloDeLaMetrica` (`S/analizar.tsx:1165`), más pisar `serie.label` antes del resumen en texto. Seguirían diciendo «Energía» la explicación del diccionario, la tarjeta de la pregunta y el detalle de la línea de tiempo.
- **En el dominio:** cambiar `nombre` y `nombreCorto`. La APK no muestra esos textos. Cambia el texto de `recorded.label` (el esquema no) y rompe las dos aserciones del dominio y los recorridos.
- **Los nombres antropométricos sí son compartidos con la APK:** `nombreDeMetrica` lo usa `D/resumen-de-la-toma.ts`, que la APK llama (`M/pantallas/antropometria.tsx:38, 142`).

**Dónde se define el orden**
- Hoy es el orden del arreglo `DE_NUTRICION`: Energía, Proteínas, Carbohidratos, Grasas, Fibra, Registros (`D/metricas-del-analisis.ts:100-105`).
- Lo consumen en orden solo `S/selector.tsx:33-35` y `S/resumen.tsx:721`. La API usa `.find` (`A/analisis/lectura-proyecciones.ts:51`) y ninguna prueba lo fija. Reordenar ahí, o localmente en el website, no toca la API ni la APK.
- El orden de las series en pantalla es el de `m=` en la URL. Las preguntas lo arman como energía, proteínas y una tercera (`D/preguntas-profesionales.ts:201, 208, 225`).
- El orden del diseño ya existe en el dominio para otra pantalla: `NUTRIENTES_CALCULADOS = ['energyKcal','carbohydrateG','fatG','proteinG','fiberG']` (`D/calculo-nutricional.ts:25`), fijado por `D/recetas-y-registro.test.ts:52`.

## 7. La clase del dato

- **Solo antropometría.** `dataClass` vale `MEASURED`, `REPORTED` o `DERIVED` en cada punto (`D/antropometria-del-analisis.ts:102`; `D/antropometria.ts:119-123`). Una medición trae la clase de su fila; un resultado de método es siempre `DERIVED` (`A/antropometria/evolucion.service.ts:315`).
- **`method`** `{methodVersionId, name, nature}` llega solo si es `DERIVED` (`D/antropometria-del-analisis.ts:90`). Con él, `claseEnPalabras` dice si es índice, suma o estimación (`:60-63`).
- **Nutrición y entrenamiento: siempre `null`** (`D/nutricion-del-analisis.ts:165, 200`; `D/entrenamiento-del-analisis.ts:153, 184, 224`). El paquete lo deja fuera como dato nuevo (`R/docs/paquetes/WP-ESCRITORIO-AMABLE.md:151`).
- Lo más parecido en nutrición es el modo de registro por comida (`QUANTITIES_FROM_PLAN`, `QUANTITIES_REPORTED`, `QUANTITIES_UNCONFIRMED`), que está en la línea de tiempo y no en los puntos (`D/contratos-analisis.ts:366-376`).

## Se puede dibujar hoy sin tocar la API

1. **Calorías registradas y objetivo de calorías en el mismo gráfico**, como escalón discontinuo por vigencia. El dato ya está en la respuesta de `metric=ENERGY`; falta pasarlo por `EstadoDeSerie` (`S/series.ts:31-46, 98-112`). Es el requerimiento del objetivo, no «lo previsto del plan».
2. **Días sin registros sombreados** en los gráficos diarios de nutrición: fechas sin punto en `observaciones`, o `gaps`. Hay que excluir hoy y decidir qué hacer con los días previos al primer plan.
3. **Día con registros sin cantidades o sin dato del nutriente**, que hoy no se ve en el gráfico: `value:null` con `missing[].reason`.
4. **Subtotal y día en curso:** `quality:'PARTIAL'` y `partialBucket`.
5. **Rótulo de cada tramo y motivo de cada corte:** `segments[].label` y `breakReason`.
6. **Bandas con su fin y su motivo**, también con métricas solo antropométricas (`disponibles.vigencias`).
7. **Hitos con tipo y área:** `eventType`, `domain` y `source`; hoy solo se usan fecha y título.
8. **Planificado y registrado por serie en entrenamiento**, con valores numéricos, usando API-TRN-21 y API-SER-01, que la ficha ya lee en el contraste. Límites: 92 días; un rango es franja, no línea; `% RM`, «otra unidad» y «sin fijar» no tienen número.
9. **Clase del dato y naturaleza del método en antropometría.**
10. **La referencia** con su rango, regla, `n`, subtotales e incompletos, y el motivo por serie cuando no hay.
11. **Cobertura por punto:** `coverage` y `detail`.
12. **«Calorías» y el orden Calorías, Carbohidratos, Grasas, Proteínas** solo en el website, con los tres textos que quedarían en «Energía» (punto 6).
13. **Los nombres de los modos** («Separadas», «Juntas»): los valores `PANELS`, `OVERLAY` y `RELATIVE` no cambian (`D/contratos-analisis.ts:554`).

## Pediría ampliar la API o el dominio

1. **La línea de objetivo de carbohidratos, grasas y proteínas dentro de la lectura de series.** `prescribed` es un objeto estricto con solo `energyRequirement` y `note` (`D/contratos-analisis.ts:234-239`). **Zona gris:** API-NUT-05 ya trae los macros; llamarla desde la ficha no cambia contratos, pero suma una lectura y una regla de vigencia en el navegador (reparos en el punto 2). Vos decidís si eso cuenta como «agregar funciones».
2. **Objetivo de fibra:** no existe en el dominio.
3. **Lo planificado como número en los puntos de API-PRJ-01 de entrenamiento.** Hoy es texto en `detail`. Haría falta para dibujarlo en el lienzo de «¿Cómo viene progresando este ejercicio?» con el período de hasta 366 días.
4. **Las sesiones sin dato de la serie** como puntos o huecos en API-PRJ-01: hoy son un conteo en `notes`.
5. **La clase del dato en nutrición y entrenamiento.**
6. **«Lo previsto del día»** como suma del plan: el dominio no tiene regla para elegir entre alternativas.
7. **Cualquier «planificado» en antropometría.**
8. **Una cuarta métrica simultánea:** el máximo de 3 está en el contrato de vistas guardadas.
9. **«Calorías» en la línea de tiempo y en `recorded.label`:** no cambia ningún esquema, pero es texto de la API y del dominio con pruebas que lo fijan.

## No determinado leyendo

- Si en la base hay objetivos con macros en `energy_share` o vacíos. El contrato lo permite y una prueba inserta `'{}'` (`R/test/integration/analisis.int-spec.ts:276`); no leí datos.
- La unidad real de endomorfia, mesomorfia y ectomorfia, de la que depende que admitan cambio relativo.
- El punto sin salida de la referencia (punto 5): sale del código, no lo probé en pantalla.
