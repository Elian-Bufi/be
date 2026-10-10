# Analizar · plan de implementación (solo lectura: no compilé ni ejecuté nada)

**Alias (rutas absolutas)**
- `REPO` = `C:\Users\bufim\BE-Best-entrenamiento`
- `SEG` = `REPO\apps\web\src\app\pro\advisees\seguimiento` · `ADV` = `REPO\apps\web\src\app\pro\advisees`
- `CSS` = `REPO\apps\web\src\app\globals.css` · `TOK` = `REPO\apps\web\src\app\tokens.css`
- `DOM` = `REPO\packages\domain\src` · `API` = `REPO\apps\api\src\analisis`
- `MQ` = `C:\Users\bufim\BE-maquetas\planos-fuente` (cuerpos en `MQ\partes\NN-cuerpo.html`, estilos en `MQ\plano.css` y `MQ\analizar.css`, gráficos en `MQ\plano.js`)
- `R` = `REPO\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\recorrido.mjs` · `RC` = `…\herramientas\recorrido-comprension.mjs`
- `CRIT` = `REPO\EVIDENCIA\ESCRITORIO-AMABLE\diseno\CRITERIO-Y-AUDITORIA.md` · `WP` = `REPO\docs\paquetes\WP-ESCRITORIO-AMABLE.md`

Leído sobre `wp-escritorio-amable`, HEAD `a7c0c32` más la Parte 1 en el índice (46 archivos sin confirmar). Las líneas son de ese árbol. Los relevamientos previos son de `ab90860`: sus líneas de `R`, `RC`, `CSS` y `workspace.tsx` ya no coinciden.

## 1. Lo que condiciona el plan

1. **Qué dato llega para lo planificado:**
   - **Objetivo de calorías: llega y hoy se descarta.** `prescribed.energyRequirement` son escalones (`DOM\contratos-analisis.ts:221-239`). `SEG\series.ts:91-95` se queda solo con `res.recorded`. Es presentación.
   - **Objetivo de macros: no llega.** La API lo arma solo con `metric=ENERGY` y devuelve `[]` en el resto (`API\lectura-proyecciones.ts:69-77`). Afecta el panel de proteínas de 03, 04 y 05, y «Mostrar los objetivos» de 11. `WP` §6 ya lo deja fuera.
   - **Plan de entrenamiento: llega solo como texto.** Es el detalle «Objetivo de esta serie: 8 a 10 rep» (`DOM\entrenamiento-del-analisis.ts:212,231`); el `ValorPlanificado` estructurado no viaja. La línea o franja de 07 y 09, y «· igual» o «· dentro del rango», necesitan el número.
     - Hay una vía con operaciones existentes: la lectura de `SEG\contraste.tsx:52-72` (contexto de revisión, hasta 92 días, más `planConObjetivos`) y `evolucion()` del dominio (`DOM\comparacion-de-entrenamiento.ts:575`).
     - Es una decisión: el tope de 92 días no cubre un período de un año.
   - **Clase del dato en comidas y series: no existe.** `dataClass` es `null` fuera de antropometría (`DOM\contratos-analisis.ts:142-147`, `nutricion-del-analisis.ts:165`, `entrenamiento-del-analisis.ts:153,224`). Las etiquetas «Calculado» y «Reportado» de 03, 05, 07, 09, 11 y 12 son C-09, fuera de alcance.
2. **Ya llega y no se usa:**
   - días sin registros: `serie.gaps` (`DOM\nutricion-del-analisis.ts:234`);
   - motivo del corte de tramo: `serie.segments[].breakReason` (`DOM\antropometria-del-analisis.ts:65-69,84-88`);
   - cobertura por panel: `resumirPeriodo` y `partesDeLaCobertura` (`DOM\series-del-analisis.ts:332,411`) sobre `s.estado.observaciones`.
3. **La maqueta 12 distingue las series solo por color.** La leyenda va en el encabezado, sin nombre al final de cada línea. `WP` §7 pide anotarlo en `docs/DEUDA_LEGAJO.md` o nombrar las líneas.
4. **La frase de 12 no vale para todas las métricas.** Dice «El cero es el promedio de cada métrica en esos días»; en entrenamiento la regla es la mediana y en antropometría la primera toma (`DOM\series-del-analisis.ts:175-187`; `SEG\analizar.tsx:693-697`).
5. **El orden del documento cambia.** Hoy es selección → gráficos → lectura → opciones (`SEG\analizar.tsx:272-482`). La barra de modos y «Más acciones» pasan antes de los gráficos. El comentario de `CSS:2897-2903` queda viejo.
6. **Colisiones de nombres de clase con `CSS`:**
   - Existen con otro uso: `.entrada` (`:2801`, línea de tiempo), `.tarjeta` (`:1317`, portada), `.panel` (`:1015`, `:2218`), `.contraste` (`:3715`), `.etapa` y `.etapas` (`:3654-3667`), `.leyenda` (`:1807`), `.cobertura` (`:3127`), `.insignia` (`:749`), `.chip` (`:1833`), `.preguntas` (`:3007`).
   - No existen todavía: `.segmentos`, `.etiqueta`, `.estado`, `.casilla`, `.muestra-de-hueco`.
   - E-02 pide clases nuevas.
7. **Tres rupturas de los recorridos por construcción:**
   - `ejeX > 1` por figura (`R:464,470`), si las fechas van solo bajo el último panel;
   - `dialog[open]` para el origen, en más de diez lugares;
   - `details.vistas-guardadas`, `details.intervalo` y «Descargar los datos (CSV)», si quedan dentro de «Más acciones» cerrado.
8. **`MQ\partes\03-analizar.md` y `MQ\partes\reglas.md` son de la versión 1** (Energía, Paneles y Superpuestas, cuadrados y triángulos). Contradicen los `-cuerpo.html`: no usarlos.
9. **Extender `REPO\scripts\copy-pantallas.test.cjs` a `SEG` (E-05) choca con «%».** Está en la lista de nutrición (`DOM\copy-nutricion.ts:129-147`) y aparece en `SEG\analizar.tsx:717`, `SEG\lienzo.tsx:138-139` y `:272` (`width="100%"`). Hoy la prueba no nombra `seguimiento`.

## 2. Pantallas: regiones, qué las provee hoy y qué cambia

### 2.0 Esqueleto común (03, 09, 11, 12 y 15)

| Región (arriba → abajo, izquierda → derecha) | Hoy | Cambio |
|---|---|---|
| **Marco, junto al período:** enlace «Cómo se lee esta vista» | No existe. `ADV\workspace.tsx:229-234` pone solo pestañas y período | Enlace nuevo (C-04). Su contenido no está dibujado |
| **Renglón de la pregunta:** `h2` con la pregunta o «Comparación libre»; a la derecha, dos botones | `<h2>Analizar</h2>` y `p.metadatos` (`SEG\analizar.tsx:243-244`). Con pregunta: `PreguntaActiva` (`SEG\preguntas.tsx:122-142`) con rótulo «Pregunta», parámetros, límite, «Cambiar los datos» y «Otra pregunta o análisis personalizado». Gobierna `pregunta` y sus parámetros (`SEG\estado.ts:245-281`) | El `h2` es la pregunta. Dos botones: «Cambiar la pregunta» o «Empezar por una pregunta», y «Más acciones» |
| **Métricas, que son la leyenda:** chips con muestra, nombre y ×; «3 de 3 métricas» | `SelectorDeMetricas` (`SEG\selector.tsx:109-123`): `h3` «Métricas (3 de 3)», `ul.metricas-elegidas`, enlace «Quitar» con el nombre oculto. URL `m` | Chips en fila. El botón × conserva «Quitar {nombre}» como texto oculto (lo usa `R:728-731`). Nombre corto: «Carga · Press de banca»; hoy «Carga · Peso muerto · serie 1 (kg)» (`selector.tsx:26-31`) |
| **Modos:** «Ver como» [Separadas · Juntas · Cambio relativo]; «Agrupar por» [Registro · Día · Semana]; a la derecha, el motivo | Dos `fieldset.capas` con radios: «Cómo se leen» (`analizar.tsx:420-437`; `ModoElegible` `:534-549`, con «No disponible: …» y `aria-describedby`) y «Agrupar por» (`:438-457`). Están después de la lectura. URL `modo` y `g` (`estado.ts:159-162`) | Los mismos radios, dibujados como control segmentado con ícono, antes de los gráficos. «Registro» en lugar de «Cada registro» |
| **Tarjeta de gráficos:** un `figure` por panel, con encabezado (muestra, nombre, «por día · kcal», leyenda del objetivo, cobertura) | `Lienzo` (`SEG\lienzo.tsx:128-140`), `figcaption.grafico__titulo` «Energía registrada · por día (kcal)» (`analizar.tsx:195`). Encima: leyenda `ul.leyenda` (`:303-322`), hitos (`:342-353`), intervalo (`:285-293`) y estados (`:295-299`) | Ver §3 |
| **Pie de la tarjeta:** enlaces y, a la derecha, el límite | «Tabla de datos» = `details.tabla-de-datos` (`:868-915`). «Resumen en texto» = `section.resumen-en-texto`, abierto (`:495-498`). «Hitos (n)» = `details.hitos` (`:342-353`). «Comparar etapas» = `details.etapas-del-grafico` con «Comparar con v1» (`:373-397`; `SEG\etapas.tsx:220-239`) | Cuatro disparadores en un renglón |
| **Lectura** (columna derecha, 336 px) | `PanelDeLectura` (`analizar.tsx:720-801`), `section.detalle-de-valores.panel-de-lectura`. URL `f` | Ver 2.1 |

