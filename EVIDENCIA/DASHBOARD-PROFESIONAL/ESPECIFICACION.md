# Especificación de pantallas, estados y criterios visuales

**Paquete:** WP-DASHBOARD-PROFESIONAL. **Fuentes:**
- encargo de Dirección del 2026-10-08, §5 a §9 y §15;
- B10-08/09 (§3 invariantes, §8 a §12, §16 a §18, §29 y §30);
- `INVESTIGACION.md` (F-01 a F-11).

## 1. Mapa de flujo

```text
/pro (Pendientes · Tus asesorados)
  └─ Abrir asesorado → /pro/advisees?id=…  (la ficha)
       [ Resumen ] [ Línea de tiempo ] [ Analizar ]      ← pestañas nuevas de la ficha (vista=resumen|linea|analizar)
       Encabezado: identidad, alcances accesibles, período, «Consultado a las HH:MM»
       ├─ Resumen ──→ «Ver en la línea de tiempo» (mismo período) · «Analizar» (preset o indicador) · «Abrir» el dominio
       ├─ Línea de tiempo ──→ entrada → «Abrir registro» (pestaña del dominio, con volver=…) ──→ vuelve con filtros y posición
       └─ Analizar ──→ punto o evento → panel de detalle → «Abrir registro» ──→ vuelve con métricas, período y fecha elegida
  Las pestañas de dominio (Nutrición, Entrenamiento, Antropometría, Información) siguen igual; el registro original se
  abre ahí.
```

**Estado compartido:** el período (`desde` y `hasta`, o un preset) vive en la URL y es el mismo en las tres vistas.

**Estado propio de cada vista:**
- **Línea de tiempo:** áreas, tipo, estado, búsqueda y cursor de la página.
- **Analizar:** métricas, modo, grano, capas, fecha elegida y comparación.

Todo ese estado viaja en la URL (`?id=…&vista=…&…`), así que **volver con el navegador o con «Volver al análisis»
recupera la misma selección**. En la URL no hay textos clínicos: solo identificadores opacos de métrica y fechas.

## 2. Resumen («¿Qué necesito revisar?»)

**Composición:** pocas piezas, de arriba hacia abajo, en dos columnas desde 1024 px y en una por debajo.

1. **Encabezado compacto:** nombre, vínculos por alcance y período. Separa «Datos consultados a las 10:42» de «Último
   registro del asesorado: 7 de octubre» (por área).
2. **Objetivos y planes vigentes** (de API-DSH-03): objetivo con autor y fecha, y plan de cada área con versión,
   activación y enlace al detalle.
3. **Indicadores fijados** (3 o 4, elegidos por el profesional y guardados como preferencia). Cada uno muestra:
   - valor y unidad;
   - fecha efectiva del dato;
   - fuente y calidad (por ejemplo, «Subtotal: 2 de 4 comidas con cantidades»);
   - n de observaciones en el período;
   - una comparación válida: primera contra última observación **del mismo grupo comparable**, con sus dos fechas.
     Si no hay dos observaciones comparables, «Una sola observación: no hay con qué comparar».
   - **Ningún color de juicio:** las flechas son neutras y van con texto.
4. **«Desde la última revisión»,** solo si existe una revisión registrada (la `lastReview` del área, en DSH-03), con su
   fecha. Si no hay revisión, el bloque se titula «En el período seleccionado». La fecha de una revisión nunca se inventa.
5. **Cobertura por área (operativa, no clínica):**
   - **Nutrición:** días con registro, registros con cantidades y registros sin confirmar.
   - **Entrenamiento:** sesiones registradas por condición (realizada, con desvío o no realizada).
   - **Antropometría:** tomas en el período y si son comparables con la anterior.
   Sin porcentaje global. Los avisos son operativos («3 registros con cantidades sin confirmar»).
