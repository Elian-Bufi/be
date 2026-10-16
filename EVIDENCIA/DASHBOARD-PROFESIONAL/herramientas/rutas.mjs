// Las rutas de las herramientas de WP-DASHBOARD-PROFESIONAL, sin nada de una máquina en particular.
// - BE_REPO: la raíz del repo; por omisión, tres carpetas arriba (esta vive en EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas).
// - BE_TRABAJO: donde quedan el estado, las sesiones, los resultados y las capturas de cada corrida; por omisión,
//   ./trabajo, que git ignora. Ahí hay credenciales y sesiones sintéticas: nunca se suben.
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mkdirSync } from 'node:fs';

const AQUI = dirname(fileURLToPath(import.meta.url));
const conBarras = (ruta) => ruta.split('\\').join('/');
export const REPO = conBarras(process.env.BE_REPO ?? resolve(AQUI, '../../..'));
export const TRABAJO = conBarras(process.env.BE_TRABAJO ?? join(AQUI, 'trabajo'));
mkdirSync(TRABAJO, { recursive: true });
/** Un archivo o carpeta de la carpeta de trabajo, como URL (sirve para fs y como base de otra URL). */
export const enTrabajo = (nombre) => new URL(nombre, pathToFileURL(`${TRABAJO}/`));
