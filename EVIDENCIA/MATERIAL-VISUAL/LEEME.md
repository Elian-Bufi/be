# Material visual de BE · recetas, alimentos y ejercicios

Encargos nocturnos de Dirección del 2026-10-27 (§2 a §4) y del 2026-10-28 (§11 y §12, que suma las 50 recetas nuevas).
Commit de referencia: `main` en `e4512cb`. Preparado el 2026-10-28.

## En una línea

**De 97 contenidos, 3 tienen imagen real y 94 tienen ficha y prompt, sin imagen.**
- Las 3 son las ilustraciones de ejercicios del paquete de Dirección del 2026-10-06, generadas por IA y pendientes de
  revisión humana.
- **Ninguna de las dos sesiones tenía una herramienta que genere imágenes**, y los encargos no autorizan contratar una.
  Por eso no hay ninguna imagen nueva: **0 de 66 recetas con foto**.
- Un prompt no es una imagen: el inventario lo distingue en cada contenido.

| | Contenidos | Con imagen real | Ficha y prompt |
|---|---|---|---|
| Recetas: 16 originales y 50 nuevas | 66 | 0 | 66 |
| Alimentos (del catálogo base) | 16 | 0 | 16 |
| Ejercicios | 15 | 3 | 12 |
| **Total** | **97** | **3** | **94** |

Las fotos de las 66 recetas se generan afuera, con el paquete de `EVIDENCIA/RECETAS-AMPLIACION/PAQUETE-DE-GENERACION.md`.
Se preparan y se registran con la herramienta de fotos de esa carpeta; el inventario las toma de su registro (`fotos.json`).
Los alimentos siguen siendo 16 distintos: ninguno repite un alimento en otro estado ni cuenta un segundo ángulo.

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `inventario.json` | Un registro por contenido. Lleva identificador, nombre, archivo estable, archivo real con dimensiones, peso y SHA-256 (si lo hay), dónde se muestra, formato, procedencia, prompt, herramienta, fuente, estado de revisión y observaciones |
| `RECETAS.md`, `ALIMENTOS.md` y `EJERCICIOS.md` | Las fichas, con su prompt. Las genera `herramientas/generar.mjs`: no se editan a mano |
| `encuadre-de-recetas.svg` | **Maqueta, no una foto.** Dibuja el encuadre 4:3 del website, la franja 16:10 de la APK y la zona segura del plato |
| `herramientas/seleccion.mjs` | La selección como datos: estilos, presentación de cada receta, los 16 alimentos y los 15 ejercicios, con sus identificadores |
| `herramientas/generar.mjs` | Arma las fichas y el inventario desde el manifiesto congelado, la selección, los prompts del paquete y los bytes de las imágenes reales |
| `herramientas/verificar.mjs` | El verificador. Comprueba que el inventario corresponde al manifiesto y a la selección, que no hay repetidos, que nada sin archivo se presenta como imagen, y que los archivos reales existen y miden lo dicho. Con `--fotos <carpeta>`, revisa las fotos de recetas con los mismos criterios que `recetas.mjs revisar` |
| `herramientas/imagenes/` | Lo que trabaja sobre los archivos: medir, aplanar como BE, medir el halo del contorno, componer las vistas de recortes, sondear wger y rasterizar un SVG. Usan `sharp` de un árbol con `node_modules` (se pasa como argumento) |
| `seleccion/BE-material-visual-seleccion.pdf` | **La selección en PDF, 6 páginas:** el resumen, las tres imágenes reales en grande con sus recortes, la maqueta (marcada como maqueta) y las 94 fichas sin imagen (las recetas, por familia). Los números salen del inventario. Fuente: `seleccion/seleccion.typ` |
| `galeria/` | **La galería para el teléfono:** `plantilla.html` y `armar-galeria.mjs`, que la arma desde el inventario: las 66 recetas con búsqueda, filtros por familia, origen y foto, y su ficha completa; los alimentos y los ejercicios. Es una página privada de claude.ai: <https://claude.ai/artifact/QajQNjTs1oT5asD1RbbAq7>, versión 2 del 2026-10-28 |

