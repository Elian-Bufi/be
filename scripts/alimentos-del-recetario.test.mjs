/**
 * Alimentos del Recetario de BE (2026-11-26) · los cinco que las recetas necesitaban y el catálogo base no tenía (cuatro de
 * USDA SR Legacy; el dulce de membrillo no tiene registro en la fuente y no está): contenido, procedencia y migración.
 * Uso: node --test scripts/alimentos-del-recetario.test.mjs (después de construir @be/domain).
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import test from 'node:test';
import { sqlDelRecetario } from './catalogo-base/generar-alimentos-del-recetario.mjs';
import { composicionDeAlimento, procedenciaDeAlimento } from './catalogo-base/sql.mjs';

const require = createRequire(import.meta.url);
const d = require('../packages/domain/dist/index.js');
const leer = (...p) => readFileSync(new URL(`../${p.join('/')}`, import.meta.url), 'utf8').replace(/\r\n/g, '\n');
const base = JSON.parse(leer('prisma/datos/catalogo-base/alimentos.json'));
const nuevos = JSON.parse(leer('prisma/datos/catalogo-base/alimentos-del-recetario.json'));

test('son cuatro de SR Legacy (maíz blanco, chorizo, queso fresco, albahaca), con la fuente del catálogo base', () => {
  assert.deepEqual(nuevos.alimentos.map((a) => a.fdcId), ['168920', '173859', '172223', '172232']);
  assert.equal(nuevos.fuente.sha256, base.fuente.sha256);
  assert.equal(nuevos.fuente.licencia.id, 'CC0-1.0');
  const yaEstaban = new Set([...base.alimentos.map((a) => a.fdcId), ...base.alimentosDeDl119.map((a) => a.fdcId)]);
  const nombres = new Set(base.alimentos.map((a) => a.nombre));
  for (const a of nuevos.alimentos) {
    assert.ok(!yaEstaban.has(a.fdcId), `${a.nombre}: ya estaba en el catálogo base`);
    assert.ok(!nombres.has(a.nombre), `${a.nombre}: nombre repetido`);
  }
});

test('cada uno tiene procedencia y composición válidas para el dominio, coherentes cada 100 g', () => {
  for (const a of nuevos.alimentos) {
    const f = d.FuenteExternaDeAlimentoSchema.parse(procedenciaDeAlimento(a, nuevos.fuente).fuenteExterna);
    assert.equal(f.provider, 'USDA_FDC_SR_LEGACY');
    assert.equal(f.externalId, a.fdcId);
    assert.equal(f.usdaReference.publishedOn, '2019-04-01');
    const c = d.ComposicionSchema.parse(composicionDeAlimento(a));
    assert.ok(c.proteinG + c.carbohydrateG + c.fatG <= 100.5, a.nombre);
    const fibra = c.fiberG ?? 0;
    const kcal = 4 * c.proteinG + 4 * (c.carbohydrateG - fibra) + 2 * fibra + 9 * c.fatG;
    assert.ok(Math.abs(kcal - c.energyKcal) <= 0.15 * c.energyKcal, `${a.nombre}: ${c.energyKcal} kcal`);
  }
  // La fuente no informa la fibra del maíz blanco en grano: queda sin ella, sin estimarla.
  assert.equal(nuevos.alimentos.find((a) => a.fdcId === '168920').composicion.fiberG, undefined);
});

test('la migración es la que sale de los datos y solo agrega filas', () => {
  const sql = leer('prisma/migrations/20261126130000_alimentos_del_recetario/migration.sql');
  assert.equal(sql, sqlDelRecetario(nuevos));
  assert.doesNotMatch(sql, /^\s*(UPDATE|DELETE|DROP|TRUNCATE|ALTER)\b/m);
  for (const a of nuevos.alimentos) assert.ok(sql.includes(`'${a.fdcId}'`), a.nombre);
});
