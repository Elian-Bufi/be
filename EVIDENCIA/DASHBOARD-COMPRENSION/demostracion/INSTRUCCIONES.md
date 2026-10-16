# Instrucciones detalladas · abrir solo si te trabás

El camino de cada tarea de `TAREAS.md`, qué deberías ver y las respuestas para comparar. Los valores son los de la
generación del 9/10 a las 12:36, leídos de la API y calculados aparte. El asesorado A es «Asesorado · 5db647».

---

## 1 · Comprender qué cambió

**Camino**

1. Iniciá sesión en `http://localhost:3000/login`. En «Espacio profesional», abrí «Asesorado · 5db647».
2. Sin desplazarte, mirá: la cabecera con el acceso actual; la tabla «Objetivo y planificación», con una fila por área
   (objetivo vigente hoy, plan vigente y lo que rigió antes, revisiones); y el comienzo de «Para tu próxima revisión».
3. En «Para tu próxima revisión», cada hecho dice su área y su alcance («Nutrición · Desde la revisión del 19 sept
   2026»), el hecho, «Sale de…» y una acción. «Ver todas» muestra el resto.
4. En el hecho de lo nuevo de Nutrición, seguí «Ver en la línea de tiempo (Nutrición)»: la línea llega filtrada a lo
   nuevo desde esa revisión, con un aviso arriba; «Ver todo el período elegido» lo quita.
5. Volvé con la pestaña «Resumen».

**Respuestas**

- **Nutrición**, desde la revisión del 19 sept 2026 (registrada a las 11:00 y aplicada a las 11:15): «67 comidas
  registradas, 2 hechos anteriores cargados después y 1 registro anterior corregido o anulado». En la línea de tiempo:
  - *se cargó después:* la merienda del 25 ago, cargada el 3 oct;
  - *se corrigió después:* la merienda del 29 ago, sin confirmar, rectificada el 6 oct.

  El segundo «cargado después» es el objetivo de la base sintética, que el generador registra al generar: es un efecto
  de los datos de prueba (está en `../LEEME.md`), no de la ficha.
- **Entrenamiento:** la revisión del 30 sept 2026 está **registrada, sin aplicar**. Desde ella, 4 sesiones registradas,
  una sesión anterior cargada después y una corregida (más el mismo efecto del objetivo sintético). Hay un **borrador
  del plan** (versión 3) que todavía no rige.
- **Medidas:** en Antropometría, una medida cambió de protocolo (la línea del peso se corta) y hay una toma reportada
  por la persona.
- **Próxima revisión acordada:** 12 oct 2026.

---

## 2 · Comparar etapas

**Camino**

1. Pestaña «Analizar». Sin una pregunta en curso, la pantalla ofrece las preguntas (también desde el Resumen,
   «Empezar por una pregunta»).
2. Abrí «Más preguntas» y elegí «¿Qué cambió entre dos etapas?». En «Área», «Nutrición»: la pantalla sugiere a la vista
   las dos últimas versiones. Confirmalas con «Ver la respuesta».
3. Las tarjetas A y B dicen desde y hasta cuándo rigió cada versión, su duración y cómo terminó. «Ver la planificación
   de esta etapa» la abre al costado, en solo lectura; Esc la cierra.
4. La tabla resume cada métrica con el mismo criterio en las dos etapas, con su cobertura en días de la etapa.
5. Justo debajo está plegado «Comparar otros dos períodos, con fechas elegidas a mano»: es opcional con esta pregunta.
6. Más abajo, los gráficos con las bandas de las etapas. «Agrupar por · Semana» cambia el gráfico, no la tabla.

**Respuestas**

