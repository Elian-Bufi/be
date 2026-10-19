/**
 * WP-CATALOGO-BASE (DL-141, tramos 2 y 3) · completa los datos curados del catálogo base con lo que dicen las fuentes, o
 * verifica que coincidan.
 *
 * La curaduría (lo que decide BE) vive en `prisma/datos/catalogo-base/`: qué ejercicio de wger o qué alimento de USDA
 * entra, su nombre en castellano, su preparación y sus nombres alternativos. Todo lo demás sale de la fuente y lo escribe
 * este script: la composición cada 100 g, el NDB, la descripción original y la fecha de publicación de USDA; la categoría,
 * los músculos, el material, las traducciones, las licencias y los autores de wger.
 *
 * Uso:
 *   node scripts/catalogo-base/completar-con-las-fuentes.mjs --usda <carpeta con los CSV de SR Legacy> --wger <carpeta con lo bajado de wger>
 *   node scripts/catalogo-base/completar-con-las-fuentes.mjs ... --verificar   (no escribe: falla si algo no coincide)
 * Se puede pasar solo una de las dos fuentes. Ver prisma/datos/catalogo-base/LEEME.md.
 *
 * Solo módulos nativos de Node 22. `food_nutrient.csv` (unos 36 MB) se lee línea a línea y solo se guardan los
 * nutrientes de los alimentos curados: nunca se carga entero en memoria.
 */
