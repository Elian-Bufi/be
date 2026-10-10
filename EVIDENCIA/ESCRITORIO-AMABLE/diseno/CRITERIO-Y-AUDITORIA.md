# BE · Escritorio profesional: criterio de diseño y vara de auditoría

> **Copia del 2026-10-10** del documento de diseño, traída al repositorio al declarar WP-ESCRITORIO-AMABLE
> (`docs/paquetes/WP-ESCRITORIO-AMABLE.md`). Las rutas son relativas a esta carpeta. Están acá las 29 pantallas
> (`maquetas/`) y el catálogo de íconos (`iconos/`); lo demás que se nombra (versiones anteriores de las maquetas,
> láminas, exportaciones y generadores) queda en el taller de diseño, fuera del repositorio: ver `LEEME.md`.

> Propuesta de dirección de UX del 2026-10-09, a pedido de Dirección. Es el criterio con que se diseñaron las maquetas
> (la versión vigente está en `maquetas/`, con 29 imágenes) y con que se audita lo que se construya a partir de ellas. **No es
> implementación:** nada de esto está en el producto hasta que Dirección lo valide.

## 1. El problema, medido en la pantalla de hoy

| Vista | Hoy (1440 px de ancho) | Qué le pasa al profesional |
|---|---|---|
| Resumen | 2,3 pantallas de alto | Tiene que desplazarse para llegar a los indicadores; el mismo área aparece en tres bloques distintos |
| Línea de tiempo | 330 hechos en 90 días; los primeros 50 ocupan casi 12 pantallas | No puede ver una semana de un vistazo; cada comida ocupa cinco renglones |
| Analizar | 2,7 pantallas; los gráficos ocupan menos de la mitad del ancho | La configuración ocupa más lugar que lo que vino a mirar |

BE no tiene opciones de más: tiene demasiadas **a la vista al mismo tiempo**, y todas con el mismo peso.

## 2. Ocho criterios

| # | Criterio | En qué se apoya | Qué cambia en BE |
|---|---|---|---|
| 1 | **Cada vista responde una pregunta** | «Primero el panorama, después acercar y filtrar, y el detalle a pedido» (Shneiderman, 1996) | Resumen: ¿qué tengo pendiente? Línea de tiempo: ¿qué pasó y cuándo? Analizar: ¿cómo evolucionó? El detalle va en un panel al costado |
| 2 | **Menos opciones a la vista, no menos funciones** | Ley de Hick: decidir tarda más cuantas más opciones hay. Revelación progresiva | Lo de todos los días queda a la vista; lo ocasional, a un clic, en «Más filtros» y «Más acciones» |
| 3 | **Opciones con nombre de intención** | Reconocer cuesta menos que recordar (Nielsen) | «Hitos» o «Sin confirmar» en lugar de combinar tipo, estado y calidad |
| 4 | **Cada opción anticipa lo que hay adentro** | Rastro de la información (Pirolli y Card) | Los chips dicen cuántos hechos traen; un grupo cerrado dice «1 sin confirmar» |
| 5 | **Lo que va junto, junto** | Proximidad (Gestalt) | Todo lo de un área en una tarjeta, con su acción al pie |
| 6 | **Densidad por agrupación, nunca por letra chica** | Agrupar en bloques (Miller). La guía de BE ya lo dice | El día es la unidad; la letra sigue en 16 px y los controles en 44 px |
| 7 | **Una señal, un significado** | Variables visuales (Bertin). WCAG 1.4.1 | El color dice la métrica; lleno o hueco, si el valor está completo; línea continua o discontinua, si es lo registrado o lo planificado; un sombreado gris, los días sin registros; las áreas, las calorías y los macros van con ícono y nombre, siempre en el mismo orden |
| 8 | **Siempre se sabe dónde se está** | Visibilidad del estado (Nielsen) | Persona, acceso actual, vista y período, fijos arriba en las tres vistas |

Por encima de todo siguen las reglas de BE: no calificar, decir de dónde sale cada dato, y que un hueco sea un hueco.

## 3. Mapa de opciones: qué queda a la vista y qué a un clic

### Encabezado de la ficha (igual en las tres vistas)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Nombre y referencia | Los atajos del período (7, 30 y 90 días, 1 año, otro rango) | La miga: la barra superior ya vuelve al Espacio profesional |
| «Solicitar contexto» | Todas las explicaciones de la vista, en «Cómo se lee esta vista» | Los cinco chips de período |
| Acceso actual, «Actualizar» y la hora | | Las ayudas sueltas de cada bloque |
| Las tres vistas y el período | | |

### Resumen

| A la vista | A un clic | Se mudó |
|---|---|---|
| Una tarjeta por área: objetivo (en Nutrición, con sus calorías y macros), plan vigente y anterior, corte de la revisión, pendientes, conteos y una acción | Cada fila abre su evidencia | «Qué se registró en el período»: la cobertura va en cada indicador |
| Cuatro preguntas | «Más preguntas» | «Lo último que pasó»: es la Línea de tiempo |
| Cuatro indicadores con minigráfico y cobertura | «Elegir indicadores» | «Sale de…» en cada fila: la fila ya nombra su fuente |
| | «Abrir Nutrición», «Abrir Entrenamiento», «Abrir Antropometría» | El autor en cada renglón: se ve al abrir el área |

### Línea de tiempo

| A la vista | A un clic | Se mudó |
|---|---|---|
| Los días, con sus hechos | Los registros de un grupo | Los filtros de estado y calidad con casillas: son vistas con nombre o van en «Más filtros» |
| Los hitos, destacados | El detalle, al costado | «Registrado el…», el autor y «Plan: versión N» en cada comida: van en el detalle |
| Lo rutinario agrupado, con cantidades y excepciones | «Más filtros»: área, tipo de hecho, cargado otro día, corregido o anulado, ejercicio, versión del plan | «Abrir registro» como enlace aparte: la fila entera abre |
| Cinco vistas con su cantidad, el buscador y el total | Los días anteriores | |

### Analizar

| A la vista | A un clic | Se mudó |
|---|---|---|
| La pregunta en curso | Cambiar la pregunta o pasar al análisis personalizado | La columna de configuración: es una barra de un renglón |
| Hasta tres métricas, que también son la leyenda | Agregar o reemplazar una métrica | La leyenda de tres renglones |
| Modo y agrupación, con el motivo si algo no está disponible | «Más acciones»: guardar la vista, vistas guardadas, descargar los datos, comparar dos períodos a mano, capas, elegir un intervalo con fechas | «Resumen en texto» y «Comparar dos períodos» desplegados |
| Los gráficos, con su cobertura | La tabla de datos, el resumen en texto, los hitos y comparar etapas | |
| La lectura del día, con la clase del dato y «Ver origen» | | |

