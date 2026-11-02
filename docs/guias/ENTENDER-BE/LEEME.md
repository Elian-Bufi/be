# Entender BE · guía central, cuaderno de datos y plan de estudio

Material para que Dirección entienda, dirija y defienda BE sin depender de una IA, de lo macro a lo micro. Encargo
nocturno del 2026-10-27, §6 a §8. Commit de referencia: `e4512cb` (`datos/version.json`).

## Qué hay

| Archivo | Qué es |
|---|---|
| `salida/BE-guia-central.pdf` | La guía central, 24 páginas en cinco niveles: el sentido, las piezas, las reglas, dos recorridos completos y el cambio. 35 conceptos con término, explicación en criollo, ejemplo en BE y una pregunta |
| `salida/BE-cuaderno-de-datos.pdf` | El cuaderno de datos, 19 páginas: qué es la base y dónde está, las siete áreas del modelo y lo micro (claves, disparadores, transacciones, índices, historia y consultas SQL). 19 conceptos |
| `PLAN-DE-ESTUDIO.md` | Cuatro sesiones de 20 a 30 minutos, con los cinco ejercicios |
| `RESPUESTAS.md` | Las respuestas de los ejercicios y de las 54 preguntas «Para comprobar». Aparte, para mirarlas después de intentar |

## Cómo se arma

Las dos fuentes son Typst (`guia-central/guia.typ` y `cuaderno-de-datos/cuaderno.typ`) con una plantilla común
(`comun/plantilla.typ`). Los diagramas son vectoriales y se generan desde código: ninguno es una imagen generativa.

```bash
# desde docs/guias/ENTENDER-BE, con Node 22 y Typst 0.15.1 (variable TYPST, la carpeta de herramientas o el PATH)
node construir.mjs                    # láminas, guía y cuaderno
node construir.mjs --sin-laminas guia # solo la guía, con las láminas ya generadas
node construir.mjs --png cuaderno     # además, una PNG por página en salida/revision/ para revisarla
node laminas/construir.mjs G-08       # una lámina sola, con su revisión automática
```

## Las láminas

- `laminas/fuentes/`: una fuente por lámina. `G-xx` son de la guía; `D-xx`, del cuaderno. `_cuaderno-der.mjs` arma
  las vistas por área del DER.
- `laminas/motor/`: el motor de las láminas de la tesis (`BE-tesis`, `84442b6`), copiado. `vistas-der.mjs` se puso al
  día con DER-15, Administración: las 15 vistas cubren las 118 tablas.
- `laminas/generado/`: los SVG que usan los PDF. Se versionan.
- Cada lámina pasa una revisión automática antes de guardarse: fuente mínima de 10 pt, textos que no se pisan, rótulos
  que ningún conector atraviesa, densidad y cruces. Si falla, no se escribe.
- Colores y tipografía salen de `estilo/tokens.json`, los mismos de la tesis. Las fuentes (Inter y JetBrains Mono)
  están en `tipografias/`, con su licencia OFL.

## De dónde salen los datos

- `herramientas/leer-esquema.mjs` lee `prisma/schema.prisma` y escribe `datos/esquema.json` (118 modelos, 84
  enumeraciones, 218 relaciones).
- `herramientas/clasificar-tablas.mjs` clasifica las 118 tablas (`datos/clases-de-tablas.json`).
- `herramientas/restricciones-de-la-base.mjs` lee las migraciones (los 38 índices únicos parciales en
  `datos/indices-parciales.json`).
- Los números de pruebas son de la CI de `main` en `e4512cb` (corrida 40387350649).

Si cambia el esquema, se vuelven a correr las herramientas y `construir.mjs`, y se revisan las páginas.
