# Fuentes de la entrega, en Markdown

Los documentos de la entrega existían solo como PDF y como HTML intermedio en
`BE-para-ChatGPT/entrega-tutor-final/` (y su carpeta `_trabajo/`): las fuentes del generador se perdieron con la carpeta
temporal. Acá queda una fuente en Markdown de cada uno, **ya actualizada con los repasos del 19, el 20 y el 23/11 y con la actualización del 27/11**, para
pasarlas a Claude Docs y editarlas cuando algo cambie.

- **Las imágenes no se copian.** En su lugar queda `![Figura N: descripción](pendiente)`. Cuando la figura era un esquema
  armado con texto (una infografía propia), debajo queda su texto, «Texto de la figura», para poder rehacerla.
- **Los esquemas que eran texto** (pasos, tarjetas, matrices, datos, fichas de clases) quedan como listas y tablas.
- **Los diagramas van en Mermaid** donde es razonable: el DER y las clases por módulo (14 y 15), el contexto, los
  contenedores, el despliegue y la escritura (16), la vista en capas y las dependencias entre módulos (17) y el Gantt (18).
- **Las referencias a páginas** («pág. 12») se quitaron: en Claude Docs no hay páginas.
- **Nada de esto lleva credenciales.** El repositorio es público: las cuentas del tutor van en un documento privado, y
  donde iban queda `[CUENTAS DEL TUTOR: se completan en el documento privado]`.

## Índice

| Archivo | Documento | De dónde salió |
| --- | --- | --- |
| `00-resumen-y-guia.md` | 00 · Resumen y guía | `_trabajo/00 Resumen y guía/00 Resumen y guía.html` |
| `03-acta-del-proyecto.md` | 03 · Acta del proyecto | `_trabajo/03 Acta del proyecto/03 Acta del proyecto.html` |
| `09-manual-del-profesional.md` | 09 · Manual del profesional | `_trabajo/09 Manual del profesional/09 Manual del profesional.html` |
| `10-casos-de-uso.md` | 10 · Casos de uso | `_trabajo/10 Casos de uso/10 Casos de uso.html` |
| `11-casos-de-prueba.md` | 11 · Casos de prueba | `_trabajo/11 Casos de prueba/11 Casos de prueba.html` |
| `12-rf-y-rnf-web.md` | 12 · RF y RNF Web | `_trabajo/12 RF y RNF Web/12 RF y RNF Web.html` |
| `13-rf-y-rnf-mobile.md` | 13 · RF y RNF Mobile | `_trabajo/13 RF y RNF Mobile/13 RF y RNF Mobile.html` |
| `14-der.md` | 14 · DER | `_trabajo/14 DER/14 DER.html`, con las piezas regeneradas del esquema |
| `14-der-fuente.dbml` | 14 · DER, el modelo para dbdiagram.io | `14 DER - fuente.dbml` (15/11), regenerado de `prisma/schema.prisma` |
| `15-diagrama-de-clases.md` | 15 · Diagrama de clases | `_trabajo/15 Diagrama de clases/15 Diagrama de clases.html`, con los diagramas y las fichas regenerados |
| `16-diseno-de-arquitectura.md` | 16 · Diseño de arquitectura | `_trabajo/16 Diseño de arquitectura/…html` y los Mermaid de `entrega-2026-11-13/fuentes de diagramas` |
| `17-diagrama-de-componentes.md` | 17 · Diagrama de componentes | `_trabajo/17 Diagrama de componentes/…html` y los Mermaid de `entrega-2026-11-13/fuentes de diagramas` |
| `18-gantt.md` | 18 · Gantt | `_trabajo/18 Gantt/18 Gantt.html`; el Gantt, en Mermaid desde la tabla de tareas |
| `19-foda.md` | 19 · FODA | `_trabajo/19 FODA/19 FODA.html` |
| `20-mapa-de-empatia.md` | 20 · Mapa de empatía | `_trabajo/20 Mapa de empatía/20 Mapa de empatía.html` |
| `21-buyer-persona.md` | 21 · Buyer persona | `_trabajo/21 Buyer persona/21 Buyer persona.html` |
| `22-benchmarking.md` | 22 · Benchmarking | `_trabajo/22 Benchmarking/22 Benchmarking.html` |
| `23-scamper.md` | 23 · SCAMPER | `_trabajo/23 SCAMPER/23 SCAMPER.html` |
| `24-analisis-de-viabilidad.md` | 24 · Análisis de viabilidad | `_trabajo/24 Análisis de viabilidad/24 Análisis de viabilidad.html` |
| `como-probar-be.md` | Cómo probar BE | Reescrito sobre la muestra del tutor, con la estructura de `_trabajo/Cómo probar BE/Cómo probar BE.html` |
| `consentimiento-de-be.md` | Consentimiento de BE | `_trabajo/Consentimiento de BE/Consentimiento de BE.html` |
| `be-como-empresa-legal.md` | BE como empresa legal | `_trabajo/BE como empresa legal/BE como empresa legal.html` |
| `requisitos-del-entorno-del-tutor.md` | Requisitos del entorno del tutor | `_trabajo/Requisitos del entorno del tutor/…html` |
| `decisiones-para-ratificar.md` | Decisiones para ratificar (19/11) | `scratchpad/premium/fuentes-v2/Decisiones para ratificar.md` (no tenía HTML) |
| `herramientas/generar-der.mjs` | El generador del DBML y de las piezas del 14 y el 15 | Nuevo: lee `prisma/schema.prisma` y conserva las notas de la fuente DBML |