### Comparar etapas (una pregunta de Analizar)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Las dos etapas, con sus fechas, su duración y su cobertura | Elegir otra etapa en A o en B | La cobertura repetida en cada celda: se dice una vez por etapa, y en la celda solo si difiere |
| La tabla: métrica, A, B y diferencia, con el criterio de resumen | «Ver la planificación» de cada etapa | Los gráficos grandes: quedan tres chicos, con «Abrir estos gráficos en grande» |
| El motivo cuando algo no se resta | Comparar otros dos períodos con fechas a mano; la tabla de datos | |

### Origen del dato (se abre desde «Ver origen»)

| A la vista | A un clic | Se mudó |
|---|---|---|
| El valor, su clase y cómo se obtuvo, en una frase | El contraste de cada comida con lo indicado | Nada: ocupa el lugar de la lectura y el análisis sigue a la izquierda |
| Las fuentes, con lo que aporta cada una, y el total | El registro completo, en su área | |
| La versión del plan con que se compara | «Volver a la lectura» | |

### Preparar revisión

| A la vista | A un clic | Se mudó |
|---|---|---|
| Tres pasos: lo que miraste, lo que observaste y lo que decidís | Las comidas de cada día («Ver») | Los 21 renglones de días: son una grilla de tres columnas |
| El período, con el motivo de por qué empieza ahí | Cambiar el período | El efecto de los seis resultados a la vez: se ve el del elegido |
| Los días con sus comidas; los días sin registros, también | «Ver lo que marcaste» | Las revisiones registradas: van en su propia lista |
| Lo marcado, el efecto del resultado elegido y el estado («Todavía no se registró nada») | «Qué hace cada resultado» | |

### Espacio profesional: pendientes y asesorados (pantalla 13)

BE ya tiene esta pantalla, con «Pendientes», «Tus asesorados», «Solicitudes enviadas» y «Solicitar vínculo». La maqueta
no agrega funciones: las ordena.

| A la vista | A un clic | Se mudó |
|---|---|---|
| Los pendientes, con la persona, el área, qué está pendiente y su último registro | «Más filtros» | Los filtros sueltos: son cinco vistas con su cantidad (todo, revisiones, planes, formularios, evaluaciones) |
| «Tus asesorados», con buscador, las áreas de cada uno y lo que no podés ver | La ficha de cada persona («Abrir») | «Solicitar vínculo»: es un botón arriba, no un formulario abierto |
| El aviso de que hay datos fuera de tu alcance, y la hora de la consulta | «Solicitudes enviadas» | El último registro: va debajo de cada pendiente, no en una columna |

### Nutrición: el plan activo (pantalla 16)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Qué versión es, desde cuándo y que es la que ve el asesorado | «Crear nueva versión a partir de esta» y «Guardar como plantilla» | Los días tipo uno debajo del otro: se elige uno |
| El día tipo elegido y el objetivo del día, con calorías y macros | Las otras comidas, plegadas con su cantidad de opciones | La huella de la instantánea: va al pie del historial |
| La comida abierta, con sus opciones lado a lado y la estimación de cada una | La tercera opción («Ver la opción 3») | |
| El historial de versiones | | |

### Nutrición: la versión en preparación (pantallas 17 y 18)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Qué versión se edita, que es un borrador y que el asesorado no la ve | La versión activa, en el mismo selector | Los nombres del día tipo, de la comida y de la opción: se cambian a pedido, no son campos siempre abiertos |
| El estado («Cambios sin guardar» o «Guardado»), junto a los botones | «Guardar como plantilla», en el menú de la versión | «Quitar comida», «Guardar como habitual» y «Quitar día tipo»: van en el menú de cada uno |
| Una comida abierta y, adentro, una opción abierta, con sus ítems | Las otras opciones, en pestañas; «Agregar receta como opción», dentro de «Agregar opción» | La próxima revisión: se pide al activar (pantalla 18), no al pie del editor |
| Cantidad, unidad y estado de preparación de cada ítem, siempre editables | El buscador de alimentos («Agregar ítem») | Las ayudas del borrador: van en «Cómo se lee esta vista» |
| El rango de la comida y dónde cae la opción abierta (propuesta) | El rango del día tipo («Cambiar») | |

### Nutrición: los registros (pantalla 20)

BE ya tiene esta vista: una tabla por día con lo prescripto, lo registrado y la diferencia. La maqueta la ordena.

| A la vista | A un clic | Se mudó |
|---|---|---|
| Cada día con sus comidas del plan: qué se registró, cómo informó las cantidades y la diferencia | El detalle del registro, al costado (hoy se despliega debajo, con «Ver registro») | La tabla repetida en cada día: hay un solo encabezado de columnas |
| Los días sin novedades, en un renglón («4 de 4 comidas registradas») | Sus comidas, al desplegar | La lista aparte «Fuera del plan»: la comida diferente va en la comida donde se registró, con su etiqueta |
| Cinco vistas con su cantidad: todas, distinto de lo indicado, sin confirmar, comida diferente y sin registro | El período | El formulario de «Agregar estimación»: se abre desde el detalle |
| «Sin registro» y «Sin opción del plan registrada», dichos como tales | Los días anteriores | |

### Nutrición: agregar un ítem (pantalla 21)

| A la vista | A un clic | Se mudó |
|---|---|---|
| A qué comida y a qué opción se agrega | «Crear manualmente» e «Importar desde Open Food Facts» | El buscador metido dentro de la opción: se abre al costado y el editor sigue a la vista |
| El buscador, con el foco puesto | Marcar o quitar un alimento como habitual | Los cuatro campos de «Crear manualmente»: aparecen al elegirlo |
| Los alimentos habituales arriba, para agregarlos con un clic | | |
| Los resultados con calorías y macros cada 100 g, en columnas | | |

### Antropometría: las tomas (pantalla 22)

BE ya tiene esta vista («Evaluaciones»): la lista de tomas y la toma abierta, con sus cálculos y sus mediciones. La
maqueta la ordena.

