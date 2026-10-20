// Copia la agrupación de las vistas del DER (laminas/motor/vistas-der.mjs, la única fuente) a datos/vistas-der.json,
// para que el documento la lea. Uso: node vistas-der-json.mjs
import { writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { VISTAS_DER } from '../laminas/motor/vistas-der.mjs';

const aqui = dirname(fileURLToPath(import.meta.url));
writeFileSync(join(aqui, '../datos/vistas-der.json'), JSON.stringify({ _que_es: 'Copia de laminas/motor/vistas-der.mjs (no editar acá).', vistas: VISTAS_DER }, null, 1));
console.log(`vistas: ${VISTAS_DER.length}`);
