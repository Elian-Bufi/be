/**
 * WP-CATALOGO-BASE (DL-141, tramos 2 y 3) · la prueba de contenido del catálogo base (§5 del paquete): recorre los datos
 * curados de `prisma/datos/catalogo-base/` y exige, en cada ítem, fuente, licencia y nombre en castellano; en los
 * alimentos, una composición completa y coherente; nombres sin repetir dentro de cada catálogo ni con lo sintético de
 * demostración (D-5); y que las migraciones del repositorio sean exactamente lo que produce el generador.
 *
 * Usa los esquemas del dominio compilado (`npm run build:domain`, como el resto de `npm test`) y no toca la red ni la base.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import {
  agregadoALaProcedencia,
  CARPETA_DE_ALIMENTOS,
  CARPETA_DE_CORRECCIONES,
  CARPETA_DE_EJERCICIOS,
  comparable,
  composicionDeAlimento,
  cortesQueCambian,
  idDeNombreDeAlimento,
  nombreEnInglesDeUsda,
  nombresAlternativosDeAlimento,
  nombresAlternativosDeEjercicio,
  nombresAlternativosVigentes,
  nombresVigentes,
  procedenciaDeAlimento,
  procedenciaDeEjercicio,
  sqlDeAlimentos,
  sqlDeCorrecciones,
  sqlDeEjercicios,
  uuidV5,
} from './catalogo-base/sql.mjs';
import { fuentesEnMarkdown } from './catalogo-base/fuentes.mjs';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const leer = (...partes) => readFileSync(join(RAIZ, ...partes), 'utf8');
const ejercicios = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'ejercicios.json'));
const alimentos = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'alimentos.json'));
const correcciones = JSON.parse(leer('prisma', 'datos', 'catalogo-base', 'correcciones.json'));

const repetidos = (lista) => lista.filter((x, i) => lista.indexOf(x) !== i);
/** Los alimentos que USDA ya nombra en castellano: su descripción y el nombre coinciden. */
const NOMBRADOS_EN_CASTELLANO_POR_USDA = new Set(['173461']); // «Dulce de Leche»

/** Un nombre que la base acepta (CHECK de las tablas de nombres) y que se lee en una fila del buscador. */
function exigirNombre(nombre, que) {
  assert.equal(typeof nombre, 'string', `${que}: el nombre es un texto`);
  assert.ok(nombre.trim() !== '', `${que}: el nombre no está vacío`);
  assert.equal(nombre, nombre.trim(), `${que}: «${nombre}» no tiene espacios en los bordes`);
  assert.ok(!/\s{2,}/.test(nombre), `${que}: «${nombre}» no tiene espacios dobles`);
  assert.ok(nombre.length <= 120, `${que}: «${nombre}» tiene hasta 120 caracteres`);
}

/** Los nombres de las versiones sembradas por una migración anterior, leídos del archivo del repositorio. */
function nombresSembrados(carpeta, patron) {
  return [...leer('prisma', 'migrations', carpeta, 'migration.sql').matchAll(patron)].map((m) => m[1]);
}
const SINTETICOS_DE_ENTRENAMIENTO = nombresSembrados('20260921100000_circuito_de_entrenamiento', /'[0-9a-f-]{36}', '[0-9a-f-]{36}', '([^']+)', 'DISPONIBLE', '\{"fuente":"catalogo-sintetico-wp06"/g);
const SINTETICOS_DE_NUTRICION = nombresSembrados('20260920100000_circuito_nutricional', /'[0-9a-f-]{36}', '[0-9a-f-]{36}', '([^']+)', '\{"referenceAmount"/g);
/** Los ocho alimentos de USDA de DL-119: el elemento, el nombre y el FDC de cada uno. */
const DE_DL119 = [
  ...leer('prisma', 'migrations', '20261005120000_recetas_medios_y_registro_v2', 'migration.sql').matchAll(
    /'[0-9a-f-]{36}', '([0-9a-f-]{36})', '([^']+)', '\{"referenceAmount"[^']*', 'DISPONIBLE', '\{"fuente":"usda-fdc-sr-legacy"[^']*"externalId":"(\d+)"/g,
  ),
].map((m) => ({ elementoId: m[1], nombre: m[2], fdcId: m[3] }));