| A la vista | A un clic | Se mudó |
|---|---|---|
| Las tomas, agrupadas por protocolo: dos tomas se comparan solo si lo comparten | «Preparar una toma» | «Corregir» y «Anular» en cada medición (60 botones con el perfil completo): se abren al elegir la medición |
| La toma: cuándo, con qué protocolo, cuántas mediciones y cuáles tienen historia | La historia de una medición, y corregirla o anularla | Los cálculos que quedaron sin efecto: «Ver 3 anteriores, sin efecto» |
| Los resultados calculados, por categoría y cada uno con su método | «Calcular con un método», con qué se calculó cada uno y «Dejar como referencia» | «Medido · Vigente» en cada renglón: se dice una vez, y un renglón marca solo su excepción («Corregida», «Anulada») |
| Las mediciones, por familia y con la unidad dicha una vez | «Ver lámina» | La insignia «Solo lectura»: la frase de arriba dice qué se puede hacer |

### Antropometría: cargar una toma (pantalla 23)

| A la vista | A un clic | Se mudó |
|---|---|---|
| La figura de Dirección, con cada campo unido a su sitio. Con dato o sin dato se dice por la forma del anillo, nunca por el color | «Pliegues», que es la otra mitad de la figura, y la figura de hombre | «En preparación» como pestaña: la toma en preparación se abre desde «Tomas» |
| Cuántas mediciones van cargadas, en total y por familia | «Agregar otra medición» (lo que el protocolo no declara) | «Cargado» o «Sin cargar» en cada renglón: lo dicen el campo y la figura |
| Los datos de la toma (cuándo, cómo se obtuvo, protocolo y contexto) y lo que no tiene sitio en la figura | | La barra fija del pie: el estado y los dos botones van arriba, como en el plan |
| El estado del guardado, «Guardar» y «Registrar toma» | | |

### Entrenamiento: el plan activo (pantalla 24)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Qué versión es, desde cuándo y que es la que ve el asesorado | La versión en preparación, en el mismo selector; «Guardar como plantilla» | Todas las sesiones y todos los ejercicios abiertos a la vez: se elige una sesión y hay un ejercicio abierto |
| El bloque, su propósito y cuántas sesiones tiene; la sesión elegida, con sus indicaciones; que las sesiones no tienen día asignado | La otra sesión; los otros ejercicios, que dicen en un renglón lo que piden | «· de la prescripción» en cada valor heredado: queda para el editor |
| El ejercicio abierto: lo que recibe el asesorado serie por serie, con la nota de cada serie, y lo general del ejercicio | | La huella de la instantánea: va al pie del historial |
| El historial de versiones | | |

### Entrenamiento: los registros (pantalla 25)

BE ya tiene esta vista («Ejecuciones»). La maqueta la ordena.

| A la vista | A un clic | Se mudó |
|---|---|---|
| Las sesiones del período: día, sesión, condición, cuántas series se registraron y si hubo diferencias | El detalle de la sesión, al costado (hoy se despliega debajo, con «Ver detalle») | Las cinco piezas del detalle (dos tablas, un gráfico y dos listas): es una tabla, con cada serie una sola vez |
| Cuatro vistas con su cantidad | «Más filtros»: versión del plan y ejercicio | «Evolución de un ejercicio»: es la pregunta «¿Cómo viene progresando este ejercicio?» de Analizar, y queda el enlace |
| En el detalle, por serie: lo indicado, lo registrado y la diferencia, en palabras | Los descansos y la duración de cada serie | «Desde», «Hasta» y «Ver período»: es el selector de período |
| Los tiempos de la sesión, en un renglón | La sesión en el plan | La lista de días sin registro: se dice cuántos son, con «Ver los días» |

### Entrenamiento: la versión en preparación (pantalla 28)

Hoy es la pantalla más cargada del website: bloque, sesión, ejercicio y serie están abiertos a la vez. Una sesión de
tres ejercicios suma 116 controles y casi 9.700 px de alto.

| A la vista | A un clic | Se mudó |
|---|---|---|
| Qué versión se edita, que es un borrador y que el asesorado no la ve | La versión activa, en el mismo selector; «Guardar como plantilla», en el menú de la versión | Todos los niveles abiertos a la vez: se elige un bloque y una sesión, y hay un ejercicio abierto |
| El estado («Cambios sin guardar» o «Guardado»), junto a los botones | El nombre y el propósito del bloque, el nombre y las indicaciones de la sesión («Cambiar») | El campo, la casilla «Sin objetivo en esta serie» y el renglón de ayuda de cada objetivo de cada serie: es una celda |
| Las series del ejercicio abierto: en cada celda, lo que va a recibir el asesorado. En gris, lo que toma de lo general | «Sin objetivo», en la misma celda | La tabla «Así lo ve tu asesorado»: la tabla que se edita ya lo muestra |
| Lo general del ejercicio: criterio de intensidad, carga sugerida, descanso recomendado y notas | Cómo se cuentan la carga y las repeticiones; «Agregar parámetro» | La próxima revisión: se pide al activar, como en Nutrición |
| Los otros ejercicios, en un renglón con lo que piden | El buscador de ejercicios («Agregar ejercicio»); una sesión habitual, dentro de «Agregar» | La nota de «Validar plan»: va en «Cómo se lee esta vista» |

### Antropometría: una medición (pantalla 29)

| A la vista | A un clic | Se mudó |
|---|---|---|
| El valor que rige, cómo se obtuvo y si tiene historia | «Corregir medición» y «Anular esta medición» | Los dos botones de cada renglón de la toma |
| La historia: el valor original y cada corrección, con su motivo | | El desplegable «Correcciones (n)» debajo del renglón |
| Lo que cambió con la corrección: qué resultados se volvieron a calcular, con el valor de antes | | |

### Información: las solicitudes y el pedido (pantallas 26 y 27)

| A la vista | A un clic | Se mudó |
|---|---|---|
| Las solicitudes, con su estado, cuándo se pidieron, en qué área y para qué | El detalle, al costado (hoy se despliega debajo, con «Ver detalle») | «Pedir información» como pestaña: es un botón y se abre al costado |
| En el detalle, la respuesta que rige y qué cambió si la persona la corrigió | La historia: la respuesta original y cada corrección | «Declarado por la persona» en cada dato: se dice una vez |
| En el pedido, tres pasos: qué formulario, qué preguntas y para qué | Los otros formularios | La casilla «Requerido: …», que repetía la pregunta entera: es una columna |
| De cada pregunta, con qué se responde (texto, o número con su unidad) | | Las citas internas del legajo en la descripción de dos formularios |

