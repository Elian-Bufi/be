# Mapa del escritorio del profesional — estado actual (solo lectura)

Repo `C:\Users\bufim\BE-Best-entrenamiento`, rama `wp-dashboard-comprension`, HEAD `ab90860`, árbol limpio. No compilé ni ejecuté la aplicación: todo sale de leer archivos y buscar texto. Las líneas son de `wc -l`.

**Alias de rutas (todas absolutas):**
- `R` = `C:\Users\bufim\BE-Best-entrenamiento`
- `WEB` = `R\apps\web\src`
- `ADV` = `WEB\app\pro\advisees`
- `SEG` = `ADV\seguimiento`
- `CSS` = `WEB\app\globals.css`
- `DOM` = `R\packages\domain\src`

**Cuatro cosas que no son como las supone el pedido:**
1. «Solicitar contexto» **no está en el encabezado** de la ficha. Es un enlace del bloque «Acciones» del Resumen (`SEG\resumen.tsx:541-543`) y del final de «información para revisar» (`SEG\informacion.tsx:167-169`). Subirlo al encabezado es trabajo nuevo.
2. El encabezado no muestra ninguna referencia técnica del asesorado: solo el nombre visible (`ADV\workspace.tsx:145`, con «Asesorado» de respaldo). El `id` vive solo en la URL. Tampoco se cambia `document.title`: la pestaña del navegador dice siempre «Ficha del asesorado · BE» (`ADV\page.tsx:8`).
3. No hay `layout.tsx` del área profesional. Las 19 `page.tsx` repiten `<Encabezado …/>` + `<main id="contenido" className="contenido …">`; 9 son de `/pro`.
4. El área profesional no tiene íconos (§4) ni fuente web propia: la pila es `Inter, 'Segoe UI', Roboto, Arial, sans-serif`, sin `@font-face` (`CSS:17`).

---

## 1. Rutas y árbol de componentes de la ficha

Ruta: `/pro/advisees?id=<uuid>&vista=…`. El asesorado va por query porque el export estático no admite `/pro/advisees/:id` (DL-041, `ADV\page.tsx:10-12`).

```
WEB\app\layout.tsx (34, servidor)   <html lang="es-AR" data-tema> + script en línea del tema + ProveedorDeSesion
└ ADV\page.tsx (26, servidor)       Encabezado + main.contenido--ancho.contenido--seguimiento + Migas + <Suspense><Workspace/>
  └ ADV\workspace.tsx (249, cliente) header.ficha__cabecera + ProveedorDelSeguimiento
     ├ .barra-del-seguimiento  PestanasDelSeguimiento + SelectorDePeriodo  (SEG\barra.tsx)
     ├ vista=resumen   ResumenDelSeguimiento
     ├ vista=linea     LineaDeTiempo
     └ vista=analizar  Analizar  (dynamic, ssr:false; workspace.tsx:40)
```

S = componente de servidor (sin `'use client'`), C = cliente.

| Pieza | Archivo (líneas totales) | S/C | Qué contiene y de qué depende |
|---|---|---|---|
| (a) Encabezado global | `WEB\components\encabezado.tsx` (28) | S | «Saltar al contenido», isotipo PNG + «BE», navegación por prop, `SelectorDeApariencia`, aviso «Ambiente de prueba · solo datos sintéticos». Depende de `navegacion.tsx` (57, C), `apariencia.tsx` (49, C), `WEB\marca\isotipo-96.png`. Lo usa **todo** el website. |
| (a) Migas | `WEB\components\migas.tsx` (26) | S | `Migas` y `MigasDelAsesorado`. |
| (a) Encabezado de la ficha | `ADV\workspace.tsx:144-162` y `AccesoPorArea` `:200-221` | C | Nombre `:138,145`; «Acceso actual» `:146-152` (una sola línea si todas las áreas coinciden, `:203-209`); «Actualizar» `:154-156`; «Consultado a las HH:MM:SS» `:44,157`; aviso de vista parcial `:161`. En el mismo archivo va la revalidación de acceso (`:71-131`). Depende de `COPY_VINCULO` y `estadoParaMostrar` (dominio), `useEspacioProfesional`, `api.consultarDashboard` y `api.consultarVinculos`. |
| (b) Pestañas de vista | `SEG\barra.tsx:16-19` → `WEB\components\pestanas.tsx` (70) | C | Son **enlaces** en `<nav aria-label="Vistas del seguimiento">` con `aria-current="page"` y `replace`; no hay `role="tablist"`. `Pestanas` también la usan Nutrición, Entrenamiento, Antropometría e Información. |
| (c) Período | `SEG\barra.tsx:21-89` (89) | C | Chips `button.chip[aria-pressed]`: «7 días», «30 días», «90 días», «1 año» (`SEG\estado.ts:32-37`, por defecto 90, `:39`) y «Otro rango» (`:63-86`, dos `<input type=date>` + «Aplicar», máximo 366 días). Dice «incluye hoy, que todavía está en curso» (`:46`). |
| Contexto y estado | `SEG\contexto.tsx` (178, C), `SEG\estado.ts` (334, módulo puro) | — | `useSeguimiento` (`href`, `ir`), `useLectura` (descarta respuestas tardías), `limitarLectura` (4 a la vez), `textoDeFalla`. |
| (d) Resumen | `SEG\resumen.tsx` (875) | C | 12 componentes en un archivo: `ObjetivoYPlanificacion` `:168` y `FilaDeArea` `:253` (tabla, una fila por área); `ParaTuProximaRevision` `:333` y `Observacion` `:482` (4 a la vista + «Ver todas (n)»); `Acciones` `:509`; `IndicadoresDelResumen` `:579`, `Indicadores` `:603`, `ValorDelIndicador` `:675`, `EditorDeIndicadores` `:708` (hasta 4); `DelPeriodo` `:791`. Depende de `series.ts`, `selector.tsx`, `valores.ts`, `PanelDeRegistro`, `Ayuda`, y de `sintesisDelResumen` del dominio. |
| (e) Línea de tiempo | `SEG\linea-de-tiempo.tsx` (455) | C | `LineaDeTiempo` `:110`; filtros `:186-237` (chips de Áreas, select «Tipo de hecho», búsqueda); `FiltrosAvanzados` `:362` (`<details>` «Más filtros»: estado, calidad, carga tardía, ejercicio); `FiltrosActivos` `:425`; lista `Dias` `:303` y `Entrada` `:320`; «Ver más» `:288-295`. |
| (e) Detalle / origen del dato | `SEG\registro-original.tsx` (222) | C | `PanelDeRegistro` `:50`: `<dialog>` modal, panel lateral desde 64rem. **Reutiliza componentes de las pestañas de área:** `DetalleDeRegistroDeComida` (`ADV\nutrition\detalle-de-registro.tsx`), `VersionSoloLectura` (`nutrition\plan.tsx`), `Registro` (`training\ejecuciones.tsx`), `PlanSoloLectura` (`training\plan.tsx`). |
| (f) Analizar, cáscara | `SEG\analizar.tsx` (1180) | C | `Analizar` `:100-532` (12 `useState`, mucho estado derivado) y 12 subcomponentes: `ModoElegible` `:534`, `SeleccionDeIntervalo` `:551`, `ElegirReferencia` `:580`, `EstadoDeUnaSerie` `:677`, `PanelDeLectura` `:720`, `DetalleDelPunto` `:804`, `ComoSeCalcula` `:838`, `TablaDeDatos` `:868`, `ExportarCsv` `:929`, `ComparacionDePeriodos` `:1008`, `ContenidoDeLaComparacion` `:1061`. |
| (f) Preguntas | `SEG\preguntas.tsx` (329) | C | `ListaDePreguntas` `:80` (tarjetas-botón), `PreguntaActiva` `:122`, `ElegirParametros` `:148`. Textos de `PREGUNTAS_PROFESIONALES` (dominio). |
| (f) Selector de métricas | `SEG\selector.tsx` (318) | C | `SelectorDeMetricas` `:39` (hasta 3; `<details>` «Agregar una métrica»), `DialogoDeReemplazo` `:263`. |
| (f) Modos, agrupar, capas | `SEG\analizar.tsx:419-481` | C | Tres `<fieldset class="capas">`: «Cómo se leen» (radios), «Agrupar por» (radios), «Capas» (casillas). `ElegirReferencia` solo en cambio relativo. |
| (f) Gráficos | `SEG\lienzo.tsx` (332), `SEG\series.ts` (263), `SEG\valores.ts` (18) | C / C / puro | `Lienzo` `:128`, `Panel` `:142`, `Marca` `:54`, `Forma` `:65`, `ESTILOS` `:26`. Recharts. |
| (f) Lectura | `PanelDeLectura`, `SEG\analizar.tsx:720-801` | C | Fecha anterior/siguiente con datos, fecha elegida, valores con `aria-live`, «Ver el origen de este dato» `:781-783`. |
| (f) Tabla y exportación | `TablaDeDatos` `:868`, `ExportarCsv` `:929`, `ComoSeCalcula` `:838` | C | `<details>` plegados; CSV armado en el navegador. |
| (f) Comparar etapas | `SEG\etapas.tsx` (239) | C | `ComparacionDeEtapas` `:57` (tarjetas A/B + tabla), `EtapasDelPeriodo` `:220`. |
| (f) Contraste con lo indicado | `SEG\contraste.tsx` (280) | C | Nutrición: tabla por comida. Entrenamiento: embebe `EvolucionDelEjercicio` de `ADV\training\comparacion.tsx` (1058) con `dynamic` (`:38`). |
| (f) Información para revisar | `SEG\informacion.tsx` (173) | C | Columnas por área con `<dl>`; «Preparar la revisión de…» y «Solicitar contexto». |
| (f) Vistas guardadas | `SEG\vistas-guardadas.tsx` (234) | C | `<details>` con guardar, abrir, actualizar y borrar. |
| (g) «Preparar revisión» | Enlaces: `SEG\resumen.tsx:517,526-532` y `SEG\informacion.tsx:88-90,133-135` | C | El texto es «Preparar la revisión de {área}», uno por área con plan activo. Lleva a `/pro/advisees/{nutrition\|training}?id=…&vista=revisiones&preparar=1&volver=…`. El destino es de las pestañas de área: `ADV\retorno-y-preparacion.tsx` (72), `ADV\nutrition\revisiones.tsx` (415; `:40-65,107`), `ADV\training\revisiones.tsx` (376; `:42-67,101`), `ADV\evidencia-de-revision.tsx` (166) y `ADV\evidencia.ts` (70, puro). |