Los tres últimos documentos de trabajo («Consentimiento de BE», «BE como empresa legal» y «Decisiones para ratificar»)
no son entregables de Da Vinci: quedan como estaban, salvo la licencia en «BE como empresa legal».

## Qué se actualizó el 27/11

Sobre `main` en b96b3e0c: lo integrado del 23 al 26/11 (DL-195 a DL-200, del #320 al #329). Las cifras se contaron de nuevo
desde el código y son las mismas en todos los documentos.

**Las cifras.** 168 tablas, 1.536 columnas, 334 claves foráneas (187 entre módulos, 128 llegan a Identidad y acceso), 115
conjuntos de valores, 187 columnas jsonb y 107 migraciones (`prisma/schema.prisma` y `prisma/migrations`); 35 módulos de
la API, 50 controladores, 123 clases inyectables, 350 rutas y 346 operaciones publicadas (`apps/api/src` y
`docs/api/openapi.json`); 108 operaciones que lee la app (`packages/domain/fixtures/lecturas-de-la-apk/`); 39 páginas del
website; 57 casos de uso, 66 RF (57 del website y 31 de la app, algunos compartidos), 32 y 33 RNF y 100 casos de prueba.

| Documento | Lo que se aplicó |
| --- | --- |
| 00 | Las cifras en «Cómo está construido»; el editor de Entrenamiento por fases, el 1RM de referencia, las Plantillas de BE, el cardio, el esfuerzo de la sesión, los recorridos guiados y el resultado encadenado de Antropometría (§2.1); «período» en lugar de «temporada» y Epley sin versión (§2.3); §6 sin los manuales de la persona y de Administración ni el video, que no están, y dónde van los apartados 01 a 08. |
| 03 | El alcance (Tabla 3): el plan de entrenamiento con el editor nuevo, el registro con la carga de la semana y el esfuerzo de la sesión, Antropometría con el resultado completo de cada método, los recorridos guiados y las Plantillas de BE en Administración; las cifras en las tecnologías; «período» y Epley sin versión. |
| 09 | §2.4 reescrita sobre el editor nuevo; §2.5 con el 1RM congelado al activar (ET2-D18); §3.4 con los resultados encadenados (DL-200); §6.1 con las Plantillas de BE; sin las referencias a los manuales que no están. Las figuras 8, 9, 9b y 15b llevan «[Figura a recapturar: …]» con lo que tienen que mostrar. |
| 10 | UC-P15 (el editor nuevo), UC-P16 (el 1RM congelado), UC-P17 (la carga de la semana y el esfuerzo de la sesión) y UC-P36 (las Plantillas de BE en Administración, paso 5). |
| 11 | Epley sin versión. |
| 12 | RF-039, RF-040, RF-041 (el editor nuevo y la activación con el 1RM), RF-048 (los resultados encadenados) y RF-072 (las Plantillas de BE en Administración); el segundo factor, solo de Administración; Epley sin versión; las cifras. |
| 13 | RF-042 (la carga de la semana) y RF-043 (el esfuerzo de la sesión); el segundo factor, solo de Administración; las cifras. |
| 14 | El DBML y las piezas regenerados con `herramientas/generar-der.mjs` (las cinco tablas nuevas, con su módulo en el generador); las cifras; los párrafos de las tablas nuevas en sus módulos (02, 08, 09 y 12); el segundo factor, hoy solo de Administración. |
| 15 | Los diagramas por módulo regenerados; las cifras de la API; las fichas nuevas (PlantillasDeBeAdminService, PlantillasDeBeController, EditorDeEntrenamientoTanda2Controller, PlantillasDeBeService, UnoRMService, EsfuerzoDeLaSesionService y el módulo Recorridos guiados); la sección 5 nueva, con dos Mermaid: la jerarquía del plan y los estados de una versión. |
| 16 | Las cifras; §4.1 nueva, la activación de un plan de entrenamiento en un diagrama de secuencia Mermaid. |
| 17 | Las cifras; las 39 páginas (con `/admin/training-templates`); Entrenamiento y Administración en la Tabla 1, y la fila de Recorridos guiados. |
| 23, 24 | Epley sin versión (23); las cifras (24). |
| Cómo probar BE | El editor nuevo en el recorrido corto de la profesional (pasos 5 y 6) y en «Activar un plan», con «Pedir el esfuerzo de la sesión al terminar»; la pregunta del esfuerzo en «Registrar». La figura 5, a recapturar. |
| Decisiones para ratificar | Sección nueva, «La entrega del 27/11»: lo que se escribió como refinamiento de un ID que ya existe. |

**Para regenerar el DBML y las piezas del 14 y el 15:**
`node docs/entrega/fuentes/herramientas/generar-der.mjs prisma/schema.prisma docs/entrega/fuentes/14-der-fuente.dbml docs/entrega/REPASO-DE-LA-ENTREGA-2026-11-23.md prisma/migrations <carpeta fuera del repo>`.
Una tabla nueva necesita su módulo en `MODULO_NUEVO`; después, `14-der-fuente.dbml` se copia y las piezas (`<!-- TABLA nn -->`,
`<!-- MERMAID nn -->`, `<!-- DICCIONARIO nn -->`, `<!-- CLASES nn -->`, la matriz y los conjuntos) reemplazan las del 14 y el 15.

**Los PDF.** Estas fuentes no tienen un generador de PDF: el que armó los PDF y el HTML de `entrega-tutor-final` se perdió
(ver arriba). Los PDF se rehacen desde Claude Docs, donde se pegan estas fuentes.

**Lo que no entra todavía.** DL-201 a DL-204 y el recetario de 150 recetas están en PR sin integrar. Si se integran, hay
que sumar: las tablas o migraciones nuevas que traigan (regenerar el 14 y el 15 y volver a contar las cifras de esta
sección en el 00, 03, 12, 13, 14, 15, 16, 17 y 24), su lugar en el alcance del 00 y el 03, la tarea del 09 que cambie, los
UC y RF que refinen (o sus IDs nuevos, en «Decisiones para ratificar»), y en el 03 y el 09 el Recetario con 150 recetas.

## Qué se actualizó hasta el 23/11

| Documento | Lo que se aplicó |
| --- | --- |
| 00 | El contexto de la persona en el editor, las plantillas sin persona y el objetivo apoyado en una toma (19 y 20/11); aceptar y compartir en una sola pantalla; el segundo factor, solo para Administración; «Lo que viene en la planificación» (las cinco líneas futuras del 23/11) en «Hacia dónde va». |
| 03 | El alcance al día (acceso, compartir, evaluación con «Calcular», plan de nutrición con reparto y franjas, fases, bloques, calentamiento y RPE, Kerr, el Recetario de BE, el catálogo verificado y la revisión de Administración); las licencias; lo que ve Administración; las líneas futuras en «Proyección». |
| 09 | «Entrar» sin el segundo factor; la evaluación con la franja de los pasos, los tres bloques, «Anotaciones», «Completarlo ahora con» y «Calcular»; el plan de Nutrición sin el asistente, con lo que aporta cada alimento, las medidas caseras, el reparto, las franjas, la imagen de la receta y «Usarla ahora»; fases, bloques, calentamiento, límites y RIR o RPE; Kerr y «Qué vas a calcular»; el Recetario y las plantillas sin persona; dos tareas nuevas (2.7, el contexto de la persona, y 6.2, «Mis alimentos»); «Hay datos nuevos · Ver» en lugar de «Actualizar» en la ficha. |
| 10 | UC-P36, UC-P37, UC-E10 y UC-E11 (57 casos); el acceso del profesional; compartir en una pantalla (P05, P07, P08); la evaluación (P09, P14); el plan sin asistente (P10); fases, calentamiento y RPE (P15, P17); los métodos antes de medir (P19); «período» en lugar de «temporada» y «estación». |
| 11 | La corrida 45207298181 de la rama principal (23/11, bd6b7900): 4.881 casos y 414 archivos, por capa, y 30 recorridos en el navegador; CP-04 y CP-11 reescritos; CP-74 a CP-100 con su prueba; T-10 y T-11 en el teléfono. |
| 12 | RF-072 y RF-073 (57 requisitos, 32 propios); los refinamientos del 19, el 20 y el 23/11 en RF-002, 023, 026, 027, 029, 030, 036, 039, 040, 045, 047, 048, 070 y 071, y en los RNF SEC-003, SEC-005, PRI-001, ACC-001, ACC-003 y MAN-002; la cabecera de las áreas; las cifras de mantenimiento. |
| 13 | Compartir e interruptores (RF-019, 020, 022, 023); el carrusel y la foto que se achica (RF-032, 033); fases, bloques, calentamiento y RPE (RF-042, 043); Kerr (RF-048, 049); los RNF de imagen, TalkBack y campos nuevos; las cifras. |
| 14 | El DBML regenerado del esquema (163 tablas: las 5 del Recetario e imágenes con las notas del repaso del 23/11, y las 12 del 19 y el 20/11); las cifras recontadas (1.490 columnas, 326 claves, 108 conjuntos, 102 migraciones); la matriz de módulos; un diagrama Mermaid, la tabla y el diccionario de cada módulo; lo nuevo de cada módulo y las reglas del recetario. |
| 15 | Un diagrama de clases Mermaid por módulo de persistencia (163 clases, 326 asociaciones); la API recontada (47 controladores, 119 clases inyectables, 339 rutas); las fichas de las 24 clases que faltaban; las reglas puras del dominio; las 15 subclases del ejecutor. |
| 16 | Las cifras (34 módulos, 335 operaciones, 163 tablas); el acceso del profesional como decisión; tres decisiones más (la misma función en todos lados, con RIR, RPE y Kerr; el mismo 404 para lo ajeno; la capacidad declarada); los cuatro diagramas en Mermaid. |
| 17 | Los módulos recontados (Compartir, Contexto de la persona, Evaluación con formularios); las 38 páginas; la app con el carrusel, el título fijo y el selector de RPE; las reglas compartidas; la vista en capas y las 17 dependencias en Mermaid. |
| 18 | El acceso del profesional; las tres tareas del 15 al 22/11; el Gantt en Mermaid. |
| 19, 23, 24 | El segundo factor, solo para Administración (19 y 24); la fortaleza del calculador (19); el RPE de la sesión y el carrito familiar en la proyección (23); la AAIP, el consentimiento expreso y las licencias (24). |
| Cómo probar BE | Reescrito sobre la cartera de la Lic. Julieta Arce y la app como Carolina R., sin el autenticador del profesional, con cinco personas que muestran cada una algo distinto y lo del 23/11 (carrusel, reparto y franjas, RPE, Recetario, «Hay datos nuevos · Ver»). |
| Requisitos del entorno del tutor | La sección «Cuentas para probar» con el marcador; sin el nombre técnico de la persona en el texto. |
| BE como empresa legal | El código ya declara su licencia (todos los derechos reservados, Ley 11.723). |

## Lo que espera una decisión de Elián

- **Los IDs propuestos el 20 y el 23/11 ya están escritos en los documentos:** RF-073 (12), UC-E10 y UC-E11 (10) y
  CP-86 a CP-100 (11). Si alguno no se ratifica: RF-073 vuelve a ser un refinamiento de RF-029; UC-E10 y UC-E11, pasos
  de UC-P09 y UC-P14; los CP, filas que se quitan. RF-072, UC-P36 y UC-P37 son los que se decidieron el 19/11.
- **El Recetario de BE** quedó como refinamiento (RF-027 y RF-072, y UC-P36). La alternativa es un RF-074 propio.
- **Las figuras nuevas** llevan una letra (6b, 6c, 9b, 15b, 26b en el 09) para no renumerar; la figura 2 del 09
  («Confirmá que sos vos») se fue con el segundo factor del profesional. Al pasar a Claude Docs se pueden renumerar.

## Las imágenes que faltan

Todas las imágenes están como `(pendiente)`. Las capturas que el repaso del 23/11 pide rehacer (§5) tienen ya el epígrafe
nuevo: en el 09, las figuras 6, 6b, 6c, 7, 8, 9, 9b, 10, 15, 15b, 16 y 26b; en el 12, las figuras 3 y 5; en «Cómo probar
BE», las figuras 2, 3 y 5, sobre la muestra del tutor. El manual de la persona y el de Administración todavía no existen. El 27/11 suman recaptura, con su texto «[Figura a recapturar: …]»: en el 09, las figuras 8, 9, 9b y 15b; en «Cómo probar BE», la figura 5.

| Documento | Imágenes pendientes | Qué son |
| --- | --: | --- |
| 00 | 8 | Esquemas (el mapa de BE, hoy y con BE, la persona en el tiempo, dos períodos, la continuidad, el ciclo, los resultados de una revisión) y los enlaces con QR |
| 03 | 7 | Los mismos esquemas del 00 y los dos usuarios de BE |
| 09 | 29 | Capturas del website (todas sobre la historia de Diego Sosa, salvo las nuevas) |
| 10 | 15 | El mapa de casos, la anatomía de una ficha, la notación, los actores y un diagrama de casos de uso por módulo |
| 11 | 1 | El historial de la sentadilla (captura) |
| 12 | 7 | Las baldosas de los requisitos, lo que aporta el website, el editor de Entrenamiento, el historial, la toma y los RNF |
| 13 | 5 | Lo que suma la app, las pestañas, teléfono y servidor, las baldosas de RF y RNF |
| 14 | 82 | La franja de módulos, la notación, los dos patrones y las láminas con campos de cada módulo. Las láminas se pueden dibujar desde `14-der-fuente.dbml` en dbdiagram.io o desde el Mermaid de cada módulo, que ya tiene los campos |
| 15 | 7 | Las dos capas, la notación, la persistencia de un vistazo, el núcleo y las tres operaciones |
| 16 | 1 | Los cuatro zooms del modelo C4 |
| 17 | 2 | Los módulos en franjas y las capas de los gráficos |
| 18 | 1 | Los hitos |
| 19 a 24 | 25 | Los esquemas de cada análisis de negocio |
| Cómo probar BE | 4 | Los enlaces con QR y tres capturas sobre la muestra del tutor |

## Lo que no se pudo extraer bien

- **El texto de las infografías** se sacó del HTML en el orden en que aparece: sirve para rehacerlas, pero algunas
  quedan con cifras pegadas a su rótulo (las baldosas de requisitos del 12 y el 13, el mapa de casos del 10, las
  columnas del SCAMPER). Donde el texto era ruido (el mapa de módulos del 14, las láminas del 15) se quitó.
- **Las láminas del 14 y del 15 eran SVG:** no tienen texto recuperable. Se reemplazaron por los diagramas Mermaid
  generados del esquema; en el 14 quedan además sus epígrafes como pendientes.
- **Las fichas de las 24 clases nuevas del 15** salen de leer el código: los métodos públicos, lo que reciben y las
  tablas que usan con Prisma en el mismo archivo. Lo que escriben a través de su ejecutor no siempre aparece en
  «Persistencia».
- **La columna «Métodos» del 15** (la tabla de la API por módulo) se quitó: el método de conteo del 15/11 no se pudo
  reproducir. Quedan controladores, clases y rutas, recontados del código.
- **El Gantt** era un SVG propio: ahora es un Mermaid armado desde la tabla de tareas, que se dibuja distinto.
- **«Cómo probar BE»** describe la muestra del tutor según su generador (`scripts/entorno-del-tutor`): hay que
  recorrerla en test, ya cargada, antes de entregar.