### Estados (pantallas 14, 15 y 19)

Un solo bloque para todos: un ícono, qué pasó, por qué y qué se puede hacer.

| Estado | Qué dice | Qué ofrece |
|---|---|---|
| Cargando | Qué se está cargando | Nada: se espera |
| No se pudo leer (sin conexión, BE no disponible, muchas consultas seguidas) | «No pudimos cargar esta vista» y el motivo | «Reintentar» |
| Falló una sola parte | «No pudimos completar esta parte» y el motivo; lo demás sigue a la vista | «Reintentar» |
| Sin datos | Qué falta y que no es un cero | La acción que corresponde, si existe («Preparar una toma») |
| Sin coincidencias | Que ningún hecho coincide con los filtros, y cuántos hay en el período | «Quitar los filtros» |
| Sin acceso | El mismo texto para lo que no existe, lo ajeno y lo que ya no se puede ver | «Volver» |
| Vista parcial | Un aviso único en el encabezado; el área sin acceso no se muestra a medias | Nada |
| El contenido cambió | Que cambió en otro lugar y que lo escrito se conserva | «Actualizar la vista» |

### En 1280 y en 1024 de ancho (reglas, todavía sin dibujar)

Las maquetas son de 1440. Esto es lo que se propone para los otros dos anchos del escritorio. No está dibujado: se
comprueba en la implementación, con capturas a los tres anchos. En ningún caso se achica la letra ni el alto de los
controles.

| Pantalla | En 1280 | En 1024 |
|---|---|---|
| Barra | Igual | El aviso de ambiente de prueba se acorta |
| Encabezado de la ficha | El acceso actual baja a su propio renglón (como en la pantalla 14) | Igual que en 1280 |
| Resumen | Tres áreas y cuatro indicadores por fila; se desplaza un poco | Dos áreas por fila y la tercera debajo; indicadores y preguntas de a dos |
| Línea de tiempo | El buscador y «Más filtros» pasan a un segundo renglón | El detalle se abre encima de la lista, desde la derecha, y se cierra para seguir |
| Analizar | La lectura se angosta; los gráficos también | La lectura pasa a una franja debajo de los gráficos, con los tres valores en fila |
| Comparar etapas | Igual, más angosto | Los tres gráficos chicos pasan a dos y uno |
| Origen del dato | El panel se angosta | El panel se abre encima del análisis |
| Preparar revisión | Los días, de a dos por fila | Una sola columna: los tres pasos, uno debajo del otro; la barra de registrar sigue fija |
| Espacio profesional | El directorio se angosta | «Tus asesorados» va debajo de los pendientes |
| Plan activo | El historial se angosta | El historial va debajo; las opciones de una comida, una por fila |
| Versión en preparación | El rango de la comida se angosta | El rango de la comida va debajo de los ítems de la opción |
| Tomas de Antropometría | La lista de tomas se angosta | La lista pasa arriba, como un selector; las familias, una debajo de la otra |
| Cargar una toma | Los datos de la toma se angostan | La figura y sus campos ocupan el ancho; los datos de la toma y lo que no tiene sitio van debajo |
| Plan de Entrenamiento | El historial se angosta | El historial va debajo; lo general del ejercicio, debajo de la tabla |
| Registros de Entrenamiento | En el detalle, «Indicado» y «Registrado» pasan a dos renglones | El detalle se abre encima de la lista |
| Información | Igual, más angosto | El detalle se abre encima de la lista; el pedido ocupa todo el ancho |

## 4. Lo que cambia respecto de hoy, para validar

1. **El nombre del asesorado.** Los planos muestran «Ana Ruiz» como un alias que escribe el profesional, con la
   referencia neutral al lado. Hoy solo existe la referencia. Es una decisión del legajo (DL-040, abierta).
2. **Un solo control de período,** con los atajos adentro.
3. **El Resumen se organiza por área,** no por tipo de información.
4. **Una ayuda por vista** en lugar de ayudas sueltas. Nada se borra: se junta.
5. **«Sale de…» deja de repetirse en cada fila.** La guía de UX hoy lo pide; habría que ajustarla.
6. **La línea de tiempo agrupa lo rutinario por día.** El conteo y las excepciones salen de datos que la API ya entrega.
7. **Vistas con nombre** en lugar de la matriz de filtros. Usan los filtros que ya existen.
8. **Analizar pasa de tres columnas a una barra, los gráficos y la lectura.** La guía dice «tres zonas»; son las mismas
   tres, acomodadas distinto.
9. **La clase del dato («Calculado», «Reportado») también en comidas y series.** Hoy existe solo en las medidas
   corporales; es un dato nuevo y chico del dominio.
10. **Las horas, en 24 horas** («18:10»). Hoy salen con «p. m.».
11. **Las paletas medidas el 30/9,** que ya estaban decididas para el website.
12. **En Comparar etapas, la cobertura se dice una vez por etapa.** Hoy se repite en cada celda de la tabla.
13. **El origen del dato ocupa el lugar de la lectura,** en vez de abrirse encima.
14. **Preparar revisión en dos columnas y tres pasos,** con los días en una grilla y una barra fija para registrar.
15. **Se ve el efecto del resultado elegido, no el de los seis.** Los textos de efecto son del dominio: no se reescriben
    ni se borran; los otros cinco quedan en «Qué hace cada resultado».

**De la devolución de Dirección del 2026-10-09 (segunda versión de las maquetas):**

16. **Todos los gráficos con puntos; la métrica se distingue solo por color.** Hoy cada métrica tiene además su forma
    (círculo, cuadrado, triángulo). Para que el color no sea el único medio (RNF-ACC-001, WCAG 1.4.1), cada gráfico
    lleva el nombre de su métrica en el título y, cuando van juntas, cada línea lleva su nombre al lado.
17. **Lo planificado y lo registrado, en el mismo gráfico,** cuando están en la misma unidad: lo registrado con línea
    continua y puntos; lo planificado con línea discontinua del mismo color, sin puntos; un rango indicado es una franja.
    Sin porcentajes ni área entre las dos líneas. Hoy existe en la pestaña Entrenamiento; en Analizar, solo en texto.
    En Nutrición vale para las calorías y para los tres macronutrientes: el objetivo nutricional ya guarda un número por
    día para cada uno (ver la sección 5).