**Dentro de «Más acciones»** (`CRIT` §3; abierto no está dibujado):

| Acción | Hoy |
|---|---|
| Guardar la vista y vistas guardadas | `details.vistas-guardadas` (`SEG\vistas-guardadas.tsx:150-233`; montado en `analizar.tsx:480`) |
| Descargar los datos | `ExportarCsv`, `.exportar` (`analizar.tsx:929-1006`) |
| Comparar dos períodos a mano | `ComparacionDePeriodos` (`:1008-1059`). URL `cmp` |
| Capas | `fieldset` «Capas» (`:458-468`). URL `capas` |
| Elegir un intervalo con fechas | `details.intervalo` (`:551-568`). Estado React `intervalo` (`:147`), no está en la URL |

**A un clic en todas:** el período, «Cómo se lee esta vista», «Cambiar la pregunta», «Más acciones», los enlaces del pie, la × de cada métrica y «Ver origen».

### 2.1 Pantalla 03 · con una pregunta (`MQ\partes\03-cuerpo.html`)

- **Pregunta:** «¿Cómo evolucionaron la alimentación y las medidas corporales?» · «Cambiar la pregunta» · «Más acciones».
- **Chips:** «Calorías ×», «Proteínas ×», «Peso corporal ×», «3 de 3 métricas».
- **Modos:** Separadas elegido, Juntas apagado; Día elegido; «"Juntas" pide métricas con la misma unidad.»
- **Paneles:**
  - «**Calorías registradas** por día · kcal», «- - Objetivo», «42 días: 36 con valor · ▮ 6 sin registros».
  - «**Proteínas registradas** por día · g», con lo mismo.
  - «**Peso corporal** cada toma · kg», «5 tomas: 3 con el protocolo nuevo».
  - Dentro: bandas «Nutrición · versión 1» y «versión 2» (rótulo solo en el primero), sombreado gris, objetivo discontinuo, línea y aro de la fecha, «Cambio de protocolo · 9 sept». Fechas solo bajo el tercero («17 ago … 27 sept»).
- **Pie:** «Tabla de datos» · «Resumen en texto» · «Hitos (4)» · «Comparar etapas» · «Coincidencia temporal: no indica causa.»
- **Lectura:**
  - `h3` «Lectura del 24 sept»; «‹ Fecha anterior», «Fecha siguiente ›».
  - «Calorías registradas», «2.240 kcal», «Objetivo: 2.250 kcal · diferencia −10 kcal», [Calculado] «4 comidas», «Ver origen».
  - «Proteínas registradas», «145 g», «Objetivo: 150 g · diferencia −5 g», [Calculado] «4 comidas», «Ver origen».
  - «Peso corporal», «77,9 kg», [Medido] «toma, 8:40», «Ver origen».
  - Enlace «Ver el 24 sept en la línea de tiempo».

| Región | Hoy | Cambio |
|---|---|---|
| Cobertura del panel | No está en el panel; solo en comparaciones e indicadores | `partesDeLaCobertura(resumirPeriodo(observaciones, def, desde, hasta, hoyEn()))`. El texto es del dominio, con prueba (`DOM\comprension-del-dashboard.test.ts`): sale «36 con valor · de ellos, 3 son subtotales (falta algún dato) · 6 sin registros · hoy, en curso: fuera de la media». Es más largo que el renglón de 28 px de la maqueta |
| Título de la lectura | «Lectura del 24 sept 2026» (`diaCivil`, `analizar.tsx:747`) | Sin año: hace falta un formato corto; `diaYMesCortos` es privado en `REPO\apps\web\src\lib\formato.ts:28` |
| Botones de fecha | «Fecha anterior con datos», campo «Fecha elegida» y «Fecha siguiente con datos» (`:749-758`) | «Fecha anterior» y «Fecha siguiente». El campo no está dibujado |
| Valor | Una línea: «{valor} · {calidad} · n = N» y extras (`:774-777`) | Valor grande con la unidad chica. `SEG\valores.ts:7-18` devuelve una sola cadena: hay que partirla |
| Pie de cada dato | Detalle «Registros: 4 · Con cantidades: 4» (`:779`), «Falta: …» (`:780`), botón «Ver el origen de este dato» (`:781-783`) | «4 comidas» = `p.n`; «toma, 8:40» = `p.at`; «Ver origen» |
| Límite | En `p.metadatos`, arriba (`:244`) | Al pie de la tarjeta, una sola vez |

### 2.2 Pantalla 09 · comparación libre (`MQ\partes\09-cuerpo.html`)

Diferencias con 03:
- **Encabezado:** `h2` «Comparación libre» y «Sin pregunta: las métricas las elegís vos, de cualquier área.» · «Empezar por una pregunta» · «Más acciones».
- **Chips:** «Calorías», «Carga · Press de banca», «Peso corporal».
- **Panel 2:** «**Carga · Press de banca · serie 1** cada sesión · kg», «- - Plan», «6 sesiones con valor».
- **Bandas:** cada panel las de su área («Entrenamiento · versión 2» y «versión 3» en el segundo); el peso, ninguna.
- **Pie:** el cuarto enlace es «Guardar esta vista».
- **Lectura:** «Carga · Press de banca», «62,5 kg», «Plan: 62,5 kg, sugerida · igual», [Reportado] «serie 1».

| Región | Hoy | Cambio |
|---|---|---|
| «Empezar por una pregunta» | Enlace en `analizar.tsx:275-281`. Va a `pregunta=cambio-desde-el-plan`, no a la lista | Debería volver a la entrada. Eso quita `m`: conviene `agregarAlHistorial` |
| Bandas | La unión de todas las series, en todos los paneles (`analizar.tsx:208-210`; `lienzo.tsx:288-299`). Rótulo «Nutrición v2» | Por panel, desde `s.estado.bandas` (`series.ts:39,110`). Rótulo «Nutrición · versión 2». En 03 el peso sí lleva las bandas de Nutrición: la regla «con pregunta, las de su área» la infiero de los scripts de la maqueta |
| «Guardar esta vista» en el pie | Dentro de `details.vistas-guardadas`, con campo de nombre (`vistas-guardadas.tsx:163-169`) | Un atajo al mismo formulario: guardar pide nombre |

### 2.3 Pantalla 11 · «Juntas» (`MQ\partes\11-cuerpo.html`)

Diferencias:
- **Chips:** «Carbohidratos», «Grasas», «Proteínas». «Juntas» elegido.
- **Aviso:** «Van juntas porque las tres se miden en gramos por día.»
- **Un solo panel:** «**Carbohidratos, grasas y proteínas registrados** por día · g» y la cobertura. Cada línea lleva su nombre al final. Margen derecho de 122 px; eje de fechas.
- **Pie:** casilla «Mostrar los objetivos» · «Tabla de datos» · «Resumen en texto» · «Guardar esta vista» · límite. No hay «Hitos».
- **Lectura:**
  - «Carbohidratos registrados», 260 g, «Objetivo: 255 g · diferencia +5 g».
  - «Grasas registradas», 70 g, «Objetivo: 70 g · igual».
  - «Proteínas registradas», 145 g, «Objetivo: 150 g · diferencia −5 g».

| Región | Hoy | Cambio |
|---|---|---|
| Título | «Superpuestas en valores reales (g)» (`lienzo.tsx:139`) | Título compuesto con concordancia («registrados»). No hay función que lo arme; «registrado» es garantía (`DOM\analisis-longitudinal.test.ts:127`) |
| Nombre al final de la línea | No existe; forma y trazo por métrica (`lienzo.tsx:26-30,322`) | Presentación. Riesgo: rótulos pisados cuando dos series terminan cerca |
| Aviso de modo elegido | No existe; solo hay motivos de bloqueo (`analizar.tsx:88-93`) | Texto nuevo |
| «Mostrar los objetivos» y los renglones «Objetivo: …» | No existe | **Dato que no llega** (macros). Además, «Juntas» con calorías es imposible: la familia `energia-kcal` tiene una sola métrica implementada (`DOM\metricas-del-analisis.ts:101,134-141`). Con C-21, el control no se muestra |

### 2.4 Pantalla 12 · «Cambio relativo» (`MQ\partes\12-cuerpo.html`)

Diferencias:
- **Modos:** «Cambio relativo» elegido, sin aviso.
- **Renglón nuevo:** control «Referencia: **17 al 23 ago** ▾» y «El cero es el promedio de cada métrica en esos días. Acercar el gráfico no cambia la referencia.»
- **Panel:** «**Cambio frente a la referencia** %» y leyenda «● Calorías ● Carga · Press de banca ● Peso corporal». Eje «+20 % … −30 %», cero más marcado, recuadro punteado «Referencia».
- **Nota del panel:** «Peso corporal: desde el 9 sept no se compara con la referencia, porque cambió el protocolo.»
- **Pie:** «Tabla de datos» · «Resumen en texto» · «Guardar esta vista» · límite.
- **Lectura** (sin enlace a la línea de tiempo):
  - «+1,7 %», «2.240 kcal · base 2.202 kcal (5 días)».
  - «+8,7 %», «62,5 kg · base 57,5 kg (1 sesión)».
  - «No se compara», «77,9 kg · otro protocolo que la referencia».