**Fuera del repositorio** (`C:\Users\bufim\BE-material-visual\`, persistente):
- `ejercicios/existentes/originales/`: copia de las tres PNG del paquete;
- `ejercicios/existentes/como-las-guarda-be/`: la versión que guardaría BE, JPEG sobre blanco;
- `ejercicios/existentes/miniaturas/`;
- `ejercicios/existentes/vistas/`: los recortes reales, en Claro y Azul noche;
- `ejercicios/externas/sondeo/`: los metadatos públicos de wger, no las imágenes;
- `encuadre-de-recetas.png`, la maqueta rasterizada.

## Cómo se ve cada imagen en BE (leído en el código)

| Tipo | Website | APK | Servidor |
|---|---|---|---|
| **Receta** | 4:3, recorte al centro (`object-fit: cover`), hasta 28rem; miniatura de 6,5rem (`apps/web/src/app/globals.css:2312-2327`) | **16:10** por omisión, recorte al centro (`apps/mobile/src/imagen-de-medio.tsx:52` y `:97`): la opción del día, el carrusel y la ficha de la opción | JPEG de calidad 82, hasta 1600 px en el lado mayor, sin agrandar; la transparencia se aplana sobre blanco (`apps/api/src/medios/procesamiento-de-imagen.ts:54-58`) |
| **Ejercicio** | 5:6, **entera** (`contain`), hasta 18rem; cuadrada en «Mis ejercicios» (`globals.css:2424-2429` y `:2497-2500`) | Entera sobre **blanco #FFFFFF en los dos temas**: 112 dp en la sesión enfocada, 64 dp en el plan, 1:1 en «Ver técnica» (`imagen-de-medio.tsx:13-15` y `:128-129`; `tema.ts:73` y `:125`) | Igual que la receta |
| **Alimento** | — | — | **No hay dónde mostrarla:** el catálogo nutricional no tiene campo de imagen (`prisma/schema.prisma:1218-1251`). Las imágenes de alimentos son material preparado: no se agregan campos, contratos ni pantallas |

- **Las proporciones del encargo coinciden con el código:** 4:3 en el website y 16:10 en la APK para recetas.
- **El criterio que ya existía para las fotos de recetas** (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs:160-171`, `FOTO_ESPERADA`): horizontal, de 1,25 a 1,40, al menos 1600 px en el lado mayor, hasta 10 MB, y el plato en la franja central de 16:10. Las fichas lo usan sin cambiarlo.
- **Solo un ejercicio propio de un profesional puede tener imagen:** lo exigen la base (`prisma/migrations/20261006100100_imagen_y_tiempos_de_entrenamiento/migration.sql:98-120`) y el servicio (`apps/api/src/entrenamiento/imagenes.service.ts:23` y `:85`). Los doce del catálogo sintético de WP-06 no tienen dónde mostrar la suya.
- **Transparencia o fondo:** el servidor aplana todo sobre blanco y la APK lo muestra sobre blanco, así que la transparencia no aporta nada. Las fichas nuevas piden **fondo blanco**.

## Las tres imágenes reales

Están en el repositorio desde el paquete de Dirección (`docs/fuente_entrenamiento/BE_Entrenamiento_Autonomo_2026-10-06/ejercicios/`).
Se generaron con IA («image_gen integrado») y no tienen licencia de terceros ni muestran una persona real. Su revisión
técnica es la del paquete: `PENDIENTE_REVISION_PROFESIONAL`.

| Ejercicio | Original | Como la guarda BE |
|---|---|---|
| Sentadilla goblet | PNG con transparencia, 1222 × 1287, 966 KB | JPEG 1222 × 1287, 102 KB |
| Peso muerto rumano con mancuernas | PNG con transparencia, 1145 × 1374, 750 KB | JPEG 1145 × 1374, 81 KB |
| Zancada estática | PNG con transparencia, 1145 × 1374, 875 KB | JPEG 1145 × 1374, 89 KB |

- **Revisión a ojo, no profesional,** del 2026-10-28: equipo y agarre correctos; dos brazos, dos manos y dos piernas;
  apoyos plausibles; cuerpo entero con margen. En las vistas de recortes, se reconocen a 112 dp y todavía se distinguen a
  64 dp, en los dos temas.
- **Un halo rojizo en el contorno:** son píxeles semitransparentes con tinte rojo. Sobre blanco, como las guarda y las
  muestra BE, queda en un 0,10 % a 0,13 % de la imagen, con un tinte máximo de 35 a 41 niveles. No se nota. Se notaría
  solo con transparencia sobre fondo oscuro, que BE no usa. Medido con `herramientas/imagenes/halo-sobre-blanco.mjs`.

## Imágenes externas: no se usaron

Se sondeó la API pública de wger, solo los metadatos. Se descartó para esta tanda, sin bajar ninguna imagen:
- Las 383 imágenes son **CC BY-SA** (88 en 3.0 y 295 en 4.0): obligan a atribuir y a compartir igual. 104 no tienen
  autor cargado.
- Son de otro estilo y romperían la serie.
- Para varios de los doce no está la variante exacta.

## Cómo regenerar y verificar

Desde la raíz del repositorio, con Node 22:

```bash
node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs     # fichas e inventario
node EVIDENCIA/MATERIAL-VISUAL/herramientas/verificar.mjs   # 0 sin problemas; 1 con problemas
node EVIDENCIA/MATERIAL-VISUAL/herramientas/verificar.mjs --fotos C:/Users/bufim/BE-datos-locales/fotos-recetas
```

Para las imágenes, con un árbol que tenga `node_modules/sharp` (por ejemplo, el que usan las herramientas de la prueba breve):