18. **Se mantienen las tres métricas de hoy.** Se probó con cuatro y cada gráfico quedaba demasiado bajo; Dirección
    decidió dejarlo en tres.
19. **Comparar sin pregunta es una entrada del mismo peso que las preguntas** («¿Qué querés mirar?»). Hoy es un enlace
    debajo de ellas.
20. **Los modos se llaman «Separadas», «Juntas» y «Cambio relativo»** (hoy «Paneles sincronizados» y «Superpuestas»).
21. **Un control solo aparece si hay algo para elegir.** En el ejercicio no hay «Ver como» ni «Agrupar por»: sus tres
    métricas tienen unidades distintas y se leen por sesión.

**De la segunda devolución de Dirección del 2026-10-09 (tercera versión de las maquetas):**

22. **Los días sin registros llevan un sombreado gris leve** en los gráficos diarios. La línea sigue cortada (un hueco
    no se une), pero se ve dónde no hubo carga. La cobertura lleva la misma muestra gris al lado de «sin registros».
23. **Una familia propia de íconos** (carpeta `iconos/`): 69, con un solo trazo, iguales en los dos temas. Hoy el
    website casi no usa íconos.
24. **El isotipo real de BE** en la barra, en lugar de un círculo de relleno.
25. **Un día sin novedades pesa menos en la línea de tiempo:** si solo tiene lo de siempre y ninguna excepción, va en un
    renglón liso, sin tarjeta. Las tarjetas quedan para los días con sesiones, hitos o excepciones.
26. **En el Resumen, un solo botón lleno:** el del área con la próxima revisión acordada más cercana. Los demás van con
    contorno. La fecha la fijó el profesional: BE no decide qué es urgente.
27. **La línea del objetivo también en los macronutrientes** (ver la sección 5).

**De la tercera devolución de Dirección del 2026-10-09 (cuarta versión de las maquetas):**

28. **«Calorías» en lugar de «Energía»** en todo el escritorio. Es el nombre a la vista; el legajo habla de
    «requerimiento energético estimado», así que al implementar se revisa que el rótulo nuevo no lo contradiga.
29. **Íconos para las calorías y los macros:** rayo, espiga, palta a la mitad y muslo de pollo. Sin color propio y
    siempre con la palabra. La gota queda reservada para el agua.
30. **Un solo orden: Calorías, Carbohidratos, Grasas, Proteínas,** que es el de la APK. Hoy el escritorio usa otro.
31. **La tira del objetivo del día,** con calorías y macros, en el Resumen y en el plan. BE ya guarda esos cuatro
    números; hoy el Resumen no los muestra.
32. **La familia de íconos pasa de 69 a 104** (ver `iconos/LEEME.md`, con lo que se apartó de la lista anunciada). Con
    el ícono de comida del 10/10 son 105.
33. **«Juntas» y «Cambio relativo» dibujados** (pantallas 11 y 12). En «Juntas», cada línea lleva su nombre al final.
    En «Cambio relativo», la referencia se elige y se ve en el gráfico; una métrica que cambió de protocolo dice «No se
    compara» en lugar de un porcentaje.
34. **El Espacio profesional reordenado** (pantalla 13). BE ya tiene los pendientes, los asesorados y las solicitudes:
    no se agrega nada. Cambian el orden y la forma: vistas con cantidad, el último registro debajo de cada pendiente y
    el directorio al costado, con buscador.
35. **El plan activo se lee por día tipo y con las comidas plegadas** (pantalla 16). Hoy es una lista larga con todo
    abierto.
36. **La estimación de cada opción también en el website.** Hoy la ve solo el asesorado, en la APK. La lectura del plan
    que usa el profesional no la trae (cada ítem llega con nombre, cantidad y estado de preparación, sin su aporte), así
    que pide una ampliación de la API. En las maquetas va marcada «Hoy, solo en la APK».
37. **En el editor, los nombres se cambian a pedido y las cantidades están siempre a la vista** (pantalla 17). Hoy cada
    día tipo, comida y opción tiene su campo de nombre abierto, y todos los botones están visibles a la vez.
38. **En el editor, una opción abierta por vez,** en pestañas. Si el nombre es largo, la pestaña lo corta y el nombre
    completo se lee al pasar a esa opción.
39. **Un selector de versión** («en preparación» y «activa») en lugar de mostrar el borrador y el plan activo uno
    debajo del otro.
40. **«Activar plan» guarda antes de pedir la confirmación.** Hoy el botón queda apagado hasta que se guarda a mano;
    «Validar plan» ya guarda solo.
41. **La próxima revisión se pide al activar** (pantalla 18), que es cuando empieza a valer. Hoy es un campo al pie del
    editor.
42. **La confirmación de activar dice qué versión entra y cuál queda en el historial,** además del texto de hoy. El
    foco entra en «Volver».
43. **Un solo bloque para todos los estados** (pantallas 15 y 19), con el motivo siempre a la vista. Los textos de «sin
    acceso» y «el contenido cambió» son los que BE ya tiene.

**Del 2026-10-10, al preparar los íconos para programar:**

44. **Los cuatro íconos de área son los de la APK.** La APK ya tiene sus íconos, con el mismo estilo de trazo, y ahí
    Nutrición es una manzana; en las maquetas era un tenedor y un cuchillo. Ahora Nutrición, Entrenamiento y
    Antropometría llevan el mismo dibujo que en el teléfono, trazo por trazo. Información ya era el mismo objeto.
45. **Los cubiertos pasan a ser «una comida»** (ícono nuevo, `comida`): van en cada comida del plan y del editor. El
    área y sus hechos en la línea de tiempo llevan la manzana.
46. **«Alimento» ya no es una manzana:** un dibujo no puede querer decir dos cosas. Es un cuenco colmado
    (ver el punto 54).
47. **Los controles que son solo un ícono llevan nombre** para el lector de pantalla, y el nombre dice lo que hacen
    («Quitar Pollo»), no lo que se ve.
48. **La familia tiene su catálogo y sus archivos listos** (`iconos/CATALOGO.html`): 105 íconos, cada uno suelto en
    SVG y en PNG, y como datos para programar, con el componente del website y el de la APK ya comprobados.

49. **Los registros se leen por día y con el detalle al costado** (pantalla 20). Hoy cada día trae su tabla y el
    detalle se despliega debajo de la fila.
