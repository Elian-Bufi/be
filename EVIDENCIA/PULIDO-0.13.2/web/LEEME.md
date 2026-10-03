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