| Región | Hoy | Cambio |
|---|---|---|
| Control de la referencia | `ElegirReferencia` (`analizar.tsx:580-675`): `fieldset.referencia-del-cambio`, «Cambiar la referencia», editor y «Aplicar la referencia». Solo en `RELATIVE` (`:469-479`). URL `ref` | Sube a un renglón bajo los modos. El borrador con «Aplicar» se conserva (DL-126) |
| Referencia por métrica | `p.referencia-vigente` (`:323-328`) y `ul.referencias` (`:329-341`): regla, rango, valor, n, «pocas observaciones, la referencia es frágil» | No está dibujada: la base va en la lectura. PRO-08 pide regla, rango, valor y n a la vista: hay que decidir dónde quedan |
| Título | «Cambio relativo contra la referencia (%)» (`lienzo.tsx:139`) | «Cambio frente a la referencia» y «%» |
| Banda | `ReferenceArea` con rótulo «Referencia» (`lienzo.tsx:300-302`) | Sin relleno y con borde punteado. El texto «Referencia» no cambia: lo busca `R:363` |
| Lectura | «+1,7 % contra la referencia · valor real 2.240 kcal …» (`:713-718,774`) | Porcentaje grande, y valor y base debajo (`Referencia.valor` y `.n`). «No se compara» reemplaza «sin cambio relativo: es de otro tramo comparable que la referencia» (`:715`) |
| Nota de protocolo | No existe | Presentación: `puntosRelativos` da `OTRO_TRAMO` (`DOM\series-del-analisis.ts:230-236`) y `segments[].breakReason` |

### 2.5 Pantalla 15 · estados por gráfico (`MQ\partes\15-cuerpo.html`)

Cada panel conserva su encabezado, sin cobertura ni leyenda del objetivo. En el lugar del gráfico va un bloque de 132 px:
- **Cargando:** «Cargando las calorías registradas…»
- **Falló una parte:** «**No pudimos completar esta parte**», «Hubo muchas consultas seguidas. Esperá unos segundos y probá de nuevo: lo demás sigue a la vista.», botón «Reintentar».
- **Sin datos:** «**Sin tomas en este período**», «No es un cero: no hay tomas registradas del 17 ago al 27 sept. Probá con un período más largo.», botón «Preparar una toma».
- **Lectura:** `h3` «Lectura» y «Cuando un gráfico tenga datos, elegí una fecha y sus valores se leen acá.»
- **Pie:** «Tabla de datos» · «Resumen en texto» · «Guardar esta vista» · límite.

| Estado | Hoy | Cambio |
|---|---|---|
| Cargando | `<p class="nota">Cargando {nombre}…</p>`, arriba de los gráficos (`analizar.tsx:678`) | En el lugar del panel |
| Falla | `p.campo__error`: `textoDeFalla(motivo, nombre)`, «Las otras métricas siguen.» y «Reintentar» (`:681-688`; textos en `SEG\contexto.tsx:113-124`) | Bloque con título y motivo. Los textos difieren: hoy «Esperá un minuto y reintentá» |
| Sin acceso | «{nombre}: no está disponible con tu acceso actual.» (`:679`) | No está dibujado. `R` cuenta esa frase dos veces en `.analizar__lienzo` |
| Sin especificación | «…BE no tiene todavía una especificación para calcularla.» (`:680`) | No está dibujado |
| Sin datos | El gráfico vacío con ejes y «Sin puntos para dibujar en este período.» (`lienzo.tsx:329`) | Bloque. La serie llega `lista` con `points: []`: con `NO_DATA` la API igual devuelve `result` (`API\analisis.controller.ts:185-195`). «Preparar una toma» es un enlace a una pantalla que existe |
| Lectura vacía | Solo el `h3` «Lectura» (`:747,761-797`) | Texto nuevo |

Cuidado: si el bloque de estado usa `figure.grafico__figura` o `.grafico__lienzo`, se rompen `R:930,934` (cuentan 2 y 3 `.grafico__lienzo`) y CP-27 (`RC:469`, pide dibujadas = figuras).

### 2.6 Pantalla 07 · progreso de un ejercicio (`MQ\partes\07-cuerpo.html`)

- **Pregunta:** «¿Cómo viene progresando este ejercicio?» · «Cambiar la pregunta» · «Más acciones».
- **En lugar de chips:** «Ejercicio: **Press de banca** ▾», «Serie: **1** ▾», «Unidad: **kg** ▾» y «Cada punto es esa serie en una sesión. La línea discontinua es lo que indicaba el plan.»
- **No hay «Ver como» ni «Agrupar por»** (C-21).
- **Paneles:** «**Carga** kg», «**Repeticiones** rep», «**RIR declarado**». Cada uno con «● Registrado  - - Plan» y «6 sesiones con valor». Bandas «Entrenamiento · versión 2» y «versión 3». El plan es una línea (carga, RIR) o una franja (repeticiones).
- **Pie:** «Tabla de datos» · «Serie por serie, frente al plan» · «Comparar etapas de Entrenamiento» · «Ninguna carga se llama fuerza máxima.»
- **Lectura:**
  - «Lectura del 24 sept», «Sesión B · Tren superior · plan versión 3»; «‹ Sesión anterior», «Sesión siguiente ›».
  - «Carga», «62,5 kg», «Plan: 62,5 kg, sugerida · igual», [Reportado].
  - «Repeticiones», «8 rep», «Plan: 6 a 8 · dentro del rango».
  - «RIR declarado», «2», «Plan: RIR 2 · igual».
  - Enlace «Ver la sesión en la línea de tiempo».

| Región | Hoy | Cambio |
|---|---|---|
| Parámetros | «Cambiar los datos» abre `ElegirParametros`, que se confirma con «Ver la respuesta» (`preguntas.tsx:148-307`). URL `ejercicio`, `serie`, `unidad` | Controles en el lugar, con los mismos parámetros. D-13 pide confirmar serie y unidad: al cambiar de ejercicio conviene limpiar `serie` y `unidad`, y `resolverPregunta` vuelve a pedirlas (`DOM\preguntas-profesionales.ts:182-187`) |
| Sin controles de modo | Siempre a la vista, con el motivo | Hoy, con `modo=R` en la URL y RIR elegido, cae a paneles (`analizar.tsx:186`) y el radio apagado dice por qué. Oculto, esa explicación desaparece |
| Plan en el gráfico y «· igual» | Solo el texto del detalle | **Dato que no llega** (§1.1) |
| Sesión y versión | Detalle «Sesión: …» (`:779`) | Presentación: `detail` «Sesión», `p.planVersionIds` y `bandas[].label` |
| «Serie por serie, frente al plan» | No existe como enlace | Presentación: `pregunta=registrado-vs-indicado&area=ENTRENAMIENTO&ejercicio=…` (destino `CONTRASTE`, `analizar.tsx:262`) |
| Límite | `p.limite` entero en `PreguntaActiva` (`preguntas.tsx:131`) | La maqueta deja la mitad de la frase del dominio (`DOM\preguntas-profesionales.ts:62`) y no dice «Coincidencia temporal…» |

### 2.7 Pantalla 05 · origen del dato (`MQ\partes\05-cuerpo.html`)

- **Izquierda:** la 03, más angosta. Segmentos compactos; el aviso de modo y el límite bajan a su propio renglón.
- **Derecha** (496 px, en el lugar de la lectura):
  - «← Volver a la lectura del 24 sept».
  - `h2` «De dónde sale este dato».
  - «Proteínas registradas · 24 sept».
  - «145 g» [Calculado].
  - «Es la suma de lo que aportan las 4 comidas registradas ese día, con sus cantidades.»
  - **Fuentes:** «8:10 **Desayuno** Tostadas con queso · 30 g ⌄», «13:30 **Almuerzo** Pollo, arroz y verduras · 45 g ⌃», «17:00 **Merienda** Yogur con manzana · 25 g», «21:15 **Cena** Salmón con ensalada · 45 g».
  - **En la abierta:** «Informó lo que comió de cada ingrediente. Distinta de lo indicado en 2 de 4.» y la tabla «Ingrediente · Indicado · Registrado · Diferencia» (Pollo 120 g, 150 g, +30 g; Arroz, Igual; Verduras, Igual; Aceite 10 g, 15 g, +5 g).
  - «Total del día · 145 g».
  - «Lo indicado es lo de la versión 2 del plan, la que regía ese día.»
  - Botón «Ver en Nutrición · Registros ↗».
- **A un clic:** el contraste de cada comida, el registro completo y «Volver a la lectura».

