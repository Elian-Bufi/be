/**
 * Las recetas de ejemplo (encargo de Dirección del 2026-10-19, bloque 4) · la prueba del manifiesto congelado
 * (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.json`) contra los datos del catálogo del
 * repositorio, sin red ni base:
 * - cada ingrediente es el alimento de USDA que dice ser (su identidad y su versión son las de la migración que lo
 *   sembró), con su nombre y su preparación, y ninguno es de demostración;
 * - el estado de cada cantidad es el de su alimento: lo crudo con lo crudo y lo cocido con lo cocido;
 * - una coincidencia ambigua (más de un alimento posible para lo que pedía el borrador) tiene su decisión escrita;
 * - el cálculo hecho de nuevo, sin la lógica de BE, coincide con el de BE (`calcularNutrientes`), también con otra
 *   cantidad de porciones y con un ingrediente cambiado;
 * - la herramienta no tiene valores por omisión: sin origen o sin cuentas no arranca, y «cargar» sin confirmación no
 *   escribe.
 *
 * Usa el dominio compilado (`npm run build:domain`, como el resto de `npm test`).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { comparable, idDeAlimento, idDeVersionDeAlimento } from './catalogo-base/sql.mjs';
import {
  calculoIndependiente,
  coinciden,
  estadoCoherente,
  leerManifiesto,
  medidasDeImagen,
  NUTRIENTES,
  problemasDeLaFoto,
  problemasDelManifiesto,
} from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { cargar, exigirOrigen, leerArgumentos, mismosIngredientes, REPRESENTATIVAS } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/recetas.mjs';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8');

const manifiesto = leerManifiesto();
const alimentos = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'alimentos.json'));
const BASE = new Map(alimentos.alimentos.map((a) => [a.fdcId, a]));
/** Los ocho de DL-119, con su elemento, su versión, su nombre, su composición y su preparación, de su migración. */
const DL119 = new Map(
  [
    ...leer('prisma', 'migrations', '20261005120000_recetas_medios_y_registro_v2', 'migration.sql').matchAll(
      /\('([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '(\{"referenceAmount"[^']*)', 'DISPONIBLE', '\{"fuente":"usda-fdc-sr-legacy"[^']*"externalId":"(\d+)"[^']*"preparationDescription":"([^"]+)"/g,
    ),
  ].map((m) => [m[5], { version: m[1], elemento: m[2], nombre: m[3], composicion: JSON.parse(m[4]), preparacion: m[6] }]),
);
/** Lo sembrado de demostración (WP-04): ninguno de sus ítems puede entrar por un nombre parecido. */
const DEMOSTRACION = [
  ...leer('prisma', 'migrations', '20260920100000_circuito_nutricional', 'migration.sql').matchAll(/'([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '\{"referenceAmount"/g),
].map((m) => ({ version: m[1], elemento: m[2], nombre: m[3] }));

const ingredientes = manifiesto.recetas.flatMap((r) => r.ingredientes.map((i) => ({ receta: r, i })));
const composicionDe = (i) => (i.fuente === 'CATALOGO_BASE' ? BASE.get(i.fdcId)?.composicion : DL119.get(i.fdcId)?.composicion) ?? null;

test('el manifiesto está bien formado: dieciséis recetas, cada ingrediente con su ítem, su versión, su cantidad y su estado', () => {
  assert.equal(manifiesto.recetas.length, 16);
  assert.deepEqual(problemasDelManifiesto(manifiesto), []);
});

test('cada ingrediente es el alimento de USDA que dice: la identidad y la versión de la migración que lo sembró, su nombre y su preparación', () => {
  assert.equal(DL119.size, 8);
  for (const { receta, i } of ingredientes) {
    const que = `receta ${receta.numero}, ${i.nombre}`;
    if (i.fuente === 'CATALOGO_BASE') {
      const a = BASE.get(i.fdcId);
      assert.ok(a, `${que}: el FDC ${i.fdcId} está en el catálogo base`);
      assert.deepEqual([i.catalogItemId, i.catalogItemVersionId], [idDeAlimento(i.fdcId), idDeVersionDeAlimento(i.fdcId)], que);
      assert.deepEqual([i.nombre, i.preparacionDeLaFuente], [a.nombre, a.preparacion], que);
    } else {
      const x = DL119.get(i.fdcId);
      assert.ok(x, `${que}: el FDC ${i.fdcId} es de DL-119`);
      assert.deepEqual([i.catalogItemId, i.catalogItemVersionId, i.nombre, i.preparacionDeLaFuente], [x.elemento, x.version, x.nombre, x.preparacion], que);
    }
    // Pesado en gramos, contra una composición cada 100 g: sin conversiones.
    assert.equal(composicionDe(i).referenceAmount, '100g', que);
    assert.equal(i.cantidad.unidad, 'g', que);
  }
});

test('ningún ingrediente es de demostración, ni siquiera cuando se llama igual que uno de USDA («Aceite de oliva»)', () => {
  assert.equal(DEMOSTRACION.length, 40);
  const deDemostracion = new Set(DEMOSTRACION.flatMap((x) => [x.elemento, x.version]));
  assert.deepEqual(ingredientes.filter(({ i }) => deDemostracion.has(i.catalogItemId) || deDemostracion.has(i.catalogItemVersionId)).map(({ i }) => i.nombre), []);
  // El caso que motiva la regla: dos «Aceite de oliva» con el mismo nombre.
  assert.ok(DEMOSTRACION.some((x) => x.nombre === 'Aceite de oliva'));
  assert.ok(ingredientes.some(({ i }) => i.nombre === 'Aceite de oliva' && i.fuente === 'DL_119'));
});

test('el estado de cada cantidad es el de su alimento: lo crudo con lo crudo y lo cocido con lo cocido', () => {
  for (const { receta, i } of ingredientes) assert.ok(estadoCoherente(i.estado, i.preparacionDeLaFuente), `receta ${receta.numero}, ${i.nombre}: ${i.estado} con «${i.preparacionDeLaFuente}»`);
  // Y la regla atrapa los cambios de estado.
  assert.equal(estadoCoherente('COOKED', 'crudo'), false);
  assert.equal(estadoCoherente('RAW', 'hervido y escurrido, sin sal'), false);
  assert.equal(estadoCoherente('RAW', 'listo para consumir'), false);
  assert.equal(estadoCoherente('AS_PURCHASED', 'al horno, sin sal'), false);
  assert.equal(estadoCoherente('COOKED', 'asado al grill, magro'), true);
});

/**
 * Los alimentos del catálogo (base, DL-119 y demostración) que tienen todas las palabras de lo que pedía el borrador,
 * como las pide el buscador (sin los conectores). Si hay más de uno y no hay uno solo que se llame exactamente así, la
 * coincidencia es ambigua.
 */
const CONECTORES = new Set(['a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'u', 'y']);
const TODOS = [...alimentos.alimentos.map((a) => a.nombre), ...[...DL119.values()].map((x) => x.nombre), ...DEMOSTRACION.map((x) => x.nombre)];
function candidatos(buscado) {
  const palabras = comparable(buscado)
    .split(' ')
    .filter((p) => !CONECTORES.has(p));
  return TODOS.filter((n) => palabras.every((p) => comparable(n).includes(p)));
}
const esAmbigua = (buscado) => {
  const c = candidatos(buscado);
  return c.length === 0 || (c.length > 1 && c.filter((n) => comparable(n) === comparable(buscado)).length !== 1);
};

test('una coincidencia ambigua tiene su decisión escrita: nunca el primer resultado de una búsqueda', () => {
  const sinDecision = ingredientes.filter(({ i }) => esAmbigua(i.buscado) && !i.decision).map(({ receta, i }) => `receta ${receta.numero}: «${i.buscado}» (${candidatos(i.buscado).join(' | ') || 'ninguno'})`);
  assert.deepEqual(sinDecision, []);
  // Las que el borrador resolvía con el primer resultado y que ahora están decididas.
  for (const buscado of ['carne picada', 'lechuga cruda', 'aceite de oliva', 'leche parcialmente descremada', 'queso blanco']) assert.ok(esAmbigua(buscado), buscado);
});

const consumoDeBE = (receta, cambios = {}) => {
  const porciones = cambios.porciones ?? receta.porciones;
  const total = d.calcularNutrientes(
    receta.ingredientes.map((i, j) => ({ clave: String(j + 1), cantidad: { value: j === cambios.ingrediente ? i.cantidad.valor + cambios.gramos : i.cantidad.valor, unit: i.cantidad.unidad }, composicion: composicionDe(i) })),
  );
  return { total, porPorcion: d.dividirPorPorciones(total, porciones) };
};

test('el cálculo hecho de nuevo coincide con el de BE (SUM_SOURCE_PER_100G_V1) en las dieciséis, el total y por porción', () => {
  for (const receta of manifiesto.recetas) {
    const be = consumoDeBE(receta);
    const propio = calculoIndependiente(receta, composicionDe);
    for (const n of NUTRIENTES) {
      assert.ok(coinciden(be.total.nutrientes[n].exacto, propio.total[n]), `receta ${receta.numero}, ${n}: ${be.total.nutrientes[n].exacto} y ${propio.total[n]}`);
      assert.ok(coinciden(be.porPorcion.nutrientes[n].exacto, propio.porPorcion[n]), `receta ${receta.numero}, ${n} por porción`);
    }
  }
});

test('con otra cantidad de porciones, el total no cambia y la porción se divide; con un ingrediente cambiado, cambia lo que aporta ese ingrediente', () => {
  for (const numero of REPRESENTATIVAS) {
    const receta = manifiesto.recetas.find((r) => r.numero === numero);
    const una = consumoDeBE(receta);
    const dos = consumoDeBE(receta, { porciones: 2 });
    const masGramos = consumoDeBE(receta, { ingrediente: 0, gramos: 50 });
    const primero = composicionDe(receta.ingredientes[0]);
    for (const n of NUTRIENTES) {
      assert.equal(dos.total.nutrientes[n].exacto, una.total.nutrientes[n].exacto, `receta ${numero}, ${n}: el total no cambia con las porciones`);
      assert.ok(coinciden(dos.porPorcion.nutrientes[n].exacto, Number(una.total.nutrientes[n].exacto) / 2), `receta ${numero}, ${n}: la porción es la mitad`);
      assert.ok(coinciden(masGramos.total.nutrientes[n].exacto, Number(una.total.nutrientes[n].exacto) + (50 / 100) * Number(primero[n])), `receta ${numero}, ${n}: 50 g más del primero`);
      assert.ok(coinciden(masGramos.total.nutrientes[n].exacto, calculoIndependiente(receta, composicionDe, { ingrediente: 0, gramos: 50 }).total[n]), `receta ${numero}, ${n}: y el independiente da lo mismo`);
    }
  }
});

test('la herramienta no tiene valores por omisión: sin origen o sin cuentas no arranca, y «cargar» sin confirmación no escribe', async () => {
  assert.throws(() => exigirOrigen(undefined), /Falta --origen/);
  assert.throws(() => exigirOrigen('http://be-api.example.com'), /https/);
  assert.throws(() => exigirOrigen('https://be-api-hndp.onrender.com/api/v1'), /sin ruta/);
  assert.equal(exigirOrigen('https://be-api-hndp.onrender.com'), 'https://be-api-hndp.onrender.com');
  assert.equal(exigirOrigen('http://localhost:3001'), 'http://localhost:3001');
  assert.throws(() => leerArgumentos(['revisar', '--base', 'x']), /No conozco/);
  assert.throws(() => leerArgumentos(['borrar']), /Uso/);
  assert.deepEqual(leerArgumentos(['revisar', '--origen', 'https://x.example', '--cuentas', 'c.env']), { modo: 'revisar', origen: 'https://x.example', cuentas: 'c.env' });
  // Sin la confirmación explícita, ni siquiera revisa: no toca la red.
  await assert.rejects(cargar({ modo: 'cargar', origen: 'https://be-api-hndp.onrender.com', cuentas: 'c.env', fotos: '.', estado: '.' }), /--confirmo-escritura/);
});

test('retomar no duplica: una receta guardada con los mismos ingredientes es la del manifiesto; con otros, no se toca', () => {
  const receta = manifiesto.recetas[0];
  const guardada = {
    servings: receta.porciones,
    ingredients: receta.ingredientes.map((i) => ({ catalogItemVersionId: i.catalogItemVersionId, quantity: { value: i.cantidad.valor, unit: i.cantidad.unidad }, preparationState: i.estado })),
  };
  assert.equal(mismosIngredientes(guardada, receta), true);
  assert.equal(mismosIngredientes({ ...guardada, servings: 2 }, receta), false);
  assert.equal(mismosIngredientes({ ...guardada, ingredients: guardada.ingredients.slice(1) }, receta), false);
});

test('las fotos: el archivo que se espera, sus medidas leídas sin decodificar, y lo que no sirve', () => {
  const png = (ancho, alto) => {
    const b = Buffer.alloc(33);
    b.writeUInt32BE(0x89504e47, 0);
    b.writeUInt32BE(ancho, 16);
    b.writeUInt32BE(alto, 20);
    return b;
  };
  const jpeg = (ancho, alto) => Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x04, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x11, 0x08, alto >> 8, alto & 0xff, ancho >> 8, ancho & 0xff, 0x03, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]);
  assert.deepEqual(medidasDeImagen(png(1600, 1200)), { tipo: 'image/png', ancho: 1600, alto: 1200 });
  assert.deepEqual(medidasDeImagen(jpeg(2000, 1500)), { tipo: 'image/jpeg', ancho: 2000, alto: 1500 });
  assert.equal(medidasDeImagen(Buffer.from('no es una imagen')), null);
  assert.deepEqual(problemasDeLaFoto(jpeg(2000, 1500), '01-avena.jpg'), []);
  assert.equal(problemasDeLaFoto(jpeg(800, 600), '01-avena.jpg').length, 1, 'chica');
  assert.equal(problemasDeLaFoto(jpeg(1800, 1800), '01-avena.jpg').length, 1, 'cuadrada');
  assert.equal(problemasDeLaFoto(jpeg(1200, 900), '01-avena.jpg').length, 1, 'el servidor no la agranda: desde 1600 px');
  assert.equal(problemasDeLaFoto(png(1600, 1200), '01-avena.jpg').length, 1, 'la extensión no es la del contenido');
  // Los dieciséis archivos esperados, distintos.
  const archivos = manifiesto.recetas.map((r) => r.imagen);
  assert.equal(new Set(archivos).size, 16);
});
