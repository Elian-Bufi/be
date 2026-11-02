/**
 * La ampliación de las recetas de ejemplo (encargo nocturno de Dirección del 2026-10-28) · la prueba del paquete
 * (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/`) contra los datos del catálogo
 * del repositorio, sin red ni base. Rehace lo que importa sin usar el código que lo produjo:
 * - cada ingrediente es el alimento de USDA que dice ser (identidad y versión de la migración que lo sembró, nombre y
 *   preparación), ninguno es de demostración y el estado de cada cantidad es el de su alimento;
 * - una coincidencia ambigua tiene su decisión escrita, y los pasos no usan ingredientes que no estén en la lista;
 * - el cálculo hecho de nuevo coincide con el de BE (`calcularNutrientes`) y con la composición guardada;
 * - las 66 de la vista combinada no chocan en código, nombre, archivo de foto ni clave de idempotencia, y las 16
 *   originales siguen identificables, con sus números y sus archivos;
 * - la herramienta no escribe por omisión.
 *
 * Usa el dominio compilado (`npm run build:domain`, como el resto de `npm test`).
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { comparable, idDeAlimento, idDeVersionCorregida, idDeVersionDeAlimento } from './catalogo-base/sql.mjs';
import {
  calculoIndependiente,
  claveDeIdempotencia as claveDeLasOriginales,
  coinciden,
  estadoCoherente,
  fotoDe as fotoDeLasOriginales,
  leerManifiesto,
  NUTRIENTES,
  pedidoDeCreacion,
} from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import {
  archivoEsperado,
  claveDeIdempotencia,
  CODIGOS,
  descripcionDe,
  fotoDe,
  huellaDe,
  ID_DEL_PAQUETE,
  ingredientesQueFaltanEnLaLista,
  leerAmpliacion,
  leerVistaCombinada,
  problemasDeLaAmpliacion,
} from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/ampliacion.mjs';
import { cargar, leerArgumentos, preparar, REPRESENTATIVAS, revisar } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/cargar.mjs';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = join(RAIZ, 'EVIDENCIA', 'DASHBOARD-PROFESIONAL', 'herramientas', 'datos', 'recetas', 'ampliacion-2026-10-28');
const leer = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8');

const ampliacion = leerAmpliacion();
const originales = leerManifiesto();
const vista = leerVistaCombinada();
const alimentos = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'alimentos.json'));
const correcciones = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'correcciones.json'));
const BASE = new Map(alimentos.alimentos.map((a) => [a.fdcId, a]));
const CORREGIDOS = new Map(correcciones.cortes.map((c) => [c.fdcId, c]));
/** Los ocho de DL-119, leídos de su migración (la misma lectura que la prueba de las originales). */
const DL119 = new Map(
  [
    ...leer('prisma', 'migrations', '20261005120000_recetas_medios_y_registro_v2', 'migration.sql').matchAll(
      /\('([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '(\{"referenceAmount"[^']*)', 'DISPONIBLE', '\{"fuente":"usda-fdc-sr-legacy"[^']*"externalId":"(\d+)"[^']*"preparationDescription":"([^"]+)"/g,
    ),
  ].map((m) => [m[5], { version: m[1], elemento: m[2], nombre: m[3], composicion: JSON.parse(m[4]), preparacion: m[6] }]),
);
const DEMOSTRACION = [
  ...leer('prisma', 'migrations', '20260920100000_circuito_nutricional', 'migration.sql').matchAll(/'([0-9a-f-]{36})', '([0-9a-f-]{36})', '([^']+)', '\{"referenceAmount"/g),
].map((m) => ({ version: m[1], elemento: m[2], nombre: m[3] }));

const ingredientes = ampliacion.recetas.flatMap((r) => r.ingredientes.map((i) => ({ receta: r, i })));
const composicionDe = (i) => (i.fuente === 'CATALOGO_BASE' ? BASE.get(i.fdcId)?.composicion : DL119.get(i.fdcId)?.composicion) ?? null;

test('el paquete está bien formado: 50 recetas nuevas, de R017 a R066, sin repetir nombres ni chocar con las originales', () => {
  assert.equal(ampliacion.paquete, ID_DEL_PAQUETE);
  assert.equal(ampliacion.recetas.length, 50);
  assert.deepEqual(ampliacion.recetas.map((r) => r.codigo), CODIGOS);
  assert.deepEqual(problemasDeLaAmpliacion(ampliacion, originales), []);
});

test('el manifiesto es exactamente el que sale de la fuente escrita a mano (armar.mjs --verificar)', () => {
  const r = spawnSync(process.execPath, [join(CARPETA, 'armar.mjs'), '--verificar'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('cada ingrediente es el alimento de USDA que dice: la identidad y la versión de la migración que lo sembró, su nombre y su preparación', () => {
  assert.equal(DL119.size, 8);
  for (const { receta, i } of ingredientes) {
    const que = `${receta.codigo}, ${i.nombre}`;
    if (i.fuente === 'CATALOGO_BASE') {
      const a = BASE.get(i.fdcId);
      assert.ok(a, `${que}: el FDC ${i.fdcId} está en el catálogo base`);
      const c = CORREGIDOS.get(i.fdcId);
      assert.deepEqual([i.catalogItemId, i.catalogItemVersionId], [idDeAlimento(i.fdcId), c ? idDeVersionCorregida(i.fdcId) : idDeVersionDeAlimento(i.fdcId)], que);
      assert.deepEqual([i.nombre, i.preparacionDeLaFuente], [c ? c.nombre : a.nombre, c?.preparacion ?? a.preparacion], que);
    } else {
      const x = DL119.get(i.fdcId);
      assert.ok(x, `${que}: el FDC ${i.fdcId} es de DL-119`);
      assert.deepEqual([i.catalogItemId, i.catalogItemVersionId, i.nombre, i.preparacionDeLaFuente], [x.elemento, x.version, x.nombre, x.preparacion], que);
    }
    assert.equal(composicionDe(i).referenceAmount, '100g', que);
    assert.equal(i.cantidad.unidad, 'g', que);
  }
});

test('ningún ingrediente es de demostración, ni siquiera cuando se llama igual que uno de USDA', () => {
  const deDemostracion = new Set(DEMOSTRACION.flatMap((x) => [x.elemento, x.version]));
  assert.deepEqual(ingredientes.filter(({ i }) => deDemostracion.has(i.catalogItemId) || deDemostracion.has(i.catalogItemVersionId)).map(({ i }) => i.nombre), []);
  assert.ok(ingredientes.some(({ i }) => i.nombre === 'Aceite de oliva' && i.fuente === 'DL_119'));
});

test('el estado de cada cantidad es el de su alimento: lo crudo con lo crudo y lo cocido con lo cocido', () => {
  for (const { receta, i } of ingredientes) assert.ok(estadoCoherente(i.estado, i.preparacionDeLaFuente), `${receta.codigo}, ${i.nombre}: ${i.estado} con «${i.preparacionDeLaFuente}»`);
  // Los cocidos que usa la ampliación, pesados cocidos: la papa, el pollo, las arvejas, las lentejas, los porotos y el arroz.
  const cocidos = new Set(ingredientes.filter(({ i }) => i.estado === 'COOKED').map(({ i }) => i.fdcId));
  for (const fdc of ['170440', '171478', '170017', '172421', '175194', '175203', '168878', '169146', '173424', '170394']) assert.ok(cocidos.has(fdc), fdc);
});

const CONECTORES = new Set(['a', 'al', 'con', 'de', 'del', 'e', 'el', 'en', 'la', 'las', 'lo', 'los', 'o', 'u', 'y']);
const TODOS = [...alimentos.alimentos.map((a) => a.nombre), ...[...DL119.values()].map((x) => x.nombre), ...DEMOSTRACION.map((x) => x.nombre)];
function candidatos(buscado) {
  const palabras = comparable(buscado)
    .split(' ')
    .filter((p) => !CONECTORES.has(p));
  return TODOS.filter((n) => palabras.every((p) => comparable(n).includes(p)));
}
// Más estricta que la de las originales: una coincidencia exacta resuelve solo si es de USDA. Si lo único que se llama
// exactamente así es de demostración («Pechuga de pollo»), una búsqueda ingenua elegiría ese.
const DE_USDA = new Set([...alimentos.alimentos.map((a) => comparable(a.nombre)), ...[...DL119.values()].map((x) => comparable(x.nombre))]);
const esAmbigua = (buscado) => {
  const c = candidatos(buscado);
  const exactas = c.filter((n) => comparable(n) === comparable(buscado));
  return c.length === 0 || (c.length > 1 && !(exactas.length === 1 && DE_USDA.has(comparable(exactas[0]))));
};

test('una coincidencia ambigua tiene su decisión escrita: nunca el primer resultado de una búsqueda', () => {
  const sinDecision = ingredientes.filter(({ i }) => esAmbigua(i.buscado) && !i.decision).map(({ receta, i }) => `${receta.codigo}: «${i.buscado}» (${candidatos(i.buscado).join(' | ') || 'ninguno'})`);
  assert.deepEqual(sinDecision, []);
  // Las que más se repiten en la ampliación y que el catálogo resuelve de más de una manera; «pechuga de pollo» se
  // llama exactamente como un alimento de demostración, y por eso también es ambigua.
  for (const buscado of ['harina 000', 'pechuga de pollo', 'carne picada magra', 'ricota', 'leche descremada', 'aceite de oliva', 'huevo', 'lechuga']) assert.ok(esAmbigua(buscado), buscado);
});

const consumoDeBE = (receta, cambios = {}) => {
  const porciones = cambios.porciones ?? receta.porciones;
  const total = d.calcularNutrientes(
    receta.ingredientes.map((i, j) => ({ clave: String(j + 1), cantidad: { value: j === cambios.ingrediente ? i.cantidad.valor + cambios.gramos : i.cantidad.valor, unit: i.cantidad.unidad }, composicion: composicionDe(i) })),
  );
  return { total, porPorcion: d.dividirPorPorciones(total, porciones) };
};

test('el cálculo hecho de nuevo coincide con el de BE (SUM_SOURCE_PER_100G_V1) y con la composición guardada, en las 50', () => {
  for (const receta of ampliacion.recetas) {
    const be = consumoDeBE(receta);
    const propio = calculoIndependiente(receta, composicionDe);
    for (const n of NUTRIENTES) {
      assert.ok(coinciden(be.total.nutrientes[n].exacto, propio.total[n]), `${receta.codigo}, ${n}: ${be.total.nutrientes[n].exacto} y ${propio.total[n]}`);
      assert.ok(coinciden(be.porPorcion.nutrientes[n].exacto, propio.porPorcion[n]), `${receta.codigo}, ${n} por porción`);
      // La composición guardada en el manifiesto es la de BE, hasta el redondeo a seis decimales con que se guarda.
      assert.ok(Math.abs(Number(be.porPorcion.nutrientes[n].exacto) - receta.composicion.porPorcion[n]) < 1e-5, `${receta.codigo}, ${n}: el manifiesto guarda ${receta.composicion.porPorcion[n]}`);
      assert.ok(Math.abs(Number(be.total.nutrientes[n].exacto) - receta.composicion.total[n]) < 1e-5, `${receta.codigo}, ${n}: total`);
    }
  }
});

test('con otra cantidad de porciones, el total no cambia y la porción se divide; con un ingrediente cambiado, cambia lo que aporta ese ingrediente', () => {
  for (const codigo of REPRESENTATIVAS) {
    const receta = ampliacion.recetas.find((r) => r.codigo === codigo);
    const una = consumoDeBE(receta);
    const dos = consumoDeBE(receta, { porciones: 2 });
    const mas = consumoDeBE(receta, { ingrediente: 0, gramos: 50 });
    const primero = composicionDe(receta.ingredientes[0]);
    for (const n of NUTRIENTES) {
      assert.ok(coinciden(dos.total.nutrientes[n].exacto, Number(una.total.nutrientes[n].exacto)), `${codigo}, ${n}`);
      assert.ok(coinciden(dos.porPorcion.nutrientes[n].exacto, Number(una.total.nutrientes[n].exacto) / 2), `${codigo}, ${n} con 2 porciones`);
      assert.ok(coinciden(mas.total.nutrientes[n].exacto, Number(una.total.nutrientes[n].exacto) + (50 / 100) * primero[n]), `${codigo}, ${n} con 50 g más`);
      assert.ok(coinciden(mas.total.nutrientes[n].exacto, calculoIndependiente(receta, composicionDe, { ingrediente: 0, gramos: 50 }).total[n]), `${codigo}, ${n} independiente`);
    }
  }
});

test('los pasos solo nombran ingredientes que están en la lista (el agua de hervir y descartar no cuenta)', () => {
  for (const receta of ampliacion.recetas) assert.deepEqual(ingredientesQueFaltanEnLaLista(receta), [], receta.codigo);
  // Y la regla atrapa el caso que la motiva: un paso que sala sin sal en la lista.
  const sinSal = { ...ampliacion.recetas[0], ingredientes: ampliacion.recetas[0].ingredientes.filter((i) => i.fdcId !== '173468') };
  assert.ok(ingredientesQueFaltanEnLaLista(sinSal).some((p) => p.startsWith('sal')));
});

test('las siete familias tienen las recetas nuevas del encargo: 12, 8, 6, 8, 6, 4 y 6', () => {
  const cuantas = {};
  for (const r of ampliacion.recetas) cuantas[r.familia] = (cuantas[r.familia] ?? 0) + 1;
  assert.deepEqual(cuantas, { MASAS: 12, PASTAS: 8, SANDWICHES: 6, HORNO: 8, OLLAS: 6, FRIOS: 4, DULCES: 6 });
});

test('la vista combinada tiene las 66 sin colisiones, y las 16 originales siguen identificables con sus números y sus archivos', () => {
  assert.equal(vista.recetas.length, 66);
  for (const campo of ['codigo', 'nombre', 'archivoDeFoto']) assert.equal(new Set(vista.recetas.map((r) => (campo === 'nombre' ? comparable(r[campo]) : r[campo]))).size, 66, campo);
  const deLasOriginales = vista.recetas.filter((r) => r.origen === 'ORIGINAL');
  assert.equal(deLasOriginales.length, 16);
  assert.deepEqual(
    deLasOriginales.map((r) => [r.numeroEnSuPaquete, r.nombre, r.archivoDeFoto]),
    originales.recetas.map((r) => [r.numero, r.nombre, r.imagen]),
  );
  assert.deepEqual(vista.recetas.filter((r) => r.origen === 'NUEVA').map((r) => r.codigo), CODIGOS);
});

test('las claves de idempotencia del paquete no pueden coincidir con las de las originales y cumplen la regla de la API', () => {
  const claves = ampliacion.recetas.map((r) => claveDeIdempotencia(r, 'receta', pedidoDeCreacion(r)));
  assert.equal(new Set(claves).size, 50);
  for (const [k, clave] of claves.entries()) {
    assert.match(clave, /^[A-Za-z0-9._:-]{8,128}$/);
    assert.ok(clave.startsWith(`${ID_DEL_PAQUETE}-v1-${CODIGOS[k]}-receta-`), clave);
    assert.equal(ampliacion.recetas[k].claveDeCreacion, clave, CODIGOS[k]);
  }
  for (const r of originales.recetas) assert.ok(claveDeLasOriginales(r, 'receta', pedidoDeCreacion(r)).startsWith('recetas-de-ejemplo-v1-'));
  // La foto de cada receta tiene su propia clave: la misma imagen en dos recetas no daría la misma intención.
  const r17 = ampliacion.recetas[0];
  const r18 = ampliacion.recetas[1];
  assert.notEqual(claveDeIdempotencia(r17, 'imagen-1', 'abc'), claveDeIdempotencia(r18, 'imagen-1', 'abc'));
});

test('las fotos no se cruzan: la herramienta de las originales no toma una foto de la ampliación, ni al revés', () => {
  const r17 = ampliacion.recetas[0];
  const archivos = ['01-avena-cocida-con-banana-y-canela.jpg', archivoEsperado(r17), 'R0170-otra.jpg', '17-tarta.jpg'];
  assert.equal(fotoDe(r17, archivos), archivoEsperado(r17));
  assert.equal(fotoDeLasOriginales(originales.recetas[0], [archivoEsperado(r17)]), null);
  assert.equal(fotoDe(r17, ['17-tarta.jpg', '01-avena-cocida-con-banana-y-canela.jpg']), null);
  assert.equal(archivoEsperado(r17), 'R017-tarta-de-pollo-y-puerro.jpg');
});

test('la huella de la formulación cambia si cambia un gramo, y la descripción entra en el contrato', () => {
  const r = ampliacion.recetas[0];
  assert.equal(huellaDe(r), r.huella);
  const otra = { ...r, ingredientes: r.ingredientes.map((i, j) => (j === 0 ? { ...i, cantidad: { ...i.cantidad, valor: i.cantidad.valor + 1 } } : i)) };
  assert.notEqual(huellaDe(otra), r.huella);
  for (const x of ampliacion.recetas) {
    assert.equal(x.descripcion, descripcionDe(x));
    assert.ok(x.descripcion.length <= 500);
  }
});

test('los estados se dicen por separado: ninguna receta dice estar cocinada, pesada ni validada por una persona', () => {
  assert.match(ampliacion.estados.cocinadoYPesado, /^No/);
  assert.match(ampliacion.estados.validadoPorUnaPersona, /^No/);
  assert.equal(ampliacion.imagenes.procedencia, 'AI_GENERATED');
});

test('el reemplazo de la lista del encargo está registrado con su motivo (el locro, sin maíz blanco en el catálogo)', () => {
  assert.deepEqual(ampliacion.reemplazos.map((r) => [r.codigo, r.propuesta, r.reemplazo]), [['R054', 'Locro de maíz y porotos con carne magra', 'Bifes a la criolla con papas']]);
  assert.match(ampliacion.reemplazos[0].motivo, /maíz blanco/);
  assert.equal(ampliacion.recetas.find((r) => r.codigo === 'R054').nombre, 'Bifes a la criolla con papas');
});

test('la herramienta no escribe por omisión: sin modo prepara sin red, y cargar exige origen, cuentas y confirmación', async () => {
  assert.equal(leerArgumentos([]).modo, 'preparar');
  const informe = preparar({}, { escribir: () => {} });
  assert.equal(informe.resumen.preparadas, 50);
  assert.equal(informe.resumen.listasParaCargar, 50);
  assert.deepEqual(informe.resumen.problemasDelPaquete, []);
  await assert.rejects(cargar({ modo: 'cargar', cuenta: 'PRO_N' }, { escribir: () => {} }), /--confirmo-escritura/);
  await assert.rejects(revisar({ modo: 'revisar', cuenta: 'PRO_N' }, { escribir: () => {} }), /--origen/);
  await assert.rejects(
    cargar({ modo: 'cargar', cuenta: 'PRO_N', confirmoEscritura: true, estado: 'x', fotos: 'x', origen: 'https://be-api-hndp.onrender.com', cortarEn: 'R030:subida' }, { escribir: () => {} }),
    /solo para las pruebas/,
  );
  assert.throws(() => leerArgumentos(['cargar', '--origen']), /Falta el valor/);
});