| Región | Hoy | Cambio |
|---|---|---|
| Contenedor | `<dialog class="dialogo dialogo--panel">` modal, con «Cerrar» (`SEG\registro-original.tsx:50-106`; `CSS:2871-2888`) | Ocupa el lugar de la lectura (C-13). A 1024, «se abre encima del análisis» (`CRIT` §3): son dos presentaciones. `PanelDeRegistro` lo usan seis lugares (`analizar.tsx:512,518`; `etapas.tsx:195`; `contraste.tsx:246`; `linea-de-tiempo.tsx:297`; `resumen.tsx:110`): conviene un componente nuevo para Analizar |
| Valor y frase | `DetalleDelPunto` (`analizar.tsx:804-830`): «{valor} · {calidad} · n = N» | Valor grande, etiqueta y frase. La frase es texto nuevo |
| Fuentes | «Este dato sale de 4 registros. Elegí cuál abrir:» y chips «Registro 1…4». Se lee un registro a la vez (`:812-827`) | Todas con su aporte: una lectura `consultarRegistroDeComida` por fuente (`sources`, hasta 60), con `limitarLectura`. Los datos están en el registro (`ADV\nutrition\detalle-de-registro.tsx:89-102,145-173`) |
| Contraste | `ContrasteConLaOpcion` con las mismas cuatro columnas (`detalle-de-registro.tsx:145-173`) y el estado de las cantidades (`:101`) | Presentación. Los textos son del dominio |
| Versión del plan | No se dice en el panel | Presentación: `p.planVersionIds` y `bandas[].label` |
| Enlace | «Ver en Nutrición · Registros» con `volver` (`registro-original.tsx:36-48,97-103`) | Igual, como botón |
| Sesión y toma | `SesionRegistrada` y `TomaRegistrada` (`:127-194`) | No están dibujadas |

### 2.8 Pantalla 04 · comparar etapas (`MQ\partes\04-cuerpo.html`)

- **Pregunta:** «¿Qué cambió entre dos etapas de Nutrición?» · «Cambiar la pregunta» · «Más acciones».
- **Dos tarjetas:**
  - [A] selector «Nutrición · versión 1 ▾», «Ver la planificación»; Desde «17 ago, al activarse»; Hasta «6 sept, la reemplazó la versión 2»; Duración «21 días»; «21 días: 17 con valor · ▮ 4 sin registros · de los 17, 2 son subtotales».
  - [B] «Nutrición · versión 2 ▾»; «7 sept, al activarse»; «27 sept, sigue vigente»; «21 días»; «21 días: 19 con valor · ▮ 2 sin registros · de los 19, 1 es subtotal».
- **Tabla** «Métrica · Etapa A · versión 1 · Etapa B · versión 2 · Diferencia (B − A)»:
  - «Calorías registradas / Media de los días con valor»: 2.100, 2.250 y +150 kcal por día.
  - «Proteínas registradas / Media de los días con valor»: 130, 145 y +15 g por día.
  - «Peso corporal / Primera y última toma de cada etapa»: «78,6 kg y 78,4 kg / 2 tomas», «78,3 kg y 77,9 kg / 3 tomas» y «**No se restan.** El protocolo cambió el 9 sept: las tomas de A y de B no son comparables.»
- **Tarjeta** «Las mismas métricas, en el tiempo», «A y B son las dos etapas» y «Abrir estos gráficos en grande». Tres gráficos chicos con «A» y «B» en las bandas y eje corto (17 ago, 7 sept, 27 sept).
- **Pie:** «Comparar otros dos períodos, con fechas elegidas a mano» · «Tabla de datos» · «Coincidencia temporal: no indica causa.»
- **No hay** lectura, chips ni barra de modos.

| Región | Hoy | Cambio |
|---|---|---|
| Título | «¿Qué cambió entre dos etapas?» (`DOM\preguntas-profesionales.ts:81`) | Agrega el área. Presentación |
| Tarjetas | `article.etapa` (`SEG\etapas.tsx:83-114`): «Etapa A», `h4` «Nutrición · versión 1», `dl.datos`, «Ver la planificación de esta etapa», «Etapa anterior (v1)» | Letra, selector y enlace |
| Elegir otra etapa | «Cambiar los datos» y formulario (`preguntas.tsx:220-237`) | Selector en la tarjeta: `ir({ etapaA })` o `ir({ etapaB })`. Presentación |
| Desde y Hasta | «8 oct 2026, 08:00 (activación)»; «…; terminó al activarse la versión siguiente»; «Sigue vigente (hasta hoy, en curso)» (`etapas.tsx:92,96`) | Fechas cortas y «la reemplazó la versión 2» (la etapa siguiente de `etapas`). Hoy la duración dice «, con hoy en curso» (`DOM\etapas-de-planificacion.ts:216`) |
| Cobertura por etapa | En cada celda: `CeldaDeEtapa` con `.celda__detalle` (`etapas.tsx:200-217`) | C-12: una vez por etapa, y en la celda solo si difiere. La cobertura es por métrica: falta decidir cuál es «la de la etapa». El orden del texto del dominio no es el de la maqueta: no reescribirlo |
| Tabla | 5 columnas: Métrica · Criterio · A · v1 · B · v2 · B − A (`:133-184`) | 4 columnas, con el criterio bajo el nombre. Corre los índices de `RC:995-1009` |
| Fila del peso | Un valor: la última toma del tramo; criterio «Última toma del tramo comparable» (`:43-48`); motivo `TEXTO_SIN_DIFERENCIA_DE_ETAPAS` (`DOM\etapas-de-planificacion.ts:201-208`) | Primera y última (`ResumenDeUnPeriodo.primero` y `.ultimo`, `DOM\series-del-analisis.ts:298-300`). El texto del motivo es del dominio y no trae la fecha |
| Gráficos | Debajo va todo el cuerpo de Analizar: selector, gráficos grandes, lectura y opciones (`analizar.tsx:141-144,270`) | Tres chicos. Qué hace «Abrir estos gráficos en grande» no está determinado |
| Comparar a mano | `details.comparar-a-mano`, justo debajo de la tabla (`analizar.tsx:266-268,1045-1051`) | Al pie. Si los gráficos chicos quedan dentro de `section.comparacion-de-etapas`, el `details` sigue siendo su hermano siguiente, como exige `RC:1019` |
| Lo que la maqueta no muestra | «Se lee del … al …» y la lente (`etapas.tsx:125-130`); «N días con registros asociados a otra versión», «fuera de las fechas de la etapa», «la lectura no cubre la etapa entera» (`:207-209`); la ayuda «Cómo se arman las etapas» (`:186-194`); el límite de la pregunta | CP-15 se apoya en «asociados a otra versión»: hay que ubicarlo |

### 2.9 Pantalla 08 · la entrada (`MQ\partes\08-cuerpo.html`)

- **Título:** `h2` «¿Qué querés mirar?» y «Dos caminos para lo mismo: una pregunta que ya trae los gráficos armados, o las métricas que elijas.»
- **Izquierda, tarjeta «Empezar por una pregunta».** Cuatro filas con ícono, pregunta, bajada y flecha:
  - «¿Qué cambió desde que empezó este plan?» / «La etapa de la versión que elijas, con sus hitos y sus métricas.»
  - «¿Lo registrado coincide con lo indicado?» / «Cada registro frente a lo que indicaba su plan: por serie o por comida.»
  - «¿Cómo viene progresando este ejercicio?» / «Carga, repeticiones y RIR de una serie, con lo que indicaba el plan.»
  - «¿Con qué información cuento para revisar el objetivo?» / «Qué hay registrado por área, qué falta y qué se puede comparar.»
  - Al pie: «Más preguntas (2)».
- **Izquierda, tarjeta «Retomar una vista guardada»:** «Guardan qué mirar, no los datos.» y chips «Alimentación y peso · 3 métricas», «Press de banca: carga y RIR · 2 métricas».
- **Derecha, tarjeta «Comparar métricas, sin pregunta»:** «Hasta tres, de cualquier área. Cada una va en su gráfico, con las mismas fechas.»
  - **Nutrición:** Calorías ✓, Carbohidratos, Grasas, Proteínas, Fibra, Registros de comida.
  - **Entrenamiento,** con el control «Press de banca · serie 1 · kg ▾»: Carga ✓, Repeticiones, RIR declarado, Series registradas, Volumen.
  - **Antropometría:** Peso corporal ✓, Cintura, Suma de 6 pliegues, IMC y «Más medidas (9)».
  - Al pie: «**Elegiste 3 de 3.** Para sumar otra, sacá una.» y el botón «Ver los gráficos».

| Región | Hoy | Cambio |
|---|---|---|
| Título | `h2` «Analizar» | Texto nuevo |
| Preguntas | `ListaDePreguntas` (`preguntas.tsx:80-119`): `button.tarjeta-de-pregunta` en grilla de 2, `details.preguntas-profesionales__mas` «Más preguntas», enlace «Análisis personalizado: elegir las métricas a mano» | Filas con ícono. Conviene conservar `button.tarjeta-de-pregunta` y el `details` (`R:654-655`; `RC:363,486`). Las bajadas de la maqueta son más cortas que `muestra` del dominio (`DOM\preguntas-profesionales.ts:47,54,61,68`). Ninguna prueba las fija |
| Vistas guardadas | `VistasGuardadas soloAbrir` (`analizar.tsx:247`): `details`, con «Abrir» y «Borrar» por vista | Chips. «Borrar» no está dibujado en la entrada |
| Métricas por área | `details.agregar` con desplegables (Área, Métrica, Ejercicio, Qué se mide, Serie, Unidad) y botón «Agregar» (`selector.tsx:125-236`). Solo aparece tras «Análisis personalizado» (estado `personalizado`, `analizar.tsx:120`) | Casillas a la vista y «Ver los gráficos», que escribe `m`. Hoy cada «Agregar» escribe la URL al instante. El estado `personalizado` puede sobrar |
| Orden de Nutrición | Energía, Proteínas, Carbohidratos, Grasas, Fibra, Registros (`DOM\metricas-del-analisis.ts:100-105`) | C-30 |
| «Volumen» elegible | `implementada: false`; está en «Lo que todavía no se ofrece, y por qué» (`selector.tsx:238-247`) | No se puede ofrecer sin una función nueva |
| Nombres | «Peso», «Perímetro de cintura», «Índice de masa corporal», «Suma de 6 pliegues (ISAK)» (`DOM\nombres-de-metricas.ts:10,31,40,44`); «RIR» | La maqueta usa otros. Son del catálogo y se usan en todo BE |
| «Para sumar otra, sacá una» | La cuarta abre «Elegí cuál reemplazar» (`selector.tsx:100,263-318`; PRO-06) | Otra regla: ver §7 |