6. **Eventos recientes** (los 6 últimos de API-DSH-04) y **accesos a Analizar** (presets disponibles con los datos y
   permisos de este asesorado).

**Vista parcial:** un aviso único, «Vista parcial según tu acceso actual» (B10-08 §8.4). No se dibujan tarjetas de
dominios ocultos.

## 3. Línea de tiempo («¿Qué pasó y cuándo?»)

**Barra de filtros**, agrupada por frecuencia de uso:

| Filtros | Contenido |
|---|---|
| Siempre visibles | Período (presets y dos campos de fecha), chips de área (solo las accesibles), tipo de evento y búsqueda |
| Avanzados (desplegable, sin esconder los activos) | Estado (vigente, rectificado o anulado), calidad (cantidades confirmadas o sin confirmar), versión de plan y ejercicio |

**Los filtros activos** se listan como chips, con «Quitar» y «Limpiar filtros». La cantidad de resultados se anuncia en
una región `role="status"`.

**Lista:** agrupada por **día civil del hecho** (zona del asesorado). Encabezados del tipo «Martes 7 de octubre de
2026». Cada entrada tiene:
- área, tipo y un resumen factual de una línea;
- «Ocurrió», con fecha y hora, o solo la fecha si el hecho no tiene hora;
- «Registrado el…» cuando es otro día, o cuando aporta algo (carga tardía);
- autor o procedencia, si son revelables;
- las relaciones reconstruibles: «Rectifica el registro del…», «Anulado el…» y «Plan → ejecución»;
- la acción «Abrir registro».

Una rectificación es una **relación** del evento original, no un evento de consumo nuevo. Una anulación conserva la
entrada tachada, con la fecha de anulación.

**Paginación:** con cursor estable y «Ver más» (no infinita). El orden es la fecha del hecho de forma descendente, y
después la fecha de registro y el identificador, para los empates.

**Estados diferenciados:**

| Estado | Texto |
|---|---|
| Sin datos en el período | «No hay eventos registrados en este período.» |
| Sin coincidencias | «Ningún evento coincide con los filtros. [Limpiar filtros]» |
| Error | «No pudimos cargar la línea de tiempo. [Reintentar]». No se ve como vacío |
| Vista parcial | El aviso único |

## 4. Analizar («¿Cómo evolucionaron estas variables?»)

**Columna de control** (a la izquierda desde 1280 px; arriba y plegable por debajo):
- **Período:** 7, 30 o 90 días, todo lo disponible (hasta 365 días) o un rango propio con dos campos de fecha. Se aclara
  si incluye el día de hoy (parcial).
- **Métricas (hasta 3):** un selector agrupado por área, con búsqueda y una explicación breve. Al intentar una cuarta,
  aparece el diálogo «Elegí cuál reemplazar»: nada se pierde en silencio.
- **Presets por pregunta profesional:** al aplicarse llenan el selector, que sigue editable. Si falta una métrica, el
  preset lo dice y deja elegir otra.
- **Modo:**
  - **Paneles sincronizados** (por defecto);
  - **Superpuestas en valores reales** (habilitado solo si las métricas son de la misma unidad y familia compatible);
  - **Cambio relativo** (habilitado solo si todas admiten razón y tienen una referencia válida).
  El modo deshabilitado explica por qué.
- **Grano:** original, diario o semanal, con las opciones inválidas deshabilitadas y explicadas.
- **Capas:** vigencia de planes (bandas) y eventos (marcas), que se pueden apagar.
- **Vistas guardadas:** guardar, abrir y borrar. Al abrir una se revalidan los permisos.

**Lienzo:**
- **Modo A:** hasta tres paneles verticales con el mismo eje temporal, la misma fecha elegida y la misma selección de
  intervalo. Cada panel tiene título, unidad y escala propia, y muestra puntos reales con líneas cortadas en los huecos
  y en los cambios de grupo comparable.
- **Modos B y C:** un solo gráfico, con leyenda, colores estables y forma o trazo distinto por métrica.