50. **La comida diferente se lee en la comida donde se registró,** con la etiqueta «Fuera del plan», y la estimación se
    agrega desde su detalle. Hoy figura además en una lista aparte al pie del día. Sigue sin reemplazar la comida
    prescripta: la fila dice las dos cosas. Una comida suelta, que no se registró en ninguna comida del plan, va en un
    renglón propio del día (no está dibujada).
51. **Una comida registrada sin diferencias dice «Igual a lo indicado».** Hoy muestra una raya, que se puede leer como
    «falta el dato».
52. **«Agregar ítem» se abre al costado** (pantalla 21) y muestra los resultados con calorías y macros cada 100 g. Hoy
    se abre dentro de la opción y muestra solo las calorías; el catálogo ya guarda los cuatro valores.
53. **Las palabras del contraste son las de BE:** la columna se llama «Indicado» y el estado de las cantidades,
    «Informó lo que comió de cada ingrediente» (en corto, «Cantidades informadas»).

**De la devolución de Dirección del 2026-10-10 sobre los íconos:**

54. **Cuatro íconos redibujados por pedido de Dirección:** «juntas» (un gráfico con dos líneas que no se tocan),
    «rango» (límites llenos y una flecha más fina), «cambio relativo» y «alimento». Estos dos pasaron por tres
    devoluciones: no convencieron el signo de porcentaje y la canasta, ni después el cero con una flecha y el cuenco
    con un fruto y una hoja. **Los eligió Dirección el 2026-10-10, entre las pruebas:** una línea de guiones (la
    partida) con tres puntos sueltos por encima y por debajo, y un cuenco colmado. Se pasaron en limpio sin cambiar
    la idea: `iconos/laminas/eleccion-del-10-10-cambio-relativo-y-alimento.png` muestra cada uno como se
    eligió y como quedó. La regla que deja: en un ícono, dos trazos no se pisan.
55. **Dos más, de la crítica propia:** «proteínas» (el muslo se afina hacia el hueso; a 18 px parecía una llave) y
    «pliegue» (dos ángulos en lugar de dos flechas). Los otros 99 quedaron como estaban: Dirección dijo que se pueden
    usar por ahora.
56. **Cada redibujo queda anotado** con el dibujo anterior, el que quedó y el motivo (`cambios.js`), y se ve lado a
    lado en la lámina de cambios y en el catálogo.
57. **Un ícono se elige mirándolo en su lugar.** Antes de proponerlo se dibujan varias ideas y se miran a 18, 20 y
    24 px dentro del control donde van a vivir, en los dos temas. Suelto, casi cualquier dibujo parece correcto.

**De las pantallas de Antropometría, Entrenamiento e Información (2026-10-10):**

58. **«Evaluaciones» pasa a llamarse «Tomas».** Hoy la misma cosa se llama «evaluación» en la pestaña y «toma» en el
    título de la lista, en el botón y en el teléfono.
59. **«En preparación» deja de ser una pestaña.** La toma en preparación se abre con «Preparar una toma» y vuelve a
    «Tomas». Quedan tres pestañas: Tomas, Evolución y Lámina.
60. **La toma se carga sobre la figura de Dirección,** la misma de la lámina y del teléfono, con cada campo unido a su
    sitio. Hoy la carga usa otra silueta, con 14 sitios; la de Dirección tiene 24. Los sitios son los que calibró
    Dirección: no se mueve ninguno. Los campos del tronco van a la derecha de la figura y los del brazo y la pierna a
    la izquierda, para que ninguna guía cruce el cuerpo de más.
61. **Dentro de una familia, la medición se nombra sin repetir la familia** («Cintura» bajo «Perímetros»), y la unidad
    se dice una vez por familia. Son los nombres del catálogo, sin la primera palabra.
62. **Corregir y anular se abren al elegir la medición.** Hoy cada medición tiene los dos botones a la vista: son 60
    con el perfil completo, debajo de un título que dice «Solo lectura».
63. **Los resultados calculados van por categoría** (índices, sumas de pliegues, grasa corporal…), como en la hoja
    «Conclusiones» de la lámina. Los que quedaron sin efecto se ven a pedido: hoy se acumulan en la misma lista.
64. **Las tomas se agrupan por protocolo** en la lista, para que se vea dónde cambió.
65. **«Ejecuciones» pasa a llamarse «Registros»,** como en Nutrición. La palabra «ejecución» existe solo en el
    website; el teléfono dice «sesión» y «registro».
66. **El detalle de una sesión es una tabla, con cada serie una sola vez:** lo indicado, lo registrado y la diferencia.
    Hoy lo indicado de una serie se lee en cinco lugares y lo registrado en cuatro.
67. **La evolución de un ejercicio queda en Analizar.** Hoy está también en «Ejecuciones», con sus propios filtros.
68. **Las sesiones van de la más nueva a la más vieja,** como la línea de tiempo. Hoy van al revés.
69. **En el plan de Entrenamiento se elige una sesión y hay un ejercicio abierto.** Hoy todo está abierto a la vez. La
    nota de cada serie se ve también en el plan activo: hoy se escribe en el editor y se lee solo en el teléfono y en
    los registros.
70. **«Pedir información» es un botón** y se abre al costado, en tres pasos. Cada pregunta dice con qué se responde, y
    «Requerida» es una columna.
71. **En una solicitud respondida se lee primero la respuesta que rige,** y qué cambió si la persona la corrigió. La
    respuesta original y cada corrección quedan en la historia. Hoy son bloques completos, uno debajo del otro.
72. **La solicitud dice en qué área se pidió.** Hoy se elige al pedir y después no se ve.
73. **Las preguntas vienen todas elegidas** al elegir un formulario, y el profesional saca las que no quiere. Hoy no
    viene ninguna, salvo cuando se llega desde Entrenamiento.
74. **La nota sobre las preguntas requeridas dice lo que pasa:** si la persona responde, las requeridas no pueden
    quedar vacías. Hoy dice que un campo requerido «igual puede quedar sin responder», y eso vale solo para la
    solicitud entera.

75. **En el editor de Entrenamiento hay un bloque, una sesión y un ejercicio abiertos** (pantalla 28). Hoy todos los
    niveles están abiertos a la vez: una sesión de tres ejercicios suma 116 controles.
76. **Cada objetivo de una serie es una sola celda.** En gris, lo que toma de lo general del ejercicio; con un valor
    escrito, lo propio; y «Sin objetivo», elegido en la misma celda. Hoy son un campo, una casilla y un renglón de
    ayuda por cada objetivo de cada serie. La tabla «Así lo ve tu asesorado» deja de hacer falta.