### 2.10 Hoy existe y la maqueta no lo muestra (hay que decidir dónde queda)

1. **El campo «Fecha elegida»** (`analizar.tsx:752-755`).
2. **En la lectura:**
   - calidad del punto y «día en curso: el valor todavía puede cambiar» o «semana sin completar en el período» (`:94-97,775`; PRO-11);
   - «n = N», «semana del … al …» (`:776`), «con una corrección vigente» (`:777`), «Falta: …» (`:780`);
   - «Sin dato en esta fecha. El más cercano… No es simultáneo.» (`:787-792`; PRO-09);
   - dos tomas del mismo día, en dos bloques (`:771`).
3. **La leyenda de estados del punto** (`:309-321`) y **la referencia por métrica** (`:329-341`).
4. **«Intervalo: … Restablecer vista»** (`:285-292`): el gráfico acercado no está dibujado.
5. **Los motivos de «Cambio relativo» no disponible** (`:82-87,429-435`), los otros tres de «Juntas» (`:88-93`) y los de «Agrupar por» por métrica (`:446-456`).
6. **«Vista parcial: hay datos de esta área que no ves…»** (`:300`).
7. **Las explicaciones, que van a «Cómo se lee esta vista»:**
   - «Cómo se calcula» (`:838-866`);
   - «Lo que todavía no se ofrece…» (`selector.tsx:238-247`);
   - las ayudas de etapas y de contraste (`etapas.tsx:186-194`; `contraste.tsx:98-101,242-245`);
   - la nota de la exportación (`analizar.tsx:995-998`) y las de vistas guardadas (`vistas-guardadas.tsx:157-160`).
8. **«Cambiar los datos» y `ElegirParametros`,** para preguntas sin controles en el lugar. «¿Qué cambió desde que empezó este plan?» no tiene maqueta.
9. **«Elegí cuál reemplazar»:** con 3 de 3 no hay control de agregar dibujado.
10. **De las vistas guardadas:** el nombre, «Guardar lo actual acá», «Borrar» con confirmación y los avisos «Guardada», «Abierta», «Actualizada» y «Borrada» (`vistas-guardadas.tsx:163-231`).
11. **Interacción del gráfico:** un clic en un punto abre su origen (`analizar.tsx:362-365`); arrastrar acerca (`lienzo.tsx:196-211`).
12. **Los hitos como líneas verticales** (`lienzo.tsx:303-305`): `MQ\plano.js` no las dibuja.
13. **Los destinos Contraste e Información** (`SEG\contraste.tsx`, `SEG\informacion.tsx`): sin maqueta entre las nueve.

### 2.11 La maqueta lo muestra y hoy no existe

**Solo presentación** (el dato ya llega o sale de una lectura existente):
- objetivo de calorías, en el gráfico y en la lectura;
- sombreado y muestra de los días sin registros;
- cobertura por panel;
- «Cambio de protocolo · 9 sept»;
- bandas por área, «A» y «B»;
- nombre al final de la línea y leyenda en el encabezado;
- «4 comidas», «toma, 8:40», «serie 1», sesión y versión;
- «base … (n)» y «No se compara»;
- estados por panel;
- la entrada con casillas;
- el origen con todas sus fuentes (N lecturas);
- selector de etapa en la tarjeta, y primera y última toma;
- «Serie por serie, frente al plan» y «Preparar una toma».

**Necesita un dato que no llega, o una regla que no existe:**
- objetivo de macros;
- plan de entrenamiento como número;
- etiqueta de clase en comidas y series;
- «diferencia −10 kcal»: es una resta nueva, sin función del dominio. `CRIT` §5 dice que un subtotal no se compara con el objetivo del día;
- «Ver el 24 sept en la línea de tiempo»: la línea de tiempo no tiene parámetro de fecha (`estado.ts:111-121`). Hay `data-fecha` por día (`SEG\linea-de-tiempo.tsx:306`), pero no una URL que lleve ahí;
- «Volumen» como métrica.

**Sin dibujar:** «Cómo se lee esta vista», «Más acciones» abierto, lo que abre cada enlace del pie y «Abrir estos gráficos en grande».

## 3. El gráfico: hoy frente al diseño

| Qué pide | Hoy | Qué tocar |
|---|---|---|
| **Todas las marcas son puntos;** la métrica, por color y nombre | `ESTILOS` con forma y trazo (`lienzo.tsx:26-30`); `Forma` con ramas de cuadrado y triángulo (`:65-83`) | Dejar solo el color en `ESTILOS`; `Forma` queda con la rama del círculo (`:84-89`). Quitar el texto de la leyenda (`analizar.tsx:306`) y el comentario de `TOK:68-71` |
| **Estado del punto por forma:** lleno, hueco, contorno cortado, punto adentro | Ya está: `hueco` (`:251`), `clase` (`:252`), relleno, corte y centro (`:67-69`), radio mínimo (`:254`) | Nada; conservar `g.grafico__elegible[data-clase]` (`:256`) |
| **Aro del punto elegido debajo de la marca** | `:257`: `circle fill="none" stroke="var(--texto)"`, primer hijo | Conservar esos atributos literales: `RC:1110-1111` |
| **Registrado: línea continua con puntos** | `strokeDasharray={modo === 'PANELS' ? undefined : e.trazo}` (`:322`) | Siempre continua. `Marca` pierde `conTrazo` (`:54-63`; usos en `analizar.tsx:217,306,412,768`) |
| **Planificado: discontinua, sin puntos, del mismo color** | No existe | `series.ts`: sumar a `EstadoDeSerie.lista` (`:31-46`) los escalones de `res.prescribed.energyRequirement`, en `estadoDe` (`:98-112`). `lienzo.tsx`: campo `plan` en `SerieParaDibujar` (`:92-102`) y un tramo por escalón, antes de las `Line` (`:320`). El eje Y tiene que incluir el objetivo. Entrenamiento: §1.1 |
| **Días sin registros, con gris leve** | No existe; la línea ya se corta (`:163-185`) | `lienzo.tsx`: un `ReferenceArea` por `serie.gaps`, solo con `serie.grain === 'DAY'`, recortado a `[x0, x1]`, antes de las bandas. `series.ts` no cambia. Token: `--grafico-hueco` con opacidad, o tokens nuevos en `TOK` |
| **Bandas por área,** con «Nutrición · versión 1» | Bandas globales, rótulo de 11 px (`:288-299`) | Bandas por serie (`analizar.tsx:208-210` y las props `:119`); rótulo solo en el primer panel |
| **Corte de protocolo con rótulo** | La línea se corta, sin marca | `ReferenceLine` antes del primer punto de cada tramo con `breakReason` |
| **«Juntas»: el nombre al final de cada línea** | No existe; título «Superpuestas…» (`:139`) | Rótulo en el último punto de cada serie y margen derecho más ancho (`:275`). `espacioPorDia` usa 78 (`:238`) |
| **«Cambio relativo»: la referencia visible** | Banda (`:300-302`) y cero (`:306`) | Estilo del recuadro, cero más marcado, eje con signo y «%» (`:319`), leyenda en el encabezado. El control: 2.4 |
| **Encabezado del panel** | `figcaption.grafico__titulo` con el título entero (`:266`); la unidad girada en el eje (`:319`) | El nombre y la unidad siguen en `.grafico__titulo` (lo leen `R:660-662`, `RC:263,1172`). La cobertura se arma en `analizar.tsx:188-201` |
| **Fechas una vez, bajo el último panel;** «17 ago» | Eje en cada panel, «17/08» con `diaCorto` (`:307-317`) | Ocultarlo en los demás rompe `R:464,470` |
| **Paneles bajos** (124 y 142 px en la maqueta) | 190 escalado: unos 266 px a 990 de ancho (`:133,241`) | `alto` y la fórmula de `:241`. `R:470` pide alto > 80 |
| **Letra de 13 px en ejes y rótulos** | 12 px en ejes (`:315,319`), 11 px en bandas y referencia (`:297,301`) | `CRIT` §6: el texto más chico mide 12,5 px como mínimo |
| **Muestras** de línea con punto y de plan | `Marca` (`:54-63`) | Rehacerla; sumar la del plan |

**Dos cuidados:**
- **Hoy, sin registros:** `serie.gaps` lo incluye. El dominio lo separa de «sin registros» (`DOM\series-del-analisis.ts:312-323`) y `RC:926` lo excluye. Conviene no sombrearlo.
- **La tabla equivalente:** hoy no tiene el objetivo, ni la tabla (`analizar.tsx:868-915`) ni el CSV (`DOM\exportacion-del-analisis.ts`, con pruebas). Si el gráfico lo dibuja, tiene que estar también en la tabla y en la descripción.

## 4. Pasos, en un orden que deja la vista funcionando

En cada paso se actualizan sus comprobaciones de `R` y `RC` (E-06). La columna «Riesgo» dice además qué archivos se tocan.