// ─── Ejercicios (tramo 2, D-3) ───────────────────────────────────────────────────────────────────

test('ejercicios: entre 150 y 250, de wger, cada uno una sola vez', () => {
  assert.ok(ejercicios.ejercicios.length >= 150 && ejercicios.ejercicios.length <= 250, `son ${ejercicios.ejercicios.length}`);
  for (const e of ejercicios.ejercicios) assert.ok(Number.isInteger(e.wgerId) && e.wgerId > 0, `wgerId ${e.wgerId}`);
  assert.deepEqual(repetidos(ejercicios.ejercicios.map((e) => e.wgerId)), []);
  // Los números del proveedor falso de las pruebas de integración no son ejercicios del catálogo base: si lo fueran, el
  // candidato de prueba encontraría el sembrado (`existingExercise`) en lugar de importar uno nuevo.
  const bloque = /export const WGER = \{([\s\S]*?)\} as const;/.exec(leer('test', 'integration', 'soporte-proveedores.ts'))[1];
  const deLasPruebas = [...bloque.matchAll(/:\s*'(\d+)'/g)].map((m) => Number(m[1]));
  assert.ok(deLasPruebas.length >= 7);
  assert.deepEqual(
    ejercicios.ejercicios.filter((e) => deLasPruebas.includes(e.wgerId)).map((e) => e.wgerId),
    [],
  );
});

