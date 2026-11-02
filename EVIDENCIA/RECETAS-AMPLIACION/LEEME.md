# Recetas de ejemplo · la ampliación a 66 y sus fotos

Encargo nocturno de Dirección del 2026-10-28 («50 recetas nuevas, fotografías y cierre técnico»), §6 a §12. Commit de
referencia del código y del catálogo: `main` en `e4512cb`.

## En una línea

**66 recetas** (las 16 originales y 50 nuevas), con su recetario, su vista combinada y su carga probada en una base
efímera. **0 de 66 con foto:** esta sesión no tenía con qué generarlas (**BLOQUEADO_POR_HERRAMIENTA**). Las fotos se
generan afuera con el paquete de esta carpeta.

## Qué abrir

| Para | Abrir |
|---|---|
| Leer las 50 nuevas, una por página, y ver las 66 juntas | `salida/BE-recetario-ampliacion.pdf` (53 páginas) o `RECETARIO.md` |
| Ver qué foto tiene cada receta (hoy, ninguna) | `salida/BE-recetas-hoja-de-contacto.pdf` (11 páginas, seis por página) |
| Revisarlas en el teléfono, con búsqueda y filtros | La galería privada: <https://claude.ai/artifact/QajQNjTs1oT5asD1RbbAq7> |
| Generar las fotos | `PAQUETE-DE-GENERACION.md` (y lo mismo, como datos, en `paquete-de-generacion.json`) |
| Los datos de las recetas y su carga | `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/LEEME.md` |

## Qué hay en esta carpeta

| Archivo | Qué es |
|---|---|
| `RECETARIO.md` | Las 50 nuevas, legibles: ingredientes por parte, pasos, equipo, tiempos y composición por porción y total; y la vista de las 66. **Generado: no se edita a mano** |
| `PAQUETE-DE-GENERACION.md` y `paquete-de-generacion.json` | Para la sesión de ChatGPT de Dirección: el paso a paso, el primer lote para ajustar el estilo y, por receta, el nombre de salida, la presentación, lo que no debe aparecer y el prompt. Generados |
| `salida/` | Los dos PDF |
| `pdf/recetario.typ` y `pdf/contacto.typ` | Sus fuentes en Typst |
| `datos/recetario.json` y `datos/contacto.json` | Lo que leen los PDF. Generados |
| `herramientas/armar-entrega.mjs` | Arma el recetario, el paquete de generación y los datos de los PDF desde los manifiestos, la vista combinada, el inventario del material visual y el registro de fotos. Con `--verificar` no escribe |
| `herramientas/pdf.mjs` | Compila los dos PDF en una carpeta de trabajo con las miniaturas de las fotos registradas |
| `herramientas/fotos.mjs` | De los originales de la herramienta de generación a las entregas que se suben a BE, con todo registrado (abajo) |
| `fotos.json` | **El registro de las fotos.** Hoy no existe, porque no hay ninguna. Lo escribe `fotos.mjs registrar` |

## Las fotos, cuando las haya

`fotos.mjs` no genera imágenes, las recibe:

1. **`preparar --originales <carpeta> --entrega <carpeta> [--vistas <carpeta>] [--herramienta <texto>]`.**
   - **El original no se toca.** Se registra con su tamaño nativo, su formato y su SHA-256.
   - **La entrega** es un JPEG de 1600 × 1200 con el nombre que espera cada herramienta de carga: `01-…jpg` para las
     originales y `R017-…jpg` para las nuevas. Si hacía falta, se recorta al centro a 4:3 y se reescala. **Cada
     transformación queda escrita, y un agrandado se dice como tal:** el detalle no es nativo. El criterio de las
     herramientas de carga (`FOTO_ESPERADA`: de 1,25 a 1,40 y desde 1600 px) no se relajó.
   - **Las hojas de revisión** salen en los dos temas, Claro y Azul noche: el original, la entrega, el detalle 4:3 del
     website, la tarjeta 4:3, el recorte 16:10 de la APK y una miniatura.
   - **Los duplicados exactos** (mismo SHA-256) y **las fotos parecidas** (huella perceptual) se informan. Una diferencia
     de hash no garantiza dos imágenes distintas.
   - El registro queda en `<entrega>/fotos.json`. Por foto guarda:
     - el código y la huella de la formulación;
     - el original y la entrega, con archivo, ruta, tipo, medidas, peso, SHA-256 y huella perceptual;
     - las transformaciones;
     - la herramienta y el prompt;
     - la revisión.
