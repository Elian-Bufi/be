/**
 * Las 84 recetas nuevas del Recetario de BE (R067 a R151, sin R150, aprobadas por Dirección el 2026-11-26): la prueba del
 * paquete (`EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/recetario-2026-11-26/`) contra el catálogo del
 * repositorio, sin red ni base.
 * - son 84, con los códigos esperados, y con las 66 anteriores suman 150 sin repetir código, nombre ni archivo de foto;
 * - cada ingrediente es un alimento real del catálogo (identidad y versión), nunca de demostración;
 * - el estado de cada cantidad es el de su alimento, y los pasos solo nombran ingredientes de la lista;
 * - el cálculo hecho de nuevo coincide con el guardado y con el de BE;
 * - el manifiesto es el que sale de la fuente, y los prompts de las fotos (si están) son uno por receta;
 * - ninguna receta usa «cumplimiento» ni «puntaje».
 */
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join, resolve } from 'node:path';
import test from 'node:test';
import { fileURLToPath } from 'node:url';
import { leerManifiesto, NUTRIENTES, calculoIndependiente, coinciden, estadoCoherente, sinTildes } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/manifiesto.mjs';
import { ingredientesQueFaltanEnLaLista, leerAmpliacion } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/ampliacion.mjs';
import { alimentoPorFdc, DEMOSTRACION } from '../EVIDENCIA/DASHBOARD-PROFESIONAL/herramientas/datos/recetas/ampliacion-2026-10-28/catalogo.mjs';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CARPETA = join(RAIZ, 'EVIDENCIA', 'DASHBOARD-PROFESIONAL', 'herramientas', 'datos', 'recetas', 'recetario-2026-11-26');
const nuevo = JSON.parse(readFileSync(join(CARPETA, 'manifiesto.json'), 'utf8'));
const originales = leerManifiesto();
const ampliacion = leerAmpliacion();
const CODIGOS = Array.from({ length: 85 }, (_, k) => `R${String(67 + k).padStart(3, '0')}`).filter((c) => c !== 'R150');

test('son 84 recetas, de R067 a R151 sin R150, y las aprobadas por Dirección están con su nombre', () => {
  assert.equal(nuevo.recetas.length, 84);
  assert.deepEqual(nuevo.recetas.map((r) => r.codigo), CODIGOS);
  const nombre = (c) => nuevo.recetas.find((r) => r.codigo === c).nombre;
  assert.equal(nombre('R143'), 'Pollo con arroz y brócoli');
  assert.equal(nombre('R148'), 'Tarta de atún y choclo');
  assert.equal(nombre('R138'), 'Ñoquis de papa con salsa blanca y espinaca');
  assert.equal(nombre('R102'), 'Pechito de cerdo con batatas');
  assert.ok(!nuevo.recetas.some((r) => r.codigo === 'R150'));
});

test('con las 66 anteriores son 150 y no se repite ningún código, nombre ni archivo de foto', () => {
  const anteriores = [
    ...originales.recetas.map((r) => ({ codigo: `R${String(r.numero).padStart(3, '0')}`, nombre: r.nombre, foto: r.imagen })),
    ...ampliacion.recetas.map((r) => ({ codigo: r.codigo, nombre: r.nombre, foto: r.foto.archivo })),
  ];
  assert.equal(anteriores.length, 66);
  const todas = [...anteriores, ...nuevo.recetas.map((r) => ({ codigo: r.codigo, nombre: r.nombre, foto: r.foto.archivo }))];
  assert.equal(todas.length, 150);
  for (const campo of ['codigo', 'foto']) assert.equal(new Set(todas.map((r) => r[campo])).size, 150, campo);
  assert.equal(new Set(todas.map((r) => sinTildes(r.nombre))).size, 150, 'nombre');
  // El archivo de foto de cada nueva es su código y su nombre; la herramienta busca la foto por el código del principio.
  for (const r of nuevo.recetas) assert.equal(r.foto.archivo, `${r.codigo}-${sinTildes(r.nombre)}.jpg`);
});