test('ejercicios: las licencias son las que publica wger, con los mismos textos que la importación de WP-08', () => {
  const adaptador = Object.fromEntries(
    [...leer('apps', 'api', 'src', 'integraciones', 'wger.ts').matchAll(/(\d+): \{ id: '([^']+)', label: '([^']+)', url: '([^']+)' \}/g)].map((m) => [m[1], { id: m[2], label: m[3], url: m[4] }]),
  );
  assert.equal(Object.keys(adaptador).length, 5);
  assert.deepEqual(ejercicios.fuente.licencias, adaptador);
});

test('ejercicios: cada uno con fuente, licencia, autoría declarada o ausente, y nombre en castellano', () => {
  for (const e of ejercicios.ejercicios) {
    const que = `wger ${e.wgerId}`;
    exigirNombre(e.nombre, que);
    assert.ok(['WGER', 'PROPIO'].includes(e.origenDelNombre), `${que}: origen del nombre`);
    assert.ok(e.traducciones.en, `${que}: wger lo publica en inglés`);
    if (e.origenDelNombre === 'WGER') {
      // La traducción de wger, revisada: a lo sumo cambian las mayúsculas.
      assert.equal(e.nombre.toLocaleLowerCase('es'), e.traducciones.es.nombre.toLocaleLowerCase('es'), `${que}: es la traducción de wger`);
    } else {
      // Propio de BE: no es la traducción de wger ni el inglés copiado.
      assert.notEqual(comparable(e.nombre), comparable(e.traducciones.en.nombre), `${que}: «${e.nombre}» está en castellano`);
      if (e.traducciones.es) assert.notEqual(e.nombre.toLocaleLowerCase('es'), e.traducciones.es.nombre.toLocaleLowerCase('es'), `${que}: un nombre igual al de wger es de wger`);
    }
    // La procedencia es la de lo importado (WP-08): proveedor WGER, el número, cuándo se recibió y la licencia del texto.
    const procedencia = procedenciaDeEjercicio(e, ejercicios.fuente);
    const fuente = d.FuenteExternaSchema.parse(procedencia.fuenteExterna);
    assert.equal(fuente.provider, 'WGER');
    assert.equal(fuente.externalId, String(e.wgerId));
    assert.ok(fuente.license.url?.startsWith('https://'), `${que}: la licencia dice dónde leerla`);
    assert.ok(['CC-BY-SA-3.0', 'CC-BY-SA-4.0', 'CC0-1.0', 'CC-BY-4.0'].includes(fuente.license.id), `${que}: licencia libre (${fuente.license.id})`);
    // La categoría y los músculos que declara wger, como dato del proveedor.
    assert.ok(procedencia.declaradoPorWger.categoria, `${que}: categoría de wger`);
    assert.ok(Array.isArray(procedencia.declaradoPorWger.musculosPrincipales));
    assert.ok(procedencia.declaradoPorWger.license.id, `${que}: licencia del ejercicio en wger`);
  }
});

test('ejercicios: los nombres alternativos, con su idioma, su región y su origen; el inglés es el de wger', () => {
  for (const e of ejercicios.ejercicios) {
    const que = `wger ${e.wgerId}`;
    const nombres = nombresAlternativosDeEjercicio(e);
    // El inglés de wger va primero, salvo que sea igual al nombre («Burpees»): entonces no agrega nada y no va.
    const ingles = { nombre: e.traducciones.en.nombre, idioma: 'EN', region: null, origen: 'PROVEEDOR' };
    if (comparable(ingles.nombre) === comparable(e.nombre)) assert.ok(!nombres.some((n) => n.idioma === 'EN' && n.origen === 'PROVEEDOR'), que);
    else assert.deepEqual(nombres[0], ingles);
    for (const n of nombres) {
      exigirNombre(n.nombre, `${que}, alternativo`);
      assert.ok(['ES', 'EN'].includes(n.idioma), `${que}: idioma de «${n.nombre}»`);
      assert.ok(n.region === null || /^[A-Z]{2}$/.test(n.region), `${que}: región de «${n.nombre}»`);
      assert.ok(['PROVEEDOR', 'SIEMBRA_DE_BE'].includes(n.origen), `${que}: origen de «${n.nombre}»`);
      // Lo que se atribuye a wger es un texto de wger, tal cual.
      if (n.origen === 'PROVEEDOR') assert.ok([e.traducciones.en?.nombre, e.traducciones.es?.nombre].includes(n.nombre), `${que}: «${n.nombre}» es de wger`);
    }
    const comparables = nombres.map((n) => comparable(n.nombre));
    assert.deepEqual(repetidos(comparables), [], `${que}: sin alternativos repetidos`);
    assert.ok(!comparables.includes(comparable(e.nombre)), `${que}: ningún alternativo repite el nombre principal`);
  }
});

test('ejercicios: sin nombres repetidos, y ninguno igual a uno de los doce de demostración (D-5)', () => {
  assert.equal(SINTETICOS_DE_ENTRENAMIENTO.length, 12);
  const nombres = ejercicios.ejercicios.map((e) => comparable(e.nombre));
  assert.deepEqual(repetidos(nombres), []);
  const sinteticos = SINTETICOS_DE_ENTRENAMIENTO.map(comparable);
  assert.deepEqual(ejercicios.ejercicios.filter((e) => sinteticos.includes(comparable(e.nombre))).map((e) => e.nombre), []);
  // Un nombre alternativo que curó BE no repite el nombre de uno de demostración (lo pondría en su mismo grupo del
  // buscador). Los del proveedor van tal cual: el inglés de wger del hip thrust es «Hip Thrust».
  const curados = ejercicios.ejercicios.flatMap((e) => nombresAlternativosDeEjercicio(e).filter((n) => n.origen === 'SIEMBRA_DE_BE').map((n) => n.nombre));
  assert.deepEqual(curados.filter((n) => sinteticos.includes(comparable(n))), []);
});

// Cuántos ejercicios tienen una palabra no es una regla del catálogo: la búsqueda tolera que crezca (encargo de Dirección
// del 2026-10-19, bloque 4). Lo prueba busqueda-tolerante.int-spec.ts con más sentadillas que una página.

// ─── Alimentos (tramo 3, D-4) ────────────────────────────────────────────────────────────────────

/**
 * La energía de USDA contra sus macronutrientes: la de los factores generales de Atwater (4 kcal por gramo de proteína y
 * de carbohidrato, 9 de grasa y 7 de alcohol; la fibra, 2 en lugar de 4). USDA usa factores específicos por alimento, que
 * pueden dar bastante menos (el cacao, el salvado) pero nunca mucho más; un error de unidades o de columna cae afuera.
 */
function energiaCoherente(c, alcoholG = 0) {
  const estimada = 4 * c.proteinG + 4 * c.carbohydrateG - 2 * c.fiberG + 9 * c.fatG + 7 * alcoholG;
  return c.energyKcal <= 1.15 * estimada + 20 && c.energyKcal >= 0.6 * estimada - 20;
}

test('alimentos: entre 300 y 500, de USDA FoodData Central · SR Legacy, cada uno una sola vez y ninguno de DL-119', () => {
  assert.ok(alimentos.alimentos.length >= 300 && alimentos.alimentos.length <= 500, `son ${alimentos.alimentos.length}`);
  for (const a of alimentos.alimentos) assert.match(a.fdcId, /^\d+$/);
  assert.deepEqual(repetidos(alimentos.alimentos.map((a) => a.fdcId)), []);
  // Lo que ya sembró DL-119 (mismo FDC) no se vuelve a crear: solo suma nombres, al mismo elemento.
  assert.equal(DE_DL119.length, 8);
  assert.deepEqual(
    alimentos.alimentos.filter((a) => DE_DL119.some((x) => x.fdcId === a.fdcId)).map((a) => a.fdcId),
    [],
  );
  assert.deepEqual(
    alimentos.alimentosDeDl119.map((a) => ({ elementoId: a.elementoId, nombre: a.nombre, fdcId: a.fdcId })),
    DE_DL119,
  );
  assert.equal(alimentos.fuente.licencia.id, 'CC0-1.0');
  assert.equal(alimentos.fuente.licencia.attribution, 'USDA Agricultural Research Service');
});

test('alimentos: cada uno con fuente, licencia, nombre en castellano y la composición completa y coherente cada 100 g', () => {
  for (const a of alimentos.alimentos) {
    const que = `FDC ${a.fdcId} (${a.nombre})`;
    exigirNombre(a.nombre, que);
    if (!NOMBRADOS_EN_CASTELLANO_POR_USDA.has(a.fdcId)) assert.notEqual(comparable(a.nombre), comparable(a.usda.descripcion), `${que}: el nombre está en castellano`);
    assert.ok(typeof a.preparacion === 'string' && a.preparacion.trim() !== '', `${que}: la preparación`);
    // La procedencia, con el formato de DL-119: el esquema estricto del dominio la acepta.
    const fuente = d.FuenteExternaDeAlimentoSchema.parse(procedenciaDeAlimento(a, alimentos.fuente).fuenteExterna);
    assert.equal(fuente.provider, 'USDA_FDC_SR_LEGACY');
    assert.equal(fuente.externalId, a.fdcId);
    assert.equal(fuente.license.id, 'CC0-1.0');
    assert.match(fuente.usdaReference.ndbNumber, /^\d+$/);
    assert.equal(fuente.usdaReference.publishedOn, '2019-04-01');
    // La composición: las claves del dominio, sin negativos, con la fibra (completa) y coherente.
    const c = d.ComposicionSchema.parse(composicionDeAlimento(a));
    assert.equal(c.referenceAmount, '100g');
    assert.equal(typeof c.fiberG, 'number', `${que}: tiene fibra`);
    assert.ok(c.fiberG <= c.carbohydrateG + 0.05, `${que}: la fibra está dentro de los carbohidratos («by difference»)`);
    assert.ok(c.proteinG + c.carbohydrateG + c.fatG <= 100.5, `${que}: los macronutrientes no pasan de 100 g`);
    assert.ok(energiaCoherente(c, a.alcoholG), `${que}: ${c.energyKcal} kcal no es coherente con sus macronutrientes`);
    if (a.alcoholG !== undefined) assert.ok(a.alcoholG > 0 && a.alcoholG < 60, `${que}: alcohol`);
  }
});

test('alimentos: los nombres alternativos; el inglés es la descripción de USDA', () => {
  const todos = [
    ...alimentos.alimentos.map((a) => ({ que: `FDC ${a.fdcId}`, nombre: a.nombre, descripcion: a.usda.descripcion, curados: a.nombresAlternativos })),
    ...alimentos.alimentosDeDl119.map((a) => ({ que: `FDC ${a.fdcId} (DL-119)`, nombre: a.nombre, descripcion: a.descripcionUsda, curados: a.nombresAlternativos })),
  ];
  for (const { que, nombre, descripcion, curados } of todos) {
    const nombres = nombresAlternativosDeAlimento(nombre, descripcion, curados);
    // La descripción de USDA va primero, salvo que sea igual al nombre («Dulce de Leche»).
    if (comparable(nombreEnInglesDeUsda(descripcion)) === comparable(nombre)) assert.ok(!nombres.some((n) => n.deUsda), que);
    else assert.deepEqual([nombres[0].nombre, nombres[0].idioma], [nombreEnInglesDeUsda(descripcion), 'EN']);
    for (const n of nombres) {
      exigirNombre(n.nombre, `${que}, alternativo`);
      assert.ok(['ES', 'EN'].includes(n.idioma), `${que}: idioma de «${n.nombre}»`);
      assert.ok(n.region === null || /^[A-Z]{2}$/.test(n.region), `${que}: región de «${n.nombre}»`);
      assert.equal(n.origen, 'SIEMBRA_DE_BE', `${que}: USDA no es un proveedor de la tabla de nombres`);
    }
    const comparables = nombres.map((n) => comparable(n.nombre));
    assert.deepEqual(repetidos(comparables), [], `${que}: sin alternativos repetidos`);
    assert.ok(!comparables.includes(comparable(nombre)), `${que}: ningún alternativo repite el nombre principal`);
  }
});

test('alimentos: sin nombres repetidos, y ninguno igual a uno sintético de WP-04 ni a uno de DL-119 (D-5)', () => {
  assert.equal(SINTETICOS_DE_NUTRICION.length, 40);
  const yaSembrados = [...SINTETICOS_DE_NUTRICION, ...DE_DL119.map((x) => x.nombre)].map(comparable);
  // Los del tramo 3 y los vigentes, con las correcciones.
  for (const lista of [alimentos.alimentos.map((a) => a.nombre), [...nombresVigentes(alimentos, correcciones).values()]]) {
    assert.deepEqual(repetidos(lista.map(comparable)), []);
    assert.deepEqual(lista.filter((n) => yaSembrados.includes(comparable(n))), []);
  }
});

// ─── La correspondencia con la fuente (encargo de Dirección del 2026-10-19, bloque 4) ──────────────

const CORTES_REVISADOS = /^(cuadril|entrana|vacio|bife de vacio|bola de lomo)\b/;

test('correspondencia: los cuatro cortes del encargo están revisados, crudos y cocidos, cada uno una sola vez', () => {
  const revisados = correcciones.cortes.map((c) => c.fdcId);
  assert.deepEqual(repetidos(revisados), []);
  // Cuadril, entraña, vacío y bola de lomo: todas sus variantes sembradas, con el nombre del tramo 3 o el vigente.
  const vigentes = nombresVigentes(alimentos, correcciones);
  const variantes = alimentos.alimentos.filter((a) => CORTES_REVISADOS.test(comparable(a.nombre)) || CORTES_REVISADOS.test(comparable(vigentes.get(a.fdcId))));
  assert.deepEqual(variantes.map((a) => a.fdcId).sort(), [...revisados].sort());
  assert.equal(variantes.length, 6);
});

test('correspondencia: cada corte con su pieza, su preparación, su grasa y su fundamento; el nombre nuevo conserva preparación y grasa', () => {
  for (const c of correcciones.cortes) {
    const que = `FDC ${c.fdcId}`;
    const a = alimentos.alimentos.find((x) => x.fdcId === c.fdcId);
    assert.ok(a, `${que}: es un alimento del tramo 3 (no de DL-119)`);
    assert.equal(a.nombre, c.nombreAnterior, `${que}: el nombre anterior es el sembrado`);
    exigirNombre(c.nombre, que);
    assert.ok(['DIRECTA', 'APROXIMADA'].includes(c.correspondencia), `${que}: la correspondencia`);
    for (const campo of ['pieza', 'grasa', 'fundamento']) assert.ok(typeof c[campo] === 'string' && c[campo].trim().length > 10, `${que}: ${campo}`);
    assert.ok(typeof c.preparacion === 'string' && /^(crud|asad|cocid|hervid|a la parrilla)/.test(c.preparacion), `${que}: la preparación de USDA`);
    // Una correspondencia aproximada dice en qué: es lo que muestra el buscador.
    if (c.correspondencia === 'APROXIMADA') assert.ok(typeof c.nota === 'string' && c.nota.trim().length > 10, `${que}: la nota de la aproximación`);
    else assert.equal(c.nota, null, `${que}: una directa no lleva nota`);
    // El nombre corrige la pieza, nunca la preparación ni la grasa: «…, magro, crudo» sigue «…, magro, crudo».
    assert.deepEqual(c.nombre.split(', ').slice(1), c.nombreAnterior.split(', ').slice(1), `${que}: «${c.nombre}» conserva la preparación y la grasa`);
    assert.ok(a.usda.descripcion.length > 20, `${que}: la descripción original completa de USDA`);
  }
  // Los que cambian de nombre: los que no están en el catálogo como su pieza (el vacío entero, la entraña sin decir cuál
  // y el cuadril con la colita).
  assert.deepEqual(cortesQueCambian(correcciones).map((c) => c.fdcId), ['174055', '168634', '168745', '169563', '168733']);
});

test('correspondencia: la versión nueva suma la correspondencia sin tocar la fuente externa, y sus fuentes están identificadas', () => {
  for (const f of Object.values(correcciones.fuentes)) {
    assert.match(f.url, /^https:\/\//);
    assert.match(f.sha256, /^[0-9a-f]{64}$/);
    assert.match(f.consultadoEl, /^\d{4}-\d{2}-\d{2}$/);
  }
  for (const c of cortesQueCambian(correcciones)) {
    const a = alimentos.alimentos.find((x) => x.fdcId === c.fdcId);
    const anterior = procedenciaDeAlimento(a, alimentos.fuente);
    const agregado = agregadoALaProcedencia(c, correcciones.fuentes);
    // La migración las une con «||»: del agregado, solo la marca de la siembra pisa una clave de la procedencia anterior.
    assert.deepEqual(Object.keys(agregado).filter((k) => k in anterior), ['siembra']);
    const nueva = { ...anterior, ...agregado };
    assert.equal(nueva.siembra, 'WP-CATALOGO-BASE · DL-141 · correspondencia de cortes');
    assert.deepEqual([nueva.fuente, nueva.carga, nueva.recurso], [anterior.fuente, anterior.carga, anterior.recurso]);
    assert.deepEqual(d.FuenteExternaDeAlimentoSchema.parse(nueva.fuenteExterna), anterior.fuenteExterna);
    assert.equal(nueva.correspondencia.tipo, c.correspondencia);
    assert.equal(nueva.correspondencia.fuentes.length, 2);
    assert.equal(nueva.correccion.nombreAnterior, c.nombreAnterior);
  }
});

test('correspondencia: los nombres retirados existían, cada uno con su motivo; los nuevos son válidos y no se repiten', () => {
  for (const n of correcciones.nombresRetirados) {
    const a = alimentos.alimentos.find((x) => x.fdcId === n.fdcId);
    assert.ok(a, `${n.nombre}: de un alimento del tramo 3`);
    assert.ok(nombresAlternativosDeAlimento(a.nombre, a.usda.descripcion, a.nombresAlternativos).some((s) => s.nombre === n.nombre && s.region === n.region), `${n.nombre}: lo sembró el tramo 3`);
    assert.ok(n.motivo.trim().length > 20, `${n.nombre}: el motivo`);
    // El mismo identificador que le dio la migración del tramo 3: el retiro apunta a esa fila.
    assert.ok(leer('prisma', 'migrations', CARPETA_DE_ALIMENTOS, 'migration.sql').includes(`('${idDeNombreDeAlimento(n.fdcId, n)}', `), `${n.nombre}: su fila`);
  }
  assert.deepEqual(repetidos(correcciones.nombresRetirados.map((n) => idDeNombreDeAlimento(n.fdcId, n))), []);
  for (const n of correcciones.nombresNuevos) {
    exigirNombre(n.nombre, `nuevo ${n.nombre}`);
    assert.ok(['ES', 'EN'].includes(n.idioma) && (n.region === null || /^[A-Z]{2}$/.test(n.region)), n.nombre);
    assert.ok(n.fundamento.trim().length > 20, `${n.nombre}: el fundamento`);
  }
  // Con las correcciones, ningún alimento repite un nombre alternativo ni repite su nombre principal.
  const vigentes = nombresVigentes(alimentos, correcciones);
  for (const a of alimentos.alimentos) {
    const nombres = nombresAlternativosVigentes(a, correcciones).map((n) => comparable(n.nombre));
    assert.deepEqual(repetidos(nombres), [], `FDC ${a.fdcId}`);
    assert.ok(!nombres.includes(comparable(vigentes.get(a.fdcId))), `FDC ${a.fdcId}: ningún alternativo repite el principal`);
  }
});

// ─── Las migraciones ─────────────────────────────────────────────────────────────────────────────

test('el UUID v5 es el del RFC 4122 (el vector de www.example.com en el espacio DNS)', () => {
  assert.equal(uuidV5('www.example.com', '6ba7b810-9dad-11d1-80b4-00c04fd430c8'), '2ed6657d-e927-568b-95e1-2665a8aea6a2');
});

test('las migraciones y el documento de fuentes son exactamente lo que produce el generador desde los datos', () => {
  assert.equal(leer('prisma', 'migrations', CARPETA_DE_EJERCICIOS, 'migration.sql'), sqlDeEjercicios(ejercicios));
  assert.equal(leer('prisma', 'migrations', CARPETA_DE_ALIMENTOS, 'migration.sql'), sqlDeAlimentos(alimentos));
  assert.equal(leer('prisma', 'migrations', CARPETA_DE_CORRECCIONES, 'migration.sql'), sqlDeCorrecciones(correcciones, alimentos));
  assert.equal(leer('docs', 'catalogo', 'FUENTES.md'), fuentesEnMarkdown(ejercicios, alimentos, correcciones));
  // Y producirlo dos veces da el mismo texto.
  assert.equal(sqlDeEjercicios(ejercicios), sqlDeEjercicios(JSON.parse(JSON.stringify(ejercicios))));
  assert.equal(sqlDeAlimentos(alimentos), sqlDeAlimentos(JSON.parse(JSON.stringify(alimentos))));
  assert.equal(sqlDeCorrecciones(correcciones, alimentos), sqlDeCorrecciones(JSON.parse(JSON.stringify(correcciones)), alimentos));
});

test('las migraciones van después de la última de main, y cada inserción ignora lo que ya está', () => {
  // La de las correcciones va después de las que corrige: esas ya están aplicadas y no se regeneran.
  assert.ok(CARPETA_DE_CORRECCIONES > CARPETA_DE_ALIMENTOS && CARPETA_DE_ALIMENTOS > CARPETA_DE_EJERCICIOS);
  for (const carpeta of [CARPETA_DE_EJERCICIOS, CARPETA_DE_ALIMENTOS, CARPETA_DE_CORRECCIONES]) {
    assert.ok(carpeta > '20261017010200_nombres_alternativos_del_catalogo_de_demostracion', carpeta);
    const sql = leer('prisma', 'migrations', carpeta, 'migration.sql');
    const sentencias = sql.split(/;\s*\n/).filter((s) => s.includes('INSERT INTO'));
    assert.ok(sentencias.length >= 3);
    for (const s of sentencias) assert.match(s, /ON CONFLICT (\("(id|nombre_id)"\) )?DO NOTHING$/, 'cada inserción saltea lo que ya está');
    // Solo agrega: ni UPDATE, ni DELETE, ni cambios de esquema.
    assert.doesNotMatch(sql, /^\s*(UPDATE|DELETE|ALTER|DROP|CREATE|TRUNCATE)\b/im);
  }
});