| # | Paso | Archivos y riesgo | Cómo comprobarlo |
|---|---|---|---|
| 0 | **Medir el «antes»** de Analizar con una pregunta (`WP` §1 lo pide) | `herramientas\paginas.mjs`. Sin riesgo | Alto de página a 1440 × 900 |
| 1 | **Nombres visibles:** «Separadas», «Juntas», «Cambio relativo»; «Registro»; «Calorías»; orden C-30 | `analizar.tsx:422-428,443`; `lienzo.tsx:139`; `DOM\metricas-del-analisis.ts:100-105`; `DOM\preguntas-profesionales.ts:75`. Riesgo medio: fijan el texto `DOM\analisis-longitudinal.test.ts:127,539`, `R:837` y los «Energía» de `R:790,794`, `RC:940,992`. `serie.label` lo arma la API: hasta redesplegarla, el resumen en texto dice «Energía registrada». La etiqueta de `API\lectura-linea-de-tiempo.ts:184` tiene una comprobación negativa en `REPO\test\integration\analisis.int-spec.ts:132` | `npm test -w @be/domain`; buscar «Energía», «Superpuestas» y «Paneles sincronizados»; PRO-08 y PRO-18 |
| 2 | **Piezas de CSS con nombres nuevos:** segmentado, etiqueta, bloque de estado, muestras, tarjeta de la ficha | `CSS`, quizá `TOK`. Riesgo bajo | `contraste.test.cjs`; nada cambia a la vista |
| 3 | **Barra de modos:** los mismos radios como segmentos, antes de los gráficos; motivos en un renglón; C-21 | `analizar.tsx:419-457,534-549`. Riesgo medio: índices en `R:664-666,733`, y `.analizar__opciones label` y `.capa` en `R:792,822`, `RC:1045` | Teclado en el grupo; motivo leído; `modo` y `g` en la URL; PRO-08 |
| 4 | **Renglón de la pregunta y chips** | `analizar.tsx:242-247,261,272-282`; `preguntas.tsx:122-142`; `selector.tsx:109-123`. Riesgo medio: `.pregunta-activa` (`RC:684`) y `.metricas-elegidas` (`R:728-731`) | CP-07; quitar una métrica; un solo `h1` y `h2` |
| 5 | **«Más acciones»** con vistas, CSV, comparar, capas e intervalo | `analizar.tsx:285-293,458-508`; `vistas-guardadas.tsx:150-156`. **Riesgo alto:** muchos ganchos; el aviso de exportación tiene que verse con el menú cerrado (`:150-154,502-508`); con `cmp` en la URL la comparación va abierta (`R:788`, `RC:936`); el aviso «Abierta: …» (D-26) | PRO-10, PRO-18, PRO-19, PRO-20; CP-17, CP-23, CP-26; Escape devuelve el foco; sin doble desplazamiento |
| 6 | **Dos columnas y pie de la tarjeta** | `analizar.tsx:272-417,484-500`; `CSS:2897-2964,3775-3782`. Riesgo medio: R4 (`RC:1013-1030`) y `details.tabla-de-datos` | Capturas a 1440, 1280 y 1024; orden de tabulación; CP-27 |
| 7 | **Paneles compactos:** encabezado, cobertura, alto, fechas una vez | `lienzo.tsx:126-140,241,265-266,307-319`; `analizar.tsx:188-201`. Riesgo medio: `R:464,470`, `R:662` (`\(g\)`), `R:283-284` (62 y 78 px) | PRO-06, PRO-07, PRO-08; la cobertura contra la API a mano, como `R:799-809` |
| 8 | **Puntos y leyenda** | `lienzo.tsx:26-90,249-258,321-322`; `analizar.tsx:217,303-322,768`; `TOK:68-71`; guía I.6 y I.7. Riesgo medio: `R:837`, `R:1124-1128`, `RC:1099-1100`; el caso «solo color» de 12 | PRO-10, CP-11, CP-12; píxeles por métrica; registrar la equivalencia de «trazos distintos» |
| 9 | **Lo que el dato ya trae:** sombreado, bandas por área, corte de protocolo, objetivo de calorías | `series.ts:31-46,91-112`; `lienzo.tsx:92-123,288-306`; `analizar.tsx:208-210`; `TOK`. Riesgo medio: el objetivo aumenta los píxeles del color de la métrica y afloja esa medición; hoy sin registros | Comparar con `recorded.gaps` de la API; captura en los dos temas |
| 10 | **Lectura nueva** | `analizar.tsx:720-801`; `valores.ts`. **Riesgo alto:** regex de `R:293,696,700,737,814,1137` y `RC:1117,1127`; no perder lo de 2.10 punto 2 | PRO-09, PRO-11, PRO-10, CP-13; `aria-live` |
| 11 | **Estados por panel** | `analizar.tsx:294-299,677-689`; `lienzo.tsx:329`. Riesgo medio: `R:930-934`, `R:1212,1232,1249`, `RC:1200-1202`, `RC:469` | PRO-21, R6, PRO-20 |
| 12 | **Entrada «¿Qué querés mirar?»** | `analizar.tsx:245-247`; `preguntas.tsx:80-119`; `selector.tsx:125-258`; `vistas-guardadas.tsx`. **Riesgo alto:** PRO-06 (`R:669-677`), PRO-20 (`R:916-922`), `RC:486`, `R:976-996` | Primera pantalla a 1280 × 800; asesorado B sin el grupo Entrenamiento |
| 13 | **Origen en el lugar de la lectura** | Componente nuevo junto a `registro-original.tsx`; `analizar.tsx:171,518-529,804-830`. **Riesgo alto:** foco y Escape sin `<dialog>`; `dialog[open]` en los recorridos; N lecturas | PRO-05, PRO-26, CP-21, CP-23; capturas a 1280 y 1024 |
| 14 | **Etapas** | `etapas.tsx:57-217`; `analizar.tsx:221,263-270`; `CSS:3654-3712`. **Riesgo alto:** CP-14, CP-17, CP-18, R4 | `RC` recorrido 4; PRO-18 |
| 15 | **Ejercicio:** parámetros en el lugar, controles ocultos y, si se decide, el plan | `preguntas.tsx`; `analizar.tsx`. Riesgo medio: D-13 | CP-07; cambiar de ejercicio vuelve a pedir serie y unidad |
| 16 | **«Cómo se lee esta vista»,** guía (II.1, II.6, I.7), `ACEPTACION.md` y E-05 | `ADV\workspace.tsx:229-234`; `REPO\docs\ux\GUIA-UX-UI.md:222,327-338`; `REPO\scripts\copy-pantallas.test.cjs`. Riesgo medio: el marco vive fuera de `Analizar` | axe; `npm test` |

## 5. Comportamiento que hay que conservar

**Teclado y accesibilidad del gráfico**
- `lienzo.tsx:271`: `tabIndex={0}`, `role="group"`, `aria-label="{título}. Flechas: cambiar la fecha elegida; la lectura está debajo."` y `aria-describedby`. La descripción es el resumen en texto, oculto a la vista (`:267-270`; `analizar.tsx:216`). «debajo» pasa a ser «al costado».
- `lienzo.tsx:212-223`: flechas, Inicio y Fin sobre `fechasConDato`, con `preventDefault` (PRO-22; `R:680-687`).
- `CSS:1697-1706`: foco visible del lienzo; las capas de Recharts no muestran contorno.
- `lienzo.tsx:196-211`: un clic elige la fecha; arrastrar un día o más acerca. La alternativa son los campos de fecha (`analizar.tsx:551-568`; WCAG 2.5.7).
- `lienzo.tsx:17-18`: sin recuadro al pasar el puntero.
- `lienzo.tsx:322`: `isAnimationActive={false}`; `CSS:3221-3227`: reducir movimiento.
- **Tabla equivalente** con `caption` oculto y `scope` (`analizar.tsx:868-915`), y resumen en texto (`:222-239`).
- **Lectura:** `section[aria-labelledby]` (`:746-747`), `aria-live="polite"` (`:760`), botones apagados en los extremos (`:749,756`).

**Reglas del dibujo**
- Una columna por tramo; el día o la semana sin completar va suelto; `null` no se dibuja (`lienzo.tsx:163-185`). F-02: no unir huecos, ni con línea punteada.
- Sin doble eje (`:319`; F-01).
- Ningún punto se quita: solo se achica (`:225-239`).

**Estado y URL**
- **Letras y enumerados:** `estado.ts:159-162,182-214,220-234,245-281`. Lo que guarda una vista: `vistas-guardadas.tsx:20-34`.
- **Historial:** `ir` reemplaza; con `agregarAlHistorial` empuja (`contexto.tsx:84-91`).
- **Modo efectivo:** cae a paneles si no corresponde, sin tocar la URL (`analizar.tsx:186`).
- **La pregunta escribe `m` y el período** (`:126-138`). Cambiar métricas a mano deja la pregunta (`:140`).
- **El intervalo y el aviso de exportación se sueltan** al cambiar selección, período o pregunta (`:159-162`).

**Estados**
- Por serie: cargando, sin acceso, sin especificación, error con «Las otras métricas siguen.» (`:677-689`). Sin métricas (`:294`).
- Un solo «Reintentar» trae series y disponibles (`:164-167`).
- Lo disponible: buscando, falla, «No hay datos de ninguna área…» (`selector.tsx:129-138`).
- La pregunta: cargando (`analizar.tsx:248`), «no aplica a este asesorado», falla (`preguntas.tsx:187-193`).
- Vista parcial (`analizar.tsx:300`).
- Una falla nunca se dice como «sin datos» (`contexto.tsx:113-124`).
- 404 y `NOT_AVAILABLE_TO_VIEW` son «sin acceso» (`series.ts:98-104`).