| | Etapa A · versión 1 | Etapa B · versión 2 | B − A |
|---|---|---|---|
| Fechas | 18 jul al 3 sept 2026 (el 4 ya es de B) | 4 sept a hoy, en curso | — |
| Duración | 48 días | 36 días, con hoy en curso | — |
| Energía (media de los días con valor) | 1.238 kcal · 48 días: 44 con valor, 7 de ellos subtotales, 4 sin registros | 1.170 kcal · 36 días: 35 con valor, 1 subtotal, hoy en curso fuera de la media | −68 kcal |
| Proteínas | 82,8 g | 85,2 g | +2,4 g |
| Registros (total) | 159 | 124 | **No se restan:** las etapas duran distinto |

Las dos etapas tienen un día con registros asociados a otra versión (una comida cargada después de cambiar el plan), y
la tabla lo dice.

---

## 3 · Explorar métricas de distintas áreas

**Camino**

- **Por pregunta:** «Más preguntas» → «¿Cómo evolucionaron la alimentación y las medidas corporales?», elegí la medida
  («Peso»): arma energía, proteínas y peso en paneles.
- **A mano:** «Análisis personalizado: elegir las métricas a mano» (o, con una pregunta en curso, «Otra pregunta o
  análisis personalizado»). En «Agregar una métrica»:
  - «Área» Nutrición, «Métrica» Energía → «Agregar»;
  - «Área» Entrenamiento, «Ejercicio» (por ejemplo, Peso muerto), «Qué se mide» Carga, la «Serie» y la «Unidad» →
    «Agregar»;
  - «Área» Antropometría, «Medición» Peso → «Agregar».

Después:

1. Los paneles van sincronizados. Elegí un día con las flechas sobre un gráfico o con «Fecha anterior con datos»: la
   «Lectura del …», al costado, dice lo de las tres métricas ese día, o «sin dato».
2. En el peso, la toma del 4 oct es **reportada por la persona** (contorno cortado). Agregá el IMC como cuarta métrica:
   la pantalla te pide «Elegí cuál reemplazar». El IMC es **calculado** (con un punto adentro), y la lectura dice que es
   un índice calculado sobre medidas, no una estimación. Las tomas sin ese contorno ni ese punto son **medidas**.
3. «Ver el origen de este dato», en la lectura, abre el registro al costado. Esc lo cierra y la vista sigue igual.
4. En «Cómo se leen», «Superpuestas en valores reales» no se ofrece con unidades distintas y dice por qué; «Cambio
   relativo» muestra su referencia.

---

## 4 · Preparar una revisión con evidencia

**Camino**

1. En el Resumen, «Preparar la revisión de Nutrición» (en «Acciones»). Se abre la pestaña de Nutrición en
   «Revisiones» con «Preparado por BE para esta revisión»: el período va del 19 sept 2026, la última revisión, a hoy.
   **Todavía no se registró nada.**
2. «Evidencia que examinaste» viene sin nada marcado:
   - arriba, «Planificación y objetivo» (el plan vigente y el objetivo);
   - debajo, «Comidas del período, por día»: una fila por día con «marcar las N comidas», y «Ver las N» para marcar una
     por una;
   - arriba de los días, «Marcar las 65 comidas del período (21 días)».

   El resumen dice lo que marcaste («Marcaste… de…») y «Lo que marcaste» lo lista con «Quitar».
3. Completá «Interpretación», elegí un «Resultado» (por ejemplo, «Mantener»), «Fundamento» y «Próxima acción».
   «Registrar revisión» la guarda; «Cancelar» no guarda nada.
4. Aparece un aviso con «Volver a la ficha, donde estabas». En la ficha, la fila de Nutrición dice la revisión de hoy,
   «registrada, sin aplicar», y «Para tu próxima revisión» cuenta lo nuevo desde ella.

**Para tener en cuenta**

- Marcar no es haber examinado: dejá marcado solo lo que miraste. Viaja una referencia por cada registro marcado.
- Aplicar la revisión es otro paso («Aplicar continuidad», en la lista de revisiones): registrar no cambia el plan.
- Lo mismo vale para Entrenamiento desde «Preparar la revisión de Entrenamiento», con las sesiones por día.