Totales: `SEG\` tiene 16 archivos y 5.519 líneas; con `workspace.tsx` y `page.tsx`, 5.794. Toda la ficha es cliente: hay 12 `dynamic(…, { ssr: false })`.

## 2. Estado en la URL

- **Lectura:** `useSearchParams()` en `ADV\workspace.tsx:55-60` y `SEG\contexto.tsx:77-82`; los lectores están en `SEG\estado.ts`.
- **Escritura:** `ir()` (`SEG\contexto.tsx:84-91`) usa `router.replace(…, { scroll: false })`, o `push` con `agregarAlHistorial`. `href()` (`:83`) arma los `<Link>`. `hrefConCambios` (`estado.ts:82-93`) conserva todos los demás parámetros y pone `id` primero, así que la URL acumula el estado de las tres vistas.

| Parámetro | Valores | Lee / escribe (`SEG\estado.ts`) |
|---|---|---|
| `id` | UUID del asesorado | `workspace.tsx:56` |
| `vista` | ausente = `resumen`; `linea`; `analizar` | `leerVista` `:28`; `barra.tsx:18` |
| `p` | `7`, `30`, `90`, `365` (ausente = 90) | `leerPeriodo` `:65`; `parametrosDePeriodo` `:74` |
| `desde`, `hasta` | fechas `AAAA-MM-DD`, hasta 366 días; reemplazan a `p` | ídem |
| `areas`, `tipos`, `estados`, `calidad` | listas con coma de enumerados | `leerFiltrosDeLaLinea` `:111`; `parametrosDeFiltros` `:123` |
| `tardias` | `1` | ídem |
| `plan`, `ej` | UUID; `e:<uuid>` o `v:<uuid>` | ídem |
| `novedades` | instante ISO (corte de una revisión) | `leerCorte` `:288` |
| `m` | hasta 3 métricas con coma; cada una `metricId~exerciseKey~serie~unidad` | `leerAnalisis` `:182`; `codificarReferencia` `:166` |
| `modo` | ausente o `P` = paneles; `S` = superpuestas; `R` = relativo | `:159-160,194,207` |
| `g` | `O` = cada registro; ausente o `D` = día; `W` = semana | `:161-162,195,208` |
| `capas` | ausente = ambas; `b` = bandas; `e` = hitos; `-` = ninguna | `:191,196-197,209` |
| `ref` | `N` (1 a 31; 7 se omite) o `fecha_fecha` | `leerReferenciaDelCambio` `:220` |
| `f` | fecha elegida en el gráfico | `:199,211` |
| `cmp` | `a1_a2_b1_b2` (comparar dos períodos) | `:189-190,212` |
| `pregunta`, `area`, `version`, `etapaA`, `etapaB`, `medida`, `ejercicio`, `serie`, `unidad` | identificadores de la pregunta | `leerPregunta` `:245`; `parametrosDePregunta` `:268` |
| `volver` | en las pestañas de área: la query de la ficha sin `id` | `valorDeRetorno` `:301`; `retornoALaFicha` `:313` |
| `preparar` | `1`, en Revisiones | `ADV\retorno-y-preparacion.tsx:44` |

**No está en la URL** (es estado de React): la búsqueda libre de la línea de tiempo, por regla DL-127 (`SEG\linea-de-tiempo.tsx:118-119`); el intervalo acercado del gráfico (`analizar.tsx:147`); «análisis personalizado» y «cambiando pregunta» (`:119-120`); el filtro «Qué comidas ver» del contraste (`contraste.tsx:162`); «Ver todas» (`resumen.tsx:348`); los paneles abiertos.

Las pestañas de área usan además `vista` propia, `evaluacion` (Antropometría), `receta` y `nueva` (Recetas), y `plantilla` (Información). En `/pro/advisees/forms`, `volver` tiene dos significados: la query de la ficha y el literal `volver=entrenamiento` (`ADV\forms\pedir.tsx:50`, enlazado desde `ADV\training\resumen.tsx:179`).

## 3. Estilos

**Organización.** Dos hojas globales, importadas en `WEB\app\layout.tsx:5-6`. No hay CSS modules, Tailwind, PostCSS ni CSS-in-JS, y no hay configuración de ESLint o Stylelint versionada. Los estilos en línea son contados: 2 `minWidth` en `ADV\training\comparacion.tsx:557,862`, 3 dentro del SVG de la lámina, y atributos SVG con `var(--token)` en los gráficos.

**`tokens.css` (124 líneas).** `:root` es «Claro» (`:18-79`); `[data-tema='azul-noche']` redefine lo que cambia (`:81-124`).

| Grupo | Variables |
|---|---|
| Superficies y texto | `--fondo`, `--fondo-suave`, `--superficie`, `--texto`, `--tenue` |
| Marca | `--azul`, `--azul-oscuro`, `--navy`*, `--cian`* |
| Interacción | `--enlace`, `--boton-fondo`, `--boton-fondo-activo`, `--boton-texto`, `--boton-secundario-texto`, `--boton-secundario-borde`, `--peligro-fondo`, `--peligro-texto` |
| Bordes y foco | `--borde` (decorativo), `--borde-control` (3:1), `--foco` |
| Estados | `--error`, `--error-fondo`, `--exito`, `--exito-fondo` |
| Encabezado* | `--encabezado-fondo`, `--encabezado-fondo-2`, `--encabezado-texto`, `--encabezado-tenue`, `--encabezado-foco` |
| Figura antropométrica | `--figura-relleno`, `--figura-trazo`, `--punto`, `--punto-halo` |
| Gráficos planificado/registrado | `--grafico-planificado`, `--grafico-registrado`, `--grafico-hueco` |
| Métricas de Analizar | `--metrica-1`, `--metrica-2`, `--metrica-3` |
| Sombras y velo | `--sombra-suave`, `--sombra`, `--velo`, `--sombra-desplazamiento`, `--sombra-desplazamiento-sobre-navy`* |

(*) Solo en `:root`: son iguales en los dos temas.

No están tokenizados: espaciado, radios (10px ×23, 12px ×10, 8px ×6, 999px, 14px, 16px…), tamaños de letra (27 valores distintos), cortes de pantalla, tipografía y `z-index`.

**`globals.css` (3.647 líneas, 599 bloques, 30 `@media`).** «Pro» = usado por el área profesional o la ficha.

| Líneas | Sección | Uso |
|---|---|---|
| 7-103 | Base: reset, títulos, `:focus-visible`, `.visualmente-oculto`, `.saltar` | global |
| 104-120 | Cara pública (degradé) | público |
| 121-145 | Selector de apariencia | global |
| 146-283 | Encabezado de marca y navegación; teléfono `:221-282` | global |
| 284-321 | Pie | público |
| 322-363 | Estructura: `.contenido` 46rem, `--ancho` 76rem, `--seguimiento` 100rem; `.nota`, `.acciones` | global + **ficha** |
| 364-429 | Botones | global |
| 430-554 | Formularios: `.campo`, `.actos`, `.acto` | global |
| 555-626 | Evidencia de una revisión | Pro |
| 627-659 | Avisos | global |
| 660-788 | Secciones y datos: `.seccion`, `.datos`, `.insignia`, `details summary`, `.dialogo` | global |
| 789-875 | Espacio profesional: `.migas`, `.espacio`, `.alcances`, `.estados-de-vinculo--en-linea` | Pro |
| 876-999 | Listas, `.identificador`, `.desplazable-x` (`:950-998`) | global |
| 1000-1030 | Pestañas | Pro (4 pestañas de área + ficha) |
| 1031-1183 | Editores de plan; **`.tabla` está acá** (`:1130-1182`) | Pro |
| 1184-1221 | Tarjetas de dominio | huérfano (ver §7) |
| 1222-1393 | Landing y acceso | público |
| 1394-1628 | Toma antropométrica sobre la figura | Pro |
| 1629-1639 | Candidato de importación | Pro |
| 1640-1875 | Gráficos: `.grafico*`, `.capas`, `.capa`, `.muestra--*`, `.leyenda`, `.chip` (`:1813-1835`), `.detalle-de-valores` | Pro + **ficha** |
| 1876-2077 | Ficha de método y lámina del compositor | Pro |
| 2078-2165 | `.aviso-flotante`, `.ayuda` | global |
| 2166-2450 | Piezas compartidas: `.metadatos`, `.subseccion`, `.encabezado-de-bloque`, `.panel`, `.boton--compacto`, `.tomas`, `.medicion`, `.acciones--fijas`, `.cargando`, `.estado-vacio` | Pro + **ficha** |
| 2451-2633 | Recetas, fotos, objetivos por serie, tiempos, imagen de ejercicio | Pro |
| **2634-3190** | **Entorno de seguimiento:** barra y período `:2637-2702`; línea de tiempo `:2704-2827`; `.dialogo--panel` `:2829-2857`; grilla de Analizar `:2859-2926`; selector, referencias y lectura `:2928-3050`; indicadores y cobertura `:3058-3119`; plegables `:3121-3181` | **ficha** |
| **3191-3647** | **Ficha del asesorado:** cabecera `:3196-3243`; tabla de planificación `:3245-3284`; información por área `:3286-3314`; `.dato-secundario` `:3316-3322`; síntesis y acciones `:3324-3424`; preguntas `:3426-3516`; etapas `:3518-3577`; contraste `:3579-3608`; `.aviso-de-filtro` y retorno `:3624-3638` | **ficha** |

La ficha usa unas 145 clases distintas; las más usadas son todas genéricas (`.nota` ×70, `.boton` ×59, `.boton--enlace` ×33, `.campo` ×27, `.boton--secundario` ×23). Los cortes de pantalla son 64rem (×11), 80rem, 69rem, 56rem, 48rem, 40rem y 30rem.

**Tema.**
- Sí hay cambio de tema, con el atributo `data-tema` en `<html>` (`layout.tsx:25`). No existe `data-theme`.
- No hay `prefers-color-scheme` en ningún archivo: el sistema operativo no influye. Sí se declara `color-scheme` (`tokens.css:78,123`).
- Temas del website: `azul-noche` (predeterminado) y `claro` (`WEB\lib\apariencia.ts:10-12`). Se guardan en `localStorage['be-apariencia']` (`:13`).
- Un script en línea pone el atributo antes del primer dibujo, con los dos nombres escritos a mano (`apariencia.ts:69`; `layout.tsx:27`).
- El selector es un `<select>` rotulado «Apariencia» en el encabezado (`WEB\components\apariencia.tsx:27-43`).
- El encabezado es navy en los dos temas (`tokens.css:48`; `CSS:146`).
- Aparte, la lámina antropométrica tiene tres temas propios (`CLARO`, `OSCURO`, `AZUL`; `DOM\figura-de-lamina.ts:31`, colores en `DOM\lamina.ts:178`) que no tocan el website.

## 4. Íconos

No hay sistema de íconos, ni biblioteca, ni componente compartido. Lo que existe:

| Qué | Dónde | Uso |
|---|---|---|
| 3 SVG de trazo (24×24, `currentColor`), funciones locales sin exportar: `IconoNutricion`, `IconoEntrenamiento`, `IconoAntropometria` | `WEB\app\page.tsx:137-165` | Solo la landing, decorativos. |
| `Icono` (peso, grasa, magra, pliegues, genérico) | `ADV\anthropometry\lamina-dibujo.tsx:970-1013` | Solo dentro del SVG de la lámina. |
| `Marca` y `Forma` (muestra de color, forma y trazo de una métrica) | `SEG\lienzo.tsx:54-90` | Leyenda, selector y lectura de Analizar. Es lo más parecido a un ícono en la ficha. |
| Muestras CSS `.muestra--planificado/registrado/punto/rombo/hueco` | `CSS:1750-1785` | Leyendas de Entrenamiento y Antropometría. |
| Emojis de respaldo: 🏋, 🍽, 📷 | `WEB\app\pro\exercises\imagen-de-ejercicio.tsx:52`; `recipes\imagen-de-receta.tsx:35`; `ADV\nutrition\detalle-de-registro.tsx:201` | Lugar de una imagen que falta. |
| Glifos de texto: `⚠` (unas 15 veces, con `aria-hidden`), `×`, `▸`, `›`, `←` | `WEB\components\formulario.tsx:29`; `ayuda.tsx:63`; `SEG\linea-de-tiempo.tsx:444`; `CSS:2140,3154,803` | Errores de campo, cerrar, quitar filtro, plegables, migas. |
| Indicador de carga hecho en CSS | `CSS:2413-2421` | `Cargando`. |

**Logo.** No hay componente ni SVG. Son PNG en `WEB\marca\`: `isotipo-96.png` (encabezado `encabezado.tsx:4,20`, y lámina), `isotipo-640.png` (landing) e `isotipo-be.png`, que no está referenciado desde `apps`, `packages` ni `scripts`. La palabra «BE» es texto (`encabezado.tsx:21`). Los íconos de la pestaña del navegador están en `WEB\app\icon.png`, `apple-icon.png` y `favicon.ico`.

## 5. Gráficos

**Biblioteca:** `recharts` 3.10.1 (`R\apps\web\package.json:17`), la única dependencia de interfaz además de Next 15.5 y React 19.2.

| Componente | Import | Tipo |
|---|---|---|
| `SEG\lienzo.tsx:22` | `LineChart`, `Line`, `ReferenceArea`, `ReferenceLine`, `CartesianGrid`, `XAxis`, `YAxis`, `ResponsiveContainer` | Analizar; sin `Tooltip` |
| `ADV\training\comparacion.tsx:56` | `BarChart`, `ComposedChart`, `Bar`, `Line`, `LabelList`, `Tooltip`… | Por serie y evolución de un ejercicio; la ficha lo embebe |
| `ADV\anthropometry\grafico-de-evolucion.tsx:51` | `ScatterChart`, `Scatter`, `Tooltip` | Solo puntos |
| `ADV\anthropometry\lamina-dibujo.tsx`, `figura.tsx` | — | SVG a mano, sin Recharts |

**Cómo dibuja Analizar (`SEG\lienzo.tsx`):**
- **Forma y trazo por métrica** (`ESTILOS` `:26-30`): 1 = `--metrica-1`, círculo, línea continua; 2 = `--metrica-2`, cuadrado, rayada `7 4`; 3 = `--metrica-3`, triángulo, punteada `2 3`.
- **El trazo discontinuo solo aparece cuando las series comparten gráfico:** `strokeDasharray={modo === 'PANELS' ? undefined : e.trazo}` (`:322`).
- **Estado del punto** (`Forma` `:65-90`; `punto` `:243-261`): lleno = dato completo; hueco = subtotal (`quality === 'PARTIAL'`) o balde sin completar (`partialBucket`); contorno cortado = reportado por la persona; punto adentro = calculado por un método. El radio se adapta al espacio por día (5, 3,5 o 2,5; `:238-239`).
- **Cortes por datos faltantes:** hay una columna de datos por tramo (`segment`) de cada serie (`:163-185`), y la línea une solo su tramo. El día en curso o la semana sin completar van a una columna aparte y quedan como punto suelto (`:171,177`). Un valor desconocido no se dibuja (`:174`). Los tramos los fija el dominio (`DOM\nutricion-del-analisis.ts:162,175`; `DOM\entrenamiento-del-analisis.ts:256`; `DOM\antropometria-del-analisis.ts:85-99`).
- **Bandas y sombreados:** vigencia de planes con `--fondo-suave`, opacidad alternada y rótulo «Nutrición v2» (`:288-299`); rango de referencia con borde `3 3` y rótulo «Referencia», solo en cambio relativo (`:300-302`); selección al arrastrar (`:325`).
- **Líneas de referencia:** hitos verticales `2 4` (`:303-305`); cero en cambio relativo (`:306`); fecha elegida vertical `6 3` en `--texto` (`:324`); punto elegido con un aro en `--texto` (`:257`).
- **Ejes:** X temporal con unas 7 marcas `dd/mm` (`:187-193,307-317`); Y automático, sin decimales en métricas enteras (`:319`). Nunca hay doble eje.
- **Interacción:** no hay tooltip ni cursor al pasar el puntero. Un clic elige la fecha; un clic en un punto elige la fecha y abre su origen (`analizar.tsx:361-365`); arrastrar un día o más acerca el intervalo (`lienzo.tsx:196-211`). Con teclado, flechas, Inicio y Fin sobre `div[role=group][tabIndex=0]` (`:212-223,271`). Sin animación.
- **Alto:** 190 px por panel y 300 px el combinado, escalado con el ancho (`:133,139,241`).

**Nombres en pantalla:**
- Grupo «Cómo se leen»: «Paneles sincronizados», «Superpuestas en valores reales», «Cambio relativo» (`analizar.tsx:420-428`). Un modo que no corresponde queda deshabilitado con «No disponible: …» (`:534-549`).
- Títulos de los gráficos combinados: «Superpuestas en valores reales (unidad)» y «Cambio relativo contra la referencia (%)» (`lienzo.tsx:139`).
- Grupo «Agrupar por»: «Cada registro», «Día», «Semana» (`analizar.tsx:438-444`). En el título del panel: «cada toma» o «cada sesión», «por día», «por semana» (`:80,195`).
- Grupo «Capas»: «Vigencia de planes», «Hitos (activaciones, objetivos, revisiones)» (`:458-467`).

**Los otros dos gráficos, por arriba:**
- Entrenamiento: lo planificado va rayado (patrón SVG, `comparacion.tsx:216-228`) o con línea `6 4` y cuadrados huecos (`:929-943`); lo registrado, lleno o con línea continua y círculos (`:948-961`); el hueco, una franja rayada (`:891`); el cambio de versión, una vertical `4 4` (`:895`); lo elegido, una franja con borde `--foco` (`:893`). El tooltip sale solo con puntero fino (`WEB\lib\graficos.ts:14`).
- Antropometría: círculo si es comparable, rombo si no; centro claro si está corregido; aro `--foco` en el elegido (`grafico-de-evolucion.tsx:226-247`).

## 6. Textos de la interfaz

**En la ficha, aproximadamente 25 % sale del dominio y 75 % está escrito en los `.tsx`.** Es una estimación con expresiones regulares sobre `workspace.tsx` y `SEG\*`: unos 120 usos de textos o armadores del dominio contra unas 365 líneas con texto literal. No es un conteo exacto.

No existe `copy-seguimiento.ts` ni un `COPY_SEGUIMIENTO`. En `SEG\` hay 8 usos de `COPY_*.x` en 5.519 líneas, contra 203 en Nutrición, 338 en Entrenamiento y 185 en Antropometría.

**Lo que sí está en `DOM`:**
- `preguntas-profesionales.ts` (241): las 6 preguntas con `pregunta`, `muestra` y `limite` (`:43-86`), y `TEXTO_DE_REQUISITO` (`:22-30`).
- `metricas-del-analisis.ts` (404): `nombre`, `nombreCorto`, unidad, `explicacion`, `comoSeCalcula`, `ausencias` y `limites` de cada métrica.
- `sintesis-del-resumen.ts` (444): `textoDeObservacion` `:369`, `textoDelAlcance` `:357`, `FUENTE_DE_LA_REGLA` `:426`, `NOMBRE_DEL_AREA` `:352`, `PALABRAS_QUE_CALIFICAN` `:444`.
- `linea-de-tiempo.ts` (268): `NOMBRE_DE_TIPO_DE_EVENTO` `:220`, `NOMBRE_DE_DOMINIO` `:248`. El título y los detalles de cada entrada llegan ya armados desde la API.
- `series-del-analisis.ts` (509): `partesDeLaCobertura` `:411`, `resumenTextual` `:472`.
- `etapas-de-planificacion.ts` (227), `contraste-de-comida.ts` (134), `antropometria-del-analisis.ts:60`, `exportacion-del-analisis.ts` (162), `copy-vinculo.ts` (234), `copy.ts` (63).

**Ejemplos de lo que está en los `.tsx`:**
- Títulos y columnas: `SEG\resumen.tsx:183,191-194`.
- Botones: «Actualizar» (`workspace.tsx:155`), «Otro rango» (`barra.tsx:64`).
- Ayudas enteras: `resumen.tsx:468-477`.
- Leyenda del gráfico: `analizar.tsx:310,314,319`.
- Nombres de modos y de agrupación: `analizar.tsx:422-443`.
- Diccionarios locales: estados y calidades (`linea-de-tiempo.tsx:82-100`), filtros del contraste (`contraste.tsx:113-133`), motivos (`analizar.tsx:82-94,1151-1162`), mensajes de falla (`contexto.tsx:113-124`).
- Repeticiones a mano: «Nutrición» y «Entrenamiento» como literales (`analizar.tsx:209,1172`; `etapas.tsx:80`; `selector.tsx:146`; `preguntas.tsx:201`) aunque existe `NOMBRE_DEL_AREA`; el diccionario `CRITERIO` está duplicado (`analizar.tsx:1151-1156` y `etapas.tsx:43-48`).

**Resto del área profesional:** mayoritariamente en `COPY_*` del dominio (`copy-nutricion.ts` 153, `copy-entrenamiento.ts` 267, `copy-entrenamiento-por-serie.ts` 229, `copy-antropometria.ts` 337, `copy-formularios.ts` 148, `copy-recetas.ts` 264, `copy-plantillas.ts` 52, `copy-habituales.ts` 58, `copy-integraciones.ts` 68; `COPY_CARTERA` en `cartera.ts:84`, `COPY_COMPARACION` en `comparacion-de-entrenamiento.ts:639`, `COPY_EVOLUCION` en `evolucion-antropometrica.ts:262`), con literales sueltos.

La regla escrita está en `R\docs\ux\GUIA-UX-UI.md:56-58`: el copy vive en el dominio, y «los textos que una sola pantalla usa pueden quedar en ella».

## 7. Restricciones para rediseñar

**Plataforma**
- **Export estático** (`R\apps\web\next.config.mjs:33`): no hay servidor en ejecución, ni middleware, ni segmentos dinámicos. Las imágenes no se optimizan (`:36`). Cada página con `useSearchParams` necesita `<Suspense>`.
- **La sesión vive solo en memoria** (`WEB\lib\sesion.tsx:4-6`, DL-012): una recarga o una navegación completa la cierra. Toda navegación interna tiene que ir por `<Link>` o el router. Hay tres `<a href>` internos («Volver a la ficha, donde estabas») en `ADV\nutrition\revisiones.tsx:81`, `ADV\training\revisiones.tsx:82` y `ADV\forms\formularios.tsx:105`; no pude determinar leyendo si cierran la sesión.
- **CSP** (`R\render.yaml:114`): `default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; connect-src 'self' https://be-api-hndp.onrender.com; object-src 'none'; …`
  - No se pueden cargar fuentes, íconos ni scripts externos: una tipografía nueva tiene que alojarse en el sitio.
  - Las imágenes solo pueden ser del mismo origen o `data:`; `blob:` no (lo anota `ADV\anthropometry\lamina-descarga.tsx:9`).
  - Los estilos y el script en línea están permitidos; el script del tema depende de eso.
  - La CSP la aplica el host estático, así que `next dev` no muestra violaciones.