test('cada ingrediente es un alimento del catálogo (identidad y versión), nunca de demostración, en gramos', () => {
  const deDemostracion = new Set(DEMOSTRACION.flatMap((x) => [x.elemento, x.version]));
  for (const r of nuevo.recetas) {
    assert.ok(r.ingredientes.length > 0 && r.ingredientes.length <= 40, r.codigo);
    for (const i of r.ingredientes) {
      const a = alimentoPorFdc(i.fdcId);
      assert.ok(a, `${r.codigo}, ${i.nombre}: el FDC ${i.fdcId} está en el catálogo`);
      assert.deepEqual([i.catalogItemId, i.catalogItemVersionId, i.nombre], [a.catalogItemId, a.catalogItemVersionId, a.nombre], `${r.codigo}, ${i.nombre}`);
      assert.ok(!deDemostracion.has(i.catalogItemId) && !deDemostracion.has(i.catalogItemVersionId), `${r.codigo}, ${i.nombre}`);
      assert.equal(a.composicion.referenceAmount, '100g');
      assert.ok(i.cantidad.valor > 0 && i.cantidad.valor <= 5000 && i.cantidad.unidad === 'g', `${r.codigo}, ${i.nombre}`);
    }
  }
});

test('el estado de cada cantidad es el de su alimento y los pasos solo nombran ingredientes de la lista', () => {
  for (const r of nuevo.recetas) {
    for (const i of r.ingredientes) assert.ok(estadoCoherente(i.estado, i.preparacionDeLaFuente), `${r.codigo}, ${i.nombre}: ${i.estado} con «${i.preparacionDeLaFuente}»`);
    assert.deepEqual(ingredientesQueFaltanEnLaLista(r), [], r.codigo);
    assert.ok(r.pasos.length > 0 && r.pasos.length <= 20 && r.pasos.every((p) => p.length <= 500), r.codigo);
    assert.ok(r.descripcion.length <= 500 && r.porciones >= 1 && r.porciones <= 50, r.codigo);
  }
});

test('el cálculo hecho de nuevo coincide con el de BE (SUM_SOURCE_PER_100G_V1) y con el guardado', () => {
  for (const r of nuevo.recetas) {
    const total = d.calcularNutrientes(r.ingredientes.map((i, j) => ({ clave: String(j + 1), cantidad: { value: i.cantidad.valor, unit: i.cantidad.unidad }, composicion: alimentoPorFdc(i.fdcId).composicion })));
    const propio = calculoIndependiente(r, (i) => alimentoPorFdc(i.fdcId).composicion);
    for (const n of NUTRIENTES) {
      assert.ok(coinciden(total.nutrientes[n].exacto, propio.total[n]), `${r.codigo}, ${n}`);
      assert.ok(Math.abs(Number(total.nutrientes[n].exacto) - r.composicion.total[n]) < 1e-5, `${r.codigo}, ${n}: guardado`);
    }
  }
});

test('las comidas son de proteína razonable y ninguna usa «cumplimiento» ni «puntaje»', () => {
  const mal = nuevo.recetas.filter((r) => /cumplimiento|puntaje|puntos/i.test(JSON.stringify(r)));
  assert.deepEqual(mal.map((r) => r.codigo), []);
  // Cada porción tiene al menos 14 g de proteína (la más baja es una de ñoquis, con queso).
  for (const r of nuevo.recetas) assert.ok(r.composicion.porPorcion.proteinG >= 14, `${r.codigo}: ${r.composicion.porPorcion.proteinG} g`);
});

test('el manifiesto es exactamente el que sale de la fuente (armar.mjs --verificar)', () => {
  const r = spawnSync(process.execPath, [join(CARPETA, 'armar.mjs'), '--verificar'], { encoding: 'utf8' });
  assert.equal(r.status, 0, r.stderr);
});

test('las recetas usan el alimento real y no un reemplazo: locro con maíz blanco y chorizo, queso fresco y albahaca', () => {
  const fdcs = (c) => nuevo.recetas.find((r) => r.codigo === c).ingredientes.map((i) => i.fdcId);
  // R137 Locro: maíz blanco en grano (168920) y chorizo (173859), sin choclo.
  assert.ok(fdcs('R137').includes('168920') && fdcs('R137').includes('173859'));
  assert.ok(!fdcs('R137').includes('169999'));
  // R133: queso fresco (172223), no port salut (170849). El dulce de membrillo no tiene registro en SR Legacy: sigue la mermelada.
  assert.ok(fdcs('R133').includes('172223') && !fdcs('R133').includes('170849'));
  // R135: albahaca fresca (172232), no perejil (170416).
  assert.ok(fdcs('R135').includes('172232') && !fdcs('R135').includes('170416'));
  // Ninguna receta dice que le falte un alimento que ya está.
  for (const r of nuevo.recetas) assert.ok(!r.adaptaciones.some((a) => /no tiene (maíz|chorizo|albahaca|queso fresco)/i.test(a)), r.codigo);
});
