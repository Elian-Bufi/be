# Reproducción de la revisión del head fbeb256

Una revisión independiente del head `fbeb256` de #153 encontró cinco puntos. Antes de corregirlos se reprodujeron con
el head `fbeb256` compilado y corriendo en local. Estos scripts repiten esas reproducciones: contra `fbeb256` muestran
el problema; contra el head corregido, que ya no está. El resultado de cada corrida y la clasificación de cada hallazgo
(defecto del producto o insuficiencia de la evidencia) están en `../../ACEPTACION.md`, sección «Revisión del head
fbeb256».

| Script | Hallazgo | Qué hace |
|---|---|---|
| `reproducir-1-captura.mjs [ancho] [tema] [veces]` | 1 · gráficos vacíos en las capturas | Captura Analizar con `fullPage` (como en `fbeb256`) y con la ventana agrandada al alto de la página (como ahora), con un observador de la página; dice los eventos durante cada captura y si la imagen tiene los colores de las métricas |
| `reproducir-2-semanas.cjs [dominio]` | 2 · resúmenes con el grano semanal | Los números de la revisión (7 al 20 de septiembre; 16 al 20; comparación) con la serie de días y con la semanal |
| `reproducir-3-y-4.mjs` | 3 · referencia y zoom · 4 · texto buscado en URLs | La referencia antes y después de acercar y restablecer; las URL y los cuerpos de los pedidos a la API durante una búsqueda |

El hallazgo 5 (valores estimados y revocación desde la interfaz) no tenía un defecto que reproducir: faltaba la prueba.
La hace `../recorrido.mjs descartable`, con cuentas descartables (`../../DATOS-SINTETICOS.md` §8).

## Cómo correrlos

Con la web y la API locales en marcha y los datos de `../datos/regenerar.sh` (ver `../../ACEPTACION.md`, «Cómo se
reproduce»):

```bash
cd EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/revision-fbeb256
node reproducir-1-captura.mjs 1440 claro 5
node reproducir-2-semanas.cjs                         # el dominio de este árbol
node reproducir-3-y-4.mjs
```

Para ver el estado de `fbeb256`: `git worktree add ../../../../../arbol-fbeb256 fbeb256`, compilar ahí (`npm ci`,
`entorno.sh compilar-api` y `compilar-web`), levantar sus servicios y correr los mismos scripts. El hallazgo 2 alcanza con
compilar el dominio (`npm run build -w @be/domain`) y pasarle la ruta: `node reproducir-2-semanas.cjs
<árbol>/packages/domain/dist/index.js`.

Las imágenes y los registros quedan en `../trabajo/revision-fbeb256/`, que git ignora.