**Servidor y cliente**
- De 121 archivos de `WEB`, 87 llevan `'use client'`.
- Son de servidor todas las `page.tsx`, `layout.tsx`, `encabezado.tsx`, `migas.tsx`, `pie.tsx` y `texto-versionado.tsx`. El `Encabezado` no puede tener estado propio: lo interactivo entra como hijo cliente.
- Dependencias de cliente: `next/navigation`, `recharts`, `<dialog>` nativo con `showModal()`, `ResizeObserver`, `matchMedia`, `localStorage` (solo el tema).

**Color y tema: `R\scripts\contraste.test.cjs` (371 líneas, corre en `npm test` y en la CI)**
- Falla con cualquier `#hex` o `rgb(` fuera de `tokens.css`, en `.css`, `.ts` o `.tsx` (`:344-371`). Un SVG nuevo tiene que usar `currentColor` o `var(--token)`.
- Mide pares declarados a mano: 4,5:1 para texto y 3:1 para bordes de control, foco y gráficos (`:79-112,161-174`). Un par nuevo se declara ahí.
- Lee solo tokens en `#rrggbb` de los bloques `:root` y `[data-tema='azul-noche']` (`:46-61`).
- Las tres métricas necesitan matiz entre 170° y 300° (`:201-210`) y ΔE ≥ 20 entre sí y contra foco, error, éxito y enlace (`:216-228`).
- El degradé de `.cara-publica` está atado por expresión regular (`:253-271`).
- Un tercer tema toca `TEMAS`, el script en línea (`WEB\lib\apariencia.ts:10,69`), `tokens.css` y esta prueba.