2. **Revisar las hojas** y anotar la revisión visual en el registro.
3. **`registrar --entrega <carpeta>`** vuelve a medir y copia el registro a `fotos.json`, en esta carpeta. Es lo único que
   escribe en el repositorio.
4. Después, `node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs` y `node herramientas/armar-entrega.mjs` ponen las
   fotos en el inventario, la galería, el recetario y los PDF.

**Los tres estados de una foto, por separado:**
- **verificada técnicamente:** medidas, formato y peso. La da `fotos.mjs`;
- **revisada visualmente por el agente:** es la de su receta, sin ingredientes de más, con una cocción y una escala
  plausibles, en los recortes de BE. Se anota a mano;
- **aprobada por Dirección:** se anota a mano.

La herramienta nunca da por hechos los dos últimos.

**Dónde viven las imágenes:** fuera del repositorio, como el resto del material visual. En la máquina donde se preparó,
la carpeta persistente es `C:\Users\bufim\BE-material-visual\`. El registro dice la ruta y el SHA-256 de cada archivo.
Si una carpeta se mueve, se vuelve a correr `preparar` desde los originales: da los mismos bytes de entrega.

## Abrirlo desde otra ubicación

- **Los PDF y los Markdown** se abren solos.
- **La galería** es una carpeta con `galeria.html` e `img/`, con rutas relativas. Se arma con
  `node EVIDENCIA/MATERIAL-VISUAL/galeria/armar-galeria.mjs <salida> <carpeta del material>` y se abre desde cualquier
  lugar. Sin conexión, usa las tipografías del sistema.
- **Las herramientas** reciben las carpetas como argumentos: ninguna supone una ruta de esta máquina.
- **Para mover la carpeta entera**, se copia `EVIDENCIA/RECETAS-AMPLIACION` con la carpeta de la galería.

## Cómo regenerar todo

Desde la raíz del repositorio, con Node 22 (y Typst 0.15.1 para los PDF):

```bash
node EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/armar.mjs   # manifiesto y vista de las 66
node EVIDENCIA/MATERIAL-VISUAL/herramientas/generar.mjs                                          # inventario y fichas
node EVIDENCIA/MATERIAL-VISUAL/herramientas/verificar.mjs                                        # 0 sin problemas
node EVIDENCIA/RECETAS-AMPLIACION/herramientas/armar-entrega.mjs                                 # recetario, paquete y datos
TYPST=<typst> node EVIDENCIA/RECETAS-AMPLIACION/herramientas/pdf.mjs                             # los dos PDF
node EVIDENCIA/MATERIAL-VISUAL/galeria/armar-galeria.mjs <salida> <carpeta del material>         # la galería
```

## Lo que hay que saber de la composición

- Es **una estimación del catálogo**, no una medición ni una prescripción:
  - el cálculo de BE da lo mismo (prueba de contenido y prueba de integración);
  - ninguna receta se cocinó ni se pesó;
  - ninguna está validada por una persona.
- **Control de plausibilidad 4/4/9:** la energía de cada receta se comparó con 4 kcal por gramo de proteína, 4 por gramo
  de carbohidrato y 9 por gramo de grasa. Se aparta como mucho un 6 % (R046, la de más fibra) y la mediana es -1 %. Es un
  control, no una igualdad: la energía de USDA no se calcula así para todos los alimentos.
- **Por porción**, los platos principales van de 397 a 691 kcal. Cinco tienen menos de 20 g de proteína y lo dicen:
  - R023, empanadas de humita;
  - R027, fainá con ensalada;
  - R050, tortilla al horno;
  - R053, guiso de porotos y arroz;
  - R056, arroz cremoso.

  Los desayunos, meriendas y dulces van de 188 a 407 kcal.
