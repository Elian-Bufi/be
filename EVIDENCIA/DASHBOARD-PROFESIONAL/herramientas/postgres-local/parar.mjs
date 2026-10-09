// Apaga el PostgreSQL de esta carpeta (el de `node iniciar.mjs`), con los datos a salvo.
import { apagar, puerto } from './postgres.mjs';

console.log((await apagar()) ? `PostgreSQL de :${puerto} apagado.` : 'No había un PostgreSQL corriendo con estos datos.');
