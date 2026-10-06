# Evidencia · Nutrición con recetas en la APK (WP-NUTRICION-RECETAS)

**Estas capturas no son de la APK.** Son renders de los componentes reales de la APK en el navegador, con
react-native-web y datos sintéticos. Cada imagen lo dice arriba, en rojo. Nada de esta parte se probó todavía en un
teléfono: lo que falta está en «Pendiente en Android», al final.

- **Paquete:** `docs/paquetes/WP-NUTRICION-RECETAS.md`, §7 (registro), §8 (compatibilidad), §9 (UX de la APK) y §10.4
  (pruebas de la APK).
- **Encargo:** `docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/BE_PROMPT_CLAUDE_NUTRICION_2026-10-05.md`, §3 a §5.
- **Referencias visuales aprobadas:** `docs/fuente_nutricion/BE_Nutricion_Demo_2026-10-05/referencias/`. Sus números
  eran ficticios: acá no se usan.
- **Rama:** `wp-nutricion-recetas`. La versión de la app no cambia (0.13.2, versionCode 22): este paquete no publica una
  APK.

## Qué hay en las capturas

- **Las opciones son las tres recetas del paquete de Dirección,** con sus nombres, sus ingredientes (los nombres de los
  alimentos USDA del paquete, cocidos o tal como se adquieren), sus pasos y sus fotos.
- **Los macros no se escribieron a mano.** El cliente sintético (`herramientas/render-navegador/shims/api.ts`) los calcula
  con `calcularNutrientes` del dominio (`SUM_SOURCE_PER_100G_V1`), con los valores cada 100 g del paquete, como lo hace la
  API. La franja muestra, con la coma del país, lo mismo que `display_nutrients` del paquete:

  | Receta | Calorías | Carbohidratos | Grasas | Proteínas | Fibra |
  |---|---|---|---|---|---|
  | Pollo con arroz y verduras | 529 kcal | 56,6 g | 13,2 g | 44,0 g | 5,4 g |
  | Salmón con papa y brócoli | 580 kcal | 51,5 g | 24,2 g | 39,6 g | 7,3 g |
  | Lentejas con arroz y verduras | 459 kcal | 75,1 g | 9,4 g | 21,3 g | 19,1 g |

  `scripts/registro-de-comidas.test.mjs` lo comprueba: calcula con el dominio y compara con el paquete.
- **Lo consumido del detalle de registro** (426 kcal, 56,6 g, 4,5 g, 37,8 g y 5,4 g de fibra) también lo calcula el
  dominio, con las cantidades informadas del ejemplo: 100 g de pollo, 160 g de arroz, 80 g de brócoli, 70 g de zanahoria
  y «No lo comí» en el aceite.
- **Cada respuesta sintética se valida con el esquema estricto de su contrato** en `@be/domain` (API-ING-01, 03 y 04;
  API-MED-01 y 03). Si no cumpliera, el render fallaría.
- **La «foto de la persona»** de «Comí algo diferente» y de la merienda registrada es la foto del salmón del paquete,
  generada por IA, usada como dato sintético. No hay fotos privadas reales.
- **Lo que hace la persona** (marcar la casilla, escribir, elegir una foto, tocar «Guardar almuerzo») se simula sobre la
  pantalla del navegador (`maqueta.tsx`, `acciones()`). La cámara y la galería son un reemplazo
  (`shims/expo-image-picker.js`) que devuelve esa foto.
- **La subida de la foto falla a propósito** (sin red) en la escena del error. **Ningún registro se completa en estas
  escenas:** «Almuerzo registrado» es la respuesta de «Hoy» con un registro sin confirmar.

## Las capturas

Cada una tiene una sola pantalla, al doble de píxeles. «Entera»: el teléfono crece hasta mostrar todo el contenido, con la
barra flotando al final. «Al final»: un teléfono común de 800 dp, desplazado hasta el último contenido.