77. **El descanso se escribe como se lee** («02:30»). Hoy se carga en segundos («150») y se muestra en minutos.
78. **El editor de Entrenamiento sigue al de Nutrición:** los nombres se cambian a pedido, «Activar plan» guarda antes
    de confirmar, la próxima revisión se pide al activar y «Guardar como plantilla» va en el menú de la versión. Son
    los mismos cambios de los puntos 37, 39, 40 y 41: se deciden juntos. «Guardar borrador» pasa a llamarse
    «Guardar cambios», como en Nutrición.
79. **Al elegir una medición se ve su historia** (pantalla 29) y, al corregirla, qué resultados se volvieron a
    calcular. BE ya recalcula lo que dependía de la medición y cada cálculo nuevo sabe a cuál reemplaza; hoy la
    pantalla no lo dice. Al anular, la API ya informa ese efecto; al corregir, falta comprobar si lo informa o si se
    lee de la lista de cálculos.
80. **El plan de Entrenamiento dice que las sesiones no tienen día** (pantallas 24 y 28): «Sin día asignado: tu
    asesorado elige cuál hace», al lado de las sesiones; y el bloque dice cuántas sesiones tiene. BE ya funciona así:
    el teléfono muestra todas las sesiones del plan activo y la persona elige cuál hace. Hoy el website no lo dice en
    ningún lado. Es un texto, no una función. Sale de una pregunta de Dirección al ver la pantalla 24.
81. **Con muchas sesiones, el selector pasa a ser una lista.** Hasta cuatro sesiones van como botones, a la vista. Con
    cinco o más, una lista desplegable que dice cuál está abierta y cuántas hay («B · Tren superior · 2 de 7»). Lo
    mismo vale para los bloques. BE admite hasta 12 bloques y 30 sesiones por bloque. Si el bloque se organiza por
    microciclos, aparece un renglón «Microciclo» entre el bloque y la sesión, con la misma regla. No está dibujado.

**Lo que no se agregó.** En el editor de Entrenamiento hoy no se puede reordenar ni duplicar un ejercicio, quitar una
serie del medio ni descartar el borrador. La maqueta no lo agrega: son funciones nuevas, para decidir aparte.

**Una corrección de una maqueta anterior.** En la pantalla 07, el plan mostraba el RIR como un rango («1 a 2»). En BE
el RIR objetivo es un número: quedó «RIR 2».

**Para decidir (la maqueta no lo resuelve):**

- La lámina nombra los sitios con las palabras del compositor («Tríceps», «Brazo contraído», «Abdomen bajo», «Muslo
  anterior») y el catálogo con otras («Pliegue tricipital», «Perímetro del brazo flexionado y contraído», «Perímetro
  del abdomen», «Pliegue del muslo frontal»). Las maquetas usan las del catálogo. ¿Se unifican?
- «Solicitar contexto», en la ficha, y «Pedir información», en el área, son la misma acción con dos nombres.
- El teléfono llama «Estimación» a todos los resultados de fórmulas; el website los llama «Calculado».
- La evolución de una medida existe dos veces: en Antropometría (pestaña «Evolución») y en Analizar. La pestaña
  todavía no está dibujada.

**Queda para después: unificar la APK.** La APK tiene 20 íconos propios. Los cuatro de área ya coinciden; los demás
quieren decir lo mismo y cambian apenas de medidas, y seis no están en la familia porque el website no los necesita. Que
la APK pase a dibujar desde la familia es otro paquete y pide una APK nueva.

**Una corrección.** La versión anterior de este documento decía que la cartera de asesorados «falta», y a Dirección se
le dijo que hoy «no dice a quién mirar primero». No era cierto: BE ya tiene «Pendientes» en el Espacio profesional. La
pantalla 13 parte de lo que existe.

## 5. Anotado para hacer: macros planificados por día y por comida

**Qué pidió Dirección (2026-10-09).** Que la planificación nutricional tenga rangos de macros planificados, por día tipo
y por comida (por ejemplo, más carbohidratos en el desayuno y el almuerzo para entrenar, y una merienda con más
proteínas y grasas), para comparar lo planificado con lo registrado en el día y por comida, con el mismo tipo de gráfico.

**Qué tiene hoy BE** (verificado en `packages/domain/src/contratos-nutricion.ts` y en el formulario del objetivo):

| Dato | Hoy |
|---|---|
| Objetivo de calorías del día | Existe: un número, en kcal por día, por versión del objetivo |
| Objetivo de proteínas, carbohidratos y grasas del día | Existe: un número cada uno, en g por día. Analizar todavía no lo recibe: su lectura solo trae las calorías |
| Distribución por comidas | Existe solo como texto libre, opcional |
| Rango (mínimo y máximo) de un macro en el día | No existe |
| Objetivo o rango de macros por comida | No existe |
| Macros de cada opción de una comida | Se calculan de sus ingredientes («Estimación para las porciones del plan»). Hoy se ven solo en la APK |

**Qué se puede hacer sin datos nuevos.**
- La línea del objetivo en los gráficos de calorías y de los tres macros (maquetas 03, 04, 05 y 09; en la 11, como
  opción). Pide una ampliación chica de la lectura de Analizar, que hoy solo trae las calorías.
- La tira del objetivo del día en el Resumen y en el plan (maquetas 01, 14, 16 y 17): son los cuatro números que el
  objetivo ya guarda.
- La estimación de cada opción en el website (maquetas 16 y 17). El dato ya se calcula para la APK; falta que la
  lectura del plan del profesional lo traiga.

**Qué necesita datos nuevos.** Los rangos por día tipo y por comida. Tocan el legajo, el contrato del plan, la base, el
editor del plan y Analizar. También hay que decidir si la APK se los muestra al asesorado. En las maquetas están
marcados «Propuesta · dato nuevo»:

| Dónde | Qué muestra |
|---|---|
| Maqueta 17, el editor | Dónde se escriben: el rango del día tipo, debajo del selector de días; el rango de la comida, al lado de sus opciones, con la estimación de la opción abierta ubicada frente al rango |
| Maqueta 16, el plan activo | Cómo se leen después: el rango del día tipo y el de cada comida, y lo que cubren las opciones |
| Maqueta 10, Analizar | Lo registrado en una comida frente a su rango, día por día |