**Accesibilidad ya implementada, a conservar**
- **Estructura:** «Saltar al contenido» hacia `main#contenido`; `aria-current` en navegación, pestañas y migas; un `<h1>` por página y secciones con `aria-labelledby`.
- **Foco:** global de 3px con `--foco` (`CSS:61-64`); propio en el encabezado.
- **Estados:** `aria-pressed` en chips; `aria-expanded` y `aria-controls` en plegables hechos a mano; `<details>` nativo; `role="status"` (×10), `role="alert"` (×6), `aria-live` en la lectura.
- **Diálogos:** tres `<dialog>` modales con `aria-labelledby`, Escape y devolución del foco.
- **Tablas:** `<caption class="visualmente-oculto">` y `scope` en las 6 tablas.
- **Gráfico:** `role="group"`, `tabIndex=0`, descripción con `aria-describedby`, teclado, tabla equivalente y resumen en texto.
- **Tamaño y movimiento:** objetivos de 44px (`.boton`, `.chip`, `.capa`, `.campo input`); `prefers-reduced-motion` (4 bloques).
- **Orden:** la grilla de Analizar ubica sin reordenar el documento (`CSS:2859-2865`, WCAG 1.3.2 y 2.4.3).
- No está probado con una persona y un lector de pantalla (`GUIA-UX-UI.md:805-808`).

