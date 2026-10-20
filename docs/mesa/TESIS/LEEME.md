# Tesis v1 de BE: punto de entrada

Primera versión profesional de la documentación de tesis de BE (Analista de Sistemas, Escuela Da Vinci, según
«Entregables del proyecto», versión 2025.05) y la base de su defensa. Describe la versión de referencia `main`
`0fb1bff` (2026-10-20), desplegada en el ambiente test.

## Qué leer primero

1. **El documento:** `salida/BE-tesis-v1.pdf`, la versión pública: los 14 apartados en el orden de la escuela y los
   anexos A a L. Tiene rótulo, índice navegable y numeración de páginas.
2. **La defensa:** `defensa/LEEME.md` (guion, demo con plan B, preguntas probables y la presentación).
3. **El avance y cómo seguir:** `PROGRESO.md`.

La **versión de evaluación** (con el logotipo de la escuela, los integrantes y las credenciales del apartado 14) no se
guarda en el repositorio, que es público: se compila con `--evaluacion` y queda en
`C:/Users/bufim/BE-datos-locales/tesis/salida/`, junto a sus datos privados (`privado.json`).

## Qué hay en cada carpeta

| Carpeta | Contenido |
|---|---|
| `documento/` | La fuente del documento, en Typst: `tesis.typ`, la plantilla y un archivo por apartado y por anexo |
| `laminas/` | El motor de láminas (`motor/`), la fuente única de cada una de las 44 láminas (`fuentes/`), los SVG que inserta el documento (`generado/`), sus exportaciones en SVG, PDF y PNG (`exportaciones/`) y la revisión automática (`revision.json`) |
| `datos/` | Los datos del documento, generados desde el código y el legajo por las herramientas |
| `herramientas/` | Los programas que generan esos datos, capturan pantallas y corren las pruebas del documento |
| `estilo/tokens.json` | La guía de estilo: colores, trazos, tipografías y tamaños, para las láminas y el documento |
| `evidencia/` | Las verificaciones en test del 2026-10-20, con sus guiones |
| `fuentes/` | Material de consulta con fecha (la competencia, consultada el 2026-10-20) |
| `defensa/` | La base de la defensa |
| `tipografias/` | Inter y JetBrains Mono, con sus licencias |

## Cómo regenerar

Con Node 22 (`fnm exec --using=22`) y Typst 0.15.1 (`herramientas/typst.mjs` lo busca en
`C:/Users/bufim/BE-herramientas/typst-0.15.1/`), desde esta carpeta:

| Comando | Qué hace |
|---|---|
| `node laminas/construir.mjs [ID]` | Dibuja una o todas las láminas, con su revisión automática y sus exportaciones |
| `node construir-documento.mjs` | Compila `salida/BE-tesis-v1.pdf` |
| `node construir-documento.mjs --png <carpeta>` | Además, una imagen por página, para revisarlas |
| `node construir-documento.mjs --evaluacion` | Compila la versión de evaluación, fuera del repositorio |
| `node herramientas/<herramienta>.mjs` | Regenera los datos del documento desde el código |
| `node herramientas/prueba-de-explicacion.mjs` | Prueba que cada lámina se explique en 30 a 60 segundos |

## Lo que completa Dirección antes de enviar

- Los correos institucionales, la nómina completa del grupo y el mes y año de presentación (`privado.json`).
- El diagrama de Gantt (apartado 10) y las URL de los apartados 11, 12 y 13.
- El envío: un integrante, desde su correo institucional, con copia al resto, a `coordinacion.as@davinci.edu.ar`
  (anexo A, con su lista de control). Esta versión no envía nada.

## Reglas que se respetaron

Cada afirmación sale del código, del legajo o de una verificación con fecha; lo que no está hecho se marca como
pendiente o fuera de alcance, y los defectos encontrados están en el anexo K, sin cambiar el producto para que coincida
con un gráfico. El legajo (`docs/legajo/`) y lo registrado en `docs/MANIFEST.sha256` no se tocaron. Las credenciales,
los correos y el logotipo de la escuela quedan fuera del repositorio.
