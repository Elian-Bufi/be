# Base de la defensa

Lo necesario para defender BE ante la mesa, sobre la versión `main` `0fb1bff` (2026-10-20).

| Archivo | Qué es |
|---|---|
| `GUION.md` | El orden, los tiempos (unos 20 minutos) y, para cada lámina de la tesis, cómo explicarla en 30 a 60 segundos |
| `DEMO.md` | La demo de 7 minutos en las dos plataformas, con su plan B y los cuidados |
| `PREGUNTAS.md` | 22 preguntas probables, cada una con su respuesta y su respaldo |
| `DIAPOSITIVAS.md` | El texto de las 16 diapositivas y sus notas del orador (generado desde la fuente) |
| `presentacion/project/` | La fuente editable de la presentación: el índice y una sección HTML por diapositiva |
| `respaldo-demo/` | 12 capturas del website en test (20/10, API `0fb1bff`) y su `registro.json` |
| `explicaciones.json` | El resultado de la prueba de explicación: palabras y segundos de cada lámina |

**La presentación** está en https://claude.ai/artifact/9LiufGdUTJjAbEonGT8t2U: 16 diapositivas 16:9 con notas del
orador, letra de 18 pt como mínimo en proyección (36 px en un lienzo de 1920 × 1080). Es privada hasta que Dirección la
comparta desde el menú del propio mazo, y se descarga como PowerPoint o PDF. Las diapositivas no usan las láminas del
documento tal cual: en proyección su letra quedaría en unos 11 pt, así que llevan versiones simplificadas de los
diagramas y remiten a la lámina completa.

**Regenerar:** `node herramientas/prueba-de-explicacion.mjs` (la prueba de explicación),
`node herramientas/esquema-de-diapositivas.mjs` (este esquema, si cambia la fuente del mazo) y
`node herramientas/capturar-respaldo-demo.mjs` (las capturas del respaldo; ver `DEMO.md`).

**Antes de la mesa, a cargo de Dirección:** la nómina del grupo, los correos y el mes y año en la portada del mazo y de
la tesis; la versión de la APK para la demo; un ensayo completo; y, si se puede, capturas nativas de la APK candidata
para reemplazar los renders del plan B.
