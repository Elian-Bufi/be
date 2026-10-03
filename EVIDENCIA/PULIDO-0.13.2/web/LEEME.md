# Evidencia · Pulido del website: antropometría del profesional (2026-10-03)

**Qué es.** Las mismas capturas antes y después del cambio, en la rama `web/pulido-antropometria`, que **no está
integrada**: va con la candidata 0.13.2.

**Condiciones.**
- Website local en modo desarrollo y API local, con PostgreSQL 16 embebido.
- Datos sintéticos: un profesional y un asesorado con tres tomas completas, de hace 70, 40 y 6 días. La de hace 40 días
  se registró última, como la del 24/9 en la prueba de Dirección.
- Herramienta: puppeteer con Chrome, en 360 × 740, 390 × 844 y 1440 × 900, y en los dos temas: 30 capturas por corrida.
- Las mediciones de cada captura (desborde horizontal, alto, dónde empieza lo principal, orden de las tomas, foco y
  barra) están en `registro-antes.json` y `registro-despues.json`.
- Entre las dos corridas se recreó la base sintética. El identificador seudónimo del asesorado cambia (3EB440 y
  B49111); los valores, no.

**Lo que no es.**
- **El teclado del teléfono no existe en Chrome de escritorio.** «Con teclado» se emula achicando 330 px el alto de la
  ventana, que es lo que hace `interactive-widget=resizes-content`. Hay que mirarlo en el teléfono.
- **No se probó el website en una computadora a mano**, ni con un lector de pantalla.

## Lo que cambió, medido

| Punto | Antes | Después |
|---|---|---|
| Orden de las tomas (los tres anchos, los dos temas) | 24 ago · 27 sept · 25 jul; abre la del 24 ago | 27 sept · 24 ago · 25 jul; abre la del 27 sept |
| Dónde empieza la imagen de la lámina, 360 px | 1125 px (la pantalla mide 740) | 605 px |
| Ídem, 390 px | 1098 px (la pantalla mide 844) | 578 px |
| Ídem, 1440 px | 666 px, debajo de los controles | 309 px, a la derecha de los controles |
| Preparación con el teclado emulado, 360 y 390 px: ¿la barra de «Guardar» tapa el campo enfocado? | Sí | No |
| ¿«Guardar» queda a la vista con el teclado emulado? | Sí (en el teléfono no: la barra quedaba detrás del teclado, captura 13 de Dirección) | Sí |
| Desborde horizontal, en todas las capturas | No | No |
| Imagen exportada: franja vacía entre el encabezado y la cabeza, en el lienzo de 1920 px | ~220 px | ~100 px |

**Por qué cambió el orden.** DL-113 nombra cada toma por cuándo se tomó. La API pagina por fecha de registro, y la
pantalla mostraba ese orden y abría la primera. Una toma cargada después, aunque fuera más vieja, quedaba primera y se
abría ella. Ahora la lista se ordena por fecha de ocurrencia, la más reciente primero, y abre esa. La API no cambia.

**La imagen exportada.** Conserva todos los datos y las unidades. En Medición con el cuerpo entero, la figura arranca
en 290 y mide 1390; antes, 408 y 1270, los valores del compositor v13.3. Los pies quedan donde estaban, y las tarjetas
suben con sus sitios. La prueba de la composición (`lamina.test.ts`) cambia la posición esperada de las tarjetas, con
la anterior anotada. Las pruebas de DL-113 siguen pasando sin cambios: las filas siguen a sus sitios y ninguna guía se
cruza ni pasa sobre otro punto. **La letra de la imagen no se agrandó**: se sigue viendo chica en un teléfono (ver la
guía de UX, §12).

| Archivo | Qué muestra |
|---|---|
| `01-*-a-tomas-390-azul-noche.jpg` | La lista de tomas en el teléfono: el orden y la toma abierta |
| `02-*-b-lamina-390-claro.jpg` | La lámina en el teléfono: antes, los controles; después, la toma, la hoja y la imagen en la primera pantalla |
| `03-*-c-preparacion-390-azul-noche-teclado-emulado.jpg` | La preparación con el teclado emulado: antes, la barra tapa el campo; después, el campo queda arriba |
| `04-*-b-lamina-1440-azul-noche.jpg` | La lámina en la computadora: después, en dos columnas, con la imagen a la vista |
| `05-*-a-tomas-1440-claro.jpg` | Las tomas en la computadora: después, la lista a la izquierda y la toma abierta a la derecha |
| `06-*-exportada.jpg` | La imagen exportada, reducida de 2160 × 3840 a 540 × 960 |

## Sobre la candidata combinada (2026-10-03, `fca7597`)