**Panel de lectura (persistente, no un tooltip efímero):** para la fecha elegida, cada métrica muestra:
- el valor, la unidad y el estado;
- la fuente y la calidad;
- o «Sin dato en esta fecha» (si se ofrece el más cercano, se dicen su fecha y la distancia).

Se maneja con mouse, teclado (flechas, Inicio y Fin) y toque.

**Intervalo:** se elige arrastrando sobre un panel (atajo) **o** con los dos campos de fecha (WCAG 2.5.7). «Restablecer
vista» vuelve al período.

**Detalle:** un clic en un punto o un evento abre un panel lateral con el origen (registro, método, autor, versión y
estado) y la acción «Abrir registro», que vuelve con el mismo estado.

**Debajo del lienzo:**
- **«Cómo se calcula»:** una explicación breve, con el detalle técnico y los registros usados.
- **Tabla de datos:** todas las métricas por fecha, con la unidad en el encabezado, «Sin dato» explícito y el estado.
- **Resumen textual** del gráfico (W3C, imágenes complejas).
- **Comparar dos períodos:** dos rangos explícitos y, por métrica, la duración, n, la cobertura, el mismo resumen
  (media o mediana según la métrica) y la diferencia descriptiva. Se aclara: «Coincidencia temporal; no indica causa».

## 5. Criterios visuales

- **Identidad:** logo, temas Claro y Azul noche y los componentes existentes (`.tabla`, `Pestanas`, `Aviso` y
  `Ayuda`). Superficies mates, sin vidrio ni brillos.
- **Tres colores de métrica** (tokens nuevos `--metrica-1/2/3` en los dos temas), con contraste ≥ 3:1 sobre la
  superficie del gráfico (WCAG 1.4.11), más **forma de punto** (círculo, cuadrado o triángulo) y **trazo** (continuo,
  rayado o punteado). No coinciden con los colores de área ni con los de juicio.
- **Números tabulares** en tablas, ejes y panel de lectura. Las unidades siempre se ven: en el título del panel y en
  la tabla.
- **Bandas de plan:** relleno tenue y rayado, con el rótulo «Plan vigente v3». Nunca dicen «cumplido».
- **Animaciones** mínimas, desactivadas con `prefers-reduced-motion`.
- **Anchos objetivo:** 1440, 1280, 1024, 768 y 390 px. En 390, los controles se apilan y los paneles ocupan el ancho,
  sin desplazamiento en dos direcciones (1.4.10).

## 6. Lo implementado frente a esta especificación (hitos 5a y 5b)

**Escritorio primero.** Dirección pidió el 2026-10-08 pensar el entorno profesional para escritorio; lo responsivo se
conserva y solo tiene que no romperse (768, 390 y 320 px se verifican sin desbordes). En consecuencia:

| Pantalla | Escritorio (1440 y 1280 px) | 1024 px | Más angosto |
|---|---|---|---|
| Ficha | Contenedor de hasta 100rem; pestañas y período en una fila | Igual, con el período en dos renglones | Apilado |
| Resumen | Indicadores arriba (cuatro en fila); cobertura y últimos hechos lado a lado; después el estado por área (API-DSH-03) y las preguntas | Igual | Una columna |
| Línea de tiempo | Filtros en una fila; el registro original en un **panel lateral derecho** de toda la altura, con la lista atenuada detrás | Igual | Diálogo centrado |
| Analizar | **Tres columnas:** selección y opciones · gráficos · lectura fija al costado mientras se recorren las fechas | Dos columnas; la lectura debajo de los gráficos | Una columna: métricas, gráficos, lectura y opciones |

**Cambios respecto del diseño de §2 a §5:**
- **Orden del Resumen:** los indicadores van primero y el bloque de API-DSH-03 se llama «Estado por área» (antes
  «Resumen», que repetía el nombre de la pestaña). «Desde la última revisión» no es un bloque aparte: la última revisión
  de cada área está en su tarjeta, con su fecha, y nunca se inventa.
