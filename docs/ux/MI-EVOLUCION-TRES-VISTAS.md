# Mi evolución en tres vistas: cierre de antropometría (DL-118)

> Decisión de Dirección del 2026-10-05 (documento «BE — Cierre de antropometría y siguiente tramo de producto», versión
> 2), sobre la APK 0.14.0-candidata.1 probada en el teléfono. Es el último cierre acotado de antropometría en la
> experiencia del asesorado. No cambia contratos, permisos ni la vista profesional, y no elimina información ni métodos.
> Las agrupaciones, tamaños y textos de este documento son decisiones de diseño reversibles, tomadas con el documento
> de Dirección, sus referencias (las cuatro láminas blancas del compositor, modo Serie) y los patrones que ya tiene BE.

## 1. Delta frente a lo implementado

Implementado: `2e53ac8`, la candidata de #146, construida como APK 0.14.0-candidata.1.

| Hoy (`2e53ac8`) | Después del cierre |
|---|---|
| Cuatro vistas: Mapa corporal, Indicadores, Comparar y Evolución | Tres: **Mapa corporal, Progreso e Indicadores**. Comparar se retira como apartado: su lectura, cada medida frente a la anterior comparable, queda en cada tarjeta de Progreso. Evolución se absorbe en el detalle de una medida, en Progreso y en Indicadores |
| Mapa: valor, diferencia y gráfico chico por fila | Mapa: el nombre y el valor con su unidad. La diferencia y el progreso aparecen al tocar |
| Un selector con todas las tomas del período | Cada vista lista las tomas que tienen datos para ella. El mapa y Progreso, las que tienen perímetros o pliegues; Indicadores, las que tienen indicadores. La numeración T1, T2… es la del período en todas |
| Si la última toma no tiene sitios, el mapa avisa y ofrece ir a los indicadores | Se abre Indicadores con esa toma. El mapa muestra la última toma con sitios, con su fecha y sin presentarla como actual |
| Sin ninguna toma con sitios, el mapa queda vacío | No se muestran el mapa ni Progreso: se abre Indicadores |
| Gráficos chicos por orden de toma, a la misma distancia | Progreso e Indicadores: puntos sobre las fechas reales, con la escala visible y sin unirlos |
| Evolución: medida, días, protocolo y método antes del gráfico | El gráfico va primero, con el grupo comparable de la toma elegida. La procedencia, el otro grupo y la lista van en el detalle |
| Indicadores: todo junto, con la Edad como gráfico y diferencia «0 años» | Cuatro bloques: mediciones; resultados, marcados como estimación; Edad, como dato de la toma; y «Más datos de esta toma», con los diámetros, plegado |
| El detalle muestra la lista T1…Tn y varios «no comparable» | Un resumen corto. La lista técnica va en «Detalle técnico», plegado |
| Las cifras se ven por detrás de la barra flotante y del área del sistema | Un velo, del color del fondo, detrás de la barra |
| El cuerpo blanco brilla más que los valores y el cian | La figura va atenuada en Azul noche, y los sitios conservan su contraste |

## 2. Progreso por zonas: Torso y Piernas

Responde «¿qué cambió en esta parte del cuerpo?». Son dos elecciones claras, sin nuevas pestañas del módulo:
- la familia, Perímetros o Pliegues;
- la zona, Torso o Piernas.

Solo aparecen las familias y las zonas con datos en el período. Son agrupaciones de interfaz: no son las 17 zonas
musculares de entrenamiento.

**La figura de cada zona** es la del compositor para ese tren (`FIGURAS_DE_LA_LAMINA[sexo].TREN_SUPERIOR` y
`TREN_INFERIOR`), con sus sitios calibrados por Dirección. No se genera un cuerpo nuevo ni se mueve ningún punto. Cada
sitio lleva un número, y su tarjeta, el mismo, como en la figura con números de la letra grande.

**Cada sitio tiene un solo lugar**, por su clave de BE. Las láminas de referencia repiten abdomen y cadera en los dos
trenes; la app no los duplica.

| Familia | Torso | Piernas |
|---|---|---|
| Perímetros | cuello, hombros, pecho, brazo relajado, brazo contraído, antebrazo, muñeca, cintura, abdomen bajo | cadera, muslo, pantorrilla, tobillo |
| Pliegues | pectoral, axilar media, tríceps, bíceps, antebrazo, subescapular, cresta ilíaca, supraespinal, abdominal | muslo anterior, pantorrilla |

**El torso en dos paneles.** Se divide si tiene más de cinco sitios con datos en el período de esa familia. La
división sigue las dos columnas de las láminas de referencia, y la asignación es fija por clave: no cambia al pasar de
una toma a otra.

| Familia | Panel 1 | Panel 2 |
|---|---|---|
| Perímetros | Hombros y brazos: hombros, brazo relajado, brazo contraído, antebrazo, muñeca | Cuello y tronco: cuello, pecho, cintura, abdomen bajo |
| Pliegues | Pecho y brazo: pectoral, axilar media, tríceps, bíceps, antebrazo | Espalda y abdomen: subescapular, cresta ilíaca, supraespinal, abdominal |