| Archivo | Qué muestra |
|---|---|
| `01-hoy-carrusel-tres-opciones.png` | Azul noche, 360 dp, letra ×1. Nutrición con las pestañas Hoy · Plan · Registros, la fecha de la API, las comidas del plan en fichas (el desayuno, registrado, con su tilde) y el almuerzo con tres opciones: se ve una parte de la siguiente, «Opción 1 de 3», la flecha anterior deshabilitada, «Ver detalle», «Comí esta opción» y, debajo, «Comí algo diferente» |
| `02-hoy-carrusel-claro.png` | Lo mismo en Claro, 390 dp |
| `03-hoy-carrusel-letra-1-3.png` | 412 dp, letra ×1,3: las fichas y la franja, dos por dos |
| `04-hoy-carrusel-letra-2.png` | Claro, 360 dp, letra ×2: la franja en una columna, la etiqueta arriba y el valor abajo; nada se corta |
| `05-hoy-segunda-opcion.png` | La opción recordada es la segunda: el carrusel abre ahí, con las dos flechas habilitadas |
| `06-una-opcion.png` | La cena tiene una sola opción: la tarjeta ocupa todo el ancho, sin contador, flechas ni puntos |
| `07-una-opcion-claro-letra-1-3.png` | Una sola opción en Claro, 412 dp, letra ×1,3 |
| `08-opcion-sin-imagen.png` | Una opción sin imagen de referencia: el ícono y «Sin imagen de referencia». Es la última: la flecha siguiente, deshabilitada |
| `09-falla-de-la-descarga.png` | La imagen no se pudo descargar (también después de pedir un acceso nuevo): el ícono y «La imagen no se pudo mostrar.»; el nombre, los macros y «Comí esta opción» siguen |
| `10-falla-de-la-descarga-letra-2.png` | La falla de la descarga con letra ×2, 412 dp |
| `11-detalle.png` | El detalle: la imagen, el nombre, la estimación para las porciones del plan con la fibra, los ingredientes con su estado y su cantidad en lectura, la preparación y «¿Cuánto comiste?» con la casilla desmarcada |
| `12-detalle-casilla-al-final.png` | Al final: «Comí las porciones del plan» marcada, sobre la barra |
| `13-detalle-cantidades.png` | Claro, 390 dp, letra ×1,3: «Informar lo que comí de cada ingrediente» abierto, con el pollo y el arroz informados, el brócoli vacío (sin confirmar), la zanahoria y «No lo comí» en el aceite, con su campo apagado |
| `14-detalle-cero-al-final.png` | Un cero no se acepta: el error va en su campo («Si no lo comiste, marcá «No lo comí».») y en el resumen |
| `15-detalle-letra-2.png` | El detalle con letra ×2, en Claro |
| `16-registrado-sin-confirmar.png` | «Almuerzo registrado»: la opción con su imagen, «Opción 1 de 3», «Registrado», «Cantidades sin confirmar», «Completar cantidades», «Ver o corregir registro», «Deshacer registro» y «Seguir con mi día». No hay macros consumidos |
| `17-registrado-claro.png` | En Claro, 390 dp: la imagen al lado del texto, como en la referencia |
| `18-registrado-letra-1-3.png` | Con letra ×1,3: la imagen pasa arriba |
| `19-registrado-letra-2.png` | Con letra ×2: los botones de dos líneas, centrados |
| `20-registrado-algo-diferente.png` | «Merienda registrada»: algo diferente, con la foto de la persona, la descripción, la cantidad aproximada y «Macros sin calcular» |
| `21-diferente-vacia.png` | «Comí algo diferente», vacía: «Agregar foto» con «Cámara» y «Galería», «¿Qué comiste?», «Cantidad aproximada (opcional)», «Macros sin calcular», «Guardar almuerzo» y «Volver al plan» |
| `22-diferente-vacia-claro-letra-1-3.png` | En Claro, 412 dp, letra ×1,3 |
| `23-diferente-con-texto.png` | Con texto y cantidad aproximada |
| `24-diferente-con-foto.png` | Con una foto elegida: la vista previa, «Reemplazar foto» y «Quitar foto», antes de guardar |
| `25-diferente-con-foto-letra-2.png` | Con foto y letra ×2: cada botón en su línea |
| `26-diferente-error-de-subida.png` | La foto no subió: el texto y la foto quedan, el aviso lo dice, y se puede reintentar (con la misma clave) o guardar sin la foto |
| `27-diferente-falta-contenido.png` | Guardar vacía: «Agregá una foto o una descripción para guardar.», en el campo |
| `28-registros.png` | Registros (API-ING-04), por día: la hora, la comida, la opción o la descripción, el estado de las cantidades, y un registro deshecho, tachado y con «Deshecho» |
| `29-registro-detalle.png` | El detalle de un registro (API-ING-03), en Claro: lo informado por ingrediente («No lo comí» incluido) y la estimación de lo que comiste, con «Corregir cantidades» y «Deshacer registro» |
| `30-registro-detalle-letra-1-3.png` | El detalle de un registro con letra ×1,3, 412 dp |
| `31-hoy-al-final.png` | Hoy en un teléfono de 800 dp, desplazada hasta el final: la barra no tapa «Comí algo diferente» |
| `32-diferente-al-final-letra-2.png` | «Comí algo diferente» con letra ×2, hasta el final: «Volver al plan» queda sobre la barra |

