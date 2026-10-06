// Las rutas del recorrido, sin nada de una máquina en particular.
// - BE_REPO: la raíz del repo; por omisión, cuatro carpetas arriba (esta vive en EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/recorrido).
// - BE_TRABAJO: donde quedan el estado, las sesiones, los resultados y las capturas de cada corrida; por omisión,
//   ./trabajo, que git ignora. Ahí hay credenciales y sesiones sintéticas: nunca se suben.
// - BE_ARNES: el arnés del render de la APK (necesita `npm install` y `API_REAL=1 node construir.mjs`).
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const AQUI = dirname(fileURLToPath(import.meta.url));
export const REPO = (process.env.BE_REPO ?? resolve(AQUI, '../../../..')).split('\\').join('/');
export const TRABAJO = (process.env.BE_TRABAJO ?? join(AQUI, 'trabajo')).split('\\').join('/');
export const ARNES = (process.env.BE_ARNES ?? join(REPO, 'EVIDENCIA/ENTRENAMIENTO-SERIES/herramientas/render-navegador')).split('\\').join('/');
mkdirSync(TRABAJO, { recursive: true });
/** Un archivo o carpeta de la carpeta de trabajo, como URL (sirve para fs y como base de otra URL). */
export const enTrabajo = (nombre) => new URL(nombre, pathToFileURL(`${TRABAJO}/`));