**Qué es.** El website de la candidata 0.13.2, que combina #133 a #139. No está integrada. Se verificó lo que la tanda
pedía revisar sobre la combinación real:
- el orden de las tomas y la que abre;
- el acceso temprano a la lámina en el teléfono y las columnas en la computadora;
- el teclado, el foco y la barra de guardado frente a los mensajes de validación;
- la exportación;
- una muestra del sistema visual con letra normal y grande.

**Condiciones.**
- API construida desde la candidata y website en modo desarrollo, los dos locales, con PostgreSQL 16 embebido (base
  sintética `be_ux_tanda3`).
- Los mismos datos sintéticos: tres tomas, de hace 70, 40 y 6 días, y la de hace 40 días registrada última. En cada
  toma están calculados todos los métodos `be/`, así que la evolución tiene índices.
- Puppeteer con Chrome sin interfaz, en 360 × 740, 390 × 844 y 1440 × 900, en los dos temas, con letra normal y con
  letra grande: 83 capturas por corrida.
- La letra grande se emula llevando la raíz al 150 %. Agranda todo lo medido en rem, pero no mueve los cortes de
  `@media`, que usan el tamaño inicial del navegador.
- Las mediciones de la última corrida están en `candidata/registro-candidata.json`. Las herramientas están en
  `candidata/herramientas/`: la clave de la cuenta sintética se pasa por el entorno.

**Lo que no es.**
- El teclado del teléfono es una emulación: la ventana pierde 330 px de alto. Hay que mirarlo en el teléfono.
- No es el sitio publicado.
- El círculo «N» de las capturas es el indicador de Next en modo desarrollo.
- No se probó con un lector de pantalla.

### Resultado de la última corrida

| Punto | Resultado |
|---|---|
| Orden de las tomas, en las 12 combinaciones | 27 sept · 24 ago · 25 jul; abre la del 27 sept |
| Dónde empieza la imagen de la lámina, letra normal | 605 px en 360 (pantalla de 740), 578 px en 390 (de 844), 309 px en 1440 |
| Ídem, letra grande | 974 px en 360 y en 390: no entra en la primera pantalla. 503 px en 1440 |
| Preparación con el teclado emulado: el campo enfocado se ve, la barra no lo tapa y «Guardar» queda a la vista | 12 de 12 |
| Desborde horizontal | ninguno, en las 83 capturas |
| Un valor ilegible y «Guardar» (390 px, teclado emulado, letra normal y grande) | El aviso toma el foco, dice qué corregir y nombra el campo con un enlace. El enlace deja a la vista el campo y su error. Un segundo «Guardar» vuelve a llevar el foco al aviso |
| «Ver en tamaño real» (390 px) | La lámina a 1080 px en un visor que se desplaza. `aria-pressed` pasa de `false` a `true`, y «Ver entera» la devuelve |
| El eje de un índice en la evolución | Índice cintura/cadera de 0,85 a 0,87: el eje va de 0,8 a 0,92, con rótulos de dos decimales. Con la regla anterior iba de −1 a 2 |
| Imagen exportada | 2160 × 3840 px, PNG de 4,2 MB, con todos los datos y sus unidades |

### Defectos que encontró esta verificación, ya corregidos en `web/pulido-antropometria`

1. **Con la letra grande, la página se desplazaba de costado** en 360 y 390 px, en las tomas y en la preparación.
   - Había grillas con columnas mínimas en rem (15rem son 360 px con la letra al 150 %).
   - Los fieldset no se achicaban.
   - La preparación no tenía columnas declaradas.
2. **Con la letra grande, el nombre de cada medición quedaba con una palabra por línea** y se metía bajo la caja.
   Ahora el nombre, el campo y el estado van uno debajo del otro.
3. **El aviso de validación no decía qué campo corregir**, y su texto («Hay una medición sin completar») no
   correspondía a un número ilegible. Ahora lista cada campo con su problema y un enlace.
4. **Un segundo «Guardar» con algo para corregir no movía el foco**: el aviso ya estaba a la vista y solo se enfocaba
   al aparecer.
5. **El enlace del aviso dejaba el error bajo la barra fija** con la letra grande. Ahora centra el campo con su nombre
   y su error.

| Archivo de `candidata/` | Qué muestra |
|---|---|
| `candidata-01-tomas.jpg` | Las tomas en las 12 combinaciones |
| `candidata-02-lamina.jpg` | La lámina en las 12 combinaciones |
| `candidata-03-preparacion.jpg` | La preparación con el último campo enfocado, con el teclado emulado en el teléfono |
| `candidata-04-validacion.jpg` | El recorrido de un valor ilegible, con letra normal y grande |
| `candidata-05-visor-e-indice.jpg` | El visor «Ver en tamaño real» y el eje del índice cintura/cadera |
| `candidata-06-exportada-a-la-mitad.jpg` | La imagen exportada, reducida a 1080 × 1920 |