import { createReadStream, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import readline from 'node:readline';
import { fileURLToPath } from 'node:url';
import { isDeepStrictEqual } from 'node:util';

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..', '..');
const DATOS = join(RAIZ, 'prisma', 'datos', 'catalogo-base');

const argumentos = process.argv.slice(2);
const valorDe = (nombre) => {
  const i = argumentos.indexOf(nombre);
  return i >= 0 ? argumentos[i + 1] : undefined;
};
const carpetaUsda = valorDe('--usda');
const carpetaWger = valorDe('--wger');
const verificar = argumentos.includes('--verificar');
if (!carpetaUsda && !carpetaWger) {
  console.error('Uso: node scripts/catalogo-base/completar-con-las-fuentes.mjs [--usda <carpeta>] [--wger <carpeta>] [--verificar]');
  process.exit(2);
}

/** Un renglón de CSV con comillas dobles (el formato de FoodData Central). */
function partirCsv(linea) {
  const campos = [];
  let actual = '';
  let comillas = false;
  for (let i = 0; i < linea.length; i++) {
    const c = linea[i];
    if (comillas) {
      if (c === '"' && linea[i + 1] === '"') {
        actual += '"';
        i++;
      } else if (c === '"') comillas = false;
      else actual += c;
    } else if (c === '"') comillas = true;
    else if (c === ',') {
      campos.push(actual);
      actual = '';
    } else actual += c;
  }
  campos.push(actual);
  return campos;
}

const leerCsvChico = (archivo) =>
  readFileSync(archivo, 'utf8')
    .split(/\r?\n/)
    .slice(1)
    .filter(Boolean)
    .map(partirCsv);

/** Un texto del proveedor: sin espacios de más ni en los bordes. */
const limpio = (texto) => (typeof texto === 'string' ? texto.replace(/\s+/g, ' ').trim() : '');

let diferencias = 0;
function comparar(que, antes, despues) {
  if (isDeepStrictEqual(antes, despues)) return;
  diferencias += 1;
  console.error(`Difiere ${que}:\n  guardado: ${JSON.stringify(antes)}\n  fuente:   ${JSON.stringify(despues)}`);
}

// ─── USDA FoodData Central · SR Legacy ──────────────────────────────────────────────────────────

/** Los nutrientes de FoodData Central que usa la composición del catálogo, más el alcohol para la coherencia. */
const NUTRIENTES = { 1008: 'energyKcal', 1003: 'proteinG', 1005: 'carbohydrateG', 1004: 'fatG', 1079: 'fiberG', 1018: 'alcoholG' };

async function completarUsda(carpeta) {
  const archivo = join(DATOS, 'alimentos.json');
  const datos = JSON.parse(readFileSync(archivo, 'utf8'));
  const buscados = new Set([...datos.alimentos.map((a) => a.fdcId), ...datos.alimentosDeDl119.map((a) => a.fdcId)]);

  const categorias = new Map(leerCsvChico(join(carpeta, 'food_category.csv')).map((c) => [c[0], c[2]]));
  const ndb = new Map(leerCsvChico(join(carpeta, 'sr_legacy_food.csv')).map((c) => [c[0], c[1]]));
  const alimentos = new Map();
  for (const c of leerCsvChico(join(carpeta, 'food.csv'))) {
    if (buscados.has(c[0])) alimentos.set(c[0], { descripcion: c[2], categoria: categorias.get(c[3]) ?? null, publicacion: c[4], tipo: c[1], nutrientes: {} });
  }
  const lector = readline.createInterface({ input: createReadStream(join(carpeta, 'food_nutrient.csv')), crlfDelay: Infinity });
  let encabezado = true;
  for await (const linea of lector) {
    if (encabezado) {
      encabezado = false;
      continue;
    }
    const c = partirCsv(linea);
    const clave = NUTRIENTES[c[2]];
    if (!clave) continue;
    const alimento = alimentos.get(c[1]);
    if (alimento && c[3] !== '') alimento.nutrientes[clave] = Number(c[3]);
  }

  const faltan = [...buscados].filter((fdc) => !alimentos.has(fdc));
  if (faltan.length > 0) throw new Error(`No están en SR Legacy: ${faltan.join(', ')}`);

  for (const a of datos.alimentos) {
    const fuente = alimentos.get(a.fdcId);
    if (fuente.tipo !== 'sr_legacy_food') throw new Error(`${a.fdcId} no es de SR Legacy`);
    const n = fuente.nutrientes;
    const usda = { ndbNumber: ndb.get(a.fdcId), descripcion: fuente.descripcion, publicacion: fuente.publicacion, categoria: fuente.categoria };
    const composicion = { referenceAmount: '100g', energyKcal: n.energyKcal, proteinG: n.proteinG, carbohydrateG: n.carbohydrateG, fatG: n.fatG };
    if (n.fiberG !== undefined) composicion.fiberG = n.fiberG;
    const alcohol = n.alcoholG && n.alcoholG > 0 ? n.alcoholG : undefined;
    if (verificar) {
      comparar(`${a.fdcId} (usda)`, a.usda, usda);
      comparar(`${a.fdcId} (composicion)`, a.composicion, composicion);
      comparar(`${a.fdcId} (alcoholG)`, a.alcoholG, alcohol);
    } else {
      a.usda = usda;
      a.composicion = composicion;
      if (alcohol === undefined) delete a.alcoholG;
      else a.alcoholG = alcohol;
    }
  }
  for (const a of datos.alimentosDeDl119) {
    const descripcion = alimentos.get(a.fdcId).descripcion;
    if (verificar) comparar(`${a.fdcId} (DL-119)`, a.descripcionUsda, descripcion);
    else a.descripcionUsda = descripcion;
  }
  if (!verificar) escribir(archivo, datos);
  console.log(`USDA: ${datos.alimentos.length} alimentos y ${datos.alimentosDeDl119.length} de DL-119 ${verificar ? 'verificados' : 'completados'}.`);
}

// ─── wger ───────────────────────────────────────────────────────────────────────────────────────

const IDIOMA_INGLES = 2;
const IDIOMA_CASTELLANO = 4;

function completarWger(carpeta) {
  const archivo = join(DATOS, 'ejercicios.json');
  const datos = JSON.parse(readFileSync(archivo, 'utf8'));
  const deWger = new Map();
  for (const f of readdirSync(carpeta).filter((x) => /^exerciseinfo-\d+\.json$/.test(x))) {
    for (const e of JSON.parse(readFileSync(join(carpeta, f), 'utf8')).results) deWger.set(e.id, e);
  }
  const traduccion = (e, idioma) => {
    const t = (e.translations ?? []).find((x) => x && x.language === idioma && limpio(x.name) !== '');
    return t ? { id: t.id, nombre: limpio(t.name), licencia: t.license ?? null, autoria: limpio(t.license_author) || null } : null;
  };
  const musculo = (m) => ({ id: m.id, nombre: limpio(m.name), nombreEn: limpio(m.name_en) || null });

  for (const ej of datos.ejercicios) {
    const e = deWger.get(ej.wgerId);
    if (!e) throw new Error(`wger no tiene el ejercicio ${ej.wgerId}`);
    const en = traduccion(e, IDIOMA_INGLES);
    const es = traduccion(e, IDIOMA_CASTELLANO);
    if (!en) throw new Error(`El ejercicio ${ej.wgerId} no tiene nombre en inglés en wger`);
    const declarado = {
      uuid: e.uuid,
      categoria: { id: e.category.id, nombre: limpio(e.category.name) },
      musculosPrincipales: e.muscles.map(musculo),
      musculosSecundarios: e.muscles_secondary.map(musculo),
      material: e.equipment.map((m) => ({ id: m.id, nombre: limpio(m.name) })),
      licencia: { wger: e.license?.id ?? null, autoria: limpio(e.license_author) || null },
    };
    const traducciones = { en, es };
    // El nombre es de wger si es su traducción al castellano (a lo sumo con otras mayúsculas); si no, es propio de BE.
    const origen = es !== null && es.nombre.toLocaleLowerCase('es') === limpio(ej.nombre).toLocaleLowerCase('es') ? 'WGER' : 'PROPIO';
    if (verificar) {
      comparar(`${ej.wgerId} (wger)`, ej.wger, declarado);
      comparar(`${ej.wgerId} (traducciones)`, ej.traducciones, traducciones);
      comparar(`${ej.wgerId} (origenDelNombre)`, ej.origenDelNombre, origen);
    } else {
      ej.origenDelNombre = origen;
      ej.wger = declarado;
      ej.traducciones = traducciones;
    }
  }
  if (!verificar) escribir(archivo, datos);
  console.log(`wger: ${datos.ejercicios.length} ejercicios ${verificar ? 'verificados' : 'completados'}.`);
}

/** Escribe el JSON con dos espacios y un salto final: el mismo archivo para los mismos datos. */
function escribir(archivo, datos) {
  writeFileSync(archivo, `${JSON.stringify(datos, null, 2)}\n`);
}

if (carpetaUsda) await completarUsda(resolve(carpetaUsda));
if (carpetaWger) completarWger(resolve(carpetaWger));
if (diferencias > 0) {
  console.error(`${diferencias} diferencias con la fuente.`);
  process.exit(1);
}
