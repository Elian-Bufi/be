/**
 * WP-CATALOGO-BASE (DL-141, tramo 2) · baja de la API pública de wger lo que hace falta para curar el catálogo base de
 * ejercicios: todos los ejercicios (`exerciseinfo`, con sus traducciones, licencias y autores) y las listas de licencias,
 * idiomas, categorías, músculos y material. Guarda cada respuesta tal cual, como JSON, en la carpeta que se le indica.
 *
 * No es parte de la aplicación ni de la migración: la migración se genera desde `prisma/datos/catalogo-base/`, que es lo
 * que se revisa en el PR. Esto sirve para volver a mirar la fuente y para regenerar los datos (ver el LEEME de esa carpeta).
 *
 * Uso: node scripts/catalogo-base/descargar-wger.mjs <carpeta-de-salida>
 * Solo módulos nativos de Node 22 (fetch incluido). Lo bajado es un dato: no se ejecuta.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const BASE = 'https://wger.de/api/v2';
const salida = process.argv[2];
if (!salida) {
  console.error('Uso: node scripts/catalogo-base/descargar-wger.mjs <carpeta-de-salida>');
  process.exit(2);
}
const carpeta = resolve(salida);
mkdirSync(carpeta, { recursive: true });

async function pedir(url) {
  for (let intento = 1; ; intento++) {
    try {
      const r = await fetch(url, { headers: { Accept: 'application/json' } });
      if (r.status !== 200) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (intento >= 5) throw new Error(`${url}: ${e.message}`);
      await new Promise((ok) => setTimeout(ok, 2000 * intento));
    }
  }
}

/** Recorre una lista paginada de la API y guarda cada página como viene. */
async function bajarLista(nombre, ruta, limite) {
  let url = `${BASE}/${ruta}/?limit=${limite}&offset=0`;
  let pagina = 0;
  let total = 0;
  while (url) {
    const cuerpo = await pedir(url);
    pagina += 1;
    total += cuerpo.results.length;
    writeFileSync(join(carpeta, `${nombre}-${String(pagina).padStart(2, '0')}.json`), JSON.stringify(cuerpo));
    url = cuerpo.next;
  }
  console.log(`${nombre}: ${total} filas en ${pagina} páginas`);
}

await bajarLista('license', 'license', 100);
await bajarLista('language', 'language', 100);
await bajarLista('exercisecategory', 'exercisecategory', 100);
await bajarLista('muscle', 'muscle', 100);
await bajarLista('equipment', 'equipment', 100);
await bajarLista('exerciseinfo', 'exerciseinfo', 100);
writeFileSync(join(carpeta, 'descarga.json'), JSON.stringify({ base: BASE, momento: new Date().toISOString() }, null, 2));
