# Evidencia de WP-TABLERO-ALTA-GAMA

El paquete: `docs/paquetes/WP-TABLERO-ALTA-GAMA.md`. Sus oráculos: `docs/paquetes/WP-TABLERO-ALTA-GAMA-ORACULOS.md`. Solo
datos sintéticos: la cohorte de `EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/cohorte/` (08 §33).

## Cómo se captura

Esta PC no levanta la API, el website y PostgreSQL juntos. Las capturas las hace la CI, en el trabajo
`capturas-del-tablero` (`.github/workflows/capturas-del-tablero.yml`). Corre en las ramas `wp-tablero-*` cada vez que
cambia el website o el dominio, y también a pedido.

1. Carga la cohorte en un PostgreSQL efímero y levanta la API y el website compilados, con la CSP de `render.yaml`.
2. Captura en Claro y en Azul noche, a 1280 × 800, a 1440 × 900 y a 1920 × 950, que es el área útil de un monitor de
   1920 × 1080. De cada página guarda la primera pantalla y la página entera:
   - **Diego Sosa visto por Sofía Paz** (Nutrición y Antropometría): el Espacio profesional, el Resumen de la ficha,
     «Analizar» (la entrada y, desde TB-04, el gráfico con Calorías elegida), Nutrición y Antropometría. Desde TB-09,
     también el Resumen de **Federico Álvarez**, con una revisión registrada sin aplicar.
   - **Diego Sosa visto por Martín Acosta** (Entrenamiento): el Espacio, el Resumen y Entrenamiento.
3. Cuenta las peticiones a la API al abrir cada página (TEST-TAG-032) y anota el alto de cada página en
   `mediciones.json`, con la acción que ofrece el marco de la ficha (`accionDelMarco`, TB-09).
4. Desde TB-05, prende «Ocultar nombres» y recorre el Espacio y el Resumen de cada profesional (TEST-TAG-004): si
   aparece una palabra de un nombre de la cohorte o un monograma con iniciales, la corrida falla. Lo anota en
   `ocultarNombres`.
   Desde TA-71, en el Espacio de cada profesional, en cada tamaño y en los dos temas, y otra vez con «Ocultar nombres»,
   mide que el monograma, el nombre y el área de cada ficha de «Tu semana» queden adentro de su columna
   (`herramientas/tu-semana.mjs`): si algo se pasa, o si no midió ninguna ficha, la corrida falla. Lo anota en
   `tuSemana`, en cada fila, y en `tuSemanaQueSePasa`; con los nombres ocultos guarda además «Tu semana» sola
   (`<profesional>/<tema>/tu-semana-nombres-ocultos-<ancho>.png`).
5. Sube todo como el artefacto `capturas-del-tablero` de esa corrida, que dura 90 días. Las primeras pantallas de cada
   etapa se copian acá.

La herramienta es `herramientas/capturas.mjs`. Su encabezado dice cómo correrla.

## Las capturas

- **TB-00 · La línea de base:** `linea-de-base/<profesional>/<tema>/<página>-<ancho>.png`, las primeras pantallas de la
  corrida 42154091600 (dbf19eb, con el website igual al de `main` b91dc3f), y `linea-de-base/mediciones.json`, con
  el alto de cada página y las peticiones a la API al abrirla. Las páginas enteras están en el artefacto de esa corrida.