Los tres anchos (360, 390 y 412 dp), los dos temas y las tres letras (×1, ×1,3 y ×2) están cubiertos, sin el producto
entero de combinaciones.

## Qué se verificó, y dónde

- **`scripts/registro-de-comidas.test.mjs`** (26 pruebas, sin teléfono), con los módulos puros de producción:
  - el carrusel: el asomo de la siguiente, los índices y los extremos, «Opción n de m», una sola opción sin controles, la
    posición recordada por la opción y que el carrusel no tiene temporizadores ni registra al deslizar;
  - la franja: el orden, las unidades y el redondeo del dominio sobre las tres recetas, «Sin dato» en lugar de cero, y
    las columnas (4, dos por dos o 1) con los anchos medidos en este render;
  - «¿Cuánto comiste?»: vacío no es cero, el cero y lo negativo no se aceptan, «No lo comí», la casilla y lo que vuelve
    a la pantalla al completar;
  - la comida diferente: al menos texto o foto, la foto inválida (tipo, tamaño y medidas), los estados del guardado y
    cuándo se pide otra ruta de subida;
  - el comando único: el doble toque sale una vez; un reintento después de una respuesta incierta sale con la misma
    clave y el mismo cuerpo, también desde el detalle; otro pedido sale con otra clave;
  - las comidas de hoy y sus fichas; las rutas nuevas; el plugin de la cámara; y los textos de las pantallas nuevas sin
    términos prohibidos de nutrición.
- **`scripts/historial-navegacion.test.mjs`:** las dos rutas nuevas en la lista de rutas, y los formularios nuevos
  declaran lo escrito sin guardar.
- **El control de cortes** (`herramientas/render-navegador/cortes.js`) en las 32 capturas: ningún texto cortado.
- **El typecheck de la APK**, sin errores.

## Límites del simulador

- **La letra** es Roboto web, y la escala es lineal: Android 14 agranda menos lo que ya es grande.
- **Los gestos:** el carrusel no se deslizó con un dedo. En el navegador se ubica por código en la opción recordada; el
  frenado en cada tarjeta (`snapToInterval`, `disableIntervalMomentum`) y el desplazamiento inicial (`contentOffset`) son
  de Android.
- **Las imágenes** salen de archivos locales con una ruta sintética: la URL firmada real, su vencimiento y su renovación
  se probaron solo con un archivo que no existe (falla, se pide otro acceso, vuelve a fallar y queda el respaldo).
- **La cámara y la galería** son un reemplazo: no hay permisos reales, ni `content://`, ni `fetch(uri).blob()` de Android,
  ni el cierre de la app con la cámara abierta.
- **Sin TalkBack, sin teclado y sin la sombra nativa.**

## Pendiente en Android

Con una APK que incluya esta parte (no se publica en este paquete):

1. **Deslizar el carrusel con el dedo:** se detiene en cada tarjeta, se ve la siguiente, el contador cambia y deslizar no
   registra.
2. **TalkBack:** «Opción anterior» y «Opción siguiente», deshabilitadas en los extremos; el contador se anuncia; solo la
   tarjeta a la vista se recorre; las fichas dicen «Almuerzo registrado» o «Merienda, sin registro».
3. **Ver detalle y volver:** la misma opción, la misma comida y la misma altura.
4. **Comí esta opción** con un doble toque, y con el modo avión y un reintento: un solo registro.
5. **El teclado decimal con coma** en las cantidades, sin tapar los campos.
6. **Cámara y galería:** el permiso se pide al tocar; cancelar no cambia nada; reemplazar y quitar; una foto grande;
   Android que cierra la app con la cámara abierta (opción de desarrollador «No conservar actividades»).
7. **La subida real contra la API local:** la foto aparece en el registro y la ve el profesional.
8. **La barra con gestos y con tres botones:** el último contenido de cada pantalla queda por encima.
9. **La letra máxima del sistema y los dos temas.**
10. **Deshacer registro:** el diálogo, y la comida vuelve a quedar libre para registrarla.

## Cómo se rehacen

En `EVIDENCIA/NUTRICION-RECETAS/herramientas/render-navegador`:

1. `npm install`, una vez (esbuild, React y react-native-web; los `node_modules` no van al repo).
2. `node construir.mjs`: copia las fotos del paquete a `salida/fotos` y arma `salida/maqueta.js` con los archivos reales
   de `apps/mobile/src`.
3. `bash capturar-nutricion.sh`: las 32 capturas, en esta carpeta. Para rehacer algunas: `bash capturar-nutricion.sh ""
   04,10`.

Hace falta Node 22 y Chrome en `C:/Program Files/Google/Chrome`. `salida/recorte.html` sirve para mirar por tramos una
captura muy alta.
