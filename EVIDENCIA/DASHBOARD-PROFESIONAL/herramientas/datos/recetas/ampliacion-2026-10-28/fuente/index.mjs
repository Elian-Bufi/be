// La fuente de las 50 recetas nuevas, por familia, en el orden de los códigos (R017 a R066).
import { DULCES } from './dulces.mjs';
import { FRIOS } from './frios.mjs';
import { HORNO } from './horno.mjs';
import { MASAS } from './masas.mjs';
import { OLLAS, REEMPLAZOS_DE_LAS_OLLAS } from './ollas.mjs';
import { PASTAS } from './pastas.mjs';
import { SANDWICHES } from './sandwiches.mjs';

export const RECETAS = [...MASAS, ...PASTAS, ...SANDWICHES, ...HORNO, ...OLLAS, ...FRIOS, ...DULCES];

/** Las recetas de la lista del encargo que se reemplazaron, con el motivo (§7: «registrá el reemplazo y su motivo»). */
export const REEMPLAZOS = [...REEMPLAZOS_DE_LAS_OLLAS];