**Reglas citadas en el código**
- **«Ubicar, nunca calificar»** (`GUIA-UX-UI.md:38-55`; TEST-PRJ-009, RF-048): sin semáforos, sin verde o rojo de juicio, sin porcentaje de cumplimiento ni rangos normativos. En el código: «sin colores de juicio (PRO-02)» (`SEG\resumen.tsx:11`), «Describen lo registrado, sin calificar» (`:629`), «Cobertura del registro, no adherencia» (`:807`), los colores de las métricas (`tokens.css:64-67`), `ADV\anthropometry\figura.tsx:8-9` y `lamina.tsx:13`.
- **DL-126:** la referencia del cambio relativo no depende del intervalo visible (`SEG\estado.ts:149-153`; `analizar.tsx:176-178`).
- **DL-127:** el texto de búsqueda nunca va en la URL (`SEG\estado.ts:2-4`; `linea-de-tiempo.tsx:9-12`).
- **DL-128:** las vistas guardadas guardan configuración, nunca datos (`SEG\vistas-guardadas.tsx:4-7`).
- **DL-041:** el asesorado va por query. **DL-113:** pestañas en una línea, `Ayuda`, `AvisoFlotante`.
- **PRO-03, 04, 05, 06, 16 y 21:** `linea-de-tiempo.tsx:6-14`, `registro-original.tsx:4`, `selector.tsx:5`.
- **WCAG 2.5.7:** las fechas son la alternativa a arrastrar (`barra.tsx:7`; `lienzo.tsx:18`). **WCAG 1.4.1:** color + forma + trazo (`lienzo.tsx:10-12`).
- **F-01 y F-02:** sin doble eje; la línea une solo su tramo (`lienzo.tsx:5-9`).
- **§3.A:** el encabezado no dice «Activo» si una lectura dice «no disponible» (`workspace.tsx:18-23`).
- **D-01 a D-33** están en `R\docs\paquetes\WP-DASHBOARD-COMPRENSION.md:49-93`, no en el código. Las que tocan diseño: D-14 (primer pantallazo), D-16 y D-30 (contraste en tabla), D-25 (lo que falla va primero), D-29 (evidencia agrupada), D-31 (etapas), D-32 (alcance de «no calificar»).
- No encontré ningún comentario literal «no cambiar» o «no tocar» en `WEB`.