```bash
node EVIDENCIA/MATERIAL-VISUAL/herramientas/imagenes/procesar-ejercicios.mjs <carpeta del paquete> <salida> <árbol>
node EVIDENCIA/MATERIAL-VISUAL/herramientas/imagenes/halo-sobre-blanco.mjs <carpeta de PNG> <árbol>
node EVIDENCIA/MATERIAL-VISUAL/herramientas/imagenes/vistas-de-ejercicios.mjs <como-las-guarda-be> <salida> <árbol>
node EVIDENCIA/MATERIAL-VISUAL/herramientas/imagenes/probar-verificador.mjs <raíz del repositorio>   # el caso negativo
```

La selección en PDF y la galería, también desde la raíz:

```bash
typst compile --root . --font-path docs/guias/ENTENDER-BE/tipografias --ignore-system-fonts \
  EVIDENCIA/MATERIAL-VISUAL/seleccion/seleccion.typ EVIDENCIA/MATERIAL-VISUAL/seleccion/BE-material-visual-seleccion.pdf
node EVIDENCIA/MATERIAL-VISUAL/galeria/armar-galeria.mjs <salida> <carpeta del material>   # galeria.html e img/
```

La galería sale entera en `<salida>`, con rutas relativas: se abre desde cualquier lugar. La carpeta del material, en la
máquina donde se preparó, es `C:\Users\bufim\BE-material-visual`. Una copia armada el 2026-10-28 está en su subcarpeta
`galeria-2026-10-28`.

**Resultados:**
- **2026-10-27, con 47 contenidos:**
  - el verificador dio «SIN PROBLEMAS», con un aviso: la versión del pollo a la parrilla sale de la migración y no del
    manifiesto;
  - con el inventario dañado a propósito, falló con salida 1 y los dos problemas esperados;
  - con `--fotos`, 0 de 16 fotos, porque la carpeta no existía.
- **2026-10-28, con 97:** el verificador da «SIN PROBLEMAS», con el mismo aviso. Ahora también comprueba las 50 nuevas
  contra el manifiesto de la ampliación (código, nombre, archivo, ingredientes y prompt). El tope de 32 contenidos de
  Nutrición era del encargo del 27/10: el del 28/10 amplía las recetas a 66.

**Cuando haya imágenes:**
- **Las fotos de recetas** siguen el paquete de generación de `EVIDENCIA/RECETAS-AMPLIACION`:
  - se guardan con su código (`R017-…png`; también `R001-…` para las originales);
  - se preparan con `EVIDENCIA/RECETAS-AMPLIACION/herramientas/fotos.mjs preparar`, que hace la entrega de 1600 × 1200
    con el nombre que espera cada herramienta de carga, con las transformaciones escritas y las hojas de revisión;
  - se registran con `fotos.mjs registrar`;
  - `generar.mjs` las toma del registro.
- **Las de alimentos y ejercicios** van con su archivo estable (`A01-…`, `E04-…`) a la carpeta de `--imagenes`. En
  `herramientas/seleccion.mjs` se les agrega `archivoReal` con su ruta (del repositorio o absoluta) y se vuelve a correr
  `generar.mjs`, que la mide, guarda su SHA-256 y le pone el estado `ARCHIVO_REAL_PENDIENTE_DE_REVISION_HUMANA`.
- El inventario no se edita a mano.
- Nada se sube a test sin una autorización. La carga de las 16 originales es `recetas.mjs cargar` y la de las 50 nuevas,
  `ampliacion-2026-10-28/cargar.mjs cargar`. Las dos exigen `--confirmo-escritura`.

## Lo que necesita una decisión de Dirección

1. **Generar las imágenes.** Las 66 fotos de recetas, con el paquete de generación, en la sesión de ChatGPT de
   Dirección. Las de alimentos y ejercicios, con sus fichas. Las tres del paquete de ejercicios salieron de una
   herramienta de Dirección («image_gen integrado»).
2. **El tamaño de las fotos de recetas.** Si la herramienta entrega 1536 × 1024, `fotos.mjs` recorta a 4:3 y reescala a
   1600 × 1200, y lo dice: el detalle no es nativo. `FOTO_ESPERADA` no se relajó. Si no alcanza, hay que pedir otra
   salida.
3. **Los doce ejercicios del catálogo de WP-06 no pueden tener imagen hoy.** Solo los ejercicios propios pueden. Usarlas
   en la demo exige cargarlas como ejercicios propios, o un cambio de producto, que esta noche no se hace.
4. **Tres implementos inferidos,** porque el nombre no los dice: la «Sentadilla» con barra, el «Press con mancuernas» en
   banco plano y la «Extensión de tríceps» sobre la cabeza con una mancuerna.
5. **Los alimentos no tienen dónde mostrarse.** Si se quieren en el catálogo, es una decisión de producto futura. Además,
   el catálogo sintético de WP-04 («Arroz blanco», «Huevo») no dice el estado: definir si comparte imagen con su
   equivalente de USDA.
6. **Imágenes externas:** si alguna vez se quieren las de wger, implican aceptar CC BY-SA para lo que se derive.