Los paneles reparten una sola evaluación: no crean tomas ni registros. Pasar de un panel a otro conserva la toma, la
fecha, la familia y la medida elegida.

**Cada tarjeta** lleva:
- el número y el nombre del sitio;
- el valor de la toma elegida, con su unidad, o «Sin dato en esta toma»;
- el cambio respecto de la anterior comparable, con su fecha. Sin anterior comparable, la tarjeta dice por qué;
- los puntos de la medida sobre las fechas reales del período, solo los del grupo comparable de la toma elegida. Los
  puntos no se unen. La toma elegida va resaltada y la escala se ve.

Al tocarla se abre el detalle: un gráfico más grande, la observación elegida con su fecha y su valor, «Anterior» y
«Siguiente», la procedencia, el otro grupo si lo hay y la lista equivalente.

**Las tarjetas van en una columna ancha**, debajo de la figura. Con letra grande crecen hacia abajo: no se achican el
texto, los gráficos ni los controles.

## 3. Reglas cuando faltan medidas

| Situación | Comportamiento |
|---|---|
| Toma sin perímetros ni pliegues | No aparece en el selector del mapa ni en el de Progreso; sigue en Indicadores |
| La última toma solo tiene indicadores | Se entra a Indicadores con esa toma. El mapa sigue disponible con la última toma que tiene sitios, con su fecha |
| Ninguna toma con sitios en el período | No se muestran el mapa ni Progreso; se abre Indicadores |
| Toma con una sola familia | Se muestra esa familia, sin el control de la otra |
| Zona o panel sin medidas | No aparece |
| Ninguna medición en el período | El aviso breve de siempre, sin figura ni tarjetas |
| La lectura falló o falta el A3 | El error o el aviso de permiso que ya había, que no se confunden con «sin mediciones» |
| Mediciones viejas fuera de los 90 días | Sigue la búsqueda hacia atrás de `leerMiEvolucion` |

Si la vista no puede mostrar la toma elegida, muestra la más cercana anterior que tiene datos para ella y lo dice con
las dos fechas. La vista inicial se resuelve una sola vez, con los datos: no salta después.

## 4. Indicadores

Responde «¿qué datos y resultados tengo disponibles?». Tiene cuatro bloques:
- **Mediciones:** peso y talla.
- **Resultados:** los de las fórmulas, en el orden del catálogo, con IMC y los índices primero. Cada uno se marca como
  estimación, y su nombre dice el método.
- **Datos de la toma:** la edad al momento de la toma. No lleva gráfico ni diferencia.
- **Más datos de esta toma:** los diámetros y lo que BE no clasifica, plegado.

**Cada tarjeta** muestra el valor con su unidad, el cambio respecto de la anterior comparable con su fecha y, si hay dos
observaciones comparables o más, sus puntos sobre fechas reales. Con una sola, solo el valor.

**El detalle**, al tocar, empieza con el resumen. Después vienen el gráfico y la procedencia; la lista por toma y las
explicaciones quedan en «Detalle técnico», plegado.

No se agregan fórmulas, umbrales, diagnósticos ni totales. No se ocultan resultados ni se elige un método «mejor».

## 5. Rutas y selección

- «Ver la toma» (Inicio) abre la última toma: el mapa si tiene sitios y, si no, Indicadores.
- La ruta vieja a Comparar abre Progreso.
- «Ver su evolución» (Inicio y rutas viejas) abre la medida:
  - un sitio de la figura abre Progreso, con su familia, su zona y su panel;
  - cualquier otra medida abre Indicadores con su detalle.
- En el mapa, el detalle de un sitio ofrece «Ver su progreso».
- La toma, la medida y la zona elegidas se recuerdan mientras dura la sesión. Al ir y volver entre vistas, se conservan.

## 6. Lo que se conserva

- Los puntos anatómicos y el encuadre del mapa (DL-113, pulido del 2026-10-04).
- El escalado de letra, el contraste AA y los dos temas.
- La figura con números desde letra ×1,3.
- El aviso de una toma que puede estar incompleta (D-3).
- Los huecos, las correcciones y los grupos comparables.
- La lista equivalente de cada gráfico, para el lector de pantalla.
- Los contratos, los métodos y la vista profesional. El website sigue teniendo su comparación y su lámina.

## 7. Implementación (2026-10-05)