**Guía de UX (`R\docs\ux\GUIA-UX-UI.md`, «a ratificar por Dirección»)**
- Escritorio primero: 1440, 1280 y 1024 px; a 768 y 390 solo no se rompe (`:187-188`).
- Lo principal entra en la primera pantalla a 1280×800 (`:189-193`).
- Superficies mates: sin vidrio, brillo ni degradé (`:202-208`).
- Sin doble desplazamiento (`:197-198`).
- No se achica la letra para que entre una composición (`:138-139`).
- El acento orienta, no decora (`:148-149`).
- No se pliega el contexto para decidir (`:70-77`).
- Lista de control por pantalla: `:678-722`.

**Contratos que el rediseño no puede renombrar sin migrar**
- Los parámetros de la URL y sus letras (§2).
- Los enumerados `PANELS|OVERLAY|RELATIVE` y `ORIGINAL|DAY|WEEK`, que se guardan en el servidor (`vistas-guardadas.tsx:20-34`).
- Los atributos `data-regla`, `data-prioridad`, `data-fecha`, `data-id` y `data-clase`.
- Clases que usan como selector los recorridos automatizados de evidencia (`R\EVIDENCIA\DASHBOARD-PROFESIONAL\herramientas\recorrido-comprension.mjs`, por ejemplo `:357,363,389,406,691,969,991,1057,1108`): `.observacion`, `.tarjeta-de-pregunta`, `.parametros-de-pregunta`, `.acciones-del-resumen`, `.retorno-a-la-ficha`, `.panel-de-lectura`, `.pregunta-activa`, `.comparacion-de-etapas .etapa`, `.tabla-de-etapas`, `.celda__detalle`, `details.vistas-guardadas`, `figure.grafico__figura g.grafico__elegible`, `.entrada`. También dependen de textos visibles como «Ver la respuesta» o «Guardar esta vista». Están fuera de la CI.