- **Anulación:** la entrada no se tacha (tiene que poder leerse); lleva la insignia «Anulado», el borde rayado y la
  relación con su fecha.
- **Selector de métricas:** área y métrica en dos listas, sin búsqueda de texto (con 6 métricas de nutrición, las de
  entrenamiento por ejercicio y las antropométricas del período, una búsqueda no ayuda). «Agregar una métrica» y
  «Empezar por una pregunta» se pliegan cuando ya hay métricas elegidas.
- **Trazo:** en paneles separados la línea es continua (cada métrica tiene su panel); el rayado y el punteado se usan
  cuando las series comparten gráfico. Color y forma de la marca se conservan siempre.
- **Marcas según la densidad:** con 90 días o más se achican para no pisarse; no se quita ningún punto, ni los extremos
  ni los cortes. Los huecos (subtotal, día en curso o semana sin completar) conservan un tamaño en el que se ven huecos.
- **Día en curso:** la serie lo marca (`partialBucket`); el gráfico lo dibuja hueco, la lectura y la tabla lo nombran, y
  la media, la mediana y la referencia del cambio relativo lo dejan fuera (lo dicen). El total lo cuenta y lo avisa.
- **Calidad:** «sin faltantes» en lugar de «completo», para no chocar con «día en curso».
- **Fallas:** límite de consultas, sin red, servicio no disponible u otra, cada una con su texto y «Reintentar». Una falla
  no se muestra como «sin datos», y lo que cargó bien sigue a la vista (un 503 del peso no borra energía y proteínas).
- **Hitos:** además de las líneas punteadas, una lista en texto con su fecha.
- **Exportación:** «Descargar los datos (CSV)» con lo que muestra la tabla (ver `DICCIONARIO-DE-METRICAS.md` §1 y
  `ACEPTACION.md`, PRO-10). La impresión no se ofrece todavía. Antes de armar el archivo se vuelve a consultar con el
  acceso de ese momento: lo que ya no está disponible no entra, el aviso dice por qué y queda a la vista aunque la
  pantalla se vuelva a pedir.

**Correcciones de la revisión independiente del head fbeb256** (`ACEPTACION.md`, «Revisión del head fbeb256»):
- **Referencia del cambio relativo.** Un bloque propio en la columna de opciones, siempre visible: dice la referencia
  vigente («Los primeros 7 días del período, del … al …» o «Rango fijo, del … al …») y que acercar, alejar o restablecer
  el gráfico no la cambia. «Cambiar la referencia» abre un editor (los primeros N días o un rango fijo, con «Copiar el
  intervalo visible») que solo se aplica con «Aplicar la referencia». En el modo «Cambio relativo», el lienzo repite la
  referencia vigente, dibuja su banda y avisa si quedó fuera del intervalo visible. La lista de vistas guardadas dice la
  referencia de cada una.
- **Grano semanal.** «Cómo se calcula» dice qué es cada punto semanal y que los resúmenes, la comparación y la referencia
  usan los días (o las sesiones) del rango exacto.
- **Clase del dato.** Contorno cortado: reportado por la persona, no medido. Un punto adentro: calculado por un método
  (una estimación). Las palabras son las de la pestaña de Antropometría (Medido, Reportado, Calculado). La leyenda los
  explica solo cuando hay puntos de esa clase; la tabla los nombra entre paréntesis.
- **Motivo de un modo deshabilitado.** Cada métrica con el suyo («Peso: no tiene observaciones en los días de referencia;
  Índice de masa corporal: no admite cambio relativo»), no todos los nombres y después todos los motivos.
- **Origen de un punto con el acceso revocado.** El panel dice «no está disponible con tu acceso actual», no repite el
  valor que había en pantalla, y los gráficos se vuelven a pedir.