**Exportación** (`analizar.tsx:951-989`)
- Vuelve a consultar con el acceso de ahora.
- El archivo no lleva nombre de persona.
- El aviso vive en `Analizar`, para sobrevivir al retiro de las series (`:150-154,502-508`).

**Origen**
- `showModal` (`registro-original.tsx:72-77`); Escape cierra (`:84-87`); el foco vuelve al disparador.
- El enlace al área lleva `volver` (`:97-103`).
- `onNoDisponible` vuelve a pedir las series y no repite el valor (`analizar.tsx:522-528`).

**Decisiones citadas en los comentarios de `SEG`, y lo que exige cada una**

| Cita | Dónde | Qué exige |
|---|---|---|
| DL-126 | `analizar.tsx:9,178,577`; `estado.ts:151`; `series.ts:5`; `preguntas.tsx:37` | Hasta tres métricas, cada una vista de API-PRJ-01. La referencia del cambio relativo es explícita, no depende del intervalo visible, cambia solo con «Aplicar» y queda en la URL y en las vistas. Máximo de 366 días |
| DL-127 | `estado.ts:4` | En la URL solo identificadores, enumerados y fechas |
| DL-128 | `vistas-guardadas.tsx:4` | La vista guarda configuración, nunca datos; al abrirla se vuelve a pedir |
| PRO-06 | `selector.tsx:5` | La cuarta métrica pide «Elegí cuál reemplazar»; nada se reemplaza en silencio |
| PRO-05 | `registro-original.tsx:4` | Origen modal, Escape, foco al disparador, la vista sigue igual |
| PRO-21 | `contexto.tsx:151` | Una respuesta tardía se descarta (`series.ts:158-172`; `contexto.tsx:160-172`) |
| F-01 a F-05 | `lienzo.tsx:4-8` | Sin doble eje; huecos sin unir; descripción corta y larga; WCAG 2.2; teclado |
| WCAG 1.4.1 y 2.5.7 | `lienzo.tsx:11,18` | El color no es el único medio; el arrastre tiene alternativa |
| §3.A | `series.ts:166`; `contexto.tsx:8` | Si una serie dice «no disponible», el marco vuelve a preguntar el acceso |

En `SEG` no hay ninguna cita literal «D-xx» ni «CP-xx»: viven en `REPO\docs\paquetes\WP-DASHBOARD-COMPRENSION.md:49-93` y en `RC`.

**Decisiones del paquete anterior que tocan Analizar**
- **D-08 y D-13:** el ejercicio, la medida y la versión nunca se eligen por la persona; la serie, la unidad y las dos últimas etapas se sugieren y se confirman (`preguntas.tsx:168,313-329`).
- **D-18:** debajo de la tabla A/B van los gráficos de sus métricas.
- **D-25:** lo que falla va primero; un solo «Reintentar».
- **D-26:** las vistas se retoman desde la entrada y el aviso sobrevive (`vistas-guardadas.tsx:45,58-64,113-119`).
- **D-28:** cobertura en días del rango, nunca «N de N días».
- **D-30:** el modo de registro no es una diferencia (`contraste.tsx:113-155`).
- **D-31:** con etapas, comparar a mano y el resumen en texto van plegados; cada límite, una vez (`analizar.tsx:218-221,266-268,489-500`).
- **D-32:** un rango indicado se muestra como dato, con signo.

**Otras garantías**
- Sin colores de juicio: `TOK:68-74`; `REPO\scripts\contraste.test.cjs:201-228`.
- Sin desplazamiento propio en ningún panel: `CSS:3775-3782`; `RC:249-257`.
- 44 px: `.boton` (`CSS:385-391`), `.capa` (`:1757-1763`), `.chip` (`:1833-1836`).

## 6. Recorridos que tocan Analizar

`R` corta el modo entero en la primera excepción (`R:1264-1265`); `RC` aísla por parte (`RC:55`). Los identificadores de `TRES` (`R:47`, `RC:37`) no cambian.

### 6.1 Piezas compartidas de `R`

| Línea | Selector o texto | Qué protege |
|---|---|---|
| 265-272 | `details.intervalo` y sus dos `input[type="date"]` en orden | Acercar con fechas (PRO-08, CP-17) |
| 275-290 | `.grafico__lienzo svg.recharts-surface`; 62 y 78 px (márgenes de `lienzo.tsx:275,319`) | El arrastre |
| 293 | `/[+-]?[\d.,]+ % contra la referencia/` en `.panel-de-lectura` | El porcentaje no cambia con el zoom |
| 296-301 | Tabla con `caption` «Comparación»; fila cuyo `th` empieza con el nombre | PRO-18 |
| 328-370 | `figure.grafico__figura`, `.grafico__lienzo svg.recharts-surface`, `.grafico__elegible`, `.grafico__titulo`, ejes `.recharts-cartesian-axis-tick`, `path.recharts-line-curve`, `.recharts-reference-area-rect` con un `text` igual a «Referencia», `data-clase` | Que el gráfico esté dibujado (PRO-08) |
| 378-431 | `figure.grafico__figura .grafico__lienzo`; colores `--metrica-1..3`; fondo = color más frecuente | Píxeles por métrica |
| 443-475 | ancho > 100, alto > 80, `ejeX > 1`, `ejeY > 1`, curvas, marcas, ninguna tapada, banda, tinta > 0,01, píxeles ≥ mín(100, 30 × marcas) | PRO-08 y PRO-10 |
| 449-459 | Oculta `path.recharts-line-curve` y `.grafico__elegible` | La prueba de la prueba (E-16) |
| 482-511 | `figure.grafico__figura` con superficie y curvas | Capturas |

### 6.2 Positivas de `R`

| Línea | Usa | Protege |
|---|---|---|
| 654-659 | `details.preguntas-profesionales__mas`; `.tarjeta-de-pregunta` con «la alimentación y las medidas corporales»; `.parametros-de-pregunta`, etiqueta «Medida corporal»; «Ver la respuesta» | Entrar por una pregunta |
| 660-663 | `.grafico__titulo` ×3; `/kcal/`, `/\(g\)/`, `/kg/` | PRO-06, PRO-07 |
| 664-666 | `.modo-elegible` [1] y [2]: `input.disabled`, `/unidades distintas/`, `/Peso: no tiene observaciones/` | PRO-08: bloqueo con motivo |
| 669-677 | `details.agregar`; `.agregar-metrica`, etiqueta «Métrica»; «Agregar»; `dialog[open]` `/Elegí cuál reemplazar/`; «Cancelar»; `m` igual | PRO-06 |
| 680-687 | `page.focus('.grafico__lienzo')`, Inicio y flecha; `f`; «Lectura del» | PRO-22 |
| 689-701 | `/Sin dato en esta fecha\. El más cercano: .* No es simultáneo\./`; `/día en curso/`; `.panel-de-lectura__metrica` ×3 | PRO-09, PRO-11, PRO-07 |
| 704-724 | `.panel-de-lectura button` «Ver el origen de este dato»; `dialog[open]`; `/n = 1/`; «Ver en Nutrición»; «Cerrar»; URL igual; `.grafico__lienzo` ×3 | PRO-26, PRO-05 |
| 728-733 | `.metricas-elegidas button` «Quitar» y «Peso»; `li` ×2; `input[name="modo-de-lectura"]`[2] | Llegar al modo relativo |
| 735-738 | `.referencias` `/media de los días con valor del .* \(n = \d+/`; `/% contra la referencia · valor real/`; banda | PRO-08 |
| 744-780 | `.referencias`, `.referencia-vigente` (`/fuera del intervalo visible/`, `/rango fijo/`), `/Intervalo: ([^.]*)\./` en `.analizar__lienzo`, «Restablecer vista», «Cambiar la referencia», «Un rango de fechas fijo», «Copiar el intervalo visible», «Aplicar la referencia» | DL-126 |
| 788-826 | `cmp` en la URL; fila «Energía»; `.analizar__opciones label` «Semana»; `/semana del/`; «N días: M con valor» | PRO-18, PRO-08 |
| 830-840 | `.grafico__titulo` `/Superpuestas en valores reales \(g\)/`; `.leyenda` `/línea continua/` y `/línea rayada/` | PRO-08: un gráfico, «trazos distintos» |
| 844-853 | `.comparacion-de-etapas`: `/B − A/`, `/\d+ días: \d+ con valor/`, `/Duración/` | PRO-18 |
| 859, 872-882 | «Descargar los datos (CSV)»; `details.vistas-guardadas` (resumen, campo, «Guardar esta vista», «Guardada:», `li strong`, «referencia: del … al …») | PRO-10, PRO-19 |
| 916-922 | Botón «Análisis personalizado»; `.agregar-metrica label` igual a «Área» | PRO-20 |
| 926-934 | `.analizar__lienzo` `/BE no está disponible en este momento/`; `.grafico__lienzo` ×2 y ×3; «Reintentar» | PRO-21 |
| 953-959 | 320 px y texto al 200 % | PRO-23, PRO-22 |
| 976-996 | En la entrada: `details.vistas-guardadas`, «Abrir {vista}», «Borrar {vista}», `/No se puede deshacer/`, «Sí, borrar», «Borrada:» | PRO-19 |
| 1049-1083 | 3 figuras por captura; modos S y R con `curvas: 2` y `banda` | PRO-23, PRO-08 |
| 1122-1163 | Gráficos y mutación; `.leyenda` «Contorno cortado: …» y «Con un punto adentro: …»; `/Clase de dato: Reportado por la persona, no medido/`; `details.tabla-de-datos`; CSV; origen `/Peso\s+80,5 kg\s+Reportado/` | PRO-10 |
| 1202-1251 | `.exportar` `/No se descargó ningún archivo/`; «no está disponible con tu acceso actual», dos veces en `.analizar__lienzo`; 0 figuras | PRO-20 |