Implementado en `3c6ac7c`, rama `apk/navegacion` (PR #146, en borrador). Sigue este documento, con dos diferencias,
las dos reversibles:
- **La lista del detalle** se llama «La evolución, en lista», el nombre que ya tenía la lista equivalente
  (`GUIA-UX-UI.md` §7), y no «Detalle técnico». Va plegada al final del detalle, con los huecos.
- **El recorte a 30, 60 o 90 días** de la vista Evolución se retiró con ella. No traía más datos: recortaba en el
  teléfono el período que ya había llegado. El detalle muestra el período entero, el mismo de los gráficos chicos, y
  así la tarjeta y su detalle dicen lo mismo.

Las capturas, las pruebas y lo que falta probar en el teléfono están en `EVIDENCIA/MI-EVOLUCION-TRES-VISTAS/LEEME.md`.

## 8. Ajuste después de revisar el cierre (Dirección, 2026-10-05)

Dirección revisó las capturas y pidió una última corrección acotada. Acepta las dos diferencias del §7, «La evolución,
en lista» y el detalle con el período completo, y los controles en dos filas cuando el ancho o la letra lo piden.

| Hoy (`7bcf5dc`) | Después del ajuste |
|---|---|
| Progreso: la figura de la zona mide hasta 400 dp de alto, con el cuerpo entero del tren | La figura muestra la franja del cuerpo donde están los sitios de la zona. Mide hasta un 30 % del alto de la pantalla, entre 200 y 280 dp. Donde la franja corta el cuerpo, se desvanece en el fondo de la lámina |
| Entre la figura y la primera tarjeta, el título «Perímetros · Torso: …» | Las tarjetas siguen a la figura. La familia, la zona y la parte del torso se leen en los controles elegidos |
| La cabecera dice «Última toma · se compara con el 25 jul 2026» | Dice «Última toma» o «Toma T2», con la fecha. Cada tarjeta sigue diciendo con qué fecha se compara, porque cada medida puede tener otra anterior comparable |

**Por qué la figura no va al costado de las tarjetas.** En 360 a 412 dp, la figura al costado dejaba las tarjetas en
unos 200 dp: el nombre, el cambio y los puntos se partían o se achicaban. Una franja más baja encima de las tarjetas
deja ver la figura y la primera tarjeta juntas, con la letra de siempre.

**Lo que no cambia:**
- Torso y Piernas, los dos paneles del torso cuando corresponden, y el mismo número en la figura y en la tarjeta.
- La letra, los números y las zonas de toque. La figura se achica recortando cuerpo, no texto.
- Los sitios. La franja usa la misma transformación de la lámina, recortada: ningún punto se mueve.
- El cuerpo al cambiar de panel. La franja sale de todos los sitios con datos de la zona, así que pasar de un panel al
  otro no lo mueve.
- La letra grande, apilada. Los controles bajan de fila, los números crecen hasta su tope y la figura crece lo que
  ellos necesiten. Las tarjetas van a todo el ancho, debajo.

## 9. Los gráficos de las tarjetas, con la forma del ejemplo de Dirección (2026-10-05)

Dirección mandó una tarjeta como ejemplo («Muslo, 56 cm, ↑ +3 cm») y pidió acercar los gráficos a ella. Lo que la
distingue, y lo que se tomó:

| Del ejemplo | En BE |
|---|---|
| El nombre arriba; el valor grande, con la unidad chica | Igual, con el número del sitio delante del nombre |
| El cambio con su flecha, a la derecha del valor | Igual, con su fecha debajo («respecto del 25 jul»). La flecha va del mismo color hacia arriba y hacia abajo: dice para dónde, no si es bueno o malo. En una tarjeta angosta o con letra grande, el cambio va debajo del valor |
| Tres líneas de referencia, con su valor | Igual: los extremos de la escala (`dominioDelEjeVertical`) y el medio, redondeado |
| Puntos huecos, con borde | Igual; el de la toma elegida, lleno y más grande |
| La toma bajo cada punto (T1 … T5) | Igual, con la numeración del selector. Si dos rótulos no entran, se escriben el de la elegida, el último y el primero |
| Los valores en fila, debajo del gráfico | Igual, en el orden de los puntos, con el de la toma elegida resaltado |

**La línea entre los puntos** (Dirección, 2026-10-05, después de ver el ejemplo implementado sin ella). Se toma
con la regla que ya usa la lámina del website (`tramosDeLaSerie`, INV-06-176/177). Une dos mediciones solo si:
- son de tomas seguidas del período;
- son del mismo grupo comparable.

Una toma sin la medida, un hueco de la API o una medición de otro protocolo, método o unidad la cortan. Así cumple con
el legajo:
- B10-07 pide que la visualización conserve el hueco;
- ADV-10-PRJ-05 falla si la línea inventa puntos entre sesiones;
- ADV-10-PRJ-08 falla si une tramos no comparables.

No hay áreas, rellenos ni líneas de tendencia. La decisión reemplaza la exclusión de las líneas de DL-118 y la regla «los
puntos no se unen» de la guía de UX, que era más estricta que el legajo.

**Lo que no se tomó:**
- **Las tomas a la misma distancia.** DL-118 decidió las fechas reales. La toma bajo cada punto da la identificación del
  ejemplo sin perder la escala del tiempo: dos tomas cercanas quedan cerca.
- **El fondo blanco.** Se conservan Azul noche y Claro (DL-118). En Claro, la tarjeta se parece al ejemplo.

**Lo que cuesta.** Cada tarjeta mide unos 90 dp más que en el cierre. La franja de la figura lo compensa al principio de
la pantalla. Para leer todos los cambios de un panel hay que desplazarse más o menos lo mismo que antes, pero cada
tarjeta se lee sin abrirla.