**Pruebas que sí corren en la CI (`npm test`; `R\.github\workflows\ci.yml:38-47`)**
- Typecheck y build del website.
- `contraste.test.cjs`.
- `copy-pantallas.test.cjs`: palabras prohibidas en `ADV\nutrition`, `ADV\training`, `ADV\anthropometry` y `pro\recipes`. **No cubre `SEG\`, `forms`, `templates` ni `exercises`** (`:34-68`).
- `retorno-a-la-ficha.test.mjs` (sobre `SEG\estado.ts`), `evidencia-de-revision.test.mjs`, `contexto-citable.test.mjs`, `retorno-seguro.test.mjs`.
- `DOM\comprension-del-dashboard.test.ts`: fija textos exactos de la síntesis y que haya 4 preguntas principales (`:455,555-632`).

**Hallazgos sueltos que afectan el alcance**
- `ADV\tarjetas-de-dominio.tsx` (122 líneas) no tiene ninguna referencia en el repo (`git grep`). Su CSS (`CSS:1184-1221`) queda huérfano.
- Más CSS sin uso en ningún `.tsx`: `.presets`, `.preguntas`, `.boton--pregunta` (`CSS:2928-2984`) y `.contexto h2` (`CSS:866`).
- `CSS:2890-2895` deja fija la lectura de Analizar y `CSS:3640-3647` lo deshace. El comentario de `CSS:2862` y el de `analizar.tsx:402` quedaron viejos.
- En pantallas de 40rem o menos, **todas** las `.tabla` ocultan el `thead` y dependen de `data-etiqueta` (`CSS:1156-1182`). Las 6 tablas de la ficha no lo ponen.
- `.pestanas`, `.chip`, `.capas`, `.seccion`, `.tabla` y `.dialogo` son globales: tocarlas cambia las pestañas de área, la cuenta y la cara pública.

## 8. Resto del área profesional (por arriba)

**`/pro`: 3 archivos, 473 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `WEB\app\pro\page.tsx` | 19 (S) | Encabezado + `<h1>Espacio profesional</h1>` + `EspacioProfesional`. |
| `…\pro\espacio-profesional.tsx` | 300 | `useEspacioProfesional` (lo comparten todas las páginas pro); «Tus asesorados» (una tarjeta por persona con «Abrir»); «Solicitudes enviadas» (tabla); «Solicitar vínculo» en un lateral fijo desde 64rem. |
| `…\pro\pendientes.tsx` | 154 | «Pendientes»: filtros y tabla con «Abrir» hacia la vista que resuelve cada pendiente. |

**`ADV\` raíz, compartidos**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `periodo.tsx` | 47 | `FiltroDePeriodo` (Desde/Hasta, hasta 92 días) de las pestañas de área y de Pendientes. **No es el de la ficha.** |
| `retorno-y-preparacion.tsx` | 72 | `volver`, «Volver a la ficha, donde estabas», `preparar=1` y el aviso «Preparado por BE». |
| `evidencia.ts` | 70 | Lógica pura de la evidencia de una revisión. |
| `evidencia-de-revision.tsx` | 166 | `SeleccionDeEvidencia`: casillas por día y por tipo. |
| `tarjetas-de-dominio.tsx` | 122 | Sin uso. |

**`ADV\nutrition`: 12 archivos, 3.487 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara de la pestaña. |
| `nutricion.tsx` | 119 | Contexto, pestañas Resumen / Plan / Registros / Revisiones, 404 neutral. |
| `resumen.tsx` | 240 | Objetivo, plan activo, última evaluación, estado y revisión pendiente. |
| `formularios.tsx` | 373 | Formularios de evaluación y de «Nueva versión de objetivo». |
| `plan.tsx` | 240 | Plan activo en solo lectura, borrador e historial. |
| `editor.tsx` | 782 | Editor del borrador: día tipo → comida → opción → ítem; validar y activar. |
| `habituales.tsx` | 302 | Alimentos y comidas habituales dentro del editor. |
| `plantillas.tsx` | 167 | Guardar como plantilla y empezar desde una. |
| `importacion.tsx` | 344 | Importar un alimento desde un proveedor. |
| `registros.tsx` | 277 | Registros: prescripto, registrado, diferencia y faltantes. |
| `detalle-de-registro.tsx` | 204 | Un registro de comida con cantidades, estimación y fotos; lo reutiliza la ficha. |
| `revisiones.tsx` | 415 | Contexto, registrar revisión y aplicar; recibe `preparar=1`. |

**`ADV\training`: 14 archivos, 5.030 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara. |
| `entrenamiento.tsx` | 117 | Contexto y pestañas Resumen / Plan / Ejecuciones / Revisiones. |
| `resumen.tsx` | 620 | Estado, objetivo, plan, evaluación con contexto citado y última sesión. |
| `contexto-citable.ts` | 154 | Lógica pura de las citas de respuestas de formulario. |
| `plan.tsx` | 296 | Activo, borradores e historial. |
| `editor.tsx` | 972 | Editor bloque → microciclo → sesión → prescripción, con objetivos por serie. |
| `objetivos-por-serie.tsx` | 172 | Campo con herencia y tabla «Así lo ve tu asesorado». |
| `habituales.tsx` | 278 | Ejercicios y sesiones habituales. |
| `plantillas.tsx` | 177 | Guardar como plantilla y empezar desde una. |
| `importacion.tsx` | 241 | Importar un ejercicio desde wger. |
| `ejecuciones.tsx` | 364 | Ejecuciones del período con filtros; exporta piezas que reutiliza la ficha. |
| `comparacion.tsx` | 1.058 | Gráficos de planificado y registrado; la ficha embebe `EvolucionDelEjercicio`. |
| `series-y-tiempos.tsx` | 181 | Una sesión serie por serie frente a su objetivo histórico, con tiempos. |
| `revisiones.tsx` | 376 | Contexto, registrar y aplicar; recibe `preparar=1`. |

**`ADV\anthropometry`: 11 archivos, 3.970 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara. |
| `antropometria.tsx` | 123 | Pestañas Evaluaciones / En preparación / Evolución / Lámina. |
| `evaluaciones.tsx` | 434 | Tomas registradas en solo lectura; corregir y anular por medición. |
| `preparacion.tsx` | 596 | Captura de una toma sobre la figura con lista densa; registrar aparte de guardar. |
| `figura.tsx` | 115 | Silueta SVG con los puntos del protocolo. |
| `calculos.tsx` | 408 | Cálculos de una evaluación: métodos, entradas y resultados sin ranking. |
| `evolucion.tsx` | 106 | Período, métrica y, por métrica, el gráfico. |
| `grafico-de-evolucion.tsx` | 408 | Gráfico de puntos con panel y tabla equivalentes. |
| `lamina.tsx` | 594 | Controles de la lámina y armado de sus datos. |
| `lamina-dibujo.tsx` | 1.078 | La lámina 1080×1920 como SVG. |
| `lamina-descarga.tsx` | 84 | Descarga la lámina como PNG. |

**`ADV\forms`: 3 archivos, 522 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara. |
| `formularios.tsx` | 250 | Pestaña «Información»: Solicitudes y Pedir, con retorno a la ficha. |
| `pedir.tsx` | 248 | Elegir plantilla, campos y propósito; es el destino de «Solicitar contexto». |

**`WEB\app\pro\templates`: 5 archivos, 871 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara con migas. |
| `mis-plantillas.tsx` | 239 | Plantillas de entrenamiento: lista, detalle, renombrar, archivar. |
| `mis-plantillas-nutricion.tsx` | 179 | Lo mismo para comidas. |
| `mis-habituales.tsx` | 234 | Sesiones y ejercicios habituales. |
| `mis-habituales-nutricion.tsx` | 195 | Comidas y alimentos habituales. |

**`WEB\app\pro\recipes`: 5 archivos, 975 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara. |
| `mis-recetas.tsx` | 135 | Lista de recetas; la abierta va en `?receta=`. |
| `editor-de-receta.tsx` | 539 | Crear o editar una receta. |
| `calculo-de-receta.tsx` | 59 | Tabla de nutrientes por receta y por porción. |
| `imagen-de-receta.tsx` | 218 | Elegir, cargar, reemplazar o retirar la imagen. |

**`WEB\app\pro\exercises`: 3 archivos, 440 líneas**

| Archivo | Líneas | Qué hace |
|---|---|---|
| `page.tsx` | 24 (S) | Cáscara. |
| `mis-ejercicios.tsx` | 124 | Lista y alta de ejercicios propios. |
| `imagen-de-ejercicio.tsx` | 292 | Imagen del ejercicio con procedencia, autoría, licencia y revisión técnica. |

---

## Tabla final: pieza → archivos → líneas → dificultad

| Pieza | Archivos | Líneas | Dificultad | Por qué |
|---|---|---|---|---|
| Tokens y temas | `tokens.css`, `WEB\lib\apariencia.ts`, `WEB\components\apariencia.tsx`, `layout.tsx`, `contraste.test.cjs` | 124 + 69 + 49 + 34 (+371 de prueba) | **Media** | Cambiar valores es simple, pero cada color pasa por la prueba de contraste, de matiz y de ΔE. Un tercer tema toca cuatro lugares con nombres escritos a mano. Los radios, la letra y el espaciado no están tokenizados. |
| Hoja global | `globals.css` | 3.647 | **Alta** | Un solo espacio de nombres para público, cuenta, ficha y pestañas. Las clases base se usan en todos lados y hay CSS huérfano. La complejidad es baja; la superficie de impacto, alta. |
| Encabezado global, navegación y migas | `encabezado.tsx`, `navegacion.tsx`, `migas.tsx`, `CSS:121-283,790-811` | 28 + 57 + 26 | **Media** | Poco código y bien centralizado, pero es de servidor y lo comparten las 19 páginas. Hay que conservar «Saltar al contenido» y el aviso de ambiente; sus pares de contraste tienen prueba propia. |
| Encabezado de la ficha | `workspace.tsx:144-162,200-221`, `CSS:3196-3243` | unas 45 de JSX en 249 | **Baja** | Marcado chico y separable de la revalidación de acceso. Sumar «Solicitar contexto» es agregar un `<Link>` con `conRetorno`. Mostrar una referencia técnica es una decisión nueva. |
| Pestañas y período | `barra.tsx`, `pestanas.tsx`, `estado.ts:21-93`, `CSS:1000-1029,2637-2702,1813-1835` | 89 + 70 | **Baja** | Autocontenido. `Pestanas` y `.chip` son compartidos. Pasar a `tablist` cambiaría el contrato de teclado. |
| Resumen | `resumen.tsx`, `CSS:3058-3119,3245-3424` | 875 | **Media** | 12 componentes en un archivo, con los textos adentro. La regla de la primera pantalla obliga a cuidar la altura. La síntesis viene del dominio y tiene pruebas. |
| Línea de tiempo | `linea-de-tiempo.tsx`, `CSS:2704-2827,3624-3634` | 455 | **Baja a media** | Autocontenida; los filtros ya están en la URL. Los títulos y detalles vienen de la API. |
| Detalle / origen del dato | `registro-original.tsx`, `CSS:756-772,2829-2857` y 4 componentes de las pestañas de área | 222 (+ajenos) | **Media** | El `<dialog>` es simple, pero el contenido es de Nutrición y Entrenamiento: cambiarlo cambia esas pestañas. |
| Analizar: cáscara, controles, lectura, tabla | `analizar.tsx`, `selector.tsx`, `preguntas.tsx`, `vistas-guardadas.tsx`, `informacion.tsx`, `CSS:2859-3050,3426-3516` | 1.180 + 318 + 329 + 234 + 173 | **Alta** | El archivo más grande, con mucho estado derivado. Las ramas cambian según la pregunta y la grilla no puede reordenar el documento. Es donde más apuntan los recorridos automatizados. |
| Gráficos de Analizar | `lienzo.tsx`, `series.ts`, `valores.ts`, `CSS:1643-1720,3022-3031` | 332 + 263 + 18 | **Media** si solo se cambian colores, tamaños y marco; **alta** si cambia la codificación | Forma, trazo, hueco, clase del dato, tramos, bandas, teclado y aro de selección están especificados por reglas y descritos en la leyenda. Recharts 3 con puntos a medida. |
| Etapas y contraste | `etapas.tsx`, `contraste.tsx`, `CSS:3518-3608` | 239 + 280 | **Media** | Tablas con cobertura que no se puede plegar ni achicar. El contraste de entrenamiento embebe `comparacion.tsx` (1.058). |
| «Preparar revisión» | Enlaces en `resumen.tsx` e `informacion.tsx`; `retorno-y-preparacion.tsx`; dos `revisiones.tsx`; `evidencia-de-revision.tsx` y `evidencia.ts`; `CSS:555-626` | 72 + 415 + 376 + 166 + 70 | **Baja** para el botón; **media** para el flujo | El botón es un enlace. El formulario vive en dos archivos casi gemelos, y «ver no es revisar» fija qué puede venir prearmado. |
| Íconos e isotipo | No existen para el área profesional | 0 | **Media** | Trabajo nuevo: sin CDN, con `currentColor` o tokens, 3:1 si comunican y nombre accesible o `aria-hidden`. El isotipo es PNG; no hay SVG. |
| Textos | `.tsx` de la ficha (75 %) y `DOM` (25 %) | — | **Media** | No hay un lugar único. La prueba de palabras prohibidas no cubre `SEG\`. Los textos del dominio tienen valores exactos en pruebas. |
| Espacio profesional `/pro` | `page.tsx`, `espacio-profesional.tsx`, `pendientes.tsx`, `CSS:789-875` | 473 | **Baja a media** | Tres secciones y un lateral. El hook de sesión lo comparten todas las páginas pro. |
| Pestañas de área y bibliotecas | `nutrition`, `training`, `anthropometry`, `forms`, `templates`, `recipes`, `exercises` | 3.487 + 5.030 + 3.970 + 522 + 871 + 975 + 440 | **Baja** si solo heredan tokens y clases; **alta** si se recomponen | Tienen editores de 782 y 972 líneas, la lámina de 1.078 y `comparacion.tsx` de 1.058. Nutrición, Entrenamiento y Antropometría sí tienen prueba de copy. |

## Lo que no pude determinar leyendo

- **Cómo se ve hoy.** No rendericé nada; los altos, solapamientos y la primera pantalla a 1280×800 salen de la guía y del CSS. Hay capturas en `R\EVIDENCIA\DASHBOARD-COMPRENSION\` (`antes`, `despues`, `recorridos`) que no abrí.
- **Si los tres `<a href>` internos cierran la sesión en la práctica** (§7).
- **Si `ADV\tarjetas-de-dominio.tsx` y `WEB\marca\isotipo-be.png` se conservan a propósito.** Solo consta que no tienen referencias.
- **Si «Inter» se llega a ver.** No hay archivo de fuente; depende de que esté instalada en el equipo.
- **Si los recorridos de `EVIDENCIA\…\herramientas\` son condición de aceptación** del rediseño. No están en `npm test` ni en la CI.
- **Qué puede cambiar por decisión de Dirección:** el encabezado navy en los dos temas, «Azul noche» como predeterminado y las superficies mates. La guía figura «a ratificar».
- **El comportamiento fino de Recharts** (cómo une puntos `connectNulls` dentro de un tramo, el arrastre con `activeLabel`): leí el código, no lo ejecuté.
- **Que la tabla de la ficha sin encabezados en pantallas angostas sea intencional** (`CSS:1156-1182`).