### 6.3 Negativas de `R` (se actualizan junto con el texto que niegan)

| Línea | Niega | Protege |
|---|---|---|
| 851 | `/\b(\d+) de \1 días/` y `/mejor\|peor\|gracias a\|provoc\|causó/i` en `.comparacion-de-etapas` | D-28; sin causas |
| 996 | Que quede «Abrir {vista}» tras borrar | PRO-19 |
| 1018 | `/Analizar\|kcal\|Peso muerto/` en `main` (un tercero) | PRO-20: 404 neutral |
| 1128 | `/\(estimación\)/` en `.leyenda` | Calculado no es estimado |
| 1141 | «81,2 kg» seguido de « (» | Lo medido va sin marca |
| 1224, 1232 | `/80,5\|81,2/` en el origen; `/80,5\|81,2\|25,6/` en `main` | No repetir el valor tras revocar |
| 1240, 1249 | «Descargado:» en `main`; `/Toma\|kg/` en `.entrada` | Sin aviso viejo ni tomas |

### 6.4 Positivas de `RC`

| Línea | Usa | Protege |
|---|---|---|
| 249-257 | Cualquier `main *` con desplazamiento vertical propio | Sin doble desplazamiento (CP-27) |
| 260-293 | `figure.grafico__figura`, `.grafico__titulo`, superficie, curvas, `[data-clase]` | Gráficos dibujados |
| 359-385 | `.tarjeta-de-pregunta` «progresando este ejercicio»; `.parametros-de-pregunta` y su botón de envío; `details.comparar-a-mano`; `.contraste .capa` «Distintas de lo indicado» | Las 20 pantallas de `mirar` |
| 469, 505-514 | dibujadas = figuras; modos P, S y R con 3, 1 y 1 figuras | CP-27 |
| 486 | `.tarjeta-de-pregunta` con `top < 800` a 1280 × 800 | Primera pantalla |
| 672-686 | `.parametros-de-pregunta` `/Elegí un ejercicio/`; «Ver la respuesta»; `.pregunta-activa` `/Peso muerto · serie \d/`; 3 gráficos | CP-07 |
| 689-713 | «Ver el origen de este dato»; `dialog[open]`; Escape; foco en el disparador; «Ver en Entrenamiento»; mismos parámetros | CP-21 |
| 753-803 | `.tabla-del-contraste tbody tr`, celdas [3] y [4]; `.contraste .capa` ×3; `.contraste .metadatos`; textos exactos del modo y del resultado | R3, CP-09 |
| 936-952 | `caption` «Comparación de los dos períodos»; `th` «Energía»; celdas [1] y [2] | CP-18 |
| 970-974 | `.comparacion-de-etapas .etapa`: «Desde {fecha con año}», último día, `/Sigue vigente/` | CP-14 |
| 992-1009 | `.tabla-de-etapas tbody tr`, `th` «Energía», celdas [1], [2], [3]; cobertura dentro de la celda | CP-18 |
| 1013-1041 | `details.comparar-a-mano` como hermano siguiente de `.comparacion-de-etapas`; `details.resumen-en-texto--plegado`; una sola vez `/no indica causa/` y `/No se restan totales/`; `.celda__detalle` ≥ 0,95 rem; 4 fechas; `th` «Registros» con `/duraciones distintas no se restan/`; ≥ 2 gráficos; `desde` | R4, CP-18 |
| 1044-1055 | `.capa` «Semana»; `details.intervalo`; `g === 'W'`; `ref === '14'` | CP-17 |
| 1058-1085 | `details.vistas-guardadas`; «Guardar esta vista»; «Abrir {nombre}»; `/no aplica a este asesorado/` | CP-26 |
| 1096-1133 | `.leyenda`; `.panel-de-lectura`; `g.grafico__elegible` con el aro `circle[fill="none"][stroke="var(--texto)"]` como primer hijo; `details.tabla-de-datos`; CSV | CP-11, CP-12, CP-13 |
| 1193-1204 | `.analizar` `/Reintentar/`; un gráfico «Peso»; `.analizar__lienzo .campo__error button` | R6 |
| 1290-1297 | `.contraste` `/Plan\|planificado\|indicad/i` | CP-09 |
| 1413-1440 | Origen; `.analizar` «no está disponible con tu acceso actual»; 0 gráficos; `.exportar` | CP-23 |

### 6.5 Negativas de `RC`

| Línea | Niega | Protege |
|---|---|---|
| 746 | `/Entrenamiento\|Antropometría/` en `.informacion-para-revisar` | CP-08 |
| 793 | `/^Distinta/` en la celda [4] | CP-09 |
| 814 | `/\d+ ?g\b\|\d+ kcal/` en el detalle no disponible | CP-24 |
| 953, 1006 | `/\b(\d+) de \1 días/` | D-28 |
| 1020-1022 | `h3` «Comparar dos períodos»; `section.resumen-en-texto`; `details.etapas-del-grafico` | D-31 |
| 1127 | `/estimación\)/`, quitando antes «no una estimación» | CP-13 |
| 1174 | «Peso» en los títulos, y un solo título | CP-22 |
| 1424 | `/\d+,\d kg/` en el origen | CP-23 |

### 6.6 Lo que el diseño rompe por construcción

- **Fechas una sola vez:** `ejeX > 1` por figura (`R:464,470`).
- **Origen sin `<dialog>`:** `R:706-718,1158-1162,1221-1226`; `RC:692-703,1414-1418`.
- **«Más acciones» cerrado:** todo lo que busca `details.vistas-guardadas`, `details.intervalo`, «Descargar los datos (CSV)», `.exportar` o `.capa` «Semana». Conviene un ayudante como `elegirPeriodo` (`R:178-182`).
- **Tabla de etapas de 4 columnas, con la cobertura en la tarjeta:** índices de `RC:995-1009` y `.celda__detalle` de `RC:1025` (si no existe, `getComputedStyle(null)` lanza una excepción).
- **Fechas sin año:** `RC:974` y `R:775,882` comparan con `dateStyle: 'medium'`.
- **«sigue vigente» en minúscula:** `RC:974`.
- **Leyenda de estados en la ayuda:** `R:1124-1128`, `RC:1099-1100`.
- **Límite de la pregunta en la ayuda:** el conteo `/No se restan totales/ === 1` de `RC:1024,1030`.
- **`.pregunta-activa` con controles:** `RC:684`.
- **El título con «(g)»:** `R:662`.

## 7. Lo que no pude determinar leyendo

- **Qué abre «Cómo se lee esta vista»** y con qué forma. El marco está en `workspace.tsx`, fuera de `Analizar`, y el contenido depende de la vista.
- **Cómo es «Más acciones» abierto,** y dónde se ve la tabla de «Comparar dos períodos».
- **Qué abren los enlaces del pie:** si despliegan en el lugar o en otro panel.
- **Qué hace «Abrir estos gráficos en grande».** De eso depende cómo se llega a «Agrupar por» y al intervalo desde etapas (CP-17).
- **A dónde lleva «Ver el 24 sept en la línea de tiempo».** Usar `desde` y `hasta` cambia el período de las tres vistas; un parámetro nuevo es agregar contrato.
- **Cómo se agrega o se reemplaza una métrica con «3 de 3»** (PRO-06), y a dónde va el campo «Fecha elegida».
- **Si un clic en un punto sigue abriendo el origen.** Con el origen en el lugar de la lectura, cada clic la reemplazaría.
- **Cómo quedan Contraste, Información y «¿Qué cambió desde que empezó este plan?»** No están entre las nueve pantallas.
- **Cómo se ve Analizar a 1280 y a 1024.** Hay solo reglas escritas (`CRIT` §3).
- **Cuándo un panel lleva las bandas de otra área.** La regla de 2.2 la infiero.
- **Cuál es «la cobertura de la etapa»** cuando las métricas no coinciden.
- **Si la etiqueta «Energía registrada» que arma la API entra en este paquete.** `WP` autoriza «textos de pantalla en el website».
- **El comportamiento fino de Recharts:** rótulo al final de una línea, eje oculto, dominio que incluya el objetivo. Leí el código, no lo ejecuté.
- **Cómo se ve hoy Analizar con tres métricas después de la Parte 1.** La captura de `parte-1` es la entrada; la de tres métricas que vi es de `REPO\EVIDENCIA\DASHBOARD-COMPRENSION\despues\analizar-1440-claro.png`, anterior al marco nuevo.
- **Si el ícono de cada medida antropométrica** sale limpio de `FAMILIA_DE_METRICA` para todos los códigos: no los recorrí.
- **Si las pruebas y los recorridos pasan hoy.** No ejecuté nada.