**Una pregunta que abre el rango por día tipo.** Hoy el objetivo del día es uno solo (por ejemplo, 255 g de
carbohidratos), valga para el día que valga. Si el día de descanso lleva un rango más bajo que el de entrenamiento, el
objetivo único deja de describir a los dos. Hay que decidir si el objetivo también pasa a ser por día tipo, o si queda
como referencia general y lo que manda en cada día es su rango.

**Decisión abierta: quién define el rango.**
- **A (recomendada):** lo escribe el profesional en el plan, por día tipo y por comida. Es su intención, que es lo que
  pidió Dirección.
- **B:** BE lo deduce de las opciones cargadas, del mínimo al máximo entre las opciones de cada comida. No pide cargar
  nada, pero dice lo que se cargó, no lo que se busca.
- Se complementan: con A, BE puede mostrar al lado lo que cubren las opciones, para ver si el plan cargado responde al
  rango.

**Reglas que ya valen y se respetan.** Un rango fijado por el profesional se muestra como dato, sin «cumplió» ni
porcentajes. Un subtotal no se compara con el objetivo de un día completo. Una comida diferente o sin confirmar no se
compara.

**Dónde se registra.** Todavía no está en `docs/DEUDA_LEGAJO.md`: se anota con su número cuando se declare el paquete.

## 6. Con qué vara se audita cada imagen

**Se rehace si pasa cualquiera de estas:**
- un bloque agregado, quitado o movido respecto del plano;
- un número, una fecha o una unidad distintos del plano;
- otra navegación, una barra lateral, un avatar o un módulo que no está en el plano;
- falta «Acceso actual»;
- un gráfico con huecos unidos, puntos inventados o líneas suavizadas;
- verde o rojo como juicio, un porcentaje, una barra de progreso o un medidor.

**Se mide sobre la imagen:**

| Qué | Mínimo | En el plano |
|---|---|---|
| Letra corriente, llevada a 1440 px de ancho | 15 px | 16 px |
| Texto más chico | 12,5 px | 13 px |
| Alto de botones, chips y campos | 40 px | 44 px |
| Contraste del texto | 4,5:1 | cumple |
| Contraste del borde de los controles | 3:1 | cumple |

**Se revisa a ojo:**
- en cinco segundos se lee lo que el pedido dice que se lee primero;
- hay una sola acción principal por tarjeta o panel;
- alineación, aire y separadores parejos;
- la barra, el encabezado y los componentes son los mismos en todas las pantallas;
- los textos: cualquier cifra mal es para rehacer; errores de tipeo aislados se corrigen con un ajuste.

**Veredictos:** aprobada, aprobada con ajustes (con la lista exacta para ChatGPT) o se rehace.

**Lo que una imagen no prueba:** teclado, lector de pantalla, estados de carga y de error, permisos y rendimiento. Eso se
prueba en la implementación.

## 7. La prueba con ChatGPT y cómo se sigue

El 2026-10-09 se probó darle a ChatGPT el plano 01 para que pusiera el acabado. Tardó más de cuatro minutos y devolvió
casi una copia del plano. Medido sobre su imagen (1536 × 1024):

| Qué | Resultado |
|---|---|
| Textos y números | Iguales a los del plano |
| Estructura y gráficos | Iguales; diferencias mínimas en algunos puntos de los minigráficos |
| Letra corriente | 16,5 px llevados a 1440 (el plano: 16) |
| Alto de botones y campos | 41 a 43 px (el plano: 44) |
| Contraste | El texto cumple; los rótulos de los ejes quedaron más claros (3,7:1) |

Conclusión: con un plano, ChatGPT lo respeta y no agrega nada; sin plano, inventa. Las maquetas las hace Claude
directamente, y la vara de la sección 6 se aplica a esas maquetas y, después, a la implementación.

## 8. Estado

| Qué | Estado |
|---|---|
| Veintinueve imágenes (01 a 29), en Claro y en Azul noche. Las 22 a 29, del 2026-10-10, todavía no las vio Dirección | Hechas: `maquetas/claro/` y `maquetas/azul-noche/` |
| Familia de íconos (105), alineada con la APK, con su catálogo y su inventario por pantalla | Hecha: `iconos/`. 92 en uso y 13 reservados. «Cambio relativo» y «alimento», elegidos por Dirección el 2026-10-10 |
| Cada ícono suelto en SVG y en PNG (dos temas, cinco tamaños), y como datos para programar | Hecho: `iconos/svg/`, `iconos/png/`, `iconos/png-grande/` e `iconos/para-programar/` |
| Unificar los 20 íconos propios de la APK con la familia | Falta: es otro paquete y pide una APK nueva |
| El Espacio profesional (pendientes y asesorados) | Hecho: pantalla 13 |
| Estados: cargando, falla de una parte, sin datos, vista parcial, sin conexión, BE no disponible, sin acceso, conflicto, sin coincidencias | Hechos: pantallas 14, 15 y 19 |
| El plan de Nutrición, en lectura y en edición, la confirmación de activar y el buscador de alimentos | Hecho: pantallas 16, 17, 18 y 21 |
| Los registros de Nutrición | Hecho: pantalla 20 |
| Versiones anteriores | `maquetas/` (seis pantallas), `maquetas-v2/` (nueve) y `maquetas-v3/` (diez), para comparar |
| Antropometría: las tomas, la carga de una toma sobre la figura y una medición con su historia | Hecho: pantallas 22, 23 y 29 |
| Entrenamiento: el plan activo, los registros y el editor del plan | Hecho: pantallas 24, 25 y 28 |
| Información: las solicitudes y el pedido | Hecho: pantallas 26 y 27 |
| Antropometría: Evolución y Lámina, los formularios de corregir y de anular, y «Calcular con un método» | Faltan |
| Entrenamiento: el Resumen (objetivo y evaluaciones), las Revisiones y el buscador de ejercicios | Faltan |
| Nutrición: el Resumen (donde se define el objetivo) y sus revisiones registradas | Faltan |
| Plantillas y habituales, Mis recetas, Mis ejercicios y Cuenta | Faltan |
| «Crear manualmente» e «Importar» un alimento; el formulario de «Agregar estimación» | Faltan |
| Sesión vencida | Falta: es la pantalla de «Iniciar sesión», con su aviso |
| Anchos de 1280 y 1024 px | Sin dibujar: están las reglas de cada pantalla al final de la sección 3; se comprueban en la implementación |
| Validación de Dirección | Pendiente |
| Implementación y actualización de la guía de UX | Después de la validación |
